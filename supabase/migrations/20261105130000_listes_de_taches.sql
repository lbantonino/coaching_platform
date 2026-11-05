-- Kit « Coory Pages », page 01 Tâches (D-129), décisions 8 et 9 d'Antonino (04/11/2026) :
-- les « listes » du coach (Programmes, Facturation…) sont les SIENNES : une nouvelle table, aucune
-- au départ (il crée les siennes), renommer / recolorer / supprimer ; une liste supprimée laisse ses
-- tâches « sans liste ». L'ancienne colonne `category` reste en base, inutilisée.

create table public.coach_task_lists (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations (id) on delete cascade,
  name             text not null check (char_length(btrim(name)) between 1 and 40),
  -- Palette du kit (6 couleurs) ; la suivante est proposée à chaque nouvelle liste.
  color            text not null check (color in ('indigo', 'amber', 'teal', 'rose', 'violet', 'ink')),
  position         integer not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  created_by       uuid default auth.uid() references auth.users (id) on delete set null,
  unique (id, organization_id)
);

comment on table public.coach_task_lists is
  'Listes de tâches créées par les coachs d''une organisation (nom, couleur de la palette, ordre).';

create index coach_task_lists_org_idx on public.coach_task_lists (organization_id, position);

create trigger set_updated_at before update on public.coach_task_lists
  for each row execute function public.set_updated_at();

alter table public.coach_task_lists enable row level security;

revoke all on public.coach_task_lists from anon, authenticated;
grant select, insert, delete on public.coach_task_lists to authenticated;
grant update (name, color, position) on public.coach_task_lists to authenticated;

create policy "Membres : lecture des listes de tâches de leur organisation"
  on public.coach_task_lists for select to authenticated
  using ((select private.is_org_member(organization_id)));

create policy "Membres : ajout de listes de tâches dans leur organisation"
  on public.coach_task_lists for insert to authenticated
  with check ((select private.is_org_member(organization_id)));

create policy "Membres : mise à jour des listes de tâches de leur organisation"
  on public.coach_task_lists for update to authenticated
  using ((select private.is_org_member(organization_id)))
  with check ((select private.is_org_member(organization_id)));

create policy "Membres : suppression des listes de tâches de leur organisation"
  on public.coach_task_lists for delete to authenticated
  using ((select private.is_org_member(organization_id)));

-- La liste d'une tâche : de la même organisation (clé composée) ; liste supprimée -> tâche sans liste
-- (seule la colonne list_id est remise à vide, l'organisation reste).
alter table public.coach_tasks
  add column list_id uuid,
  add constraint coach_tasks_list_fkey foreign key (list_id, organization_id)
    references public.coach_task_lists (id, organization_id) on delete set null (list_id);

create index coach_tasks_list_idx on public.coach_tasks (list_id) where list_id is not null;

grant update (list_id) on public.coach_tasks to authenticated;

-- Rollback (via une nouvelle migration si nécessaire) :
-- alter table public.coach_tasks drop constraint coach_tasks_list_fkey, drop column list_id;
-- drop table if exists public.coach_task_lists;
