-- Désarchiver un programme (phase 4, décision d'Antonino du 10/11/2026) : un programme archivé se
-- retrouve dans l'onglet « Archivés » de la page Programmes et peut revenir en service. Il reprend son
-- état d'avant : brouillon s'il n'a jamais été publié, publié sinon (avec sa version active, qui n'a
-- pas bougé). La contrainte programs_no_overlap refuse le retour d'un programme publié qui chevauche
-- un autre programme publié du même sportif (23P01, C-8) : rien n'est alors modifié.
-- Comme les autres écritures des programmes : une fonction contrôlée (membre de l'organisation),
-- jamais une mise à jour directe depuis le navigateur.

create function public.unarchive_program(p_program_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_org uuid;
  v_status text;
  v_publication uuid;
  v_next text;
begin
  select organization_id, status, active_publication_id
    into v_org, v_status, v_publication
    from public.programs where id = p_program_id for update;
  if v_org is null or (select auth.uid()) is null or not private.is_org_member(v_org) then
    raise exception 'Programme introuvable.' using errcode = 'P0002';
  end if;
  if v_status <> 'archived' then
    return v_status;
  end if;
  v_next := case when v_publication is null then 'draft' else 'published' end;
  update public.programs set status = v_next where id = p_program_id;
  return v_next;
end;
$$;

revoke all on function public.unarchive_program(uuid) from public, anon;
grant execute on function public.unarchive_program(uuid) to authenticated;

-- Retour arrière :
-- drop function public.unarchive_program(uuid);
