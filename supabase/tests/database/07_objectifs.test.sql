-- Tests des objectifs et compétitions (P2-02 partie 2) : cohérence, objectif principal unique,
-- droits limités (priorité et statut) et isolation entre organisations.
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
  ('a1a1a1a1-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000001', 'Sportif A'),
  ('b1b1b1b1-0000-4000-8000-000000000001', 'bbbbbbbb-0000-4000-8000-000000000002', 'Sportif B');

insert into public.athlete_goals (id, organization_id, athlete_id, goal_type, priority) values
  ('9b000000-0000-4000-8000-000000000001', 'bbbbbbbb-0000-4000-8000-000000000002',
   'b1b1b1b1-0000-4000-8000-000000000001', 'fitness', 'main');

-- ---------------------------------------------------------------------
-- Cohérence (contraintes en base, en plus de la validation du serveur)
-- ---------------------------------------------------------------------
select lives_ok(
  $$ insert into public.athlete_goals (id, organization_id, athlete_id, goal_type, priority, target_date,
       competition_name, competition_location, hyrox_category)
     values ('9a000000-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000001',
             'a1a1a1a1-0000-4000-8000-000000000001', 'hyrox', 'main', '2027-03-20',
             'Hyrox test', 'Bruxelles', 'pro') $$,
  'Une compétition Hyrox complète (nom, lieu, date, catégorie) est acceptée'
);
select throws_ok(
  $$ insert into public.athlete_goals (organization_id, athlete_id, goal_type)
     values ('aaaaaaaa-0000-4000-8000-000000000001', 'a1a1a1a1-0000-4000-8000-000000000001', 'parachute') $$,
  '23514', null,
  'Le type d''objectif appartient à la liste fermée'
);
select throws_ok(
  $$ insert into public.athlete_goals (organization_id, athlete_id, goal_type, hyrox_category)
     values ('aaaaaaaa-0000-4000-8000-000000000001', 'a1a1a1a1-0000-4000-8000-000000000001', 'run_10k', 'pro') $$,
  '23514', null,
  'Une catégorie Hyrox est refusée pour un objectif qui n''est pas un Hyrox'
);
select throws_ok(
  $$ insert into public.athlete_goals (organization_id, athlete_id, goal_type, competition_name)
     values ('aaaaaaaa-0000-4000-8000-000000000001', 'a1a1a1a1-0000-4000-8000-000000000001', 'run_10k', '10 km test') $$,
  '23514', null,
  'Une compétition sans date est refusée'
);
select throws_ok(
  $$ insert into public.athlete_goals (organization_id, athlete_id, goal_type, competition_location)
     values ('aaaaaaaa-0000-4000-8000-000000000001', 'a1a1a1a1-0000-4000-8000-000000000001', 'fitness', 'Liège') $$,
  '23514', null,
  'Un lieu sans compétition est refusé'
);
select throws_ok(
  $$ insert into public.athlete_goals (organization_id, athlete_id, goal_type, priority)
     values ('aaaaaaaa-0000-4000-8000-000000000001', 'a1a1a1a1-0000-4000-8000-000000000001', 'run_half', 'main') $$,
  '23505', null,
  'Un sportif ne peut pas avoir deux objectifs principaux en cours'
);
select throws_ok(
  $$ insert into public.athlete_goals (organization_id, athlete_id, goal_type)
     values ('aaaaaaaa-0000-4000-8000-000000000001', 'b1b1b1b1-0000-4000-8000-000000000001', 'fitness') $$,
  '23503', null,
  'Un objectif ne peut pas viser une fiche d''une autre organisation'
);

-- ---------------------------------------------------------------------
-- Coach A connecté
-- ---------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}';

select lives_ok(
  $$ insert into public.athlete_goals (organization_id, athlete_id, goal_type, description, created_by)
     values ('aaaaaaaa-0000-4000-8000-000000000001', 'a1a1a1a1-0000-4000-8000-000000000001', 'strength',
             'Squat à 100 kg', '11111111-1111-4111-8111-111111111111') $$,
  'Coach A ajoute un objectif secondaire à un sportif de son organisation'
);
select lives_ok(
  $$ update public.athlete_goals set status = 'achieved'
     where id = '9a000000-0000-4000-8000-000000000001' $$,
  'Coach A clôture un objectif (atteint)'
);
select lives_ok(
  $$ update public.athlete_goals set priority = 'main'
     where athlete_id = 'a1a1a1a1-0000-4000-8000-000000000001' and goal_type = 'strength' $$,
  'L''objectif principal étant clos, un autre objectif peut devenir principal'
);
select throws_ok(
  $$ update public.athlete_goals set description = 'Réécrit'
     where id = '9a000000-0000-4000-8000-000000000001' $$,
  '42501', null,
  'Seuls la priorité et le statut se modifient (pour corriger : supprimer puis recréer)'
);
select is_empty(
  $$ select 1 from public.athlete_goals where organization_id = 'bbbbbbbb-0000-4000-8000-000000000002' $$,
  'Coach A ne voit pas les objectifs de l''organisation B'
);
select throws_ok(
  $$ insert into public.athlete_goals (organization_id, athlete_id, goal_type, created_by)
     values ('bbbbbbbb-0000-4000-8000-000000000002', 'b1b1b1b1-0000-4000-8000-000000000001', 'fitness',
             '11111111-1111-4111-8111-111111111111') $$,
  '42501', null,
  'Coach A ne peut pas ajouter d''objectif dans l''organisation B'
);

-- Modification et suppression d'un objectif de B : aucune ligne touchée (invisible pour A).
update public.athlete_goals set status = 'dropped' where id = '9b000000-0000-4000-8000-000000000001';
delete from public.athlete_goals where id = '9b000000-0000-4000-8000-000000000001';
reset role;
select results_eq(
  $$ select status from public.athlete_goals where id = '9b000000-0000-4000-8000-000000000001' $$,
  $$ values ('active') $$,
  'Coach A ne peut ni modifier ni supprimer un objectif de l''organisation B'
);

set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}';
select lives_ok(
  $$ delete from public.athlete_goals where id = '9a000000-0000-4000-8000-000000000001' $$,
  'Coach A supprime un objectif saisi par erreur dans son organisation'
);

reset role;
set local role anon;
set local request.jwt.claims = '{"role":"anon"}';
select throws_ok($$ select 1 from public.athlete_goals $$, '42501', null, 'Un anonyme ne lit rien');

select * from finish();
rollback;
