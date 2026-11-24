-- Séance « Jour entier » (D-204, 24/11/2026, maquette Apple validée) : une séance sans heure (stage,
-- journée de compétition). En base : all_day, et une heure rangée (00:00, 60 min) qui la met en tête de
-- sa journée et garde les contraintes d'heure et de durée de toutes les séances.
begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(5);

select has_column('public', 'coach_sessions', 'all_day', 'La séance dit si elle dure toute la journée');
select col_default_is(
  'public', 'coach_sessions', 'all_day', 'false',
  'Une séance a une heure, sauf si on choisit « Jour entier »'
);

insert into auth.users (id, email) values
  ('11111111-1111-4111-8111-111111111111', 'test-coach-a@example.test');
insert into public.organizations (id, name, slug) values
  ('aaaaaaaa-0000-4000-8000-000000000001', 'Test Org A', 'test-org-a');
insert into public.organization_members (organization_id, user_id, role) values
  ('aaaaaaaa-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 'owner');
insert into public.coach_sessions (id, organization_id, kind, title, starts_on, start_time, duration_minutes, repeats_weekly) values
  ('c2c2c2c2-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000001', 'group', 'Piste',
   '2026-11-25', '19:00', 90, false);

-- --- Coach A connecté --------------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}';

select lives_ok(
  $$ insert into public.coach_sessions (organization_id, kind, title, starts_on, start_time, duration_minutes, all_day, created_by)
     values ('aaaaaaaa-0000-4000-8000-000000000001', 'group', 'Stage', '2026-12-05', '00:00', 60, true,
             '11111111-1111-4111-8111-111111111111') $$,
  'Une séance « Jour entier » se crée (heure rangée 00:00, 60 min)'
);
select throws_ok(
  $$ insert into public.coach_sessions (organization_id, kind, title, starts_on, start_time, duration_minutes, all_day, created_by)
     values ('aaaaaaaa-0000-4000-8000-000000000001', 'group', 'Stage', '2026-12-05', '09:00', 120, true,
             '11111111-1111-4111-8111-111111111111') $$,
  '23514', null, 'Une séance « Jour entier » n''a pas d''heure à elle'
);
select lives_ok(
  $$ update public.coach_sessions set all_day = true, start_time = '00:00', duration_minutes = 60
     where id = 'c2c2c2c2-0000-4000-8000-000000000001' $$,
  'Le coach passe une séance en « Jour entier »'
);

select * from finish();
rollback;
