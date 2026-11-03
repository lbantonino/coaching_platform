-- Comptabilité simple (D-90) : le taux de TVA appartient à l'organisation (0 à 100, propriétaire
-- seulement, comme le pays), et « Séances à encaisser » remplace « Factures en retard » dans la cloche.
begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(9);

insert into auth.users (id, email) values
  ('11111111-1111-4111-8111-111111111111', 'test-owner-a@example.test'),
  ('22222222-2222-4222-8222-222222222222', 'test-owner-b@example.test'),
  ('44444444-4444-4444-8444-444444444444', 'test-coach-a@example.test');
insert into public.organizations (id, name, slug) values
  ('aaaaaaaa-0000-4000-8000-000000000001', 'Test Org A', 'test-org-a'),
  ('bbbbbbbb-0000-4000-8000-000000000002', 'Test Org B', 'test-org-b');
insert into public.organization_members (organization_id, user_id, role) values
  ('aaaaaaaa-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 'owner'),
  ('aaaaaaaa-0000-4000-8000-000000000001', '44444444-4444-4444-8444-444444444444', 'coach'),
  ('bbbbbbbb-0000-4000-8000-000000000002', '22222222-2222-4222-8222-222222222222', 'owner');

select is(
  (select vat_rate from public.organizations where id = 'aaaaaaaa-0000-4000-8000-000000000001'),
  0::numeric,
  'Une nouvelle organisation n''a pas de TVA'
);
select throws_ok(
  $$ update public.organizations set vat_rate = 150 where id = 'aaaaaaaa-0000-4000-8000-000000000001' $$,
  '23514', null, 'Le taux de TVA reste entre 0 et 100'
);
select hasnt_column('public', 'coach_profiles', 'notify_invoices', 'Plus de réglage « Factures en retard »');
select col_default_is('public', 'coach_profiles', 'notify_unpaid', 'true',
  '« Séances à encaisser » est affiché dans la cloche par défaut');

set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}';
select lives_ok(
  $$ update public.organizations set vat_rate = 8.1 where id = 'aaaaaaaa-0000-4000-8000-000000000001' $$,
  'Le propriétaire règle son taux de TVA'
);

-- Un coach non propriétaire, puis le propriétaire d'une autre organisation : rien ne change.
set local request.jwt.claims = '{"sub":"44444444-4444-4444-8444-444444444444","role":"authenticated"}';
update public.organizations set vat_rate = 0 where id = 'aaaaaaaa-0000-4000-8000-000000000001';
set local request.jwt.claims = '{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}';
update public.organizations set vat_rate = 0 where id = 'aaaaaaaa-0000-4000-8000-000000000001';
set local request.jwt.claims = '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}';
select results_eq(
  $$ select vat_rate from public.organizations where id = 'aaaaaaaa-0000-4000-8000-000000000001' $$,
  $$ values (8.10::numeric) $$,
  'Ni un coach non propriétaire ni une autre organisation ne changent le taux'
);

-- Cloche : clé « unpaid:<séance>:<date> » ; les anciennes clés de factures ne sont plus acceptées.
select lives_ok(
  $$ insert into public.coach_notification_states (organization_id, key, read_at)
     values ('aaaaaaaa-0000-4000-8000-000000000001',
             'unpaid:ca000000-0000-4000-8000-000000000201:2026-11-02', now()) $$,
  'Une séance à encaisser se marque lue'
);
select throws_ok(
  $$ insert into public.coach_notification_states (organization_id, key, read_at)
     values ('aaaaaaaa-0000-4000-8000-000000000001',
             'invoice:fa000000-0000-4000-8000-000000000001:2026-10-15', now()) $$,
  '23514', null, 'Plus de notification de facture'
);
select throws_ok(
  $$ update public.organizations set country = 'FR', vat_rate = 20, status = 'suspended'
     where id = 'aaaaaaaa-0000-4000-8000-000000000001' $$,
  '42501', null, 'Le propriétaire ne change que le nom, le pays et le taux (pas le statut)'
);

select * from finish();
rollback;
