-- Récurrence des séances comme Apple (D-203, 24/11/2026) : la règle en base, son calcul SQL (jumeau
-- de src/domain/sessions/recurrence.ts, mêmes cas que tests/unit/recurrence.test.ts), les dates
-- déplacées d'une série non hebdomadaire, et « toute la série » réservée aux séries quotidiennes et
-- hebdomadaires.
begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(17);

-- --- Le calcul ---------------------------------------------------------------------------------
select ok(
  private.session_occurs_on('2026-11-24', null, '{"freq":"weekly","interval":2,"weekdays":["tue","thu"]}', '2026-12-08'),
  'Toutes les 2 semaines le mardi et le jeudi : le mardi 8 décembre'
);
select ok(
  not private.session_occurs_on('2026-11-24', null, '{"freq":"weekly","interval":2,"weekdays":["tue","thu"]}', '2026-12-01'),
  'Toutes les 2 semaines : pas la semaine d''après'
);
select ok(
  private.session_occurs_on('2026-11-23', null, '{"freq":"weekly","interval":1,"weekdays":["tue"]}', '2026-11-23'),
  'Le début est toujours la première séance, même hors de la règle'
);
select ok(
  private.session_occurs_on('2026-11-24', null, '{"freq":"daily","interval":3}', '2026-12-03')
    and not private.session_occurs_on('2026-11-24', null, '{"freq":"daily","interval":3}', '2026-12-02'),
  'Tous les 3 jours'
);
select ok(
  private.session_occurs_on('2026-10-31', null, '{"freq":"monthly","interval":1,"monthDays":[31]}', '2026-12-31')
    and not private.session_occurs_on('2026-10-31', null, '{"freq":"monthly","interval":1,"monthDays":[31]}', '2026-11-30'),
  'Chaque mois le 31 : rien en novembre'
);
select ok(
  private.session_occurs_on('2026-11-30', null, '{"freq":"monthly","interval":1,"setPos":-1,"setWeekday":"mon"}', '2026-12-28')
    and not private.session_occurs_on('2026-11-30', null, '{"freq":"monthly","interval":1,"setPos":-1,"setWeekday":"mon"}', '2026-12-21'),
  'Chaque mois le dernier lundi'
);
select ok(
  private.session_occurs_on('2026-11-10', null, '{"freq":"monthly","interval":2,"setPos":2,"setWeekday":"tue"}', '2027-01-12')
    and not private.session_occurs_on('2026-11-10', null, '{"freq":"monthly","interval":2,"setPos":2,"setWeekday":"tue"}', '2026-12-08'),
  'Tous les 2 mois le 2e mardi'
);
select ok(
  private.session_occurs_on('2028-02-29', null, '{"freq":"yearly","interval":1,"months":[2]}', '2032-02-29')
    and not private.session_occurs_on('2028-02-29', null, '{"freq":"yearly","interval":1,"months":[2]}', '2030-02-28'),
  'Chaque année le 29 février : seulement les années bissextiles'
);
select ok(
  not private.session_occurs_on('2026-11-24', '2026-11-26', '{"freq":"daily","interval":1}', '2026-11-27'),
  'La date de fin arrête la série'
);

-- --- La règle en base --------------------------------------------------------------------------
insert into auth.users (id, email) values
  ('11111111-1111-4111-8111-111111111111', 'test-coach-a@example.test');
insert into public.organizations (id, name, slug) values
  ('aaaaaaaa-0000-4000-8000-000000000001', 'Test Org A', 'test-org-a');
