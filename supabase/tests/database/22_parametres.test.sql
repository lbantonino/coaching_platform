-- Tests des Paramètres (D-57) : préférences du coach (bornes), renommage de l'organisation par son
-- seul propriétaire, structures légales (formats, TVA d'un assujetti, une seule par défaut, droits et
-- isolation entre organisations).
begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(12);

insert into auth.users (id, email) values
  ('11111111-1111-4111-8111-111111111111', 'test-owner-a@example.test'),
  ('22222222-2222-4222-8222-222222222222', 'test-owner-b@example.test'),
  ('44444444-4444-4444-8444-444444444444', 'test-coach-a@example.test');
insert into public.organizations (id, name, slug) values
  ('aaaaaaaa-0000-4000-8000-000000000001', 'Test Org A', 'test-org-a'),
  ('bbbbbbbb-0000-4000-8000-000000000002', 'Test Org B', 'test-org-b');
insert into public.organization_members (organization_id, user_id, role) values
  ('aaaaaaaa-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 'owner'),
  ('aaaaaaaa-0000-4000-8000-000000000001', '44444444-4444-4444-8444-444444444444', 'coach'),
  ('bbbbbbbb-0000-4000-8000-000000000002', '22222222-2222-4222-8222-222222222222', 'owner');
insert into public.coach_profiles (user_id, first_name) values
  ('11111111-1111-4111-8111-111111111111', 'Owner');

-- Préférences : bornes en base.
select throws_ok(
  $$ update public.coach_profiles set agenda_first_hour = 14 where user_id = '11111111-1111-4111-8111-111111111111' $$,
  '23514', null, 'L''agenda commence au plus tard à 12 h'
);
select throws_ok(
  $$ update public.coach_profiles set default_payment_method = 'cheque' where user_id = '11111111-1111-4111-8111-111111111111' $$,
  '23514', null, 'Le paiement par défaut est espèces ou virement'
);

-- Structures : formats et TVA d'un assujetti.
select throws_ok(
  $$ insert into public.organization_legal_entities (organization_id, name, legal_form, vat_status)
     values ('aaaaaaaa-0000-4000-8000-000000000001', 'Sans TVA', 'independent', 'subject') $$,
  '23514', null, 'Un assujetti à la TVA a un numéro de TVA'
);
select throws_ok(
  $$ insert into public.organization_legal_entities (organization_id, name, legal_form, vat_status, iban)
     values ('aaaaaaaa-0000-4000-8000-000000000001', 'IBAN faux', 'asbl', 'not_subject', 'pas-un-iban') $$,
  '23514', null, 'Un IBAN mal formé est refusé'
);

set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}';
select lives_ok(
  $$ insert into public.organization_legal_entities (id, organization_id, name, legal_form, enterprise_number,
       vat_status, vat_number, is_default, created_by)
     values ('7e000000-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000001', 'Activité',
             'independent', '0123456749', 'subject', 'BE0123456749', true, '11111111-1111-4111-8111-111111111111') $$,
  'Le propriétaire ajoute une structure par défaut'
);
select throws_ok(
  $$ insert into public.organization_legal_entities (organization_id, name, legal_form, vat_status, is_default, created_by)
     values ('aaaaaaaa-0000-4000-8000-000000000001', 'Deuxième', 'asbl', 'not_subject', true,
             '11111111-1111-4111-8111-111111111111') $$,
  '23505', null, 'Une seule structure par défaut par organisation'
);
select lives_ok(
  $$ update public.organizations set name = 'Org A renommée' where id = 'aaaaaaaa-0000-4000-8000-000000000001' $$,
  'Le propriétaire renomme son organisation'
);
select results_eq(
  $$ select name from public.organizations where id = 'aaaaaaaa-0000-4000-8000-000000000001' $$,
  $$ values ('Org A renommée'::text) $$,
  'Le nouveau nom est enregistré'
);
select throws_ok(
  $$ update public.organizations set status = 'suspended' where id = 'aaaaaaaa-0000-4000-8000-000000000001' $$,
  '42501', null, 'Le propriétaire ne change que le nom (pas le statut)'
);

-- Un coach (non propriétaire) voit les structures mais ne renomme pas l'organisation.
set local request.jwt.claims = '{"sub":"44444444-4444-4444-8444-444444444444","role":"authenticated"}';
select is(
  (select count(*)::int from public.organization_legal_entities),
  1,
  'Un coach de l''organisation lit ses structures'
);
update public.organizations set name = 'Renommée par un coach' where id = 'aaaaaaaa-0000-4000-8000-000000000001';
set local request.jwt.claims = '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}';
select results_eq(
  $$ select name from public.organizations where id = 'aaaaaaaa-0000-4000-8000-000000000001' $$,
  $$ values ('Org A renommée'::text) $$,
  'Un coach non propriétaire ne renomme pas l''organisation'
);

-- Isolation : l'organisation B ne voit rien de A.
set local request.jwt.claims = '{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}';
select is_empty(
  $$ select 1 from public.organization_legal_entities $$,
  'Le coach B ne lit aucune structure de l''organisation A'
);

select * from finish();
rollback;
