-- Tests des séances encadrées (P2-05b, D-27) : cohérence, inscrits, droits de modification, isolation.
begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(16);

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
  ('a1a1a1a1-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000001', 'Sportif A1'),
  ('a2a2a2a2-0000-4000-8000-000000000002', 'aaaaaaaa-0000-4000-8000-000000000001', 'Sportif A2'),
  ('b1b1b1b1-0000-4000-8000-000000000001', 'bbbbbbbb-0000-4000-8000-000000000002', 'Sportif B');
insert into public.coach_sessions (id, organization_id, kind, title, starts_on, start_time, duration_minutes) values
  ('c2c2c2c2-0000-4000-8000-000000000002', 'bbbbbbbb-0000-4000-8000-000000000002', 'group', 'Séance de B',
   '2026-10-07', '19:00', 90);

-- ---------------------------------------------------------------------
-- Cohérence (contraintes en base, en plus de Zod)
-- ---------------------------------------------------------------------
-- Un nouveau sportif a d'abord sa fiche minimale (D-35) : une séance individuelle a toujours le sien.
select throws_ok(
  $$ insert into public.coach_sessions (organization_id, kind, title, starts_on, start_time, duration_minutes)
     values ('aaaaaaaa-0000-4000-8000-000000000001', 'individual', 'Sans sportif', '2026-10-07', '18:00', 60) $$,
  '23514', null,
  'Une séance individuelle exige son sportif'
);
select throws_ok(
  $$ insert into public.coach_sessions (organization_id, kind, title, athlete_id, starts_on, start_time, duration_minutes)
     values ('aaaaaaaa-0000-4000-8000-000000000001', 'group', 'Groupe', 'a1a1a1a1-0000-4000-8000-000000000001',
             '2026-10-07', '18:00', 60) $$,
  '23514', null,
  'Une séance collective n''a pas de sportif unique (ses inscrits sont à part)'
);
select throws_ok(
  $$ insert into public.coach_sessions (organization_id, kind, title, starts_on, start_time, duration_minutes, ends_on)
     values ('aaaaaaaa-0000-4000-8000-000000000001', 'group', 'Fin sans répétition', '2026-10-07', '18:00', 60,
             '2026-12-31') $$,
  '23514', null,
  'Une date de fin exige une séance qui se répète'
);
select throws_ok(
  $$ insert into public.coach_sessions (organization_id, kind, title, starts_on, start_time, duration_minutes, repeats_weekly, ends_on)
     values ('aaaaaaaa-0000-4000-8000-000000000001', 'group', 'Fin avant début', '2026-10-07', '18:00', 60,
             true, '2026-09-01') $$,
  '23514', null,
  'La date de fin ne précède pas le début'
);
select throws_ok(
  $$ insert into public.coach_sessions (organization_id, kind, title, athlete_id, starts_on, start_time, duration_minutes)
     values ('aaaaaaaa-0000-4000-8000-000000000001', 'individual', 'Sportif de B',
             'b1b1b1b1-0000-4000-8000-000000000001', '2026-10-07', '18:00', 60) $$,
  '23503', null,
  'Une séance individuelle ne vise pas un sportif d''une autre organisation'
);

-- ---------------------------------------------------------------------
-- Coach A connecté
-- ---------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}';

select lives_ok(
  $$ insert into public.coach_sessions
       (id, organization_id, kind, title, discipline, location, starts_on, start_time, duration_minutes, repeats_weekly, created_by)
     values ('c1c1c1c1-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000001', 'group',
             'Piste du mercredi', 'running', 'Stade', '2026-10-07', '19:00', 90, true,
             '11111111-1111-4111-8111-111111111111') $$,
  'Coach A crée une séance collective hebdomadaire'
);
select lives_ok(
  $$ insert into public.coach_session_athletes (session_id, organization_id, athlete_id, created_by)
     values ('c1c1c1c1-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000001',
             'a1a1a1a1-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111'),
            ('c1c1c1c1-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000001',
             'a2a2a2a2-0000-4000-8000-000000000002', '11111111-1111-4111-8111-111111111111') $$,
  'Coach A inscrit deux sportifs de son organisation'
);
select throws_ok(
  $$ insert into public.coach_session_athletes (session_id, organization_id, athlete_id, created_by)
     values ('c1c1c1c1-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000001',
             'b1b1b1b1-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111') $$,
  '23503', null,
  'Impossible d''inscrire un sportif d''une autre organisation'
);
select lives_ok(
  $$ update public.coach_sessions set start_time = '19:30', ends_on = '2026-12-16'
     where id = 'c1c1c1c1-0000-4000-8000-000000000001' $$,
  'Coach A change l''heure et arrête la récurrence à une date'
);
select throws_ok(
  $$ update public.coach_sessions set kind = 'individual'
     where id = 'c1c1c1c1-0000-4000-8000-000000000001' $$,
  '42501', null,
  'Le type d''une séance ne se modifie pas (on supprime et on recrée)'
);
select is_empty(
  $$ select 1 from public.coach_sessions where id = 'c2c2c2c2-0000-4000-8000-000000000002' $$,
  'Coach A ne voit pas les séances de l''organisation B'
);
select throws_ok(
  $$ insert into public.coach_sessions (organization_id, kind, title, starts_on, start_time, duration_minutes, created_by)
     values ('bbbbbbbb-0000-4000-8000-000000000002', 'group', 'Intrusion', '2026-10-07', '18:00', 60,
             '11111111-1111-4111-8111-111111111111') $$,
  '42501', null,
  'Coach A ne peut pas créer de séance dans l''organisation B'
);
select lives_ok(
  $$ insert into public.coach_sessions
       (id, organization_id, kind, title, athlete_id, starts_on, start_time, duration_minutes, created_by)
     values ('c3c3c3c3-0000-4000-8000-000000000003', 'aaaaaaaa-0000-4000-8000-000000000001', 'individual',
             'Coaching force', 'a1a1a1a1-0000-4000-8000-000000000001', '2026-10-08', '18:00', 60,
             '11111111-1111-4111-8111-111111111111') $$,
  'Coach A crée une séance individuelle avec son sportif'
);
select throws_ok(
  $$ update public.coach_sessions set athlete_id = 'a2a2a2a2-0000-4000-8000-000000000002'
     where id = 'c3c3c3c3-0000-4000-8000-000000000003' $$,
  '42501', null,
  'Le sportif d''une séance individuelle ne se modifie pas'
);
select lives_ok(
  $$ delete from public.coach_sessions where id = 'c1c1c1c1-0000-4000-8000-000000000001' $$,
  'Coach A supprime sa séance'
);

reset role;
select is_empty(
  $$ select 1 from public.coach_session_athletes where session_id = 'c1c1c1c1-0000-4000-8000-000000000001' $$,
  'Supprimer une séance supprime ses inscriptions'
);

select * from finish();
rollback;
