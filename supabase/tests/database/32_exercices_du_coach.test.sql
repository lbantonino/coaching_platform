-- Exercices du coach (D-76) : un coach crée, modifie et supprime les exercices de SON organisation ;
-- jamais pour une autre organisation, jamais au nom d'un autre, jamais une donnée RepDB ; lien vidéo
-- en https seulement ; photos rangées dans le dossier de son organisation, invisibles pour les autres.
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

select results_eq(
  $$ select public, file_size_limit from storage.buckets where id = 'exercise-images' $$,
  $$ values (false, 5242880::bigint) $$,
  'L''espace des photos d''exercices est privé, 5 Mo par fichier'
);
select throws_ok(
  $$ insert into public.exercises (organization_id, name_fr, category, source, attribution_required, exportable)
     values ('aaaaaaaa-0000-4000-8000-000000000001', 'Copie RepDB', 'strength', 'coach', true, false) $$,
  '23514', null, 'Un exercice d''organisation ne porte jamais de donnée RepDB'
);

set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}';

select lives_ok(
  $$ insert into public.exercises (id, organization_id, name_fr, category, primary_muscles, equipment,
       instructions_fr, video_url, image_main, image_source, variant_of, source, created_by)
     select 'e1e1e1e1-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000001',
       'Mobilité de hanche maison', 'mobility', '{hips}', '{mat}', '{"Pose le genou au sol."}',
       'https://www.instagram.com/reel/abc/',
       'org/aaaaaaaa-0000-4000-8000-000000000001/f0f0f0f0-0000-4000-8000-000000000001.jpg', 'coach',
       id, 'coach', '11111111-1111-4111-8111-111111111111'
     from public.exercises where key = 'pigeon-stretch' $$,
  'Le coach A crée son exercice, variante d''un exercice du catalogue, avec photo et vidéo'
);
select throws_ok(
  $$ insert into public.exercises (organization_id, name_fr, category, source, created_by)
     values ('bbbbbbbb-0000-4000-8000-000000000002', 'Intrus', 'strength', 'coach',
       '11111111-1111-4111-8111-111111111111') $$,
  '42501', null, 'Le coach A ne crée rien dans l''organisation B'
);
select throws_ok(
  $$ insert into public.exercises (organization_id, name_fr, category, source, created_by)
     values ('aaaaaaaa-0000-4000-8000-000000000001', 'Au nom de B', 'strength', 'coach',
       '22222222-2222-4222-8222-222222222222') $$,
  '42501', null, 'Le coach A ne crée pas d''exercice au nom d''un autre'
);
select throws_ok(
  $$ insert into public.exercises (organization_id, name_fr, category, source, created_by)
     values ('aaaaaaaa-0000-4000-8000-000000000001', 'Faux RepDB', 'strength', 'repdb',
       '11111111-1111-4111-8111-111111111111') $$,
  '42501', null, 'Un coach ne crée pas d''exercice « RepDB »'
);
select throws_ok(
  $$ insert into public.exercises (organization_id, name_fr, category, source, created_by, video_url)
     values ('aaaaaaaa-0000-4000-8000-000000000001', 'Vidéo http', 'strength', 'coach',
       '11111111-1111-4111-8111-111111111111', 'http://youtube.com/watch?v=1') $$,
  '23514', null, 'Un lien vidéo doit commencer par https://'
);
select throws_ok(
  $$ insert into public.exercises (organization_id, name_fr, category, source, created_by, image_main)
     values ('aaaaaaaa-0000-4000-8000-000000000001', 'Photo ailleurs', 'strength', 'coach',
       '11111111-1111-4111-8111-111111111111',
       'org/bbbbbbbb-0000-4000-8000-000000000002/f0f0f0f0-0000-4000-8000-000000000002.jpg') $$,
  '23514', null, 'La photo est rangée dans le dossier de l''organisation de l''exercice'
);
select results_eq(
  $$ update public.exercises set name_fr = 'Mobilité de hanche' where id = 'e1e1e1e1-0000-4000-8000-000000000001'
     returning name_fr $$,
  $$ values ('Mobilité de hanche'::text) $$,
  'Le coach A modifie son exercice'
);
select lives_ok(
  $$ insert into storage.objects (bucket_id, name)
     values ('exercise-images', 'org/aaaaaaaa-0000-4000-8000-000000000001/f0f0f0f0-0000-4000-8000-000000000001.jpg') $$,
  'Le coach A dépose une photo dans le dossier de son organisation'
);
select throws_ok(
  $$ insert into storage.objects (bucket_id, name)
     values ('exercise-images', 'org/bbbbbbbb-0000-4000-8000-000000000002/intrus.jpg') $$,
  '42501', null, 'Le coach A ne dépose rien dans le dossier de l''organisation B'
);

set local request.jwt.claims = '{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}';
select is_empty(
  $$ select 1 from public.exercises where organization_id = 'aaaaaaaa-0000-4000-8000-000000000001' $$,
  'Le coach B ne voit pas l''exercice de A'
);
select is_empty(
  $$ update public.exercises set name_fr = 'Piraté par B' where id = 'e1e1e1e1-0000-4000-8000-000000000001'
     returning id $$,
  'Le coach B ne modifie pas l''exercice de A'
);
select is_empty(
  $$ select 1 from storage.objects where bucket_id = 'exercise-images' $$,
  'Le coach B ne voit aucune photo de A'
);

set local request.jwt.claims = '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}';
select results_eq(
  $$ delete from public.exercises where id = 'e1e1e1e1-0000-4000-8000-000000000001' returning name_fr $$,
  $$ values ('Mobilité de hanche'::text) $$,
  'Le coach A supprime son exercice (B ne l''avait pas modifié)'
);
select is(
  (select count(*)::int from public.exercises where organization_id is null and visibility = 'active'),
  693, 'Le catalogue commun est intact'
);

select * from finish();
rollback;
