-- Compte de démonstration partagé (OPEN-24, décisions d'Antonino du 14/11/2026) : un compte coach
-- que les visiteurs de Synode utilisent sans s'inscrire. Personne ne peut le confisquer (mot de passe,
-- e-mail), ses données fictives sont remises à zéro chaque nuit, et la remise à zéro ne touche ni le
-- compteur de l'Assistant IA ni une autre organisation.
begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(24);

insert into auth.users (id, email, encrypted_password) values
  ('dddddddd-0000-4000-8000-00000000000d', 'demo-test@example.test', 'mot-de-passe-de-demo'),
  ('eeeeeeee-0000-4000-8000-00000000000e', 'coach-normal@example.test', 'ancien');
insert into public.organizations (id, name, slug) values
  ('eeeeeeee-0000-4000-8000-0000000000e1', 'Org normale', 'org-normale-demo-test');
insert into public.organization_members (organization_id, user_id, role) values
  ('eeeeeeee-0000-4000-8000-0000000000e1', 'eeeeeeee-0000-4000-8000-00000000000e', 'owner');
insert into public.athlete_profiles (organization_id, first_name, last_name, created_by) values
  ('eeeeeeee-0000-4000-8000-0000000000e1', 'Vraie', 'Personne', 'eeeeeeee-0000-4000-8000-00000000000e');

-- 1. Mise en place par l'administrateur (SQL Editor) : l'espace du coach de démo et ses données.
select isnt(
  private.setup_demo_account('Demo-Test@Example.test'),
  null,
  'L''administrateur transforme un utilisateur existant en compte de démo (adresse sans casse)'
);
create temp table demo on commit drop as
  select organization_id as org from private.demo_accounts
  where user_id = 'dddddddd-0000-4000-8000-00000000000d';
select is(
  (select role from public.organization_members m join demo on m.organization_id = demo.org
   where m.user_id = 'dddddddd-0000-4000-8000-00000000000d'),
  'owner', 'Le coach de démo est propriétaire de son organisation'
);
select is(
  (select count(*)::int from public.athlete_profiles p join demo on p.organization_id = demo.org),
  6, 'Six sportifs fictifs'
);
select ok(
  (select count(*) from public.coach_sessions s join demo on s.organization_id = demo.org) >= 5,
  'Des séances dans l''agenda'
);
select is(
  (select count(*)::int from public.coach_tasks t join demo on t.organization_id = demo.org),
  4, 'Quatre tâches, dont une terminée'
);
select is(
  (select count(*)::int from public.programs p join public.program_drafts d on d.program_id = p.id
   join demo on p.organization_id = demo.org),
  1, 'Un programme en brouillon'
);
select is(
  (select count(*)::int from public.expense_categories c join demo on c.organization_id = demo.org),
  7, 'Les catégories de dépenses par défaut'
);

-- 2. Personne ne confisque le compte : mot de passe, e-mail et téléphone restent les mêmes.
update auth.users set encrypted_password = 'pirate', email = 'pirate@example.test', phone = '32470000000'
where id = 'dddddddd-0000-4000-8000-00000000000d';
select is(
  (select encrypted_password from auth.users where id = 'dddddddd-0000-4000-8000-00000000000d'),
  'mot-de-passe-de-demo', 'Le mot de passe du compte de démo ne change pas'
);
select is(
  (select email from auth.users where id = 'dddddddd-0000-4000-8000-00000000000d'),
  'demo-test@example.test', 'Son adresse e-mail non plus'
);
-- Relecture : des métadonnées gonflées bloqueraient toutes les connexions (elles vont dans le jeton).
update auth.users set raw_user_meta_data = '{"pirate": "x"}'::jsonb
where id = 'dddddddd-0000-4000-8000-00000000000d';
select is(
  (select raw_user_meta_data ->> 'pirate' from auth.users where id = 'dddddddd-0000-4000-8000-00000000000d'),
  null, 'Les métadonnées du compte de démo ne changent pas'
);
update auth.users set encrypted_password = 'nouveau' where id = 'eeeeeeee-0000-4000-8000-00000000000e';
select is(
  (select encrypted_password from auth.users where id = 'eeeeeeee-0000-4000-8000-00000000000e'),
  'nouveau', 'Un compte normal change son mot de passe comme avant'
);
-- L'administrateur, lui, peut changer le mot de passe de la démo.
select private.set_demo_password('Demo-Test@Example.test', 'un-nouveau-mot-de-passe-public');
select isnt(
  (select encrypted_password from auth.users where id = 'dddddddd-0000-4000-8000-00000000000d'),
  'mot-de-passe-de-demo', 'L''administrateur change le mot de passe de la démo'
);

