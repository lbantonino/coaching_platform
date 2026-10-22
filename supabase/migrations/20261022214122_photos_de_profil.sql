-- Photos de profil (D-28) : photo d'un sportif (gérée par les coachs de son organisation) et photo du
-- coach (gérée par lui-même), dans un espace de stockage PRIVÉ. Aucune adresse publique : l'app sert les
-- images à travers sa propre route, après vérification des droits (RLS de storage.objects).
--
-- Chemins :
--   org/<organization_id>/athlete/<athlete_id>/<fichier>   photo d'un sportif
--   user/<user_id>/<fichier>                               photo d'un coach

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('profile-photos', 'profile-photos', false, 2097152, '{image/jpeg,image/png,image/webp}')
on conflict (id) do nothing;

-- Le dossier est du texte : on ne le convertit en uuid qu'après avoir vérifié sa forme (un CASE garantit
-- l'ordre d'évaluation, contrairement à un AND).
create or replace function private.is_org_member_text(org_text text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when org_text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      then private.is_org_member(org_text::uuid)
    else false
  end;
$$;

-- Vrai si l'utilisateur connecté et `user_text` sont membres actifs d'une même organisation
-- (un coach voit la photo de ses collègues, jamais celle d'un coach d'une autre structure).
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
        where mine.user_id = (select auth.uid()) and theirs.user_id = user_text::uuid
      )
    else false
  end;
$$;

revoke all on function private.is_org_member_text(text) from public, anon;
revoke all on function private.shares_org_with(text) from public, anon;
grant execute on function private.is_org_member_text(text) to authenticated;
grant execute on function private.shares_org_with(text) to authenticated;

create policy "Photos : lecture (sportifs de l'organisation, soi-même, collègues)"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'profile-photos' and (
      ((storage.foldername(name))[1] = 'org' and private.is_org_member_text((storage.foldername(name))[2]))
      or ((storage.foldername(name))[1] = 'user' and (
        (storage.foldername(name))[2] = (select auth.uid())::text
        or private.shares_org_with((storage.foldername(name))[2])
      ))
    )
  );

create policy "Photos : ajout (sportifs de l'organisation, soi-même)"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'profile-photos' and (
      ((storage.foldername(name))[1] = 'org' and private.is_org_member_text((storage.foldername(name))[2]))
      or ((storage.foldername(name))[1] = 'user' and (storage.foldername(name))[2] = (select auth.uid())::text)
    )
  );

create policy "Photos : suppression (sportifs de l'organisation, soi-même)"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'profile-photos' and (
      ((storage.foldername(name))[1] = 'org' and private.is_org_member_text((storage.foldername(name))[2]))
      or ((storage.foldername(name))[1] = 'user' and (storage.foldername(name))[2] = (select auth.uid())::text)
    )
  );

-- Photo d'un sportif : chemin dans le stockage, modifiable par les coachs de l'organisation.
alter table public.athlete_profiles
  add column photo_path text check (photo_path is null or photo_path like 'org/%');
grant update (photo_path) on public.athlete_profiles to authenticated;

-- Profil du coach (prénom, nom, entreprise et photo). Une ligne par compte, créée à la première modification.
create table public.coach_profiles (
  user_id     uuid primary key references auth.users (id) on delete cascade,
  first_name  text check (first_name is null or char_length(btrim(first_name)) between 1 and 80),
  last_name   text check (last_name is null or char_length(btrim(last_name)) between 1 and 80),
  -- Entreprise ou nom commercial du coach (servira sur les factures, D-17).
  company_name text check (company_name is null or char_length(btrim(company_name)) between 1 and 120),
  photo_path  text check (photo_path is null or photo_path like 'user/%'),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger set_updated_at before update on public.coach_profiles
  for each row execute function public.set_updated_at();

alter table public.coach_profiles enable row level security;
revoke all on public.coach_profiles from anon, authenticated;
grant select, insert, update on public.coach_profiles to authenticated;

create policy "Coach : lecture de son profil et de ceux de ses collègues"
  on public.coach_profiles for select to authenticated
  using (user_id = (select auth.uid()) or private.shares_org_with(user_id::text));

create policy "Coach : création de son propre profil"
  on public.coach_profiles for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy "Coach : modification de son propre profil"
  on public.coach_profiles for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- Rollback (via une nouvelle migration si nécessaire) :
-- drop table if exists public.coach_profiles;
-- alter table public.athlete_profiles drop column if exists photo_path;
-- drop policy ... on storage.objects (les trois ci-dessus) ; delete from storage.buckets where id = 'profile-photos';
-- drop function if exists private.shares_org_with(text), private.is_org_member_text(text);
