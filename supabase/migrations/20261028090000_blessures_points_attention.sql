-- D-56 (28/10, demande d'Antonino) : la case « Blessures et points d'attention » (ancien libellé
-- « Contraintes physiques ») passe de 300 à 1000 caractères : le coach y note les blessures et ce
-- à quoi faire attention, plus librement. Toujours une donnée de santé : elle reste soumise à
-- l'accord en cours du sportif (contrainte athlete_profiles_health_requires_consent, inchangée).

alter table public.athlete_profiles
  drop constraint athlete_profiles_health_constraints_check,
  add constraint athlete_profiles_health_constraints_check
    check (health_constraints is null or char_length(btrim(health_constraints)) between 1 and 1000);

comment on column public.athlete_profiles.health_constraints is
  'Blessures et points d''attention (donnée de santé, 1000 caractères) : seulement avec un accord en cours du sportif.';

-- Rollback (via une nouvelle migration si nécessaire) : revenir à 300 après avoir raccourci les
-- textes plus longs.
-- alter table public.athlete_profiles drop constraint athlete_profiles_health_constraints_check,
--   add constraint athlete_profiles_health_constraints_check
--   check (health_constraints is null or char_length(btrim(health_constraints)) between 1 and 300);
