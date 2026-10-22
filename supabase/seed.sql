-- =====================================================================
-- DONNÉES DE DÉMONSTRATION : DÉVELOPPEMENT ET TESTS UNIQUEMENT
-- =====================================================================
-- Exécuté par `npm run db:reset` sur la base Supabase LOCALE après les migrations.
-- Jamais appliqué en staging ni en production.
--
-- Règles :
--   - aucune donnée personnelle réelle (nom, email, téléphone, programme d'un vrai sportif) ;
--   - noms inventés (aucune personne réelle visée), « Organisation Démo A / B » pour les structures ;
--   - emails en domaine réservé : *@example.test ;
--   - le seed doit pouvoir être rejoué à l'identique après chaque reset.
--
-- Comptes de connexion locaux (mot de passe de démo commun : demo-coach-local) :
--   coach-a@example.test -> propriétaire de « Organisation Démo A »
--   coach-b@example.test -> propriétaire de « Organisation Démo B »
--   admin@example.test   -> administrateur de la plateforme, membre d'aucune organisation
--   coach-reset@example.test -> coach de « Organisation Démo A », réservé au test E2E « mot de passe oublié »
--                               (son mot de passe change à chaque exécution du test)
--   thomas.peeters@example.test -> sportif de « Organisation Démo A » (compte activé) : ouvre l'espace sportif
-- Les UUID sont fixes pour que les tests puissent s'y référer.

-- ---------------------------------------------------------------------
-- Comptes Auth (local uniquement)
-- ---------------------------------------------------------------------
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change, email_change_token_new
)
values
  ('00000000-0000-0000-0000-000000000000', 'a0000000-0000-4000-8000-00000000000a', 'authenticated', 'authenticated',
   'coach-a@example.test', extensions.crypt('demo-coach-local', extensions.gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}', '{"display_name":"Coach Démo A"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', 'b0000000-0000-4000-8000-00000000000b', 'authenticated', 'authenticated',
   'coach-b@example.test', extensions.crypt('demo-coach-local', extensions.gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}', '{"display_name":"Coach Démo B"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', 'c0000000-0000-4000-8000-00000000000c', 'authenticated', 'authenticated',
   'admin@example.test', extensions.crypt('demo-coach-local', extensions.gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}', '{"display_name":"Admin Démo"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', 'd0000000-0000-4000-8000-00000000000d', 'authenticated', 'authenticated',
   'coach-reset@example.test', extensions.crypt('demo-coach-local', extensions.gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}', '{"display_name":"Coach Reset (test)"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', 'e0000000-0000-4000-8000-00000000000e', 'authenticated', 'authenticated',
   'thomas.peeters@example.test', extensions.crypt('demo-coach-local', extensions.gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}', '{"display_name":"Thomas Peeters"}', now(), now(), '', '', '', '');

insert into auth.identities (id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
values
  (gen_random_uuid(), 'a0000000-0000-4000-8000-00000000000a', 'a0000000-0000-4000-8000-00000000000a',
   '{"sub":"a0000000-0000-4000-8000-00000000000a","email":"coach-a@example.test","email_verified":true}',
   'email', now(), now(), now()),
  (gen_random_uuid(), 'b0000000-0000-4000-8000-00000000000b', 'b0000000-0000-4000-8000-00000000000b',
   '{"sub":"b0000000-0000-4000-8000-00000000000b","email":"coach-b@example.test","email_verified":true}',
   'email', now(), now(), now()),
  (gen_random_uuid(), 'c0000000-0000-4000-8000-00000000000c', 'c0000000-0000-4000-8000-00000000000c',
   '{"sub":"c0000000-0000-4000-8000-00000000000c","email":"admin@example.test","email_verified":true}',
   'email', now(), now(), now()),
  (gen_random_uuid(), 'd0000000-0000-4000-8000-00000000000d', 'd0000000-0000-4000-8000-00000000000d',
   '{"sub":"d0000000-0000-4000-8000-00000000000d","email":"coach-reset@example.test","email_verified":true}',
   'email', now(), now(), now()),
  (gen_random_uuid(), 'e0000000-0000-4000-8000-00000000000e', 'e0000000-0000-4000-8000-00000000000e',
   '{"sub":"e0000000-0000-4000-8000-00000000000e","email":"thomas.peeters@example.test","email_verified":true}',
   'email', now(), now(), now());

-- Administrateur de la plateforme (aucun accès implicite aux organisations, docs/02 §6).
insert into public.platform_admins (user_id) values ('c0000000-0000-4000-8000-00000000000c');

-- ---------------------------------------------------------------------
-- Deux organisations de test indépendantes (isolation multi-tenant)
-- ---------------------------------------------------------------------
insert into public.organizations (id, name, slug, created_by)
values
  ('0a000000-0000-4000-8000-0000000000a1', 'Organisation Démo A', 'demo-a', 'a0000000-0000-4000-8000-00000000000a'),
  ('0b000000-0000-4000-8000-0000000000b1', 'Organisation Démo B', 'demo-b', 'b0000000-0000-4000-8000-00000000000b');

insert into public.organization_members (organization_id, user_id, role)
values
  ('0a000000-0000-4000-8000-0000000000a1', 'a0000000-0000-4000-8000-00000000000a', 'owner'),
  ('0b000000-0000-4000-8000-0000000000b1', 'b0000000-0000-4000-8000-00000000000b', 'owner'),
  ('0a000000-0000-4000-8000-0000000000a1', 'd0000000-0000-4000-8000-00000000000d', 'coach');

-- ---------------------------------------------------------------------
-- Sportifs de démonstration (P2-02) : personnes INVENTÉES, profils variés pour voir les fiches
-- (remise en forme, musculation, running, Hyrox, hybride ; actif, en pause, archivé ; avec ou sans compte).
-- UUID en « da… » (Démo A) et « db… » (Démo B), distincts de ceux des tests SQL.
-- ---------------------------------------------------------------------
insert into public.athlete_profiles (
  id, organization_id, first_name, last_name, email, preferred_contact, level, experience,
  training_places, equipment, status, created_by, created_at
)
values
  ('da000000-0000-4000-8000-000000000001', '0a000000-0000-4000-8000-0000000000a1', 'Sophie', 'Lambert',
   'sophie.lambert@example.test', 'whatsapp', 'beginner',
   'Reprise du sport après 5 ans d''arrêt ; vient 2 fois par semaine à la salle pour se remettre en forme.',
   '{gym}', 'Accès complet à la salle : machines guidées, haltères, poulies, vélo et rameur.',
   'active', 'a0000000-0000-4000-8000-00000000000a', '2026-09-08 10:00+02'),
  ('da000000-0000-4000-8000-000000000002', '0a000000-0000-4000-8000-0000000000a1', 'Thomas', 'Peeters',
   'thomas.peeters@example.test', 'email', 'intermediate',
   'Court depuis 4 ans ; 10 km en 46 min. Vise un semi-marathon au printemps.',
   '{outdoor,track}', 'Montre GPS avec ceinture cardio.',
   'active', 'a0000000-0000-4000-8000-00000000000a', '2026-09-01 18:30+02'),
  ('da000000-0000-4000-8000-000000000003', '0a000000-0000-4000-8000-0000000000a1', 'Inès', 'Benali',
   'ines.benali@example.test', 'whatsapp', 'advanced',
   'Deux Hyrox terminés en catégorie Open ; ancienne joueuse de basket.',
   '{box,gym}', 'Box équipée : SkiErg, rameur, traîneau, wall balls, kettlebells.',
   'active', 'a0000000-0000-4000-8000-00000000000a', '2026-09-15 09:15+02'),
  ('da000000-0000-4000-8000-000000000004', '0a000000-0000-4000-8000-0000000000a1', 'Lucas', 'Janssens',
   'lucas.janssens@example.test', 'sms', 'intermediate',
   'Musculation depuis 3 ans ; commence la course à pied pour préparer un premier Hyrox.',
   '{gym,outdoor}', 'Salle de sport et chaussures de course.',
   'active', 'a0000000-0000-4000-8000-00000000000a', '2026-09-22 19:00+02'),
  ('da000000-0000-4000-8000-000000000005', '0a000000-0000-4000-8000-0000000000a1', 'Nadia', 'El Amrani',
   'nadia.elamrani@example.test', 'phone', 'competitor',
   'Force athlétique depuis 6 ans ; compétitions régionales.',
   '{gym}', 'Barre olympique, rack à squat, disques jusqu''à 200 kg.',
   'active', 'a0000000-0000-4000-8000-00000000000a', '2026-09-10 12:00+02'),
  ('da000000-0000-4000-8000-000000000006', '0a000000-0000-4000-8000-0000000000a1', 'Julien', 'Dubois',
   'julien.dubois@example.test', 'email', 'beginner',
   'Pas de pratique régulière depuis 10 ans ; veut retrouver de la forme.',
   '{home,outdoor}', 'Tapis de sol, deux haltères de 8 kg, élastiques.',
   'paused', 'a0000000-0000-4000-8000-00000000000a', '2026-09-05 08:45+02'),
  -- Premier contact : le coach ne connaît encore que le prénom (nom, e-mail et profil à compléter).
  ('da000000-0000-4000-8000-000000000007', '0a000000-0000-4000-8000-0000000000a1', 'Manon', null,
   null, null, null, null, '{}', null,
   'active', 'a0000000-0000-4000-8000-00000000000a', '2026-10-20 17:00+02'),
  ('da000000-0000-4000-8000-000000000008', '0a000000-0000-4000-8000-0000000000a1', 'Kevin', 'Mertens',
   'kevin.mertens@example.test', 'email', 'intermediate', 'Trail et course sur route.',
   '{outdoor}', null,
   'archived', 'a0000000-0000-4000-8000-00000000000a', '2026-06-03 11:00+02'),
  -- Organisation B : invisibles pour le coach A (isolation entre coachs).
  ('db000000-0000-4000-8000-000000000001', '0b000000-0000-4000-8000-0000000000b1', 'Sarah', 'Vermeulen',
   'sarah.vermeulen@example.test', 'email', 'intermediate', 'Running depuis 2 ans.',
   '{outdoor}', null,
   'active', 'b0000000-0000-4000-8000-00000000000b', '2026-09-12 10:00+02'),
  ('db000000-0000-4000-8000-000000000002', '0b000000-0000-4000-8000-0000000000b1', 'Hugo', 'Lefèvre',
   'hugo.lefevre@example.test', 'whatsapp', 'beginner', 'Débute la musculation.',
   '{gym}', null,
   'active', 'b0000000-0000-4000-8000-00000000000b', '2026-09-18 10:00+02');

-- Thomas a accepté son invitation (compte activé) ; Inès a une invitation en attente.
-- Les jetons de démo ne sont connus de personne : seules leurs empreintes sont stockées, comme en vrai.
update public.athlete_profiles
  set athlete_user_id = 'e0000000-0000-4000-8000-00000000000e'
  where id = 'da000000-0000-4000-8000-000000000002';

insert into public.athlete_invites (
  organization_id, athlete_id, token_hash, status, expires_at, created_by, created_at,
  accepted_at, accepted_by, adult_confirmed_at
)
values
  ('0a000000-0000-4000-8000-0000000000a1', 'da000000-0000-4000-8000-000000000002',
   encode(extensions.digest('seed-invitation-thomas', 'sha256'), 'hex'), 'accepted', '2026-09-09 18:30+02',
   'a0000000-0000-4000-8000-00000000000a', '2026-09-02 18:30+02',
   '2026-09-03 07:50+02', 'e0000000-0000-4000-8000-00000000000e', '2026-09-03 07:50+02'),
  ('0a000000-0000-4000-8000-0000000000a1', 'da000000-0000-4000-8000-000000000003',
   encode(extensions.digest('seed-invitation-ines', 'sha256'), 'hex'), 'pending', now() + interval '6 days',
   'a0000000-0000-4000-8000-00000000000a', now() - interval '1 day',
   null, null, null);

-- Repères datés (P2-03). Thomas : un 5 km plus ancien (historique), puis un test de Cooper à 2 900 m
-- (VMA 14,5 km/h) et les allures de la table par défaut, comme le produit le calculateur.
insert into public.athlete_reference_metrics (
  organization_id, athlete_id, kind, pace_min_sec_per_km, pace_max_sec_per_km, bpm,
  exercise_label, load_kg, reps, source, measured_on, coach_note, created_by
)
values
  ('0a000000-0000-4000-8000-0000000000a1', 'da000000-0000-4000-8000-000000000002', 'pace_5k', 270, 270, null,
   null, null, null, 'observed', '2026-06-15', 'Course de quartier : 5 km en 22:30.', 'a0000000-0000-4000-8000-00000000000a'),
  ('0a000000-0000-4000-8000-0000000000a1', 'da000000-0000-4000-8000-000000000002', 'pace_vma', 248, 248, null,
   null, null, null, 'test', '2026-10-06', 'Test de Cooper : 2900 m en 12 min · VMA ≈ 14,5 km/h · table par défaut', 'a0000000-0000-4000-8000-00000000000a'),
  ('0a000000-0000-4000-8000-0000000000a1', 'da000000-0000-4000-8000-000000000002', 'pace_easy', 331, 382, null,
   null, null, null, 'test', '2026-10-06', 'Test de Cooper : 2900 m en 12 min · VMA ≈ 14,5 km/h · table par défaut', 'a0000000-0000-4000-8000-00000000000a'),
  ('0a000000-0000-4000-8000-0000000000a1', 'da000000-0000-4000-8000-000000000002', 'pace_marathon', 310, 310, null,
   null, null, null, 'test', '2026-10-06', 'Test de Cooper : 2900 m en 12 min · VMA ≈ 14,5 km/h · table par défaut', 'a0000000-0000-4000-8000-00000000000a'),
  ('0a000000-0000-4000-8000-0000000000a1', 'da000000-0000-4000-8000-000000000002', 'pace_half', 292, 292, null,
   null, null, null, 'test', '2026-10-06', 'Test de Cooper : 2900 m en 12 min · VMA ≈ 14,5 km/h · table par défaut', 'a0000000-0000-4000-8000-00000000000a'),
  ('0a000000-0000-4000-8000-0000000000a1', 'da000000-0000-4000-8000-000000000002', 'pace_threshold', 292, 292, null,
   null, null, null, 'test', '2026-10-06', 'Test de Cooper : 2900 m en 12 min · VMA ≈ 14,5 km/h · table par défaut', 'a0000000-0000-4000-8000-00000000000a'),
  ('0a000000-0000-4000-8000-0000000000a1', 'da000000-0000-4000-8000-000000000002', 'pace_10k', 276, 276, null,
   null, null, null, 'test', '2026-10-06', 'Test de Cooper : 2900 m en 12 min · VMA ≈ 14,5 km/h · table par défaut', 'a0000000-0000-4000-8000-00000000000a'),
  ('0a000000-0000-4000-8000-0000000000a1', 'da000000-0000-4000-8000-000000000002', 'pace_5k', 261, 261, null,
   null, null, null, 'test', '2026-10-06', 'Test de Cooper : 2900 m en 12 min · VMA ≈ 14,5 km/h · table par défaut', 'a0000000-0000-4000-8000-00000000000a'),
  ('0a000000-0000-4000-8000-0000000000a1', 'da000000-0000-4000-8000-000000000002', 'hr_max', null, null, 192,
   null, null, null, 'observed', '2026-10-06', 'Relevée en fin de test de Cooper.', 'a0000000-0000-4000-8000-00000000000a'),
  -- Inès (Hyrox) : allure de course entre les stations et charges de référence.
  ('0a000000-0000-4000-8000-0000000000a1', 'da000000-0000-4000-8000-000000000003', 'pace_race', 290, 305, null,
   null, null, null, 'coach_estimate', '2026-10-01', 'Allure de course entre les stations Hyrox.', 'a0000000-0000-4000-8000-00000000000a'),
  ('0a000000-0000-4000-8000-0000000000a1', 'da000000-0000-4000-8000-000000000003', 'strength_load', null, null, null,
   'Wall ball', 6, 25, 'test', '2026-10-01', '25 répétitions sans pause.', 'a0000000-0000-4000-8000-00000000000a'),
  -- Nadia (force athlétique) : maximums du dernier test.
  ('0a000000-0000-4000-8000-0000000000a1', 'da000000-0000-4000-8000-000000000005', 'strength_load', null, null, null,
   'Squat', 110, 1, 'test', '2026-09-27', null, 'a0000000-0000-4000-8000-00000000000a'),
  ('0a000000-0000-4000-8000-0000000000a1', 'da000000-0000-4000-8000-000000000005', 'strength_load', null, null, null,
   'Soulevé de terre', 140, 1, 'test', '2026-09-27', null, 'a0000000-0000-4000-8000-00000000000a'),
  ('0a000000-0000-4000-8000-0000000000a1', 'da000000-0000-4000-8000-000000000005', 'strength_load', null, null, null,
   'Développé couché', 62.5, 1, 'test', '2026-09-27', null, 'a0000000-0000-4000-8000-00000000000a'),
  -- Lucas (hybride) : une charge de travail et une allure d'endurance estimée par le coach.
  ('0a000000-0000-4000-8000-0000000000a1', 'da000000-0000-4000-8000-000000000004', 'strength_load', null, null, null,
   'Développé couché', 80, 5, 'observed', '2026-10-12', null, 'a0000000-0000-4000-8000-00000000000a'),
  ('0a000000-0000-4000-8000-0000000000a1', 'da000000-0000-4000-8000-000000000004', 'pace_easy', 360, 400, null,
   null, null, null, 'coach_estimate', '2026-10-12', 'À confirmer par un test de 5 km.', 'a0000000-0000-4000-8000-00000000000a');

-- Objectifs et compétitions (P2-02 partie 2), inventés eux aussi. Un objectif principal au plus par sportif ;
-- les objectifs clos (atteint, abandonné) restent comme historique.
insert into public.athlete_goals (
  organization_id, athlete_id, goal_type, priority, status, target_date,
  competition_name, competition_location, hyrox_category, description, created_by
)
values
  -- Thomas : un semi en objectif principal, un 10 km de préparation avant.
  ('0a000000-0000-4000-8000-0000000000a1', 'da000000-0000-4000-8000-000000000002', 'run_half', 'main', 'active',
   '2027-04-11', 'Semi-marathon de printemps', 'Bruxelles', null, 'Finir sous 1 h 45.',
   'a0000000-0000-4000-8000-00000000000a'),
  ('0a000000-0000-4000-8000-0000000000a1', 'da000000-0000-4000-8000-000000000002', 'run_10k', 'secondary', 'active',
   '2027-02-14', '10 km de préparation', 'Bruxelles', null, 'Course de préparation, à l''allure du semi.',
   'a0000000-0000-4000-8000-00000000000a'),
  -- Inès : passer en catégorie Pro ; son premier Hyrox (Open) est dans l'historique.
  ('0a000000-0000-4000-8000-0000000000a1', 'da000000-0000-4000-8000-000000000003', 'hyrox', 'main', 'active',
   '2027-03-20', 'Hyrox Bruxelles', 'Bruxelles', 'pro', 'Passer de la catégorie Open à Pro.',
   'a0000000-0000-4000-8000-00000000000a'),
  ('0a000000-0000-4000-8000-0000000000a1', 'da000000-0000-4000-8000-000000000003', 'hyrox', 'main', 'achieved',
   '2026-05-09', 'Hyrox Anvers', 'Anvers', 'open', 'Premier Hyrox terminé en 1 h 28.',
   'a0000000-0000-4000-8000-00000000000a'),
  -- Sophie : remise en forme, sans compétition.
  ('0a000000-0000-4000-8000-0000000000a1', 'da000000-0000-4000-8000-000000000001', 'fitness', 'main', 'active',
   '2027-01-31', null, null, null, 'Tenir 45 min de cardio sans pause et reprendre confiance en salle.',
   'a0000000-0000-4000-8000-00000000000a'),
  -- Lucas : un premier Hyrox en Doubles, et de la masse musculaire sans date.
  ('0a000000-0000-4000-8000-0000000000a1', 'da000000-0000-4000-8000-000000000004', 'hyrox', 'main', 'active',
   '2027-05-15', 'Premier Hyrox', null, 'doubles', 'En duo avec un ami de la salle.',
   'a0000000-0000-4000-8000-00000000000a'),
  ('0a000000-0000-4000-8000-0000000000a1', 'da000000-0000-4000-8000-000000000004', 'body_composition', 'secondary', 'active',
   null, null, null, null, 'Prendre de la masse musculaire en gardant le cardio.',
   'a0000000-0000-4000-8000-00000000000a'),
  -- Nadia : une compétition de force.
  ('0a000000-0000-4000-8000-0000000000a1', 'da000000-0000-4000-8000-000000000005', 'strength', 'main', 'active',
   '2027-02-06', 'Championnat régional de force athlétique', 'Liège', null,
   'Total visé : 330 kg (squat, développé couché, soulevé de terre).', 'a0000000-0000-4000-8000-00000000000a'),
  -- Julien (en pause) : reprendre, sans date.
  ('0a000000-0000-4000-8000-0000000000a1', 'da000000-0000-4000-8000-000000000006', 'fitness', 'main', 'active',
   null, null, null, null, 'Reprendre une activité physique régulière.', 'a0000000-0000-4000-8000-00000000000a'),
  -- Kevin (archivé) : un trail abandonné à l'arrêt du suivi.
  ('0a000000-0000-4000-8000-0000000000a1', 'da000000-0000-4000-8000-000000000008', 'run_other', 'main', 'dropped',
   '2026-09-20', 'Trail d''automne', 'Spa', null, 'Arrêt du suivi (déménagement).',
   'a0000000-0000-4000-8000-00000000000a'),
  -- Organisation B.
  ('0b000000-0000-4000-8000-0000000000b1', 'db000000-0000-4000-8000-000000000001', 'run_10k', 'main', 'active',
   '2027-03-01', null, null, null, 'Courir 10 km en moins de 55 min.', 'b0000000-0000-4000-8000-00000000000b');
