-- Tests du type de programme du sportif (D-40) : valeurs permises, le coach le change pour ses sportifs,
-- jamais pour ceux d'une autre organisation, et le sportif ne le change pas lui-même.
begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(5);

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
insert into public.athlete_profiles (id, organization_id, first_name, athlete_user_id, program_type) values
  ('a1a1a1a1-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000001', 'Sportif A1',
   '33333333-3333-4333-8333-333333333333', 'hyrox'),
  ('b1b1b1b1-0000-4000-8000-000000000001', 'bbbbbbbb-0000-4000-8000-000000000002', 'Sportif B', null, 'running');

select throws_ok(
  $$ update public.athlete_profiles set program_type = 'yoga'
     where id = 'a1a1a1a1-0000-4000-8000-000000000001' $$,
  '23514', null, 'Le type est Running, Musculation, Hyrox ou Hybride'
);

set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}';
select lives_ok(
  $$ update public.athlete_profiles set program_type = 'hybrid'
     where id = 'a1a1a1a1-0000-4000-8000-000000000001' $$,
  'Le coach change le type de programme de son sportif'
);
select is(
  (select program_type from public.athlete_profiles where id = 'a1a1a1a1-0000-4000-8000-000000000001'),
  'hybrid', 'Le nouveau type est enregistré'
);
update public.athlete_profiles set program_type = 'strength'
  where id = 'b1b1b1b1-0000-4000-8000-000000000001';

set local request.jwt.claims = '{"sub":"33333333-3333-4333-8333-333333333333","role":"authenticated"}';
update public.athlete_profiles set program_type = 'running'
  where id = 'a1a1a1a1-0000-4000-8000-000000000001';

reset role;
select is(
  (select program_type from public.athlete_profiles where id = 'b1b1b1b1-0000-4000-8000-000000000001'),
  'running', 'Le coach A ne touche pas au sportif de l''organisation B'
);
select is(
  (select program_type from public.athlete_profiles where id = 'a1a1a1a1-0000-4000-8000-000000000001'),
  'hybrid', 'Le sportif ne change pas lui-même son type de programme'
);

select * from finish();
rollback;
