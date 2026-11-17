-- Supprimer un programme (demande d'Antonino du 16/11/2026 : « ⋯ » sur la carte d'un programme, « et
-- surtout supprimer, pas forcément que archiver »). Définitif : le programme, son brouillon et toutes ses
-- versions publiées (et leurs séances) disparaissent, par les clés étrangères « on delete cascade ».
-- Comme les autres écritures des programmes : une fonction contrôlée (membre de l'organisation, comme
-- archive_program), jamais une suppression directe depuis le navigateur. L'organisation est passée et
-- revérifiée (relecture du 16/11) : un coach membre de deux organisations ne supprime pas, depuis l'une,
-- un programme de l'autre.

create function public.delete_program(p_organization_id uuid, p_program_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_org uuid;
begin
  select organization_id into v_org from public.programs where id = p_program_id for update;
  if v_org is null or v_org <> p_organization_id or (select auth.uid()) is null
     or not private.is_org_member(v_org) then
    raise exception 'Programme introuvable.' using errcode = 'P0002';
  end if;
  delete from public.programs where id = p_program_id;
end;
$$;

revoke all on function public.delete_program(uuid, uuid) from public, anon;
grant execute on function public.delete_program(uuid, uuid) to authenticated;

-- Retour arrière (via une nouvelle migration si nécessaire) :
-- drop function public.delete_program(uuid, uuid);
