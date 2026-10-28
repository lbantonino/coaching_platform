-- Étape 4e (D-59) : les tâches se créent, se modifient et se suppriment (demande d'Antonino du 28/10 :
-- « qu'on puisse les voir, les créer, les modifier et les supprimer »). Source : prompt Claude Design
-- §7 `/coach/taches` (tâche, « associée à » Programme / Facturation / Paiement / Suivi / Agenda,
-- priorité, échéance). La table existe depuis D-35 ; il manquait « associée à » et une note.

alter table public.coach_tasks
  -- « Associée à » : le domaine de la tâche, facultatif (liste fermée).
  add column category text
    check (category is null or category in ('programme', 'facturation', 'paiement', 'suivi', 'agenda')),
  -- Précision libre (ce qu'il faut faire, où trouver l'info), facultative.
  add column notes text
    check (notes is null or char_length(btrim(notes)) between 1 and 1000);

comment on column public.coach_tasks.category is
  'Associée à : programme, facturation, paiement, suivi ou agenda (facultatif).';
comment on column public.coach_tasks.notes is 'Note libre de la tâche, 1000 caractères au plus.';

-- Les coachs de l'organisation modifient aussi ces deux colonnes (RLS inchangée : membres seulement).
grant update (category, notes) on public.coach_tasks to authenticated;

-- Rollback (via une nouvelle migration si nécessaire) :
-- alter table public.coach_tasks drop column if exists notes, drop column if exists category;
