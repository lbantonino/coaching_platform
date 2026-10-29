-- Dépenses (D-73) : catégories de départ, une dépense prend la devise de l'organisation, isolation
-- entre organisations, catégorie d'une autre organisation refusée, fin seulement pour une dépense
-- mensuelle, et changement de devise : une dépense mensuelle en cours est coupée (le passé reste).
begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(10);

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
  (select count(*)::int from public.expense_categories
   where organization_id = 'aaaaaaaa-0000-4000-8000-000000000001'),
  7, 'Une nouvelle organisation reçoit les 7 catégories de dépenses de départ'
);

set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}';

select lives_ok(
  $$ insert into public.coach_expenses (id, organization_id, category_id, label, spent_on,
       amount_cents, vat_rate, currency, repeats_monthly, created_by)
     select 'e0000000-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000001', id,
       'Loyer', '2026-01-15', 60500, 21, 'CHF', true, '11111111-1111-4111-8111-111111111111'
     from public.expense_categories
     where organization_id = 'aaaaaaaa-0000-4000-8000-000000000001' and name = 'Loyer et salle' $$,
  'Le coach A note un loyer mensuel'
);
select is(
  (select currency from public.coach_expenses where id = 'e0000000-0000-4000-8000-000000000001'),
  'EUR', 'La dépense prend la devise de l''organisation, pas celle envoyée'
);
select throws_ok(
  $$ insert into public.coach_expenses (organization_id, label, spent_on, amount_cents,
       repeats_monthly, ends_on, created_by)
     values ('aaaaaaaa-0000-4000-8000-000000000001', 'Matériel', '2026-10-01', 1000, false,
       '2026-12-01', '11111111-1111-4111-8111-111111111111') $$,
  '23514', null, 'Une date de fin n''existe que pour une dépense mensuelle'
);

reset role;
select throws_ok(
  $$ insert into public.coach_expenses (organization_id, category_id, label, spent_on, amount_cents)
     select 'aaaaaaaa-0000-4000-8000-000000000001', id, 'Intrus', '2026-10-01', 1000
     from public.expense_categories
     where organization_id = 'bbbbbbbb-0000-4000-8000-000000000002' limit 1 $$,
  '23503', null, 'Une dépense ne pointe pas vers une catégorie d''une autre organisation'
);

set local role authenticated;
set local request.jwt.claims = '{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}';
select is_empty(
  $$ select 1 from public.coach_expenses where organization_id = 'aaaaaaaa-0000-4000-8000-000000000001' $$,
  'Le coach B ne voit aucune dépense de A'
);
delete from public.coach_expenses where organization_id = 'aaaaaaaa-0000-4000-8000-000000000001';

-- Changement de devise : le loyer en cours est coupé à sa prochaine date, la copie est convertie.
set local request.jwt.claims = '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}';
select is(
  (select (public.change_organization_currency('aaaaaaaa-0000-4000-8000-000000000001', 'CHF', 0.94) ->> 'expenses')::int),
  1, 'Le changement de devise touche le loyer en cours'
);
reset role;
select is(
  (select count(*)::int from public.coach_expenses where label = 'Loyer'),
  2, 'Le loyer a été coupé en deux : la partie passée et la partie à venir'
);
select results_eq(
  $$ select currency, amount_cents from public.coach_expenses where label = 'Loyer' order by spent_on $$,
  $$ values ('EUR'::text, 60500), ('CHF', 56870) $$,
  'Le passé reste en euros, la suite est en francs suisses (605 € -> 568,70 CHF)'
);
select ok(
  (select bool_and(ends_on is not null) from public.coach_expenses
   where label = 'Loyer' and currency = 'EUR'),
  'La partie en euros s''arrête la veille de la reprise en francs suisses'
);

select * from finish();
rollback;
