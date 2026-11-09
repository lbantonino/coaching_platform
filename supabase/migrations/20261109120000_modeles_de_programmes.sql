-- Modèles de programmes et de séances (D-154 et D-155, 09/11/2026). Deux sources :
--   - « Mes modèles » : enregistrés par un coach, dans son organisation ;
--   - « Modèles Coory » : fournis par l'application, sans organisation (organization_id vide), en
--     lecture seule pour tous. Leur CONTENU s'écrit avec Gianluca et doit être validé par lui : il
--     n'entre donc jamais par une migration (ceux de démonstration sont seulement dans seed.sql).
-- Utiliser un modèle COPIE son contenu dans le brouillon d'un programme : modifier la copie ne change
-- jamais le modèle (BR-10). Le contenu est un document JSON validé par l'application (Zod), comme le
-- brouillon d'un programme (docs/11 §2) ; block_templates et week_templates ne sont pas créés : aucun
-- écran ne s'en sert.

create table public.program_templates (
  id                 uuid primary key default gen_random_uuid(),
  -- Vide = modèle Coory ; sinon, modèle de cette organisation.
  organization_id    uuid references public.organizations (id) on delete cascade,
  origin             text not null check (origin in ('coory', 'coach')),
  title              text not null check (char_length(btrim(title)) between 1 and 120),
  discipline         text not null check (discipline in ('running', 'strength', 'hyrox', 'hybrid')),
  -- Un modèle n'a ni sportif ni dates : « Semaine 1 à N » (BR-11).
  weeks_count        integer not null check (weeks_count between 1 and 52),
  sessions_per_week  integer not null check (sessions_per_week between 1 and 7),
  -- +1 à chaque modification (déclencheur ci-dessous) : une copie garde la version d'origine.
  version            integer not null default 1 check (version >= 1),
  schema_version     integer not null default 2 check (schema_version >= 2),
  content_json       jsonb not null check (
                       jsonb_typeof(content_json) = 'object' and octet_length(content_json::text) <= 1000000
                     ),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  created_by         uuid references auth.users (id) on delete set null,
  -- Suppression douce (docs/11 §6) : un modèle archivé n'est plus proposé.
  archived_at        timestamptz,
  check ((organization_id is null) = (origin = 'coory'))
);

create table public.session_templates (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid references public.organizations (id) on delete cascade,
  origin           text not null check (origin in ('coory', 'coach')),
  title            text not null check (char_length(btrim(title)) between 1 and 120),
  discipline       text not null check (discipline in ('running', 'strength', 'hyrox', 'hybrid')),
  -- Nature de la séance : « Sortie longue », « Circuit », « Force »…
  session_type     text not null check (char_length(btrim(session_type)) between 1 and 40),
  version          integer not null default 1 check (version >= 1),
  schema_version   integer not null default 2 check (schema_version >= 2),
  content_json     jsonb not null check (
                     jsonb_typeof(content_json) = 'object' and octet_length(content_json::text) <= 200000
                   ),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  created_by       uuid references auth.users (id) on delete set null,
  archived_at      timestamptz,
  check ((organization_id is null) = (origin = 'coory'))
);

comment on table public.program_templates is
  'Modèles de programmes : Coory (organization_id vide, lecture seule) ou Mes modèles (une organisation).';
comment on table public.session_templates is
  'Modèles de séances : Coory (organization_id vide, lecture seule) ou Mes modèles (une organisation).';

create index program_templates_org_idx on public.program_templates (organization_id) where archived_at is null;
create index session_templates_org_idx on public.session_templates (organization_id) where archived_at is null;

create trigger set_updated_at before update on public.program_templates
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.session_templates
  for each row execute function public.set_updated_at();

-- La version monte d'elle-même quand le contenu ou le titre change : le navigateur ne la choisit pas.
-- L'application l'utilise pour refuser d'écraser une modification faite ailleurs (.eq('version', n)).
create function private.bump_template_version()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.content_json is distinct from old.content_json or new.title is distinct from old.title then
    new.version := old.version + 1;
  else
    new.version := old.version;
  end if;
  return new;
end;
$$;

create trigger bump_version before update on public.program_templates
  for each row execute function private.bump_template_version();
create trigger bump_version before update on public.session_templates
  for each row execute function private.bump_template_version();

-- ---------------------------------------------------------------------------
-- RLS : les modèles Coory se lisent par tout utilisateur connecté (comme le catalogue d'exercices) ;
-- Mes modèles, par les membres de l'organisation, qui seuls les créent et les modifient. Aucune
-- écriture possible sur un modèle Coory depuis le navigateur. Pas de suppression : on archive.
-- ---------------------------------------------------------------------------
alter table public.program_templates enable row level security;
alter table public.session_templates enable row level security;

revoke all on public.program_templates from anon, authenticated;
revoke all on public.session_templates from anon, authenticated;

grant select on public.program_templates to authenticated;
grant insert (organization_id, origin, title, discipline, weeks_count, sessions_per_week, content_json, created_by)
  on public.program_templates to authenticated;
grant update (title, discipline, weeks_count, sessions_per_week, content_json, archived_at)
  on public.program_templates to authenticated;

grant select on public.session_templates to authenticated;
grant insert (organization_id, origin, title, discipline, session_type, content_json, created_by)
  on public.session_templates to authenticated;
grant update (title, discipline, session_type, content_json, archived_at)
  on public.session_templates to authenticated;

create policy "Modèles Coory et modèles de son organisation : lecture"
  on public.program_templates for select to authenticated
  using (organization_id is null or (select private.is_org_member(organization_id)));
create policy "Membres : ajout d'un modèle de programme de leur organisation"
  on public.program_templates for insert to authenticated
  with check (
    organization_id is not null and origin = 'coach'
    and (select private.is_org_member(organization_id)) and created_by = (select auth.uid())
  );
create policy "Membres : modification d'un modèle de programme de leur organisation"
  on public.program_templates for update to authenticated
  using (organization_id is not null and (select private.is_org_member(organization_id)))
  with check (organization_id is not null and (select private.is_org_member(organization_id)));

create policy "Modèles Coory et modèles de son organisation : lecture"
  on public.session_templates for select to authenticated
  using (organization_id is null or (select private.is_org_member(organization_id)));
create policy "Membres : ajout d'un modèle de séance de leur organisation"
  on public.session_templates for insert to authenticated
  with check (
    organization_id is not null and origin = 'coach'
    and (select private.is_org_member(organization_id)) and created_by = (select auth.uid())
  );
create policy "Membres : modification d'un modèle de séance de leur organisation"
  on public.session_templates for update to authenticated
  using (organization_id is not null and (select private.is_org_member(organization_id)))
  with check (organization_id is not null and (select private.is_org_member(organization_id)));

-- Retour arrière (via une nouvelle migration si nécessaire), après 20261109120100 :
-- drop table public.session_templates; drop table public.program_templates;
-- drop function private.bump_template_version();
