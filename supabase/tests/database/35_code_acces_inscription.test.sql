-- Code d'accès de l'inscription (bêta privée, D-140) : le crochet Auth « before user created »
-- accepte le bon code (majuscules et espaces ignorés), refuse un code absent ou faux, laisse passer
-- les comptes créés par le serveur pour une invitation, ferme les inscriptions sans code enregistré ;
-- personne d'autre que Supabase Auth ne peut l'appeler ni lire le code ; le code tapé ne reste pas
-- dans les métadonnées du compte.
begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(12);

select private.set_signup_access_code('Bon-Code-2026');

select is(
  public.before_user_created_access_code(
    '{"user":{"user_metadata":{"access_code":"  bon-code-2026 "},"app_metadata":{}}}'::jsonb),
  '{}'::jsonb,
  'Le bon code est accepté (majuscules et espaces ignorés)'
);
select is(
  public.before_user_created_access_code(
    '{"user":{"user_metadata":{"access_code":"FAUX-CODE"},"app_metadata":{}}}'::jsonb) #>> '{error,message}',
  'Code d''accès incorrect.',
  'Un faux code est refusé'
);
select is(
  public.before_user_created_access_code(
    '{"user":{"user_metadata":{},"app_metadata":{}}}'::jsonb) #>> '{error,http_code}',
  '403',
  'Sans code : refus 403'
);
select is(
  public.before_user_created_access_code(
    '{"user":{"user_metadata":{},"app_metadata":{"coory_invited":true}}}'::jsonb),
  '{}'::jsonb,
  'Un compte créé par le serveur pour une invitation passe sans code'
);
select is(
  (select count(*)::int from private.signup_access_code),
  1,
  'Un seul code en vigueur'
);
select ok(
  (select code_hash not ilike '%bon-code%' from private.signup_access_code),
  'Le code est rangé haché, jamais en clair'
);
select throws_ok(
  $$ select private.set_signup_access_code('abc') $$,
  'Le code d''accès doit faire au moins 6 caractères.',
  'Un code trop court est refusé'
);

-- Le code tapé est retiré des métadonnées du compte, à la création comme aux mises à jour.
insert into auth.users (id, email, raw_user_meta_data) values
  ('35353535-0000-4000-8000-000000000001', 'test-code@example.test',
   '{"first_name":"Test","access_code":"BON-CODE-2026"}');
select is(
  (select raw_user_meta_data from auth.users where id = '35353535-0000-4000-8000-000000000001'),
  '{"first_name":"Test"}'::jsonb,
  'Le code n''est pas gardé dans le compte créé'
);
update auth.users set raw_user_meta_data = raw_user_meta_data || '{"access_code":"X"}'
  where id = '35353535-0000-4000-8000-000000000001';
select ok(
  (select not (raw_user_meta_data ? 'access_code') from auth.users
    where id = '35353535-0000-4000-8000-000000000001'),
  'Ni après une mise à jour des métadonnées'
);

-- Sans code enregistré : inscriptions fermées.
delete from private.signup_access_code;
select is(
  public.before_user_created_access_code(
    '{"user":{"user_metadata":{"access_code":"BON-CODE-2026"},"app_metadata":{}}}'::jsonb) #>> '{error,message}',
  'Les inscriptions sont fermées pour le moment.',
  'Aucun code enregistré : inscriptions fermées'
);

-- Le navigateur (anon, authenticated) ne peut ni appeler le crochet ni lire le code.
set local role anon;
select throws_ok(
  $$ select public.before_user_created_access_code('{}'::jsonb) $$,
  '42501',
  null,
  'Un visiteur ne peut pas appeler le crochet'
);
reset role;
set local role authenticated;
select throws_ok(
  $$ select * from private.signup_access_code $$,
  '42501',
  null,
  'Un compte connecté ne peut pas lire le code'
);
reset role;

select * from finish();
rollback;
