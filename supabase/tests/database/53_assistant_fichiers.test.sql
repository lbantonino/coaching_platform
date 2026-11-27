-- Fichiers joints à l'Assistant IA (D-213, 27/11/2026) : chaque coach ne voit et ne dépose que les
-- siens ; il n'écrit jamais les champs préparés (identifiant Anthropic) ; 300 Mo sur 24 h ; rien pour
-- la démo.
begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(13);

insert into auth.users (id, email) values
  ('11111111-1111-4111-8111-111111111111', 'test-coach-a@example.test'),
  ('33333333-3333-4333-8333-333333333333', 'test-coach-a2@example.test'),
  ('55555555-5555-4555-8555-555555555555', 'test-demo@example.test');
insert into public.organizations (id, name, slug) values
  ('aaaaaaaa-0000-4000-8000-000000000001', 'Test Org A', 'test-org-a'),
  ('bbbbbbbb-0000-4000-8000-000000000002', 'Test Org B', 'test-org-b'),
  ('dddddddd-0000-4000-8000-000000000004', 'Test Org démo', 'test-org-demo');
insert into public.organization_members (organization_id, user_id, role) values
  ('aaaaaaaa-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 'owner'),
  ('aaaaaaaa-0000-4000-8000-000000000001', '33333333-3333-4333-8333-333333333333', 'coach'),
  ('dddddddd-0000-4000-8000-000000000004', '55555555-5555-4555-8555-555555555555', 'owner');
insert into private.demo_accounts (user_id, organization_id)
values ('55555555-5555-4555-8555-555555555555', 'dddddddd-0000-4000-8000-000000000004');

set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}';

-- 1. Le coach A réserve son fichier (durcissement du 27/11 : par la base seulement, chemin fixé par
--    elle) ; jamais d'ajout direct.
select lives_ok(
  $$ select * from public.reserve_assistant_file('aaaaaaaa-0000-4000-8000-000000000001',
       'plan.pdf', 'application/pdf', 1000) $$,
  'Le coach réserve son fichier'
);
select throws_ok(
  $$ insert into public.assistant_files (organization_id, storage_path, name, mime_type, size_bytes)
     values ('aaaaaaaa-0000-4000-8000-000000000001',
             'aaaaaaaa-0000-4000-8000-000000000001/33333333-3333-4333-8333-333333333333/y',
             'autre.pdf', 'application/pdf', 1000) $$,
  '42501', null, 'Jamais d''ajout direct (ni dans le dossier d''un autre coach)'
);
-- 2. Jamais d'identifiant Anthropic écrit par le coach (ni à l'ajout, ni après).
select throws_ok(
  $$ insert into public.assistant_files (organization_id, storage_path, name, mime_type, size_bytes, anthropic_file_id)
     values ('aaaaaaaa-0000-4000-8000-000000000001',
             'aaaaaaaa-0000-4000-8000-000000000001/11111111-1111-4111-8111-111111111111/z',
             'z.pdf', 'application/pdf', 1000, 'file_vole') $$,
  '42501', null, 'Pas d''identifiant Anthropic à l''ajout'
);
select throws_ok(
  $$ update public.assistant_files set anthropic_file_id = 'file_vole'
      where name = 'plan.pdf' $$,
  '42501', null, 'Pas de modification par le coach'
);
select throws_ok(
  $$ insert into public.assistant_files (organization_id, storage_path, name, mime_type, size_bytes)
     values ('bbbbbbbb-0000-4000-8000-000000000002',
             'bbbbbbbb-0000-4000-8000-000000000002/11111111-1111-4111-8111-111111111111/w',
             'w.pdf', 'application/pdf', 1000) $$,
  '42501', null, 'Pas dans une organisation dont il n''est pas membre'
);

-- 3. Place : 300 Mo sur 24 h, 20 Mo par fichier.
select ok(public.assistant_files_room('aaaaaaaa-0000-4000-8000-000000000001', 20971520),
  '20 Mo : il reste de la place');
select ok(not public.assistant_files_room('aaaaaaaa-0000-4000-8000-000000000001', 20971521),
  'Plus de 20 Mo : refusé');
reset role;
insert into public.assistant_files (organization_id, user_id, storage_path, name, mime_type, size_bytes)
select 'aaaaaaaa-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111',
       'aaaaaaaa-0000-4000-8000-000000000001/11111111-1111-4111-8111-111111111111/q' || n,
       'gros.pdf', 'application/pdf', 20971520
  from generate_series(1, 14) n;
set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}';
select ok(not public.assistant_files_room('aaaaaaaa-0000-4000-8000-000000000001', 20971520),
  'Au-delà de 300 Mo sur 24 h : refusé');
reset role;

-- 4. Un autre coach, même organisation : ne voit ni ne supprime rien.
set local role authenticated;
set local request.jwt.claims = '{"sub":"33333333-3333-4333-8333-333333333333","role":"authenticated"}';
select is((select count(*)::int from public.assistant_files), 0, 'Un autre coach ne voit rien');
select throws_ok(
  $$ delete from public.assistant_files where name = 'plan.pdf' $$,
  '42501', null, 'Ni ne supprime (pas de suppression directe)'
);
select ok(public.assistant_files_room('aaaaaaaa-0000-4000-8000-000000000001', 20971520),
  'Sa place à lui ne compte pas les fichiers de A');
reset role;
select is(
  (select count(*)::int from public.assistant_files where name = 'plan.pdf'),
  1, 'Le fichier de A est intact'
);

-- 5. Démo : rien.
set local role authenticated;
set local request.jwt.claims = '{"sub":"55555555-5555-4555-8555-555555555555","role":"authenticated"}';
select ok(not public.assistant_files_room('dddddddd-0000-4000-8000-000000000004', 1000),
  'Démo : pas de place du tout');
reset role;

select * from finish();
rollback;
