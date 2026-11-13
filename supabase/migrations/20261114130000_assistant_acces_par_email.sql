-- Assistant IA ouvert par adresse e-mail (demande d'Antonino du 13/11/2026, D-171). En plus des
-- organisations abonnées (D-168), une LISTE d'adresses autorisées, tenue par l'administrateur seul
-- (schéma privé : aucun coach ne la lit ni ne s'y ajoute). Elle sert pour l'instant à Gianluca et à
-- Antonino (ses tests) ; tous les autres coachs voient la carte « disponible avec l'abonnement ».
-- Les adresses ne sont JAMAIS écrites dans une migration ni dans Git : l'administrateur les ajoute
-- dans l'éditeur SQL de Supabase (docs/DEPLOIEMENT.md, étape 3).
-- La limite de 100 demandes par coach et par mois s'applique aussi aux adresses autorisées.

create table private.assistant_allowed_emails (
  email      text primary key check (email = lower(btrim(email)) and position('@' in email) > 1),
  note       text check (char_length(note) <= 200),
  created_at timestamptz not null default now()
);

comment on table private.assistant_allowed_emails is
  'Adresses e-mail autorisées à utiliser l''Assistant IA sans abonnement de leur organisation (administrateur seulement).';

revoke all on private.assistant_allowed_emails from public, anon, authenticated;

-- Vrai si le coach connecté peut utiliser l'assistant dans cette organisation : organisation abonnée,
-- ou adresse du coach dans la liste (sans tenir compte des majuscules).
create function private.assistant_allowed(p_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
      select 1 from public.organizations
      where id = p_organization_id and coory_plan = 'premium'
    )
    or exists (
      select 1
      from private.assistant_allowed_emails allowed
      join auth.users u on lower(u.email) = allowed.email
      where u.id = (select auth.uid())
    );
$$;

revoke all on function private.assistant_allowed(uuid) from public, anon, authenticated;

-- Pour l'interface : verrou ou assistant ouvert (membre actif de l'organisation seulement).
create function public.assistant_access_allowed(p_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.is_org_member(p_organization_id) and private.assistant_allowed(p_organization_id);
$$;

revoke all on function public.assistant_access_allowed(uuid) from public, anon;
grant execute on function public.assistant_access_allowed(uuid) to authenticated;

-- La réservation d'une demande accepte désormais aussi les adresses autorisées (le reste ne change
-- pas : membre actif, 100 demandes par mois, verrou par coach).
create or replace function public.reserve_assistant_use(p_organization_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_used integer;
  v_id uuid;
begin
  if v_user is null or not private.is_org_member(p_organization_id) then
    raise exception 'acces_refuse' using errcode = '42501';
  end if;
  if not private.assistant_allowed(p_organization_id) then
    raise exception 'abonnement_requis' using errcode = 'P0001';
  end if;
  perform pg_advisory_xact_lock(hashtextextended('assistant:' || v_user::text, 0));
  select count(*) into v_used
  from public.assistant_usage
  where user_id = v_user and created_at >= private.assistant_month_start();
  if v_used >= 100 then
    raise exception 'limite_mensuelle' using errcode = 'P0001';
  end if;
  insert into public.assistant_usage (organization_id, user_id)
  values (p_organization_id, v_user)
  returning id into v_id;
  return v_id;
end;
$$;

-- Autoriser une adresse (administrateur, éditeur SQL de Supabase) :
--   insert into private.assistant_allowed_emails (email, note) values ('<adresse en minuscules>', '<qui>');
-- La retirer :
--   delete from private.assistant_allowed_emails where email = '<adresse>';

-- Retour arrière (via une nouvelle migration si nécessaire) :
-- recréer reserve_assistant_use de 20261113150000_assistant_abonnement ;
-- drop function public.assistant_access_allowed(uuid) ;
-- drop function private.assistant_allowed(uuid) ;
-- drop table private.assistant_allowed_emails.
