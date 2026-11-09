-- Tests des programmes, tranche 1 (D-46) : semaines et séances numérotées sans jour, publication figée,
-- lecture par les coachs de l'organisation seulement, aucune écriture directe depuis le navigateur.
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
insert into public.athlete_profiles (id, organization_id, first_name) values
  ('a1a1a1a1-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000001', 'Sportif A'),
  ('b1b1b1b1-0000-4000-8000-000000000001', 'bbbbbbbb-0000-4000-8000-000000000002', 'Sportif B');

insert into public.programs (id, organization_id, athlete_id, title, start_date, weeks_count, status) values
  ('70000000-0000-4000-8000-0000000000a1', 'aaaaaaaa-0000-4000-8000-000000000001',
   'a1a1a1a1-0000-4000-8000-000000000001', 'Programme A', '2026-10-26', 12, 'published');
insert into public.program_publications (id, organization_id, program_id, number, snapshot_json) values
  ('71000000-0000-4000-8000-0000000000a1', 'aaaaaaaa-0000-4000-8000-000000000001',
   '70000000-0000-4000-8000-0000000000a1', 1, '{"title":"Programme A"}');
insert into public.publication_sessions (organization_id, publication_id, source_session_key, week_index, slot_index, session_json)
values ('aaaaaaaa-0000-4000-8000-000000000001', '71000000-0000-4000-8000-0000000000a1', 's1-1', 1, 1, '{"title":"Séance 1"}');

select throws_ok(
  $$ insert into public.programs (organization_id, athlete_id, title, start_date, weeks_count)
     values ('aaaaaaaa-0000-4000-8000-000000000001', 'a1a1a1a1-0000-4000-8000-000000000001', 'X', '2026-10-28', 4) $$,
  '23514', null, 'Un programme commence un lundi'
);
-- C-8 (09/11/2026) : plusieurs programmes publiés possibles, jamais sur des périodes qui se chevauchent.
select throws_ok(
  $$ insert into public.programs (organization_id, athlete_id, title, start_date, weeks_count, status)
     values ('aaaaaaaa-0000-4000-8000-000000000001', 'a1a1a1a1-0000-4000-8000-000000000001', 'Y', '2026-11-02', 4, 'published') $$,
  '23P01', null, 'Deux programmes publiés d''un sportif ne se chevauchent pas'
);
select lives_ok(
  $$ insert into public.programs (organization_id, athlete_id, title, start_date, weeks_count, status)
     values ('aaaaaaaa-0000-4000-8000-000000000001', 'a1a1a1a1-0000-4000-8000-000000000001', 'À venir', '2027-01-18', 4, 'published') $$,
  'Un programme « À venir » après celui en cours est accepté'
);
select throws_ok(
  $$ insert into public.publication_sessions (organization_id, publication_id, source_session_key, week_index, slot_index, session_json)
     values ('aaaaaaaa-0000-4000-8000-000000000001', '71000000-0000-4000-8000-0000000000a1', 's1-1b', 1, 1, '{}') $$,
  '23505', null, 'Une semaine n''a qu''une « Séance 1 »'
);
select throws_ok(
  $$ insert into public.programs (organization_id, athlete_id, title, start_date, weeks_count)
     values ('aaaaaaaa-0000-4000-8000-000000000001', 'b1b1b1b1-0000-4000-8000-000000000001', 'Z', '2026-11-02', 4) $$,
  '23503', null, 'Un programme reste dans l''organisation de son sportif'
);

set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}';
select is(
  (select count(*)::int from public.publication_sessions where publication_id = '71000000-0000-4000-8000-0000000000a1'),
  1, 'Le coach A lit les séances publiées de son organisation'
);
select throws_ok(
  $$ update public.publication_sessions set week_index = 2 $$,
  '42501', null, 'Une séance publiée ne se modifie pas depuis le navigateur'
);
select throws_ok(
  $$ insert into public.programs (organization_id, athlete_id, title, start_date, weeks_count)
     values ('aaaaaaaa-0000-4000-8000-000000000001', 'a1a1a1a1-0000-4000-8000-000000000001', 'W', '2026-11-02', 4) $$,
  '42501', null, 'Pas d''écriture directe depuis le navigateur : seulement par les fonctions contrôlées'
);

set local request.jwt.claims = '{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}';
select is_empty(
  $$ select 1 from public.programs where organization_id = 'aaaaaaaa-0000-4000-8000-000000000001' $$,
  'Le coach B ne voit pas les programmes de l''organisation A'
);

select * from finish();
rollback;
