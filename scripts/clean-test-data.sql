-- Nettoyage des données laissées par les tests de bout en bout (Playwright) dans la base LOCALE.
-- Chaque test crée des données uniques marquées par le projet et l'heure (« Alex Statut
-- ordinateur-1794583776577-4v9f1a », « Notif 1794583865962 », inscription-coach-telephone-…) : ce
-- script ne supprime QUE ces données. La graine de démonstration et ce qui a été créé à la main
-- (sans ce marqueur) restent. Lancé après chaque suite Playwright (tests/e2e/global-teardown.ts) et à
-- la main : npm run db:clean-tests. Jamais sur une base en ligne.
do $$
declare
  -- « John » suivi de lettres et de chiffres : prénoms créés par une ancienne version d'un test.
  marker constant text :=
    '(ordinateur|telephone)-[0-9]{10,}|(^|[^0-9])1[78][0-9]{11}([^0-9]|$)|^John[0-9a-z]{10,}$';
  demo constant uuid[] := array[
    '0a000000-0000-4000-8000-0000000000a1'::uuid,
    '0b000000-0000-4000-8000-0000000000b1'::uuid
  ];
  col record;
  n bigint;
begin
  -- 1. Organisations créées par les tests d'inscription (leurs comptes partent à l'étape 2). Leurs
  --    factures et leurs sportifs d'abord : ils bloquent l'effacement de l'organisation (« on delete
  --    restrict », même ordre que delete_account_data) ; un test d'inscription qui s'arrête après
  --    avoir créé un sportif bloquait sinon tout le nettoyage (18/11/2026).
  create temporary table test_orgs on commit drop as
  select distinct m.organization_id as id
  from public.organization_members m
  join auth.users u on u.id = m.user_id
  where u.email ~ marker and m.organization_id <> all (demo);
  delete from public.athlete_invoices where organization_id in (select id from test_orgs);
  delete from public.athlete_profiles where organization_id in (select id from test_orgs);
  delete from public.organizations o where o.id in (select id from test_orgs);
  get diagnostics n = row_count;
  if n > 0 then raise notice 'organisations : %', n; end if;

  -- 2. Sportifs de test (leurs objectifs, programmes, séances, paiements, invitations… suivent),
  --    AVANT leurs comptes : une invitation acceptée garde le lien vers le compte.
  delete from public.athlete_profiles where display_name ~ marker;
  get diagnostics n = row_count;
  if n > 0 then raise notice 'sportifs : %', n; end if;
  delete from auth.users where email ~ marker;
  get diagnostics n = row_count;
  if n > 0 then raise notice 'comptes : %', n; end if;

  -- 3. Le reste : toute ligne dont un champ texte porte le marqueur (programme, tâche, séance,
  --    message, objectif ajoutés par un test à un sportif de la démo…). Le catalogue d'exercices
  --    commun n'est jamais touché.
  for col in
    select c.table_name, c.column_name
    from information_schema.columns c
    join information_schema.tables t
      on t.table_schema = c.table_schema and t.table_name = c.table_name
    where c.table_schema = 'public'
      and t.table_type = 'BASE TABLE'
      and c.data_type in ('text', 'character varying')
      and c.is_generated = 'NEVER'
      and c.table_name <> 'exercises'
    order by c.table_name, c.column_name
  loop
    execute format('delete from public.%I where %I ~ $1', col.table_name, col.column_name)
      using marker;
    get diagnostics n = row_count;
    if n > 0 then
      raise notice '% (%) : %', col.table_name, col.column_name, n;
    end if;
  end loop;
  delete from public.exercises where organization_id is not null and name_fr ~ marker;
  get diagnostics n = row_count;
  if n > 0 then raise notice 'exercices du coach : %', n; end if;

  -- 3 bis. « Compléter la fiche » (assistant, lot 2) : le matériel écrit par le test sur Sarah et Hugo
  --    (graine du coach B) redevient vide. Une valeur fixe, SANS le marqueur : avec lui, l'étape 3
  --    supprimerait la fiche entière.
  update public.athlete_profiles set equipment = null
  where id in ('db000000-0000-4000-8000-000000000001', 'db000000-0000-4000-8000-000000000002')
    and equipment = 'Tapis de course (test assistant)';

  -- 4. Demandes à l'Assistant IA du coach B (faux Claude des tests) : sa limite mensuelle repart à zéro.
  delete from public.assistant_usage where user_id = 'b0000000-0000-4000-8000-00000000000b';
  get diagnostics n = row_count;
  if n > 0 then raise notice 'demandes de test à l''assistant : %', n; end if;

  -- 5. Conversations enregistrées (D-212) des comptes de test (coachs A, B et C de la graine) : celles
  --    des tests (faux Claude) et leurs notifications « bientôt effacée ». Base LOCALE seulement.
  delete from public.assistant_conversations
  where user_id in (select id from auth.users
                    where email in ('coach-a@example.test', 'coach-b@example.test', 'coach-c@example.test'));
  get diagnostics n = row_count;
  if n > 0 then raise notice 'conversations de test de l''assistant : %', n; end if;
  delete from public.coach_notification_states where key like 'assistant:%'
    and user_id in (select id from auth.users
                    where email in ('coach-a@example.test', 'coach-b@example.test', 'coach-c@example.test'));

  -- 6. Fichiers joints à l'Assistant IA par les tests (D-213) : les lignes (les fichiers du stockage
  --    sont retirés par l'API, scripts/clean-test-data.mjs).
  delete from public.assistant_files
  where user_id in (select id from auth.users
                    where email in ('coach-a@example.test', 'coach-b@example.test', 'coach-c@example.test'));
end $$;
