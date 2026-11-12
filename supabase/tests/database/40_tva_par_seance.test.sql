-- Tests de la TVA d'une séance (D-163) : 0 % par défaut, un taux entre 0 et 100, modifiable par le
-- coach de l'organisation et jamais par celui d'une autre.
begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(5);

insert into auth.users (id, email) values
  ('11111111-1111-4111-8111-111111111111', 'test-coach-a@example.test'),
  ('22222222-2222-4222-8222-222222222222', 'test-coach-b@example.test');
insert into public.organizations (id, name, slug) values
  ('aaaaaaaa-0000-4000-8000-000000000001', 'Test Org A', 'test-org-a'),
  ('bbbbbbbb-0000-4000-8000-000000000002', 'Test Org B', 'test-org-b');
insert into public.organization_members (organization_id, user_id, role) values
  ('aaaaaaaa-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 'owner'),
  ('bbbbbbbb-0000-4000-8000-000000000002', '22222222-2222-4222-8222-222222222222', 'owner');
insert into public.coach_sessions (id, organization_id, kind, title, starts_on, start_time,
  duration_minutes, repeats_weekly, price_cents, payment_method) values
  ('5e000000-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000001', 'group',
   'Piste du mercredi', '2026-10-07', '19:00', 90, true, 6500, 'transfer');

select is(
  (select vat_rate from public.coach_sessions where id = '5e000000-0000-4000-8000-000000000001'),
  0::numeric,
  'Une séance est sans TVA par défaut'
);
select throws_ok(
  $$ update public.coach_sessions set vat_rate = 150 where id = '5e000000-0000-4000-8000-000000000001' $$,
  '23514', null, 'Un taux de TVA reste entre 0 et 100'
);

set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}';
select lives_ok(
  $$ update public.coach_sessions set vat_rate = 8.1, price_vat_included = false
     where id = '5e000000-0000-4000-8000-000000000001' $$,
  'Le coach applique la TVA à sa séance'
);
select is(
  (select vat_rate from public.coach_sessions where id = '5e000000-0000-4000-8000-000000000001'),
  8.1::numeric,
  'Le taux de la séance est enregistré'
);

-- Coach de l'organisation B : la séance de A ne lui est pas visible, rien ne change.
set local request.jwt.claims = '{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}';
update public.coach_sessions set vat_rate = 21 where id = '5e000000-0000-4000-8000-000000000001';
reset role;
select is(
  (select vat_rate from public.coach_sessions where id = '5e000000-0000-4000-8000-000000000001'),
  8.1::numeric,
  'Un coach d''une autre organisation ne change pas la TVA d''une séance'
);

select * from finish();
rollback;
