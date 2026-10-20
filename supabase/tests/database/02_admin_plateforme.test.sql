-- Tests de la fonction current_user_is_platform_admin (P1-04, ADM-01).
begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(5);

insert into auth.users (id, email) values
  ('55555555-5555-4555-8555-555555555555', 'test-admin-actif@example.test'),
  ('66666666-6666-4666-8666-666666666666', 'test-admin-inactif@example.test'),
  ('77777777-7777-4777-8777-777777777777', 'test-coach@example.test');

insert into public.platform_admins (user_id, is_active) values
  ('55555555-5555-4555-8555-555555555555', true),
  ('66666666-6666-4666-8666-666666666666', false);

set local role authenticated;

set local request.jwt.claims = '{"sub":"55555555-5555-4555-8555-555555555555","role":"authenticated"}';
select ok(public.current_user_is_platform_admin(), 'Un admin actif est reconnu comme admin');

set local request.jwt.claims = '{"sub":"66666666-6666-4666-8666-666666666666","role":"authenticated"}';
select ok(not public.current_user_is_platform_admin(), 'Un admin désactivé n''est plus admin');

set local request.jwt.claims = '{"sub":"77777777-7777-4777-8777-777777777777","role":"authenticated"}';
select ok(not public.current_user_is_platform_admin(), 'Un coach n''est pas admin');

select throws_ok(
  $$ select 1 from public.platform_admins $$,
  '42501', null,
  'La table platform_admins reste illisible même si la fonction existe'
);

reset role;
set local role anon;
set local request.jwt.claims = '{"role":"anon"}';
select throws_ok(
  $$ select public.current_user_is_platform_admin() $$,
  '42501', null,
  'Un visiteur non connecté ne peut pas appeler la fonction'
);

select * from finish();
rollback;
