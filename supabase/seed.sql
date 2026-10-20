-- =====================================================================
-- DONNÉES DE DÉMONSTRATION : DÉVELOPPEMENT ET TESTS UNIQUEMENT
-- =====================================================================
-- Exécuté par `npm run db:reset` sur la base Supabase LOCALE après les migrations.
-- Jamais appliqué en staging ni en production.
--
-- Règles :
--   - aucune donnée personnelle réelle (nom, email, téléphone, programme d'un vrai sportif) ;
--   - noms explicitement fictifs (ex. « Camille Test », « Organisation Démo A ») ;
--   - emails en domaine réservé : *@example.test ;
--   - le seed doit pouvoir être rejoué à l'identique après chaque reset.
--
-- Comptes de connexion locaux (mot de passe de démo commun : demo-coach-local) :
--   coach-a@example.test -> propriétaire de « Organisation Démo A »
--   coach-b@example.test -> propriétaire de « Organisation Démo B »
--   admin@example.test   -> administrateur de la plateforme, membre d'aucune organisation
-- Les UUID sont fixes pour que les tests puissent s'y référer.

-- ---------------------------------------------------------------------
-- Comptes Auth (local uniquement)
-- ---------------------------------------------------------------------
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change, email_change_token_new
)
values
  ('00000000-0000-0000-0000-000000000000', 'a0000000-0000-4000-8000-00000000000a', 'authenticated', 'authenticated',
   'coach-a@example.test', extensions.crypt('demo-coach-local', extensions.gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}', '{"display_name":"Coach Démo A"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', 'b0000000-0000-4000-8000-00000000000b', 'authenticated', 'authenticated',
   'coach-b@example.test', extensions.crypt('demo-coach-local', extensions.gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}', '{"display_name":"Coach Démo B"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', 'c0000000-0000-4000-8000-00000000000c', 'authenticated', 'authenticated',
   'admin@example.test', extensions.crypt('demo-coach-local', extensions.gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}', '{"display_name":"Admin Démo"}', now(), now(), '', '', '', '');

insert into auth.identities (id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
values
  (gen_random_uuid(), 'a0000000-0000-4000-8000-00000000000a', 'a0000000-0000-4000-8000-00000000000a',
   '{"sub":"a0000000-0000-4000-8000-00000000000a","email":"coach-a@example.test","email_verified":true}',
   'email', now(), now(), now()),
  (gen_random_uuid(), 'b0000000-0000-4000-8000-00000000000b', 'b0000000-0000-4000-8000-00000000000b',
   '{"sub":"b0000000-0000-4000-8000-00000000000b","email":"coach-b@example.test","email_verified":true}',
   'email', now(), now(), now()),
  (gen_random_uuid(), 'c0000000-0000-4000-8000-00000000000c', 'c0000000-0000-4000-8000-00000000000c',
   '{"sub":"c0000000-0000-4000-8000-00000000000c","email":"admin@example.test","email_verified":true}',
   'email', now(), now(), now());

-- Administrateur de la plateforme (aucun accès implicite aux organisations, docs/02 §6).
insert into public.platform_admins (user_id) values ('c0000000-0000-4000-8000-00000000000c');

-- ---------------------------------------------------------------------
-- Deux organisations de test indépendantes (isolation multi-tenant)
-- ---------------------------------------------------------------------
insert into public.organizations (id, name, slug, created_by)
values
  ('0a000000-0000-4000-8000-0000000000a1', 'Organisation Démo A', 'demo-a', 'a0000000-0000-4000-8000-00000000000a'),
  ('0b000000-0000-4000-8000-0000000000b1', 'Organisation Démo B', 'demo-b', 'b0000000-0000-4000-8000-00000000000b');

insert into public.organization_members (organization_id, user_id, role)
values
  ('0a000000-0000-4000-8000-0000000000a1', 'a0000000-0000-4000-8000-00000000000a', 'owner'),
  ('0b000000-0000-4000-8000-0000000000b1', 'b0000000-0000-4000-8000-00000000000b', 'owner');
