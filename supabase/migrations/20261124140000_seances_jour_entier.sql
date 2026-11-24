-- Séance « Jour entier » (D-204, 24/11/2026) : maquette « Nouvelle séance » façon Apple validée par
-- Antonino (« Jour entier » gardé : stage, journée de compétition). La séance n'a pas d'heure : la
-- base garde une heure rangée (00:00, 60 min) qui la met en tête de sa journée et respecte les
-- contraintes d'heure et de durée de toutes les séances ; l'application affiche « Toute la journée ».
-- Retour arrière : supprimer la contrainte puis la colonne (les séances repassent à 00:00, 1 h).

alter table public.coach_sessions
  add column all_day boolean not null default false;

alter table public.coach_sessions
  add constraint coach_sessions_all_day_time
  check (not all_day or (start_time = '00:00' and duration_minutes = 60));

comment on column public.coach_sessions.all_day is
  'Toute la journée (sans heure) : start_time 00:00 et duration_minutes 60, rangés.';

grant update (all_day) on public.coach_sessions to authenticated;
