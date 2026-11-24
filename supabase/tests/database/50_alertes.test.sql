-- Alertes des séances (D-205, phase C, 24/11/2026) : une ou deux alertes par séance, comme Apple ;
-- les appareils abonnés de chaque utilisateur (à lui seul) ; les alertes envoyées (jamais deux fois,
-- réservées au serveur) ; la tâche planifiée qui appelle Coory chaque minute.
begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(14);

select has_column('public', 'coach_sessions', 'alerts', 'Une séance garde ses alertes');
select col_default_is('public', 'coach_sessions', 'alerts', '{}'::smallint[], 'Sans alerte par défaut');

insert into auth.users (id, email) values
  ('11111111-1111-4111-8111-111111111111', 'test-coach-a@example.test'),
  ('22222222-2222-4222-8222-222222222222', 'test-coach-b@example.test');
insert into public.organizations (id, name, slug) values
  ('aaaaaaaa-0000-4000-8000-000000000001', 'Test Org A', 'test-org-a');
insert into public.organization_members (organization_id, user_id, role) values
  ('aaaaaaaa-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 'owner');

-- --- Les alertes d'une séance ------------------------------------------------------------------
select lives_ok(
  $$ insert into public.coach_sessions (organization_id, kind, title, starts_on, start_time, duration_minutes, alerts)
     values ('aaaaaaaa-0000-4000-8000-000000000001', 'group', 'Piste', '2026-12-02', '19:00', 90, '{15,1440}') $$,
  'Deux alertes : 15 min et 1 jour avant'
);
select throws_ok(
  $$ insert into public.coach_sessions (organization_id, kind, title, starts_on, start_time, duration_minutes, alerts)
     values ('aaaaaaaa-0000-4000-8000-000000000001', 'group', 'Piste', '2026-12-02', '19:00', 90, '{5,15,30}') $$,
  '23514', null, 'Trois alertes : refusé (deux au plus)'
);
select throws_ok(
  $$ insert into public.coach_sessions (organization_id, kind, title, starts_on, start_time, duration_minutes, alerts)
     values ('aaaaaaaa-0000-4000-8000-000000000001', 'group', 'Piste', '2026-12-02', '19:00', 90, '{15,15}') $$,
  '23514', null, 'Deux fois la même alerte : refusé'
);
select throws_ok(
  $$ insert into public.coach_sessions (organization_id, kind, title, starts_on, start_time, duration_minutes, alerts)
     values ('aaaaaaaa-0000-4000-8000-000000000001', 'group', 'Piste', '2026-12-02', '19:00', 90, '{-540}') $$,
  '23514', null, 'Une alerte « le jour même 09:00 » est réservée aux séances « Jour entier »'
);
select lives_ok(
  $$ insert into public.coach_sessions (organization_id, kind, title, starts_on, start_time, duration_minutes, all_day, alerts)
     values ('aaaaaaaa-0000-4000-8000-000000000001', 'group', 'Stage', '2026-12-05', '00:00', 60, true, '{-540,900}') $$,
  'Jour entier : le jour même et la veille, à 09:00'
);
select throws_ok(
  $$ insert into public.coach_sessions (organization_id, kind, title, starts_on, start_time, duration_minutes, all_day, alerts)
     values ('aaaaaaaa-0000-4000-8000-000000000001', 'group', 'Stage', '2026-12-05', '00:00', 60, true, '{15}') $$,
  '23514', null, 'Jour entier : pas d''alerte « 15 min avant »'
);

-- --- Les appareils abonnés : chacun les siens --------------------------------------------------
set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}';
select lives_ok(
  $$ insert into public.push_subscriptions (endpoint, p256dh, auth)
     values ('https://fcm.googleapis.com/fcm/send/abc', 'BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QTpQtUbVlUls0VJXg7A8u-Ts1XbjhazAkj7I99e8QcYP7DkM', 'tBHItJI5svbpez7KI4CCXg') $$,
  'Le coach abonne son téléphone'
);
select throws_ok(
  $$ insert into public.push_subscriptions (user_id, endpoint, p256dh, auth)
     values ('22222222-2222-4222-8222-222222222222', 'https://fcm.googleapis.com/fcm/send/xyz', 'BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QTpQtUbVlUls0VJXg7A8u-Ts1XbjhazAkj7I99e8QcYP7DkM', 'tBHItJI5svbpez7KI4CCXg') $$,
  '42501', null, 'Personne n''abonne l''appareil d''un autre'
);
select throws_ok(
  $$ select * from public.session_alerts_sent $$,
  '42501', null, 'Les alertes envoyées sont réservées au serveur'
);
set local request.jwt.claims = '{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}';
select is(
  (select count(*) from public.push_subscriptions)::int, 0,
  'Un autre utilisateur ne voit pas les appareils du coach'
);
reset role;

-- --- La tâche planifiée ------------------------------------------------------------------------
select ok(
  exists (select 1 from cron.job where jobname = 'coory-alertes' and schedule = '* * * * *'),
  'Coory est appelé chaque minute pour envoyer les alertes'
);
select lives_ok(
  $$ select private.call_session_alerts() $$,
  'Sans adresse ni secret dans le Vault, la tâche ne fait rien (et ne plante pas)'
);

select * from finish();
rollback;
