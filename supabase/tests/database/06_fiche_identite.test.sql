-- Tests de la fiche enrichie, partie identité et contact (P2-02, OPEN-01) :
-- nom complet calculé, contraintes des nouveaux champs, droits de modification et isolation.
begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(14);

insert into auth.users (id, email) values
  ('11111111-1111-4111-8111-111111111111', 'test-coach-a@example.test'),
  ('22222222-2222-4222-8222-222222222222', 'test-coach-b@example.test');
insert into public.organizations (id, name, slug) values
  ('aaaaaaaa-0000-4000-8000-000000000001', 'Test Org A', 'test-org-a'),
  ('bbbbbbbb-0000-4000-8000-000000000002', 'Test Org B', 'test-org-b');
insert into public.organization_members (organization_id, user_id, role) values
  ('aaaaaaaa-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 'owner'),
  ('bbbbbbbb-0000-4000-8000-000000000002', '22222222-2222-4222-8222-222222222222', 'owner');
insert into public.athlete_profiles (id, organization_id, first_name, last_name) values
  ('a1a1a1a1-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000001', 'Camille', 'Dupont'),
  ('a2a2a2a2-0000-4000-8000-000000000002', 'aaaaaaaa-0000-4000-8000-000000000001', 'Léa', null),
  ('b1b1b1b1-0000-4000-8000-000000000001', 'bbbbbbbb-0000-4000-8000-000000000002', 'Sportif', 'B');

-- ---------------------------------------------------------------------
-- Nom complet calculé par la base
-- ---------------------------------------------------------------------
select results_eq(
  $$ select display_name from public.athlete_profiles where id = 'a1a1a1a1-0000-4000-8000-000000000001' $$,
  $$ values ('Camille Dupont') $$,
  'Le nom complet est calculé à partir du prénom et du nom'
);
select results_eq(
  $$ select display_name from public.athlete_profiles where id = 'a2a2a2a2-0000-4000-8000-000000000002' $$,
  $$ values ('Léa') $$,
  'Sans nom de famille, le nom complet est le prénom seul'
);
select throws_ok(
  $$ insert into public.athlete_profiles (organization_id, first_name, display_name)
     values ('aaaaaaaa-0000-4000-8000-000000000001', 'Max', 'Autre nom') $$,
  '428C9', null,
  'Le nom complet ne s''écrit jamais directement'
);

-- ---------------------------------------------------------------------
-- Contraintes (en plus de Zod)
-- ---------------------------------------------------------------------
select throws_ok(
  $$ insert into public.athlete_profiles (organization_id, last_name)
     values ('aaaaaaaa-0000-4000-8000-000000000001', 'Sans prénom') $$,
  '23502', null,
  'Le prénom est obligatoire'
);
select throws_ok(
  $$ insert into public.athlete_profiles (organization_id, first_name, last_name)
     values ('aaaaaaaa-0000-4000-8000-000000000001', 'Max', '   ') $$,
  '23514', null,
  'Un nom de famille fait d''espaces est refusé (il doit être absent)'
);
select throws_ok(
  $$ insert into public.athlete_profiles (organization_id, first_name, preferred_contact)
     values ('aaaaaaaa-0000-4000-8000-000000000001', 'Max', 'pigeon') $$,
  '23514', null,
  'Le canal de contact appartient à la liste fermée'
);
select throws_ok(
  $$ insert into public.athlete_profiles (organization_id, first_name, level)
     values ('aaaaaaaa-0000-4000-8000-000000000001', 'Max', 'legende') $$,
  '23514', null,
  'Le niveau appartient à la liste fermée'
);
select throws_ok(
  $$ insert into public.athlete_profiles (organization_id, first_name, training_places)
     values ('aaaaaaaa-0000-4000-8000-000000000001', 'Max', '{gym,lune}') $$,
  '23514', null,
  'Chaque lieu d''entraînement appartient à la liste fermée'
);
select throws_ok(
  $$ insert into public.athlete_profiles (organization_id, first_name, experience)
     values ('aaaaaaaa-0000-4000-8000-000000000001', 'Max', repeat('x', 501)) $$,
  '23514', null,
  'L''expérience est limitée à 500 caractères'
);
select results_eq(
  $$ select training_places from public.athlete_profiles where id = 'a1a1a1a1-0000-4000-8000-000000000001' $$,
  $$ values ('{}'::text[]) $$,
  'Sans lieu indiqué, la liste des lieux est vide (jamais nulle)'
);

-- ---------------------------------------------------------------------
-- Coach A connecté
-- ---------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}';

select lives_ok(
  $$ update public.athlete_profiles
     set first_name = 'Léa', last_name = 'Martin', preferred_contact = 'whatsapp', level = 'intermediate',
         experience = 'Course depuis 3 ans', training_places = '{gym,outdoor}', equipment = 'Haltères 20 kg'
     where id = 'a1a1a1a1-0000-4000-8000-000000000001' $$,
  'Coach A modifie l''identité et le profil sportif d''un sportif de son organisation'
);
select results_eq(
  $$ select display_name, preferred_contact, level, training_places
     from public.athlete_profiles where id = 'a1a1a1a1-0000-4000-8000-000000000001' $$,
  $$ values ('Léa Martin', 'whatsapp', 'intermediate', '{gym,outdoor}'::text[]) $$,
  'Les modifications sont enregistrées et le nom complet suit'
);
select throws_ok(
  $$ update public.athlete_profiles set display_name = 'Autre nom'
     where id = 'a1a1a1a1-0000-4000-8000-000000000001' $$,
  '428C9', null,
  'Coach A ne peut pas écrire le nom complet directement'
);

-- La modification d'une fiche de B ne touche aucune ligne (invisible pour A).
update public.athlete_profiles set level = 'competitor', training_places = '{home}'
  where id = 'b1b1b1b1-0000-4000-8000-000000000001';
reset role;
select results_eq(
  $$ select level, training_places from public.athlete_profiles
     where id = 'b1b1b1b1-0000-4000-8000-000000000001' $$,
  $$ values (null::text, '{}'::text[]) $$,
  'Coach A ne peut pas modifier le profil d''un sportif de B'
);

select * from finish();
rollback;
