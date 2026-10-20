-- P2-03 (suite) : repère « VMA » (vitesse maximale aérobie), issu d'un test de Cooper ou de 5 km (OPEN-13 tranché).
-- Stockée comme les autres allures, en secondes par km (allure à VMA) ; affichée en km/h par l'application.
-- On remplace la contrainte de liste des types (une contrainte CHECK ne se modifie pas : on la recrée).

alter table public.athlete_reference_metrics drop constraint athlete_reference_metrics_kind_check;

alter table public.athlete_reference_metrics add constraint athlete_reference_metrics_kind_check check (kind in (
  'pace_vma',
  'pace_easy', 'pace_tempo', 'pace_threshold', 'pace_5k', 'pace_10k',
  'pace_half', 'pace_marathon', 'pace_race',
  'hr_max', 'hr_rest',
  'strength_load'
));

-- Rollback (via une nouvelle migration, après suppression des lignes 'pace_vma') :
-- alter table public.athlete_reference_metrics drop constraint athlete_reference_metrics_kind_check;
-- puis recréer la contrainte sans 'pace_vma' (voir 20261020133811_reperes_sportifs.sql).
