-- « Supprimer mon compte » (18/11/2026, obligation légale) : un coach efface TOUTES les données de son
-- organisation, factures émises comprises ; jamais celles d'un autre coach ; jamais le compte d'un
-- sportif qui a le sien ; jamais une organisation partagée ; jamais le compte de démonstration
-- partagé. La fonction ne s'appelle que depuis le serveur (action « Supprimer mon compte », qui a
-- vérifié le mot tapé et effacé les fichiers avant) : jamais avec la session d'un coach.
begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(16);

insert into auth.users (id, email) values
  ('11111111-1111-4111-8111-111111111111', 'test-coach-a@example.test'),
  ('22222222-2222-4222-8222-222222222222', 'test-coach-b@example.test'),
  ('33333333-3333-4333-8333-333333333333', 'test-coach-c@example.test'),
  ('44444444-4444-4444-8444-444444444444', 'test-coach-d@example.test'),
  ('55555555-5555-4555-8555-555555555555', 'test-demo@example.test'),
  ('66666666-6666-4666-8666-666666666666', 'test-sportif-a@example.test');
insert into public.organizations (id, name, slug) values
  ('aaaaaaaa-0000-4000-8000-000000000001', 'Test Org A', 'test-org-a'),
  ('bbbbbbbb-0000-4000-8000-000000000002', 'Test Org B', 'test-org-b'),
  ('cccccccc-0000-4000-8000-000000000003', 'Test Org partagée', 'test-org-shared'),
  ('dddddddd-0000-4000-8000-000000000004', 'Test Org démo', 'test-org-demo');
