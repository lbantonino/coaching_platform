-- Temps visé d'un objectif (prompt Claude Design §7.2, onglet Objectifs ; demande d'Antonino, 26/10/2026) :
-- ex. « Hyrox Bruxelles en 1:15:00 », « semi-marathon en 1:42:00 ». En secondes, facultatif ;
-- entre 1 minute et 24 heures pour repérer tout de suite une faute de frappe.
alter table public.athlete_goals
  add column target_time_seconds integer check (target_time_seconds between 60 and 86400);

comment on column public.athlete_goals.target_time_seconds is
  'Temps visé en secondes (facultatif), ex. 4500 pour 1:15:00.';

-- L'ajout passe par le droit d'insertion de la table ; la correction suit les autres champs de saisie.
grant update (target_time_seconds) on public.athlete_goals to authenticated;

-- Rollback (via une nouvelle migration si nécessaire) : alter table public.athlete_goals drop column target_time_seconds;
