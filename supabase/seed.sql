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
--   ines.benali@example.test, nadia.elamrani@example.test -> sportives de « Organisation Démo A » (comptes
--                               activés, comme Thomas : on leur écrit depuis la liste et les Messages)
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
   '{"provider":"email","providers":["email"]}', '{"display_name":"Thomas Peeters"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', 'e0000000-0000-4000-8000-0000000000e3', 'authenticated', 'authenticated',
   'ines.benali@example.test', extensions.crypt('demo-coach-local', extensions.gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}', '{"display_name":"Inès Benali"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', 'e0000000-0000-4000-8000-0000000000e5', 'authenticated', 'authenticated',
   'nadia.elamrani@example.test', extensions.crypt('demo-coach-local', extensions.gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}', '{"display_name":"Nadia El Amrani"}', now(), now(), '', '', '', '');

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
   'email', now(), now(), now()),
  (gen_random_uuid(), 'e0000000-0000-4000-8000-0000000000e3', 'e0000000-0000-4000-8000-0000000000e3',
   '{"sub":"e0000000-0000-4000-8000-0000000000e3","email":"ines.benali@example.test","email_verified":true}',
   'email', now(), now(), now()),
  (gen_random_uuid(), 'e0000000-0000-4000-8000-0000000000e5', 'e0000000-0000-4000-8000-0000000000e5',
   '{"sub":"e0000000-0000-4000-8000-0000000000e5","email":"nadia.elamrani@example.test","email_verified":true}',
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

-- Thomas, Inès et Nadia ont accepté leur invitation (comptes activés : ce sont elles et lui qui écrivent
-- dans les Messages) ; Lucas a une invitation en attente.
-- Les jetons de démo ne sont connus de personne : seules leurs empreintes sont stockées, comme en vrai.
update public.athlete_profiles as p
  set athlete_user_id = v.user_id
  from (values
    ('da000000-0000-4000-8000-000000000002'::uuid, 'e0000000-0000-4000-8000-00000000000e'::uuid),
    ('da000000-0000-4000-8000-000000000003'::uuid, 'e0000000-0000-4000-8000-0000000000e3'::uuid),
    ('da000000-0000-4000-8000-000000000005'::uuid, 'e0000000-0000-4000-8000-0000000000e5'::uuid)
  ) as v (id, user_id)
  where p.id = v.id;

-- Type de programme (D-40), indépendant des objectifs : Lucas prépare un Hyrox mais suit un programme
-- hybride. Manon reste sans type (fiche créée d'un simple nom) pour montrer le cas « à choisir ».
update public.athlete_profiles as p
  set program_type = v.program_type
  from (values
    ('da000000-0000-4000-8000-000000000001'::uuid, 'strength'),
    ('da000000-0000-4000-8000-000000000002'::uuid, 'running'),
    ('da000000-0000-4000-8000-000000000003'::uuid, 'hyrox'),
    ('da000000-0000-4000-8000-000000000004'::uuid, 'hybrid'),
    ('da000000-0000-4000-8000-000000000005'::uuid, 'strength'),
    ('da000000-0000-4000-8000-000000000006'::uuid, 'strength'),
    ('da000000-0000-4000-8000-000000000008'::uuid, 'running'),
    ('db000000-0000-4000-8000-000000000001'::uuid, 'running'),
    ('db000000-0000-4000-8000-000000000002'::uuid, 'strength')
  ) as v (id, program_type)
  where p.id = v.id;

-- Sexe déclaré (D-25). Manon reste non renseignée pour montrer le cas « facultatif ».
update public.athlete_profiles as p
  set sex = v.sex
  from (values
    ('da000000-0000-4000-8000-000000000001'::uuid, 'female'),
    ('da000000-0000-4000-8000-000000000002'::uuid, 'male'),
    ('da000000-0000-4000-8000-000000000003'::uuid, 'female'),
    ('da000000-0000-4000-8000-000000000004'::uuid, 'male'),
    ('da000000-0000-4000-8000-000000000005'::uuid, 'female'),
    ('da000000-0000-4000-8000-000000000006'::uuid, 'male'),
    ('da000000-0000-4000-8000-000000000008'::uuid, 'male'),
    ('db000000-0000-4000-8000-000000000001'::uuid, 'female'),
    ('db000000-0000-4000-8000-000000000002'::uuid, 'male')
  ) as v (id, sex)
  where p.id = v.id;

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
   encode(extensions.digest('seed-invitation-ines', 'sha256'), 'hex'), 'accepted', '2026-09-22 09:15+02',
   'a0000000-0000-4000-8000-00000000000a', '2026-09-15 09:15+02',
   '2026-09-16 08:40+02', 'e0000000-0000-4000-8000-0000000000e3', '2026-09-16 08:40+02'),
  ('0a000000-0000-4000-8000-0000000000a1', 'da000000-0000-4000-8000-000000000005',
   encode(extensions.digest('seed-invitation-nadia', 'sha256'), 'hex'), 'accepted', '2026-09-17 12:00+02',
   'a0000000-0000-4000-8000-00000000000a', '2026-09-10 12:00+02',
   '2026-09-11 19:20+02', 'e0000000-0000-4000-8000-0000000000e5', '2026-09-11 19:20+02'),
  ('0a000000-0000-4000-8000-0000000000a1', 'da000000-0000-4000-8000-000000000004',
   encode(extensions.digest('seed-invitation-lucas', 'sha256'), 'hex'), 'pending', now() + interval '6 days',
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
   null, null, null, 'coach_estimate', '2026-10-12', 'À confirmer par un test de 5 km.', 'a0000000-0000-4000-8000-00000000000a'),
  -- Mesures plus anciennes (P2-04 étape 3) : de quoi tracer une évolution réaliste sur la fiche.
  -- Thomas : deux tests de Cooper avant celui d'octobre (VMA 13,6 puis 14,0 km/h).
  ('0a000000-0000-4000-8000-0000000000a1', 'da000000-0000-4000-8000-000000000002', 'pace_vma', 265, 265, null,
   null, null, null, 'test', '2026-04-14', 'Test de Cooper : 2720 m en 12 min.', 'a0000000-0000-4000-8000-00000000000a'),
  ('0a000000-0000-4000-8000-0000000000a1', 'da000000-0000-4000-8000-000000000002', 'pace_vma', 257, 257, null,
   null, null, null, 'test', '2026-07-10', 'Test de Cooper : 2800 m en 12 min.', 'a0000000-0000-4000-8000-00000000000a'),
  -- Inès : race pace estimée avant ses deux derniers blocs Hyrox.
  ('0a000000-0000-4000-8000-0000000000a1', 'da000000-0000-4000-8000-000000000003', 'pace_race', 305, 320, null,
   null, null, null, 'coach_estimate', '2026-06-02', null, 'a0000000-0000-4000-8000-00000000000a'),
  ('0a000000-0000-4000-8000-0000000000a1', 'da000000-0000-4000-8000-000000000003', 'pace_race', 298, 312, null,
   null, null, null, 'observed', '2026-08-11', 'Simulation Hyrox complète.', 'a0000000-0000-4000-8000-00000000000a'),
  -- Nadia : maximums des deux tests précédents.
  ('0a000000-0000-4000-8000-0000000000a1', 'da000000-0000-4000-8000-000000000005', 'strength_load', null, null, null,
   'Squat', 100, 1, 'test', '2026-06-20', null, 'a0000000-0000-4000-8000-00000000000a'),
  ('0a000000-0000-4000-8000-0000000000a1', 'da000000-0000-4000-8000-000000000005', 'strength_load', null, null, null,
   'Squat', 105, 1, 'test', '2026-08-15', null, 'a0000000-0000-4000-8000-00000000000a'),
  ('0a000000-0000-4000-8000-0000000000a1', 'da000000-0000-4000-8000-000000000005', 'strength_load', null, null, null,
   'Soulevé de terre', 130, 1, 'test', '2026-06-20', null, 'a0000000-0000-4000-8000-00000000000a');

-- Records personnels (P2-02 partie 4) : performances inventées, cohérentes avec les fiches.
-- Le record d'une épreuve est calculé (meilleur temps) ; les anciennes performances restent.
insert into public.athlete_personal_records (
  organization_id, athlete_id, event, hyrox_category, time_seconds, achieved_on, race_name, created_by
)
values
  -- Thomas (running) : 5 km de juin (le même que son repère), 10 km et semi plus anciens.
  ('0a000000-0000-4000-8000-0000000000a1', 'da000000-0000-4000-8000-000000000002', 'run_5k', null, 1350,
   '2026-06-15', 'Course de quartier', 'a0000000-0000-4000-8000-00000000000a'),
  ('0a000000-0000-4000-8000-0000000000a1', 'da000000-0000-4000-8000-000000000002', 'run_10k', null, 2830,
   '2026-03-08', '10 km de printemps', 'a0000000-0000-4000-8000-00000000000a'),
  ('0a000000-0000-4000-8000-0000000000a1', 'da000000-0000-4000-8000-000000000002', 'run_half', null, 6290,
   '2025-10-19', null, 'a0000000-0000-4000-8000-00000000000a'),
  -- Inès (Hyrox) : ses deux Hyrox en Open (Anvers = son objectif atteint ; le second est le record) et un 5 km.
  ('0a000000-0000-4000-8000-0000000000a1', 'da000000-0000-4000-8000-000000000003', 'hyrox', 'open', 5280,
   '2026-05-09', 'Hyrox Anvers', 'a0000000-0000-4000-8000-00000000000a'),
  ('0a000000-0000-4000-8000-0000000000a1', 'da000000-0000-4000-8000-000000000003', 'hyrox', 'open', 4890,
   '2026-09-26', 'Hyrox Rotterdam', 'a0000000-0000-4000-8000-00000000000a'),
  ('0a000000-0000-4000-8000-0000000000a1', 'da000000-0000-4000-8000-000000000003', 'run_5k', null, 1395,
   '2026-05-03', null, 'a0000000-0000-4000-8000-00000000000a'),
  -- Lucas (hybride, pas encore de Hyrox) : un 10 km.
  ('0a000000-0000-4000-8000-0000000000a1', 'da000000-0000-4000-8000-000000000004', 'run_10k', null, 3160,
   '2026-03-08', '10 km de printemps', 'a0000000-0000-4000-8000-00000000000a');

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
  ('0a000000-0000-4000-8000-0000000000a1', 'da000000-0000-4000-8000-000000000002', 'run_other', 'secondary', 'active',
   '2026-12-20', 'Corrida de Noël', 'Bruxelles', null, 'Pour le plaisir, sans objectif de temps.',
   'a0000000-0000-4000-8000-00000000000a'),
  -- Inès : passer en catégorie Pro ; son premier Hyrox (Open) est dans l'historique.
  ('0a000000-0000-4000-8000-0000000000a1', 'da000000-0000-4000-8000-000000000003', 'hyrox', 'main', 'active',
   '2027-03-20', 'Hyrox Bruxelles', 'Bruxelles', 'pro', 'Passer de la catégorie Open à Pro.',
   'a0000000-0000-4000-8000-00000000000a'),
  ('0a000000-0000-4000-8000-0000000000a1', 'da000000-0000-4000-8000-000000000003', 'hyrox', 'main', 'achieved',
   '2026-05-09', 'Hyrox Anvers', 'Anvers', 'open', 'Premier Hyrox terminé en 1 h 28.',
   'a0000000-0000-4000-8000-00000000000a'),
  ('0a000000-0000-4000-8000-0000000000a1', 'da000000-0000-4000-8000-000000000003', 'hyrox', 'secondary', 'active',
   '2026-12-12', 'Hyrox Gent', 'Gand', 'open', 'Dernier test en Open avant Bruxelles.',
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

-- Disponibilités et contraintes (P2-02 partie 3), inventées.
update public.athlete_profiles as p
set sessions_per_week = d.sessions, available_days = d.days, max_session_minutes = d.minutes,
    schedule_constraints = d.note
from (values
  ('da000000-0000-4000-8000-000000000001'::uuid, 2, '{tue,thu}'::text[], 60, 'Après le travail, entre 18 h et 20 h.'),
  ('da000000-0000-4000-8000-000000000002'::uuid, 4, '{tue,thu,sat,sun}'::text[], 75,
   'Sortie longue le dimanche matin ; déplacements professionnels un mercredi sur deux.'),
  ('da000000-0000-4000-8000-000000000003'::uuid, 5, '{mon,tue,thu,fri,sat}'::text[], 90,
   'Box ouverte tôt le matin ; jamais de séance le mercredi.'),
  ('da000000-0000-4000-8000-000000000004'::uuid, 4, '{mon,wed,fri,sun}'::text[], 75, null),
  ('da000000-0000-4000-8000-000000000005'::uuid, 4, '{mon,tue,thu,sat}'::text[], 120,
   'Compétitions certains samedis.'),
  ('da000000-0000-4000-8000-000000000006'::uuid, 2, '{sat,sun}'::text[], 45, 'Disponible surtout le week-end.')
) as d (id, sessions, days, minutes, note)
where p.id = d.id;

-- Contraintes physiques : seulement avec un accord. Inès a donné le sien sur un formulaire signé, noté par
-- le coach (journal + date d'accord, comme le ferait grant_health_consent). Thomas n'a pas encore donné
-- d'accord : il peut le faire depuis son espace sportif.
insert into public.athlete_consents (
  organization_id, athlete_id, action, source, coach_proof, recorded_by, recorded_at
)
values
  ('0a000000-0000-4000-8000-0000000000a1', 'da000000-0000-4000-8000-000000000003', 'granted', 'coach',
   'signed_form', 'a0000000-0000-4000-8000-00000000000a', '2026-09-16 09:30+02');

update public.athlete_profiles
  set health_consent_at = '2026-09-16 09:30+02',
      health_constraints = 'Épaule gauche sensible au-dessus de la tête (wall balls, développé militaire).'
  where id = 'da000000-0000-4000-8000-000000000003';

-- Notes du coach (P2-03 fin), inventées. Inès : une note privée. Thomas : un message visible dans son espace.
-- Pas de donnée de santé dans une note libre : elles ont leur champ, protégé par l'accord du sportif.
insert into public.athlete_notes (organization_id, athlete_id, visibility, body, created_by, updated_by, created_at, updated_at)
values
  ('0a000000-0000-4000-8000-0000000000a1', 'da000000-0000-4000-8000-000000000003', 'coach',
   'Sportive très sérieuse et investie. Bonne progression sur les séances longues. Objectif : passer en Pro.',
   'a0000000-0000-4000-8000-00000000000a', 'a0000000-0000-4000-8000-00000000000a',
   '2026-09-18 19:00+02', '2026-09-18 19:00+02'),
  ('0a000000-0000-4000-8000-0000000000a1', 'da000000-0000-4000-8000-000000000002', 'athlete',
   'Semaine de reprise : garde l''endurance vraiment facile, tu dois pouvoir parler en courant.',
   'a0000000-0000-4000-8000-00000000000a', 'a0000000-0000-4000-8000-00000000000a',
   '2026-10-06 20:00+02', '2026-10-06 20:00+02');

-- Dates réalistes pour l'historique de démo (sans cela, tout daterait du jour du reset) :
-- les mesures sont saisies le soir du jour mesuré ; les objectifs le lendemain de la création de la fiche.
update public.athlete_reference_metrics set created_at = measured_on + time '19:00';

alter table public.athlete_goals disable trigger set_updated_at;
update public.athlete_goals as g
  set created_at = p.created_at + interval '1 day',
      updated_at = case when g.status = 'active' then p.created_at + interval '1 day'
                        else greatest(g.target_date::timestamptz + interval '1 day', p.created_at + interval '1 day') end
  from public.athlete_profiles as p
  where p.id = g.athlete_id;
-- Temps visés (26/10/2026) : Thomas vise son semi en 1:44:30, Inès Hyrox Bruxelles en 1:15:00.
update public.athlete_goals set target_time_seconds = 6270
  where athlete_id = 'da000000-0000-4000-8000-000000000002' and competition_name = 'Semi-marathon de printemps';
update public.athlete_goals set target_time_seconds = 4500
  where athlete_id = 'da000000-0000-4000-8000-000000000003' and competition_name = 'Hyrox Bruxelles';
alter table public.athlete_goals enable trigger set_updated_at;

-- Séances encadrées du coach (P2-05b, D-27), inventées : deux collectives chaque semaine avec leurs
-- inscrits, un coaching individuel hebdomadaire (arrêté mi-décembre) et un test ponctuel.
insert into public.coach_sessions (
  id, organization_id, kind, title, discipline, location, athlete_id, starts_on, start_time,
  duration_minutes, repeats_weekly, ends_on, notes, created_by
)
values
  ('ca000000-0000-4000-8000-000000000001', '0a000000-0000-4000-8000-0000000000a1', 'group',
   'Piste du mercredi', 'running', 'Piste d''athlétisme', null, '2026-09-02', '19:00', 90, true, null,
   'Échauffement 20 min, fractionné, retour au calme.', 'a0000000-0000-4000-8000-00000000000a'),
  ('ca000000-0000-4000-8000-000000000002', '0a000000-0000-4000-8000-0000000000a1', 'group',
   'Circuit Hyrox du samedi', 'hyrox', 'Box Hyrox', null, '2026-09-05', '10:00', 75, true, null,
   null, 'a0000000-0000-4000-8000-00000000000a'),
  ('ca000000-0000-4000-8000-000000000003', '0a000000-0000-4000-8000-0000000000a1', 'individual',
   'Coaching force', 'strength', 'Salle de sport', 'da000000-0000-4000-8000-000000000005', '2026-09-08',
   '18:30', 60, true, '2026-12-15', 'Préparation du championnat régional.', 'a0000000-0000-4000-8000-00000000000a'),
  ('ca000000-0000-4000-8000-000000000004', '0a000000-0000-4000-8000-0000000000a1', 'individual',
   'Test VMA', 'running', 'Piste d''athlétisme', 'da000000-0000-4000-8000-000000000002', '2026-10-28',
   '08:00', 45, false, null, null, 'a0000000-0000-4000-8000-00000000000a'),
  -- Organisation B : invisible pour le coach A (tests d'isolation).
  ('cb000000-0000-4000-8000-000000000001', '0b000000-0000-4000-8000-0000000000b1', 'group',
   'Renfo du lundi', 'hybrid', 'Parc', null, '2026-09-07', '18:00', 60, true, null,
   null, 'b0000000-0000-4000-8000-00000000000b');

insert into public.coach_session_athletes (session_id, organization_id, athlete_id, created_by)
values
  ('ca000000-0000-4000-8000-000000000001', '0a000000-0000-4000-8000-0000000000a1', 'da000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-00000000000a'),
  ('ca000000-0000-4000-8000-000000000001', '0a000000-0000-4000-8000-0000000000a1', 'da000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-00000000000a'),
  ('ca000000-0000-4000-8000-000000000001', '0a000000-0000-4000-8000-0000000000a1', 'da000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-00000000000a'),
  ('ca000000-0000-4000-8000-000000000001', '0a000000-0000-4000-8000-0000000000a1', 'da000000-0000-4000-8000-000000000004', 'a0000000-0000-4000-8000-00000000000a'),
  ('ca000000-0000-4000-8000-000000000002', '0a000000-0000-4000-8000-0000000000a1', 'da000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-00000000000a'),
  ('ca000000-0000-4000-8000-000000000002', '0a000000-0000-4000-8000-0000000000a1', 'da000000-0000-4000-8000-000000000004', 'a0000000-0000-4000-8000-00000000000a'),
  ('cb000000-0000-4000-8000-000000000001', '0b000000-0000-4000-8000-0000000000b1', 'db000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-00000000000b');

-- Tâches du coach (4a, D-35), inventées : une urgente pour aujourd'hui, une normale dans trois jours.
-- Dates relatives au jour du reset, pour que la carte du tableau de bord reste parlante.
insert into public.coach_tasks (id, organization_id, title, priority, due_on, athlete_id, created_by)
values
  ('7a000000-0000-4000-8000-0000000000a1', '0a000000-0000-4000-8000-0000000000a1',
   'Finaliser le programme Hyrox de Lucas', 'high', current_date, 'da000000-0000-4000-8000-000000000004',
   'a0000000-0000-4000-8000-00000000000a'),
  ('7a000000-0000-4000-8000-0000000000a2', '0a000000-0000-4000-8000-0000000000a1',
   'Relancer Sophie pour la facture d''octobre', 'normal', current_date + 3,
   'da000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-00000000000a'),
  -- Organisation B : invisible pour le coach A (isolation).
  ('7b000000-0000-4000-8000-0000000000b1', '0b000000-0000-4000-8000-0000000000b1',
   'Préparer le renfo du lundi', 'normal', current_date + 1, null, 'b0000000-0000-4000-8000-00000000000b');

-- Messages des sportifs (4a, D-35), inventés : trois non lus pour le coach A, et une ancienne réponse du
-- coach. Inès et Nadia n'ont pas encore de compte : en vrai, seul un sportif connecté écrira (P7) ; ici,
-- c'est la démo de la carte Messages. Heures relatives au reset.
insert into public.athlete_messages (id, organization_id, athlete_id, sender, body, read_at, created_at, created_by)
values
  ('3a000000-0000-4000-8000-0000000000a1', '0a000000-0000-4000-8000-0000000000a1',
   'da000000-0000-4000-8000-000000000002', 'athlete',
   'Salut coach, je peux décaler le test VMA de mercredi à jeudi matin ?', null,
   now() - interval '25 minutes', 'e0000000-0000-4000-8000-00000000000e'),
  ('3a000000-0000-4000-8000-0000000000a2', '0a000000-0000-4000-8000-0000000000a1',
   'da000000-0000-4000-8000-000000000003', 'athlete',
   'Circuit de samedi bouclé, je suis prête pour la suite !', null, now() - interval '3 hours',
   'e0000000-0000-4000-8000-0000000000e3'),
  ('3a000000-0000-4000-8000-0000000000a3', '0a000000-0000-4000-8000-0000000000a1',
   'da000000-0000-4000-8000-000000000005', 'athlete',
   'Je confirme pour mardi 18 h 30, j''apporte ma ceinture.', null, now() - interval '26 hours',
   'e0000000-0000-4000-8000-0000000000e5'),
  ('3a000000-0000-4000-8000-0000000000a4', '0a000000-0000-4000-8000-0000000000a1',
   'da000000-0000-4000-8000-000000000005', 'coach',
   'Mardi, on fait le point sur le squat avant le championnat.', now() - interval '27 hours',
   now() - interval '2 days', 'a0000000-0000-4000-8000-00000000000a'),
  -- Organisation B.
  ('3b000000-0000-4000-8000-0000000000b1', '0b000000-0000-4000-8000-0000000000b1',
   'db000000-0000-4000-8000-000000000001', 'athlete', 'Bonjour, la séance de lundi est maintenue ?', null,
   now() - interval '1 hour', null);

-- Suivi des factures (4a, D-35 / D-17 étape A), inventé : trois factures envoyées ces deux dernières
-- semaines (450 €), deux payées (300 €), celle de Sophie en retard (150 €). Dates relatives au reset.
insert into public.athlete_invoices (
  id, organization_id, athlete_id, label, amount_cents, issued_on, due_on, paid_on, created_by
)
values
  ('fa000000-0000-4000-8000-0000000000a1', '0a000000-0000-4000-8000-0000000000a1',
   'da000000-0000-4000-8000-000000000001', 'Forfait 8 séances', 15000,
   current_date - 14, current_date - 1, null, 'a0000000-0000-4000-8000-00000000000a'),
  ('fa000000-0000-4000-8000-0000000000a2', '0a000000-0000-4000-8000-0000000000a1',
   'da000000-0000-4000-8000-000000000002', 'Suivi running mensuel', 20000,
   current_date - 12, current_date + 2, current_date - 5, 'a0000000-0000-4000-8000-00000000000a'),
  ('fa000000-0000-4000-8000-0000000000a3', '0a000000-0000-4000-8000-0000000000a1',
   'da000000-0000-4000-8000-000000000005', 'Coaching force · 2 séances', 10000,
   current_date - 8, current_date + 6, current_date - 2, 'a0000000-0000-4000-8000-00000000000a'),
  -- Organisation B : invisible pour le coach A (isolation).
  ('fb000000-0000-4000-8000-0000000000b1', '0b000000-0000-4000-8000-0000000000b1',
   'db000000-0000-4000-8000-000000000001', 'Forfait 10 km', 9000,
   current_date - 3, current_date + 11, null, 'b0000000-0000-4000-8000-00000000000b');

-- Paiements reçus (D-36), inventés : les deux factures payées (virement, espèces) et un forfait de
-- trois mois réglé hier par Inès. Montants TVA comprise (21 %), dates relatives au reset.
insert into public.athlete_payments (
  organization_id, athlete_id, received_on, amount_cents, vat_rate, method, label, created_by
)
values
  ('0a000000-0000-4000-8000-0000000000a1', 'da000000-0000-4000-8000-000000000002', current_date - 5,
   20000, 21, 'transfer', 'Suivi running mensuel', 'a0000000-0000-4000-8000-00000000000a'),
  ('0a000000-0000-4000-8000-0000000000a1', 'da000000-0000-4000-8000-000000000005', current_date - 2,
   10000, 21, 'cash', 'Coaching force · 2 séances', 'a0000000-0000-4000-8000-00000000000a'),
  ('0a000000-0000-4000-8000-0000000000a1', 'da000000-0000-4000-8000-000000000003', current_date - 1,
   150000, 21, 'bancontact', 'Forfait Hyrox 3 mois', 'a0000000-0000-4000-8000-00000000000a'),
  -- Organisation B.
  ('0b000000-0000-4000-8000-0000000000b1', 'db000000-0000-4000-8000-000000000001', current_date - 1,
   9000, 21, 'cash', 'Forfait 10 km', 'b0000000-0000-4000-8000-00000000000b');

-- Profils des coachs de démonstration (D-28) : prénoms inventés ; leurs photos (libres de droits) sont
-- chargées par scripts/seed-photos.mjs, lancé par `npm run db:reset`.
insert into public.coach_profiles (user_id, first_name, last_name, company_name) values
  ('a0000000-0000-4000-8000-00000000000a', 'Marco', 'Bianchi', 'Bianchi Performance'),
  ('b0000000-0000-4000-8000-00000000000b', 'Paul', 'Dumont', 'Dumont Coaching');

-- ---------------------------------------------------------------------
-- Programme de démo d'Inès (D-46), INVENTÉ dans l'esprit d'un tableur de coach : 12 semaines (3 mois)
-- de 5 séances numérotées (ses 5 séances par semaine souhaitées), SANS jour : elle les place quand elle
-- veut dans sa semaine. Publié en version 1.
-- ---------------------------------------------------------------------
insert into public.programs (id, organization_id, athlete_id, title, goal, start_date, weeks_count, status, created_by)
values ('f1000000-0000-4000-8000-000000000001', '0a000000-0000-4000-8000-0000000000a1', 'da000000-0000-4000-8000-000000000003', 'Prépa Hyrox Bruxelles · bloc 1', 'Hyrox Bruxelles · Pro', '2026-10-26', 12, 'published', 'a0000000-0000-4000-8000-00000000000a');
insert into public.program_publications (id, organization_id, program_id, number, snapshot_json, published_at, published_by)
values ('f2000000-0000-4000-8000-000000000001', '0a000000-0000-4000-8000-0000000000a1', 'f1000000-0000-4000-8000-000000000001', 1, '{"title": "Prépa Hyrox Bruxelles · bloc 1", "goal": "Hyrox Bruxelles · Pro", "weeks": [{"index": 1, "label": "Préparation"}, {"index": 2, "label": "Préparation"}, {"index": 3, "label": "Préparation"}, {"index": 4, "label": "Allègement"}, {"index": 5, "label": "Développement"}, {"index": 6, "label": "Développement"}, {"index": 7, "label": "Développement"}, {"index": 8, "label": "Allègement"}, {"index": 9, "label": "Spécifique"}, {"index": 10, "label": "Spécifique"}, {"index": 11, "label": "Spécifique"}, {"index": 12, "label": "Allègement"}]}'::jsonb, '2026-10-24 18:00+02', 'a0000000-0000-4000-8000-00000000000a');
update public.programs set active_publication_id = 'f2000000-0000-4000-8000-000000000001' where id = 'f1000000-0000-4000-8000-000000000001';
insert into public.publication_sessions (organization_id, publication_id, source_session_key, week_index, slot_index, session_json)
values
  ('0a000000-0000-4000-8000-0000000000a1', 'f2000000-0000-4000-8000-000000000001', 's1-1', 1, 1, '{"title": "Full Body A", "discipline": "strength", "sessionType": "Force", "durationMinutes": 60, "objective": "Force générale et gainage pour tenir les stations", "coachTips": "Garde 2 répétitions en réserve sur les séries lourdes. Épaule gauche : pas de charge au-dessus de la tête.", "steps": [{"title": "Échauffement", "badge": "10 min", "short": "10 min mobilité", "lines": ["Mobilité hanches et épaules, 2 séries légères du premier exercice"]}, {"title": "Bloc principal", "badge": "45 min", "short": "Full body A", "lines": ["A1 Back squat · 4 × 6 · repos 2:30 · RPE 7", "A2 Gainage planche · 4 × 45 s", "B1 Fentes bulgares · 3 × 8 par jambe · repos 1:30", "B2 Tirage horizontal · 3 × 10", "C1 Wall balls · 3 × 15 · 6 kg"]}, {"title": "Retour au calme", "badge": "5 min", "short": "5 min étirements", "lines": ["Étirements doux, respiration"]}]}'::jsonb),
  ('0a000000-0000-4000-8000-0000000000a1', 'f2000000-0000-4000-8000-000000000001', 's1-2', 1, 2, '{"title": "Endurance rapide", "discipline": "running", "sessionType": "Intervalles", "durationMinutes": 60, "objective": "Améliorer l''endurance à allure rapide", "coachTips": "Garde une allure régulière sur les répétitions : ce n''est pas un sprint. Si tu te sens bien, reste stable plutôt que d''accélérer.", "steps": [{"title": "Échauffement", "badge": "20 min", "short": "20 min échauffement", "lines": ["20 min @6:00 min/km, allure progressive"]}, {"title": "Bloc principal", "badge": "5 × 4 min", "short": "5 × 4 min @4:55 min/km", "lines": ["5 répétitions de 4 min à 4:55 min/km"], "repeat": {"times": 5, "lines": ["4 min @4:55 min/km", "1:45 min de récupération (trot lent)"]}}, {"title": "Retour au calme", "badge": "5 min", "short": "5 min retour au calme", "lines": ["5 min @6:35 min/km"]}]}'::jsonb),
  ('0a000000-0000-4000-8000-0000000000a1', 'f2000000-0000-4000-8000-000000000001', 's1-3', 1, 3, '{"title": "Hyrox Pace", "discipline": "hyrox", "sessionType": "Spécifique", "durationMinutes": 60, "objective": "Tenir l''allure de course Hyrox entre les stations", "coachTips": "L''allure Hyrox doit rester confortable : tu dois pouvoir enchaîner une station derrière.", "steps": [{"title": "Échauffement", "badge": "10 min", "short": "10 min échauffement", "lines": ["10 min @6:30 min/km"]}, {"title": "Bloc principal", "badge": "4 × 1 km", "short": "4 × 1 km @5:15 min/km", "repeat": {"times": 4, "lines": ["1 km @5:15 min/km", "2:30 min @6:15 min/km"]}}, {"title": "Retour au calme", "badge": "10 min", "short": "10 min retour au calme", "lines": ["10 min @6:35 min/km"]}]}'::jsonb),
  ('0a000000-0000-4000-8000-0000000000a1', 'f2000000-0000-4000-8000-000000000001', 's1-4', 1, 4, '{"title": "Hyrox Circuit", "discipline": "hyrox", "sessionType": "Circuit", "durationMinutes": 60, "objective": "Enchaîner course et stations comme le jour J", "coachTips": "Transitions rapides entre la course et la station : c''est là que se gagne le temps.", "steps": [{"title": "Échauffement", "badge": "10 min", "short": "10 min échauffement", "lines": ["Footing léger + rameur 500 m"]}, {"title": "Circuit", "badge": "3 tours", "short": "3 tours stations + course", "repeat": {"times": 3, "lines": ["Run 1 km @5:15 min/km", "SkiErg 500 m", "Sled push 25 m", "Wall balls 20 × 6 kg"]}}, {"title": "Retour au calme", "badge": "5 min", "short": "5 min retour au calme", "lines": ["Marche, étirements"]}]}'::jsonb),
  ('0a000000-0000-4000-8000-0000000000a1', 'f2000000-0000-4000-8000-000000000001', 's1-5', 1, 5, '{"title": "Easy Run", "discipline": "running", "sessionType": "Endurance", "durationMinutes": 50, "objective": "Récupération active et volume facile", "coachTips": "Allure de conversation : si tu ne peux pas parler, ralentis.", "steps": [{"title": "Course facile", "badge": "50 min", "short": "50 min en aisance @6:30 – 7:30 min/km", "lines": ["50 min @6:30 – 7:30 min/km"]}]}'::jsonb),
  ('0a000000-0000-4000-8000-0000000000a1', 'f2000000-0000-4000-8000-000000000001', 's2-1', 2, 1, '{"title": "Full Body B", "discipline": "strength", "sessionType": "Force", "durationMinutes": 60, "objective": "Force générale et gainage pour tenir les stations", "coachTips": "Garde 2 répétitions en réserve sur les séries lourdes. Épaule gauche : pas de charge au-dessus de la tête.", "steps": [{"title": "Échauffement", "badge": "10 min", "short": "10 min mobilité", "lines": ["Mobilité hanches et épaules, 2 séries légères du premier exercice"]}, {"title": "Bloc principal", "badge": "45 min", "short": "Full body B", "lines": ["A1 Soulevé de terre roumain · 4 × 6 · repos 2:30 · RPE 7", "A2 Pompes · 4 × 12", "B1 Step-up · 3 × 8 par jambe", "B2 Rowing haltère · 3 × 10 par bras", "C1 Farmer carry · 4 × 40 m"]}, {"title": "Retour au calme", "badge": "5 min", "short": "5 min étirements", "lines": ["Étirements doux, respiration"]}]}'::jsonb),
  ('0a000000-0000-4000-8000-0000000000a1', 'f2000000-0000-4000-8000-000000000001', 's2-2', 2, 2, '{"title": "Endurance rapide", "discipline": "running", "sessionType": "Intervalles", "durationMinutes": 60, "objective": "Améliorer l''endurance à allure rapide", "coachTips": "Garde une allure régulière sur les répétitions : ce n''est pas un sprint. Si tu te sens bien, reste stable plutôt que d''accélérer.", "steps": [{"title": "Échauffement", "badge": "20 min", "short": "20 min échauffement", "lines": ["20 min @6:00 min/km, allure progressive"]}, {"title": "Bloc principal", "badge": "5 × 4 min", "short": "5 × 4 min @4:55 min/km", "lines": ["5 répétitions de 4 min à 4:55 min/km"], "repeat": {"times": 5, "lines": ["4 min @4:55 min/km", "1:45 min de récupération (trot lent)"]}}, {"title": "Retour au calme", "badge": "5 min", "short": "5 min retour au calme", "lines": ["5 min @6:35 min/km"]}]}'::jsonb),
  ('0a000000-0000-4000-8000-0000000000a1', 'f2000000-0000-4000-8000-000000000001', 's2-3', 2, 3, '{"title": "Hyrox Pace", "discipline": "hyrox", "sessionType": "Spécifique", "durationMinutes": 60, "objective": "Tenir l''allure de course Hyrox entre les stations", "coachTips": "L''allure Hyrox doit rester confortable : tu dois pouvoir enchaîner une station derrière.", "steps": [{"title": "Échauffement", "badge": "10 min", "short": "10 min échauffement", "lines": ["10 min @6:30 min/km"]}, {"title": "Bloc principal", "badge": "4 × 1 km", "short": "4 × 1 km @5:15 min/km", "repeat": {"times": 4, "lines": ["1 km @5:15 min/km", "2:30 min @6:15 min/km"]}}, {"title": "Retour au calme", "badge": "10 min", "short": "10 min retour au calme", "lines": ["10 min @6:35 min/km"]}]}'::jsonb),
  ('0a000000-0000-4000-8000-0000000000a1', 'f2000000-0000-4000-8000-000000000001', 's2-4', 2, 4, '{"title": "Hyrox Circuit", "discipline": "hyrox", "sessionType": "Circuit", "durationMinutes": 60, "objective": "Enchaîner course et stations comme le jour J", "coachTips": "Transitions rapides entre la course et la station : c''est là que se gagne le temps.", "steps": [{"title": "Échauffement", "badge": "10 min", "short": "10 min échauffement", "lines": ["Footing léger + rameur 500 m"]}, {"title": "Circuit", "badge": "3 tours", "short": "3 tours stations + course", "repeat": {"times": 3, "lines": ["Run 1 km @5:15 min/km", "SkiErg 500 m", "Sled push 25 m", "Wall balls 20 × 6 kg"]}}, {"title": "Retour au calme", "badge": "5 min", "short": "5 min retour au calme", "lines": ["Marche, étirements"]}]}'::jsonb),
  ('0a000000-0000-4000-8000-0000000000a1', 'f2000000-0000-4000-8000-000000000001', 's2-5', 2, 5, '{"title": "Easy Run", "discipline": "running", "sessionType": "Endurance", "durationMinutes": 50, "objective": "Récupération active et volume facile", "coachTips": "Allure de conversation : si tu ne peux pas parler, ralentis.", "steps": [{"title": "Course facile", "badge": "50 min", "short": "50 min en aisance @6:30 – 7:30 min/km", "lines": ["50 min @6:30 – 7:30 min/km"]}]}'::jsonb),
  ('0a000000-0000-4000-8000-0000000000a1', 'f2000000-0000-4000-8000-000000000001', 's3-1', 3, 1, '{"title": "Full Body A", "discipline": "strength", "sessionType": "Force", "durationMinutes": 60, "objective": "Force générale et gainage pour tenir les stations", "coachTips": "Garde 2 répétitions en réserve sur les séries lourdes. Épaule gauche : pas de charge au-dessus de la tête.", "steps": [{"title": "Échauffement", "badge": "10 min", "short": "10 min mobilité", "lines": ["Mobilité hanches et épaules, 2 séries légères du premier exercice"]}, {"title": "Bloc principal", "badge": "45 min", "short": "Full body A", "lines": ["A1 Back squat · 4 × 6 · repos 2:30 · RPE 7", "A2 Gainage planche · 4 × 45 s", "B1 Fentes bulgares · 3 × 8 par jambe · repos 1:30", "B2 Tirage horizontal · 3 × 10", "C1 Wall balls · 3 × 15 · 6 kg"]}, {"title": "Retour au calme", "badge": "5 min", "short": "5 min étirements", "lines": ["Étirements doux, respiration"]}]}'::jsonb),
  ('0a000000-0000-4000-8000-0000000000a1', 'f2000000-0000-4000-8000-000000000001', 's3-2', 3, 2, '{"title": "Endurance rapide", "discipline": "running", "sessionType": "Intervalles", "durationMinutes": 60, "objective": "Améliorer l''endurance à allure rapide", "coachTips": "Garde une allure régulière sur les répétitions : ce n''est pas un sprint. Si tu te sens bien, reste stable plutôt que d''accélérer.", "steps": [{"title": "Échauffement", "badge": "20 min", "short": "20 min échauffement", "lines": ["20 min @6:00 min/km, allure progressive"]}, {"title": "Bloc principal", "badge": "6 × 4 min", "short": "6 × 4 min @4:50 min/km", "lines": ["6 répétitions de 4 min à 4:50 min/km"], "repeat": {"times": 6, "lines": ["4 min @4:50 min/km", "1:45 min de récupération (trot lent)"]}}, {"title": "Retour au calme", "badge": "5 min", "short": "5 min retour au calme", "lines": ["5 min @6:35 min/km"]}]}'::jsonb),
  ('0a000000-0000-4000-8000-0000000000a1', 'f2000000-0000-4000-8000-000000000001', 's3-3', 3, 3, '{"title": "Hyrox Pace", "discipline": "hyrox", "sessionType": "Spécifique", "durationMinutes": 70, "objective": "Tenir l''allure de course Hyrox entre les stations", "coachTips": "L''allure Hyrox doit rester confortable : tu dois pouvoir enchaîner une station derrière.", "steps": [{"title": "Échauffement", "badge": "10 min", "short": "10 min échauffement", "lines": ["10 min @6:30 min/km"]}, {"title": "Bloc principal", "badge": "5 × 1 km", "short": "5 × 1 km @5:15 min/km", "repeat": {"times": 5, "lines": ["1 km @5:15 min/km", "2:30 min @6:15 min/km"]}}, {"title": "Retour au calme", "badge": "10 min", "short": "10 min retour au calme", "lines": ["10 min @6:35 min/km"]}]}'::jsonb),
  ('0a000000-0000-4000-8000-0000000000a1', 'f2000000-0000-4000-8000-000000000001', 's3-4', 3, 4, '{"title": "Hyrox Circuit", "discipline": "hyrox", "sessionType": "Circuit", "durationMinutes": 60, "objective": "Enchaîner course et stations comme le jour J", "coachTips": "Transitions rapides entre la course et la station : c''est là que se gagne le temps.", "steps": [{"title": "Échauffement", "badge": "10 min", "short": "10 min échauffement", "lines": ["Footing léger + rameur 500 m"]}, {"title": "Circuit", "badge": "4 tours", "short": "4 tours stations + course", "repeat": {"times": 4, "lines": ["Run 1 km @5:15 min/km", "SkiErg 500 m", "Sled push 25 m", "Wall balls 20 × 6 kg"]}}, {"title": "Retour au calme", "badge": "5 min", "short": "5 min retour au calme", "lines": ["Marche, étirements"]}]}'::jsonb),
  ('0a000000-0000-4000-8000-0000000000a1', 'f2000000-0000-4000-8000-000000000001', 's3-5', 3, 5, '{"title": "Easy Run", "discipline": "running", "sessionType": "Endurance", "durationMinutes": 55, "objective": "Récupération active et volume facile", "coachTips": "Allure de conversation : si tu ne peux pas parler, ralentis.", "steps": [{"title": "Course facile", "badge": "55 min", "short": "55 min en aisance @6:30 – 7:30 min/km", "lines": ["55 min @6:30 – 7:30 min/km"]}]}'::jsonb),
  ('0a000000-0000-4000-8000-0000000000a1', 'f2000000-0000-4000-8000-000000000001', 's4-1', 4, 1, '{"title": "Full Body B", "discipline": "strength", "sessionType": "Force", "durationMinutes": 60, "objective": "Force générale et gainage pour tenir les stations", "coachTips": "Garde 2 répétitions en réserve sur les séries lourdes. Épaule gauche : pas de charge au-dessus de la tête.", "steps": [{"title": "Échauffement", "badge": "10 min", "short": "10 min mobilité", "lines": ["Mobilité hanches et épaules, 2 séries légères du premier exercice"]}, {"title": "Bloc principal", "badge": "45 min", "short": "Full body B", "lines": ["A1 Soulevé de terre roumain · 4 × 6 · repos 2:30 · RPE 7", "A2 Pompes · 4 × 12", "B1 Step-up · 3 × 8 par jambe", "B2 Rowing haltère · 3 × 10 par bras", "C1 Farmer carry · 4 × 40 m"]}, {"title": "Retour au calme", "badge": "5 min", "short": "5 min étirements", "lines": ["Étirements doux, respiration"]}]}'::jsonb),
  ('0a000000-0000-4000-8000-0000000000a1', 'f2000000-0000-4000-8000-000000000001', 's4-2', 4, 2, '{"title": "Endurance rapide", "discipline": "running", "sessionType": "Intervalles", "durationMinutes": 60, "objective": "Améliorer l''endurance à allure rapide", "coachTips": "Garde une allure régulière sur les répétitions : ce n''est pas un sprint. Si tu te sens bien, reste stable plutôt que d''accélérer.", "steps": [{"title": "Échauffement", "badge": "20 min", "short": "20 min échauffement", "lines": ["20 min @6:00 min/km, allure progressive"]}, {"title": "Bloc principal", "badge": "3 × 4 min", "short": "3 × 4 min @5:00 min/km", "lines": ["3 répétitions de 4 min à 5:00 min/km"], "repeat": {"times": 3, "lines": ["4 min @5:00 min/km", "1:45 min de récupération (trot lent)"]}}, {"title": "Retour au calme", "badge": "5 min", "short": "5 min retour au calme", "lines": ["5 min @6:35 min/km"]}]}'::jsonb),
  ('0a000000-0000-4000-8000-0000000000a1', 'f2000000-0000-4000-8000-000000000001', 's4-3', 4, 3, '{"title": "Hyrox Pace", "discipline": "hyrox", "sessionType": "Spécifique", "durationMinutes": 60, "objective": "Tenir l''allure de course Hyrox entre les stations", "coachTips": "L''allure Hyrox doit rester confortable : tu dois pouvoir enchaîner une station derrière.", "steps": [{"title": "Échauffement", "badge": "10 min", "short": "10 min échauffement", "lines": ["10 min @6:30 min/km"]}, {"title": "Bloc principal", "badge": "3 × 1 km", "short": "3 × 1 km @5:15 min/km", "repeat": {"times": 3, "lines": ["1 km @5:15 min/km", "2:30 min @6:15 min/km"]}}, {"title": "Retour au calme", "badge": "10 min", "short": "10 min retour au calme", "lines": ["10 min @6:35 min/km"]}]}'::jsonb),
  ('0a000000-0000-4000-8000-0000000000a1', 'f2000000-0000-4000-8000-000000000001', 's4-4', 4, 4, '{"title": "Hyrox Circuit", "discipline": "hyrox", "sessionType": "Circuit", "durationMinutes": 60, "objective": "Enchaîner course et stations comme le jour J", "coachTips": "Transitions rapides entre la course et la station : c''est là que se gagne le temps.", "steps": [{"title": "Échauffement", "badge": "10 min", "short": "10 min échauffement", "lines": ["Footing léger + rameur 500 m"]}, {"title": "Circuit", "badge": "2 tours", "short": "2 tours stations + course", "repeat": {"times": 2, "lines": ["Run 1 km @5:15 min/km", "SkiErg 500 m", "Sled push 25 m", "Wall balls 20 × 6 kg"]}}, {"title": "Retour au calme", "badge": "5 min", "short": "5 min retour au calme", "lines": ["Marche, étirements"]}]}'::jsonb),
  ('0a000000-0000-4000-8000-0000000000a1', 'f2000000-0000-4000-8000-000000000001', 's4-5', 4, 5, '{"title": "Sortie longue", "discipline": "running", "sessionType": "Endurance", "durationMinutes": 80, "objective": "Construire l''endurance de fond", "coachTips": "Reste en aisance respiratoire du début à la fin.", "steps": [{"title": "Sortie longue", "badge": "1 h 20", "short": "1 h 20 en aisance @6:30 – 7:00 min/km", "lines": ["1 h 20 @6:30 – 7:00 min/km"]}]}'::jsonb),
  ('0a000000-0000-4000-8000-0000000000a1', 'f2000000-0000-4000-8000-000000000001', 's5-1', 5, 1, '{"title": "Full Body A", "discipline": "strength", "sessionType": "Force", "durationMinutes": 60, "objective": "Force générale et gainage pour tenir les stations", "coachTips": "Garde 2 répétitions en réserve sur les séries lourdes. Épaule gauche : pas de charge au-dessus de la tête.", "steps": [{"title": "Échauffement", "badge": "10 min", "short": "10 min mobilité", "lines": ["Mobilité hanches et épaules, 2 séries légères du premier exercice"]}, {"title": "Bloc principal", "badge": "45 min", "short": "Full body A", "lines": ["A1 Back squat · 4 × 6 · repos 2:30 · RPE 7", "A2 Gainage planche · 4 × 45 s", "B1 Fentes bulgares · 3 × 8 par jambe · repos 1:30", "B2 Tirage horizontal · 3 × 10", "C1 Wall balls · 3 × 15 · 6 kg"]}, {"title": "Retour au calme", "badge": "5 min", "short": "5 min étirements", "lines": ["Étirements doux, respiration"]}]}'::jsonb),
  ('0a000000-0000-4000-8000-0000000000a1', 'f2000000-0000-4000-8000-000000000001', 's5-2', 5, 2, '{"title": "Endurance rapide", "discipline": "running", "sessionType": "Intervalles", "durationMinutes": 60, "objective": "Améliorer l''endurance à allure rapide", "coachTips": "Garde une allure régulière sur les répétitions : ce n''est pas un sprint. Si tu te sens bien, reste stable plutôt que d''accélérer.", "steps": [{"title": "Échauffement", "badge": "20 min", "short": "20 min échauffement", "lines": ["20 min @6:00 min/km, allure progressive"]}, {"title": "Bloc principal", "badge": "6 × 4 min", "short": "6 × 4 min @4:45 min/km", "lines": ["6 répétitions de 4 min à 4:45 min/km"], "repeat": {"times": 6, "lines": ["4 min @4:45 min/km", "1:45 min de récupération (trot lent)"]}}, {"title": "Retour au calme", "badge": "5 min", "short": "5 min retour au calme", "lines": ["5 min @6:35 min/km"]}]}'::jsonb),
  ('0a000000-0000-4000-8000-0000000000a1', 'f2000000-0000-4000-8000-000000000001', 's5-3', 5, 3, '{"title": "Hyrox Pace", "discipline": "hyrox", "sessionType": "Spécifique", "durationMinutes": 70, "objective": "Tenir l''allure de course Hyrox entre les stations", "coachTips": "L''allure Hyrox doit rester confortable : tu dois pouvoir enchaîner une station derrière.", "steps": [{"title": "Échauffement", "badge": "10 min", "short": "10 min échauffement", "lines": ["10 min @6:30 min/km"]}, {"title": "Bloc principal", "badge": "5 × 1 km", "short": "5 × 1 km @5:15 min/km", "repeat": {"times": 5, "lines": ["1 km @5:15 min/km", "2:30 min @6:15 min/km"]}}, {"title": "Retour au calme", "badge": "10 min", "short": "10 min retour au calme", "lines": ["10 min @6:35 min/km"]}]}'::jsonb),
  ('0a000000-0000-4000-8000-0000000000a1', 'f2000000-0000-4000-8000-000000000001', 's5-4', 5, 4, '{"title": "Hyrox Circuit", "discipline": "hyrox", "sessionType": "Circuit", "durationMinutes": 60, "objective": "Enchaîner course et stations comme le jour J", "coachTips": "Transitions rapides entre la course et la station : c''est là que se gagne le temps.", "steps": [{"title": "Échauffement", "badge": "10 min", "short": "10 min échauffement", "lines": ["Footing léger + rameur 500 m"]}, {"title": "Circuit", "badge": "4 tours", "short": "4 tours stations + course", "repeat": {"times": 4, "lines": ["Run 1 km @5:15 min/km", "SkiErg 500 m", "Sled push 25 m", "Wall balls 20 × 6 kg"]}}, {"title": "Retour au calme", "badge": "5 min", "short": "5 min retour au calme", "lines": ["Marche, étirements"]}]}'::jsonb),
  ('0a000000-0000-4000-8000-0000000000a1', 'f2000000-0000-4000-8000-000000000001', 's5-5', 5, 5, '{"title": "Easy Run", "discipline": "running", "sessionType": "Endurance", "durationMinutes": 60, "objective": "Récupération active et volume facile", "coachTips": "Allure de conversation : si tu ne peux pas parler, ralentis.", "steps": [{"title": "Course facile", "badge": "60 min", "short": "60 min en aisance @6:30 – 7:30 min/km", "lines": ["60 min @6:30 – 7:30 min/km"]}]}'::jsonb),
  ('0a000000-0000-4000-8000-0000000000a1', 'f2000000-0000-4000-8000-000000000001', 's6-1', 6, 1, '{"title": "Full Body B", "discipline": "strength", "sessionType": "Force", "durationMinutes": 60, "objective": "Force générale et gainage pour tenir les stations", "coachTips": "Garde 2 répétitions en réserve sur les séries lourdes. Épaule gauche : pas de charge au-dessus de la tête.", "steps": [{"title": "Échauffement", "badge": "10 min", "short": "10 min mobilité", "lines": ["Mobilité hanches et épaules, 2 séries légères du premier exercice"]}, {"title": "Bloc principal", "badge": "45 min", "short": "Full body B", "lines": ["A1 Soulevé de terre roumain · 4 × 6 · repos 2:30 · RPE 7", "A2 Pompes · 4 × 12", "B1 Step-up · 3 × 8 par jambe", "B2 Rowing haltère · 3 × 10 par bras", "C1 Farmer carry · 4 × 40 m"]}, {"title": "Retour au calme", "badge": "5 min", "short": "5 min étirements", "lines": ["Étirements doux, respiration"]}]}'::jsonb),
  ('0a000000-0000-4000-8000-0000000000a1', 'f2000000-0000-4000-8000-000000000001', 's6-2', 6, 2, '{"title": "Endurance rapide", "discipline": "running", "sessionType": "Intervalles", "durationMinutes": 60, "objective": "Améliorer l''endurance à allure rapide", "coachTips": "Garde une allure régulière sur les répétitions : ce n''est pas un sprint. Si tu te sens bien, reste stable plutôt que d''accélérer.", "steps": [{"title": "Échauffement", "badge": "20 min", "short": "20 min échauffement", "lines": ["20 min @6:00 min/km, allure progressive"]}, {"title": "Bloc principal", "badge": "4 × 5 min", "short": "4 × 5 min @4:45 min/km", "lines": ["4 répétitions de 5 min à 4:45 min/km"], "repeat": {"times": 4, "lines": ["5 min @4:45 min/km", "1:45 min de récupération (trot lent)"]}}, {"title": "Retour au calme", "badge": "5 min", "short": "5 min retour au calme", "lines": ["5 min @6:35 min/km"]}]}'::jsonb),
  ('0a000000-0000-4000-8000-0000000000a1', 'f2000000-0000-4000-8000-000000000001', 's6-3', 6, 3, '{"title": "Hyrox Pace", "discipline": "hyrox", "sessionType": "Spécifique", "durationMinutes": 70, "objective": "Tenir l''allure de course Hyrox entre les stations", "coachTips": "L''allure Hyrox doit rester confortable : tu dois pouvoir enchaîner une station derrière.", "steps": [{"title": "Échauffement", "badge": "10 min", "short": "10 min échauffement", "lines": ["10 min @6:30 min/km"]}, {"title": "Bloc principal", "badge": "6 × 1 km", "short": "6 × 1 km @5:15 min/km", "repeat": {"times": 6, "lines": ["1 km @5:15 min/km", "2:30 min @6:15 min/km"]}}, {"title": "Retour au calme", "badge": "10 min", "short": "10 min retour au calme", "lines": ["10 min @6:35 min/km"]}]}'::jsonb),
  ('0a000000-0000-4000-8000-0000000000a1', 'f2000000-0000-4000-8000-000000000001', 's6-4', 6, 4, '{"title": "Hyrox Circuit", "discipline": "hyrox", "sessionType": "Circuit", "durationMinutes": 60, "objective": "Enchaîner course et stations comme le jour J", "coachTips": "Transitions rapides entre la course et la station : c''est là que se gagne le temps.", "steps": [{"title": "Échauffement", "badge": "10 min", "short": "10 min échauffement", "lines": ["Footing léger + rameur 500 m"]}, {"title": "Circuit", "badge": "4 tours", "short": "4 tours stations + course", "repeat": {"times": 4, "lines": ["Run 1 km @5:15 min/km", "SkiErg 500 m", "Sled push 25 m", "Wall balls 20 × 6 kg"]}}, {"title": "Retour au calme", "badge": "5 min", "short": "5 min retour au calme", "lines": ["Marche, étirements"]}]}'::jsonb),
  ('0a000000-0000-4000-8000-0000000000a1', 'f2000000-0000-4000-8000-000000000001', 's6-5', 6, 5, '{"title": "Easy Run", "discipline": "running", "sessionType": "Endurance", "durationMinutes": 60, "objective": "Récupération active et volume facile", "coachTips": "Allure de conversation : si tu ne peux pas parler, ralentis.", "steps": [{"title": "Course facile", "badge": "60 min", "short": "60 min en aisance @6:30 – 7:30 min/km", "lines": ["60 min @6:30 – 7:30 min/km"]}]}'::jsonb),
  ('0a000000-0000-4000-8000-0000000000a1', 'f2000000-0000-4000-8000-000000000001', 's7-1', 7, 1, '{"title": "Full Body A", "discipline": "strength", "sessionType": "Force", "durationMinutes": 60, "objective": "Force générale et gainage pour tenir les stations", "coachTips": "Garde 2 répétitions en réserve sur les séries lourdes. Épaule gauche : pas de charge au-dessus de la tête.", "steps": [{"title": "Échauffement", "badge": "10 min", "short": "10 min mobilité", "lines": ["Mobilité hanches et épaules, 2 séries légères du premier exercice"]}, {"title": "Bloc principal", "badge": "45 min", "short": "Full body A", "lines": ["A1 Back squat · 4 × 6 · repos 2:30 · RPE 7", "A2 Gainage planche · 4 × 45 s", "B1 Fentes bulgares · 3 × 8 par jambe · repos 1:30", "B2 Tirage horizontal · 3 × 10", "C1 Wall balls · 3 × 15 · 6 kg"]}, {"title": "Retour au calme", "badge": "5 min", "short": "5 min étirements", "lines": ["Étirements doux, respiration"]}]}'::jsonb),
  ('0a000000-0000-4000-8000-0000000000a1', 'f2000000-0000-4000-8000-000000000001', 's7-2', 7, 2, '{"title": "Endurance rapide", "discipline": "running", "sessionType": "Intervalles", "durationMinutes": 60, "objective": "Améliorer l''endurance à allure rapide", "coachTips": "Garde une allure régulière sur les répétitions : ce n''est pas un sprint. Si tu te sens bien, reste stable plutôt que d''accélérer.", "steps": [{"title": "Échauffement", "badge": "20 min", "short": "20 min échauffement", "lines": ["20 min @6:00 min/km, allure progressive"]}, {"title": "Bloc principal", "badge": "5 × 5 min", "short": "5 × 5 min @4:40 min/km", "lines": ["5 répétitions de 5 min à 4:40 min/km"], "repeat": {"times": 5, "lines": ["5 min @4:40 min/km", "1:45 min de récupération (trot lent)"]}}, {"title": "Retour au calme", "badge": "5 min", "short": "5 min retour au calme", "lines": ["5 min @6:35 min/km"]}]}'::jsonb),
  ('0a000000-0000-4000-8000-0000000000a1', 'f2000000-0000-4000-8000-000000000001', 's7-3', 7, 3, '{"title": "Hyrox Pace", "discipline": "hyrox", "sessionType": "Spécifique", "durationMinutes": 70, "objective": "Tenir l''allure de course Hyrox entre les stations", "coachTips": "L''allure Hyrox doit rester confortable : tu dois pouvoir enchaîner une station derrière.", "steps": [{"title": "Échauffement", "badge": "10 min", "short": "10 min échauffement", "lines": ["10 min @6:30 min/km"]}, {"title": "Bloc principal", "badge": "6 × 1 km", "short": "6 × 1 km @5:15 min/km", "repeat": {"times": 6, "lines": ["1 km @5:15 min/km", "2:30 min @6:15 min/km"]}}, {"title": "Retour au calme", "badge": "10 min", "short": "10 min retour au calme", "lines": ["10 min @6:35 min/km"]}]}'::jsonb),
  ('0a000000-0000-4000-8000-0000000000a1', 'f2000000-0000-4000-8000-000000000001', 's7-4', 7, 4, '{"title": "Hyrox Circuit", "discipline": "hyrox", "sessionType": "Circuit", "durationMinutes": 60, "objective": "Enchaîner course et stations comme le jour J", "coachTips": "Transitions rapides entre la course et la station : c''est là que se gagne le temps.", "steps": [{"title": "Échauffement", "badge": "10 min", "short": "10 min échauffement", "lines": ["Footing léger + rameur 500 m"]}, {"title": "Circuit", "badge": "5 tours", "short": "5 tours stations + course", "repeat": {"times": 5, "lines": ["Run 1 km @5:15 min/km", "SkiErg 500 m", "Sled push 25 m", "Wall balls 20 × 6 kg"]}}, {"title": "Retour au calme", "badge": "5 min", "short": "5 min retour au calme", "lines": ["Marche, étirements"]}]}'::jsonb),
  ('0a000000-0000-4000-8000-0000000000a1', 'f2000000-0000-4000-8000-000000000001', 's7-5', 7, 5, '{"title": "Easy Run", "discipline": "running", "sessionType": "Endurance", "durationMinutes": 60, "objective": "Récupération active et volume facile", "coachTips": "Allure de conversation : si tu ne peux pas parler, ralentis.", "steps": [{"title": "Course facile", "badge": "60 min", "short": "60 min en aisance @6:30 – 7:30 min/km", "lines": ["60 min @6:30 – 7:30 min/km"]}]}'::jsonb),
  ('0a000000-0000-4000-8000-0000000000a1', 'f2000000-0000-4000-8000-000000000001', 's8-1', 8, 1, '{"title": "Full Body B", "discipline": "strength", "sessionType": "Force", "durationMinutes": 60, "objective": "Force générale et gainage pour tenir les stations", "coachTips": "Garde 2 répétitions en réserve sur les séries lourdes. Épaule gauche : pas de charge au-dessus de la tête.", "steps": [{"title": "Échauffement", "badge": "10 min", "short": "10 min mobilité", "lines": ["Mobilité hanches et épaules, 2 séries légères du premier exercice"]}, {"title": "Bloc principal", "badge": "45 min", "short": "Full body B", "lines": ["A1 Soulevé de terre roumain · 4 × 6 · repos 2:30 · RPE 7", "A2 Pompes · 4 × 12", "B1 Step-up · 3 × 8 par jambe", "B2 Rowing haltère · 3 × 10 par bras", "C1 Farmer carry · 4 × 40 m"]}, {"title": "Retour au calme", "badge": "5 min", "short": "5 min étirements", "lines": ["Étirements doux, respiration"]}]}'::jsonb),
  ('0a000000-0000-4000-8000-0000000000a1', 'f2000000-0000-4000-8000-000000000001', 's8-2', 8, 2, '{"title": "Endurance rapide", "discipline": "running", "sessionType": "Intervalles", "durationMinutes": 60, "objective": "Améliorer l''endurance à allure rapide", "coachTips": "Garde une allure régulière sur les répétitions : ce n''est pas un sprint. Si tu te sens bien, reste stable plutôt que d''accélérer.", "steps": [{"title": "Échauffement", "badge": "20 min", "short": "20 min échauffement", "lines": ["20 min @6:00 min/km, allure progressive"]}, {"title": "Bloc principal", "badge": "3 × 4 min", "short": "3 × 4 min @4:55 min/km", "lines": ["3 répétitions de 4 min à 4:55 min/km"], "repeat": {"times": 3, "lines": ["4 min @4:55 min/km", "1:45 min de récupération (trot lent)"]}}, {"title": "Retour au calme", "badge": "5 min", "short": "5 min retour au calme", "lines": ["5 min @6:35 min/km"]}]}'::jsonb),
  ('0a000000-0000-4000-8000-0000000000a1', 'f2000000-0000-4000-8000-000000000001', 's8-3', 8, 3, '{"title": "Hyrox Pace", "discipline": "hyrox", "sessionType": "Spécifique", "durationMinutes": 60, "objective": "Tenir l''allure de course Hyrox entre les stations", "coachTips": "L''allure Hyrox doit rester confortable : tu dois pouvoir enchaîner une station derrière.", "steps": [{"title": "Échauffement", "badge": "10 min", "short": "10 min échauffement", "lines": ["10 min @6:30 min/km"]}, {"title": "Bloc principal", "badge": "3 × 1 km", "short": "3 × 1 km @5:15 min/km", "repeat": {"times": 3, "lines": ["1 km @5:15 min/km", "2:30 min @6:15 min/km"]}}, {"title": "Retour au calme", "badge": "10 min", "short": "10 min retour au calme", "lines": ["10 min @6:35 min/km"]}]}'::jsonb),
  ('0a000000-0000-4000-8000-0000000000a1', 'f2000000-0000-4000-8000-000000000001', 's8-4', 8, 4, '{"title": "Hyrox Circuit", "discipline": "hyrox", "sessionType": "Circuit", "durationMinutes": 60, "objective": "Enchaîner course et stations comme le jour J", "coachTips": "Transitions rapides entre la course et la station : c''est là que se gagne le temps.", "steps": [{"title": "Échauffement", "badge": "10 min", "short": "10 min échauffement", "lines": ["Footing léger + rameur 500 m"]}, {"title": "Circuit", "badge": "2 tours", "short": "2 tours stations + course", "repeat": {"times": 2, "lines": ["Run 1 km @5:15 min/km", "SkiErg 500 m", "Sled push 25 m", "Wall balls 20 × 6 kg"]}}, {"title": "Retour au calme", "badge": "5 min", "short": "5 min retour au calme", "lines": ["Marche, étirements"]}]}'::jsonb),
  ('0a000000-0000-4000-8000-0000000000a1', 'f2000000-0000-4000-8000-000000000001', 's8-5', 8, 5, '{"title": "Sortie longue", "discipline": "running", "sessionType": "Endurance", "durationMinutes": 80, "objective": "Construire l''endurance de fond", "coachTips": "Reste en aisance respiratoire du début à la fin.", "steps": [{"title": "Sortie longue", "badge": "1 h 20", "short": "1 h 20 en aisance @6:30 – 7:00 min/km", "lines": ["1 h 20 @6:30 – 7:00 min/km"]}]}'::jsonb),
  ('0a000000-0000-4000-8000-0000000000a1', 'f2000000-0000-4000-8000-000000000001', 's9-1', 9, 1, '{"title": "Full Body A", "discipline": "strength", "sessionType": "Force", "durationMinutes": 60, "objective": "Force générale et gainage pour tenir les stations", "coachTips": "Garde 2 répétitions en réserve sur les séries lourdes. Épaule gauche : pas de charge au-dessus de la tête.", "steps": [{"title": "Échauffement", "badge": "10 min", "short": "10 min mobilité", "lines": ["Mobilité hanches et épaules, 2 séries légères du premier exercice"]}, {"title": "Bloc principal", "badge": "45 min", "short": "Full body A", "lines": ["A1 Back squat · 4 × 6 · repos 2:30 · RPE 7", "A2 Gainage planche · 4 × 45 s", "B1 Fentes bulgares · 3 × 8 par jambe · repos 1:30", "B2 Tirage horizontal · 3 × 10", "C1 Wall balls · 3 × 15 · 6 kg"]}, {"title": "Retour au calme", "badge": "5 min", "short": "5 min étirements", "lines": ["Étirements doux, respiration"]}]}'::jsonb),
  ('0a000000-0000-4000-8000-0000000000a1', 'f2000000-0000-4000-8000-000000000001', 's9-2', 9, 2, '{"title": "Endurance rapide", "discipline": "running", "sessionType": "Intervalles", "durationMinutes": 60, "objective": "Améliorer l''endurance à allure rapide", "coachTips": "Garde une allure régulière sur les répétitions : ce n''est pas un sprint. Si tu te sens bien, reste stable plutôt que d''accélérer.", "steps": [{"title": "Échauffement", "badge": "20 min", "short": "20 min échauffement", "lines": ["20 min @6:00 min/km, allure progressive"]}, {"title": "Bloc principal", "badge": "5 × 5 min", "short": "5 × 5 min @4:40 min/km", "lines": ["5 répétitions de 5 min à 4:40 min/km"], "repeat": {"times": 5, "lines": ["5 min @4:40 min/km", "1:45 min de récupération (trot lent)"]}}, {"title": "Retour au calme", "badge": "5 min", "short": "5 min retour au calme", "lines": ["5 min @6:35 min/km"]}]}'::jsonb),
  ('0a000000-0000-4000-8000-0000000000a1', 'f2000000-0000-4000-8000-000000000001', 's9-3', 9, 3, '{"title": "Hyrox Pace", "discipline": "hyrox", "sessionType": "Spécifique", "durationMinutes": 70, "objective": "Tenir l''allure de course Hyrox entre les stations", "coachTips": "L''allure Hyrox doit rester confortable : tu dois pouvoir enchaîner une station derrière.", "steps": [{"title": "Échauffement", "badge": "10 min", "short": "10 min échauffement", "lines": ["10 min @6:30 min/km"]}, {"title": "Bloc principal", "badge": "6 × 1 km", "short": "6 × 1 km @5:15 min/km", "repeat": {"times": 6, "lines": ["1 km @5:15 min/km", "2:30 min @6:15 min/km"]}}, {"title": "Retour au calme", "badge": "10 min", "short": "10 min retour au calme", "lines": ["10 min @6:35 min/km"]}]}'::jsonb),
  ('0a000000-0000-4000-8000-0000000000a1', 'f2000000-0000-4000-8000-000000000001', 's9-4', 9, 4, '{"title": "Hyrox Circuit", "discipline": "hyrox", "sessionType": "Circuit", "durationMinutes": 60, "objective": "Enchaîner course et stations comme le jour J", "coachTips": "Transitions rapides entre la course et la station : c''est là que se gagne le temps.", "steps": [{"title": "Échauffement", "badge": "10 min", "short": "10 min échauffement", "lines": ["Footing léger + rameur 500 m"]}, {"title": "Circuit", "badge": "5 tours", "short": "5 tours stations + course", "repeat": {"times": 5, "lines": ["Run 1 km @5:15 min/km", "SkiErg 500 m", "Sled push 25 m", "Wall balls 20 × 6 kg"]}}, {"title": "Retour au calme", "badge": "5 min", "short": "5 min retour au calme", "lines": ["Marche, étirements"]}]}'::jsonb),
  ('0a000000-0000-4000-8000-0000000000a1', 'f2000000-0000-4000-8000-000000000001', 's9-5', 9, 5, '{"title": "Easy Run", "discipline": "running", "sessionType": "Endurance", "durationMinutes": 60, "objective": "Récupération active et volume facile", "coachTips": "Allure de conversation : si tu ne peux pas parler, ralentis.", "steps": [{"title": "Course facile", "badge": "60 min", "short": "60 min en aisance @6:30 – 7:30 min/km", "lines": ["60 min @6:30 – 7:30 min/km"]}]}'::jsonb),
  ('0a000000-0000-4000-8000-0000000000a1', 'f2000000-0000-4000-8000-000000000001', 's10-1', 10, 1, '{"title": "Full Body B", "discipline": "strength", "sessionType": "Force", "durationMinutes": 60, "objective": "Force générale et gainage pour tenir les stations", "coachTips": "Garde 2 répétitions en réserve sur les séries lourdes. Épaule gauche : pas de charge au-dessus de la tête.", "steps": [{"title": "Échauffement", "badge": "10 min", "short": "10 min mobilité", "lines": ["Mobilité hanches et épaules, 2 séries légères du premier exercice"]}, {"title": "Bloc principal", "badge": "45 min", "short": "Full body B", "lines": ["A1 Soulevé de terre roumain · 4 × 6 · repos 2:30 · RPE 7", "A2 Pompes · 4 × 12", "B1 Step-up · 3 × 8 par jambe", "B2 Rowing haltère · 3 × 10 par bras", "C1 Farmer carry · 4 × 40 m"]}, {"title": "Retour au calme", "badge": "5 min", "short": "5 min étirements", "lines": ["Étirements doux, respiration"]}]}'::jsonb),
  ('0a000000-0000-4000-8000-0000000000a1', 'f2000000-0000-4000-8000-000000000001', 's10-2', 10, 2, '{"title": "Endurance rapide", "discipline": "running", "sessionType": "Intervalles", "durationMinutes": 60, "objective": "Améliorer l''endurance à allure rapide", "coachTips": "Garde une allure régulière sur les répétitions : ce n''est pas un sprint. Si tu te sens bien, reste stable plutôt que d''accélérer.", "steps": [{"title": "Échauffement", "badge": "20 min", "short": "20 min échauffement", "lines": ["20 min @6:00 min/km, allure progressive"]}, {"title": "Bloc principal", "badge": "6 × 5 min", "short": "6 × 5 min @4:35 min/km", "lines": ["6 répétitions de 5 min à 4:35 min/km"], "repeat": {"times": 6, "lines": ["5 min @4:35 min/km", "1:45 min de récupération (trot lent)"]}}, {"title": "Retour au calme", "badge": "5 min", "short": "5 min retour au calme", "lines": ["5 min @6:35 min/km"]}]}'::jsonb),
  ('0a000000-0000-4000-8000-0000000000a1', 'f2000000-0000-4000-8000-000000000001', 's10-3', 10, 3, '{"title": "Hyrox Pace", "discipline": "hyrox", "sessionType": "Spécifique", "durationMinutes": 70, "objective": "Tenir l''allure de course Hyrox entre les stations", "coachTips": "L''allure Hyrox doit rester confortable : tu dois pouvoir enchaîner une station derrière.", "steps": [{"title": "Échauffement", "badge": "10 min", "short": "10 min échauffement", "lines": ["10 min @6:30 min/km"]}, {"title": "Bloc principal", "badge": "7 × 1 km", "short": "7 × 1 km @5:15 min/km", "repeat": {"times": 7, "lines": ["1 km @5:15 min/km", "2:30 min @6:15 min/km"]}}, {"title": "Retour au calme", "badge": "10 min", "short": "10 min retour au calme", "lines": ["10 min @6:35 min/km"]}]}'::jsonb),
  ('0a000000-0000-4000-8000-0000000000a1', 'f2000000-0000-4000-8000-000000000001', 's10-4', 10, 4, '{"title": "Hyrox Circuit", "discipline": "hyrox", "sessionType": "Circuit", "durationMinutes": 60, "objective": "Enchaîner course et stations comme le jour J", "coachTips": "Transitions rapides entre la course et la station : c''est là que se gagne le temps.", "steps": [{"title": "Échauffement", "badge": "10 min", "short": "10 min échauffement", "lines": ["Footing léger + rameur 500 m"]}, {"title": "Circuit", "badge": "6 tours", "short": "6 tours stations + course", "repeat": {"times": 6, "lines": ["Run 1 km @5:15 min/km", "SkiErg 500 m", "Sled push 25 m", "Wall balls 20 × 6 kg"]}}, {"title": "Retour au calme", "badge": "5 min", "short": "5 min retour au calme", "lines": ["Marche, étirements"]}]}'::jsonb),
  ('0a000000-0000-4000-8000-0000000000a1', 'f2000000-0000-4000-8000-000000000001', 's10-5', 10, 5, '{"title": "Easy Run", "discipline": "running", "sessionType": "Endurance", "durationMinutes": 65, "objective": "Récupération active et volume facile", "coachTips": "Allure de conversation : si tu ne peux pas parler, ralentis.", "steps": [{"title": "Course facile", "badge": "65 min", "short": "65 min en aisance @6:30 – 7:30 min/km", "lines": ["65 min @6:30 – 7:30 min/km"]}]}'::jsonb),
  ('0a000000-0000-4000-8000-0000000000a1', 'f2000000-0000-4000-8000-000000000001', 's11-1', 11, 1, '{"title": "Full Body A", "discipline": "strength", "sessionType": "Force", "durationMinutes": 60, "objective": "Force générale et gainage pour tenir les stations", "coachTips": "Garde 2 répétitions en réserve sur les séries lourdes. Épaule gauche : pas de charge au-dessus de la tête.", "steps": [{"title": "Échauffement", "badge": "10 min", "short": "10 min mobilité", "lines": ["Mobilité hanches et épaules, 2 séries légères du premier exercice"]}, {"title": "Bloc principal", "badge": "45 min", "short": "Full body A", "lines": ["A1 Back squat · 4 × 6 · repos 2:30 · RPE 7", "A2 Gainage planche · 4 × 45 s", "B1 Fentes bulgares · 3 × 8 par jambe · repos 1:30", "B2 Tirage horizontal · 3 × 10", "C1 Wall balls · 3 × 15 · 6 kg"]}, {"title": "Retour au calme", "badge": "5 min", "short": "5 min étirements", "lines": ["Étirements doux, respiration"]}]}'::jsonb),
  ('0a000000-0000-4000-8000-0000000000a1', 'f2000000-0000-4000-8000-000000000001', 's11-2', 11, 2, '{"title": "Endurance rapide", "discipline": "running", "sessionType": "Intervalles", "durationMinutes": 60, "objective": "Améliorer l''endurance à allure rapide", "coachTips": "Garde une allure régulière sur les répétitions : ce n''est pas un sprint. Si tu te sens bien, reste stable plutôt que d''accélérer.", "steps": [{"title": "Échauffement", "badge": "20 min", "short": "20 min échauffement", "lines": ["20 min @6:00 min/km, allure progressive"]}, {"title": "Bloc principal", "badge": "6 × 5 min", "short": "6 × 5 min @4:35 min/km", "lines": ["6 répétitions de 5 min à 4:35 min/km"], "repeat": {"times": 6, "lines": ["5 min @4:35 min/km", "1:45 min de récupération (trot lent)"]}}, {"title": "Retour au calme", "badge": "5 min", "short": "5 min retour au calme", "lines": ["5 min @6:35 min/km"]}]}'::jsonb),
  ('0a000000-0000-4000-8000-0000000000a1', 'f2000000-0000-4000-8000-000000000001', 's11-3', 11, 3, '{"title": "Hyrox Pace", "discipline": "hyrox", "sessionType": "Spécifique", "durationMinutes": 70, "objective": "Tenir l''allure de course Hyrox entre les stations", "coachTips": "L''allure Hyrox doit rester confortable : tu dois pouvoir enchaîner une station derrière.", "steps": [{"title": "Échauffement", "badge": "10 min", "short": "10 min échauffement", "lines": ["10 min @6:30 min/km"]}, {"title": "Bloc principal", "badge": "8 × 1 km", "short": "8 × 1 km @5:15 min/km", "repeat": {"times": 8, "lines": ["1 km @5:15 min/km", "2:30 min @6:15 min/km"]}}, {"title": "Retour au calme", "badge": "10 min", "short": "10 min retour au calme", "lines": ["10 min @6:35 min/km"]}]}'::jsonb),
  ('0a000000-0000-4000-8000-0000000000a1', 'f2000000-0000-4000-8000-000000000001', 's11-4', 11, 4, '{"title": "Hyrox Circuit", "discipline": "hyrox", "sessionType": "Circuit", "durationMinutes": 60, "objective": "Enchaîner course et stations comme le jour J", "coachTips": "Transitions rapides entre la course et la station : c''est là que se gagne le temps.", "steps": [{"title": "Échauffement", "badge": "10 min", "short": "10 min échauffement", "lines": ["Footing léger + rameur 500 m"]}, {"title": "Circuit", "badge": "6 tours", "short": "6 tours stations + course", "repeat": {"times": 6, "lines": ["Run 1 km @5:15 min/km", "SkiErg 500 m", "Sled push 25 m", "Wall balls 20 × 6 kg"]}}, {"title": "Retour au calme", "badge": "5 min", "short": "5 min retour au calme", "lines": ["Marche, étirements"]}]}'::jsonb),
  ('0a000000-0000-4000-8000-0000000000a1', 'f2000000-0000-4000-8000-000000000001', 's11-5', 11, 5, '{"title": "Easy Run", "discipline": "running", "sessionType": "Endurance", "durationMinutes": 65, "objective": "Récupération active et volume facile", "coachTips": "Allure de conversation : si tu ne peux pas parler, ralentis.", "steps": [{"title": "Course facile", "badge": "65 min", "short": "65 min en aisance @6:30 – 7:30 min/km", "lines": ["65 min @6:30 – 7:30 min/km"]}]}'::jsonb),
  ('0a000000-0000-4000-8000-0000000000a1', 'f2000000-0000-4000-8000-000000000001', 's12-1', 12, 1, '{"title": "Full Body B", "discipline": "strength", "sessionType": "Force", "durationMinutes": 60, "objective": "Force générale et gainage pour tenir les stations", "coachTips": "Garde 2 répétitions en réserve sur les séries lourdes. Épaule gauche : pas de charge au-dessus de la tête.", "steps": [{"title": "Échauffement", "badge": "10 min", "short": "10 min mobilité", "lines": ["Mobilité hanches et épaules, 2 séries légères du premier exercice"]}, {"title": "Bloc principal", "badge": "45 min", "short": "Full body B", "lines": ["A1 Soulevé de terre roumain · 4 × 6 · repos 2:30 · RPE 7", "A2 Pompes · 4 × 12", "B1 Step-up · 3 × 8 par jambe", "B2 Rowing haltère · 3 × 10 par bras", "C1 Farmer carry · 4 × 40 m"]}, {"title": "Retour au calme", "badge": "5 min", "short": "5 min étirements", "lines": ["Étirements doux, respiration"]}]}'::jsonb),
  ('0a000000-0000-4000-8000-0000000000a1', 'f2000000-0000-4000-8000-000000000001', 's12-2', 12, 2, '{"title": "Endurance rapide", "discipline": "running", "sessionType": "Intervalles", "durationMinutes": 60, "objective": "Améliorer l''endurance à allure rapide", "coachTips": "Garde une allure régulière sur les répétitions : ce n''est pas un sprint. Si tu te sens bien, reste stable plutôt que d''accélérer.", "steps": [{"title": "Échauffement", "badge": "20 min", "short": "20 min échauffement", "lines": ["20 min @6:00 min/km, allure progressive"]}, {"title": "Bloc principal", "badge": "3 × 4 min", "short": "3 × 4 min @4:50 min/km", "lines": ["3 répétitions de 4 min à 4:50 min/km"], "repeat": {"times": 3, "lines": ["4 min @4:50 min/km", "1:45 min de récupération (trot lent)"]}}, {"title": "Retour au calme", "badge": "5 min", "short": "5 min retour au calme", "lines": ["5 min @6:35 min/km"]}]}'::jsonb),
  ('0a000000-0000-4000-8000-0000000000a1', 'f2000000-0000-4000-8000-000000000001', 's12-3', 12, 3, '{"title": "Hyrox Pace", "discipline": "hyrox", "sessionType": "Spécifique", "durationMinutes": 60, "objective": "Tenir l''allure de course Hyrox entre les stations", "coachTips": "L''allure Hyrox doit rester confortable : tu dois pouvoir enchaîner une station derrière.", "steps": [{"title": "Échauffement", "badge": "10 min", "short": "10 min échauffement", "lines": ["10 min @6:30 min/km"]}, {"title": "Bloc principal", "badge": "4 × 1 km", "short": "4 × 1 km @5:15 min/km", "repeat": {"times": 4, "lines": ["1 km @5:15 min/km", "2:30 min @6:15 min/km"]}}, {"title": "Retour au calme", "badge": "10 min", "short": "10 min retour au calme", "lines": ["10 min @6:35 min/km"]}]}'::jsonb),
  ('0a000000-0000-4000-8000-0000000000a1', 'f2000000-0000-4000-8000-000000000001', 's12-4', 12, 4, '{"title": "Hyrox Circuit", "discipline": "hyrox", "sessionType": "Circuit", "durationMinutes": 60, "objective": "Enchaîner course et stations comme le jour J", "coachTips": "Transitions rapides entre la course et la station : c''est là que se gagne le temps.", "steps": [{"title": "Échauffement", "badge": "10 min", "short": "10 min échauffement", "lines": ["Footing léger + rameur 500 m"]}, {"title": "Circuit", "badge": "3 tours", "short": "3 tours stations + course", "repeat": {"times": 3, "lines": ["Run 1 km @5:15 min/km", "SkiErg 500 m", "Sled push 25 m", "Wall balls 20 × 6 kg"]}}, {"title": "Retour au calme", "badge": "5 min", "short": "5 min retour au calme", "lines": ["Marche, étirements"]}]}'::jsonb),
  ('0a000000-0000-4000-8000-0000000000a1', 'f2000000-0000-4000-8000-000000000001', 's12-5', 12, 5, '{"title": "Sortie longue", "discipline": "running", "sessionType": "Endurance", "durationMinutes": 80, "objective": "Construire l''endurance de fond", "coachTips": "Reste en aisance respiratoire du début à la fin.", "steps": [{"title": "Sortie longue", "badge": "1 h 20", "short": "1 h 20 en aisance @6:30 – 7:00 min/km", "lines": ["1 h 20 @6:30 – 7:00 min/km"]}]}'::jsonb);
