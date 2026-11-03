-- Coory à l'international (D-69) : pays et devise de l'organisation, devise portée par chaque montant
-- (jamais choisie par le navigateur), taux de TVA libre, numéros hors Belgique, et l'étape
-- « Ta devise » de l'inscription (pays, devise, taux de TVA de l'organisation depuis D-90).
begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(16);

insert into auth.users (id, email, email_confirmed_at) values
  ('11111111-1111-4111-8111-111111111111', 'test-coach-a@example.test', now()),
  ('61616161-6161-4616-8616-616161616161', 'coach-suisse@example.test', now()),
  ('62626262-6262-4626-8626-626262626262', 'coach-plus-tard@example.test', now());
insert into public.organizations (id, name, slug) values
  ('aaaaaaaa-0000-4000-8000-000000000001', 'Test Org A', 'test-org-a');
insert into public.organization_members (organization_id, user_id, role) values
  ('aaaaaaaa-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 'owner');
insert into public.athlete_profiles (id, organization_id, first_name) values
  ('a1a1a1a1-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000001', 'Sportif A1');

select results_eq(
  $$ select country, currency from public.organizations where id = 'aaaaaaaa-0000-4000-8000-000000000001' $$,
  $$ values ('BE'::text, 'EUR'::text) $$,
  'Une organisation existante est en Belgique, en euros'
);
select throws_ok(
  $$ update public.organizations set currency = 'JPY' where id = 'aaaaaaaa-0000-4000-8000-000000000001' $$,
  '23514', null, 'Une devise sans centimes (yen) est refusée'
);

-- L'organisation passe en francs suisses (comme le fera l'étape 2, par une fonction dédiée).
update public.organizations set currency = 'CHF', country = 'CH'
where id = 'aaaaaaaa-0000-4000-8000-000000000001';

set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}';

select lives_ok(
  $$ insert into public.athlete_payments (id, organization_id, athlete_id, received_on, amount_cents,
       vat_rate, currency, method, created_by)
     values ('9c000000-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000001',
       'a1a1a1a1-0000-4000-8000-000000000001', '2026-10-20', 10810, 8.1, 'EUR', 'transfer',
       '11111111-1111-4111-8111-111111111111') $$,
  'Le coach note un paiement à 8,1 % (taux libre)'
);
select results_eq(
  $$ select currency, vat_rate from public.athlete_payments where id = '9c000000-0000-4000-8000-000000000001' $$,
  $$ values ('CHF'::text, 8.10::numeric) $$,
  'Le paiement prend la devise de l''organisation, même si le navigateur en envoie une autre'
);
select throws_ok(
  $$ insert into public.athlete_payments (organization_id, athlete_id, received_on, amount_cents,
       vat_rate, method, created_by)
     values ('aaaaaaaa-0000-4000-8000-000000000001', 'a1a1a1a1-0000-4000-8000-000000000001',
       '2026-10-20', 100, 120, 'cash', '11111111-1111-4111-8111-111111111111') $$,
  '23514', null, 'Un taux de TVA au-delà de 100 % est refusé'
);

insert into public.coach_sessions (id, organization_id, kind, title, athlete_id, starts_on, start_time,
  duration_minutes, repeats_weekly, price_cents, payment_method, created_by) values
  ('5e000000-0000-4000-8000-000000000009', 'aaaaaaaa-0000-4000-8000-000000000001', 'individual',
   'Coaching', 'a1a1a1a1-0000-4000-8000-000000000001', '2026-10-05', '07:00', 60, true, 6500,
   'transfer', '11111111-1111-4111-8111-111111111111');
select is(
  (select currency from public.coach_sessions where id = '5e000000-0000-4000-8000-000000000009'),
  'CHF', 'Le prix d''une séance est dans la devise de l''organisation'
);

