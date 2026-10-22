-- Tests des disponibilités et du consentement aux données de santé (P2-02 partie 3, D-20) :
-- contraintes, « pas de donnée de santé sans accord », qui peut donner ou retirer l'accord, journal.
begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(21);

insert into auth.users (id, email) values
  ('11111111-1111-4111-8111-111111111111', 'test-coach-a@example.test'),
  ('22222222-2222-4222-8222-222222222222', 'test-coach-b@example.test'),
  ('33333333-3333-4333-8333-333333333333', 'test-sportif-a@example.test'),
  ('44444444-4444-4444-8444-444444444444', 'test-autre-sportif@example.test');
insert into public.organizations (id, name, slug) values
  ('aaaaaaaa-0000-4000-8000-000000000001', 'Test Org A', 'test-org-a'),
  ('bbbbbbbb-0000-4000-8000-000000000002', 'Test Org B', 'test-org-b');
insert into public.organization_members (organization_id, user_id, role) values
  ('aaaaaaaa-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 'owner'),
  ('bbbbbbbb-0000-4000-8000-000000000002', '22222222-2222-4222-8222-222222222222', 'owner');
-- a1 a un compte (sportif 3333…) ; a2 n'en a pas.
insert into public.athlete_profiles (id, organization_id, first_name, athlete_user_id) values
  ('a1a1a1a1-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000001', 'Avec compte',
   '33333333-3333-4333-8333-333333333333'),
  ('a2a2a2a2-0000-4000-8000-000000000002', 'aaaaaaaa-0000-4000-8000-000000000001', 'Sans compte', null);

-- ---------------------------------------------------------------------
-- Contraintes (en plus de la validation du serveur)
-- ---------------------------------------------------------------------
select throws_ok(
  $$ update public.athlete_profiles set available_days = '{mon,funday}'
     where id = 'a2a2a2a2-0000-4000-8000-000000000002' $$,
  '23514', null, 'Les jours appartiennent à la liste fermée'
);
select throws_ok(
  $$ update public.athlete_profiles set sessions_per_week = 0
     where id = 'a2a2a2a2-0000-4000-8000-000000000002' $$,
  '23514', null, 'Le nombre de séances par semaine est compris entre 1 et 14'
);
select throws_ok(
  $$ update public.athlete_profiles set max_session_minutes = 5
     where id = 'a2a2a2a2-0000-4000-8000-000000000002' $$,
  '23514', null, 'La durée maximale d''une séance est comprise entre 10 et 300 minutes'
);
select throws_ok(
  $$ update public.athlete_profiles set health_constraints = 'Genou fragile'
     where id = 'a2a2a2a2-0000-4000-8000-000000000002' $$,
  '23514', null, 'Aucune contrainte physique ne s''enregistre sans accord en cours'
);

-- ---------------------------------------------------------------------
-- Coach A connecté
-- ---------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}';

