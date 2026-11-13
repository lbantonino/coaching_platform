-- Tests de l'Assistant IA réservé à l'abonnement (D-168) : sans abonnement, aucune demande ; le
-- coach ne peut pas s'abonner lui-même ; 100 demandes par mois au plus, même abonné ; chacun ne voit
-- que sa consommation ; une demande « échouée » compte quand même.
begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(11);

insert into auth.users (id, email) values
  ('11111111-1111-4111-8111-111111111111', 'test-coach-a@example.test'),
  ('22222222-2222-4222-8222-222222222222', 'test-coach-b@example.test');
insert into public.organizations (id, name, slug) values
  ('aaaaaaaa-0000-4000-8000-000000000001', 'Test Org A', 'test-org-a'),
  ('bbbbbbbb-0000-4000-8000-000000000002', 'Test Org B', 'test-org-b');
insert into public.organization_members (organization_id, user_id, role) values
  ('aaaaaaaa-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 'owner'),
  ('bbbbbbbb-0000-4000-8000-000000000002', '22222222-2222-4222-8222-222222222222', 'owner');

select is(
  (select coory_plan from public.organizations where id = 'aaaaaaaa-0000-4000-8000-000000000001'),
  'free',
  'Une organisation démarre sans abonnement'
);

set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}';

select throws_ok(
  $$ select public.reserve_assistant_use('aaaaaaaa-0000-4000-8000-000000000001') $$,
  'P0001', 'abonnement_requis', 'Sans abonnement, aucune demande à l''assistant'
);
select throws_ok(
  $$ update public.organizations set coory_plan = 'premium'
     where id = 'aaaaaaaa-0000-4000-8000-000000000001' $$,
  '42501', null, 'Un coach ne peut pas activer l''abonnement lui-même'
);
select throws_ok(
  $$ insert into public.assistant_usage (organization_id, user_id)
     values ('aaaaaaaa-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111') $$,
  '42501', null, 'Un coach n''écrit pas directement dans la consommation'
);

-- L'administrateur active l'abonnement (en base).
reset role;
update public.organizations set coory_plan = 'premium'
where id = 'aaaaaaaa-0000-4000-8000-000000000001';

set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}';
select isnt(
  public.reserve_assistant_use('aaaaaaaa-0000-4000-8000-000000000001'),
  null,
  'Abonné, le coach réserve une demande'
);
select throws_ok(
  $$ select public.reserve_assistant_use('bbbbbbbb-0000-4000-8000-000000000002') $$,
  '42501', 'acces_refuse', 'Pas de demande au nom d''une autre organisation'
);

-- Une demande notée « échouée » compte quand même dans la limite.
select lives_ok(
  $$ select public.finish_assistant_use(
       (select id from public.assistant_usage limit 1), 'failed', 'claude-opus-5-5', 10, 0) $$,
  'Le résultat d''une demande se note'
);
select is(
  (select count(*)::integer from public.assistant_usage),
  1,
  'Le coach voit sa demande, échouée comprise'
);

-- 99 demandes de plus ce mois-ci : la 101e est refusée.
reset role;
insert into public.assistant_usage (organization_id, user_id, status)
select 'aaaaaaaa-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 'done'
from generate_series(1, 99);
-- Une demande du mois dernier ne compte pas.
update public.assistant_usage set created_at = private.assistant_month_start() - interval '1 day'
where id = (select id from public.assistant_usage where status = 'done' limit 1);

set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}';
select isnt(
  public.reserve_assistant_use('aaaaaaaa-0000-4000-8000-000000000001'),
  null,
  'Une demande du mois dernier ne compte pas dans la limite'
);
select throws_ok(
  $$ select public.reserve_assistant_use('aaaaaaaa-0000-4000-8000-000000000001') $$,
  'P0001', 'limite_mensuelle', 'Au-delà de 100 demandes ce mois-ci, l''assistant refuse'
);

-- Le coach B ne voit rien de la consommation du coach A.
set local request.jwt.claims = '{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}';
select is(
  (select count(*)::integer from public.assistant_usage),
  0,
  'Un coach ne voit pas la consommation d''un autre'
);

reset role;
select * from finish();
rollback;
