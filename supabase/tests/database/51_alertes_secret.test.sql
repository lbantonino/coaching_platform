-- Secret de la route /api/alertes vérifié dans le Vault (D-205, 24/11/2026) : la tâche planifiée
-- envoie « Bearer <alertes_secret> » ; Coory le compare au même secret du Vault (une seule copie, plus
-- de décalage possible avec une variable Vercel). Réservé au serveur (service_role).
begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(5);

select ok(
  not public.alertes_secret_ok('Bearer quelque-chose-de-long'),
  'Sans secret dans le Vault : refusé'
);

select vault.create_secret('secret-de-test-0123456789abcdef', 'alertes_secret');

select ok(
  public.alertes_secret_ok('Bearer secret-de-test-0123456789abcdef'),
  'Le bon secret : accepté'
);
select ok(
  not public.alertes_secret_ok('Bearer secret-de-test-0123456789abcdeX'),
  'Un autre secret : refusé'
);

set local role authenticated;
select throws_ok(
  $$ select public.alertes_secret_ok('Bearer secret-de-test-0123456789abcdef') $$,
  '42501', null, 'Un utilisateur connecté ne peut pas tester le secret'
);
reset role;
set local role anon;
select throws_ok(
  $$ select public.alertes_secret_ok('Bearer secret-de-test-0123456789abcdef') $$,
  '42501', null, 'Un visiteur non plus'
);
reset role;

select * from finish();
rollback;
