-- P2-02 (partie 2) : objectifs et compétitions d'un sportif.
-- Sources : OPEN-01 tranché le 20/10/2026 (D-14), docs/03 §2 (plusieurs objectifs simultanés, un principal
-- facultatif), D-18 (la musculation et la remise en forme sont des objectifs à part entière).
--
-- Une compétition est un objectif qui a un nom (et donc forcément une date) ; la catégorie Hyrox n'existe
-- que pour un objectif Hyrox. Un objectif atteint ou abandonné reste visible : c'est l'historique du sportif.

create table public.athlete_goals (
  id                    uuid primary key default gen_random_uuid(),
  organization_id       uuid not null,
  athlete_id            uuid not null,
  goal_type             text not null check (goal_type in (
                          'run_5k', 'run_10k', 'run_half', 'run_marathon', 'run_other',
                          'hyrox', 'strength', 'body_composition', 'fitness', 'personal'
                        )),
  description           text check (description is null or char_length(btrim(description)) between 1 and 500),
  target_date           date check (target_date >= date '2000-01-01'),
  priority              text not null default 'secondary' check (priority in ('main', 'secondary')),
  status                text not null default 'active' check (status in ('active', 'achieved', 'dropped')),
  competition_name      text check (competition_name is null or char_length(btrim(competition_name)) between 1 and 120),
  competition_location  text check (competition_location is null or char_length(btrim(competition_location)) between 1 and 120),
  hyrox_category        text check (hyrox_category in ('open', 'pro', 'doubles', 'relay')),
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  created_by            uuid references auth.users (id) on delete set null,
  -- L'objectif appartient forcément à une fiche de la MÊME organisation.
  foreign key (athlete_id, organization_id)
    references public.athlete_profiles (id, organization_id) on delete cascade,
  -- Une compétition a une date ; un lieu n'a de sens que pour une compétition.
  check (competition_name is null or target_date is not null),
  check (competition_location is null or competition_name is not null),
  -- La catégorie Hyrox (Open, Pro, Doubles, Relay) n'existe que pour un objectif Hyrox.
  check (hyrox_category is null or goal_type = 'hyrox')
);

comment on table public.athlete_goals is
  'Objectifs et compétitions d''un sportif. Un seul objectif principal en cours ; les objectifs clos restent comme historique.';

-- Au plus UN objectif principal en cours par sportif (docs/03 : « un principal facultatif »).
create unique index athlete_goals_one_main_active
  on public.athlete_goals (athlete_id)
  where priority = 'main' and status = 'active';

create index athlete_goals_org_athlete_idx
  on public.athlete_goals (organization_id, athlete_id, status, target_date);

create trigger set_updated_at before update on public.athlete_goals
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS : coachs de l'organisation uniquement. Le sportif n'y a pas accès pour l'instant (P6).
-- Modification limitée à la priorité et au statut (Atteint, Abandonné, Rendre principal) ;
-- pour corriger un objectif mal saisi, on le supprime puis on le recrée.
-- ---------------------------------------------------------------------------
alter table public.athlete_goals enable row level security;

revoke all on public.athlete_goals from anon, authenticated;
grant select, insert, delete on public.athlete_goals to authenticated;
grant update (priority, status) on public.athlete_goals to authenticated;

create policy "Membres : lecture des objectifs de leur organisation"
  on public.athlete_goals for select to authenticated
  using ((select private.is_org_member(organization_id)));

create policy "Membres : ajout d'objectifs dans leur organisation"
  on public.athlete_goals for insert to authenticated
  with check ((select private.is_org_member(organization_id)) and created_by = (select auth.uid()));

create policy "Membres : mise à jour des objectifs de leur organisation"
  on public.athlete_goals for update to authenticated
  using ((select private.is_org_member(organization_id)))
  with check ((select private.is_org_member(organization_id)));

create policy "Membres : suppression d'un objectif de leur organisation"
  on public.athlete_goals for delete to authenticated
  using ((select private.is_org_member(organization_id)));

-- Rollback (via une nouvelle migration si nécessaire) :
-- drop table if exists public.athlete_goals;
