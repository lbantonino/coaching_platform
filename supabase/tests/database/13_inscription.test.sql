-- Tests de l'inscription libre (D-30) : finalisation coach et sportif, conditions acceptées,
-- adresse confirmée obligatoire, une seule finalisation, aucune écriture directe.
begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(12);

insert into auth.users (id, email, email_confirmed_at) values
  ('51515151-5151-4515-8515-515151515151', 'nouveau-coach@example.test', now()),
  ('52525252-5252-4525-8525-525252525252', 'nouveau-sportif@example.test', now()),
  ('53535353-5353-4535-8535-535353535353', 'pas-confirme@example.test', null);

-- ---------------------------------------------------------------------
-- Nouveau coach connecté
-- ---------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims = '{"sub":"51515151-5151-4515-8515-515151515151","role":"authenticated"}';

select throws_ok(
  $$ select public.complete_signup('coach', 'Léa', 'Martin', null, 'Studio Léa', '') $$,
  'P0001', 'conditions_non_acceptees',
  'Sans acceptation des conditions, rien n''est créé'
);
select results_eq(
  $$ select public.complete_signup('coach', ' Léa ', 'Martin', '+32 470 12 34 56', 'Studio Léa', '2026-10-23') $$,
  $$ values ('coach'::text) $$,
  'Un coach finalise son inscription'
);
select results_eq(
  $$ select o.name, m.role from public.organizations o
     join public.organization_members m on m.organization_id = o.id
     where m.user_id = '51515151-5151-4515-8515-515151515151' $$,
  $$ values ('Studio Léa'::text, 'owner'::text) $$,
  'Il devient propriétaire de sa propre organisation'
);
select results_eq(
  $$ select first_name, phone, company_name from public.coach_profiles
     where user_id = '51515151-5151-4515-8515-515151515151' $$,
  $$ values ('Léa'::text, '+32 470 12 34 56'::text, 'Studio Léa'::text) $$,
  'Son profil de coach est rempli (prénom nettoyé, téléphone, entreprise)'
);
select results_eq(
  $$ select kind, terms_version from public.account_signups $$,
  $$ values ('coach'::text, '2026-10-23'::text) $$,
  'L''acceptation des conditions est enregistrée avec sa version'
);
select throws_ok(
  $$ select public.complete_signup('coach', 'Léa', 'Martin', null, 'Deuxième studio', '2026-10-23') $$,
  'P0001', 'deja_inscrit',
  'Une seule finalisation par compte'
);
select throws_ok(
  $$ insert into public.account_signups (user_id, kind, first_name, last_name, terms_version)
     values ('52525252-5252-4525-8525-525252525252', 'coach', 'Faux', 'Coach', 'x') $$,
  '42501', null,
  'Aucune écriture directe dans les inscriptions'
);

-- ---------------------------------------------------------------------
-- Nouveau sportif connecté
-- ---------------------------------------------------------------------
set local request.jwt.claims = '{"sub":"52525252-5252-4525-8525-525252525252","role":"authenticated"}';
select results_eq(
  $$ select public.complete_signup('athlete', 'Sam', 'Lefort', null, 'Ignoré', '2026-10-23') $$,
  $$ values ('athlete'::text) $$,
  'Un sportif finalise son inscription'
);
select is_empty(
  $$ select 1 from public.organization_members where user_id = '52525252-5252-4525-8525-525252525252' $$,
  'Un sportif ne crée aucune organisation'
);
select results_eq(
  $$ select count(*)::int from public.account_signups $$,
  $$ values (1) $$,
  'Chacun ne lit que sa propre inscription'
);

-- ---------------------------------------------------------------------
-- Adresse non confirmée, puis anonyme
-- ---------------------------------------------------------------------
set local request.jwt.claims = '{"sub":"53535353-5353-4535-8535-535353535353","role":"authenticated"}';
select throws_ok(
  $$ select public.complete_signup('coach', 'Max', 'Dupont', null, null, '2026-10-23') $$,
  'P0001', 'email_non_confirme',
  'Adresse e-mail non confirmée : pas d''organisation'
);

reset role;
set local role anon;
set local request.jwt.claims = '{"role":"anon"}';
select throws_ok(
  $$ select public.complete_signup('coach', 'Anonyme', 'X', null, null, '2026-10-23') $$,
  '42501', null,
  'Un anonyme ne peut pas appeler la fonction'
);

select * from finish();
rollback;
