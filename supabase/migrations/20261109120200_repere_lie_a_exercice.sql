-- Charge de référence reliée à un exercice de la Bibliothèque (C-11, décision du 09/11/2026).
-- L'éditeur de musculation calcule les kg d'une série écrite en « % du max » depuis le max du sportif
-- POUR CET EXERCICE (BR-14). Le libellé libre existant reste : rien n'est perdu, et un repère sans lien
-- laisse le % seul, avec un avertissement.

alter table public.athlete_reference_metrics
  add column exercise_id uuid references public.exercises (id) on delete set null,
  add constraint athlete_reference_metrics_exercise_check
    check (exercise_id is null or kind = 'strength_load');

comment on column public.athlete_reference_metrics.exercise_id is
  'Exercice de la Bibliothèque (charge de référence seulement) : sert au calcul des kg depuis un %.';

create index athlete_reference_metrics_exercise_idx
  on public.athlete_reference_metrics (organization_id, athlete_id, exercise_id)
  where exercise_id is not null;

-- On ne relie qu'un exercice que l'on a le droit de voir (catalogue commun ou exercice de son
-- organisation) : la sous-requête passe par la RLS des exercices.
drop policy "Membres : ajout de repères dans leur organisation" on public.athlete_reference_metrics;
create policy "Membres : ajout de repères dans leur organisation"
  on public.athlete_reference_metrics for insert to authenticated
  with check (
    (select private.is_org_member(organization_id))
    and created_by = (select auth.uid())
    and (exercise_id is null or exists (select 1 from public.exercises e where e.id = exercise_id))
  );

-- Retour arrière (via une nouvelle migration si nécessaire) :
-- recréer la politique d'ajout sans la condition sur exercise_id (20261020133811_reperes_sportifs.sql),
-- puis : alter table public.athlete_reference_metrics drop column exercise_id;
