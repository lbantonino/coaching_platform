-- Tests des messages des sportifs (4a, D-35) : cohérence, isolation entre organisations ; les coachs
-- lisent, marquent lus les messages REÇUS et répondent en leur nom, sans jamais réécrire un message.
begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(20);

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
insert into public.athlete_messages (id, organization_id, athlete_id, sender, body, created_by) values
  ('3a000000-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000001',
   'a1a1a1a1-0000-4000-8000-000000000001', 'athlete', 'Message du sportif A1',
   '33333333-3333-4333-8333-333333333333'),
  ('3a000000-0000-4000-8000-000000000002', 'aaaaaaaa-0000-4000-8000-000000000001',
   'a1a1a1a1-0000-4000-8000-000000000001', 'coach', 'Réponse du coach A',
   '11111111-1111-4111-8111-111111111111'),
  ('3b000000-0000-4000-8000-000000000001', 'bbbbbbbb-0000-4000-8000-000000000002',
   'b1b1b1b1-0000-4000-8000-000000000001', 'athlete', 'Message du sportif B', null);

-- ---------------------------------------------------------------------
-- Cohérence
-- ---------------------------------------------------------------------
select throws_ok(
  $$ insert into public.athlete_messages (organization_id, athlete_id, sender, body)
     values ('aaaaaaaa-0000-4000-8000-000000000001', 'a1a1a1a1-0000-4000-8000-000000000001', 'admin', 'x') $$,
  '23514', null, 'L''auteur est « coach » ou « athlete »'
);
select throws_ok(
  $$ insert into public.athlete_messages (organization_id, athlete_id, sender, body)
     values ('aaaaaaaa-0000-4000-8000-000000000001', 'a1a1a1a1-0000-4000-8000-000000000001', 'athlete', '  ') $$,
  '23514', null, 'Un message vide est refusé'
);
select throws_ok(
  $$ insert into public.athlete_messages (organization_id, athlete_id, sender, body)
     values ('aaaaaaaa-0000-4000-8000-000000000001', 'b1b1b1b1-0000-4000-8000-000000000001', 'athlete', 'x') $$,
  '23503', null, 'Un message reste dans l''organisation de son sportif'
);

-- ---------------------------------------------------------------------
-- Coach A connecté
-- ---------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}';

select results_eq(
  $$ select body from public.athlete_messages order by body $$,
  $$ values ('Message du sportif A1'::text), ('Réponse du coach A'::text) $$,
  'Coach A lit les messages de son organisation, et seulement eux'
);
select lives_ok(
  $$ update public.athlete_messages set read_at = now() where id = '3a000000-0000-4000-8000-000000000001' $$,
  'Coach A marque lu un message reçu'
);
select isnt(
  (select read_at from public.athlete_messages where id = '3a000000-0000-4000-8000-000000000001'), null,
  'Le message est lu'
);
select lives_ok(
  $$ update public.athlete_messages set read_at = null where id = '3a000000-0000-4000-8000-000000000001' $$,
  'Coach A le remet en non lu'
);
-- Ses propres messages : « lu » appartient au sportif, pas au coach (aucune ligne touchée).
update public.athlete_messages set read_at = now() where id = '3a000000-0000-4000-8000-000000000002';
select throws_ok(
  $$ update public.athlete_messages set body = 'Réécrit' where id = '3a000000-0000-4000-8000-000000000001' $$,
  '42501', null, 'Un message ne se réécrit pas'
);
select lives_ok(
  $$ insert into public.athlete_messages (organization_id, athlete_id, sender, body, created_by)
     values ('aaaaaaaa-0000-4000-8000-000000000001', 'a1a1a1a1-0000-4000-8000-000000000001', 'coach',
             'Réponse envoyée', '11111111-1111-4111-8111-111111111111') $$,
  'Coach A répond dans le fil de son sportif'
);
select throws_ok(
  $$ insert into public.athlete_messages (organization_id, athlete_id, sender, body, created_by)
     values ('aaaaaaaa-0000-4000-8000-000000000001', 'a1a1a1a1-0000-4000-8000-000000000001', 'athlete',
             'Faux message du sportif', '11111111-1111-4111-8111-111111111111') $$,
  '42501', null, 'Un coach n''écrit pas à la place du sportif'
);
select throws_ok(
  $$ insert into public.athlete_messages (organization_id, athlete_id, sender, body, created_by)
     values ('aaaaaaaa-0000-4000-8000-000000000001', 'a1a1a1a1-0000-4000-8000-000000000001', 'coach',
             'Signé par un autre', '22222222-2222-4222-8222-222222222222') $$,
  '42501', null, 'created_by est toujours la personne connectée'
);
select throws_ok(
  $$ insert into public.athlete_messages (organization_id, athlete_id, sender, body, created_by, read_at)
     values ('aaaaaaaa-0000-4000-8000-000000000001', 'a1a1a1a1-0000-4000-8000-000000000001', 'coach',
             'Déjà lu ?', '11111111-1111-4111-8111-111111111111', now()) $$,
  '42501', null, 'Un message part non lu (read_at ne s''écrit pas à l''envoi)'
);
select throws_ok(
  $$ delete from public.athlete_messages where id = '3a000000-0000-4000-8000-000000000001' $$,
  '42501', null, 'Un message ne se supprime pas'
);

-- ---------------------------------------------------------------------
-- Coach B : seulement son organisation
-- ---------------------------------------------------------------------
set local request.jwt.claims = '{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}';
select results_eq(
  $$ select body from public.athlete_messages $$,
  $$ values ('Message du sportif B'::text) $$,
  'Coach B ne lit aucun message de l''organisation A'
);
select throws_ok(
  $$ insert into public.athlete_messages (organization_id, athlete_id, sender, body, created_by)
     values ('aaaaaaaa-0000-4000-8000-000000000001', 'a1a1a1a1-0000-4000-8000-000000000001', 'coach',
             'Intrus', '22222222-2222-4222-8222-222222222222') $$,
  '42501', null, 'Coach B n''écrit pas dans un fil de l''organisation A'
);
update public.athlete_messages set read_at = now();

-- ---------------------------------------------------------------------
-- Le sportif : pas encore d'accès (espace sportif, P7)
-- ---------------------------------------------------------------------
set local request.jwt.claims = '{"sub":"33333333-3333-4333-8333-333333333333","role":"authenticated"}';
select is_empty($$ select 1 from public.athlete_messages $$, 'Le sportif ne lit encore aucun message');

reset role;
select is(
  (select read_at from public.athlete_messages where id = '3a000000-0000-4000-8000-000000000001'), null,
  'Coach B n''a pas pu marquer lu un message de l''organisation A'
);
select is(
  (select read_at from public.athlete_messages where id = '3a000000-0000-4000-8000-000000000002'), null,
  'Coach A ne marque pas lus ses propres messages'
);
select is(
  (select read_at from public.athlete_messages where id = '3b000000-0000-4000-8000-000000000001') is not null,
  true,
  'Coach B marque lus les messages de son organisation'
);

set local role anon;
set local request.jwt.claims = '{"role":"anon"}';
select throws_ok($$ select 1 from public.athlete_messages $$, '42501', null, 'Un anonyme ne lit rien');

select * from finish();
rollback;
