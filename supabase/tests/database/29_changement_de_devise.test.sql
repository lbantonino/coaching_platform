-- Changement de devise (D-70) : propriétaire seulement ; le futur est converti (séances qui ont
-- encore des dates, brouillons sans paiement, prix par défaut), le passé reste dans sa devise
-- (paiements, factures émises, séances finies, brouillon relié à un paiement) ; historique gardé.
begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(14);

insert into auth.users (id, email) values
  ('11111111-1111-4111-8111-111111111111', 'test-coach-a@example.test'),
  ('12121212-1212-4121-8121-121212121212', 'test-coach-a2@example.test'),
  ('22222222-2222-4222-8222-222222222222', 'test-coach-b@example.test');
insert into public.organizations (id, name, slug) values
  ('aaaaaaaa-0000-4000-8000-000000000001', 'Test Org A', 'test-org-a'),
  ('bbbbbbbb-0000-4000-8000-000000000002', 'Test Org B', 'test-org-b');
insert into public.organization_members (organization_id, user_id, role) values
  ('aaaaaaaa-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 'owner'),
  ('aaaaaaaa-0000-4000-8000-000000000001', '12121212-1212-4121-8121-121212121212', 'coach'),
  ('bbbbbbbb-0000-4000-8000-000000000002', '22222222-2222-4222-8222-222222222222', 'owner');
insert into public.coach_profiles (user_id, first_name, default_price_cents) values
  ('11111111-1111-4111-8111-111111111111', 'Coach A', 6500);
insert into public.athlete_profiles (id, organization_id, first_name) values
  ('a1a1a1a1-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000001', 'Sportif A1');

-- Séances : une hebdomadaire sans fin (à venir), une unique passée, une unique future.
insert into public.coach_sessions (id, organization_id, kind, title, athlete_id, starts_on, ends_on,
  start_time, duration_minutes, repeats_weekly, price_cents, payment_method) values
  ('5e000000-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000001', 'individual',
   'Hebdo', 'a1a1a1a1-0000-4000-8000-000000000001', '2026-01-05', null, '07:00', 60, true, 10000, 'transfer'),
  ('5e000000-0000-4000-8000-000000000002', 'aaaaaaaa-0000-4000-8000-000000000001', 'individual',
   'Passée', 'a1a1a1a1-0000-4000-8000-000000000001', '2020-01-06', null, '07:00', 60, false, 10000, 'transfer'),
  ('5e000000-0000-4000-8000-000000000003', 'aaaaaaaa-0000-4000-8000-000000000001', 'individual',
   'Future', 'a1a1a1a1-0000-4000-8000-000000000001', '2099-01-05', null, '07:00', 60, false, 10000, 'cash');
-- Argent réel : un paiement, une facture émise ; un brouillon libre et un brouillon relié au paiement.
insert into public.athlete_payments (id, organization_id, athlete_id, received_on, amount_cents, vat_rate, method)
values ('9d000000-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000001',
  'a1a1a1a1-0000-4000-8000-000000000001', '2026-10-20', 12100, 21, 'transfer');
insert into public.athlete_invoices (id, organization_id, athlete_id, label, amount_cents, issued_on,
  due_on, status, number, number_year, number_seq, issued_at, vat_rate, client_name, payment_id) values
  ('1f000000-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000001',
   'a1a1a1a1-0000-4000-8000-000000000001', 'Émise', 12100, '2026-10-01', '2026-10-15', 'issued',
   'TST-2026-0001', 2026, 1, now(), 21, 'Sportif A1', null),
  ('1f000000-0000-4000-8000-000000000002', 'aaaaaaaa-0000-4000-8000-000000000001',
   'a1a1a1a1-0000-4000-8000-000000000001', 'Brouillon libre', 10000, '2026-10-01', '2026-10-15',
   'draft', null, null, null, null, 21, 'Sportif A1', null),
  ('1f000000-0000-4000-8000-000000000003', 'aaaaaaaa-0000-4000-8000-000000000001',
   'a1a1a1a1-0000-4000-8000-000000000001', 'Brouillon relié', 12100, '2026-10-01', '2026-10-15',
   'draft', null, null, null, null, 21, 'Sportif A1', '9d000000-0000-4000-8000-000000000001');

set local role authenticated;

-- Un coach non propriétaire, puis le propriétaire d'une autre organisation : refusés.
set local request.jwt.claims = '{"sub":"12121212-1212-4121-8121-121212121212","role":"authenticated"}';
select throws_ok(
  $$ select public.change_organization_currency('aaaaaaaa-0000-4000-8000-000000000001', 'CHF', 0.94) $$,
  '42501', null, 'Un coach non propriétaire ne change pas la devise'
);
set local request.jwt.claims = '{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}';
select throws_ok(
  $$ select public.change_organization_currency('aaaaaaaa-0000-4000-8000-000000000001', 'CHF', 0.94) $$,
  '42501', null, 'Le propriétaire d''une autre organisation non plus'
);

set local request.jwt.claims = '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}';
select throws_ok(
  $$ select public.change_organization_currency('aaaaaaaa-0000-4000-8000-000000000001', 'EUR', 1) $$,
  'P0001', null, 'Changer vers la même devise est refusé'
);
select throws_ok(
  $$ select public.change_organization_currency('aaaaaaaa-0000-4000-8000-000000000001', 'CHF', 0) $$,
  'P0001', null, 'Un taux nul est refusé'
);
select results_eq(
  $$ select public.change_organization_currency('aaaaaaaa-0000-4000-8000-000000000001', 'CHF', 0.94) $$,
  $$ values ('{"drafts": 1, "expenses": 0, "sessions": 2, "defaultPrices": 1}'::jsonb) $$,
  'Le propriétaire passe en francs suisses : 2 séances, 1 brouillon, 1 prix par défaut convertis'
);

reset role;
select is(
  (select currency from public.organizations where id = 'aaaaaaaa-0000-4000-8000-000000000001'),
  'CHF', 'L''organisation est en francs suisses'
);
select results_eq(
  $$ select title, price_cents, currency from public.coach_sessions
     where organization_id = 'aaaaaaaa-0000-4000-8000-000000000001' order by title $$,
  $$ values ('Future'::text, 9400, 'CHF'::text), ('Hebdo', 9400, 'CHF'), ('Passée', 10000, 'EUR') $$,
  'Les séances à venir sont converties ; la séance passée garde son prix en euros'
);
select results_eq(
  $$ select label, amount_cents, currency from public.athlete_invoices
     where organization_id = 'aaaaaaaa-0000-4000-8000-000000000001' order by label $$,
  $$ values ('Brouillon libre'::text, 9400, 'CHF'::text), ('Brouillon relié', 12100, 'EUR'),
       ('Émise', 12100, 'EUR') $$,
  'Le brouillon libre est converti ; l''émise et le brouillon relié au paiement restent en euros'
);
select results_eq(
  $$ select amount_cents, currency from public.athlete_payments
     where id = '9d000000-0000-4000-8000-000000000001' $$,
  $$ values (12100, 'EUR'::text) $$,
  'Le paiement reçu reste en euros'
);
select is(
  (select default_price_cents from public.coach_profiles
   where user_id = '11111111-1111-4111-8111-111111111111'),
  6110, 'Le prix par défaut est converti (65 € -> 61,10 CHF)'
);
select results_eq(
  $$ select from_currency, to_currency, rate from public.organization_currency_changes
     where organization_id = 'aaaaaaaa-0000-4000-8000-000000000001' $$,
  $$ values ('EUR'::text, 'CHF'::text, 0.94::numeric) $$,
  'Le changement est gardé dans l''historique'
);

set local role authenticated;
set local request.jwt.claims = '{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}';
select is_empty(
  $$ select 1 from public.organization_currency_changes
     where organization_id = 'aaaaaaaa-0000-4000-8000-000000000001' $$,
  'Une autre organisation ne lit pas cet historique'
);
set local request.jwt.claims = '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}';
select throws_ok(
  $$ insert into public.organization_currency_changes (organization_id, from_currency, to_currency,
       rate, changed_on) values ('aaaaaaaa-0000-4000-8000-000000000001', 'CHF', 'EUR', 1, current_date) $$,
  '42501', null, 'Aucune écriture directe dans l''historique'
);
select throws_ok(
  $$ update public.organizations set currency = 'EUR' where id = 'aaaaaaaa-0000-4000-8000-000000000001' $$,
  '42501', null, 'La devise ne change que par la fonction dédiée'
);

select * from finish();
rollback;
