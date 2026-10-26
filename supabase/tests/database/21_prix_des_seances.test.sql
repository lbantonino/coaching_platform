-- Tests du prix des séances et de leurs paiements (D-52) : cohérence prix / mode, une seule fois par
-- date, collective payée sans sportif, paiement gardé quand la séance est supprimée, droits et
-- isolation entre organisations.
begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(13);

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
  ('a1a1a1a1-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000001', 'Sportif A1');
insert into public.coach_sessions (id, organization_id, kind, title, athlete_id, starts_on, start_time,
  duration_minutes, repeats_weekly, price_cents, payment_method) values
  ('5e000000-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000001', 'individual',
   'Coaching force', 'a1a1a1a1-0000-4000-8000-000000000001', '2026-10-05', '07:00', 60, true, 6500, 'transfer'),
  ('5e000000-0000-4000-8000-000000000002', 'aaaaaaaa-0000-4000-8000-000000000001', 'group',
   'Mobilité & gainage', null, '2026-10-09', '07:00', 60, true, 6500, 'cash');

select throws_ok(
  $$ update public.coach_sessions set payment_method = null where id = '5e000000-0000-4000-8000-000000000001' $$,
  '23514', null, 'Un prix a toujours son mode de paiement'
);
select throws_ok(
  $$ update public.coach_sessions set payment_method = 'bancontact' where id = '5e000000-0000-4000-8000-000000000001' $$,
  '23514', null, 'Le mode d''une séance est espèces ou virement'
);
select throws_ok(
  $$ insert into public.athlete_payments (organization_id, received_on, amount_cents, method, session_id, session_date)
     values ('aaaaaaaa-0000-4000-8000-000000000001', '2026-10-26', 6500, 'cash',
             '5e000000-0000-4000-8000-000000000002', '2026-10-23') $$,
  '23514', null, 'Un paiement sans sportif porte un libellé'
);

select throws_ok(
  $$ insert into public.athlete_payments (organization_id, athlete_id, received_on, amount_cents, method, covers_from, covers_to)
     values ('aaaaaaaa-0000-4000-8000-000000000001', 'a1a1a1a1-0000-4000-8000-000000000001', '2026-10-26', 150000, 'transfer',
             '2027-01-01', '2026-10-01') $$,
  '23514', null, 'Un forfait finit après son début'
);
select throws_ok(
  $$ insert into public.athlete_payments (organization_id, received_on, amount_cents, method, label, covers_from, covers_to)
     values ('aaaaaaaa-0000-4000-8000-000000000001', '2026-10-26', 150000, 'transfer', 'Forfait', '2026-10-01', '2027-01-01') $$,
  '23514', null, 'Un forfait est toujours celui d''un sportif'
);

set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}';
select lives_ok(
  $$ insert into public.athlete_payments (organization_id, athlete_id, received_on, amount_cents, method, label, covers_from,
       covers_to, created_by)
     values ('aaaaaaaa-0000-4000-8000-000000000001', 'a1a1a1a1-0000-4000-8000-000000000001', '2026-10-26', 150000, 'transfer',
             'Forfait 3 mois', '2026-10-26', '2027-01-25', '11111111-1111-4111-8111-111111111111') $$,
  'Coach A note un forfait de 3 mois'
);
select lives_ok(
  $$ update public.coach_sessions set price_cents = 7000, price_vat_included = false
     where id = '5e000000-0000-4000-8000-000000000001' $$,
  'Coach A modifie le prix et la TVA de sa séance'
);
select lives_ok(
  $$ insert into public.athlete_payments (organization_id, athlete_id, received_on, amount_cents, vat_rate, method,
       label, session_id, session_date, created_by)
     values ('aaaaaaaa-0000-4000-8000-000000000001', 'a1a1a1a1-0000-4000-8000-000000000001', '2026-10-26', 7000, 0,
             'transfer', 'Coaching force', '5e000000-0000-4000-8000-000000000001', '2026-10-26',
             '11111111-1111-4111-8111-111111111111') $$,
  'Coach A marque une date payée'
);
select throws_ok(
  $$ insert into public.athlete_payments (organization_id, athlete_id, received_on, amount_cents, method, label,
       session_id, session_date, created_by)
     values ('aaaaaaaa-0000-4000-8000-000000000001', 'a1a1a1a1-0000-4000-8000-000000000001', '2026-10-26', 7000,
             'transfer', 'Coaching force', '5e000000-0000-4000-8000-000000000001', '2026-10-26',
             '11111111-1111-4111-8111-111111111111') $$,
  '23505', null, 'Une date de séance n''est payée qu''une fois'
);
select lives_ok(
  $$ insert into public.athlete_payments (organization_id, received_on, amount_cents, method, label, session_id,
       session_date, created_by)
     values ('aaaaaaaa-0000-4000-8000-000000000001', '2026-10-26', 6500, 'cash', 'Mobilité & gainage · 23/10',
             '5e000000-0000-4000-8000-000000000002', '2026-10-23', '11111111-1111-4111-8111-111111111111') $$,
  'Une collective se paie en une fois, sans sportif'
);
select throws_ok(
  $$ update public.athlete_payments set session_date = '2026-10-19'
     where session_id = '5e000000-0000-4000-8000-000000000001' $$,
  '42501', null, 'La date payée ne se change pas (on annule et on refait)'
);

set local request.jwt.claims = '{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}';
select is_empty(
  $$ select 1 from public.coach_sessions where price_cents is not null $$,
  'Coach B ne lit pas les prix de l''organisation A'
);

-- Séance supprimée : l'argent a été reçu, le paiement reste (sans lien).
set local request.jwt.claims = '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}';
delete from public.coach_sessions where id = '5e000000-0000-4000-8000-000000000002';
select results_eq(
  $$ select session_id, session_date::text from public.athlete_payments where label = 'Mobilité & gainage · 23/10' $$,
  $$ values (null::uuid, '2026-10-23') $$,
  'Le paiement d''une séance supprimée reste, sans lien vers elle'
);

select * from finish();
rollback;
