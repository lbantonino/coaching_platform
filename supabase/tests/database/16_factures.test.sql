-- Tests du suivi des factures (4a, D-35 / D-17 étape A) : cohérence des dates et montants, lecture par
-- les seuls coachs de l'organisation, aucune écriture depuis le navigateur pour l'instant.
begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(11);

insert into auth.users (id, email) values
  ('11111111-1111-4111-8111-111111111111', 'test-coach-a@example.test'),
  ('22222222-2222-4222-8222-222222222222', 'test-coach-b@example.test'),
  ('33333333-3333-4333-8333-333333333333', 'test-sportif-a@example.test');
insert into public.organizations (id, name, slug) values
  ('aaaaaaaa-0000-4000-8000-000000000001', 'Test Org A', 'test-org-a'),
  ('bbbbbbbb-0000-4000-8000-000000000002', 'Test Org B', 'test-org-b');
insert into public.organization_members (organization_id, user_id, role) values
  ('aaaaaaaa-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 'owner'),
  ('bbbbbbbb-0000-4000-8000-000000000002', '22222222-2222-4222-8222-222222222222', 'owner');
insert into public.athlete_profiles (id, organization_id, first_name, athlete_user_id) values
  ('a1a1a1a1-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000001', 'Sportif A1',
   '33333333-3333-4333-8333-333333333333'),
  ('b1b1b1b1-0000-4000-8000-000000000001', 'bbbbbbbb-0000-4000-8000-000000000002', 'Sportif B', null);
insert into public.athlete_invoices (id, organization_id, athlete_id, label, amount_cents, issued_on, due_on) values
  ('fa000000-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000001',
   'a1a1a1a1-0000-4000-8000-000000000001', 'Forfait A', 15000, '2026-10-01', '2026-10-15'),
  ('fb000000-0000-4000-8000-000000000001', 'bbbbbbbb-0000-4000-8000-000000000002',
   'b1b1b1b1-0000-4000-8000-000000000001', 'Forfait B', 9000, '2026-10-01', '2026-10-15');

-- ---------------------------------------------------------------------
-- Cohérence (contraintes en base)
-- ---------------------------------------------------------------------
select throws_ok(
  $$ insert into public.athlete_invoices (organization_id, athlete_id, label, amount_cents, issued_on, due_on)
     values ('aaaaaaaa-0000-4000-8000-000000000001', 'a1a1a1a1-0000-4000-8000-000000000001', 'Gratuite', 0,
             '2026-10-01', '2026-10-15') $$,
  '23514', null, 'Un montant est strictement positif'
);
select throws_ok(
  $$ insert into public.athlete_invoices (organization_id, athlete_id, label, amount_cents, issued_on, due_on)
     values ('aaaaaaaa-0000-4000-8000-000000000001', 'a1a1a1a1-0000-4000-8000-000000000001', 'Échéance', 100,
             '2026-10-15', '2026-10-01') $$,
  '23514', null, 'L''échéance ne précède pas l''envoi'
);
select throws_ok(
  $$ insert into public.athlete_invoices (organization_id, athlete_id, label, amount_cents, issued_on, due_on, paid_on)
     values ('aaaaaaaa-0000-4000-8000-000000000001', 'a1a1a1a1-0000-4000-8000-000000000001', 'Payée avant', 100,
             '2026-10-15', '2026-10-30', '2026-10-01') $$,
  '23514', null, 'Un paiement ne précède pas l''envoi'
);
select throws_ok(
  $$ insert into public.athlete_invoices (organization_id, athlete_id, label, amount_cents, issued_on, due_on)
     values ('aaaaaaaa-0000-4000-8000-000000000001', 'b1b1b1b1-0000-4000-8000-000000000001', 'Sportif de B', 100,
             '2026-10-01', '2026-10-15') $$,
  '23503', null, 'Une facture reste dans l''organisation de son sportif'
);

-- ---------------------------------------------------------------------
-- Coach A : lecture de SON organisation, aucune écriture pour l'instant
-- ---------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}';
select results_eq(
  $$ select label from public.athlete_invoices $$,
  $$ values ('Forfait A'::text) $$,
  'Coach A lit les factures de son organisation, et seulement elles'
);
select throws_ok(
  $$ insert into public.athlete_invoices (organization_id, athlete_id, label, amount_cents, issued_on, due_on)
     values ('aaaaaaaa-0000-4000-8000-000000000001', 'a1a1a1a1-0000-4000-8000-000000000001', 'Nouvelle', 100,
             '2026-10-01', '2026-10-15') $$,
  '42501', null, 'Pas encore de saisie de facture (page Facturation, 4f)'
);
select throws_ok(
  $$ update public.athlete_invoices set paid_on = '2026-10-10' where id = 'fa000000-0000-4000-8000-000000000001' $$,
  '42501', null, 'Pas encore de saisie de paiement (page Facturation, 4f)'
);
select throws_ok(
  $$ delete from public.athlete_invoices where id = 'fa000000-0000-4000-8000-000000000001' $$,
  '42501', null, 'Une facture ne se supprime pas'
);

-- ---------------------------------------------------------------------
-- Coach B et le sportif
-- ---------------------------------------------------------------------
set local request.jwt.claims = '{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}';
select results_eq(
  $$ select label from public.athlete_invoices $$,
  $$ values ('Forfait B'::text) $$,
  'Coach B ne lit aucune facture de l''organisation A'
);
set local request.jwt.claims = '{"sub":"33333333-3333-4333-8333-333333333333","role":"authenticated"}';
select is_empty($$ select 1 from public.athlete_invoices $$, 'Le sportif ne lit encore aucune facture');

set local role anon;
set local request.jwt.claims = '{"role":"anon"}';
select throws_ok($$ select 1 from public.athlete_invoices $$, '42501', null, 'Un anonyme ne lit rien');

select * from finish();
rollback;
