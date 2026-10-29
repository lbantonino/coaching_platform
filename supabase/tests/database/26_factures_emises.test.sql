-- Tests des factures émises (D-65) : brouillon modifiable, émission numérotée par structure et par
-- année sans trou, facture émise figée (ni modification ni suppression), une facture par paiement,
-- structure sans TVA, isolation entre organisations.
begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(17);

insert into auth.users (id, email) values
  ('11111111-1111-4111-8111-111111111111', 'test-coach-a@example.test'),
  ('22222222-2222-4222-8222-222222222222', 'test-coach-b@example.test');
insert into public.organizations (id, name, slug) values
  ('aaaaaaaa-0000-4000-8000-000000000001', 'Test Org A', 'test-org-a'),
  ('bbbbbbbb-0000-4000-8000-000000000002', 'Test Org B', 'test-org-b');
insert into public.organization_members (organization_id, user_id, role) values
  ('aaaaaaaa-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 'owner'),
  ('bbbbbbbb-0000-4000-8000-000000000002', '22222222-2222-4222-8222-222222222222', 'owner');
insert into public.athlete_profiles (id, organization_id, first_name) values
  ('a1a1a1a1-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000001', 'Sportif A');
insert into public.organization_legal_entities (id, organization_id, name, legal_form, vat_status,
  vat_number, default_vat_rate, invoice_prefix, is_default) values
  ('e1e1e1e1-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000001', 'Structure TVA',
   'independent', 'subject', 'BE0123456749', 21, 'TST', true),
  ('e2e2e2e2-0000-4000-8000-000000000002', 'aaaaaaaa-0000-4000-8000-000000000001', 'ASBL test',
   'asbl', 'not_subject', null, null, 'ASBL', false);
insert into public.athlete_payments (id, organization_id, athlete_id, received_on, amount_cents,
  vat_rate, method)
values
  ('f1f1f1f1-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000001',
   'a1a1a1a1-0000-4000-8000-000000000001', '2026-10-20', 7865, 21, 'transfer'),
  ('f2f2f2f2-0000-4000-8000-000000000002', 'aaaaaaaa-0000-4000-8000-000000000001',
   'a1a1a1a1-0000-4000-8000-000000000001', '2026-10-21', 7865, 21, 'transfer');

set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}';

-- Deux brouillons, un par paiement.
insert into public.athlete_invoices (id, organization_id, athlete_id, label, amount_cents, issued_on,
  due_on, paid_on, status, legal_entity_id, payment_id, vat_rate, client_name, created_by)
values
  ('c1c1c1c1-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000001',
   'a1a1a1a1-0000-4000-8000-000000000001', 'Séance', 7865, '2026-10-29', '2026-10-29', '2026-10-20',
   'draft', 'e1e1e1e1-0000-4000-8000-000000000001', 'f1f1f1f1-0000-4000-8000-000000000001', 21,
   'Sportif A', '11111111-1111-4111-8111-111111111111'),
  ('c2c2c2c2-0000-4000-8000-000000000002', 'aaaaaaaa-0000-4000-8000-000000000001',
   'a1a1a1a1-0000-4000-8000-000000000001', 'Séance', 7865, '2026-10-29', '2026-10-29', '2026-10-21',
   'draft', 'e1e1e1e1-0000-4000-8000-000000000001', 'f2f2f2f2-0000-4000-8000-000000000002', 21,
   'Sportif A', '11111111-1111-4111-8111-111111111111');

select throws_ok(
  $$ insert into public.athlete_invoices (organization_id, athlete_id, label, amount_cents, issued_on,
       due_on, status, payment_id, created_by)
     values ('aaaaaaaa-0000-4000-8000-000000000001', 'a1a1a1a1-0000-4000-8000-000000000001', 'Bis', 100,
       '2026-10-29', '2026-10-29', 'draft', 'f1f1f1f1-0000-4000-8000-000000000001',
       '11111111-1111-4111-8111-111111111111') $$,
  '23505', null, 'Un paiement n''a qu''une facture'
);
select throws_ok(
  $$ insert into public.athlete_invoices (organization_id, athlete_id, label, amount_cents, issued_on,
       due_on, status, number, created_by)
     values ('aaaaaaaa-0000-4000-8000-000000000001', 'a1a1a1a1-0000-4000-8000-000000000001', 'Faux', 100,
       '2026-10-29', '2026-10-29', 'draft', 'X-1', '11111111-1111-4111-8111-111111111111') $$,
  null, null, 'Un brouillon n''a pas de numéro'
);

update public.athlete_invoices set label = 'Séance du 20 octobre'
where id = 'c1c1c1c1-0000-4000-8000-000000000001';
select is(
  (select label from public.athlete_invoices where id = 'c1c1c1c1-0000-4000-8000-000000000001'),
  'Séance du 20 octobre', 'Un brouillon se modifie'
);

