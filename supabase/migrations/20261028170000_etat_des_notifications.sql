-- Étape 4e (D-61) : les notifications se lisent et se masquent. Source : prompt Claude Design §7
-- `/coach/notifications` (rouge « Tout marquer comme lu ») et demande d'Antonino (28/10) : les voir,
-- les modifier, les supprimer.
--
-- Les notifications restent CALCULÉES à partir des vraies données (D-37) : rien n'est copié ici.
-- Cette table ne garde que l'état choisi par le coach pour chacune : lue, masquée. Chaque notification a
-- une clé stable qui change quand la situation change (ex. « task:<id>:<échéance> » : une tâche
-- reportée redevient une nouvelle notification, non lue).

create table public.coach_notification_states (
  user_id          uuid not null default auth.uid() references auth.users (id) on delete cascade,
  organization_id  uuid not null references public.organizations (id) on delete cascade,
  key              text not null
    check (key ~ '^(competition|message|task|invoice|profile):[0-9a-z:-]{1,120}$'),
  read_at          timestamptz,
  dismissed_at     timestamptz,
  updated_at       timestamptz not null default now(),
  primary key (user_id, organization_id, key),
  -- Une ligne n'existe que si la notification est lue ou masquée.
  check (read_at is not null or dismissed_at is not null)
);

comment on table public.coach_notification_states is
  'État des notifications calculées, par coach : lue (read_at) ou masquée (dismissed_at).';

create trigger set_updated_at before update on public.coach_notification_states
  for each row execute function public.set_updated_at();

alter table public.coach_notification_states enable row level security;

revoke all on public.coach_notification_states from anon, authenticated;
grant select, insert, update, delete on public.coach_notification_states to authenticated;

-- Chacun ne voit et ne change QUE ses propres états, dans une organisation dont il est membre.
create policy "Coach : ses états de notification"
  on public.coach_notification_states for all to authenticated
  using (user_id = (select auth.uid()) and (select private.is_org_member(organization_id)))
  with check (user_id = (select auth.uid()) and (select private.is_org_member(organization_id)));

-- Rollback (via une nouvelle migration si nécessaire) :
-- drop table if exists public.coach_notification_states;
