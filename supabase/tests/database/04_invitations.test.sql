-- Tests des invitations sportifs (P1-05) : isolation, expiration, révocation, usage unique, e-mail, âge.
begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(20);

-- ---------------------------------------------------------------------
-- Données : deux organisations, un coach chacune, des sportifs et des comptes sportifs.
-- ---------------------------------------------------------------------
insert into auth.users (id, email) values
  ('11111111-1111-4111-8111-111111111111', 'test-coach-a@example.test'),
  ('22222222-2222-4222-8222-222222222222', 'test-coach-b@example.test'),
  ('33333333-3333-4333-8333-333333333333', 'sportif-a@example.test'),
  ('44444444-4444-4444-8444-444444444444', 'autre-personne@example.test');

insert into public.organizations (id, name, slug) values
  ('aaaaaaaa-0000-4000-8000-000000000001', 'Test Org A', 'test-org-a'),
  ('bbbbbbbb-0000-4000-8000-000000000002', 'Test Org B', 'test-org-b');

insert into public.organization_members (organization_id, user_id, role) values
  ('aaaaaaaa-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 'owner'),
  ('bbbbbbbb-0000-4000-8000-000000000002', '22222222-2222-4222-8222-222222222222', 'owner');

insert into public.athlete_profiles (id, organization_id, display_name, email) values
  ('a1a1a1a1-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000001', 'Sportif A', 'Sportif-A@example.test'),
  ('a2a2a2a2-0000-4000-8000-000000000002', 'aaaaaaaa-0000-4000-8000-000000000001', 'Autre A', 'autre-a@example.test'),
  ('b1b1b1b1-0000-4000-8000-000000000001', 'bbbbbbbb-0000-4000-8000-000000000002', 'Sportif B', 'sportif-b@example.test'),
  ('b2b2b2b2-0000-4000-8000-000000000002', 'bbbbbbbb-0000-4000-8000-000000000002', 'Autre B', 'autre-b@example.test');

-- Invitations : valide (A1), expirée (A2), et une de B. Jetons « jeton-xxx » hachés en SHA-256.
insert into public.athlete_invites (organization_id, athlete_id, token_hash, expires_at, created_at) values
  ('aaaaaaaa-0000-4000-8000-000000000001', 'a1a1a1a1-0000-4000-8000-000000000001',
   encode(sha256('jeton-valide'::bytea), 'hex'), now() + interval '7 days', now()),
  ('aaaaaaaa-0000-4000-8000-000000000001', 'a2a2a2a2-0000-4000-8000-000000000002',
   encode(sha256('jeton-expire'::bytea), 'hex'), now() - interval '1 hour', now() - interval '8 days'),
  ('bbbbbbbb-0000-4000-8000-000000000002', 'b1b1b1b1-0000-4000-8000-000000000001',
   encode(sha256('jeton-b'::bytea), 'hex'), now() + interval '7 days', now());

select throws_ok(
  $$ insert into public.athlete_invites (organization_id, athlete_id, token_hash, expires_at)
     values ('aaaaaaaa-0000-4000-8000-000000000001', 'b2b2b2b2-0000-4000-8000-000000000002',
             encode(sha256('croise'::bytea), 'hex'), now() + interval '1 day') $$,
  '23503', null,
  'Une invitation ne peut pas viser une fiche d''une autre organisation'
);

select throws_ok(
  $$ insert into public.athlete_invites (organization_id, athlete_id, token_hash, expires_at)
     values ('aaaaaaaa-0000-4000-8000-000000000001', 'a1a1a1a1-0000-4000-8000-000000000001',
             encode(sha256('second'::bytea), 'hex'), now() + interval '1 day') $$,
  '23505', null,
  'Une seule invitation en attente par fiche'
);

-- ---------------------------------------------------------------------
-- Coach A
-- ---------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}';

select results_eq(
  $$ select count(*)::int from public.athlete_invites $$,
  $$ values (2) $$,
  'Coach A ne voit que les invitations de son organisation'
);

select throws_ok(
  $$ update public.athlete_invites set status = 'accepted' where athlete_id = 'a1a1a1a1-0000-4000-8000-000000000001' $$,
  '42501', null,
  'Coach A ne peut pas marquer lui-même une invitation comme acceptée'
);

