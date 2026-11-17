-- Supprimer un programme (16/11/2026, « ⋯ » de sa carte) : définitif, le brouillon et les versions
-- publiées partent avec lui ; seulement dans l'organisation indiquée ET dont on est membre (relecture
-- du 16/11 : un coach membre de deux organisations ne supprime pas, depuis A, un programme de B).
begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(8);

insert into auth.users (id, email) values
  ('11111111-1111-4111-8111-111111111111', 'test-coach-a@example.test'),
  ('22222222-2222-4222-8222-222222222222', 'test-coach-b@example.test'),
  ('33333333-3333-4333-8333-333333333333', 'test-coach-ab@example.test');
insert into public.organizations (id, name, slug) values
  ('aaaaaaaa-0000-4000-8000-000000000001', 'Test Org A', 'test-org-a'),
  ('bbbbbbbb-0000-4000-8000-000000000002', 'Test Org B', 'test-org-b');
insert into public.organization_members (organization_id, user_id, role) values
  ('aaaaaaaa-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 'owner'),
  ('bbbbbbbb-0000-4000-8000-000000000002', '22222222-2222-4222-8222-222222222222', 'owner'),
  ('aaaaaaaa-0000-4000-8000-000000000001', '33333333-3333-4333-8333-333333333333', 'coach'),
  ('bbbbbbbb-0000-4000-8000-000000000002', '33333333-3333-4333-8333-333333333333', 'coach');
insert into public.athlete_profiles (id, organization_id, first_name) values
  ('a1a1a1a1-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000001', 'Sportif A');

set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}';

-- Un programme publié (brouillon + version) et un brouillon, dans A.
select set_config('test.pub', public.create_program(
  'aaaaaaaa-0000-4000-8000-000000000001', 'a1a1a1a1-0000-4000-8000-000000000001',
  'Publié', 'running', '2026-11-02', 4, '{}'
)::text, true);
select public.publish_program(current_setting('test.pub')::uuid, 1, 'Publié', 'running', '2026-11-02', 4,
  '{}', '[]');
select set_config('test.draft', public.create_program(
  'aaaaaaaa-0000-4000-8000-000000000001', 'a1a1a1a1-0000-4000-8000-000000000001',
  'Brouillon', 'running', '2027-03-01', 4, '{}'
)::text, true);

-- 1. Le coach B ne supprime pas un programme de A, même en nommant l'organisation A.
set local request.jwt.claims = '{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}';
select throws_ok(
  $$ select public.delete_program('aaaaaaaa-0000-4000-8000-000000000001', current_setting('test.draft')::uuid) $$,
  'P0002', null, 'Le coach B ne supprime pas le programme de A'
);

-- 2. Un coach membre de A et de B ne supprime pas, en nommant B, un programme de A.
set local request.jwt.claims = '{"sub":"33333333-3333-4333-8333-333333333333","role":"authenticated"}';
select throws_ok(
  $$ select public.delete_program('bbbbbbbb-0000-4000-8000-000000000002', current_setting('test.draft')::uuid) $$,
  'P0002', null, 'Nommer une autre organisation que celle du programme est refusé'
);
select is(
  (select count(*)::int from public.programs where id = current_setting('test.draft')::uuid),
  1, 'Refusé : le brouillon est toujours là'
);

-- 3. Le coach de A supprime le programme publié : tout part (brouillon, versions).
set local request.jwt.claims = '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}';
select lives_ok(
  $$ select public.delete_program('aaaaaaaa-0000-4000-8000-000000000001', current_setting('test.pub')::uuid) $$,
  'Le coach de A supprime son programme publié'
);
select is(
  (select count(*)::int from public.programs where id = current_setting('test.pub')::uuid),
  0, 'Le programme a disparu'
);
select is(
  (select count(*)::int from public.program_drafts where program_id = current_setting('test.pub')::uuid),
  0, 'Son brouillon aussi'
);
select is(
  (select count(*)::int from public.program_publications where program_id = current_setting('test.pub')::uuid),
  0, 'Ses versions publiées aussi'
);

-- 4. Jamais sans compte.
reset role;
select is(
  has_function_privilege('anon', 'public.delete_program(uuid, uuid)', 'execute'),
  false, 'Un visiteur sans compte ne peut pas appeler delete_program'
);

select * from finish();
rollback;
