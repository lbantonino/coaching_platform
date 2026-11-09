-- Tests du repère de charge relié à un exercice (C-11) : seulement pour une charge de référence, et
-- seulement un exercice que l'on a le droit de voir.
begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(3);

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
-- Un exercice privé de l'organisation B.
insert into public.exercises (id, organization_id, name_fr, category, source)
values ('e0000000-0000-4000-8000-0000000000b1', 'bbbbbbbb-0000-4000-8000-000000000002', 'Exercice B', 'strength', 'coach');

set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}';

select lives_ok(
  $$ insert into public.athlete_reference_metrics (organization_id, athlete_id, kind, exercise_label, load_kg, reps,
       exercise_id, source, measured_on, created_by)
     values ('aaaaaaaa-0000-4000-8000-000000000001', 'a1a1a1a1-0000-4000-8000-000000000001', 'strength_load', 'Back squat',
       80, 5, (select id from public.exercises where organization_id is null limit 1), 'test', '2026-11-01',
       '11111111-1111-4111-8111-111111111111') $$,
  'Une charge de référence se relie à un exercice du catalogue'
);
select throws_ok(
  $$ insert into public.athlete_reference_metrics (organization_id, athlete_id, kind, bpm, exercise_id, source, measured_on, created_by)
     values ('aaaaaaaa-0000-4000-8000-000000000001', 'a1a1a1a1-0000-4000-8000-000000000001', 'hr_max', 190,
       (select id from public.exercises where organization_id is null limit 1), 'test', '2026-11-01',
       '11111111-1111-4111-8111-111111111111') $$,
  '23514', null, 'Seule une charge de référence se relie à un exercice'
);
select throws_ok(
  $$ insert into public.athlete_reference_metrics (organization_id, athlete_id, kind, exercise_label, load_kg,
       exercise_id, source, measured_on, created_by)
     values ('aaaaaaaa-0000-4000-8000-000000000001', 'a1a1a1a1-0000-4000-8000-000000000001', 'strength_load', 'Exercice B',
       50, 'e0000000-0000-4000-8000-0000000000b1', 'test', '2026-11-01', '11111111-1111-4111-8111-111111111111') $$,
  '42501', null, 'On ne relie pas un exercice privé d''une autre organisation'
);

select * from finish();
rollback;