select lives_ok(
  $$ update public.athlete_profiles
     set sessions_per_week = 3, available_days = '{mon,wed,sat}', max_session_minutes = 60,
         schedule_constraints = 'Déplacements le jeudi'
     where id = 'a2a2a2a2-0000-4000-8000-000000000002' $$,
  'Coach A renseigne les disponibilités'
);
select throws_ok(
  $$ update public.athlete_profiles set health_consent_at = now()
     where id = 'a2a2a2a2-0000-4000-8000-000000000002' $$,
  '42501', null, 'Personne n''écrit directement la date d''accord'
);
select throws_ok(
  $$ insert into public.athlete_consents (organization_id, athlete_id, action, source, coach_proof)
     values ('aaaaaaaa-0000-4000-8000-000000000001', 'a2a2a2a2-0000-4000-8000-000000000002',
             'granted', 'coach', 'oral') $$,
  '42501', null, 'Personne n''écrit directement dans le journal des accords'
);
select throws_ok(
  $$ select public.grant_health_consent('a2a2a2a2-0000-4000-8000-000000000002') $$,
  'P0001', 'preuve_invalide', 'Le coach doit préciser comment il a obtenu l''accord'
);
select lives_ok(
  $$ select public.grant_health_consent('a2a2a2a2-0000-4000-8000-000000000002', 'oral') $$,
  'Coach A note l''accord oral du sportif'
);
select lives_ok(
  $$ update public.athlete_profiles set health_constraints = 'Genou droit sensible en descente'
     where id = 'a2a2a2a2-0000-4000-8000-000000000002' $$,
  'Avec un accord en cours, le coach note une contrainte physique'
);
select results_eq(
  $$ select action, source, coach_proof from public.athlete_consents
     where athlete_id = 'a2a2a2a2-0000-4000-8000-000000000002' $$,
  $$ values ('granted', 'coach', 'oral') $$,
  'L''accord est journalisé : par le coach, à l''oral'
);
select lives_ok(
  $$ select public.withdraw_health_consent('a2a2a2a2-0000-4000-8000-000000000002') $$,
  'Coach A note le retrait de l''accord'
);
select results_eq(
  $$ select health_constraints, health_consent_at from public.athlete_profiles
     where id = 'a2a2a2a2-0000-4000-8000-000000000002' $$,
  $$ values (null::text, null::timestamptz) $$,
  'Le retrait efface la contrainte physique notée'
);
select results_eq(
  $$ select count(*)::int from public.athlete_consents
     where athlete_id = 'a2a2a2a2-0000-4000-8000-000000000002' $$,
  $$ values (2) $$,
  'Le journal garde l''accord ET le retrait'
);

-- ---------------------------------------------------------------------
-- Coach B : aucun droit sur les sportifs de A
-- ---------------------------------------------------------------------
set local request.jwt.claims = '{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}';
select throws_ok(
  $$ select public.grant_health_consent('a2a2a2a2-0000-4000-8000-000000000002', 'written') $$,
  'P0001', 'acces_refuse', 'Coach B ne peut pas noter d''accord pour un sportif de A'
);
select is_empty(
  $$ select 1 from public.athlete_consents $$,
  'Coach B ne lit pas le journal des accords de A'
);

-- ---------------------------------------------------------------------
-- Le sportif lui-même, depuis son espace
-- ---------------------------------------------------------------------
set local request.jwt.claims = '{"sub":"33333333-3333-4333-8333-333333333333","role":"authenticated"}';
select lives_ok(
  $$ select public.grant_health_consent('a1a1a1a1-0000-4000-8000-000000000001') $$,
  'Le sportif donne son accord depuis son espace'
);
select results_eq(
  $$ select action, source, coach_proof from public.athlete_consents
     where athlete_id = 'a1a1a1a1-0000-4000-8000-000000000001' $$,
  $$ values ('granted', 'athlete', null::text) $$,
  'L''accord est journalisé comme venant du sportif, et il lit son journal'
);
select throws_ok(
  $$ select public.grant_health_consent('a2a2a2a2-0000-4000-8000-000000000002') $$,
  'P0001', 'acces_refuse', 'Un sportif ne peut pas donner d''accord pour la fiche de quelqu''un d''autre'
);

set local request.jwt.claims = '{"sub":"44444444-4444-4444-8444-444444444444","role":"authenticated"}';
select throws_ok(
  $$ select public.withdraw_health_consent('a1a1a1a1-0000-4000-8000-000000000001') $$,
  'P0001', 'acces_refuse', 'Un autre utilisateur ne peut pas retirer l''accord'
);

reset role;
set local role anon;
set local request.jwt.claims = '{"role":"anon"}';
select throws_ok(
  $$ select public.grant_health_consent('a1a1a1a1-0000-4000-8000-000000000001') $$,
  '42501', null, 'Un anonyme ne peut pas appeler la fonction'
);

select * from finish();
rollback;
