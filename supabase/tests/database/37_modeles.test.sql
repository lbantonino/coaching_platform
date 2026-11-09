-- Tests des modèles (D-154) : modèles Coory lisibles par tous et en lecture seule, Mes modèles
-- isolés par organisation, version qui monte d'elle-même, pas de suppression (on archive).
begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(10);

insert into auth.users (id, email) values
  ('11111111-1111-4111-8111-111111111111', 'test-coach-a@example.test'),
  ('22222222-2222-4222-8222-222222222222', 'test-coach-b@example.test');
insert into public.organizations (id, name, slug) values
  ('aaaaaaaa-0000-4000-8000-000000000001', 'Test Org A', 'test-org-a'),
  ('bbbbbbbb-0000-4000-8000-000000000002', 'Test Org B', 'test-org-b');
insert into public.organization_members (organization_id, user_id, role) values
  ('aaaaaaaa-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 'owner'),
  ('bbbbbbbb-0000-4000-8000-000000000002', '22222222-2222-4222-8222-222222222222', 'owner');

-- Un modèle Coory (posé par l'application, jamais depuis le navigateur).
insert into public.program_templates (id, organization_id, origin, title, discipline, weeks_count, sessions_per_week, content_json)
values ('7e000000-0000-4000-8000-000000000001', null, 'coory', 'Prépa test', 'hyrox', 12, 4, '{}');
select throws_ok(
  $$ insert into public.program_templates (organization_id, origin, title, discipline, weeks_count, sessions_per_week, content_json)
     values ('aaaaaaaa-0000-4000-8000-000000000001', 'coory', 'Incohérent', 'hyrox', 4, 3, '{}') $$,
  '23514', null, 'Un modèle d''organisation n''est jamais « Coory »'
);

set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}';

select is(
  (select count(*)::int from public.program_templates where origin = 'coory'),
  1, 'Le coach A lit les modèles Coory'
);
update public.program_templates set title = 'Modifié' where id = '7e000000-0000-4000-8000-000000000001';
select is(
  (select title from public.program_templates where id = '7e000000-0000-4000-8000-000000000001'),
  'Prépa test', 'Un modèle Coory ne se modifie pas'
);
select throws_ok(
  $$ insert into public.program_templates (organization_id, origin, title, discipline, weeks_count, sessions_per_week, content_json)
     values (null, 'coory', 'Faux Coory', 'hyrox', 4, 3, '{}') $$,
  '42501', null, 'Un coach ne crée pas de modèle Coory'
);
select lives_ok(
  $$ insert into public.session_templates (organization_id, origin, title, discipline, session_type, content_json, created_by)
     values ('aaaaaaaa-0000-4000-8000-000000000001', 'coach', 'Sortie longue', 'running',
       'Sortie longue', '{"title":"Sortie longue"}', '11111111-1111-4111-8111-111111111111') $$,
  'Le coach A enregistre un modèle de séance'
);
update public.session_templates set content_json = '{"title":"Sortie longue 2"}' where title = 'Sortie longue';
select is(
  (select version from public.session_templates where title = 'Sortie longue'),
  2, 'Modifier le contenu fait monter la version'
);
select throws_ok(
  $$ delete from public.session_templates where title = 'Sortie longue' $$,
  '42501', null, 'Un modèle ne se supprime pas : il s''archive'
);
select lives_ok(
  $$ update public.session_templates set archived_at = now() where title = 'Sortie longue' $$,
  'Le coach archive son modèle'
);

set local request.jwt.claims = '{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}';
select is(
  (select count(*)::int from public.session_templates where organization_id = 'aaaaaaaa-0000-4000-8000-000000000001'),
  0, 'Le coach B ne voit pas les modèles de l''organisation A'
);
select is(
  (select count(*)::int from public.program_templates where origin = 'coory'),
  1, 'Le coach B lit aussi les modèles Coory'
);

select * from finish();
rollback;
