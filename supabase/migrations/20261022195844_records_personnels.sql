-- P2-02 partie 4 : records personnels d'un sportif (OPEN-01 : 5 km, 10 km, semi, marathon, Hyrox).
-- Choix d'Antonino (22/10/2026) : on garde CHAQUE performance datée ; le record d'une épreuve est le
-- meilleur temps, calculé à la lecture. Liste d'épreuves fermée ; Hyrox toujours avec sa catégorie
-- (un temps en Pro ne se compare pas à un temps en Open).
--
-- Historique IMMUABLE, comme les repères : une erreur se corrige en supprimant la ligne.

create table public.athlete_personal_records (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null,
  athlete_id       uuid not null,
  event            text not null check (event in ('run_5k', 'run_10k', 'run_half', 'run_marathon', 'hyrox')),
  -- Catégorie Hyrox (mêmes valeurs que les objectifs) : obligatoire pour Hyrox, absente sinon.
  hyrox_category   text check (hyrox_category in ('open', 'pro', 'doubles', 'relay')),
  -- Temps final en secondes (5 min à 10 h : bornes larges, la vraisemblance par épreuve est dans Zod).
  time_seconds     integer not null check (time_seconds between 300 and 36000),
  achieved_on      date not null check (achieved_on >= date '2000-01-01'),
  race_name        text check (race_name is null or char_length(trim(race_name)) between 1 and 120),
  created_at       timestamptz not null default now(),
  created_by       uuid references auth.users (id) on delete set null,
  -- La performance appartient forcément à une fiche de la MÊME organisation.
  foreign key (athlete_id, organization_id)
    references public.athlete_profiles (id, organization_id) on delete cascade,
  check ((event = 'hyrox') = (hyrox_category is not null))
);

comment on table public.athlete_personal_records is
  'Performances datées d''un sportif sur des épreuves de référence. Le record = le meilleur temps par épreuve (et catégorie Hyrox).';

create index athlete_personal_records_athlete_idx
  on public.athlete_personal_records (organization_id, athlete_id, event, time_seconds);

-- ---------------------------------------------------------------------------
-- RLS : coachs de l'organisation uniquement (le sportif y aura accès avec son espace, P6).
-- Pas de mise à jour : on supprime une ligne erronée, on ne réécrit jamais l'histoire.
-- ---------------------------------------------------------------------------
alter table public.athlete_personal_records enable row level security;

revoke all on public.athlete_personal_records from anon, authenticated;
grant select, insert, delete on public.athlete_personal_records to authenticated;

create policy "Membres : lecture des records de leur organisation"
  on public.athlete_personal_records for select to authenticated
  using ((select private.is_org_member(organization_id)));

create policy "Membres : ajout de records dans leur organisation"
  on public.athlete_personal_records for insert to authenticated
  with check ((select private.is_org_member(organization_id)) and created_by = (select auth.uid()));

create policy "Membres : suppression d'une performance erronée de leur organisation"
  on public.athlete_personal_records for delete to authenticated
  using ((select private.is_org_member(organization_id)));

-- Rollback (via une nouvelle migration si nécessaire) :
-- drop table if exists public.athlete_personal_records;
