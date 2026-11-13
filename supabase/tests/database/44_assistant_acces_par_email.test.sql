-- Assistant IA ouvert par adresse e-mail (demande d'Antonino du 13/11/2026, D-171) : en plus des
-- organisations abonnées, une liste d'adresses autorisées, tenue par l'administrateur seul. Un coach
-- autorisé l'utilise même si son organisation n'est pas abonnée ; son collègue non autorisé, non.
begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(7);

insert into auth.users (id, email) values
  ('11111111-1111-4111-8111-111111111111', 'Coach.Autorise@Example.test'),
  ('22222222-2222-4222-8222-222222222222', 'collegue@example.test');
insert into public.organizations (id, name, slug) values
  ('aaaaaaaa-0000-4000-8000-000000000001', 'Test Org A', 'test-org-a');
insert into public.organization_members (organization_id, user_id, role) values
  ('aaaaaaaa-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 'owner'),
  ('aaaaaaaa-0000-4000-8000-000000000001', '22222222-2222-4222-8222-222222222222', 'coach');

-- L'administrateur autorise une adresse (en minuscules, comme la liste l'exige).
insert into private.assistant_allowed_emails (email, note)
values ('coach.autorise@example.test', 'test');
select throws_ok(
  $$ insert into private.assistant_allowed_emails (email) values ('Majuscules@Example.test') $$,
  '23514', null, 'La liste ne garde que des adresses en minuscules'
);

set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}';
select ok(
  public.assistant_access_allowed('aaaaaaaa-0000-4000-8000-000000000001'),
  'Le coach autorisé voit l''assistant ouvert (sans abonnement)'
);
select isnt(
  public.reserve_assistant_use('aaaaaaaa-0000-4000-8000-000000000001'),
  null,
  'Le coach autorisé fait une demande, quelle que soit la casse de son adresse'
);
select throws_ok(
  $$ select count(*) from private.assistant_allowed_emails $$,
  '42501', null, 'Un coach ne lit pas la liste'
);

set local request.jwt.claims = '{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}';
select ok(
  not public.assistant_access_allowed('aaaaaaaa-0000-4000-8000-000000000001'),
  'Son collègue non autorisé voit l''assistant verrouillé'
);
select throws_ok(
  $$ select public.reserve_assistant_use('aaaaaaaa-0000-4000-8000-000000000001') $$,
  'P0001', 'abonnement_requis', 'Son collègue ne fait aucune demande'
);
select throws_ok(
  $$ insert into private.assistant_allowed_emails (email) values ('collegue@example.test') $$,
  '42501', null, 'Un coach ne s''ajoute pas lui-même à la liste'
);

reset role;
select * from finish();
rollback;
