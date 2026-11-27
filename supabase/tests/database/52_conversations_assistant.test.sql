-- Conversations de l'Assistant IA enregistrées (D-212, 27/11/2026) : chaque coach ne voit et n'écrit
-- QUE ses conversations ; un enregistrement périmé (autre appareil) est refusé ; rien pour le compte de
-- démonstration ; effacement 12 mois après le dernier message ; clé de notification « assistant ».
begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(17);

insert into auth.users (id, email) values
  ('11111111-1111-4111-8111-111111111111', 'test-coach-a@example.test'),
  ('22222222-2222-4222-8222-222222222222', 'test-coach-b@example.test'),
  ('33333333-3333-4333-8333-333333333333', 'test-coach-a2@example.test'),
  ('55555555-5555-4555-8555-555555555555', 'test-demo@example.test');
insert into public.organizations (id, name, slug) values
  ('aaaaaaaa-0000-4000-8000-000000000001', 'Test Org A', 'test-org-a'),
  ('bbbbbbbb-0000-4000-8000-000000000002', 'Test Org B', 'test-org-b'),
  ('dddddddd-0000-4000-8000-000000000004', 'Test Org démo', 'test-org-demo');
insert into public.organization_members (organization_id, user_id, role) values
  ('aaaaaaaa-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 'owner'),
  ('aaaaaaaa-0000-4000-8000-000000000001', '33333333-3333-4333-8333-333333333333', 'coach'),
  ('bbbbbbbb-0000-4000-8000-000000000002', '22222222-2222-4222-8222-222222222222', 'owner'),
  ('dddddddd-0000-4000-8000-000000000004', '55555555-5555-4555-8555-555555555555', 'owner');
insert into private.demo_accounts (user_id, organization_id)
values ('55555555-5555-4555-8555-555555555555', 'dddddddd-0000-4000-8000-000000000004');

-- 1. Le coach A crée puis met à jour sa conversation ; une version périmée est refusée.
set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}';
select is(
  public.save_assistant_conversation('c0000000-0000-4000-8000-00000000000a',
    'aaaaaaaa-0000-4000-8000-000000000001', 0, 'Plan HYROX', '[{"id":0}]', 1),
  1, 'Nouvelle conversation : version 1'
);
select is(
  public.save_assistant_conversation('c0000000-0000-4000-8000-00000000000a',
    'aaaaaaaa-0000-4000-8000-000000000001', 1, 'ignoré', '[{"id":0},{"id":1}]', 2),
  2, 'Mise à jour depuis la dernière version : version 2'
);
select is(
  public.save_assistant_conversation('c0000000-0000-4000-8000-00000000000a',
    'aaaaaaaa-0000-4000-8000-000000000001', 1, 'ignoré', '[{"id":0}]', 1),
  null, 'Version périmée (autre appareil) : refusée'
);
select is(
  (select title from public.assistant_conversations where id = 'c0000000-0000-4000-8000-00000000000a'),
  'Plan HYROX', 'Le titre reste celui de la création'
);
reset role;

-- 2. Le dernier message n'avance que si des messages s'ajoutent (pas pour une carte validée).
update public.assistant_conversations
   set last_message_at = now() - interval '10 days'
 where id = 'c0000000-0000-4000-8000-00000000000a';
set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}';
select public.save_assistant_conversation('c0000000-0000-4000-8000-00000000000a',
  'aaaaaaaa-0000-4000-8000-000000000001', 2, 'ignoré', '[{"id":0},{"id":1,"cards":[]}]', 2);
select ok(
  (select last_message_at < now() - interval '9 days' from public.assistant_conversations
    where id = 'c0000000-0000-4000-8000-00000000000a'),
  'Même nombre de messages : le dernier message ne bouge pas'
);
select public.save_assistant_conversation('c0000000-0000-4000-8000-00000000000a',
  'aaaaaaaa-0000-4000-8000-000000000001', 3, 'ignoré', '[{"id":0},{"id":1},{"id":2}]', 3);
