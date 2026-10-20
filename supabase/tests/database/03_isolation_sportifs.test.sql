-- Tests d'isolation des fiches sportifs (SEC-01, DB-01, docs/03 §6).
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

insert into public.athlete_profiles (id, organization_id, display_name, email) values
  ('a1a1a1a1-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000001', 'Sportif A', 'sportif@example.test'),
  ('b1b1b1b1-0000-4000-8000-000000000001', 'bbbbbbbb-0000-4000-8000-000000000002', 'Sportif B', 'sportif@example.test');

select pass('Le même e-mail peut exister dans deux organisations différentes');

select throws_ok(
  $$ insert into public.athlete_profiles (organization_id, display_name, email)
     values ('aaaaaaaa-0000-4000-8000-000000000001', 'Doublon', 'SPORTIF@example.test') $$,
  '23505', null,
  'Un e-mail est unique par organisation, sans tenir compte des majuscules'
);

select throws_ok(
  $$ insert into public.athlete_profiles (organization_id, display_name) values ('aaaaaaaa-0000-4000-8000-000000000001', '   ') $$,
  '23514', null,
  'Un nom vide est refusé par la base'
);

-- ---------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}';

select results_eq(
  $$ select display_name from public.athlete_profiles where organization_id in
       ('aaaaaaaa-0000-4000-8000-000000000001', 'bbbbbbbb-0000-4000-8000-000000000002') $$,
  $$ values ('Sportif A') $$,
  'Coach A ne voit que les sportifs de son organisation'
);

select is_empty(
  $$ select 1 from public.athlete_profiles where id = 'b1b1b1b1-0000-4000-8000-000000000001' $$,
  'Coach A ne peut pas lire un sportif de B en ciblant son ID'
);

select lives_ok(
  $$ insert into public.athlete_profiles (organization_id, display_name, created_by)
     values ('aaaaaaaa-0000-4000-8000-000000000001', 'Nouveau A', '11111111-1111-4111-8111-111111111111') $$,
  'Coach A peut créer un sportif dans son organisation'
);

select throws_ok(
  $$ insert into public.athlete_profiles (organization_id, display_name, created_by)
     values ('bbbbbbbb-0000-4000-8000-000000000002', 'Intrus', '11111111-1111-4111-8111-111111111111') $$,
  '42501', null,
  'Coach A ne peut pas créer un sportif dans l''organisation B'
);

select throws_ok(
  $$ insert into public.athlete_profiles (organization_id, display_name, created_by)
     values ('aaaaaaaa-0000-4000-8000-000000000001', 'Usurpé', '22222222-2222-4222-8222-222222222222') $$,
  '42501', null,
  'created_by ne peut pas être attribué à quelqu''un d''autre'
);

select throws_ok(
  $$ insert into public.athlete_profiles (organization_id, display_name, created_by, athlete_user_id)
     values ('aaaaaaaa-0000-4000-8000-000000000001', 'Lié', '11111111-1111-4111-8111-111111111111',
             '22222222-2222-4222-8222-222222222222') $$,
  '42501', null,
  'Le navigateur ne peut pas lier lui-même un compte à une fiche'
);

-- La mise à jour d'une fiche de B ne touche aucune ligne (invisible pour A).
update public.athlete_profiles set display_name = 'Piraté' where id = 'b1b1b1b1-0000-4000-8000-000000000001';
reset role;
select results_eq(
  $$ select display_name from public.athlete_profiles where id = 'b1b1b1b1-0000-4000-8000-000000000001' $$,
  $$ values ('Sportif B') $$,
  'Coach A ne peut pas modifier un sportif de B'
);

set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}';

select throws_ok(
  $$ update public.athlete_profiles set organization_id = 'bbbbbbbb-0000-4000-8000-000000000002'
     where id = 'a1a1a1a1-0000-4000-8000-000000000001' $$,
  '42501', null,
  'Un sportif ne peut pas changer d''organisation'
);

select throws_ok(
  $$ delete from public.athlete_profiles where id = 'a1a1a1a1-0000-4000-8000-000000000001' $$,
  '42501', null,
  'Une fiche ne se supprime pas depuis le navigateur (on archive)'
);

reset role;
set local role anon;
set local request.jwt.claims = '{"role":"anon"}';
select throws_ok(
  $$ select 1 from public.athlete_profiles $$,
  '42501', null,
  'Un visiteur non connecté ne peut rien lire'
);

select * from finish();
rollback;
