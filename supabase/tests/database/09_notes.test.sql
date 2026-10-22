-- Tests des notes du coach (P2-03 fin) : une note de chaque sorte, droits des coachs, et surtout :
-- le sportif ne lit JAMAIS la note privée, seulement celle qui lui est destinée.
begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(14);

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
  ('a1a1a1a1-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000001', 'Avec compte',
   '33333333-3333-4333-8333-333333333333'),
  ('a2a2a2a2-0000-4000-8000-000000000002', 'aaaaaaaa-0000-4000-8000-000000000001', 'Autre', null);

-- ---------------------------------------------------------------------
-- Cohérence
-- ---------------------------------------------------------------------
select throws_ok(
  $$ insert into public.athlete_notes (organization_id, athlete_id, visibility, body)
     values ('aaaaaaaa-0000-4000-8000-000000000001', 'a2a2a2a2-0000-4000-8000-000000000002', 'public', 'x') $$,
  '23514', null, 'La visibilité est « coach » ou « athlete »'
);
select throws_ok(
  $$ insert into public.athlete_notes (organization_id, athlete_id, visibility, body)
     values ('aaaaaaaa-0000-4000-8000-000000000001', 'a2a2a2a2-0000-4000-8000-000000000002', 'coach', '   ') $$,
  '23514', null, 'Une note vide est refusée (on la supprime plutôt)'
);

-- ---------------------------------------------------------------------
-- Coach A connecté
-- ---------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}';

select lives_ok(
  $$ insert into public.athlete_notes (organization_id, athlete_id, visibility, body, created_by, updated_by)
     values
       ('aaaaaaaa-0000-4000-8000-000000000001', 'a1a1a1a1-0000-4000-8000-000000000001', 'coach',
        'Note privée du coach', '11111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111'),
       ('aaaaaaaa-0000-4000-8000-000000000001', 'a1a1a1a1-0000-4000-8000-000000000001', 'athlete',
        'Message pour le sportif', '11111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111') $$,
  'Coach A écrit une note privée et une note visible par le sportif'
);
select throws_ok(
  $$ insert into public.athlete_notes (organization_id, athlete_id, visibility, body, created_by)
     values ('aaaaaaaa-0000-4000-8000-000000000001', 'a1a1a1a1-0000-4000-8000-000000000001', 'coach',
             'Doublon', '11111111-1111-4111-8111-111111111111') $$,
  '23505', null, 'Une seule note de chaque sorte par sportif'
);
select lives_ok(
  $$ update public.athlete_notes set body = 'Note privée mise à jour', updated_by = '11111111-1111-4111-8111-111111111111'
     where athlete_id = 'a1a1a1a1-0000-4000-8000-000000000001' and visibility = 'coach' $$,
  'Coach A met à jour sa note'
);
select throws_ok(
  $$ update public.athlete_notes set visibility = 'athlete'
     where athlete_id = 'a1a1a1a1-0000-4000-8000-000000000001' and visibility = 'coach' $$,
  '42501', null, 'Une note privée ne peut pas devenir visible par un simple changement de colonne'
);
select throws_ok(
  $$ update public.athlete_notes set body = 'Usurpé', updated_by = '22222222-2222-4222-8222-222222222222'
     where athlete_id = 'a1a1a1a1-0000-4000-8000-000000000001' and visibility = 'coach' $$,
  '42501', null, 'updated_by ne peut pas être attribué à quelqu''un d''autre'
);

-- ---------------------------------------------------------------------
-- Coach B : rien
-- ---------------------------------------------------------------------
set local request.jwt.claims = '{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}';
select is_empty($$ select 1 from public.athlete_notes $$, 'Coach B ne lit aucune note de l''organisation A');
select throws_ok(
  $$ insert into public.athlete_notes (organization_id, athlete_id, visibility, body, created_by)
     values ('aaaaaaaa-0000-4000-8000-000000000001', 'a2a2a2a2-0000-4000-8000-000000000002', 'coach',
             'Intrus', '22222222-2222-4222-8222-222222222222') $$,
  '42501', null, 'Coach B ne peut pas écrire de note dans l''organisation A'
);

-- ---------------------------------------------------------------------
-- Le sportif : seulement la note qui lui est destinée, en lecture
-- ---------------------------------------------------------------------
set local request.jwt.claims = '{"sub":"33333333-3333-4333-8333-333333333333","role":"authenticated"}';
select results_eq(
  $$ select visibility, body from public.athlete_notes $$,
  $$ values ('athlete', 'Message pour le sportif') $$,
  'Le sportif lit la note qui lui est destinée'
);
select is_empty(
  $$ select 1 from public.athlete_notes where visibility = 'coach' $$,
  'Le sportif ne lit JAMAIS la note privée du coach'
);
select throws_ok(
  $$ insert into public.athlete_notes (organization_id, athlete_id, visibility, body, created_by)
     values ('aaaaaaaa-0000-4000-8000-000000000001', 'a1a1a1a1-0000-4000-8000-000000000001', 'coach',
             'Je m''écris une note', '33333333-3333-4333-8333-333333333333') $$,
  '42501', null, 'Le sportif ne peut pas écrire de note'
);
update public.athlete_notes set body = 'Modifié par le sportif', updated_by = '33333333-3333-4333-8333-333333333333';
reset role;
select results_eq(
  $$ select body from public.athlete_notes
     where athlete_id = 'a1a1a1a1-0000-4000-8000-000000000001' and visibility = 'athlete' $$,
  $$ values ('Message pour le sportif') $$,
  'Le sportif ne peut pas modifier la note qui lui est destinée'
);

set local role anon;
set local request.jwt.claims = '{"role":"anon"}';
select throws_ok($$ select 1 from public.athlete_notes $$, '42501', null, 'Un anonyme ne lit rien');

select * from finish();
rollback;
