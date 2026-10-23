-- Étape 4a (D-35) : tâches du coach, première tranche. Sources : prompt Claude Design §7.2 (carte Tâches du
-- tableau de bord, cases à cocher) et §7 `/coach/taches` (priorité Haute / Normale, échéance, sportif).
-- La page Tâches complète (onglets, « associée à », création) viendra avec 4e ; cette table la prépare.
--
-- Une tâche est faite quand `done_at` est renseigné : on garde QUAND elle a été cochée (« Terminées »),
-- et la décocher remet simplement `done_at` à null.

create table public.coach_tasks (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations (id) on delete cascade,
  title            text not null check (char_length(btrim(title)) between 1 and 140),
  priority         text not null default 'normal' check (priority in ('high', 'normal')),
  due_on           date check (due_on is null or due_on >= date '2000-01-01'),
  -- Sportif concerné, facultatif (même organisation).
  athlete_id       uuid,
  done_at          timestamptz,
  done_by          uuid references auth.users (id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  created_by       uuid references auth.users (id) on delete set null,
  foreign key (athlete_id, organization_id)
    references public.athlete_profiles (id, organization_id) on delete cascade,
  -- Qui a coché n'a de sens que pour une tâche faite.
  check (done_at is not null or done_by is null)
);

comment on table public.coach_tasks is
  'Tâches du coach. Faite quand done_at est renseigné ; priorité high ou normal ; sportif facultatif.';

create index coach_tasks_org_open_idx on public.coach_tasks (organization_id, done_at, due_on);

create trigger set_updated_at before update on public.coach_tasks
  for each row execute function public.set_updated_at();

-- Qui a coché la tâche : toujours la personne connectée, posé par la base (jamais envoyé par le
-- navigateur). Décocher l'efface ; modifier une tâche déjà faite le garde.
create function private.set_task_done_by()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.done_at is null then
    new.done_by := null;
  elsif tg_op = 'INSERT' then
    new.done_by := (select auth.uid());
  elsif old.done_at is null then
    new.done_by := (select auth.uid());
  else
    new.done_by := old.done_by;
  end if;
  return new;
end;
$$;

revoke all on function private.set_task_done_by() from public, anon;
grant execute on function private.set_task_done_by() to authenticated;

create trigger set_done_by before insert or update on public.coach_tasks
  for each row execute function private.set_task_done_by();

-- ---------------------------------------------------------------------------
-- RLS : coachs de l'organisation uniquement. Le sportif ne voit jamais les tâches de son coach.
-- ---------------------------------------------------------------------------
alter table public.coach_tasks enable row level security;

revoke all on public.coach_tasks from anon, authenticated;
grant select, insert, delete on public.coach_tasks to authenticated;
grant update (title, priority, due_on, athlete_id, done_at) on public.coach_tasks to authenticated;

create policy "Membres : lecture des tâches de leur organisation"
  on public.coach_tasks for select to authenticated
  using ((select private.is_org_member(organization_id)));

create policy "Membres : ajout de tâches dans leur organisation"
  on public.coach_tasks for insert to authenticated
  with check ((select private.is_org_member(organization_id)) and created_by = (select auth.uid()));

create policy "Membres : mise à jour des tâches de leur organisation"
  on public.coach_tasks for update to authenticated
  using ((select private.is_org_member(organization_id)))
  with check ((select private.is_org_member(organization_id)));

create policy "Membres : suppression des tâches de leur organisation"
  on public.coach_tasks for delete to authenticated
  using ((select private.is_org_member(organization_id)));

-- Rollback (via une nouvelle migration si nécessaire) :
-- drop table if exists public.coach_tasks;
-- drop function if exists private.set_task_done_by();