insert into public.organization_members (organization_id, user_id, role) values
  ('aaaaaaaa-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 'owner'),
  ('bbbbbbbb-0000-4000-8000-000000000002', '22222222-2222-4222-8222-222222222222', 'owner'),
  ('cccccccc-0000-4000-8000-000000000003', '33333333-3333-4333-8333-333333333333', 'owner'),
  ('cccccccc-0000-4000-8000-000000000003', '44444444-4444-4444-8444-444444444444', 'coach'),
  ('dddddddd-0000-4000-8000-000000000004', '55555555-5555-4555-8555-555555555555', 'owner');
insert into private.demo_accounts (user_id, organization_id) values ('55555555-5555-4555-8555-555555555555', 'dddddddd-0000-4000-8000-000000000004');
-- Le sportif A a son propre compte (invitation acceptée).
insert into public.athlete_profiles (id, organization_id, first_name, athlete_user_id) values
  ('a1a1a1a1-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000001', 'Sportif A', '66666666-6666-4666-8666-666666666666'),
  ('b1b1b1b1-0000-4000-8000-000000000002', 'bbbbbbbb-0000-4000-8000-000000000002', 'Sportif B', null);
-- Une entité juridique, une facture brouillon et une facture ÉMISE (liens « restrict », facture émise
-- protégée) : la suppression du compte doit passer quand même.
insert into public.organization_legal_entities (id, organization_id, name, legal_form, vat_status) values
  ('e1e1e1e1-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000001', 'Coach A', 'independent', 'franchise'),
  ('e2e2e2e2-0000-4000-8000-000000000002', 'bbbbbbbb-0000-4000-8000-000000000002', 'Coach B', 'independent', 'franchise');
insert into public.athlete_invoices (organization_id, athlete_id, label, amount_cents, issued_on, due_on, status, legal_entity_id)
values ('aaaaaaaa-0000-4000-8000-000000000001', 'a1a1a1a1-0000-4000-8000-000000000001', 'Séances', 6500, '2026-11-01', '2026-11-15', 'draft', 'e1e1e1e1-0000-4000-8000-000000000001');
insert into public.athlete_invoices (organization_id, athlete_id, label, amount_cents, issued_on, due_on, status, legal_entity_id, number, number_year, number_seq, seller, issued_at, client_name, vat_rate) values
  ('aaaaaaaa-0000-4000-8000-000000000001', 'a1a1a1a1-0000-4000-8000-000000000001', 'Forfait', 12000, '2026-10-01', '2026-10-15', 'issued', 'e1e1e1e1-0000-4000-8000-000000000001', '2026-0001', 2026, 1, '{}', now(), 'Sportif A', 0),
  ('bbbbbbbb-0000-4000-8000-000000000002', 'b1b1b1b1-0000-4000-8000-000000000002', 'Forfait', 12000, '2026-10-01', '2026-10-15', 'issued', 'e2e2e2e2-0000-4000-8000-000000000002', '2026-0001', 2026, 1, '{}', now(), 'Sportif B', 0);

-- 1. Le coach A a un programme ; le serveur efface ses données : tout part, l'organisation B reste.
set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}';
select public.create_program(
  'aaaaaaaa-0000-4000-8000-000000000001', 'a1a1a1a1-0000-4000-8000-000000000001',
  'Programme A', 'running', '2027-03-01', 4, '{}'
);
-- Jamais avec la session d'un coach (même la sienne) : seulement depuis le serveur.
select throws_ok(
  $$ select public.delete_account_data('11111111-1111-4111-8111-111111111111') $$,
  '42501', null, 'Un coach connecté ne peut pas l''appeler lui-même'
);
reset role;
set local role service_role;
select lives_ok(
  $$ select public.delete_account_data('11111111-1111-4111-8111-111111111111') $$,
  'Le serveur efface les données du coach A'
);
reset role;
select is((select count(*)::int from public.organizations where id = 'aaaaaaaa-0000-4000-8000-000000000001'), 0, 'Son organisation a disparu');
select is((select count(*)::int from public.athlete_profiles where organization_id = 'aaaaaaaa-0000-4000-8000-000000000001'), 0, 'Ses sportifs aussi');
select is((select count(*)::int from public.programs where organization_id = 'aaaaaaaa-0000-4000-8000-000000000001'), 0, 'Ses programmes aussi');
select is((select count(*)::int from public.athlete_invoices where organization_id = 'aaaaaaaa-0000-4000-8000-000000000001'), 0, 'Ses factures aussi, émises comprises');
select is((select count(*)::int from auth.users where id = '66666666-6666-4666-8666-666666666666'), 1, 'Le sportif qui a son propre compte le garde');
select is((select count(*)::int from public.athlete_profiles where organization_id = 'bbbbbbbb-0000-4000-8000-000000000002'), 1, 'Le sportif du coach B est intact');
-- La protection des factures émises reste entière hors de la suppression d'un compte.
select throws_ok(
  $$ delete from public.athlete_invoices where organization_id = 'bbbbbbbb-0000-4000-8000-000000000002' $$,
  'P0001', 'Une facture émise ne se supprime pas.', 'Une facture émise du coach B ne se supprime toujours pas'
);

-- 2. Relancer après une étape qui a échoué plus loin (le compte) : rien à effacer, pas d'erreur.
set local role service_role;
select lives_ok(
  $$ select public.delete_account_data('11111111-1111-4111-8111-111111111111') $$,
  'Un nouvel essai ne trouve plus rien et passe'
);

-- 3. Une organisation partagée avec un autre coach : refus, rien n'est effacé.
select throws_ok(
  $$ select public.delete_account_data('33333333-3333-4333-8333-333333333333') $$,
  'CY412', null, 'Organisation partagée : refus'
);

-- 4. Le compte de démonstration ne se supprime jamais.
select throws_ok(
  $$ select public.delete_account_data('55555555-5555-4555-8555-555555555555') $$,
  '42501', null, 'Compte de démonstration : refus'
);
reset role;
select is((select count(*)::int from public.organizations where id = 'dddddddd-0000-4000-8000-000000000004'), 1, 'L''organisation de la démo est intacte');

-- 5. Droits : seulement le serveur.
select is(has_function_privilege('anon', 'public.delete_account_data(uuid)', 'execute'), false, 'Un visiteur sans compte ne peut pas l''appeler');
select is(has_function_privilege('authenticated', 'public.delete_account_data(uuid)', 'execute'), false, 'Un utilisateur connecté non plus');
select is(has_function_privilege('service_role', 'public.delete_account_data(uuid)', 'execute'), true, 'Le serveur, oui');

select * from finish();
rollback;