-- Structures : formats belges seulement en Belgique ; un assujetti a un taux habituel.
select lives_ok(
  $$ insert into public.organization_legal_entities (organization_id, name, legal_form, vat_status,
       vat_number, default_vat_rate, enterprise_number, country, created_by)
     values ('aaaaaaaa-0000-4000-8000-000000000001', 'Studio Genève', 'independent', 'subject',
       'CHE-123.456.789 TVA', 8.1, 'CHE-123.456.789', 'CH', '11111111-1111-4111-8111-111111111111') $$,
  'Une structure suisse garde ses propres numéros et son taux de 8,1 %'
);
select throws_ok(
  $$ insert into public.organization_legal_entities (organization_id, name, legal_form, vat_status,
       vat_number, default_vat_rate, country, created_by)
     values ('aaaaaaaa-0000-4000-8000-000000000001', 'Faux belge', 'independent', 'subject',
       'FR40303265045', 21, 'BE', '11111111-1111-4111-8111-111111111111') $$,
  '23514', null, 'Une structure belge garde le format BE + 10 chiffres'
);
select throws_ok(
  $$ insert into public.organization_legal_entities (organization_id, name, legal_form, vat_status,
       vat_number, country, created_by)
     values ('aaaaaaaa-0000-4000-8000-000000000001', 'Sans taux', 'independent', 'subject',
       'FR40303265045', 'FR', '11111111-1111-4111-8111-111111111111') $$,
  '23514', null, 'Un assujetti sans taux habituel est refusé'
);

-- Facture en euros d'avant le changement : payée, le paiement reste en euros.
reset role;
insert into public.athlete_invoices (id, organization_id, athlete_id, label, amount_cents, issued_on,
  due_on, status, vat_rate, currency, client_name, created_by)
values ('1e000000-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000001',
  'a1a1a1a1-0000-4000-8000-000000000001', 'Forfait', 12100, '2026-10-01', '2026-10-15', 'draft', 21,
  'EUR', 'Sportif A1', '11111111-1111-4111-8111-111111111111');
set local role authenticated;
select lives_ok(
  $$ select public.mark_athlete_invoice_paid('1e000000-0000-4000-8000-000000000001', '2026-10-20', 'transfer') $$,
  'Le coach marque payée une facture en euros'
);
select is(
  (select p.currency from public.athlete_payments p
   join public.athlete_invoices i on i.payment_id = p.id
   where i.id = '1e000000-0000-4000-8000-000000000001'),
  'EUR', 'Le paiement d''une facture garde la devise de la facture'
);

-- Inscription : pays, devise et taux de TVA (étape « Ta devise », D-90 : plus de structure créée).
set local request.jwt.claims = '{"sub":"61616161-6161-4616-8616-616161616161","role":"authenticated"}';
select lives_ok(
  $$ select public.complete_signup('coach', 'Lina', 'Meier', null, 'Lina Coaching', '2026-10-23',
       'CH', 'CHF', 8.1) $$,
  'Un coach suisse s''inscrit avec sa TVA'
);
reset role;
select results_eq(
  $$ select o.country, o.currency, o.vat_rate from public.organizations o
     join public.organization_members m on m.organization_id = o.id
     where m.user_id = '61616161-6161-4616-8616-616161616161' $$,
  $$ values ('CH'::text, 'CHF'::text, 8.10::numeric) $$,
  'Son organisation est en Suisse, en francs suisses, avec son taux de TVA'
);
select is_empty(
  $$ select 1 from public.organization_legal_entities e
     join public.organization_members m on m.organization_id = e.organization_id
     where m.user_id = '61616161-6161-4616-8616-616161616161' $$,
  'Aucune structure n''est créée'
);

set local role authenticated;
set local request.jwt.claims = '{"sub":"62626262-6262-4626-8626-626262626262","role":"authenticated"}';
select lives_ok(
  $$ select public.complete_signup('coach', 'Tom', 'Durand', null, '', '2026-10-23', 'FR', 'EUR') $$,
  'Un coach peut s''inscrire sans TVA'
);
reset role;
select results_eq(
  $$ select o.vat_rate from public.organizations o
     join public.organization_members m on m.organization_id = o.id
     where m.user_id = '62626262-6262-4626-8626-626262626262' $$,
  $$ values (0::numeric) $$,
  'Sans TVA choisie, le taux vaut 0'
);

select * from finish();
rollback;
