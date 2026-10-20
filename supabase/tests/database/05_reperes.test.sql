-- Tests des repères datés (P2-03) : cohérence des valeurs, historique immuable, isolation.
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
insert into public.athlete_profiles (id, organization_id, display_name) values
  ('a1a1a1a1-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000001', 'Sportif A'),
  ('b1b1b1b1-0000-4000-8000-000000000001', 'bbbbbbbb-0000-4000-8000-000000000002', 'Sportif B');

insert into public.athlete_reference_metrics
  (id, organization_id, athlete_id, kind, pace_min_sec_per_km, pace_max_sec_per_km, source, measured_on) values
  ('d1d1d1d1-0000-4000-8000-000000000001', 'bbbbbbbb-0000-4000-8000-000000000002',
   'b1b1b1b1-0000-4000-8000-000000000001', 'pace_easy', 400, 435, 'test', '2026-10-01');

-- ---------------------------------------------------------------------
-- Cohérence des valeurs (contraintes en base, en plus de Zod)
-- ---------------------------------------------------------------------
select throws_ok(
  $$ insert into public.athlete_reference_metrics (organization_id, athlete_id, kind, bpm, source, measured_on)
     values ('aaaaaaaa-0000-4000-8000-000000000001', 'a1a1a1a1-0000-4000-8000-000000000001', 'pace_5k', 180, 'test', '2026-10-01') $$,
  '23514', null,
  'Une allure doit avoir une valeur d''allure, pas une FC'
);
select throws_ok(
  $$ insert into public.athlete_reference_metrics (organization_id, athlete_id, kind, pace_min_sec_per_km, pace_max_sec_per_km, source, measured_on)
     values ('aaaaaaaa-0000-4000-8000-000000000001', 'a1a1a1a1-0000-4000-8000-000000000001', 'pace_5k', 300, 280, 'test', '2026-10-01') $$,
  '23514', null,
  'Une plage d''allure doit aller de la plus rapide à la plus lente'
);
select throws_ok(
  $$ insert into public.athlete_reference_metrics (organization_id, athlete_id, kind, load_kg, source, measured_on)
     values ('aaaaaaaa-0000-4000-8000-000000000001', 'a1a1a1a1-0000-4000-8000-000000000001', 'strength_load', 100, 'test', '2026-10-01') $$,
  '23514', null,
  'Une charge exige le nom de l''exercice'
);
select throws_ok(
  $$ insert into public.athlete_reference_metrics (organization_id, athlete_id, kind, bpm, source, measured_on)
     values ('aaaaaaaa-0000-4000-8000-000000000001', 'b1b1b1b1-0000-4000-8000-000000000001', 'hr_max', 190, 'test', '2026-10-01') $$,
  '23503', null,
  'Un repère ne peut pas viser une fiche d''une autre organisation'
);

select lives_ok(
  $$ insert into public.athlete_reference_metrics (organization_id, athlete_id, kind, pace_min_sec_per_km, pace_max_sec_per_km, source, measured_on)
     values ('aaaaaaaa-0000-4000-8000-000000000001', 'a1a1a1a1-0000-4000-8000-000000000001', 'pace_vma', 240, 240, 'test', '2026-10-01') $$,
  'Le repère VMA (issu d''un test) est accepté'
);

-- ---------------------------------------------------------------------
-- Coach A connecté
-- ---------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}';

select lives_ok(
  $$ insert into public.athlete_reference_metrics
       (organization_id, athlete_id, kind, pace_min_sec_per_km, pace_max_sec_per_km, source, measured_on, created_by)
     values ('aaaaaaaa-0000-4000-8000-000000000001', 'a1a1a1a1-0000-4000-8000-000000000001', 'pace_5k', 295, 295,
             'test', '2026-09-01', '11111111-1111-4111-8111-111111111111'),
            ('aaaaaaaa-0000-4000-8000-000000000001', 'a1a1a1a1-0000-4000-8000-000000000001', 'pace_5k', 285, 285,
             'test', '2026-10-15', '11111111-1111-4111-8111-111111111111') $$,
  'Coach A ajoute deux mesures datées du même repère (historique)'
);

select results_eq(
  $$ select pace_min_sec_per_km from public.athlete_reference_metrics
     where athlete_id = 'a1a1a1a1-0000-4000-8000-000000000001' and kind = 'pace_5k'
     order by measured_on desc limit 1 $$,
  $$ values (285) $$,
  'La valeur actuelle est la mesure la plus récente, l''ancienne reste dans l''historique'
);

select throws_ok(
  $$ update public.athlete_reference_metrics set pace_min_sec_per_km = 200
     where athlete_id = 'a1a1a1a1-0000-4000-8000-000000000001' $$,
  '42501', null,
  'Une mesure ne se modifie jamais (historique immuable)'
);

select is_empty(
  $$ select 1 from public.athlete_reference_metrics where id = 'd1d1d1d1-0000-4000-8000-000000000001' $$,
  'Coach A ne voit pas les repères de l''organisation B'
);

select throws_ok(
  $$ insert into public.athlete_reference_metrics (organization_id, athlete_id, kind, bpm, source, measured_on, created_by)
     values ('bbbbbbbb-0000-4000-8000-000000000002', 'b1b1b1b1-0000-4000-8000-000000000001', 'hr_max', 190, 'test',
             '2026-10-01', '11111111-1111-4111-8111-111111111111') $$,
  '42501', null,
  'Coach A ne peut pas ajouter de repère dans l''organisation B'
);

delete from public.athlete_reference_metrics where id = 'd1d1d1d1-0000-4000-8000-000000000001';
reset role;
select isnt_empty(
  $$ select 1 from public.athlete_reference_metrics where id = 'd1d1d1d1-0000-4000-8000-000000000001' $$,
  'Coach A ne peut pas supprimer un repère de l''organisation B'
);

set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}';
select lives_ok(
  $$ delete from public.athlete_reference_metrics
     where athlete_id = 'a1a1a1a1-0000-4000-8000-000000000001' and measured_on = '2026-10-15' $$,
  'Coach A peut supprimer une mesure erronée de son organisation'
);

reset role;
set local role anon;
set local request.jwt.claims = '{"role":"anon"}';
select throws_ok($$ select 1 from public.athlete_reference_metrics $$, '42501', null, 'Un anonyme ne lit rien');

select * from finish();
rollback;