select throws_ok(
  $$ insert into public.athlete_invites (organization_id, athlete_id, token_hash, expires_at, created_by)
     values ('aaaaaaaa-0000-4000-8000-000000000001', 'a2a2a2a2-0000-4000-8000-000000000002',
             encode(sha256('trop-long'::bytea), 'hex'), now() + interval '30 days',
             '11111111-1111-4111-8111-111111111111') $$,
  '42501', null,
  'Une invitation ne peut pas durer plus de 7 jours'
);

-- ---------------------------------------------------------------------
-- Lecture publique d'une invitation par son jeton
-- ---------------------------------------------------------------------
reset role;
set local role anon;
set local request.jwt.claims = '{"role":"anon"}';

select results_eq(
  $$ select athlete_name, invite_status from public.get_invitation(encode(sha256('jeton-valide'::bytea), 'hex')) $$,
  $$ values ('Sportif A', 'pending') $$,
  'Le détenteur du lien voit l''invitation'
);
select results_eq(
  $$ select invite_status from public.get_invitation(encode(sha256('jeton-expire'::bytea), 'hex')) $$,
  $$ values ('expired') $$,
  'Une invitation dépassée est signalée expirée'
);
select is_empty(
  $$ select 1 from public.get_invitation(encode(sha256('jeton-inconnu'::bytea), 'hex')) $$,
  'Un jeton inconnu ne renvoie rien'
);
select throws_ok($$ select 1 from public.athlete_invites $$, '42501', null, 'Un anonyme ne lit pas la table');
select throws_ok(
  $$ select public.accept_invitation(encode(sha256('jeton-valide'::bytea), 'hex'), true) $$,
  '42501', null,
  'Un anonyme ne peut pas accepter'
);

-- ---------------------------------------------------------------------
-- Acceptation par le sportif
-- ---------------------------------------------------------------------
reset role;
set local role authenticated;

set local request.jwt.claims = '{"sub":"44444444-4444-4444-8444-444444444444","role":"authenticated"}';
select throws_ok(
  $$ select public.accept_invitation(encode(sha256('jeton-valide'::bytea), 'hex'), true) $$,
  'P0001', 'email_different',
  'Un compte dont l''e-mail ne correspond pas à la fiche est refusé'
);

set local request.jwt.claims = '{"sub":"33333333-3333-4333-8333-333333333333","role":"authenticated"}';
select throws_ok(
  $$ select public.accept_invitation(encode(sha256('jeton-valide'::bytea), 'hex'), false) $$,
  'P0001', 'age_non_confirme',
  'Sans confirmation « 18 ans ou plus », l''acceptation est refusée'
);
select throws_ok(
  $$ select public.accept_invitation(encode(sha256('jeton-expire'::bytea), 'hex'), true) $$,
  'P0001', 'invitation_expiree',
  'Une invitation expirée est refusée'
);
select is(
  public.accept_invitation(encode(sha256('jeton-valide'::bytea), 'hex'), true),
  'aaaaaaaa-0000-4000-8000-000000000001'::uuid,
  'Le bon sportif accepte (e-mail comparé sans tenir compte des majuscules)'
);
select throws_ok(
  $$ select public.accept_invitation(encode(sha256('jeton-valide'::bytea), 'hex'), true) $$,
  'P0001', 'invitation_invalide',
  'Le lien ne sert qu''une fois'
);

select results_eq(
  $$ select display_name from public.athlete_profiles $$,
  $$ values ('Sportif A') $$,
  'Le sportif ne voit que sa propre fiche'
);
select results_eq(
  $$ select name from public.organizations $$,
  $$ values ('Test Org A') $$,
  'Le sportif voit le nom de son organisation, et seulement elle'
);
select is_empty($$ select 1 from public.organization_members $$, 'Le sportif ne voit pas les membres de l''organisation');
select is_empty($$ select 1 from public.athlete_invites $$, 'Le sportif ne voit pas les invitations');

-- ---------------------------------------------------------------------
-- Révocation par le coach B de sa propre invitation, puis tentative d'acceptation
-- ---------------------------------------------------------------------
set local request.jwt.claims = '{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}';
update public.athlete_invites set status = 'revoked', revoked_at = now()
 where athlete_id = 'b1b1b1b1-0000-4000-8000-000000000001';
reset role;
select results_eq(
  $$ select invite_status from public.get_invitation(encode(sha256('jeton-b'::bytea), 'hex')) $$,
  $$ values ('revoked') $$,
  'Le coach peut révoquer une invitation en attente'
);

select * from finish();
rollback;
