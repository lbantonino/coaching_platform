-- État des notifications (4e, D-61) : chacun ne lit et ne change que ses propres états, dans son
-- organisation ; clés de forme connue ; une ligne n'existe que pour une notification lue ou masquée.
begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(10);

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

select throws_ok(
  $$ insert into public.coach_notification_states (user_id, organization_id, key, read_at)
     values ('11111111-1111-4111-8111-111111111111', 'aaaaaaaa-0000-4000-8000-000000000001',
             'task:''; drop table x', now()) $$,
  '23514', null, 'Une clé de notification a une forme connue'
);
select throws_ok(
  $$ insert into public.coach_notification_states (user_id, organization_id, key)
     values ('11111111-1111-4111-8111-111111111111', 'aaaaaaaa-0000-4000-8000-000000000001',
             'task:abc:2026-10-28') $$,
  '23514', null, 'Une ligne n''existe que pour une notification lue ou masquée'
);

set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}';
select lives_ok(
  $$ insert into public.coach_notification_states (organization_id, key, read_at)
     values ('aaaaaaaa-0000-4000-8000-000000000001', 'task:abc:2026-10-28', now()) $$,
  'Coach A marque une notification lue (user_id posé par la base)'
);
select results_eq(
  $$ select user_id from public.coach_notification_states where key = 'task:abc:2026-10-28' $$,
  $$ values ('11111111-1111-4111-8111-111111111111'::uuid) $$,
  'La ligne appartient à coach A'
);
select throws_ok(
  $$ insert into public.coach_notification_states (user_id, organization_id, key, read_at)
     values ('12121212-1212-4121-8121-121212121212', 'aaaaaaaa-0000-4000-8000-000000000001',
             'task:abc:2026-10-28', now()) $$,
  '42501', null, 'Coach A ne pose pas d''état au nom de son collègue'
);
select throws_ok(
  $$ insert into public.coach_notification_states (organization_id, key, read_at)
     values ('bbbbbbbb-0000-4000-8000-000000000002', 'task:abc:2026-10-28', now()) $$,
  '42501', null, 'Coach A ne pose pas d''état dans une autre organisation'
);

-- Le collègue de la même organisation : ses états à lui, pas ceux de coach A.
set local request.jwt.claims = '{"sub":"12121212-1212-4121-8121-121212121212","role":"authenticated"}';
select is_empty(
  $$ select 1 from public.coach_notification_states $$,
  'Un collègue ne voit pas ce que coach A a lu'
);
update public.coach_notification_states set read_at = null, dismissed_at = now();
delete from public.coach_notification_states;

-- Coach B : rien.
set local request.jwt.claims = '{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}';
select is_empty($$ select 1 from public.coach_notification_states $$, 'Coach B ne voit rien');

reset role;
select results_eq(
  $$ select read_at is not null, dismissed_at is null from public.coach_notification_states
     where key = 'task:abc:2026-10-28' $$,
  $$ values (true, true) $$,
  'Ni le collègue ni coach B n''ont pu changer ou supprimer l''état de coach A'
);

set local role anon;
set local request.jwt.claims = '{"role":"anon"}';
select throws_ok(
  $$ select 1 from public.coach_notification_states $$, '42501', null, 'Un anonyme ne lit rien'
);

select * from finish();
rollback;
