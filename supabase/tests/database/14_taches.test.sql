-- Tests des tâches du coach (4a, D-35) : cohérence, « qui a coché » posé par la base, isolation entre
-- organisations, et le sportif ne voit jamais les tâches de son coach.
begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(16);

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

-- ---------------------------------------------------------------------
-- Cohérence (contraintes en base, en plus de Zod)
-- ---------------------------------------------------------------------
select throws_ok(
  $$ insert into public.coach_tasks (organization_id, title, priority)
     values ('aaaaaaaa-0000-4000-8000-000000000001', 'Tâche', 'urgent') $$,
  '23514', null, 'La priorité est « high » ou « normal »'
);
select throws_ok(
  $$ insert into public.coach_tasks (organization_id, title)
     values ('aaaaaaaa-0000-4000-8000-000000000001', '   ') $$,
  '23514', null, 'Une tâche a un titre'
);
select throws_ok(
  $$ insert into public.coach_tasks (organization_id, title, athlete_id)
     values ('aaaaaaaa-0000-4000-8000-000000000001', 'Sportif de B', 'b1b1b1b1-0000-4000-8000-000000000001') $$,
  '23503', null, 'Une tâche ne vise pas un sportif d''une autre organisation'
);

-- ---------------------------------------------------------------------
-- Coach A connecté
-- ---------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}';

select lives_ok(
  $$ insert into public.coach_tasks (id, organization_id, title, priority, athlete_id, created_by)
     values ('7a000000-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000001',
             'Préparer le programme', 'high', 'a1a1a1a1-0000-4000-8000-000000000001',
             '11111111-1111-4111-8111-111111111111') $$,
  'Coach A ajoute une tâche'
);
select throws_ok(
  $$ insert into public.coach_tasks (organization_id, title, created_by)
     values ('aaaaaaaa-0000-4000-8000-000000000001', 'Usurpée', '22222222-2222-4222-8222-222222222222') $$,
  '42501', null, 'created_by ne peut pas être attribué à quelqu''un d''autre'
);
select lives_ok(
  $$ update public.coach_tasks set done_at = now() where id = '7a000000-0000-4000-8000-000000000001' $$,
  'Coach A coche la tâche'
);
select results_eq(
  $$ select done_by from public.coach_tasks where id = '7a000000-0000-4000-8000-000000000001' $$,
  $$ values ('11111111-1111-4111-8111-111111111111'::uuid) $$,
  'La base note que c''est coach A qui l''a cochée'
);
select throws_ok(
  $$ update public.coach_tasks set done_by = '22222222-2222-4222-8222-222222222222'
     where id = '7a000000-0000-4000-8000-000000000001' $$,
  '42501', null, '« Qui a coché » ne s''écrit pas depuis le navigateur'
);
select lives_ok(
  $$ update public.coach_tasks set done_at = null where id = '7a000000-0000-4000-8000-000000000001' $$,
  'Coach A décoche la tâche'
);
select results_eq(
  $$ select done_at, done_by from public.coach_tasks where id = '7a000000-0000-4000-8000-000000000001' $$,
  $$ values (null::timestamptz, null::uuid) $$,
  'Décocher efface aussi « qui a coché »'
);

-- ---------------------------------------------------------------------
-- Coach B : rien dans l'organisation A
-- ---------------------------------------------------------------------
set local request.jwt.claims = '{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}';
select is_empty($$ select 1 from public.coach_tasks $$, 'Coach B ne lit aucune tâche de l''organisation A');
select throws_ok(
  $$ insert into public.coach_tasks (organization_id, title, created_by)
     values ('aaaaaaaa-0000-4000-8000-000000000001', 'Intruse', '22222222-2222-4222-8222-222222222222') $$,
  '42501', null, 'Coach B ne peut pas ajouter de tâche dans l''organisation A'
);
update public.coach_tasks set done_at = now(), title = 'Modifiée par B';
delete from public.coach_tasks;

-- ---------------------------------------------------------------------
-- Le sportif de l'organisation A : jamais les tâches de son coach
-- ---------------------------------------------------------------------
set local request.jwt.claims = '{"sub":"33333333-3333-4333-8333-333333333333","role":"authenticated"}';
select is_empty($$ select 1 from public.coach_tasks $$, 'Le sportif ne lit pas les tâches de son coach');
update public.coach_tasks set done_at = now();

reset role;
select results_eq(
  $$ select title, done_at from public.coach_tasks where id = '7a000000-0000-4000-8000-000000000001' $$,
  $$ values ('Préparer le programme'::text, null::timestamptz) $$,
  'Ni coach B ni le sportif n''ont pu cocher ou renommer la tâche'
);
select is(
  (select count(*)::int from public.coach_tasks where organization_id = 'aaaaaaaa-0000-4000-8000-000000000001'), 1,
  'Coach B n''a pas pu supprimer la tâche de l''organisation A'
);

set local role anon;
set local request.jwt.claims = '{"role":"anon"}';
select throws_ok($$ select 1 from public.coach_tasks $$, '42501', null, 'Un anonyme ne lit rien');

select * from finish();
rollback;
