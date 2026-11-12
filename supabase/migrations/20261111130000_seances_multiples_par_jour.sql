-- D-164 (11/11/2026, demande d'Antonino) : plusieurs séances le même jour (jusqu'à 4, chacune avec son
-- moment : matin, midi, après-midi, soir) et jusqu'à 14 séances par semaine (« 8+ » dans l'assistant).
-- Le moment vit dans le contenu de la séance (JSON du brouillon et de la version publiée, validé par
-- Zod) ; ici, un modèle de programme peut annoncer jusqu'à 14 séances par semaine, comme la fiche
-- d'un sportif (athlete_profiles.sessions_per_week, déjà entre 1 et 14).

alter table public.program_templates
  drop constraint program_templates_sessions_per_week_check,
  add constraint program_templates_sessions_per_week_check
    check (sessions_per_week between 1 and 14);

-- Retour arrière (seulement si aucun modèle n'a plus de 7 séances par semaine) :
-- alter table public.program_templates
--   drop constraint program_templates_sessions_per_week_check,
--   add constraint program_templates_sessions_per_week_check check (sessions_per_week between 1 and 7);
