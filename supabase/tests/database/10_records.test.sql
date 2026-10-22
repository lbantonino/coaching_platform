-- Tests des records personnels (P2-02 partie 4, OPEN-01) : épreuves fermées, catégorie Hyrox,
-- historique immuable, isolation entre organisations, aucun accès du sportif ni d'un anonyme.
begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(13);

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
  ('a1a1a1a1-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000001', 'Sportif A',
   '33333333-3333-4333-8333-333333333333'),
  ('b1b1b1b1-0000-4000-8000-000000000001', 'bbbbbbbb-0000-4000-8000-000000000002', 'Sportif B', null);

insert into public.athlete_personal_records (id, organization_id, athlete_id, event, time_seconds, achieved_on) values
  ('e1e1e1e1-0000-4000-8000-000000000001', 'bbbbbbbb-0000-4000-8000-000000000002',
   'b1b1b1b1-0000-4000-8000-000000000001', 'run_10k', 2700, '2026-05-01');

-- ---------------------------------------------------------------------
-- Cohérence (contraintes en base, en plus de Zod)
-- ---------------------------------------------------------------------
select throws_ok(
  $$ insert into public.athlete_personal_records (organization_id, athlete_id, event, time_seconds, achieved_on)
     values ('aaaaaaaa-0000-4000-8000-000000000001', 'a1a1a1a1-0000-4000-8000-000000000001', 'run_15k', 3600, '2026-10-01') $$,
  '23514', null,
  'L''épreuve appartient à la liste fermée'
);
select throws_ok(
  $$ insert into public.athlete_personal_records (organization_id, athlete_id, event, time_seconds, achieved_on)
     values ('aaaaaaaa-0000-4000-8000-000000000001', 'a1a1a1a1-0000-4000-8000-000000000001', 'hyrox', 4800, '2026-10-01') $$,
  '23514', null,
  'Un temps Hyrox exige sa catégorie'
);
select throws_ok(
  $$ insert into public.athlete_personal_records (organization_id, athlete_id, event, hyrox_category, time_seconds, achieved_on)
     values ('aaaaaaaa-0000-4000-8000-000000000001', 'a1a1a1a1-0000-4000-8000-000000000001', 'run_5k', 'open', 1300, '2026-10-01') $$,
  '23514', null,
  'Une course à pied n''a pas de catégorie Hyrox'
);
select throws_ok(
  $$ insert into public.athlete_personal_records (organization_id, athlete_id, event, time_seconds, achieved_on)
     values ('aaaaaaaa-0000-4000-8000-000000000001', 'a1a1a1a1-0000-4000-8000-000000000001', 'run_5k', 0, '2026-10-01') $$,
  '23514', null,
  'Un temps nul est refusé'
);
select throws_ok(
  $$ insert into public.athlete_personal_records (organization_id, athlete_id, event, time_seconds, achieved_on)
     values ('aaaaaaaa-0000-4000-8000-000000000001', 'b1b1b1b1-0000-4000-8000-000000000001', 'run_5k', 1300, '2026-10-01') $$,
  '23503', null,
  'Une performance ne peut pas viser une fiche d''une autre organisation'
);

-- ---------------------------------------------------------------------
-- Coach A connecté
-- ---------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}';

select lives_ok(
  $$ insert into public.athlete_personal_records
       (organization_id, athlete_id, event, hyrox_category, time_seconds, achieved_on, race_name, created_by)
     values ('aaaaaaaa-0000-4000-8000-000000000001', 'a1a1a1a1-0000-4000-8000-000000000001', 'run_5k', null, 1350,
             '2026-05-01', null, '11111111-1111-4111-8111-111111111111'),
            ('aaaaaaaa-0000-4000-8000-000000000001', 'a1a1a1a1-0000-4000-8000-000000000001', 'run_5k', null, 1305,
             '2026-10-01', 'Course de quartier', '11111111-1111-4111-8111-111111111111'),
            ('aaaaaaaa-0000-4000-8000-000000000001', 'a1a1a1a1-0000-4000-8000-000000000001', 'hyrox', 'open', 4920,
             '2025-12-14', 'Hyrox Gent', '11111111-1111-4111-8111-111111111111') $$,
  'Coach A ajoute des performances datées (deux 5 km et un Hyrox Open)'
);
select results_eq(
  $$ select min(time_seconds) from public.athlete_personal_records
     where athlete_id = 'a1a1a1a1-0000-4000-8000-000000000001' and event = 'run_5k' $$,
  $$ values (1305) $$,
  'Le record est le meilleur temps ; l''ancienne performance reste dans l''historique'
);
select throws_ok(
  $$ update public.athlete_personal_records set time_seconds = 1000
     where athlete_id = 'a1a1a1a1-0000-4000-8000-000000000001' $$,
  '42501', null,
  'Une performance ne se modifie jamais (historique immuable)'
);
select is_empty(
  $$ select 1 from public.athlete_personal_records where id = 'e1e1e1e1-0000-4000-8000-000000000001' $$,
  'Coach A ne voit pas les records de l''organisation B'
);
select throws_ok(
  $$ insert into public.athlete_personal_records (organization_id, athlete_id, event, time_seconds, achieved_on, created_by)
     values ('bbbbbbbb-0000-4000-8000-000000000002', 'b1b1b1b1-0000-4000-8000-000000000001', 'run_5k', 1300,
             '2026-10-01', '11111111-1111-4111-8111-111111111111') $$,
  '42501', null,
  'Coach A ne peut pas ajouter de record dans l''organisation B'
);
select lives_ok(
  $$ delete from public.athlete_personal_records
     where athlete_id = 'a1a1a1a1-0000-4000-8000-000000000001' and achieved_on = '2026-05-01' $$,
  'Coach A peut supprimer une performance erronée de son organisation'
);

-- ---------------------------------------------------------------------
-- Sportif connecté (compte lié à la fiche A) puis anonyme
-- ---------------------------------------------------------------------
set local request.jwt.claims = '{"sub":"33333333-3333-4333-8333-333333333333","role":"authenticated"}';
select is_empty(
  $$ select 1 from public.athlete_personal_records $$,
  'Le sportif ne lit pas encore ses records (espace sportif en P6)'
);

reset role;
set local role anon;
set local request.jwt.claims = '{"role":"anon"}';
select throws_ok($$ select 1 from public.athlete_personal_records $$, '42501', null, 'Un anonyme ne lit rien');

select * from finish();
rollback;
