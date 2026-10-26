-- Programmes, tranche 1 (D-46, 26/10/2026) : l'AFFICHAGE du programme d'un sportif, semaine par semaine.
-- Modèle de docs/11 : un programme métier (programs), des versions publiées FIGÉES (program_publications)
-- et une ligne par séance publiée (publication_sessions), que les retours du sportif référenceront
-- (tranche 3). Le brouillon et l'éditeur (program_drafts, publication) viennent en tranche 2.
--
-- Règle d'Antonino : une séance de programme n'a PAS de jour. Elle a un numéro de semaine et un numéro
-- de séance (« Semaine 1 · Séance 3 ») ; le sportif la fait quand il veut dans la semaine.
-- planned_date reste donc vide (prévue par docs/11, elle servira si un coach veut imposer un jour).

create table public.programs (
  id                     uuid primary key default gen_random_uuid(),
  organization_id        uuid not null references public.organizations (id) on delete cascade,
  athlete_id             uuid not null,
  title                  text not null check (char_length(btrim(title)) between 1 and 120),
  goal                   text check (goal is null or char_length(btrim(goal)) between 1 and 200),
  -- Lundi de la première semaine : les semaines se lisent « du lundi au dimanche ».
  start_date             date not null check (extract(isodow from start_date) = 1),
  weeks_count            integer not null check (weeks_count between 1 and 52),
  status                 text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  active_publication_id  uuid,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  created_by             uuid references auth.users (id) on delete set null,
  unique (id, organization_id),
  foreign key (athlete_id, organization_id)
    references public.athlete_profiles (id, organization_id) on delete cascade
);

comment on table public.programs is
  'Programme d''un sportif. Ce que le sportif voit vient de la publication active, jamais du brouillon.';

-- Un seul programme publié à la fois par sportif.
create unique index programs_one_published_idx on public.programs (athlete_id) where status = 'published';
create index programs_org_athlete_idx on public.programs (organization_id, athlete_id);

create trigger set_updated_at before update on public.programs
  for each row execute function public.set_updated_at();

-- Version publiée : une photo complète et immuable du programme (titre, semaines, phases).
create table public.program_publications (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null,
  program_id       uuid not null,
  number           integer not null check (number >= 1),
  schema_version   integer not null default 1,
  snapshot_json    jsonb not null check (jsonb_typeof(snapshot_json) = 'object'),
  published_at     timestamptz not null default now(),
  published_by     uuid references auth.users (id) on delete set null,
  unique (id, organization_id),
  unique (program_id, number),
  foreign key (program_id, organization_id)
    references public.programs (id, organization_id) on delete cascade
);

alter table public.programs
  add constraint programs_active_publication_fkey
  foreign key (active_publication_id, organization_id)
  references public.program_publications (id, organization_id) on delete set null (active_publication_id)
  deferrable initially deferred;

-- Une séance d'une publication : semaine n, séance n, son contenu structuré (titre, discipline, durée,
-- type, objectif, étapes, conseils), validé par l'application à la lecture.
create table public.publication_sessions (
  id                  uuid primary key default gen_random_uuid(),
  organization_id     uuid not null,
  publication_id      uuid not null,
  source_session_key  text not null check (char_length(source_session_key) between 1 and 80),
  week_index          integer not null check (week_index between 1 and 52),
  slot_index          integer not null check (slot_index between 1 and 14),
  planned_date        date,
  session_json        jsonb not null check (jsonb_typeof(session_json) = 'object'),
  unique (id, organization_id),
  unique (publication_id, week_index, slot_index),
  foreign key (publication_id, organization_id)
    references public.program_publications (id, organization_id) on delete cascade
);

create index publication_sessions_week_idx
  on public.publication_sessions (publication_id, week_index, slot_index);

-- ---------------------------------------------------------------------------
-- RLS : lecture par les coachs de l'organisation. Aucune écriture depuis le navigateur pour l'instant :
-- la publication (tranche 2) passera par une fonction contrôlée. Une publication ne se modifie jamais.
-- Le sportif lira SA publication active avec son espace (tranche 3).
-- ---------------------------------------------------------------------------
alter table public.programs enable row level security;
alter table public.program_publications enable row level security;
alter table public.publication_sessions enable row level security;

revoke all on public.programs from anon, authenticated;
revoke all on public.program_publications from anon, authenticated;
revoke all on public.publication_sessions from anon, authenticated;
grant select on public.programs to authenticated;
grant select on public.program_publications to authenticated;
grant select on public.publication_sessions to authenticated;

create policy "Membres : lecture des programmes de leur organisation"
  on public.programs for select to authenticated
  using ((select private.is_org_member(organization_id)));

create policy "Membres : lecture des publications de leur organisation"
  on public.program_publications for select to authenticated
  using ((select private.is_org_member(organization_id)));

create policy "Membres : lecture des séances publiées de leur organisation"
  on public.publication_sessions for select to authenticated
  using ((select private.is_org_member(organization_id)));

-- Rollback (via une nouvelle migration si nécessaire) :
-- drop table public.publication_sessions; drop table public.program_publications; drop table public.programs;
