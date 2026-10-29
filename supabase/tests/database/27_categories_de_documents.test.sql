-- Catégories de documents (D-67) : 5 catégories de départ pour chaque organisation, noms uniques
-- par organisation (sans tenir compte des majuscules), un document ne pointe que vers une catégorie
-- de SON organisation, supprimer une catégorie laisse ses documents « sans catégorie », isolation.
begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(9);

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
  $$ select name from public.document_categories
     where organization_id = 'aaaaaaaa-0000-4000-8000-000000000001' order by name $$,
  $$ values ('Autre'::text), ('Bilan'), ('Contrat'), ('Facture'), ('Programme') $$,
  'Une nouvelle organisation reçoit les 5 catégories de départ'
);

select throws_ok(
  $$ insert into public.coach_documents (organization_id, name, category_id, storage_path, mime_type,
       size_bytes, created_by)
     select 'aaaaaaaa-0000-4000-8000-000000000001', 'Intrus', id,
       'org/aaaaaaaa-0000-4000-8000-000000000001/intrus.pdf', 'application/pdf', 10,
       '11111111-1111-4111-8111-111111111111'
     from public.document_categories
     where organization_id = 'bbbbbbbb-0000-4000-8000-000000000002' limit 1 $$,
  '23503', null, 'Un document ne pointe pas vers une catégorie d''une autre organisation (même hors RLS)'
);

set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}';

select lives_ok(
  $$ insert into public.document_categories (id, organization_id, name, created_by)
     values ('cacacaca-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000001',
             'Certificats médicaux', '11111111-1111-4111-8111-111111111111') $$,
  'Coach A crée une catégorie'
);
select throws_ok(
  $$ insert into public.document_categories (organization_id, name, created_by)
     values ('aaaaaaaa-0000-4000-8000-000000000001', '  certificats MÉDICAUX', '11111111-1111-4111-8111-111111111111') $$,
  null, null, 'Deux catégories ne portent pas le même nom dans une organisation'
);
update public.document_categories set name = 'Certificats'
where id = 'cacacaca-0000-4000-8000-000000000001';
select is(
  (select name from public.document_categories where id = 'cacacaca-0000-4000-8000-000000000001'),
  'Certificats', 'Coach A renomme sa catégorie'
);

insert into public.coach_documents (id, organization_id, name, category_id, storage_path, mime_type,
  size_bytes, created_by)
values ('d0c00000-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000001', 'Certificat',
  'cacacaca-0000-4000-8000-000000000001',
  'org/aaaaaaaa-0000-4000-8000-000000000001/d0c00000-0000-4000-8000-000000000001.pdf',
  'application/pdf', 1200, '11111111-1111-4111-8111-111111111111');

delete from public.document_categories where id = 'cacacaca-0000-4000-8000-000000000001';
select is(
  (select category_id from public.coach_documents where id = 'd0c00000-0000-4000-8000-000000000001'),
  null, 'Supprimer une catégorie laisse ses documents « sans catégorie »'
);
select isnt_empty(
  $$ select 1 from public.coach_documents where id = 'd0c00000-0000-4000-8000-000000000001' $$,
  'Le document, lui, reste'
);

-- Isolation : B ne voit ni ne modifie les catégories de A.
set local request.jwt.claims = '{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}';
select is(
  (select count(*)::int from public.document_categories
   where organization_id = 'aaaaaaaa-0000-4000-8000-000000000001'),
  0, 'Le coach B ne lit aucune catégorie de l''organisation A'
);
update public.document_categories set name = 'Piraté'
where organization_id = 'aaaaaaaa-0000-4000-8000-000000000001';
reset role;
select is(
  (select count(*)::int from public.document_categories where name = 'Piraté'),
  0, 'Le coach B ne renomme aucune catégorie de A'
);

select * from finish();
rollback;
