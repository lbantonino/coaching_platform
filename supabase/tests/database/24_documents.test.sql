-- Documents du coach (4e, D-60) : stockage privé rangé par organisation, fiche du document cohérente,
-- isolation entre organisations, le sportif n'y a pas accès.
begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(15);

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
insert into public.coach_documents (id, organization_id, name, storage_path, mime_type, size_bytes)
values ('d0c00000-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000001', 'Contrat',
        'org/aaaaaaaa-0000-4000-8000-000000000001/d0c00000-0000-4000-8000-000000000001.pdf',
        'application/pdf', 1200);
insert into storage.objects (bucket_id, name) values
  ('coach-documents', 'org/aaaaaaaa-0000-4000-8000-000000000001/d0c00000-0000-4000-8000-000000000001.pdf');

select results_eq(
  $$ select public, file_size_limit from storage.buckets where id = 'coach-documents' $$,
  $$ values (false, 10485760::bigint) $$,
  'L''espace des documents est privé, 10 Mo par fichier'
);
select throws_ok(
  $$ insert into public.coach_documents (organization_id, name, storage_path, mime_type, size_bytes)
     values ('aaaaaaaa-0000-4000-8000-000000000001', 'Ailleurs',
             'org/bbbbbbbb-0000-4000-8000-000000000002/x.pdf', 'application/pdf', 10) $$,
  '23514', null, 'Le fichier d''un document est rangé dans le dossier de SA organisation'
);
select throws_ok(
  $$ insert into public.coach_documents (organization_id, name, storage_path, mime_type, size_bytes)
     values ('aaaaaaaa-0000-4000-8000-000000000001', 'Script',
             'org/aaaaaaaa-0000-4000-8000-000000000001/x.html', 'text/html', 10) $$,
  '23514', null, 'Seuls PDF, images, Word et Excel sont acceptés'
);
select throws_ok(
  $$ insert into public.coach_documents (organization_id, name, storage_path, mime_type, size_bytes)
     values ('aaaaaaaa-0000-4000-8000-000000000001', 'Énorme',
             'org/aaaaaaaa-0000-4000-8000-000000000001/y.pdf', 'application/pdf', 10485761) $$,
  '23514', null, 'Un document fait 10 Mo au plus'
);
select throws_ok(
  $$ insert into public.coach_documents (organization_id, name, athlete_id, storage_path, mime_type, size_bytes)
     values ('aaaaaaaa-0000-4000-8000-000000000001', 'Sportif de B', 'b1b1b1b1-0000-4000-8000-000000000001',
             'org/aaaaaaaa-0000-4000-8000-000000000001/z.pdf', 'application/pdf', 10) $$,
  '23503', null, 'Un document ne vise pas un sportif d''une autre organisation'
);

-- ---------------------------------------------------------------------
-- Coach A connecté
-- ---------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}';
select lives_ok(
  $$ update public.coach_documents set name = 'Contrat signé',
     athlete_id = 'a1a1a1a1-0000-4000-8000-000000000001'
     where id = 'd0c00000-0000-4000-8000-000000000001' $$,
  'Coach A renomme son document et le relie à son sportif'
);
select throws_ok(
  $$ update public.coach_documents set storage_path = 'org/aaaaaaaa-0000-4000-8000-000000000001/autre.pdf'
     where id = 'd0c00000-0000-4000-8000-000000000001' $$,
  '42501', null, 'Le fichier d''un document ne se remplace pas depuis le navigateur'
);
select lives_ok(
  $$ insert into storage.objects (bucket_id, name)
     values ('coach-documents', 'org/aaaaaaaa-0000-4000-8000-000000000001/nouveau.pdf') $$,
  'Coach A dépose un fichier dans le dossier de son organisation'
);
select throws_ok(
  $$ insert into storage.objects (bucket_id, name)
     values ('coach-documents', 'org/bbbbbbbb-0000-4000-8000-000000000002/intrus.pdf') $$,
  '42501', null, 'Coach A ne dépose rien dans le dossier de l''organisation B'
);

-- ---------------------------------------------------------------------
-- Coach B : rien de l'organisation A
-- ---------------------------------------------------------------------
set local request.jwt.claims = '{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}';
select is_empty($$ select 1 from public.coach_documents $$, 'Coach B ne lit aucun document de A');
select is_empty(
  $$ select 1 from storage.objects where bucket_id = 'coach-documents' $$,
  'Coach B ne voit aucun fichier de A dans le stockage'
);
update public.coach_documents set name = 'Modifié par B';
delete from public.coach_documents;

-- ---------------------------------------------------------------------
-- Le sportif de A : jamais les documents de son coach (le partage viendra en P5)
-- ---------------------------------------------------------------------
set local request.jwt.claims = '{"sub":"33333333-3333-4333-8333-333333333333","role":"authenticated"}';
select is_empty($$ select 1 from public.coach_documents $$, 'Le sportif ne lit pas les documents du coach');
select is_empty(
  $$ select 1 from storage.objects where bucket_id = 'coach-documents' $$,
  'Le sportif ne voit aucun fichier du coach'
);

reset role;
select results_eq(
  $$ select name from public.coach_documents where id = 'd0c00000-0000-4000-8000-000000000001' $$,
  $$ values ('Contrat signé'::text) $$,
  'Coach B n''a pu ni renommer ni supprimer le document de A'
);

set local role anon;
set local request.jwt.claims = '{"role":"anon"}';
select throws_ok($$ select 1 from public.coach_documents $$, '42501', null, 'Un anonyme ne lit rien');

select * from finish();
rollback;
