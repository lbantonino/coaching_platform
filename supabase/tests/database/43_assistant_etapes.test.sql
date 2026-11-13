-- Étapes d'une demande à l'Assistant IA (lot 1 des actions, 13/11/2026) : une demande du coach est
-- réservée une fois, puis poursuivie en étapes (un appel au modèle chacune) ; 6 étapes au plus, en
-- moins de 5 minutes, par le coach qui l'a réservée ; les jetons de chaque étape s'additionnent.
begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(13);

insert into auth.users (id, email) values
  ('11111111-1111-4111-8111-111111111111', 'test-coach-a@example.test'),
  ('22222222-2222-4222-8222-222222222222', 'test-coach-b@example.test');
insert into public.organizations (id, name, slug, coory_plan) values
  ('aaaaaaaa-0000-4000-8000-000000000001', 'Test Org A', 'test-org-a', 'premium'),
  ('bbbbbbbb-0000-4000-8000-000000000002', 'Test Org B', 'test-org-b', 'free');
insert into public.organization_members (organization_id, user_id, role) values
  ('aaaaaaaa-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 'owner'),
  ('bbbbbbbb-0000-4000-8000-000000000002', '22222222-2222-4222-8222-222222222222', 'owner'),
  ('bbbbbbbb-0000-4000-8000-000000000002', '11111111-1111-4111-8111-111111111111', 'coach');

set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}';
create temp table demande on commit drop as
  select public.reserve_assistant_use('aaaaaaaa-0000-4000-8000-000000000001') as id;
grant select on demande to authenticated;

select is(
  (select steps from public.assistant_usage where id = (select id from demande)),
  1,
  'Une demande réservée compte sa première étape'
);
select is(public.continue_assistant_use((select id from demande), 'aaaaaaaa-0000-4000-8000-000000000001'), 2, 'Deuxième étape');
select is(public.continue_assistant_use((select id from demande), 'aaaaaaaa-0000-4000-8000-000000000001'), 3, 'Troisième étape');
select is(public.continue_assistant_use((select id from demande), 'aaaaaaaa-0000-4000-8000-000000000001'), 4, 'Quatrième étape');
select is(public.continue_assistant_use((select id from demande), 'aaaaaaaa-0000-4000-8000-000000000001'), 5, 'Cinquième étape');
select is(public.continue_assistant_use((select id from demande), 'aaaaaaaa-0000-4000-8000-000000000001'), 6, 'Sixième étape');
select throws_ok(
  format('select public.continue_assistant_use(%L, %L)', (select id from demande), 'aaaaaaaa-0000-4000-8000-000000000001'),
  'P0001', 'etapes_epuisees', 'Pas de septième étape'
);

-- Une demande réservée dans l'organisation A ne se poursuit pas au nom de l'organisation B, même
-- quand le coach en est membre (sinon l'abonnement de A servirait à B).
select throws_ok(
  format('select public.continue_assistant_use(%L, %L)', (select id from demande),
         'bbbbbbbb-0000-4000-8000-000000000002'),
  '42501', 'acces_refuse', 'Pas d''étape au nom d''une autre organisation'
);

-- Les jetons de chaque étape s'additionnent ; le statut reste « en cours » jusqu'à la fin.
select public.finish_assistant_use((select id from demande), 'step', 'claude-opus-5-5', 100, 50);
select public.finish_assistant_use((select id from demande), 'step', 'claude-opus-5-5', 100, 50);
select public.finish_assistant_use((select id from demande), 'done', 'claude-opus-5-5', 10, 5);
select is(
  (select array[input_tokens, output_tokens] from public.assistant_usage
   where id = (select id from demande)),
  array[210, 105],
  'Les jetons de toutes les étapes sont additionnés'
);
select is(
  (select status from public.assistant_usage where id = (select id from demande)),
  'done',
  'La demande est close à la dernière étape'
);
select throws_ok(
  format('select public.continue_assistant_use(%L, %L)', (select id from demande), 'aaaaaaaa-0000-4000-8000-000000000001'),
  'P0001', 'demande_expiree', 'Une demande close ne reprend pas'
);

-- Une demande de plus de 5 minutes ne reprend pas.
create temp table ancienne on commit drop as
  select public.reserve_assistant_use('aaaaaaaa-0000-4000-8000-000000000001') as id;
grant select on ancienne to authenticated;
reset role;
update public.assistant_usage set created_at = now() - interval '6 minutes'
where id = (select id from ancienne);
set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}';
select throws_ok(
  format('select public.continue_assistant_use(%L, %L)', (select id from ancienne), 'aaaaaaaa-0000-4000-8000-000000000001'),
  'P0001', 'demande_expiree', 'Une demande de plus de 5 minutes ne reprend pas'
);

-- Un autre coach ne poursuit pas la demande du coach A.
set local request.jwt.claims = '{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}';
select throws_ok(
  format('select public.continue_assistant_use(%L, %L)', (select id from ancienne), 'aaaaaaaa-0000-4000-8000-000000000001'),
  '42501', 'acces_refuse', 'Un autre coach ne poursuit pas la demande'
);

reset role;
select * from finish();
rollback;
