-- Bibliothèque d'exercices (D-75) : catalogue commun chargé et cohérent, lisible par tout coach mais
-- jamais modifiable par l'application ; favoris propres à chaque personne ; un exercice propre à une
-- organisation reste invisible pour les autres, même pour le mettre en favori.
begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(17);

insert into auth.users (id, email) values
  ('11111111-1111-4111-8111-111111111111', 'test-coach-a@example.test'),
  ('22222222-2222-4222-8222-222222222222', 'test-coach-b@example.test');
insert into public.organizations (id, name, slug) values
  ('aaaaaaaa-0000-4000-8000-000000000001', 'Test Org A', 'test-org-a'),
  ('bbbbbbbb-0000-4000-8000-000000000002', 'Test Org B', 'test-org-b');
insert into public.organization_members (organization_id, user_id, role) values
  ('aaaaaaaa-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 'owner'),
  ('bbbbbbbb-0000-4000-8000-000000000002', '22222222-2222-4222-8222-222222222222', 'owner');
-- Un exercice propre à l'organisation B (la future « Créer un exercice »).
insert into public.exercises (id, organization_id, name_fr, category, source) values
  ('e5e5e5e5-0000-4000-8000-000000000001', 'bbbbbbbb-0000-4000-8000-000000000002',
   'Exercice maison de B', 'strength', 'coach');

-- Le catalogue chargé par la migration.
select results_eq(
  $$ select visibility, count(*)::int from public.exercises where organization_id is null
     group by visibility order by visibility $$,
  $$ values ('active'::text, 693), ('hidden', 54) $$,
  'Le catalogue commun compte 693 exercices visibles et 54 masqués'
);
select results_eq(
  $$ select category, count(*)::int from public.exercises
     where organization_id is null and visibility = 'active' group by category order by category $$,
  $$ values ('cardio'::text, 17), ('hyrox', 8), ('mobility', 88), ('strength', 580) $$,
  'Visibles : 580 en musculation, 17 en cardio, 8 en Hyrox (les 8 stations), 88 en mobilité'
);
-- Contenu écrit par Coory (31/10) : six consignes et les muscles principaux de ses trois exercices Hyrox.
select results_eq(
  $$ select key, cardinality(instructions_fr), primary_muscles from public.exercises
     where key in ('sled-pull', 'burpee-broad-jump', 'sandbag-walking-lunge') order by key $$,
  $$ values ('burpee-broad-jump'::text, 6, '{quadriceps,gluteus_maximus,chest,triceps_brachii}'::text[]),
            ('sandbag-walking-lunge', 6, '{quadriceps,gluteus_maximus,hamstrings}'),
            ('sled-pull', 6, '{latissimus_dorsi,trapezius,biceps_brachii,quadriceps}') $$,
  'Sled pull, Burpee broad jump et Sandbag lunges ont leurs six consignes et leurs muscles principaux'
);
select results_eq(
  $$ select hyrox_station::int from public.exercises where hyrox_station is not null order by 1 $$,
  $$ values (1), (2), (3), (4), (5), (6), (7), (8) $$,
  'Les 8 stations Hyrox sont numérotées une seule fois'
);
select is_empty(
  $$ select key from public.exercises
     where organization_id is null and visibility = 'active' and source = 'repdb'
       and (not attribution_required or exportable or (image_main is null and image_start is null)) $$,
  'Chaque exercice RepDB visible a son image, la mention obligatoire et n''est pas exportable'
);
select is_empty(
  $$ select key from public.exercises where category = 'hyrox' and image_source = 'repdb' $$,
  'Aucune image RepDB dans l''Hyrox'
);

-- Personne non connectée : rien.
set local role anon;
select throws_ok(
  $$ select count(*) from public.exercises $$,
  '42501', null, 'Une personne non connectée ne lit pas la bibliothèque'
);
reset role;

set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}';
select is(
  (select count(*)::int from public.exercises where visibility = 'active'),
  693, 'Le coach A lit le catalogue commun'
);
select is_empty(
  $$ select 1 from public.exercises where organization_id = 'bbbbbbbb-0000-4000-8000-000000000002' $$,
  'Le coach A ne voit pas l''exercice propre à B'
);
-- Depuis D-76, un coach peut modifier les exercices de SON organisation : sur le catalogue commun,
-- la mise à jour ne touche simplement aucune ligne.
select is_empty(
  $$ update public.exercises set name_fr = 'Piraté' where key = 'squat' returning id $$,
  'Le catalogue commun ne se modifie pas depuis l''application'
);
select throws_ok(
  $$ insert into public.exercises (name_fr, category, source, key) values ('Nouveau', 'strength', 'repdb', 'nouveau') $$,
  '42501', null, 'On n''ajoute pas d''exercice au catalogue commun'
);
select is_empty(
  $$ delete from public.exercises where key = 'squat' returning id $$,
  'On ne supprime pas un exercice du catalogue commun'
);

-- Favoris.
select lives_ok(
  $$ insert into public.exercise_favorites (user_id, exercise_id)
     select '11111111-1111-4111-8111-111111111111', id from public.exercises where key = 'sled-pull' $$,
  'Le coach A met le Sled pull en favori'
);
select throws_ok(
  $$ insert into public.exercise_favorites (user_id, exercise_id)
     select '22222222-2222-4222-8222-222222222222', id from public.exercises where key = 'squat' $$,
  '42501', null, 'Le coach A ne crée pas de favori au nom de B'
);
select throws_ok(
  $$ insert into public.exercise_favorites (user_id, exercise_id)
     values ('11111111-1111-4111-8111-111111111111', 'e5e5e5e5-0000-4000-8000-000000000001') $$,
  '42501', null, 'Le coach A ne met pas en favori un exercice propre à B'
);

set local request.jwt.claims = '{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}';
select is_empty(
  $$ select 1 from public.exercise_favorites where user_id = '11111111-1111-4111-8111-111111111111' $$,
  'Le coach B ne voit pas les favoris de A'
);
select is(
  (select name_fr from public.exercises where id = 'e5e5e5e5-0000-4000-8000-000000000001'),
  'Exercice maison de B', 'Le coach B voit son propre exercice'
);

select * from finish();
rollback;