select ok(
  (select last_message_at > now() - interval '1 minute' from public.assistant_conversations
    where id = 'c0000000-0000-4000-8000-00000000000a'),
  'Un message de plus : le dernier message avance (12 mois de plus)'
);
-- Jamais dans une organisation dont il n'est pas membre.
select throws_ok(
  $$ select public.save_assistant_conversation('c0000000-0000-4000-8000-00000000000b',
       'bbbbbbbb-0000-4000-8000-000000000002', 0, 'Intrus', '[]', 0) $$,
  '42501', null, 'Pas dans une autre organisation'
);
reset role;

-- 3. Les autres coachs : ni lire, ni écrire, ni supprimer, même dans la même organisation.
set local role authenticated;
set local request.jwt.claims = '{"sub":"33333333-3333-4333-8333-333333333333","role":"authenticated"}';
select is((select count(*)::int from public.assistant_conversations), 0,
  'Un autre coach de la même organisation ne voit rien');
select is(
  public.save_assistant_conversation('c0000000-0000-4000-8000-00000000000a',
    'aaaaaaaa-0000-4000-8000-000000000001', 4, 'Pirate', '[]', 0),
  null, 'Ni ne la modifie (même avec la bonne version)'
);
select is(
  public.save_assistant_conversation('c0000000-0000-4000-8000-00000000000a',
    'aaaaaaaa-0000-4000-8000-000000000001', 0, 'Pirate', '[]', 0),
  null, 'Ni ne la remplace en la « créant » avec le même identifiant'
);
delete from public.assistant_conversations where id = 'c0000000-0000-4000-8000-00000000000a';
reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}';
select is((select count(*)::int from public.assistant_conversations), 0,
  'Un coach d''une autre organisation ne voit rien');
reset role;
select is(
  (select version from public.assistant_conversations where id = 'c0000000-0000-4000-8000-00000000000a'),
  4, 'La conversation de A est intacte (pas supprimée, pas modifiée)'
);

-- 4. Compte de démonstration : rien n'est enregistré.
set local role authenticated;
set local request.jwt.claims = '{"sub":"55555555-5555-4555-8555-555555555555","role":"authenticated"}';
select throws_ok(
  $$ select public.save_assistant_conversation('c0000000-0000-4000-8000-00000000000d',
       'dddddddd-0000-4000-8000-000000000004', 0, 'Démo', '[]', 0) $$,
  '42501', null, 'Démo : la fonction refuse'
);
select throws_ok(
  $$ insert into public.assistant_conversations (id, organization_id, title, messages)
     values ('c0000000-0000-4000-8000-00000000000e', 'dddddddd-0000-4000-8000-000000000004', 'Démo', '[]') $$,
  '42501', null, 'Démo : la table refuse aussi'
);
reset role;

-- 5. Effacement : le jour anniversaire (12 mois après le dernier message, heure de Bruxelles).
insert into public.assistant_conversations (id, organization_id, user_id, title, messages, last_message_at) values
  ('c0000000-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000001',
   '11111111-1111-4111-8111-111111111111', 'Vieille', '[]', now() - interval '12 months' - interval '1 day'),
  ('c0000000-0000-4000-8000-000000000002', 'aaaaaaaa-0000-4000-8000-000000000001',
   '11111111-1111-4111-8111-111111111111', 'Presque', '[]', now() - interval '12 months' + interval '1 day');
select private.purge_assistant_conversations();
select is(
  (select array_agg(title order by title) from public.assistant_conversations
    where id in ('c0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000002')),
  array['Presque'], '12 mois et 1 jour : effacée ; 12 mois moins 1 jour : gardée'
);

-- 6. La cloche accepte la clé « assistant:<id>:<date d'effacement> ».
select lives_ok(
  $$ insert into public.coach_notification_states (user_id, organization_id, key, read_at)
     values ('11111111-1111-4111-8111-111111111111', 'aaaaaaaa-0000-4000-8000-000000000001',
             'assistant:c0000000-0000-4000-8000-00000000000a:2027-11-27', now()) $$,
  'Clé de notification « assistant » acceptée'
);

-- 7. Effacées avec l'organisation et avec le compte (« Supprimer mon compte »).
select is(
  (select array_agg(confdeltype::text) from pg_constraint
    where conrelid = 'public.assistant_conversations'::regclass and contype = 'f'),
  array['c', 'c'], 'Liens « on delete cascade » vers l''organisation et le compte'
);

select * from finish();
rollback;
