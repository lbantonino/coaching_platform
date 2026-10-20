-- P1-05 : invitation d'un sportif à son espace, par lien à usage unique, expirant et révocable.
-- Sources : docs/02 §1, §5 et §7 (états pending|accepted|expired|revoked), docs/11 §2 (jamais de jeton en clair),
-- docs/12 §2 (invitation expirante, hash du jeton, usage unique, révocation), OPEN-11 (mineurs bloqués).
--
-- Choix validés par Antonino le 20/10/2026 : lien à copier par le coach (pas d'envoi automatique avant P7),
-- validité 7 jours, case obligatoire « J'ai 18 ans ou plus » à l'acceptation.

-- Permet une clé étrangère composite (fiche + organisation) : une invitation ne peut viser qu'une fiche
-- de la MÊME organisation.
alter table public.athlete_profiles
  add constraint athlete_profiles_id_org_unique unique (id, organization_id);

create table public.athlete_invites (
  id                  uuid primary key default gen_random_uuid(),
  organization_id     uuid not null references public.organizations (id) on delete cascade,
  athlete_id          uuid not null,
  token_hash          text not null unique check (token_hash ~ '^[0-9a-f]{64}$'),
  status              text not null default 'pending' check (status in ('pending', 'accepted', 'revoked')),
  expires_at          timestamptz not null,
  created_by          uuid references auth.users (id) on delete set null,
  created_at          timestamptz not null default now(),
  revoked_at          timestamptz,
  accepted_at         timestamptz,
  accepted_by         uuid references auth.users (id) on delete set null,
  adult_confirmed_at  timestamptz,
  foreign key (athlete_id, organization_id)
    references public.athlete_profiles (id, organization_id) on delete cascade,
  check (expires_at > created_at),
  check (status <> 'revoked' or revoked_at is not null),
  check (status <> 'accepted' or (accepted_at is not null and accepted_by is not null and adult_confirmed_at is not null))
);

comment on table public.athlete_invites is
  'Invitations d''un sportif à son espace. Seul le hash SHA-256 du jeton est stocké ; « expirée » = pending et expires_at dépassé.';

-- Une seule invitation en attente par fiche.
create unique index athlete_invites_one_pending
  on public.athlete_invites (athlete_id)
  where status = 'pending';

create index athlete_invites_org_idx on public.athlete_invites (organization_id, athlete_id);

-- ---------------------------------------------------------------------------
-- RLS des invitations : gérées par les membres de l'organisation.
-- ---------------------------------------------------------------------------
alter table public.athlete_invites enable row level security;

revoke all on public.athlete_invites from anon, authenticated;
grant select, insert on public.athlete_invites to authenticated;
grant update (status, revoked_at) on public.athlete_invites to authenticated;

create policy "Membres : lecture des invitations de leur organisation"
  on public.athlete_invites for select to authenticated
  using ((select private.is_org_member(organization_id)));

create policy "Membres : création d'invitations dans leur organisation"
  on public.athlete_invites for insert to authenticated
  with check (
    (select private.is_org_member(organization_id))
    and created_by = (select auth.uid())
    and status = 'pending'
    and accepted_at is null and accepted_by is null and adult_confirmed_at is null
    and expires_at <= now() + interval '7 days 1 minute'
  );

-- Le navigateur ne peut que RÉVOQUER une invitation en attente ; l'acceptation passe par accept_invitation().
create policy "Membres : révocation des invitations de leur organisation"
  on public.athlete_invites for update to authenticated
  using ((select private.is_org_member(organization_id)) and status = 'pending')
  with check (status = 'revoked' and revoked_at is not null);

-- ---------------------------------------------------------------------------
-- Sportif lié : lit sa propre fiche et le nom de son organisation, rien d'autre.
-- ---------------------------------------------------------------------------
create or replace function private.is_linked_athlete(org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.athlete_profiles p
    where p.organization_id = org_id
      and p.athlete_user_id = (select auth.uid())
      and p.status <> 'archived'
  );
$$;

revoke all on function private.is_linked_athlete(uuid) from public, anon;
grant execute on function private.is_linked_athlete(uuid) to authenticated;

create policy "Sportif : lecture de sa propre fiche"
  on public.athlete_profiles for select to authenticated
  using (athlete_user_id = (select auth.uid()));

create policy "Sportif : lecture de son organisation"
  on public.organizations for select to authenticated
  using ((select private.is_linked_athlete(id)));

-- ---------------------------------------------------------------------------
-- Lecture d'une invitation par son jeton (page publique /invitation/[jeton]).
-- Ne révèle que ce qui est utile à la personne qui détient le lien.
-- ---------------------------------------------------------------------------
create or replace function public.get_invitation(p_token_hash text)
returns table (organization_name text, athlete_name text, email text, invite_status text, expires_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select o.name,
         p.display_name,
         p.email,
         case when i.status = 'pending' and i.expires_at <= now() then 'expired' else i.status end,
         i.expires_at
  from public.athlete_invites i
  join public.athlete_profiles p on p.id = i.athlete_id
  join public.organizations o on o.id = i.organization_id
  where i.token_hash = p_token_hash;
$$;

revoke all on function public.get_invitation(text) from public;
grant execute on function public.get_invitation(text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Acceptation atomique par le sportif connecté.
-- Erreurs (message = code lu par le serveur) : invitation_invalide, invitation_expiree,
-- age_non_confirme, email_different, fiche_deja_liee.
-- ---------------------------------------------------------------------------
create or replace function public.accept_invitation(p_token_hash text, p_adult_confirmed boolean)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_invite  public.athlete_invites%rowtype;
  v_profile public.athlete_profiles%rowtype;
  v_email   text;
begin
  if v_user_id is null then
    raise exception 'invitation_invalide';
  end if;

  select * into v_invite from public.athlete_invites where token_hash = p_token_hash for update;
  if not found or v_invite.status <> 'pending' then
    raise exception 'invitation_invalide';
  end if;
  if v_invite.expires_at <= now() then
    raise exception 'invitation_expiree';
  end if;
  if p_adult_confirmed is not true then
    raise exception 'age_non_confirme';
  end if;

  select * into v_profile from public.athlete_profiles where id = v_invite.athlete_id for update;
  select u.email into v_email from auth.users u where u.id = v_user_id;

  if v_profile.email is null or lower(v_email) <> lower(v_profile.email) then
    raise exception 'email_different';
  end if;
  if v_profile.athlete_user_id is not null and v_profile.athlete_user_id <> v_user_id then
    raise exception 'fiche_deja_liee';
  end if;

  update public.athlete_profiles set athlete_user_id = v_user_id where id = v_profile.id;

  update public.athlete_invites
     set status = 'accepted', accepted_at = now(), accepted_by = v_user_id, adult_confirmed_at = now()
   where id = v_invite.id;

  return v_invite.organization_id;
end;
$$;

revoke all on function public.accept_invitation(text, boolean) from public, anon;
grant execute on function public.accept_invitation(text, boolean) to authenticated;

-- Rollback (via une nouvelle migration si nécessaire) :
-- drop function if exists public.accept_invitation(text, boolean);
-- drop function if exists public.get_invitation(text);
-- drop policy if exists "Sportif : lecture de son organisation" on public.organizations;
-- drop policy if exists "Sportif : lecture de sa propre fiche" on public.athlete_profiles;
-- drop function if exists private.is_linked_athlete(uuid);
-- drop table if exists public.athlete_invites;
-- alter table public.athlete_profiles drop constraint if exists athlete_profiles_id_org_unique;
