-- P1-02 / P1-03 : organisations (tenants), membres coachs, administrateurs de plateforme et RLS.
-- Sources : docs/02 §1-2 (rôles, deny par défaut), docs/11 §2 (tables), docs/12 §2-3 (RLS).
--
-- Choix de cette migration :
--   - Le propriétaire d'une organisation est le membre de rôle 'owner' (un seul par organisation),
--     plutôt qu'une colonne owner_user_id qui dupliquerait l'information.
--   - Aucune écriture depuis le navigateur pour l'instant : organisations et membres sont créés
--     par l'administration (script serveur / service role). L'inscription libre est prévue en P8.
--   - Les fonctions utilitaires vivent dans le schéma `private`, non exposé par l'API Supabase.

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to authenticated;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.organizations (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(trim(name)) between 1 and 120),
  slug        text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 60),
  status      text not null default 'active' check (status in ('active', 'suspended')),
  timezone    text not null default 'Europe/Brussels',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  created_by  uuid references auth.users (id) on delete set null
);

comment on table public.organizations is
  'Tenant : espace privé d''un coach ou d''une structure. Toute donnée métier porte un organization_id.';

create table public.organization_members (
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id         uuid not null references auth.users (id) on delete cascade,
  role            text not null check (role in ('owner', 'coach')),
  status          text not null default 'active' check (status in ('active', 'disabled')),
  invited_by      uuid references auth.users (id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  primary key (organization_id, user_id)
);

comment on table public.organization_members is
  'Appartenance d''un compte coach à une organisation. Le rôle se lit ici, jamais dans user_metadata.';

-- Un seul propriétaire par organisation.
create unique index organization_members_one_owner
  on public.organization_members (organization_id)
  where role = 'owner';

-- Recherche des organisations d'un utilisateur (utilisée par chaque contrôle RLS).
create index organization_members_user_idx
  on public.organization_members (user_id)
  where status = 'active';

create table public.platform_admins (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  role       text not null default 'operator' check (role in ('operator')),
  is_active  boolean not null default true,
  created_at timestamptz not null default now()
);

comment on table public.platform_admins is
  'Opérateurs du SaaS. Table protégée : aucune policy, donc inaccessible depuis le navigateur. '
  'Être admin ne donne AUCUN accès aux données des organisations (docs/02 §6).';

-- updated_at automatique (fonction créée en P0-03).
create trigger set_updated_at before update on public.organizations
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.organization_members
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Fonctions utilitaires d'autorisation
-- ---------------------------------------------------------------------------

-- Vrai si l'utilisateur connecté est membre actif de l'organisation, et que celle-ci est active.
-- SECURITY DEFINER : lit organization_members sans repasser par sa propre RLS (évite la récursion).
create or replace function private.is_org_member(org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.organization_members m
    join public.organizations o on o.id = m.organization_id
    where m.organization_id = org_id
      and m.user_id = (select auth.uid())
      and m.status = 'active'
      and o.status = 'active'
  );
$$;

revoke all on function private.is_org_member(uuid) from public, anon;
grant execute on function private.is_org_member(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- RLS : deny par défaut, lecture limitée à ses propres organisations
-- ---------------------------------------------------------------------------

alter table public.organizations        enable row level security;
alter table public.organization_members enable row level security;
alter table public.platform_admins      enable row level security;

-- Les visiteurs non connectés n'ont aucun droit sur ces tables.
revoke all on public.organizations, public.organization_members, public.platform_admins from anon;
-- Les utilisateurs connectés ne peuvent que lire (filtré par RLS) ; aucune écriture pour l'instant.
revoke insert, update, delete, truncate on public.organizations, public.organization_members from authenticated;
revoke all on public.platform_admins from authenticated;

create policy "Membres : lecture de leur organisation"
  on public.organizations
  for select
  to authenticated
  using ((select private.is_org_member(id)));

create policy "Membres : lecture des membres de leur organisation"
  on public.organization_members
  for select
  to authenticated
  using ((select private.is_org_member(organization_id)));

-- platform_admins : RLS activée sans aucune policy = aucun accès client.

-- Rollback (à appliquer via une nouvelle migration si nécessaire) :
-- drop table if exists public.platform_admins, public.organization_members, public.organizations cascade;
-- drop function if exists private.is_org_member(uuid);
-- drop schema if exists private;
