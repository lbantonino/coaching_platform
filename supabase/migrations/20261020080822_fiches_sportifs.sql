-- P2-01 (début) : fiches sportifs, créées par le coach sans compte préalable.
-- Sources : docs/03 §1 et §6, docs/11 §2, docs/02 §1 (fiche métier ≠ compte de connexion).
--
-- Champs volontairement minimaux : la fiche complète (objectifs, disponibilités, repères…) attend
-- la validation du coach (OPEN-01). athlete_user_id reste vide tant que le sportif n'a pas accepté
-- d'invitation (P1-05).

create table public.athlete_profiles (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations (id) on delete restrict,
  display_name     text not null check (char_length(trim(display_name)) between 1 and 120),
  email            text check (email is null or (char_length(email) <= 254 and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$')),
  phone            text check (phone is null or phone ~ '^\+?[0-9 ().-]{6,24}$'),
  status           text not null default 'active' check (status in ('active', 'paused', 'archived')),
  athlete_user_id  uuid references auth.users (id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  created_by       uuid references auth.users (id) on delete set null
);

comment on table public.athlete_profiles is
  'Fiche sportif gérée par une organisation. Une fiche ne donne pas accès à un compte (athlete_user_id nullable).';

-- E-mail unique par organisation (insensible à la casse) ; un même sportif peut être suivi
-- par deux organisations différentes (docs/03 §6).
create unique index athlete_profiles_org_email_unique
  on public.athlete_profiles (organization_id, lower(email))
  where email is not null;

-- Un compte sportif n'est lié qu'une fois par organisation.
create unique index athlete_profiles_org_user_unique
  on public.athlete_profiles (organization_id, athlete_user_id)
  where athlete_user_id is not null;

create index athlete_profiles_org_status_idx
  on public.athlete_profiles (organization_id, status, display_name);

create trigger set_updated_at before update on public.athlete_profiles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS : les membres actifs de l'organisation gèrent ses sportifs. Pas de suppression (on archive).
-- ---------------------------------------------------------------------------
alter table public.athlete_profiles enable row level security;

revoke all on public.athlete_profiles from anon;
revoke all on public.athlete_profiles from authenticated;
grant select, insert on public.athlete_profiles to authenticated;
-- Mise à jour limitée aux champs éditables : organization_id, athlete_user_id et created_by
-- ne peuvent pas être modifiés depuis le navigateur (un sportif ne change jamais d'organisation).
grant update (display_name, email, phone, status) on public.athlete_profiles to authenticated;

create policy "Membres : lecture des sportifs de leur organisation"
  on public.athlete_profiles
  for select
  to authenticated
  using ((select private.is_org_member(organization_id)));

create policy "Membres : création de sportifs dans leur organisation"
  on public.athlete_profiles
  for insert
  to authenticated
  with check (
    (select private.is_org_member(organization_id))
    and created_by = (select auth.uid())
    and athlete_user_id is null
  );

create policy "Membres : modification des sportifs de leur organisation"
  on public.athlete_profiles
  for update
  to authenticated
  using ((select private.is_org_member(organization_id)))
  with check ((select private.is_org_member(organization_id)));

-- Rollback (via une nouvelle migration si nécessaire) :
-- drop table if exists public.athlete_profiles;