insert into public.organization_members (organization_id, user_id, role) values
  ('aaaaaaaa-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 'owner');
-- Une ancienne écriture (« chaque semaine » seulement) et une série « dernier lundi du mois ».
insert into public.coach_sessions (id, organization_id, kind, title, starts_on, start_time, duration_minutes, repeats_weekly) values
  ('c1c1c1c1-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000001', 'group', 'Piste',
   '2026-11-25', '19:00', 90, true);
insert into public.coach_sessions (id, organization_id, kind, title, starts_on, start_time, duration_minutes, repeats_weekly, recurrence) values
  ('c1c1c1c1-0000-4000-8000-000000000002', 'aaaaaaaa-0000-4000-8000-000000000001', 'group', 'Bilan',
   '2026-11-30', '10:00', 60, true, '{"freq":"monthly","interval":1,"setPos":-1,"setWeekday":"mon"}'),
  ('c1c1c1c1-0000-4000-8000-000000000003', 'aaaaaaaa-0000-4000-8000-000000000001', 'group', 'Duo',
   '2026-11-24', '18:00', 60, true, '{"freq":"weekly","interval":1,"weekdays":["tue","thu"]}');

select is(
  (select recurrence from public.coach_sessions where id = 'c1c1c1c1-0000-4000-8000-000000000001'),
  '{"freq":"weekly","interval":1,"weekdays":["wed"]}'::jsonb,
  'Une ancienne écriture « chaque semaine » reçoit sa règle : le mercredi du début'
);
select throws_ok(
  $$ insert into public.coach_sessions (organization_id, kind, title, starts_on, start_time, duration_minutes, repeats_weekly, recurrence)
     values ('aaaaaaaa-0000-4000-8000-000000000001', 'group', 'Faux', '2026-11-24', '18:00', 60, true,
             '{"freq":"weekly","interval":1,"weekdays":[]}') $$,
  '23514', null, 'Une semaine sans jour est refusée'
);
select throws_ok(
  $$ insert into public.coach_sessions (organization_id, kind, title, starts_on, start_time, duration_minutes, repeats_weekly, recurrence)
     values ('aaaaaaaa-0000-4000-8000-000000000001', 'group', 'Faux', '2026-11-24', '18:00', 60, true,
             '{"freq":"hourly","interval":1}') $$,
  '23514', null, 'Une fréquence inconnue est refusée'
);
select is(
  (select recurrence from public.coach_sessions where id = 'c1c1c1c1-0000-4000-8000-000000000003'
     and repeats_weekly),
  '{"freq":"weekly","interval":1,"weekdays":["tue","thu"]}'::jsonb,
  'Une règle donnée est gardée telle quelle'
);

-- --- Coach A connecté --------------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}';

select lives_ok(
  $$ insert into public.coach_session_exceptions (session_id, organization_id, original_date, new_date, new_start_time, created_by)
     values ('c1c1c1c1-0000-4000-8000-000000000002', 'aaaaaaaa-0000-4000-8000-000000000001',
             '2026-12-28', '2026-12-29', '10:00', '11111111-1111-4111-8111-111111111111') $$,
  'Le dernier lundi de décembre se déplace (vraie date de la série mensuelle)'
);
select throws_ok(
  $$ insert into public.coach_session_exceptions (session_id, organization_id, original_date, new_date, new_start_time, created_by)
     values ('c1c1c1c1-0000-4000-8000-000000000002', 'aaaaaaaa-0000-4000-8000-000000000001',
             '2026-12-21', '2026-12-22', '10:00', '11111111-1111-4111-8111-111111111111') $$,
  '23514', null, 'Un lundi qui n''est pas le dernier n''est pas une date de la série'
);
select throws_ok(
  $$ select public.move_session_series('c1c1c1c1-0000-4000-8000-000000000002', 1, '10:00') $$,
  '22023', null, 'Toute une série mensuelle ne se décale pas (seulement une date)'
);
select public.move_session_series('c1c1c1c1-0000-4000-8000-000000000003', 1, '18:30');
select is(
  (select recurrence from public.coach_sessions where id = 'c1c1c1c1-0000-4000-8000-000000000003'),
  '{"freq":"weekly","interval":1,"weekdays":["wed","fri"]}'::jsonb,
  'Décaler d''un jour la série du mardi et du jeudi la met au mercredi et au vendredi'
);

select * from finish();
rollback;