-- 3. L'app sait si le coach connecté utilise la démo ; un coach n'appelle pas les fonctions privées.
set local role authenticated;
set local request.jwt.claims = '{"sub":"dddddddd-0000-4000-8000-00000000000d","role":"authenticated"}';
select ok(public.is_demo_account(), 'Le coach de démo est reconnu');
select throws_ok(
  $$ select private.reset_demo_data() $$, '42501', null, 'Un coach ne lance pas la remise à zéro'
);
-- Aucun fichier depuis la démo, même en écrivant directement dans le stockage.
select throws_ok(
  $$ insert into storage.objects (bucket_id, name)
     values ('profile-photos', 'user/dddddddd-0000-4000-8000-00000000000d/photo.jpg') $$,
  '42501', null, 'Le compte de démo ne dépose aucun fichier'
);
set local request.jwt.claims = '{"sub":"eeeeeeee-0000-4000-8000-00000000000e","role":"authenticated"}';
select ok(not public.is_demo_account(), 'Un coach normal n''est pas en démo');
select lives_ok(
  $$ insert into storage.objects (bucket_id, name)
     values ('profile-photos', 'user/eeeeeeee-0000-4000-8000-00000000000e/photo.jpg') $$,
  'Un coach normal dépose sa photo comme avant'
);
reset role;

-- 4. Remise à zéro : ce que les visiteurs ont ajouté disparaît, même une facture émise ; le compteur de
-- l'assistant et l'autre organisation restent intacts.
insert into public.athlete_profiles (organization_id, first_name, last_name, created_by)
select org, 'Visiteur', 'Ajouté', 'dddddddd-0000-4000-8000-00000000000d' from demo;
insert into public.athlete_invoices (organization_id, athlete_id, label, amount_cents, issued_on, due_on, number)
select demo.org, p.id, 'Facture émise', 5000, current_date, current_date + 30, 'DEMO-0001'
from demo join public.athlete_profiles p on p.organization_id = demo.org limit 1;
insert into public.assistant_usage (organization_id, user_id)
select org, 'dddddddd-0000-4000-8000-00000000000d' from demo;
-- Relecture : les réglages du coach salis par un visiteur (lieu, prix, heures de l'agenda, alertes).
update public.coach_profiles
set default_location = 'Chez moi', default_price_cents = 999, agenda_first_hour = 12,
    agenda_last_hour = 13, notify_tasks = false
where user_id = 'dddddddd-0000-4000-8000-00000000000d';

select lives_ok($$ select private.reset_demo_data() $$, 'La remise à zéro passe, facture émise comprise');
select is(
  (select count(*)::int from public.athlete_profiles p join demo on p.organization_id = demo.org),
  6, 'Les six sportifs fictifs sont de retour, sans celui du visiteur'
);
select is(
  (select count(*)::int from public.assistant_usage u join demo on u.organization_id = demo.org),
  1, 'Le compteur de l''Assistant IA n''est pas remis à zéro'
);
select is(
  (select count(*)::int from public.athlete_profiles
   where organization_id = 'eeeeeeee-0000-4000-8000-0000000000e1'),
  1, 'L''autre organisation n''est pas touchée'
);
select ok(
  (select default_location is null and default_price_cents is null and agenda_first_hour = 6
     and agenda_last_hour = 22 and notify_tasks
   from public.coach_profiles where user_id = 'dddddddd-0000-4000-8000-00000000000d'),
  'Les réglages du coach de démo reviennent à leurs valeurs par défaut'
);
-- Le passe-droit de la remise à zéro ne vaut que pour une démo : une facture émise d'une autre
-- organisation ne se supprime toujours pas.
insert into public.athlete_invoices (organization_id, athlete_id, label, amount_cents, issued_on, due_on, number)
select organization_id, id, 'Facture normale', 5000, current_date, current_date + 30, 'NORM-0001'
from public.athlete_profiles where organization_id = 'eeeeeeee-0000-4000-8000-0000000000e1';
select set_config('coory.demo_reset', 'on', true);
select throws_ok(
  $$ delete from public.athlete_invoices where number = 'NORM-0001' $$,
  'P0001', null, 'Une facture émise d''une autre organisation reste protégée'
);
select set_config('coory.demo_reset', 'off', true);

-- 5. La remise à zéro est planifiée chaque nuit.
select ok(
  exists (select 1 from cron.job where jobname = 'coory-demo-reset' and schedule = '0 2 * * *'),
  'La remise à zéro tourne chaque nuit (2 h UTC, 3 h ou 4 h à Bruxelles)'
);

select * from finish();
rollback;
