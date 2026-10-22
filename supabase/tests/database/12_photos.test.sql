-- Tests des photos de profil (D-28) : stockage privé, droits par organisation, profil du coach.
begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(12);

insert into auth.users (id, email) values
  ('11111111-1111-4111-8111-111111111111', 'test-coach-a@example.test'),
  ('12121212-1212-4121-8121-121212121212', 'test-coach-a2@example.test'),
  ('22222222-2222-4222-8222-222222222222', 'test-coach-b@example.test');
insert into public.organizations (id, name, slug) values
  ('aaaaaaaa-0000-4000-8000-000000000001', 'Test Org A', 'test-org-a'),
  ('bbbbbbbb-0000-4000-8000-000000000002', 'Test Org B', 'test-org-b');
insert into public.organization_members (organization_id, user_id, role) values
  ('aaaaaaaa-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 'owner'),
  ('aaaaaaaa-0000-4000-8000-000000000001', '12121212-1212-4121-8121-121212121212', 'coach'),
  ('bbbbbbbb-0000-4000-8000-000000000002', '22222222-2222-4222-8222-222222222222', 'owner');
insert into public.athlete_profiles (id, organization_id, first_name) values
  ('a1a1a1a1-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000001', 'Sportif A');
insert into public.coach_profiles (user_id, first_name) values
  ('12121212-1212-4121-8121-121212121212', 'Collègue'),
  ('22222222-2222-4222-8222-222222222222', 'Coach B');
insert into storage.objects (bucket_id, name) values
  ('profile-photos', 'org/bbbbbbbb-0000-4000-8000-000000000002/athlete/b1/photo.jpg'),
  ('profile-photos', 'user/12121212-1212-4121-8121-121212121212/photo.jpg');

select results_eq(
  $$ select public from storage.buckets where id = 'profile-photos' $$,
  $$ values (false) $$,
  'L''espace des photos est privé (aucune adresse publique)'
);
select throws_ok(
  $$ update public.athlete_profiles set photo_path = 'ailleurs/photo.jpg'
     where id = 'a1a1a1a1-0000-4000-8000-000000000001' $$,
  '23514', null,
  'La photo d''un sportif est forcément rangée dans le dossier d''une organisation'
);

-- ---------------------------------------------------------------------
-- Coach A connecté
-- ---------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}';

select lives_ok(
  $$ insert into storage.objects (bucket_id, name)
     values ('profile-photos', 'org/aaaaaaaa-0000-4000-8000-000000000001/athlete/a1/photo.jpg') $$,
  'Coach A dépose la photo d''un sportif de son organisation'
);
select throws_ok(
  $$ insert into storage.objects (bucket_id, name)
     values ('profile-photos', 'org/bbbbbbbb-0000-4000-8000-000000000002/athlete/b1/intrus.jpg') $$,
  '42501', null,
  'Coach A ne dépose rien dans le dossier de l''organisation B'
);
select throws_ok(
  $$ insert into storage.objects (bucket_id, name)
     values ('profile-photos', 'user/22222222-2222-4222-8222-222222222222/intrus.jpg') $$,
  '42501', null,
  'Coach A ne remplace pas la photo d''un autre coach'
);
select lives_ok(
  $$ insert into storage.objects (bucket_id, name)
     values ('profile-photos', 'user/11111111-1111-4111-8111-111111111111/moi.jpg') $$,
  'Coach A dépose sa propre photo'
);
select is_empty(
  $$ select 1 from storage.objects where name like 'org/bbbbbbbb-0000-4000-8000-000000000002/%' $$,
  'Coach A ne voit pas les photos de l''organisation B'
);
select isnt_empty(
  $$ select 1 from storage.objects where name = 'user/12121212-1212-4121-8121-121212121212/photo.jpg' $$,
  'Coach A voit la photo d''un collègue de son organisation'
);
select results_eq(
  $$ select first_name from public.coach_profiles order by first_name $$,
  $$ values ('Collègue'::text) $$,
  'Coach A lit le profil de son collègue, jamais celui d''un coach d''une autre organisation'
);
select lives_ok(
  $$ insert into public.coach_profiles (user_id, first_name, photo_path)
     values ('11111111-1111-4111-8111-111111111111', 'Léo', 'user/11111111-1111-4111-8111-111111111111/moi.jpg') $$,
  'Coach A crée son profil avec sa photo'
);
select throws_ok(
  $$ insert into public.coach_profiles (user_id, first_name)
     values ('22222222-2222-4222-8222-222222222222', 'Usurpation') $$,
  '42501', null,
  'Coach A ne crée pas le profil d''un autre coach'
);

reset role;
set local role anon;
set local request.jwt.claims = '{"role":"anon"}';
select is_empty(
  $$ select 1 from storage.objects where bucket_id = 'profile-photos' $$,
  'Un anonyme ne voit aucune photo'
);

select * from finish();
rollback;