-- Émission : numéros qui se suivent, préfixe et année de la structure.
select is(
  public.issue_athlete_invoice('c1c1c1c1-0000-4000-8000-000000000001'),
  'TST-' || extract(year from (now() at time zone 'Europe/Brussels'))::text || '-0001',
  'La première facture émise porte le numéro 0001'
);
select is(
  public.issue_athlete_invoice('c2c2c2c2-0000-4000-8000-000000000002'),
  'TST-' || extract(year from (now() at time zone 'Europe/Brussels'))::text || '-0002',
  'La suivante porte le numéro 0002, sans trou'
);
select is(
  (select seller ->> 'vatNumber' from public.athlete_invoices
   where id = 'c1c1c1c1-0000-4000-8000-000000000001'),
  'BE0123456749', 'La structure est copiée dans la facture émise'
);
select throws_ok(
  $$ select public.issue_athlete_invoice('c1c1c1c1-0000-4000-8000-000000000001') $$,
  'P0001', null, 'Une facture ne s''émet qu''une fois'
);

-- Facture émise : figée.
update public.athlete_invoices set label = 'Modifiée'
where id = 'c1c1c1c1-0000-4000-8000-000000000001';
select is(
  (select label from public.athlete_invoices where id = 'c1c1c1c1-0000-4000-8000-000000000001'),
  'Séance du 20 octobre', 'Le coach ne modifie pas une facture émise (RLS)'
);
delete from public.athlete_invoices where id = 'c1c1c1c1-0000-4000-8000-000000000001';
select isnt_empty(
  $$ select 1 from public.athlete_invoices where id = 'c1c1c1c1-0000-4000-8000-000000000001' $$,
  'Le coach ne supprime pas une facture émise (RLS)'
);
reset role;
select throws_ok(
  $$ update public.athlete_invoices set amount_cents = 1
     where id = 'c1c1c1c1-0000-4000-8000-000000000001' $$,
  'P0001', null, 'Même hors RLS, une facture émise ne se modifie pas'
);
select lives_ok(
  $$ delete from public.athlete_payments where id = 'f1f1f1f1-0000-4000-8000-000000000001' $$,
  'Le paiement d''une facture émise peut être supprimé (le lien tombe, la facture reste)'
);

-- Structure non assujettie : pas de TVA sur ses factures.
set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}';
insert into public.athlete_invoices (id, organization_id, athlete_id, label, amount_cents, issued_on,
  due_on, status, legal_entity_id, vat_rate, client_name, created_by)
values ('c3c3c3c3-0000-4000-8000-000000000003', 'aaaaaaaa-0000-4000-8000-000000000001',
  'a1a1a1a1-0000-4000-8000-000000000001', 'Cotisation', 5000, '2026-10-29', '2026-10-29', 'draft',
  'e2e2e2e2-0000-4000-8000-000000000002', 21, 'Sportif A', '11111111-1111-4111-8111-111111111111');
select throws_ok(
  $$ select public.issue_athlete_invoice('c3c3c3c3-0000-4000-8000-000000000003') $$,
  'P0001', null, 'Une structure sans TVA n''émet pas de facture à 21 %'
);

-- Facture « à payer » marquée payée : le vrai paiement est créé et relié, même une fois émise.
insert into public.athlete_invoices (id, organization_id, athlete_id, label, amount_cents, issued_on,
  due_on, status, legal_entity_id, vat_rate, client_name, created_by)
values ('c4c4c4c4-0000-4000-8000-000000000004', 'aaaaaaaa-0000-4000-8000-000000000001',
  'a1a1a1a1-0000-4000-8000-000000000001', 'À payer', 12100, '2026-10-29', '2026-11-15', 'draft',
  'e1e1e1e1-0000-4000-8000-000000000001', 21, 'Sportif A', '11111111-1111-4111-8111-111111111111');
select public.issue_athlete_invoice('c4c4c4c4-0000-4000-8000-000000000004');
select isnt(
  public.mark_athlete_invoice_paid('c4c4c4c4-0000-4000-8000-000000000004', '2026-10-29', 'transfer'),
  null, 'Une facture émise à payer se marque payée'
);
select results_eq(
  $$ select p.amount_cents, p.method from public.athlete_payments p
     join public.athlete_invoices i on i.payment_id = p.id
     where i.id = 'c4c4c4c4-0000-4000-8000-000000000004' $$,
  $$ values (12100, 'transfer'::text) $$,
  'Le paiement reçu est créé avec le montant de la facture, et relié'
);
select throws_ok(
  $$ select public.mark_athlete_invoice_paid('c4c4c4c4-0000-4000-8000-000000000004', '2026-10-29', 'transfer') $$,
  'P0001', null, 'Une facture ne se paie qu''une fois'
);

-- Isolation : l'organisation B ne voit ni n'émet les factures de A.
set local request.jwt.claims = '{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}';
select is_empty(
  $$ select 1 from public.athlete_invoices $$,
  'Le coach B ne lit aucune facture de l''organisation A'
);
select throws_ok(
  $$ select public.issue_athlete_invoice('c3c3c3c3-0000-4000-8000-000000000003') $$,
  'P0002', null, 'Le coach B n''émet pas une facture de A'
);

select * from finish();
rollback;
