-- Kit « Coory Pages », phase H (validation globale) : les deux tables touchées par le kit ont leurs
-- tests d'isolation entre organisations. Listes de tâches (D-129) : chaque coach ne voit et ne modifie
-- que les listes de son organisation, palette fermée, une tâche ne pointe pas vers la liste d'une autre
-- organisation, liste supprimée -> tâche sans liste. Notifications supprimées (D-128) : une ligne peut
-- n'avoir que deleted_at, et reste invisible pour une autre organisation.
begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(12);

insert into auth.users (id, email) values
  ('11111111-1111-4111-8111-111111111111', 'test-coach-a@example.test'),
  ('22222222-2222-4222-8222-222222222222', 'test-coach-b@example.test');
insert into public.organizations (id, name, slug) values
  ('aaaaaaaa-0000-4000-8000-000000000001', 'Test Org A', 'test-org-a'),
  ('bbbbbbbb-0000-4000-8000-000000000002', 'Test Org B', 'test-org-b');
insert into public.organization_members (organization_id, user_id, role) values
  ('aaaaaaaa-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 'owner'),
  ('bbbbbbbb-0000-4000-8000-000000000002', '22222222-2222-4222-8222-222222222222', 'owner');
insert into public.coach_task_lists (id, organization_id, name, color) values
  ('71a00000-0000-4000-8000-0000000000b1', 'bbbbbbbb-0000-4000-8000-000000000002', 'Liste de B', 'teal');
insert into public.coach_tasks (id, organization_id, title) values
  ('7a000000-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000001', 'Tâche de A');

-- Coach A.
set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}';

select lives_ok(
  $$ insert into public.coach_task_lists (id, organization_id, name, color)
     values ('71a00000-0000-4000-8000-0000000000a1', 'aaaaaaaa-0000-4000-8000-000000000001',
             'Programmes', 'indigo') $$,
  'Coach A crée une liste dans son organisation'
);
select throws_ok(
  $$ insert into public.coach_task_lists (organization_id, name, color)
     values ('bbbbbbbb-0000-4000-8000-000000000002', 'Intrus', 'rose') $$,
  '42501', null, 'Coach A ne crée pas de liste dans une autre organisation'
);
select throws_ok(
  $$ insert into public.coach_task_lists (organization_id, name, color)
     values ('aaaaaaaa-0000-4000-8000-000000000001', 'Fluo', 'lime') $$,
  '23514', null, 'La couleur suit la palette du kit (6 couleurs)'
);
select is_empty(
  $$ select id from public.coach_task_lists where organization_id = 'bbbbbbbb-0000-4000-8000-000000000002' $$,
  'Coach A ne voit pas les listes de l''organisation B'
);
select lives_ok(
  $$ update public.coach_tasks set list_id = '71a00000-0000-4000-8000-0000000000a1'
     where id = '7a000000-0000-4000-8000-000000000001' $$,
  'Coach A range sa tâche dans sa liste'
);
select throws_ok(
  $$ update public.coach_tasks set list_id = '71a00000-0000-4000-8000-0000000000b1'
     where id = '7a000000-0000-4000-8000-000000000001' $$,
  '23503', null, 'Une tâche ne pointe pas vers la liste d''une autre organisation'
);
select lives_ok(
  $$ insert into public.coach_notification_states (organization_id, key, deleted_at)
     values ('aaaaaaaa-0000-4000-8000-000000000001', 'task:qa:2026-11-05', now()) $$,
  'Coach A supprime une notification (ligne avec seulement deleted_at)'
);

-- Coach B.
set local request.jwt.claims = '{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}';

select is_empty(
  $$ select id from public.coach_task_lists where organization_id = 'aaaaaaaa-0000-4000-8000-000000000001' $$,
  'Coach B ne voit pas les listes de l''organisation A'
);
update public.coach_task_lists set name = 'Piratée' where id = '71a00000-0000-4000-8000-0000000000a1';
delete from public.coach_task_lists where id = '71a00000-0000-4000-8000-0000000000a1';
select is_empty(
  $$ select key from public.coach_notification_states where key = 'task:qa:2026-11-05' $$,
  'Coach B ne voit pas les notifications supprimées de l''organisation A'
);

reset role;
select is(
  (select name from public.coach_task_lists where id = '71a00000-0000-4000-8000-0000000000a1'),
  'Programmes', 'Coach B ne renomme ni ne supprime la liste de A'
);

-- Liste supprimée par A : la tâche reste, sans liste, dans son organisation.
set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}';
delete from public.coach_task_lists where id = '71a00000-0000-4000-8000-0000000000a1';
reset role;
select is(
  (select list_id from public.coach_tasks where id = '7a000000-0000-4000-8000-000000000001'),
  null, 'Liste supprimée : la tâche devient « sans liste »'
);
select is(
  (select organization_id from public.coach_tasks where id = '7a000000-0000-4000-8000-000000000001'),
  'aaaaaaaa-0000-4000-8000-000000000001'::uuid, '… et garde son organisation'
);

select * from finish();
rollback;
