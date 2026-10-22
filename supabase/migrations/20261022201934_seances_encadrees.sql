-- P2-05b : séances encadrées du coach, en présentiel (D-27).
-- Collective : récurrente ou non, avec une liste d'inscrits (ex. « chaque mercredi 19 h, piste »).
-- Individuelle : avec UN sportif, récurrente ou non (ex. coaching force chaque mardi).
-- Les dates d'une séance récurrente sont CALCULÉES (chaque semaine depuis starts_on, jusqu'à ends_on) :
-- aucune occurrence n'est stockée. Présence réelle et annulation d'une seule date : plus tard.
-- Heure locale (Bruxelles) : un agenda de salle se lit à l'heure du lieu, pas en UTC.

create table public.coach_sessions (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references public.organizations (id) on delete cascade,
  kind              text not null check (kind in ('group', 'individual')),
  title             text not null check (char_length(btrim(title)) between 1 and 120),
  -- Même liste que les objectifs (couleur de discipline) ; facultative.
  discipline        text check (discipline in ('running', 'strength', 'hyrox', 'hybrid')),
  location          text check (location is null or char_length(btrim(location)) between 1 and 120),
  -- Séance individuelle : son sportif (même organisation). Collective : les inscrits sont à part.
  athlete_id        uuid,
  starts_on         date not null check (starts_on >= date '2000-01-01'),
  start_time        time not null,
  duration_minutes  integer not null check (duration_minutes between 15 and 480),
  repeats_weekly    boolean not null default false,
  ends_on           date,
  notes             text check (notes is null or char_length(notes) <= 500),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  created_by        uuid references auth.users (id) on delete set null,
  unique (id, organization_id),
  foreign key (athlete_id, organization_id)
    references public.athlete_profiles (id, organization_id) on delete cascade,
  check ((kind = 'individual') = (athlete_id is not null)),
  -- Une date de fin n'a de sens que pour une séance qui se répète, et jamais avant le début.
  check (ends_on is null or (repeats_weekly and ends_on >= starts_on))
);

comment on table public.coach_sessions is
  'Séances encadrées en présentiel (collectives ou individuelles). Les dates récurrentes sont calculées, pas stockées.';

create index coach_sessions_org_idx on public.coach_sessions (organization_id, starts_on);

create trigger set_updated_at before update on public.coach_sessions
  for each row execute function public.set_updated_at();

-- Inscrits d'une séance collective. La séance et le sportif appartiennent à la MÊME organisation.
create table public.coach_session_athletes (
  session_id       uuid not null,
  organization_id  uuid not null,
  athlete_id       uuid not null,
  created_at       timestamptz not null default now(),
  created_by       uuid references auth.users (id) on delete set null,
  primary key (session_id, athlete_id),
  foreign key (session_id, organization_id)
    references public.coach_sessions (id, organization_id) on delete cascade,
  foreign key (athlete_id, organization_id)
    references public.athlete_profiles (id, organization_id) on delete cascade
);

create index coach_session_athletes_athlete_idx
  on public.coach_session_athletes (organization_id, athlete_id);

-- ---------------------------------------------------------------------------
-- RLS : coachs de l'organisation uniquement (le sportif verra ses séances avec son espace, P6).
-- ---------------------------------------------------------------------------
alter table public.coach_sessions enable row level security;
alter table public.coach_session_athletes enable row level security;

revoke all on public.coach_sessions from anon, authenticated;
revoke all on public.coach_session_athletes from anon, authenticated;
grant select, insert, delete on public.coach_sessions to authenticated;
-- Le type et le sportif d'une séance individuelle ne changent pas : on supprime et on recrée.
grant update (title, discipline, location, starts_on, start_time, duration_minutes, repeats_weekly, ends_on, notes)
  on public.coach_sessions to authenticated;
grant select, insert, delete on public.coach_session_athletes to authenticated;

create policy "Membres : lecture des séances de leur organisation"
  on public.coach_sessions for select to authenticated
  using ((select private.is_org_member(organization_id)));

create policy "Membres : ajout de séances dans leur organisation"
  on public.coach_sessions for insert to authenticated
  with check ((select private.is_org_member(organization_id)) and created_by = (select auth.uid()));

create policy "Membres : mise à jour des séances de leur organisation"
  on public.coach_sessions for update to authenticated
  using ((select private.is_org_member(organization_id)))
  with check ((select private.is_org_member(organization_id)));

create policy "Membres : suppression des séances de leur organisation"
  on public.coach_sessions for delete to authenticated
  using ((select private.is_org_member(organization_id)));

create policy "Membres : lecture des inscrits de leur organisation"
  on public.coach_session_athletes for select to authenticated
  using ((select private.is_org_member(organization_id)));

create policy "Membres : inscription dans leur organisation"
  on public.coach_session_athletes for insert to authenticated
  with check ((select private.is_org_member(organization_id)) and created_by = (select auth.uid()));

create policy "Membres : désinscription dans leur organisation"
  on public.coach_session_athletes for delete to authenticated
  using ((select private.is_org_member(organization_id)));

-- Rollback (via une nouvelle migration si nécessaire) :
-- drop table if exists public.coach_session_athletes;
-- drop table if exists public.coach_sessions;
