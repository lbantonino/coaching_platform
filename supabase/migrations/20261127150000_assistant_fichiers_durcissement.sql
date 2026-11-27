-- Fichiers joints à l'Assistant IA : durcissement après la relecture du 27/11/2026 (D-213).
--
--   1. Le coach ne dépose ni ne supprime plus rien lui-même (ni dans le stockage, ni dans la table) :
--      le serveur réserve la place (reserve_assistant_file : verrou par coach, 300 Mo sur 24 h,
--      chemin fixé par la base), puis signe l'adresse de dépôt avec la clé de service. Sinon une
--      taille annoncée de 1 octet, ou un dépôt direct avec sa session, contournait la limite.
--   2. Fichiers du stockage sans ligne (dépôt interrompu, retrait pendant l'envoi) : listés après
--      24 h pour le passage planifié (assistant_files_orphans, clé de service seulement).

-- 1. Plus de dépôt ni de suppression avec la session du coach (la lecture de SES fichiers reste).
drop policy "Assistant : dépôt de ses fichiers" on storage.objects;
drop policy "Assistant : suppression de ses fichiers" on storage.objects;
revoke insert (organization_id, user_id, storage_path, name, mime_type, size_bytes)
  on public.assistant_files from authenticated;
revoke insert, delete on public.assistant_files from authenticated;

create function public.reserve_assistant_file(
  p_organization_id uuid,
  p_name text,
  p_mime text,
  p_size integer
)
returns table (id uuid, storage_path text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_path text;
begin
  if v_user is null or not (select private.is_org_member(p_organization_id))
     or (select public.is_demo_account()) then
    raise exception 'Accès refusé.' using errcode = '42501';
  end if;
  if p_size is null or p_size < 1 or p_size > 20971520 then
    raise exception 'taille_refusee' using errcode = '22023';
  end if;
  -- Une réservation à la fois par coach : dix envois en parallèle ne dépassent pas la limite.
  perform pg_advisory_xact_lock(hashtextextended('assistant_files:' || v_user::text, 0));
  if coalesce((
       select sum(f.size_bytes) from public.assistant_files f
        where f.user_id = v_user and f.created_at > now() - interval '24 hours'
     ), 0) + p_size > 314572800 then
    raise exception 'place_epuisee' using errcode = '22023';
  end if;
  v_path := p_organization_id::text || '/' || v_user::text || '/' || gen_random_uuid()::text;
  return query
    insert into public.assistant_files as f
      (organization_id, user_id, storage_path, name, mime_type, size_bytes)
    values (p_organization_id, v_user, v_path, left(btrim(p_name), 200),
            left(coalesce(nullif(p_mime, ''), 'application/octet-stream'), 120), p_size)
    returning f.id, f.storage_path;
end;
$$;

revoke all on function public.reserve_assistant_file(uuid, text, text, integer) from public, anon;
grant execute on function public.reserve_assistant_file(uuid, text, text, integer) to authenticated;

-- 2. Fichiers orphelins de plus de 24 h (le passage planifié les retire par l'API du stockage).
create function public.assistant_files_orphans()
returns setof text
language sql
stable
security definer
set search_path = ''
as $$
  select o.name from storage.objects o
   where o.bucket_id = 'assistant-files'
     and o.created_at < now() - interval '24 hours'
     and not exists (select 1 from public.assistant_files f where f.storage_path = o.name)
   limit 500;
$$;

revoke all on function public.assistant_files_orphans() from public, anon, authenticated;
grant execute on function public.assistant_files_orphans() to service_role;

-- Rollback (via une nouvelle migration si nécessaire) :
-- drop function public.assistant_files_orphans();
-- drop function public.reserve_assistant_file(uuid, text, text, integer);
-- (re)créer les deux politiques de stockage et les droits insert / delete de la migration 20261127140000.
