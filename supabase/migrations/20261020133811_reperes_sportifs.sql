-- P2-03 : repères datés d'un sportif (allures running, fréquence cardiaque, charges de référence).
-- Sources : docs/03 §2 (repères running, muscu/Hyrox), docs/05 §4 (allures en sec/km, ne jamais remplacer
-- rétroactivement), docs/11 §2 (athlete_reference_metrics).
--
-- Historique IMMUABLE : on n'écrase jamais une valeur, on en ajoute une nouvelle datée. La valeur « actuelle »
-- d'un repère est la plus récente. Une erreur de saisie se corrige en supprimant la ligne, jamais en la modifiant.

create table public.athlete_reference_metrics (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null,
  athlete_id       uuid not null,
  kind             text not null check (kind in (
                     -- allures running (docs/03 §2 : EF, seuil, tempo, 5 km, 10 km, Race Pace…)
                     'pace_easy', 'pace_tempo', 'pace_threshold', 'pace_5k', 'pace_10k',
                     'pace_half', 'pace_marathon', 'pace_race',
                     -- fréquence cardiaque (optionnelle, renseignée par le coach)
                     'hr_max', 'hr_rest',
                     -- charges de référence validées par le coach (muscu / Hyrox)
                     'strength_load'
                   )),
  -- Allure : plage en secondes par km (min = la plus rapide). Une allure seule a min = max.
  pace_min_sec_per_km integer check (pace_min_sec_per_km between 120 and 900),
  pace_max_sec_per_km integer check (pace_max_sec_per_km between 120 and 900),
  -- Fréquence cardiaque en battements par minute.
  bpm              integer check (bpm between 30 and 240),
  -- Charge : exercice (texte libre en attendant le catalogue P3), kg et répétitions.
  exercise_label   text check (exercise_label is null or char_length(trim(exercise_label)) between 1 and 80),
  load_kg          numeric(6, 2) check (load_kg > 0 and load_kg <= 1000),
  reps             integer check (reps between 1 and 100),
  source           text not null check (source in ('test', 'observed', 'coach_estimate')),
  measured_on      date not null check (measured_on >= date '2000-01-01'),
  coach_note       text check (coach_note is null or char_length(coach_note) <= 500),
  created_at       timestamptz not null default now(),
  created_by       uuid references auth.users (id) on delete set null,
  -- Le repère appartient forcément à une fiche de la MÊME organisation.
  foreign key (athlete_id, organization_id)
    references public.athlete_profiles (id, organization_id) on delete cascade,
  -- Cohérence entre le type de repère et les valeurs renseignées.
  check (
    case
      when kind like 'pace\_%' then
        pace_min_sec_per_km is not null and pace_max_sec_per_km is not null
        and pace_min_sec_per_km <= pace_max_sec_per_km
        and bpm is null and load_kg is null and reps is null and exercise_label is null
      when kind like 'hr\_%' then
        bpm is not null
        and pace_min_sec_per_km is null and pace_max_sec_per_km is null
        and load_kg is null and reps is null and exercise_label is null
      when kind = 'strength_load' then
        exercise_label is not null and load_kg is not null
        and pace_min_sec_per_km is null and pace_max_sec_per_km is null and bpm is null
    end
  )
);

comment on table public.athlete_reference_metrics is
  'Repères datés d''un sportif. Historique immuable : nouvelle valeur = nouvelle ligne ; la plus récente fait foi.';

create index athlete_reference_metrics_athlete_idx
  on public.athlete_reference_metrics (organization_id, athlete_id, kind, measured_on desc);

-- ---------------------------------------------------------------------------
-- RLS : coachs de l'organisation uniquement. Le sportif n'y a pas accès pour l'instant (P6).
-- Pas de mise à jour : on supprime une ligne erronée, on ne réécrit jamais l'histoire.
-- ---------------------------------------------------------------------------
alter table public.athlete_reference_metrics enable row level security;

revoke all on public.athlete_reference_metrics from anon, authenticated;
grant select, insert, delete on public.athlete_reference_metrics to authenticated;

create policy "Membres : lecture des repères de leur organisation"
  on public.athlete_reference_metrics for select to authenticated
  using ((select private.is_org_member(organization_id)));

create policy "Membres : ajout de repères dans leur organisation"
  on public.athlete_reference_metrics for insert to authenticated
  with check ((select private.is_org_member(organization_id)) and created_by = (select auth.uid()));

create policy "Membres : suppression d'un repère erroné de leur organisation"
  on public.athlete_reference_metrics for delete to authenticated
  using ((select private.is_org_member(organization_id)));

-- Rollback (via une nouvelle migration si nécessaire) :
-- drop table if exists public.athlete_reference_metrics;
