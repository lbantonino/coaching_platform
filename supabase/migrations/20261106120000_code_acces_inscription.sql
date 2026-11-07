-- Code d'accès de l'inscription (bêta privée, décision d'Antonino du 06/11/2026, D-140).
-- L'app reste visible de tous, mais seuls les testeurs à qui Antonino donne le code créent un compte.
-- La vérification vit DANS Supabase (crochet Auth « before user created ») : la clé publique permet
-- d'appeler l'inscription sans passer par notre formulaire, un contrôle côté Next.js seul se
-- contournerait. Le code est rangé haché (bcrypt), jamais en clair, et retiré des métadonnées du
-- compte créé.
-- Exceptions : les comptes créés par le serveur pour un sportif invité (app_metadata.coory_invited,
-- que le navigateur ne peut pas poser), et les insertions SQL directes (seed), qui ne passent pas
-- par le crochet.
-- Aucun code enregistré = inscriptions FERMÉES (sûr par défaut). Pour ouvrir ou changer le code,
-- dans l'éditeur SQL de Supabase : select private.set_signup_access_code('LE-CODE');
-- En ligne, activer aussi le crochet : Authentication > Hooks > Before User Created >
-- public.before_user_created_access_code (en local : supabase/config.toml).

create table private.signup_access_code (
  -- Une seule ligne : le code en vigueur.
  singleton  boolean primary key default true check (singleton),
  code_hash  text not null,
  updated_at timestamptz not null default now()
);

comment on table private.signup_access_code is
  'Code d''accès de l''inscription (bêta privée), haché en bcrypt. Une seule ligne.';

revoke all on private.signup_access_code from public, anon, authenticated;

-- Majuscules et espaces retirés aux deux bouts : « coory-2026 » et « COORY-2026 » sont le même code.
create or replace function private.set_signup_access_code(new_code text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  normalized text := upper(btrim(coalesce(new_code, '')));
begin
  if char_length(normalized) < 6 then
    raise exception 'Le code d''accès doit faire au moins 6 caractères.';
  end if;
  insert into private.signup_access_code (singleton, code_hash)
  values (true, extensions.crypt(normalized, extensions.gen_salt('bf')))
  on conflict (singleton) do update
    set code_hash = excluded.code_hash, updated_at = now();
end;
$$;

revoke all on function private.set_signup_access_code(text) from public, anon, authenticated;

-- Crochet Auth : appelé par Supabase avant chaque création de compte (e-mail, Google…).
-- Renvoie {} pour accepter, ou une erreur 403 que le formulaire affiche sous le champ du code.
create or replace function public.before_user_created_access_code(event jsonb)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  provided text := upper(btrim(coalesce(event #>> '{user,user_metadata,access_code}', '')));
  stored   text;
begin
  if coalesce(event #>> '{user,app_metadata,coory_invited}', '') = 'true' then
    return '{}'::jsonb;
  end if;

  select code_hash into stored from private.signup_access_code where singleton;
  if stored is null then
    return jsonb_build_object('error', jsonb_build_object(
      'http_code', 403, 'message', 'Les inscriptions sont fermées pour le moment.'));
  end if;

  if provided <> '' and extensions.crypt(provided, stored) = stored then
    return '{}'::jsonb;
  end if;

  return jsonb_build_object('error', jsonb_build_object(
    'http_code', 403, 'message', 'Code d''accès incorrect.'));
end;
$$;

revoke all on function public.before_user_created_access_code(jsonb) from public, anon, authenticated;
grant execute on function public.before_user_created_access_code(jsonb) to supabase_auth_admin;

-- Le code tapé ne reste pas dans les métadonnées du compte (lisibles par la personne et par le serveur).
-- À l'insertion ET aux mises à jour : Supabase réécrit ces métadonnées juste après la création.
create or replace function private.strip_signup_access_code()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.raw_user_meta_data ? 'access_code' then
    new.raw_user_meta_data := new.raw_user_meta_data - 'access_code';
  end if;
  return new;
end;
$$;

revoke all on function private.strip_signup_access_code() from public, anon, authenticated;

create trigger strip_signup_access_code
  before insert or update of raw_user_meta_data on auth.users
  for each row execute function private.strip_signup_access_code();

-- Rollback (via une nouvelle migration si nécessaire) :
--   drop trigger strip_signup_access_code on auth.users;
--   drop function private.strip_signup_access_code();
--   drop function public.before_user_created_access_code(jsonb);
--   drop function private.set_signup_access_code(text);
--   drop table private.signup_access_code;
--   puis désactiver le crochet (config.toml en local, tableau de bord Supabase en ligne).
