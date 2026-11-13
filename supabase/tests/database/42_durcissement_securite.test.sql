-- Revue de sécurité du 13/11/2026 : une liste de tâches n'est pas créée au nom d'un collègue ; un
-- coach retiré de l'organisation ne voit plus les photos de ses anciens collègues ; une séance figée
-- géante est refusée.
begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(5);

insert into auth.users (id, email) values
  ('11111111-1111-4111-8111-111111111111', 'test-coach-a@example.test'),
  ('33333333-3333-4333-8333-333333333333', 'test-collegue@example.test');
insert into public.organizations (id, name, slug) values
  ('aaaaaaaa-0000-4000-8000-000000000001', 'Test Org A', 'test-org-a');
insert into public.organization_members (organization_id, user_id, role) values
  ('aaaaaaaa-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 'owner'),
  ('aaaaaaaa-0000-4000-8000-000000000001', '33333333-3333-4333-8333-333333333333', 'coach');

set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}';
select lives_ok(
  $$ insert into public.coach_task_lists (organization_id, name, color)
     values ('aaaaaaaa-0000-4000-8000-000000000001', 'Programmes', 'indigo') $$,
  'Le coach crée sa liste de tâches'
);
select throws_ok(
  $$ insert into public.coach_task_lists (organization_id, name, color, created_by)
     values ('aaaaaaaa-0000-4000-8000-000000000001', 'Facturation', 'amber',
             '33333333-3333-4333-8333-333333333333') $$,
  '42501', null, 'Une liste n''est pas créée au nom d''un collègue'
);
select ok(
  private.shares_org_with('33333333-3333-4333-8333-333333333333'),
  'Deux membres actifs partagent leur organisation (photos visibles)'
);

reset role;
update public.organization_members set status = 'disabled'
where user_id = '11111111-1111-4111-8111-111111111111';
set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}';
select ok(
  not private.shares_org_with('33333333-3333-4333-8333-333333333333'),
  'Retiré de l''organisation, le coach ne voit plus les photos de ses anciens collègues'
);
reset role;

select is(
  (select count(*)::integer from pg_constraint
   where conname in ('publication_sessions_session_size', 'program_publications_snapshot_size')),
  2,
  'Les versions publiées ont une taille maximale'
);

select * from finish();
rollback;
