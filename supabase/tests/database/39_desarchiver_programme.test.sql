-- Désarchiver un programme (phase 4, décision d'Antonino du 10/11/2026) : il retrouve son état d'avant
-- (brouillon s'il n'a jamais été publié, publié sinon), sans chevaucher un autre programme publié du
-- même sportif (C-8), et seulement dans son organisation.
begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(7);

insert into auth.users (id, email) values
  ('11111111-1111-4111-8111-111111111111', 'test-coach-a@example.test'),
  ('22222222-2222-4222-8222-222222222222', 'test-coach-b@example.test');
insert into public.organizations (id, name, slug) values
  ('aaaaaaaa-0000-4000-8000-000000000001', 'Test Org A', 'test-org-a'),
  ('bbbbbbbb-0000-4000-8000-000000000002', 'Test Org B', 'test-org-b');
insert into public.organization_members (organization_id, user_id, role) values
  ('aaaaaaaa-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 'owner'),
  ('bbbbbbbb-0000-4000-8000-000000000002', '22222222-2222-4222-8222-222222222222', 'owner');
insert into public.athlete_profiles (id, organization_id, first_name) values
  ('a1a1a1a1-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000001', 'Sportif A');

set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}';

-- 1. Un brouillon archivé redevient un brouillon.
select set_config('test.draft', public.create_program(
  'aaaaaaaa-0000-4000-8000-000000000001', 'a1a1a1a1-0000-4000-8000-000000000001',
  'Brouillon', 'running', '2027-03-01', 4, '{}'
)::text, true);
select public.archive_program(current_setting('test.draft')::uuid);
select is(
  public.unarchive_program(current_setting('test.draft')::uuid),
  'draft', 'Un brouillon archivé redevient un brouillon'
);

-- 2. Un programme publié archivé redevient publié, avec sa version.
select set_config('test.pub', public.create_program(
  'aaaaaaaa-0000-4000-8000-000000000001', 'a1a1a1a1-0000-4000-8000-000000000001',
  'Publié', 'running', '2026-11-02', 4, '{}'
)::text, true);
select public.publish_program(current_setting('test.pub')::uuid, 1, 'Publié', 'running', '2026-11-02', 4,
  '{}', '[]');
select public.archive_program(current_setting('test.pub')::uuid);
select is(
  public.unarchive_program(current_setting('test.pub')::uuid),
  'published', 'Un programme publié archivé redevient publié'
);
select is(
  (select active_publication_id is not null from public.programs where id = current_setting('test.pub')::uuid),
  true, 'Il garde sa version publiée'
);

-- 3. Désarchiver un programme qui n'est pas archivé ne change rien.
select is(
  public.unarchive_program(current_setting('test.pub')::uuid),
  'published', 'Un programme non archivé garde son état'
);

-- 4. C-8 : pendant l'archivage, un autre programme a pris ces dates ; désarchiver est refusé.
select public.archive_program(current_setting('test.pub')::uuid);
select set_config('test.other', public.create_program(
  'aaaaaaaa-0000-4000-8000-000000000001', 'a1a1a1a1-0000-4000-8000-000000000001',
  'Remplaçant', 'running', '2026-11-09', 4, '{}'
)::text, true);
select public.publish_program(current_setting('test.other')::uuid, 1, 'Remplaçant', 'running', '2026-11-09', 4,
  '{}', '[]');
select throws_ok(
  $$ select public.unarchive_program(current_setting('test.pub')::uuid) $$,
  '23P01', null, 'Désarchiver ne doit pas chevaucher un autre programme publié'
);
select is(
  (select status from public.programs where id = current_setting('test.pub')::uuid),
  'archived', 'Refusé : il reste archivé'
);

-- 5. Isolation : le coach B ne désarchive pas un programme de A.
set local request.jwt.claims = '{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}';
select throws_ok(
  $$ select public.unarchive_program(current_setting('test.draft')::uuid) $$,
  'P0002', null, 'Le coach B ne désarchive pas le programme de A (introuvable pour lui)'
);

select * from finish();
rollback;
