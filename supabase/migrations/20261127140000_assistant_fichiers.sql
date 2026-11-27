-- Assistant IA : plusieurs fichiers, jusqu'à 20 Mo chacun (D-213, demande d'Antonino du 27/11/2026).
--
-- Vercel refuse les envois de plus de 4,5 Mo : le navigateur dépose chaque fichier DIRECTEMENT dans un
-- espace privé de Coory (adresse signée créée par le serveur), puis le serveur le prépare (PDF et
-- images : copie chez Anthropic, 1 h ; Word, Excel, texte : texte extrait). Les étapes de la demande ne
-- transportent que des identifiants : aucune fonction ne dépasse les 300 s de Vercel.
--
--   1. Espace de stockage privé `assistant-files` : <organisation>/<coach>/<uuid>, 20 Mo par fichier ;
--      chaque coach ne voit, ne dépose et ne supprime que les siens ; rien pour la démo (règle existante
--      « Démo : aucun fichier déposé »).
--   2. Table assistant_files : le coach n'écrit QUE le nom, le type, la taille et le chemin ; les
--      champs préparés (pages, texte extrait, identifiant Anthropic) sont écrits par le serveur seul
--      (clé de service) : jamais d'identifiant Anthropic venu du navigateur (règle d'Anthropic).
--   3. assistant_files_room : 300 Mo de fichiers par coach sur 24 h (offre gratuite de Supabase : 1 Go
--      pour tout le monde).
-- Effacement : retrait par le coach, nouvelle conversation, et après 24 h (passage planifié des
-- alertes, route /api/alertes) ; avec le compte (cascade).

-- ---------------------------------------------------------------------------
-- 1. Espace de stockage
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('assistant-files', 'assistant-files', false, 20971520, null)
on conflict (id) do nothing;

create policy "Assistant : lecture de ses fichiers"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'assistant-files'
    and private.is_org_member_text((storage.foldername(name))[1])
    and (storage.foldername(name))[2] = (select auth.uid())::text
  );

create policy "Assistant : dépôt de ses fichiers"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'assistant-files'
    and private.is_org_member_text((storage.foldername(name))[1])
    and (storage.foldername(name))[2] = (select auth.uid())::text
  );

create policy "Assistant : suppression de ses fichiers"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'assistant-files'
    and private.is_org_member_text((storage.foldername(name))[1])
    and (storage.foldername(name))[2] = (select auth.uid())::text
  );

-- ---------------------------------------------------------------------------
-- 2. Table
-- ---------------------------------------------------------------------------
create table public.assistant_files (
  id                 uuid primary key default gen_random_uuid(),
  organization_id    uuid not null references public.organizations (id) on delete cascade,
  user_id            uuid not null default auth.uid() references auth.users (id) on delete cascade,
  storage_path       text not null unique
    check (storage_path like organization_id::text || '/' || user_id::text || '/%'),
  name               text not null check (char_length(btrim(name)) between 1 and 200),
  mime_type          text not null check (char_length(mime_type) <= 120),
  size_bytes         integer not null check (size_bytes between 1 and 20971520),
  -- Écrits par le serveur seul, à la préparation.
  pages              integer check (pages >= 0),
  text_content       text check (char_length(text_content) <= 200000),
  anthropic_file_id  text check (char_length(anthropic_file_id) <= 200),
  prepared_at        timestamptz,
  created_at         timestamptz not null default now()
);

comment on table public.assistant_files is
  'Fichiers joints à l''Assistant IA (D-213) : 24 h au plus, copie Anthropic 1 h au plus.';

create index assistant_files_owner_idx on public.assistant_files (user_id, created_at);
create index assistant_files_created_idx on public.assistant_files (created_at);

alter table public.assistant_files enable row level security;

revoke all on public.assistant_files from anon, authenticated;
grant select, delete on public.assistant_files to authenticated;
-- Pas d'update ; à l'ajout, seulement ce que le coach connaît de son fichier.
grant insert (organization_id, user_id, storage_path, name, mime_type, size_bytes)
  on public.assistant_files to authenticated;

create policy "Coach : ses fichiers de l'assistant"
  on public.assistant_files for all to authenticated
  using (user_id = (select auth.uid()) and (select private.is_org_member(organization_id)))
  with check (
    user_id = (select auth.uid())
    and (select private.is_org_member(organization_id))
    and not (select public.is_demo_account())
  );

-- ---------------------------------------------------------------------------
-- 3. Place restante : 300 Mo par coach sur 24 h (avec la session du coach)
-- ---------------------------------------------------------------------------
create function public.assistant_files_room(p_organization_id uuid, p_size integer)
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select not (select public.is_demo_account())
    and (select private.is_org_member(p_organization_id))
    and p_size between 1 and 20971520
    and coalesce((
      select sum(f.size_bytes) from public.assistant_files f
       where f.user_id = (select auth.uid()) and f.created_at > now() - interval '24 hours'
    ), 0) + p_size <= 314572800;
$$;

revoke all on function public.assistant_files_room(uuid, integer) from public, anon;
grant execute on function public.assistant_files_room(uuid, integer) to authenticated;

-- Rollback (via une nouvelle migration si nécessaire) :
-- drop function public.assistant_files_room(uuid, integer);
-- drop table public.assistant_files;
-- drop policy "Assistant : lecture de ses fichiers" on storage.objects;
-- drop policy "Assistant : dépôt de ses fichiers" on storage.objects;
-- drop policy "Assistant : suppression de ses fichiers" on storage.objects;
-- delete from storage.buckets where id = 'assistant-files';  (après avoir vidé l'espace par l'API)
