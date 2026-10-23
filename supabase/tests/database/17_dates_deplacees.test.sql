-- Tests des dates déplacées (4a, D-35) : une date d'origine est une vraie date de la série, la série se
-- décale avec ses dates déplacées, et rien ne traverse les organisations.
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
-- Chaque mercredi à 19:00 depuis le 7 octobre 2026 ; et une séance unique.
insert into public.coach_sessions (id, organization_id, kind, title, starts_on, start_time, duration_minutes, repeats_weekly, ends_on) values
  ('c1c1c1c1-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000001', 'group', 'Piste',
   '2026-10-07', '19:00', 90, true, '2026-12-30'),
  ('c1c1c1c1-0000-4000-8000-000000000002', 'aaaaaaaa-0000-4000-8000-000000000001', 'group', 'Unique',
   '2026-10-08', '10:00', 60, false, null);

-- ---------------------------------------------------------------------
-- Coach A connecté
-- ---------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}';

select lives_ok(
  $$ insert into public.coach_session_exceptions (session_id, organization_id, original_date, new_date, new_start_time, created_by)
     values ('c1c1c1c1-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000001',
             '2026-10-21', '2026-10-22', '18:00', '11111111-1111-4111-8111-111111111111') $$,
  'Coach A déplace le mercredi 21 octobre au jeudi 22 à 18:00'
);
select throws_ok(
  $$ insert into public.coach_session_exceptions (session_id, organization_id, original_date, new_date, new_start_time, created_by)
     values ('c1c1c1c1-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000001',
             '2026-10-22', '2026-10-23', '18:00', '11111111-1111-4111-8111-111111111111') $$,
  '23514', null, 'Un jeudi n''est pas une date de la série du mercredi'
);
select throws_ok(
  $$ insert into public.coach_session_exceptions (session_id, organization_id, original_date, new_date, new_start_time, created_by)
     values ('c1c1c1c1-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000001',
             '2027-01-06', '2027-01-07', '18:00', '11111111-1111-4111-8111-111111111111') $$,
  '23514', null, 'Une date après la fin de la série est refusée'
);
select throws_ok(
  $$ insert into public.coach_session_exceptions (session_id, organization_id, original_date, new_date, new_start_time, created_by)
     values ('c1c1c1c1-0000-4000-8000-000000000002', 'aaaaaaaa-0000-4000-8000-000000000001',
             '2026-10-08', '2026-10-09', '10:00', '11111111-1111-4111-8111-111111111111') $$,
  '23514', null, 'Une séance unique se déplace directement, sans date déplacée'
);
select throws_ok(
  $$ insert into public.coach_session_exceptions (session_id, organization_id, original_date, new_date, new_start_time, created_by)
     values ('c1c1c1c1-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000001',
             '2026-10-28', '2026-10-29', '18:00', '22222222-2222-4222-8222-222222222222') $$,
  '42501', null, 'created_by est toujours la personne connectée'
);

-- Toute la série : du mercredi au jeudi (+1 jour), à 18:30 ; la date déplacée suit.
select lives_ok(
  $$ select public.move_session_series('c1c1c1c1-0000-4000-8000-000000000001', 1, '18:30') $$,
  'Coach A décale toute la série d''un jour'
);
select results_eq(
  $$ select starts_on, ends_on, start_time from public.coach_sessions where id = 'c1c1c1c1-0000-4000-8000-000000000001' $$,
  $$ values ('2026-10-08'::date, '2026-12-31'::date, '18:30'::time) $$,
  'La série a lieu chaque jeudi à 18:30, sa fin décalée d''autant'
);
select results_eq(
  $$ select original_date, new_date from public.coach_session_exceptions $$,
  $$ values ('2026-10-22'::date, '2026-10-22'::date) $$,
  'La date déplacée garde sa place et sa date d''origine suit la série'
);
select throws_ok(
  $$ select public.move_session_series('c1c1c1c1-0000-4000-8000-000000000001', 7, '18:30') $$,
  '22023', null, 'Le décalage d''une série reste entre -3 et +3 jours'
);
select throws_ok(
  $$ select public.move_session_series('c1c1c1c1-0000-4000-8000-000000000002', 1, '18:30') $$,
  'P0002', null, 'Une séance unique n''est pas une série'
);

-- ---------------------------------------------------------------------
-- Coach B : rien dans l'organisation A
-- ---------------------------------------------------------------------
set local request.jwt.claims = '{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}';
select is_empty($$ select 1 from public.coach_session_exceptions $$, 'Coach B ne lit aucune date déplacée de A');
select throws_ok(
  $$ select public.move_session_series('c1c1c1c1-0000-4000-8000-000000000001', -1, '07:00') $$,
  'P0002', null, 'Coach B ne peut pas décaler une série de l''organisation A'
);

set local role anon;
set local request.jwt.claims = '{"role":"anon"}';
select throws_ok(
  $$ select 1 from public.coach_session_exceptions $$, '42501', null, 'Un anonyme ne lit rien'
);

select * from finish();
rollback;
