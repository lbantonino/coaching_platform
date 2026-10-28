-- Tâches complètes (4e, D-59) : « associée à » et note, modifiables et supprimables par les coachs de
-- l'organisation seulement.
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
insert into public.coach_tasks (id, organization_id, title) values
  ('7a000000-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000001', 'Tâche de A'),
  ('7a000000-0000-4000-8000-000000000002', 'aaaaaaaa-0000-4000-8000-000000000001', 'Autre tâche de A');

select throws_ok(
  $$ update public.coach_tasks set category = 'courses' where id = '7a000000-0000-4000-8000-000000000001' $$,
  '23514', null, '« Associée à » suit une liste fermée'
);
select throws_ok(
  $$ update public.coach_tasks set notes = repeat('a', 1001) where id = '7a000000-0000-4000-8000-000000000001' $$,
  '23514', null, 'La note fait 1000 caractères au plus'
);
select throws_ok(
  $$ update public.coach_tasks set notes = '   ' where id = '7a000000-0000-4000-8000-000000000001' $$,
  '23514', null, 'Une note vide s''écrit null, pas avec des espaces'
);

set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}';
select lives_ok(
  $$ update public.coach_tasks set category = 'facturation', notes = 'Facture d''octobre'
     where id = '7a000000-0000-4000-8000-000000000001' $$,
  'Coach A range sa tâche dans Facturation et ajoute une note'
);
select lives_ok(
  $$ delete from public.coach_tasks where id = '7a000000-0000-4000-8000-000000000002' $$,
  'Coach A supprime une tâche de son organisation'
);

set local request.jwt.claims = '{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}';
update public.coach_tasks set category = 'agenda', notes = 'Modifiée par B';
delete from public.coach_tasks;

reset role;
select results_eq(
  $$ select category, notes from public.coach_tasks where id = '7a000000-0000-4000-8000-000000000001' $$,
  $$ values ('facturation'::text, 'Facture d''octobre'::text) $$,
  'Coach B n''a pu ni changer « associée à » ni la note'
);
select is(
  (select count(*)::int from public.coach_tasks where id = '7a000000-0000-4000-8000-000000000001'), 1,
  'Coach B n''a pas pu supprimer la tâche de A'
);
select is(
  (select count(*)::int from public.coach_tasks where id = '7a000000-0000-4000-8000-000000000002'), 0,
  'La tâche supprimée par A a bien disparu'
);
select ok(
  has_column_privilege('authenticated', 'public.coach_tasks', 'category', 'UPDATE')
  and has_column_privilege('authenticated', 'public.coach_tasks', 'notes', 'UPDATE')
  and not has_column_privilege('authenticated', 'public.coach_tasks', 'organization_id', 'UPDATE'),
  'Droits par colonne : category et notes modifiables, pas l''organisation'
);

select * from finish();
rollback;
