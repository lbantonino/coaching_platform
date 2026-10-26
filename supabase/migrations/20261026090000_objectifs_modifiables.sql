-- Objectifs modifiables (demande d'Antonino, 26/10/2026) : corriger la date, le nom ou la catégorie d'un
-- objectif en cours sans devoir le supprimer puis le recréer. Les règles restent celles de la table
-- (contraintes CHECK : une compétition a une date, la catégorie seulement pour un Hyrox…) et la politique
-- de mise à jour existante (membres de l'organisation). Seuls les champs de saisie deviennent modifiables :
-- organisation, sportif, auteur et dates de création restent figés.
grant update (goal_type, description, target_date, competition_name, competition_location, hyrox_category)
  on public.athlete_goals to authenticated;

-- Rollback (via une nouvelle migration si nécessaire) :
-- revoke update (goal_type, description, target_date, competition_name, competition_location, hyrox_category)
--   on public.athlete_goals from authenticated;
