-- Tests des paiements reçus (D-36) : cohérence (montant, taux, mode), droits des coachs, isolation
-- entre organisations, et le sportif ne voit rien.
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

select throws_ok(
  $$ insert into public.athlete_payments (organization_id, athlete_id, received_on, amount_cents, method)
     values ('aaaaaaaa-0000-4000-8000-000000000001', 'a1a1a1a1-0000-4000-8000-000000000001', '2026-10-20', 0, 'cash') $$,
  '23514', null, 'Un paiement a un montant'
);
select throws_ok(
  $$ insert into public.athlete_payments (organization_id, athlete_id, received_on, amount_cents, vat_rate, method)
     values ('aaaaaaaa-0000-4000-8000-000000000001', 'a1a1a1a1-0000-4000-8000-000000000001', '2026-10-20', 100, 19, 'cash') $$,
  '23514', null, 'Le taux de TVA est 0, 6, 12 ou 21 %'
);
select throws_ok(
  $$ insert into public.athlete_payments (organization_id, athlete_id, received_on, amount_cents, method)
     values ('aaaaaaaa-0000-4000-8000-000000000001', 'a1a1a1a1-0000-4000-8000-000000000001', '2026-10-20', 100, 'cheque') $$,
  '23514', null, 'Le mode est espèces, virement, Bancontact ou autre'
);
select throws_ok(
  $$ insert into public.athlete_payments (organization_id, athlete_id, received_on, amount_cents, method)
     values ('aaaaaaaa-0000-4000-8000-000000000001', 'b1b1b1b1-0000-4000-8000-000000000001', '2026-10-20', 100, 'cash') $$,
  '23503', null, 'Un paiement reste dans l''organisation de son sportif'
);

set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}';
select lives_ok(
  $$ insert into public.athlete_payments (id, organization_id, athlete_id, received_on, amount_cents, method, label, created_by)
     values ('9a000000-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000001',
             'a1a1a1a1-0000-4000-8000-000000000001', '2026-10-20', 300000, 'transfer', 'Forfait 3 mois',
             '11111111-1111-4111-8111-111111111111') $$,
  'Coach A note un paiement reçu'
);
select throws_ok(
  $$ insert into public.athlete_payments (organization_id, athlete_id, received_on, amount_cents, method, created_by)
     values ('aaaaaaaa-0000-4000-8000-000000000001', 'a1a1a1a1-0000-4000-8000-000000000001', '2026-10-20', 100, 'cash',
             '22222222-2222-4222-8222-222222222222') $$,
  '42501', null, 'created_by est toujours la personne connectée'
);
select lives_ok(
  $$ update public.athlete_payments set method = 'cash' where id = '9a000000-0000-4000-8000-000000000001' $$,
  'Coach A corrige le mode de paiement'
);
select throws_ok(
  $$ update public.athlete_payments set athlete_id = 'a1a1a1a1-0000-4000-8000-000000000001'
     where id = '9a000000-0000-4000-8000-000000000001' $$,
  '42501', null, 'Le sportif d''un paiement ne se change pas'
);

set local request.jwt.claims = '{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}';
select is_empty($$ select 1 from public.athlete_payments $$, 'Coach B ne lit aucun paiement de l''organisation A');
set local request.jwt.claims = '{"sub":"33333333-3333-4333-8333-333333333333","role":"authenticated"}';
select is_empty($$ select 1 from public.athlete_payments $$, 'Le sportif ne lit aucun paiement');

set local role anon;
set local request.jwt.claims = '{"role":"anon"}';
select throws_ok($$ select 1 from public.athlete_payments $$, '42501', null, 'Un anonyme ne lit rien');

select * from finish();
rollback;
