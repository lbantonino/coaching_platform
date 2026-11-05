-- Kit « Coory Pages », page 03 Notifications (D-128), décision 11 d'Antonino (04/11/2026) :
-- « Supprimer » une notification la cache POUR DE BON, même de l'onglet « Masquées » (masquer reste
-- réversible). « Annuler » pendant 5 secondes efface simplement la date.
--
-- Les notifications restent calculées (D-37) : rien n'est supprimé des vraies données ; cette table
-- garde seulement le choix du coach. Une clé change quand la situation change (nouveau message,
-- tâche reportée) : la nouvelle notification revient, non lue.

alter table public.coach_notification_states
  add column deleted_at timestamptz;

comment on column public.coach_notification_states.deleted_at is
  'Supprimée par le coach : n''apparaît plus nulle part (ni la cloche, ni Notifications, ni Masquées).';

-- Une ligne n'existe que si la notification est lue, masquée ou supprimée.
alter table public.coach_notification_states
  drop constraint coach_notification_states_check,
  add constraint coach_notification_states_check
    check (read_at is not null or dismissed_at is not null or deleted_at is not null);

-- Rollback (via une nouvelle migration si nécessaire) :
-- delete from public.coach_notification_states where read_at is null and dismissed_at is null;
-- alter table public.coach_notification_states drop constraint coach_notification_states_check,
--   add constraint coach_notification_states_check check (read_at is not null or dismissed_at is not null);
-- alter table public.coach_notification_states drop column deleted_at;
