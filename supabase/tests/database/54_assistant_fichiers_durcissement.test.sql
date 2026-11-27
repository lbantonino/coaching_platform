-- Fichiers joints à l'Assistant IA, durcissement (relecture du 27/11/2026, D-213) : le coach ne dépose
-- ni ne supprime rien lui-même ; la place se réserve par la base (300 Mo sur 24 h, verrou) ; la liste
-- des fichiers orphelins est réservée au serveur.
begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(9);

insert into auth.users (id, email) values
  ('11111111-1111-4111-8111-111111111111', 'test-coach-a@example.test'),
  ('55555555-5555-4555-8555-555555555555', 'test-demo@example.test');
insert into public.organizations (id, name, slug) values
  ('aaaaaaaa-0000-4000-8000-000000000001', 'Test Org A', 'test-org-a'),
  ('dddddddd-0000-4000-8000-000000000004', 'Test Org démo', 'test-org-demo');
insert into public.organization_members (organization_id, user_id, role) values
  ('aaaaaaaa-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 'owner'),
  ('dddddddd-0000-4000-8000-000000000004', '55555555-5555-4555-8555-555555555555', 'owner');
insert into private.demo_accounts (user_id, organization_id)
values ('55555555-5555-4555-8555-555555555555', 'dddddddd-0000-4000-8000-000000000004');

set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}';

-- 1. Réserver : chemin fixé par la base, dans le dossier du coach.
select matches(
  (select storage_path from public.reserve_assistant_file(
     'aaaaaaaa-0000-4000-8000-000000000001', 'plan.pdf', 'application/pdf', 1000)),
  '^aaaaaaaa-0000-4000-8000-000000000001/11111111-1111-4111-8111-111111111111/[0-9a-f-]{36}$',
  'La base fixe le chemin, dans le dossier du coach'
);
select throws_ok(
  $$ select * from public.reserve_assistant_file('aaaaaaaa-0000-4000-8000-000000000001', 'x.pdf', 'application/pdf', 20971521) $$,
  '22023', 'taille_refusee', 'Plus de 20 Mo : refusé'
);
-- 2. Plus de dépôt ni de suppression directs.
select throws_ok(
  $$ insert into public.assistant_files (organization_id, storage_path, name, mime_type, size_bytes)
     values ('aaaaaaaa-0000-4000-8000-000000000001',
             'aaaaaaaa-0000-4000-8000-000000000001/11111111-1111-4111-8111-111111111111/z', 'z.pdf', 'application/pdf', 1) $$,
  '42501', null, 'Pas d''ajout direct dans la table'
);
select throws_ok(
  $$ delete from public.assistant_files $$,
  '42501', null, 'Pas de suppression directe dans la table'
);
select throws_ok(
  $$ insert into storage.objects (bucket_id, name, owner)
     values ('assistant-files', 'aaaaaaaa-0000-4000-8000-000000000001/11111111-1111-4111-8111-111111111111/direct', '11111111-1111-4111-8111-111111111111') $$,
  '42501', null, 'Pas de dépôt direct dans le stockage avec la session du coach'
);
select throws_ok(
  $$ select * from public.assistant_files_orphans() $$,
  '42501', null, 'La liste des orphelins est réservée au serveur'
);
reset role;

-- 3. Place épuisée : 300 Mo sur 24 h.
insert into public.assistant_files (organization_id, user_id, storage_path, name, mime_type, size_bytes)
select 'aaaaaaaa-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111',
       'aaaaaaaa-0000-4000-8000-000000000001/11111111-1111-4111-8111-111111111111/q' || n,
       'gros.pdf', 'application/pdf', 20971520
  from generate_series(1, 14) n;
set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}';
select throws_ok(
  $$ select * from public.reserve_assistant_file('aaaaaaaa-0000-4000-8000-000000000001', 'x.pdf', 'application/pdf', 20971520) $$,
  '22023', 'place_epuisee', 'Au-delà de 300 Mo sur 24 h : refusé'
);
reset role;

-- 4. Démo : refusée.
set local role authenticated;
set local request.jwt.claims = '{"sub":"55555555-5555-4555-8555-555555555555","role":"authenticated"}';
select throws_ok(
  $$ select * from public.reserve_assistant_file('dddddddd-0000-4000-8000-000000000004', 'x.pdf', 'application/pdf', 10) $$,
  '42501', null, 'Démo : refusée'
);
reset role;

-- 5. Le serveur voit les orphelins de plus de 24 h.
set local role service_role;
select lives_ok($$ select * from public.assistant_files_orphans() $$, 'Le serveur liste les orphelins');
reset role;

select * from finish();
rollback;
