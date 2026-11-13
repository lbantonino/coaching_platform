-- Revue de sécurité du 13/11/2026 (avant la mise en ligne) : trois petits durcissements.

-- 1. Taille des versions publiées : comme les brouillons (1 Mo) et les modèles, une publication et
--    ses séances figées ont une taille maximale (un envoi géant ne remplit pas la base).
alter table public.program_publications
  add constraint program_publications_snapshot_size
  check (octet_length(snapshot_json::text) <= 2000000);
alter table public.publication_sessions
  add constraint publication_sessions_session_size
  check (octet_length(session_json::text) <= 200000);

-- 2. Une liste de tâches est créée au nom de celui qui la crée (comme une tâche) : personne ne
--    l'attribue à un collègue.
drop policy "Membres : ajout de listes de tâches dans leur organisation" on public.coach_task_lists;
create policy "Membres : ajout de listes de tâches dans leur organisation"
  on public.coach_task_lists for insert to authenticated
  with check ((select private.is_org_member(organization_id)) and created_by = (select auth.uid()));

-- 3. Photos des collègues : seulement tant que l'on est membre ACTIF de la même organisation
--    (un coach retiré d'une organisation ne voit plus les photos de ses anciens collègues).
create or replace function private.shares_org_with(user_text text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when user_text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      then exists (
        select 1
        from public.organization_members mine
        join public.organization_members theirs on theirs.organization_id = mine.organization_id
        join public.organizations o on o.id = mine.organization_id
        where mine.user_id = (select auth.uid())
          and theirs.user_id = user_text::uuid
          and mine.status = 'active'
          and theirs.status = 'active'
          and o.status = 'active'
      )
    else false
  end;
$$;

-- Retour arrière (via une nouvelle migration si nécessaire) :
-- recréer private.shares_org_with sans les conditions « status » (20261022214122_photos_de_profil) ;
-- drop policy "Membres : ajout de listes de tâches dans leur organisation" on public.coach_task_lists ;
-- create policy … with check ((select private.is_org_member(organization_id))) ;
-- alter table public.publication_sessions drop constraint publication_sessions_session_size ;
-- alter table public.program_publications drop constraint program_publications_snapshot_size.
