-- Tests de l'écriture des programmes (D-155) : création, brouillon et révisions, publication atomique
-- et idempotente, règle C-8 (pas de chevauchement), archivage, isolation entre organisations, aucune
-- écriture directe depuis le navigateur.
begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(22);

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
  ('a1a1a1a1-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000001', 'Sportif A'),
  ('b1b1b1b1-0000-4000-8000-000000000001', 'bbbbbbbb-0000-4000-8000-000000000002', 'Sportif B');

set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}';

-- 1. Créer : un programme brouillon et son brouillon, révision 1.
select set_config('test.p1', public.create_program(
  'aaaaaaaa-0000-4000-8000-000000000001', 'a1a1a1a1-0000-4000-8000-000000000001',
  'Prépa A', 'running', '2026-11-02', 4, '{"schemaVersion":2,"title":"Prépa A"}'
)::text, true);
select is(
  (select status from public.programs where id = current_setting('test.p1')::uuid),
  'draft', 'Le coach crée un programme : il est en brouillon'
);
select is(
  (select revision from public.program_drafts where program_id = current_setting('test.p1')::uuid),
  1, 'Son brouillon commence à la révision 1'
);

-- 2. Enregistrer : la révision monte ; une révision périmée est refusée.
select is(
  public.save_program_draft(current_setting('test.p1')::uuid, 1, 'Prépa A bis', 'running', '2026-11-02', 4,
    '{"schemaVersion":2,"title":"Prépa A bis"}'),
  2, 'Enregistrer le brouillon donne la révision 2'
);
select throws_ok(
  $$ select public.save_program_draft(current_setting('test.p1')::uuid, 1, 'X', 'running', '2026-11-02', 4, '{}') $$,
  'CY409', null, 'Une révision périmée est refusée (pas d''écrasement)'
);
select is(
  (select title from public.programs where id = current_setting('test.p1')::uuid),
  'Prépa A bis', 'Un programme jamais publié reprend le titre du brouillon'
);
select throws_ok(
  $$ select public.save_program_draft(current_setting('test.p1')::uuid, 0, 'X', 'running', '2026-11-02', 4, '{}') $$,
  'CY409', null, 'On ne recrée pas un brouillon qui existe déjà (révision 0)'
);

-- 3. Publier : version 1, séances datées, idempotent.
select is(
  public.publish_program(current_setting('test.p1')::uuid, 2, 'Prépa A bis', 'running', '2026-11-02', 4,
    '{"schemaVersion":2,"title":"Prépa A bis"}',
    '[{"key":"s1","weekIndex":1,"slotIndex":1,"plannedDate":"2026-11-04","plannedTime":"07:30","content":{"schemaVersion":2}}]'),
  1, 'Publier crée la version 1'
);
select is(
  (select source_revision from public.program_publications where program_id = current_setting('test.p1')::uuid),
  2, 'La version garde la révision publiée'
);
select is(
  (select planned_date::text || ' ' || planned_time::text from public.publication_sessions s
   join public.program_publications p on p.id = s.publication_id
   where p.program_id = current_setting('test.p1')::uuid),
  '2026-11-04 07:30:00', 'Une séance à jour fixe est datée, avec son heure'
);
select is(
  public.publish_program(current_setting('test.p1')::uuid, 2, 'Prépa A bis', 'running', '2026-11-02', 4, '{}', '[]'),
  1, 'Publier deux fois la même révision ne crée pas de nouvelle version'
);
select is(
  (select count(*)::int from public.program_publications where program_id = current_setting('test.p1')::uuid),
  1, 'Toujours une seule version'
);

-- 4. Modifier un programme publié : brouillon seulement, la version publiée ne bouge pas.
select is(
  public.save_program_draft(current_setting('test.p1')::uuid, 2, 'Nouveau titre', 'running', '2026-11-02', 4,
    '{"schemaVersion":2,"title":"Nouveau titre"}'),
  3, 'Le brouillon d''un programme publié continue'
);
select is(
  (select title from public.programs where id = current_setting('test.p1')::uuid),
  'Prépa A bis', 'Le titre visible reste celui de la version publiée'
);
select is(
  public.publish_program(current_setting('test.p1')::uuid, 3, 'Nouveau titre', 'running', '2026-11-02', 4, '{}', '[]'),
  2, 'Republier crée la version 2'
);

-- 5. C-8 : un autre programme publié du même sportif ne peut pas chevaucher ; rien n'est écrit.
select set_config('test.p2', public.create_program(
  'aaaaaaaa-0000-4000-8000-000000000001', 'a1a1a1a1-0000-4000-8000-000000000001',
  'Chevauche', 'running', '2026-11-16', 4, '{}'
)::text, true);
select throws_ok(
  $$ select public.publish_program(current_setting('test.p2')::uuid, 1, 'Chevauche', 'running', '2026-11-16', 4, '{}', '[]') $$,
  '23P01', null, 'Une publication qui chevauche un programme publié est refusée'
);
select is(
  (select count(*)::int from public.program_publications where program_id = current_setting('test.p2')::uuid),
  0, 'La publication refusée ne laisse aucune version à moitié écrite'
);

-- 6. Pas d'écriture directe depuis le navigateur.
select throws_ok(
  $$ update public.programs set status = 'published' where id = current_setting('test.p1')::uuid $$,
  '42501', null, 'Le statut ne se modifie pas en direct'
);
select throws_ok(
  $$ insert into public.program_drafts (program_id, organization_id, draft_json)
     values (current_setting('test.p2')::uuid, 'aaaaaaaa-0000-4000-8000-000000000001', '{}') $$,
  '42501', null, 'Un brouillon ne s''écrit pas en direct'
);

-- 7. Archiver : on ne modifie plus le brouillon.
select lives_ok(
  $$ select public.archive_program(current_setting('test.p2')::uuid) $$,
  'Le coach archive un programme'
);
select throws_ok(
  $$ select public.save_program_draft(current_setting('test.p2')::uuid, 1, 'X', 'running', '2026-11-16', 4, '{}') $$,
  'CY410', null, 'Un programme archivé ne se modifie plus'
);

-- 8. Isolation : le coach B ne voit ni ne touche les programmes de A, ni ne crée chez A.
set local request.jwt.claims = '{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}';
select throws_ok(
  $$ select public.save_program_draft(current_setting('test.p1')::uuid, 3, 'Piratage', 'running', '2026-11-02', 4, '{}') $$,
  'P0002', null, 'Le coach B ne peut pas modifier le programme de A (introuvable pour lui)'
);
select throws_ok(
  $$ select public.create_program('aaaaaaaa-0000-4000-8000-000000000001', 'a1a1a1a1-0000-4000-8000-000000000001',
       'Piratage', 'running', '2026-11-02', 4, '{}') $$,
  '42501', null, 'Le coach B ne crée pas de programme dans l''organisation A'
);

select * from finish();
rollback;
