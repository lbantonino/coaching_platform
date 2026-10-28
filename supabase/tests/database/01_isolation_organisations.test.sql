-- Tests d'isolation multi-tenant (SEC-01, DB-01) : organisations et membres.
-- Exécution : npm run db:test. Tout se déroule dans une transaction annulée à la fin.
begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(16);

-- ---------------------------------------------------------------------
-- Données de test (indépendantes du seed)
-- ---------------------------------------------------------------------
insert into auth.users (id, email) values
  ('11111111-1111-4111-8111-111111111111', 'test-coach-a@example.test'),
  ('22222222-2222-4222-8222-222222222222', 'test-coach-b@example.test'),
  ('33333333-3333-4333-8333-333333333333', 'test-admin@example.test'),
  ('44444444-4444-4444-8444-444444444444', 'test-coach-desactive@example.test');

insert into public.organizations (id, name, slug) values
  ('aaaaaaaa-0000-4000-8000-000000000001', 'Test Org A', 'test-org-a'),
  ('bbbbbbbb-0000-4000-8000-000000000002', 'Test Org B', 'test-org-b');

insert into public.organization_members (organization_id, user_id, role, status) values
  ('aaaaaaaa-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 'owner', 'active'),
  ('bbbbbbbb-0000-4000-8000-000000000002', '22222222-2222-4222-8222-222222222222', 'owner', 'active'),
  ('aaaaaaaa-0000-4000-8000-000000000001', '44444444-4444-4444-8444-444444444444', 'coach', 'disabled');

insert into public.platform_admins (user_id) values ('33333333-3333-4333-8333-333333333333');

-- ---------------------------------------------------------------------
-- Contraintes de base
-- ---------------------------------------------------------------------
select ok(
  (select relrowsecurity from pg_class where oid = 'public.organizations'::regclass)
  and (select relrowsecurity from pg_class where oid = 'public.organization_members'::regclass)
  and (select relrowsecurity from pg_class where oid = 'public.platform_admins'::regclass),
  'RLS est activée sur les trois tables'
);

select throws_ok(
  $$ insert into public.organization_members (organization_id, user_id, role)
     values ('aaaaaaaa-0000-4000-8000-000000000001', '22222222-2222-4222-8222-222222222222', 'owner') $$,
  '23505', null,
  'Une organisation ne peut pas avoir deux propriétaires'
);

-- ---------------------------------------------------------------------
-- Coach A connecté
-- ---------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}';

select results_eq(
  $$ select slug from public.organizations where slug like 'test-%' order by slug $$,
  $$ values ('test-org-a') $$,
  'Coach A ne voit que son organisation'
);

select is_empty(
  $$ select 1 from public.organizations where id = 'bbbbbbbb-0000-4000-8000-000000000002' $$,
  'Coach A ne peut pas lire l''organisation B, même en ciblant son ID'
);

select is_empty(
  $$ select 1 from public.organization_members where organization_id = 'bbbbbbbb-0000-4000-8000-000000000002' $$,
  'Coach A ne voit pas les membres de l''organisation B'
);

select results_eq(
  $$ select count(*)::int from public.organization_members where organization_id = 'aaaaaaaa-0000-4000-8000-000000000001' $$,
  $$ values (2) $$,
  'Coach A voit les membres de sa propre organisation'
);

select throws_ok(
  $$ select 1 from public.platform_admins $$,
  '42501', null,
  'Coach A n''a aucun droit de lecture sur platform_admins'
);

select throws_ok(
  $$ insert into public.organizations (name, slug) values ('Pirate', 'pirate') $$,
  '42501', null,
  'Coach A ne peut pas créer d''organisation depuis le navigateur'
);

select throws_ok(
  $$ insert into public.organization_members (organization_id, user_id, role)
     values ('bbbbbbbb-0000-4000-8000-000000000002', '11111111-1111-4111-8111-111111111111', 'coach') $$,
  '42501', null,
  'Coach A ne peut pas s''ajouter lui-même à l''organisation B'
);

-- Depuis D-57, un propriétaire peut renommer SON organisation : la RLS filtre l'organisation B
-- (aucune ligne touchée, pas d'erreur). Le nom de B ne change pas.
update public.organizations set name = 'Piraté' where id = 'bbbbbbbb-0000-4000-8000-000000000002';
-- Vérifié sans RLS (le coach A ne voit pas B : il faut regarder avec les droits de la base).
reset role;
select is_empty(
  $$ select 1 from public.organizations where name = 'Piraté' $$,
  'Coach A ne peut pas modifier l''organisation B'
);
set local role authenticated;

-- ---------------------------------------------------------------------
-- Coach B connecté (symétrie)
-- ---------------------------------------------------------------------
set local request.jwt.claims = '{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}';

select results_eq(
  $$ select slug from public.organizations where slug like 'test-%' order by slug $$,
  $$ values ('test-org-b') $$,
  'Coach B ne voit que son organisation'
);

select is_empty(
  $$ select 1 from public.organizations where id = 'aaaaaaaa-0000-4000-8000-000000000001' $$,
  'Coach B ne peut pas lire l''organisation A'
);

-- ---------------------------------------------------------------------
-- Membre désactivé, admin plateforme, visiteur anonyme
-- ---------------------------------------------------------------------
set local request.jwt.claims = '{"sub":"44444444-4444-4444-8444-444444444444","role":"authenticated"}';
select is_empty(
  $$ select 1 from public.organizations where slug like 'test-%' $$,
  'Un membre désactivé ne voit plus son organisation'
);

set local request.jwt.claims = '{"sub":"33333333-3333-4333-8333-333333333333","role":"authenticated"}';
select is_empty(
  $$ select 1 from public.organizations where slug like 'test-%' $$,
  'Un admin plateforme n''a aucun accès implicite aux organisations'
);

reset role;
set local role anon;
set local request.jwt.claims = '{"role":"anon"}';

select throws_ok(
  $$ select 1 from public.organizations $$,
  '42501', null,
  'Un visiteur non connecté ne peut pas lire les organisations'
);

select throws_ok(
  $$ select 1 from public.organization_members $$,
  '42501', null,
  'Un visiteur non connecté ne peut pas lire les membres'
);

select * from finish();
rollback;
