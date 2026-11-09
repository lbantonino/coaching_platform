-- Programmes, tranche 2 (D-155, 09/11/2026) : l'ÉCRITURE des programmes (éditeur, publication).
-- Modèle de docs/11 : un programme (programs), UN brouillon structuré (program_drafts, document JSON
-- validé par Zod, avec un numéro de révision) et des versions publiées FIGÉES (program_publications et
-- publication_sessions, créées en tranche 1).
--
-- Écriture : uniquement par quatre fonctions (créer, enregistrer, publier, archiver). Aucune écriture
-- directe depuis le navigateur sur ces tables : une version publiée ne peut ni se modifier, ni se
-- fabriquer à la main. Chaque fonction revérifie l'appartenance à l'organisation ; l'action serveur
-- valide le brouillon avec Zod avant l'appel (CLAUDE.md).
--
-- Codes d'erreur propres (lus par src/features/programs/actions.ts) :
--   CY409 = le brouillon a été modifié ailleurs (révision périmée) ;
--   CY410 = programme archivé ;
--   23P01 = chevauchement avec un autre programme publié du même sportif (C-8) ;
--   P0002 = programme introuvable (ou d'une autre organisation : on ne le dit pas) ;
--   42501 = accès refusé.

create extension if not exists btree_gist with schema extensions;

-- ---------------------------------------------------------------------------
-- programs : discipline principale (filtres de la page Programmes) et modèle d'origine.
-- Pour un programme publié, title, discipline, start_date et weeks_count sont ceux de la VERSION
-- PUBLIÉE (ce que voit le sportif) ; pour un brouillon jamais publié, ceux du brouillon.
-- ---------------------------------------------------------------------------
alter table public.programs
  add column discipline text check (discipline in ('running', 'strength', 'hyrox', 'hybrid')),
  add column source_template_id uuid references public.program_templates (id) on delete set null,
  add column source_template_version integer check (source_template_version >= 1);

comment on column public.programs.source_template_id is
  'Modèle copié à la création (BR-10 : la copie ne modifie jamais le modèle), avec sa version.';

-- C-8 (décision du 09/11/2026) : plusieurs programmes publiés pour un sportif (un « En cours » et un
-- « À venir »), mais jamais deux dont les périodes se chevauchent. Remplace l'index « un seul
-- programme publié par sportif » de la tranche 1. La période va du lundi de début au dimanche de la
-- dernière semaine (borne de fin exclue : lundi suivant).
drop index public.programs_one_published_idx;
alter table public.programs add constraint programs_no_overlap
  exclude using gist (
    athlete_id extensions.gist_uuid_ops with =,
    daterange(start_date, start_date + weeks_count * 7) with &&
  )
  where (status = 'published');

-- ---------------------------------------------------------------------------
-- Brouillon : un par programme, réécrit en entier à chaque enregistrement automatique. Le numéro de
-- révision empêche d'écraser une modification faite ailleurs (docs/11 : REVISION_CONFLICT).
-- ---------------------------------------------------------------------------
create table public.program_drafts (
  program_id       uuid primary key,
  organization_id  uuid not null,
  revision         integer not null default 1 check (revision >= 1),
  schema_version   integer not null default 2 check (schema_version >= 2),
  draft_json       jsonb not null check (
                     jsonb_typeof(draft_json) = 'object' and octet_length(draft_json::text) <= 1000000
                   ),
  updated_at       timestamptz not null default now(),
  updated_by       uuid references auth.users (id) on delete set null,
  foreign key (program_id, organization_id)
    references public.programs (id, organization_id) on delete cascade
);

comment on table public.program_drafts is
  'Brouillon de l''éditeur. Le sportif ne le voit jamais : il lit la publication active.';

-- La révision du brouillon qui a été publiée : sert à « Modifications non publiées » (révision du
-- brouillon plus récente) et à rendre la publication idempotente (un double clic = une seule version).
alter table public.program_publications
  add column source_revision integer check (source_revision >= 1);

-- Heure facultative d'une séance à jour fixe (03b). planned_date existe depuis la tranche 1.
alter table public.publication_sessions
  add column planned_time time;

alter table public.program_drafts enable row level security;
revoke all on public.program_drafts from anon, authenticated;
grant select on public.program_drafts to authenticated;

create policy "Membres : lecture des brouillons de leur organisation"
  on public.program_drafts for select to authenticated
  using ((select private.is_org_member(organization_id)));

-- ---------------------------------------------------------------------------
-- Créer un programme et son brouillon (révision 1), dans une seule transaction.
-- Le sportif appartient forcément à l'organisation (clé étrangère composée de programs) ; un modèle
-- d'origine doit être un modèle Coory ou un modèle de cette organisation.
-- ---------------------------------------------------------------------------
create function public.create_program(
  p_organization_id         uuid,
  p_athlete_id              uuid,
  p_title                   text,
  p_discipline              text,
  p_start_date              date,
  p_weeks_count             integer,
  p_draft                   jsonb,
  p_source_template_id      uuid default null,
  p_source_template_version integer default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_program_id uuid;
begin
  if (select auth.uid()) is null or not private.is_org_member(p_organization_id) then
    raise exception 'Accès refusé.' using errcode = '42501';
  end if;
  if p_source_template_id is not null and not exists (
    select 1 from public.program_templates t
    where t.id = p_source_template_id
      and (t.organization_id is null or t.organization_id = p_organization_id)
  ) then
    raise exception 'Modèle introuvable.' using errcode = 'P0002';
  end if;

  insert into public.programs (
    organization_id, athlete_id, title, discipline, start_date, weeks_count, status, created_by,
    source_template_id, source_template_version
  )
  values (
    p_organization_id, p_athlete_id, p_title, p_discipline, p_start_date, p_weeks_count, 'draft',
    (select auth.uid()), p_source_template_id, p_source_template_version
  )
  returning id into v_program_id;

  insert into public.program_drafts (program_id, organization_id, revision, draft_json, updated_by)
  values (v_program_id, p_organization_id, 1, p_draft, (select auth.uid()));

  return v_program_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- Enregistrer le brouillon. p_expected_revision = 0 : créer le brouillon d'un programme qui n'en a
-- pas encore (programme publié avant l'éditeur, converti depuis sa publication). Renvoie la nouvelle
-- révision. Un programme jamais publié reprend le titre, la discipline et les dates du brouillon.
-- ---------------------------------------------------------------------------
create function public.save_program_draft(
  p_program_id         uuid,
  p_expected_revision  integer,
  p_title              text,
  p_discipline         text,
  p_start_date         date,
  p_weeks_count        integer,
  p_draft              jsonb
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_org        uuid;
  v_status     text;
  v_active     uuid;
  v_revision   integer;
begin
  select organization_id, status, active_publication_id into v_org, v_status, v_active
  from public.programs where id = p_program_id
  for update;
  if v_org is null or (select auth.uid()) is null or not private.is_org_member(v_org) then
    raise exception 'Programme introuvable.' using errcode = 'P0002';
  end if;
  if v_status = 'archived' then
    raise exception 'Programme archivé.' using errcode = 'CY410';
  end if;

  if p_expected_revision = 0 then
    insert into public.program_drafts (program_id, organization_id, revision, draft_json, updated_by)
    values (p_program_id, v_org, 1, p_draft, (select auth.uid()))
    on conflict (program_id) do nothing
    returning revision into v_revision;
  else
    update public.program_drafts
    set draft_json = p_draft, revision = revision + 1, updated_at = now(), updated_by = (select auth.uid())
    where program_id = p_program_id and revision = p_expected_revision
    returning revision into v_revision;
  end if;
  if v_revision is null then
    raise exception 'Le brouillon a été modifié ailleurs.' using errcode = 'CY409';
  end if;

  if v_active is null then
    update public.programs
    set title = p_title, discipline = p_discipline, start_date = p_start_date, weeks_count = p_weeks_count
    where id = p_program_id;
  end if;

  return v_revision;
end;
$$;

-- ---------------------------------------------------------------------------
-- Publier : une nouvelle version figée (n + 1) et ses séances, rendue active, en une transaction
-- (docs/11 §6, DB-03). Le serveur fournit la photo de la version et les séances, construites depuis
-- le brouillon de la révision attendue. Idempotent : si cette révision est déjà la version active, on
-- renvoie son numéro sans rien créer. Renvoie le numéro de version.
-- p_sessions : [{ key, weekIndex, slotIndex, plannedDate?, plannedTime?, content }].
-- ---------------------------------------------------------------------------
create function public.publish_program(
  p_program_id         uuid,
  p_expected_revision  integer,
  p_title              text,
  p_discipline         text,
  p_start_date         date,
  p_weeks_count        integer,
  p_snapshot           jsonb,
  p_sessions           jsonb
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_org          uuid;
  v_status       text;
  v_active       uuid;
  v_revision     integer;
  v_number       integer;
  v_publication  uuid;
begin
  select organization_id, status, active_publication_id into v_org, v_status, v_active
  from public.programs where id = p_program_id
  for update;
  if v_org is null or (select auth.uid()) is null or not private.is_org_member(v_org) then
    raise exception 'Programme introuvable.' using errcode = 'P0002';
  end if;
  if v_status = 'archived' then
    raise exception 'Programme archivé.' using errcode = 'CY410';
  end if;
  if jsonb_typeof(p_sessions) is distinct from 'array' then
    raise exception 'Séances invalides.' using errcode = '22023';
  end if;

  select revision into v_revision from public.program_drafts where program_id = p_program_id;
  if v_revision is null or v_revision <> p_expected_revision then
    raise exception 'Le brouillon a été modifié ailleurs.' using errcode = 'CY409';
  end if;

  select number into v_number from public.program_publications
  where id = v_active and source_revision = v_revision;
  if v_number is not null then
    return v_number;
  end if;

  select coalesce(max(number), 0) + 1 into v_number
  from public.program_publications where program_id = p_program_id;

  insert into public.program_publications (
    organization_id, program_id, number, schema_version, snapshot_json, published_by, source_revision
  )
  values (v_org, p_program_id, v_number, 2, p_snapshot, (select auth.uid()), v_revision)
  returning id into v_publication;

  insert into public.publication_sessions (
    organization_id, publication_id, source_session_key, week_index, slot_index,
    planned_date, planned_time, session_json
  )
  select v_org, v_publication, s ->> 'key', (s ->> 'weekIndex')::integer, (s ->> 'slotIndex')::integer,
         (s ->> 'plannedDate')::date, (s ->> 'plannedTime')::time, s -> 'content'
  from jsonb_array_elements(p_sessions) as s;

  -- La contrainte programs_no_overlap refuse ici un chevauchement (23P01) : toute la publication
  -- est alors annulée, rien ne reste à moitié écrit.
  update public.programs
  set status = 'published', active_publication_id = v_publication, title = p_title,
      discipline = p_discipline, start_date = p_start_date, weeks_count = p_weeks_count
  where id = p_program_id;

  return v_number;
end;
$$;

-- ---------------------------------------------------------------------------
-- Archiver : le programme sort des listes actives et de la vue du sportif ; ses versions restent.
-- ---------------------------------------------------------------------------
create function public.archive_program(p_program_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_org uuid;
begin
  select organization_id into v_org from public.programs where id = p_program_id for update;
  if v_org is null or (select auth.uid()) is null or not private.is_org_member(v_org) then
    raise exception 'Programme introuvable.' using errcode = 'P0002';
  end if;
  update public.programs set status = 'archived' where id = p_program_id;
end;
$$;

revoke all on function public.create_program(uuid, uuid, text, text, date, integer, jsonb, uuid, integer)
  from public, anon;
revoke all on function public.save_program_draft(uuid, integer, text, text, date, integer, jsonb)
  from public, anon;
revoke all on function public.publish_program(uuid, integer, text, text, date, integer, jsonb, jsonb)
  from public, anon;
revoke all on function public.archive_program(uuid) from public, anon;
grant execute on function public.create_program(uuid, uuid, text, text, date, integer, jsonb, uuid, integer)
  to authenticated;
grant execute on function public.save_program_draft(uuid, integer, text, text, date, integer, jsonb)
  to authenticated;
grant execute on function public.publish_program(uuid, integer, text, text, date, integer, jsonb, jsonb)
  to authenticated;
grant execute on function public.archive_program(uuid) to authenticated;

-- Retour arrière (via une nouvelle migration si nécessaire) :
-- drop function public.archive_program(uuid);
-- drop function public.publish_program(uuid, integer, text, text, date, integer, jsonb, jsonb);
-- drop function public.save_program_draft(uuid, integer, text, text, date, integer, jsonb);
-- drop function public.create_program(uuid, uuid, text, text, date, integer, jsonb, uuid, integer);
-- drop table public.program_drafts;
-- alter table public.publication_sessions drop column planned_time;
-- alter table public.program_publications drop column source_revision;
-- ramener à un seul programme publié par sportif, puis :
-- alter table public.programs drop constraint programs_no_overlap;
-- create unique index programs_one_published_idx on public.programs (athlete_id) where status = 'published';
-- alter table public.programs drop column source_template_version, drop column source_template_id,
--   drop column discipline;
