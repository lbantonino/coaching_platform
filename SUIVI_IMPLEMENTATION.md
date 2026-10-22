# Journal d'implémentation — source de vérité sur l'état réel du code

**État initial du package V1.1 le 18/10/2026** : spécifications techniques et de produit actualisées ; **aucun code métier, base de données, test ou intégration de l'application n'est créé ni vérifié par ce dossier**. L’utilisateur peut déjà avoir lancé Claude Code sur son Mac : inspecter d’abord son dépôt local pour établir l’état réel. Ne jamais marquer une tâche terminée au motif qu'elle est documentée.

## Statut des phases
| Phase | État | Tests exécutés | Preuve |
|---|---|---|---|
| P0 Bootstrap | **Fait** : P0-01 à P0-06 ; design system Coory rouge + logo + thème clair (22/10) | lint, typecheck, format, build, db:reset, test (Vitest 11/11), test:e2e 27/27, captures | Sessions du 19 et 20/10/2026 ; ADR docs/adr/0001 |
| P1 Auth/organisations | **Fait** : P1-01 à P1-05 (connexion, mot de passe oublié, organisations, RLS, garde-fous coach/sportif/admin, invitation sportif) ; vérification d'e-mail sans objet tant qu'il n'y a pas d'inscription | db:test 54/54, test:e2e 27/27 (x3 stables), check, build | Sessions du 19 et 20/10/2026 |
| P2 CRM | En cours : P2-01 fait ; P2-02 parties 1 à 3 faites (identité, contact, profil sportif ; objectifs et compétitions ; disponibilités et contraintes physiques avec accord) ; P2-03 fait (repères datés + calcul des allures depuis un test) ; P2-03 fini (notes coach / visibles sportif) ; P2-04 étapes 1 et 2 faites (onglets, vue d'ensemble, notes, historique) ; records personnels, graphique des repères (P2-04 étape 3), P2-05 à faire | test 74/74, db:test 133/133, test:e2e 55/55 + 3 ignorés (après db:reset) | Sessions du 20 et 22/10/2026 |
| P3 Bibliothèque | À faire | Aucun | - |
| P4 Éditeur multi-sports | À faire | Aucun | - |
| P5 Publications/PDF | À faire | Aucun | - |
| P6 Sportif/feedback | À faire | Aucun | - |
| P7 Communication | À faire | Aucun | - |
| P8 SaaS commercial | À faire | Aucun | - |

## Dernière session
- Date : 2026-10-22
- Objectif : appliquer le nouveau design system Coory (version rouge) et le logo fournis par Antonino, avant P2-02.
- Décisions produit du 22/10 (documentation seulement, **aucun code**) : D-17 Business du coach (étapes A suivi et B factures, **sans encaissement en ligne**, placement proposé après P6 à confirmer, backlog BIZ-01 à BIZ-06), D-18 musculation seule confirmée, OPEN-17 (règles de facturation, vérification par un comptable), comparatif Athleex corrigé dans `docs/16`.

### Correctif D-22 : contraste du thème sombre
```
Date : 2026-10-22
Demande d'Antonino : « dans le thème sombre, on ne lit pas très bien, le contraste est trop faible »
Mesure (formule WCAG, script jetable) AVANT : faint 2,49:1 sur carte, muted 4,39:1 sur pastille neutre, rouge sur
  pastille « Principal » 4,48:1, bordure de carte 1,19:1, contour de champ 1,39:1
Correctif (src/styles/tokens.css + COORY_DESIGN_SYSTEM.md, thème sombre seulement) : muted #a3a3aa (7,3:1),
  faint #828289 (4,8:1), line .14 (1,5:1), line-2 .36 (3,3:1), accent-soft .11 (rouge sur pastille 4,6:1)
Non modifié : rouge #FF3347 (le logo l'utilise), thème clair. Captures avant / après comparées.
Tests : check OK, test:e2e verts, db:reset final
```

### Story P2-04b : notes du coach et historique (étape 2 sur 3, fin de P2-03)
```
Date : 2026-10-22
Story : P2-03 (notes coach vs notes visibles du sportif) + P2-04 étape 2 (historique) ; sources : docs/03 §2, D-21
Base : supabase/migrations/20261022184531_notes_coach.sql, table athlete_notes (visibility coach | athlete,
  une note de chaque sorte par sportif, texte 1–2000) ; table À PART (pas des colonnes de la fiche, que le
  sportif peut lire) ; RLS : coachs de l'organisation pour tout, le sportif lit SEULEMENT la note « athlete »
  de sa fiche ; modification limitée à body / updated_by
Code : features/notes (schemas, queries getAthleteNotes / getOwnCoachMessages, action saveNote : crée, met à jour,
  ou supprime si vide), features/activity (build.ts PUR : frise depuis création, objectifs créés / atteints /
  abandonnés, mesures, accords, invitations, activation du compte, notes ; queries.ts : 5 lectures en
  parallèle) ; fiche : onglets Notes et Historique, cartes « Notes du coach » et « Historique récent » (5 derniers,
  « Voir tout ») ; espace sportif : carte « Message de ton coach »
Rappel sous la note privée : pas de données de santé dans une note libre (champ dédié avec accord)
Seed : note privée d'Inès, message visible de Thomas ; dates réalistes des mesures et objectifs pour l'historique
Tests : Vitest 74/74 (5 nouveaux) ; pgTAP 133/133 (09_notes : 14 nouveaux, dont « le sportif ne lit jamais la note
  privée ») ; Playwright 55/55 + 3 ignorés (notes.spec : 2 tests x 2 profils) ; un test SQL restreint à son propre
  sportif (il voyait la note de démo de Thomas) ; db:reset final
Limites : note unique de chaque sorte (pas d'historique des versions) ; « Lien d'invitation créé » et non « envoyé »
  (le coach copie le lien lui-même)
Suite : étape 3 (graphique d'évolution des repères), puis records personnels et P2-05 (agenda)
```

### Story P2-04a : fiche sportif à onglets et vue d'ensemble (étape 1 sur 3)
```
Date : 2026-10-22
Story : P2-04 (profil client à onglets) ; source : maquette fournie par Antonino ; décision D-21
Choix d'Antonino : design system plutôt que copie exacte ; ne pas afficher ce qui n'existe pas ; 3 étapes
Fait :
  - en-tête en aplat : avatar, nom (Space Grotesk), statut, niveau, compte, date d'ajout, « Inviter »
  - 5 chiffres clés calculés : objectif principal, séances / semaine (souhaitées), durée max, prochaine
    compétition (« Dans N jours »), canal préféré
  - onglets (composant PageTabs du design system) dans l'adresse : ?onglet=profil|objectifs|disponibilites|
    reperes, valeur inconnue = vue d'ensemble ; fil d'Ariane « Sportifs › Nom »
  - vue d'ensemble en LECTURE : Profil du sportif, Objectif actuel (+ autres en cours), Disponibilités &
    contraintes (jours en pastilles, contraintes physiques seulement si accord), Repères & mesures (4 au plus) ;
    « Modifier » ouvre l'onglet qui contient le formulaire existant
  - barre du haut (ordinateur) : recherche de sportif tous statuts, raccourci ⌘K / Ctrl+K ; pas de cloche (P7)
Non affiché (D-21) : Créer un programme, menus Programmes / Séances / Bibliothèque, cloche, phases, photo ;
  pas encore fait : menu « ⋮ », barre latérale repliable, onglet Historique et notes (étape 2), graphique (étape 3)
Fichiers : components/ui/page-tabs.tsx, lib/format formatDay, (coach)/coach-search.tsx, layout (barre du haut),
  [athleteId]/page.tsx (onglets), athlete-header.tsx, overview.tsx
Tests : Playwright 51/51 + 3 ignorés (nouveau athlete-overview.spec : vue d'ensemble, « Modifier », recherche ;
  tests existants : ouverture de l'onglet voulu via tests/e2e/helpers.ts openAthleteTab) ; check OK ; db:reset final
Retouches validées par Antonino (22/10) : (1) plus de doublons entre chiffres clés et vue d'ensemble (tuiles
  séances / durée et ligne « canal » retirées des cartes) ; (2) sur téléphone, chiffres clés en bandeau qui
  défile horizontalement (cartes de 44 %, aimantation alignée sur la marge), onglets visibles sans défiler.
  Note roadmap : chiffres clés PROVISOIRES, à remplacer en P6 par des indicateurs de suivi.
```

### Story P2-02c : disponibilités, contraintes et accord pour les données de santé
```
Date : 2026-10-22
Story : P2-02 partie 3 ; sources : OPEN-01 tranché (D-14), docs/03 §2, RGPD art. 9 ; décision D-20 (Antonino :
  « les deux, dès maintenant » : accord par le sportif dans son espace OU noté par le coach)
Base : supabase/migrations/20261022170925_disponibilites_consentement.sql
  - athlete_profiles : sessions_per_week (1–14), available_days (lun → dim), max_session_minutes (10–300),
    schedule_constraints (≤ 500), health_constraints (≤ 300) et health_consent_at ;
    CHECK : health_constraints exige un accord en cours ; health_consent_at n'est modifiable par personne
  - athlete_consents : journal en ajout seul (accord / retrait, source sportif ou coach, preuve du coach),
    aucune écriture directe ; lecture par les coachs de l'organisation et par le sportif concerné
  - fonctions SECURITY DEFINER grant_health_consent / withdraw_health_consent : vérifient l'appelant (sportif lié
    ou coach membre), écrivent journal + fiche dans la même transaction ; le retrait efface la contrainte notée
Code : features/athletes (availabilitySchema, updateAvailability), features/consents (preuves, libellés du journal,
  erreurs, lecture, actions coach et sportif), components/ui/confirm-submit-button (confirmation avant
  effacement), form-styles checkboxChipClass (pastilles partagées) ; fiche : carte « Disponibilités & contraintes »
  (formulaire, accord, historique) ; espace sportif : carte « Tes contraintes physiques » (J'accepte / Retirer)
Seed : disponibilités de 6 sportifs ; Inès : accord noté par le coach (formulaire signé) + contrainte ;
  Thomas : sans accord (à donner depuis son espace)
Tests : Vitest 69/69 (6 nouveaux) ; pgTAP 119/119 (08 : 21 nouveaux) ; Playwright 48/48 + 2 ignorés (parcours
  coach x2 profils ; parcours sportif sur ordinateur seulement, compte de démo partagé) ; 6 anciens tests
  précisés (bouton « Enregistrer » exact, d'autres boutons « Enregistrer … » existant désormais) ; db:reset final
Limites / points à valider :
  - Le texte d'information présenté au sportif et la liste des preuves sont à faire relire (Gianluca, juriste)
  - Pas encore de politique de conservation/suppression globale (OPEN-04) ni d'export des données (P8)
  - Le parcours sportif n'est testé que sur ordinateur (compte de démo unique)
Suite : records personnels (fin d'OPEN-01) ou notes coach / notes visibles du sportif (fin de P2-03)
```

### Story P2-02b : objectifs et compétitions
```
Date : 2026-10-22
Story : P2-02 partie 2 ; sources : OPEN-01 tranché (D-14), docs/03 §2, D-18
Base : supabase/migrations/20261022164902_objectifs_sportifs.sql, table athlete_goals
  - type (10 valeurs : 5 km, 10 km, semi, marathon, autre course, Hyrox, force, composition corporelle,
    remise en forme, personnel), description, date cible, priorité (main / secondary), statut
    (active / achieved / dropped), compétition (nom, lieu), catégorie Hyrox (open, pro, doubles, relay)
  - contraintes : compétition => date ; lieu => compétition ; catégorie => objectif Hyrox ;
    index unique : un seul objectif principal EN COURS par sportif ; fiche de la même organisation (FK)
  - RLS coachs de l'organisation ; modification limitée à priority et status (corriger = supprimer et recréer)
Code : features/goals (schemas + parseGoalForm, queries listGoals, actions addGoal / setGoalStatus /
  makeGoalMain / deleteGoal, format goalCountdown), lib/format daysBetween ; fiche : carte
  « Objectifs & compétitions » (compte à rebours J-n, Atteint, Abandonné, Rendre principal, Supprimer,
  objectifs passés) et formulaire d'ajout (champs de compétition et catégorie Hyrox affichés au besoin)
Un nouvel objectif principal fait passer l'ancien en secondaire (et l'index unique le garantit en base).
Défaut corrigé (trouvé par le nouveau test) : après un envoi refusé, React remettait listes déroulantes et
  cases à cocher à leur valeur de départ ; les formulaires (objectifs ET fiche) sont maintenant reconstruits
  après chaque réponse avec la saisie renvoyée (compteur `attempt`). Test de régression ajouté (references.spec).
Seed : 11 objectifs de démo (dont un Hyrox atteint pour Inès, un trail abandonné pour Kevin)
Tests : Vitest 63/63 (9 nouveaux) ; pgTAP 98/98 (07_objectifs : 16 nouveaux) ; Playwright 45/45 + 1 ignoré
  (goals.spec x2 profils) ; db:reset final pour retirer les fiches de test
Limites / points à valider :
  - Types d'objectif, priorités (principal / secondaire) et catégories Hyrox : à faire relire par Gianluca
  - Pas de modification d'un objectif existant (supprimer puis recréer) ; pas de confirmation avant suppression
  - Le sportif ne voit pas encore ses objectifs (P6)
Suite : P2-02 partie 3 (disponibilités, contraintes, blessures avec consentement)
```

### Story P2-02a : fiche enrichie, partie 1 (identité, contact, profil sportif)
```
Date : 2026-10-22
Story : P2-02 partie 1 ; source : OPEN-01 tranché (docs/14), D-14
Base : supabase/migrations/20261022113433_fiche_identite_profil.sql
  - first_name (obligatoire, 1–80) et last_name (facultatif, 1–80) ; reprise des fiches existantes coupées au
    premier espace ; display_name devient une colonne CALCULÉE (prénom + nom), lecture seule
  - preferred_contact (email, phone, sms, whatsapp), level (beginner, intermediate, advanced, competitor),
    experience (≤ 500), training_places text[] (gym, outdoor, track, home, box ; jamais nul), equipment (≤ 500)
  - droits de modification accordés sur les nouvelles colonnes ; display_name ne s'écrit jamais
  - reprise vérifiée sur la base locale AVANT reset : 128 fiches, noms complets identiques avant/après (diff vide)
Code : features/athletes (schemas : listes fermées + libellés, optionalChoice ; queries ; actions create/update),
  invitations/queries, formulaire de création (prénom + nom), formulaire de fiche en trois parties
  (Identité, Contact, Profil sportif : listes déroulantes, pastilles à cocher pour les lieux, zones de texte)
Tests : Vitest 54/54 (7 nouveaux) ; pgTAP 82/82 (06_fiche_identite : 14 nouveaux ; 03, 04, 05 adaptés à first_name) ;
  Playwright 43/43 + 1 ignoré (nouveau test profil sportif x2 profils ; helper tests/e2e/helpers.ts
  fillAthleteName) ; db:reset puis toute la suite à nouveau verte
Correctif visuel : une pastille cochée survolée perdait son contraste (survol limité aux pastilles non cochées)
Limites / points à valider :
  - Les listes (canaux, niveaux, lieux) sont une proposition : à faire relire par Gianluca
  - Prénom composé sans trait d'union mal coupé à la reprise (« Marie Claire Durand ») : correction manuelle
  - Le matériel est un texte libre ; une liste structurée viendra si l'éditeur (P4) en a besoin
  - Le sportif ne voit ni ne modifie encore ces informations depuis son espace
Suite : P2-02 partie 2 (objectifs et compétitions)
Données de démo (demande d'Antonino, 22/10) : supabase/seed.sql contient désormais 8 sportifs INVENTÉS dans
  l'Organisation Démo A (Sophie Lambert, Thomas Peeters, Inès Benali, Lucas Janssens, Nadia El Amrani,
  Julien Dubois en pause, Manon prénom seul, Kevin Mertens archivé) et 2 dans la B ; 16 repères datés ;
  compte sportif thomas.peeters@example.test (invitation acceptée) ; invitation en attente pour Inès.
  Fiches de test effacées par db:reset. db:test 82/82, check OK, test:e2e 43/43 + 1 ignoré avec ces données,
  puis db:reset pour retirer les fiches temporaires créées par les tests.
```

### Story P0-05b : design system Coory rouge, logo aux anneaux, thème clair
```
Date : 2026-10-22
Story : P0-05 (suite) ; source : COORY_DESIGN_SYSTEM.md et COORY_LOGO.md (fournis par Antonino, à la racine)
Décision : l'accent orange #FF5A1F (PDF « Athlix ») est remplacé par le rouge signal #FF3347 ; D-16 dans 00_INDEX
Fichiers créés :
  COORY_DESIGN_SYSTEM.md, COORY_LOGO.md (spécifications, recopiées telles quelles)
  src/styles/tokens.css (jetons sombre + [data-theme="light"], valeurs exactes du §3)
  src/components/ui/coory-logo.tsx (<CooryLogo variant tone size>, useId pour les clipPath)
  src/components/ui/theme-toggle.tsx (bouton soleil/lune, useSyncExternalStore, localStorage)
  src/lib/theme.ts (clé de stockage + script anti-flash exécuté dans <head>)
  src/app/icon.svg (favicon : symbole blanc sur rouge, coins 23 %), src/app/apple-icon.png (180 px, carré plein)
  public/logo/coory-symbol-{dark,red,light}.svg (SVG du §4, pour e-mails et exports futurs)
  tests/e2e/design.spec.ts (logo annoncé « Coory », favicon, thème clair retenu après rechargement)
Fichiers supprimés : src/components/ui/logo.tsx (ancien carré « C »), src/app/favicon.ico (icône Next par défaut)
Fichiers modifiés :
  globals.css (import des jetons, @theme inline : accent-text, accent-soft, on-accent, inv, on-inv, *-soft ;
    rayons sm 7 / md 10 / card 16 / pill 20 ; text-micro 11 px ; fond de page = --bg)
  composants ui : button (variante secondary -> inverse, rayons 8/10/14, appui scale .98, iconButtonClass),
    badge (tons ok/live/warn/danger/neutral, 11 px ; danger = rouge plein texte blanc), card/StatCard (rayon 16,
    héro tout en blanc), form-styles (champs 44 px mobile / 38 px ordinateur ; erreurs en accent-text),
    filter-chips (sélection inversée), segmented (classes partagées), avatar (fond chip, 34/64 px)
  layout racine (script de thème, themeColor #0B0B0C, suppressHydrationWarning), cadres coach/accès/sportif/admin
    (nouveau logo + bouton de thème), navigation (barre 232 px, onglet actif en accent-text)
  écrans : un seul bouton rouge par vue (calculateur et « Ajouter la mesure » en inversé), cartes rayon 16,
    marges 20 px mobile / 32 × 22 px ordinateur, brand.ts sans « initial »
Commandes : npm run check ; npm run test:e2e ; captures sombre/clair × ordinateur/téléphone (script Playwright jetable)
Résultats : lint OK, typecheck OK, format OK, Vitest 47/47, test:e2e 41/41 + 1 ignoré (dont 4 nouveaux)
Limites / points à valider :
  - Texte blanc sur #FF3347 = contraste 3,6:1 : conforme pour les grands chiffres et les boutons (texte gras), pas
    pour les petits textes de la carte héro (13 et 12 px). Choix du design system, à rediscuter si besoin.
  - Pas encore de manifeste PWA ni d'icônes 192/512/1024 : à faire quand l'app deviendra installable.
  - E-mails Supabase non personnalisés (logo à ajouter quand on traduira les modèles).
  - Le thème est mémorisé par navigateur, pas par compte.
Suite : P2-02 fiche enrichie (identité et contact d'abord).
Correction demandée par Antonino (22/10) : dans l'app (barre latérale coach 32 px, en-têtes mobile, sportif et
  admin 28 px), le logo est le SYMBOLE seul (les deux anneaux), plus grand ; le mot « coory » reste sur l'accueil,
  la connexion et les autres pages d'accès. check OK, test:e2e 41/41 + 1 ignoré, captures sombre/clair vérifiées.
Ajustement final d'Antonino (22/10) : sur ORDINATEUR, le mot « coory » en 40 px (au lieu de 20) dans la barre
  latérale coach et l'en-tête sportif/admin ; sur TÉLÉPHONE (< 768 px), les deux anneaux en 28 px. 40 px dépasse les
  17–20 px conseillés par COORY_LOGO.md : choix assumé. check OK, test:e2e 41/41 + 1 ignoré, captures vérifiées.
```

### Story P0-05c : logo « C∞ry » (boucle infinie) et police Space Grotesk
```
Date : 2026-10-22
Source : nouvelles versions de COORY_LOGO.md et COORY_DESIGN_SYSTEM.md fournies par Antonino (décision D-19)
Fichiers modifiés : COORY_LOGO.md, COORY_DESIGN_SYSTEM.md (§2, §4, §10), src/components/ui/coory-logo.tsx
  (variantes wordmark / symbol / icon, tons theme / dark / red / light, plus de clipPath ni d'useId),
  src/app/layout.tsx (Space_Grotesk via next/font), globals.css (font-display), 19 titres H1/H2 et la valeur
  des StatCard en font-display, commentaires des cadres coach / sportif / admin
Icônes : src/app/icon.svg (boucle blanche sur rouge), src/app/favicon.ico (16 + 32 px, nouveau),
  src/app/apple-icon.png (180 px, boucle rouge sur graphite, carré plein) ; public/logo : coory-loop.svg,
  coory-loop-current.svg, coory-icon-dark.svg, coory-icon-red.svg (les trois coory-symbol-* supprimés)
Tailles conservées : mot 40 px sur ordinateur, boucle 28 px de haut sur téléphone, mot 24–26 px sur les pages d'accès
Résultats : check OK (Vitest 47/47), test:e2e 41/41 + 1 ignoré ; captures sombre / clair, ordinateur / téléphone
Limites : icônes PWA 192 / 512 / 1024 non générées tant qu'il n'y a pas de manifeste ; e-mails sans logo.
```

## Session du 20/10/2026
- Objectif : finir P1, dans l'ordre choisi par Antonino : P1-04 guards -> Playwright -> mot de passe oublié -> P1-05 invitation.

### Story P2-03b : calcul des allures depuis un test de Cooper ou de 5 km (OPEN-13 tranché)
```
Date : 2026-10-20
Story : P2-03 (partie b) ; amorce de DIF-04 (allures par sportif)
Décisions d'Antonino (20/10) : test de Cooper ou de 5 km ; table de % de VMA par défaut, modifiable par coach plus tard ;
  le calcul propose, le coach valide ; pas de VO2max. Décisions consignées : docs/14 (OPEN-01, OPEN-13), 00_INDEX (D-14, D-15)
Fichiers créés/modifiés :
  supabase/migrations/20261020140212_repere_vma.sql (type « pace_vma » ajouté à la contrainte)
  src/domain/training/vma.ts (vmaFromCooper = distance/200, vmaFrom5k = vitesse/95 %, parseDuration, proposePaces,
    DEFAULT_PACE_ZONES : endurance 65–75 %, marathon 80, semi et seuil 85, 10 km 90, 5 km 95)
  src/features/references/test-form.ts (lecture pure, recalcul complet côté serveur), actions.ts (addReferencesFromTest),
    schemas.ts et format.ts (VMA affichée en km/h)
  src/app/(coach)/coach/o/[orgId]/sportifs/[athleteId]/test-calculator.tsx (aperçu en direct, zones à décocher,
    formulaire remis à zéro après enregistrement), references-section.tsx
  src/app/globals.css : focus global rangé dans @layer base (un seul contour orange sur les champs, vérifié au navigateur)
  tests/unit/{vma,test-form}.test.ts (13) ; supabase/tests/database/05 (+1) ; tests/e2e/references.spec.ts (+1 x 2 profils)
Commandes exécutées et résultats :
  npm run check -> exit 0 (Vitest 47/47) ; db:test 68/68 ; test:e2e 37 passés + 1 ignoré, 3 exécutions stables
  Capture téléphone du calculateur ; mesure des styles de focus au clavier (champ : bordure #FF5A1F sans contour ;
  lien : contour orange)
Bugs/limites :
  - Pourcentages dans une constante : réglage par coach à faire (story « réglages des zones »)
  - Tempo et race pace Hyrox restent manuels ; pas d'ajustement selon le niveau
  - Approximation Cooper (distance/200) et ratio 5 km/VMA (95 %) à faire relire par Gianluca
Prochaine story : P2-02 (fiche enrichie : prénom/nom, objectifs et compétitions, disponibilités, contraintes,
  blessures avec consentement, niveau, matériel, records, canal de contact)
```

### Story P2-03a : repères datés (allures running, FC, charges de référence)
```
Date : 2026-10-20
Story : P2-03 (partie a) : repères datés ; préalable aux allures calculées par sportif (DIF-04)
Objectif et fichiers specs lus : docs/03 §2 (repères running, muscu/Hyrox), docs/05 §4, §7, §8 (RUN-01), docs/11 §2
Fichiers créés/modifiés :
  supabase/migrations/20261020133811_reperes_sportifs.sql (athlete_reference_metrics : 11 types, plage d'allure en s/km,
    bpm, charge + exercice + répétitions, source, date ; cohérence type/valeurs en CHECK ; FK composite fiche+organisation ;
    RLS membres : lecture, ajout, suppression ; AUCUNE mise à jour = historique immuable)
  supabase/tests/database/05_reperes.test.sql (12 tests)
  src/domain/training/pace.ts (premier module de domaine : parsePace, parsePaceRange, formatPace, paceToSpeedKmh ;
    « 4:5 » refusé avec explication au lieu d'être deviné)
  src/features/references/{schemas,queries,actions,format}.ts ; src/lib/format.ts (formatDate, todayIsoInBrussels)
  src/app/(coach)/coach/o/[orgId]/sportifs/[athleteId]/{references-section,add-reference-form}.tsx, page.tsx
  tests/unit/{pace,references}.test.ts (19 tests) ; tests/e2e/references.spec.ts (2 scénarios x 2 profils)
Correctif transversal : React 19 vide un formulaire d'action après CHAQUE envoi, même en erreur. Les actions de fiche
  et de repères renvoient désormais la saisie, réaffichée en cas d'erreur (vérifié par un test E2E).
Commandes exécutées et résultats :
  npm run check -> exit 0 (Vitest 34/34) ; npm run db:test -> 67/67 ; npm run test:e2e -> 35 passés + 1 ignoré, 3 exécutions
  Captures ordinateur/téléphone ; cartes « actuelles » triées par type (allures, FC, charges)
Bugs/limites :
  - Les formules d'allures et zones (OPEN-13) ne sont PAS implémentées : on stocke les repères, on ne calcule rien
  - Le sportif ne voit pas encore ses repères (P6) ; exercice en texte libre en attendant le catalogue (P3)
  - Notes coach / notes visibles sportif (reste de P2-03) : à faire
Prochaine story : P2-03b (notes coach vs notes visibles sportif) ou P2-02 (objectifs et disponibilités, OPEN-01)
```

### Story P2-01b : fiche sportif, modification, archivage, recherche et filtres
```
Date : 2026-10-20
Story : P2-01 (suite) : CRM-02 (recherche, filtres, statut, archivage) et CRM-03 partiel (fiche)
Objectif et fichiers specs lus : docs/03 §1 et §6, docs/10 (design), design system Coory
Fichiers créés/modifiés :
  src/features/athletes/schemas.ts (athleteUpdateSchema, athleteListFilterSchema) ; queries.ts (listAthletes avec
    filtre statut + recherche, getAthlete) ; actions.ts (updateAthlete : e-mail verrouillé si compte activé)
  src/components/ui/{filter-chips,segmented,avatar}.tsx (composants du design system)
  src/app/(coach)/coach/o/[orgId]/sportifs/page.tsx (recherche GET, pastilles ?statut=actifs|en-pause|archives|tous)
  src/app/(coach)/coach/o/[orgId]/sportifs/[athleteId]/{page,athlete-edit-form}.tsx (fiche, 404 si autre organisation)
  tests/unit/athletes.test.ts (4) ; supabase/tests/database/03 (+1 test positif : un coach modifie/archive son sportif)
  tests/e2e/athlete-profile.spec.ts (2 scénarios x 2 profils) ; invitation.spec.ts (e-mail verrouillé sur la fiche)
Commandes exécutées et résultats :
  npm run check -> exit 0 (Vitest 15/15) ; npm run db:test -> 55/55 ; npm run test:e2e -> 31 passés + 1 ignoré, 3 exécutions
  Captures ordinateur et téléphone de la liste filtrée et de la fiche ; nom tronqué sur téléphone corrigé (retour à la ligne)
Points de sécurité vérifiés : fiche d'un sportif de l'organisation B ouverte par le coach A via l'URL -> 404 sans fuite ;
  filtres d'URL validés par Zod (valeurs fantaisistes -> valeurs sûres) ; recherche sans construction de requête SQL
Incidents de test (corrigés) : sélecteurs ambigus (lien du nom et lien « Inviter [nom] ») ; deux tests parallèles ont
  créé un sportif à la même milliseconde (suffixe rendu aléatoire dans tous les tests)
Bugs/limites :
  - Recherche filtrée côté serveur en mémoire (quelques dizaines de sportifs) : pagination et recherche en base à prévoir
  - Champs de fiche minimaux en attente d'OPEN-01 (objectifs, disponibilités : P2-02)
Prochaine story : P2-03 (repères datés : tests, allures, charges ; préalable à DIF-04)
```

### Stories P0-04 et P0-06 : Vitest et ADR du socle
```
Date : 2026-10-20
P0-04 : vitest 5.0.5 (vitest.config.mts : alias @ et neutralisation de server-only), script test, check inclut test
  tests/unit/schemas.test.ts (validations fiche sportif, connexion, mot de passe) ;
  tests/unit/invitation-token.test.ts (format, unicité sur 1000 tirages, empreinte SHA-256 identique à pgTAP)
  Résultat : 11/11 en 0,3 s ; npm run check exit 0
P0-06 : docs/adr/0001-socle-technique.md (choix, alternatives écartées, conséquences, règle des futures ADR)
Prochaine story : P2-01b (fiche sportif : modifier, archiver, rechercher, filtrer)
```

### Story P0-05 : design system Athlix, navigation, pages d'erreur
```
Date : 2026-10-20
Story : P0-05 (shell UI responsive, pages erreur/404, design tokens)
Source : Design-system-Athlix.pdf fourni par Antonino (valeurs relevées sur le PDF rendu en haute définition ;
  couleurs de statut et filets mesurées au pixel). Nom de travail : « Athlix », centralisé dans src/config/brand.ts.
  Recherche : « Athleex » est déjà un logiciel concurrent pour coachs (Product Hunt, août 2026) ; « Athlix » est utilisé
  par d'autres produits : vérification BOIP/EUIPO et nom de domaine à faire avant toute mise en ligne.
Dépendance ajoutée (justification) : lucide-react 1.60.0 (icônes imposées par le design system, navigation)
Fichiers créés/modifiés :
  src/app/globals.css (tokens : neutres, texte, filets, accent, statuts, rayons, échelle typographique ; sombre seul)
  src/app/layout.tsx (titre « %s · Athlix », Geist + Geist Mono, couleur de thème)
  src/config/brand.ts ; src/components/ui/{button.ts,badge,card,logo,simple-shell,logout-button}.tsx, form-styles.ts
  src/app/(coach)/{layout,coach-nav}.tsx (barre latérale ordinateur, onglets en bas téléphone, liens réels seulement)
  src/app/(auth)/layout.tsx ; acces-refuse, lien-invalide, invitation déplacés dans (auth) (URL inchangées)
  src/app/(athlete)/layout.tsx, src/app/(admin)/layout.tsx, src/app/not-found.tsx, src/app/error.tsx
  Toutes les pages reprises (classes zinc provisoires -> tokens) ; tableau de bord coach avec chiffres RÉELS
  (sportifs actifs, comptes activés, invitations en attente), liste des sportifs avec badges de statut
  tests/e2e/auth.spec.ts et password-reset.spec.ts : sélecteur du nom d'organisation ciblé sur le lien
Commandes exécutées et résultats :
  npm run check -> exit 0 ; npm run build -> OK ; npm run test:e2e -> 27 passés + 1 ignoré, 2 exécutions
  Captures Playwright ordinateur (1440 px) et téléphone (Pixel 7) : accueil, connexion, tableau de bord, sportifs,
  ajout, 404 ; 3 ajustements mobiles faits après relecture (grille 2 colonnes, bouton compact, formulaire en haut)
Bugs/limites :
  - Thème clair du design system non fait (sombre uniquement)
  - Navigation : une seule organisation gérée (la première) ; choix d'organisation à prévoir si besoin
  - Exception de l'outil de contrôle design pour la police Geist (imposée par le design system), en local
  - Composants « graphiques » du design system (courbes, calendrier, éditeur) non faits : ils arriveront avec leurs écrans
Prochaine story : P0-04 (Vitest) et P0-06 (ADR du socle), puis P2-01 suite
```

### Story P1-05 : invitation sportif par lien à copier
```
Date : 2026-10-20
Story : P1-05 (+ requireAthlete de P1-04, + page /app minimale)
Décisions d'Antonino : lien à copier (pas d'envoi auto avant P7), validité 7 jours, case obligatoire « J'ai 18 ans
  ou plus » (OPEN-11 : mineurs bloqués), page /app honnête
Objectif et fichiers specs lus : docs/02 §1, §5, §7 ; docs/11 §2 (jamais de jeton en clair) ; docs/12 §2
Fichiers créés/modifiés :
  supabase/migrations/20261020081355_invitations_sportifs.sql : athlete_invites (hash SHA-256, FK composite
    fiche+organisation, une seule invitation en attente par fiche, 7 jours max, révocation seule côté client),
    private.is_linked_athlete, policies sportif (sa fiche, son organisation), get_invitation (lecture par
    empreinte), accept_invitation (atomique : validité, expiration, âge, e-mail identique, fiche non déjà liée)
  supabase/tests/database/04_invitations.test.sql (20 tests)
  src/lib/supabase/admin.ts (clé secrète, server-only, une seule procédure), src/lib/format.ts
  src/features/invitations/{token,queries,actions}.ts ; src/features/auth/{guards,session}.ts (requireAthlete,
    getAthleteLinks, aiguillage /app) ; src/proxy.ts (/app protégé)
  src/app/(coach)/coach/o/[orgId]/sportifs/[athleteId]/inviter/{page,invite-form}.tsx,
  src/app/invitation/[token]/{page,accept-form}.tsx, src/app/(athlete)/app/page.tsx, liste des sportifs (Inviter)
  tests/e2e/invitation.spec.ts (3 scénarios x 2 profils)
Commandes exécutées et résultats :
  npm run db:test -> 54/54 PASS ; npm run check -> exit 0 ; npm run build -> OK
  npm run test:e2e -> 27 passés + 1 ignoré volontairement, 3 exécutions stables
  Clé secrète recherchée dans .next/static : 0 occurrence
Scénarios E2E : coach crée la fiche, génère le lien, « Copier » vérifié dans le presse-papiers ; sportif dans un autre
  navigateur : case 18 ans obligatoire, création d'accès, arrivée /app, refus /coach, lien à usage unique,
  reconnexion -> /app ; coach voit « compte activé » ; lien révoqué inutilisable ; lien inventé refusé
Points de sécurité vérifiés : jeton jamais stocké en clair, lien non réaffichable, invitation limitée à la même
  organisation, acceptation atomique, sportif isolé (sa fiche et son organisation seulement), AUTH-01
Bugs/limites :
  - Fiche sans e-mail : invitation impossible tant que la modification de fiche n'existe pas (P2-01 suite)
  - Sportif ayant déjà un compte : doit se connecter puis rouvrir le lien (pas de redirection automatique après login)
  - Pas de limitation du nombre d'essais sur la page d'invitation (jeton de 256 bits, risque faible) : à revoir avant prod
  - Défaut de test corrigé : fiche B ciblée avait déjà une invitation (le mauvais refus était testé)
Décisions OPEN/ADR : clé secrète utilisée pour une procédure de confiance unique (création du compte invité)
Prochaine story : P2-01 suite (modifier une fiche, recherche, filtres, archivage) ou P0-05 (shell UI / design)
```

### Story P2-01a : fiche sportif minimale, liste et ajout (préalable à l'invitation P1-05)
```
Date : 2026-10-20
Story : P2-01 (partie a), décidée avec Antonino avant P1-05 : on invite toujours un sportif qui a déjà une fiche
Objectif et fichiers specs lus : docs/03 §1 et §6, docs/11 §2, docs/02 §1
Fichiers créés/modifiés :
  supabase/migrations/20261020080822_fiches_sportifs.sql (athlete_profiles, e-mail unique par organisation
    insensible à la casse, RLS membres, update limité par colonnes, pas de delete)
  supabase/tests/database/03_isolation_sportifs.test.sql (13 tests)
  src/features/athletes/{schemas,queries,actions}.ts
  src/app/(coach)/coach/o/[orgId]/sportifs/page.tsx, .../nouveau/{page,new-athlete-form}.tsx, coach/page.tsx (liens)
  tests/e2e/athletes.spec.ts ; tests/e2e/password-reset.spec.ts (attente de fin de déconnexion)
  src/lib/supabase/database.types.ts (régénéré)
Commandes exécutées et résultats :
  npm run db:test -> 34/34 PASS ; npm run check -> exit 0 ; npm run test:e2e -> 21 passés + 1 ignoré, 3 exécutions stables
Points de sécurité/tenant vérifiés : SEC-01 sur les sportifs (lecture, création, modification, ciblage par ID),
  IDOR par URL /coach/o/[ID de B]/sportifs -> /acces-refuse, created_by et athlete_user_id non falsifiables,
  organization_id non modifiable, pas de suppression
Bugs/limites :
  - Champs minimaux (nom, e-mail, téléphone, statut) : fiche complète en attente d'OPEN-01
  - Pas encore de modification, recherche, filtres ni archivage depuis l'interface
  - Le test E2E ajoute un sportif à chaque exécution dans la base locale (nettoyé par npm run db:reset)
  - Défaut de test corrigé : course entre déconnexion et navigation (test « mot de passe oublié »)
Décisions OPEN/ADR : choix Antonino du 20/10 pour P1-05 : lien à copier, 7 jours, case « 18 ans ou plus », page /app honnête
Prochaine story : P1-05 invitation sportif
```

### Story P1-01b : mot de passe oublié et durcissement de la config Auth locale
```
Date : 2026-10-20
Story : P1-01 (partie b) : réinitialisation du mot de passe par e-mail
Fichiers créés/modifiés :
  supabase/config.toml : [auth] enable_signup=false (FAILLE CORRIGÉE : l'inscription libre était ouverte via l'API
    malgré l'absence de page) ; minimum_password_length 6 -> 10 ; site_url/additional_redirect_urls localhost:3000 et
    :3100 ; rate limit e-mail local 2 -> 30/h
  src/features/auth/password-actions.ts (requestPasswordReset : réponse identique compte existant ou non ;
    updatePassword : session de récupération requise, Zod, redirection selon rôle)
  src/features/auth/schemas.ts (newPasswordSchema, PASSWORD_MIN_LENGTH)
  src/app/auth/confirm/route.ts (échange du code PKCE, liste fermée de destinations : pas d'open redirect)
  src/app/(auth)/mot-de-passe-oublie/*, src/app/(auth)/nouveau-mot-de-passe/*, src/app/lien-invalide/page.tsx
  src/components/ui/form-styles.ts, src/app/(auth)/login/login-form.tsx (lien « Mot de passe oublié ? »)
  supabase/seed.sql (coach-reset@example.test, dédié au test E2E) ; tests/e2e/password-reset.spec.ts
Commandes exécutées et résultats :
  curl /auth/v1/signup -> signup_disabled ; curl /token coach A -> 200
  npm run test:e2e -> 17 passés + 1 ignoré volontairement (parcours e-mail sur le seul profil ordinateur), 2 exécutions
  consécutives stables ; check exit 0 ; db:test PASS
Incidents rencontrés (transparence) :
  - Ma 1re correction mettait aussi [auth.email] enable_signup=false, ce qui COUPE toute connexion par e-mail :
    détecté par les tests Playwright, corrigé (seul [auth] enable_signup doit être à false)
  - 2 défauts de test (course de navigation, fragment #error ajouté par Supabase), pas de défaut applicatif
Points de sécurité vérifiés : pas d'énumération des comptes, lien à usage unique, lien falsifié refusé,
  destination de redirection en liste fermée, mot de passe >= 10 caractères côté Zod ET côté Supabase
Bugs/limites : la vérification d'e-mail à l'inscription est sans objet (pas d'inscription avant P8) ;
  l'e-mail utilise le gabarit Supabase par défaut (en anglais) : à traduire avant la mise en ligne
Prochaine story : P1-05 invitation sportif (décisions à prendre avec Antonino)
```

### Story Playwright : premiers tests de parcours (P0-04 / P6-06 anticipé sur le parcours connexion)
```
Date : 2026-10-20
Story : installer Playwright au premier parcours réel (connexion), conformément à P0-04
Dépendance ajoutée (justification) : @playwright/test 1.64.1 + Chromium headless uniquement (~99 Mo, cache utilisateur
  hors dépôt) ; profils « ordinateur » (Desktop Chrome) et « telephone » (Pixel 7)
Fichiers créés/modifiés : playwright.config.ts, tests/e2e/auth.spec.ts, package.json (test:e2e), .gitignore,
  .prettierignore, eslint.config.mjs (rapports ignorés), README.md
  Correctif applicatif : src/features/auth/{actions,guards,session}.ts, src/app/espace/route.ts
Commandes exécutées et résultats :
  1er passage : 8 échecs / 10. Analyse : (a) sélecteur de test trop large (Next ajoute un role=alert d'annonce de
  route) ; (b) VRAI DÉFAUT : après connexion, l'adresse restait /espace alors que la bonne page s'affichait
  (double redirection non reflétée par le routeur client).
  Correctif : l'action login calcule la destination avec la session qu'elle vient d'ouvrir et redirige directement.
  2e passage : npm run test:e2e -> 10/10 PASS (5 scénarios x 2 profils, 9,5 s) ; check exit 0 ; db:test PASS
Scénarios : visiteur -> /login ; coach A connexion, voit Démo A et pas Démo B, déconnexion, /coach refermé ;
  mauvais mot de passe -> erreur générique ; coach A refusé sur /admin ; admin -> /admin et refusé sur /coach
Bugs/limites : Supabase doit tourner avant les tests (pas de démarrage automatique) ; pas encore de CI
Prochaine story : mot de passe oublié (P1-01b)
```

### Story P1-04 : garde-fous serveur de rôle
```
Date : 2026-10-20
Story : P1-04 (requireCoach, requireOrgAccess, requirePlatformAdmin ; requireAthlete reporté)
Objectif et fichiers specs lus : docs/02 §2, §6, §8 (AUTH-01, ADM-01), docs/12 §2
Fichiers créés/modifiés :
  supabase/migrations/20261020072933_admin_plateforme_verification.sql (public.current_user_is_platform_admin,
    security definer, ne répond que pour l'appelant, interdit à anon)
  supabase/tests/database/02_admin_plateforme.test.sql (5 tests), supabase/seed.sql (admin@example.test)
  src/features/auth/guards.ts (requireCoach, requireOrgAccess avec validation UUID, requirePlatformAdmin, getHomePath)
  src/app/(admin)/admin/page.tsx, src/app/acces-refuse/page.tsx, src/app/espace/route.ts (aiguillage après connexion)
  src/components/ui/logout-button.tsx, src/app/(coach)/coach/page.tsx, src/features/auth/actions.ts, src/proxy.ts
Commandes exécutées et résultats :
  npm run db:reset ; npm run db:test -> 21/21 PASS ; npm run check -> exit 0 ; npm run build -> OK
  next start + curl : coach A /coach OK, /admin refusé (aucun contenu admin dans la réponse) ; admin /admin OK,
  /coach refusé (aucune donnée coach) ; /espace -> /coach (coach), /admin (admin), /login (anonyme) ; 0 erreur serveur
Points de sécurité/tenant vérifiés : refus identique pour « interdit » et « inexistant » (pas de fuite d'existence),
  rôle admin lu côté serveur via fonction SQL, jamais via user_metadata ; admin sans accès aux organisations
Bugs/limites :
  - requireOrgAccess n'est encore utilisé par aucune page : il sera testé dès la première action métier (P2)
  - requireAthlete reporté : la table des sportifs n'existe pas encore (P1-05/P2)
  - Le refus intervenant dans un Suspense, la redirection est faite côté navigateur (pas de code 307/403 HTTP)
Décisions OPEN/ADR : forbidden() de Next 16 écarté car expérimental (authInterrupts) ; page /acces-refuse à la place
Prochaine story : Playwright (parcours connexion coach + refus croisés)
```

## Session du 19/10/2026 (après-midi)
- Date : 2026-10-19 (après-midi)
- Objectif : P1-02 / P1-03, organisations, membres et isolation RLS entre deux tenants.
- Décisions validées par Antonino : **pas de page d'inscription publique avant P8** (P8-01) ; les comptes coachs sont créés par l'administrateur ; on commence par le socle de sécurité avant la page de connexion.

### Story P1-01a : connexion, session, déconnexion, espace coach protégé
```
Date : 2026-10-19
Story : P1-01 (partie a) : connexion e-mail/mot de passe, session, déconnexion, page /coach protégée
Objectif et fichiers specs lus : docs/02 §1-2 et §8 (AUTH-01, SEC-01), docs/12 §2 et §10 (SSR/auth), doc Next 16
  embarquée (proxy, authentication-with-cache-components), guide Supabase SSR Next.js
Dépendances ajoutées (justification) : @supabase/supabase-js + @supabase/ssr (session par cookies), zod (validation
  serveur du formulaire), server-only (empêche l'import de code serveur côté navigateur)
Fichiers créés/modifiés :
  src/proxy.ts (rafraîchit la session via getClaims, redirection optimiste /coach <-> /login, en-têtes anti-cache)
  src/lib/env.ts (validation Zod des variables publiques), src/lib/supabase/server.ts (client typé, connection())
  src/lib/supabase/database.types.ts (généré par npm run db:types)
  src/features/auth/{schemas,session,actions}.ts (Zod, getCurrentUser/requireUser/getCoachMemberships, login/logout)
  src/app/(auth)/login/{page,login-form}.tsx, src/app/(coach)/coach/page.tsx, src/app/page.tsx (lien connexion)
  package.json (script db:types), README.md ; .env.local local créé (ignoré par Git)
Migrations / endpoints / vues ajoutées : aucune migration ; Server Actions login/logout ; pas de Route Handler
Commandes exécutées et résultats :
  npm run check -> exit 0 ; npm run build -> OK (/coach en Partial Prerender, /login statique, Proxy actif)
  next start + curl : /coach sans session -> 307 /login ; /login -> 200 ; coach A voit Démo A et pas Démo B ;
  coach B voit Démo B et pas Démo A ; coach connecté sur /login -> 307 /coach ; cookie falsifié -> 307 /login ;
  /coach connecté servi en Cache-Control private, no-store ; 0 erreur serveur
Tests automatiques et manuels : pas de test automatisé de l'interface (Playwright pas encore installé) ;
  test manuel navigateur par Antonino le 19/10/2026 : connexion coach-a, affichage Démo A, déconnexion,
  mauvais mot de passe -> message d'erreur : OK
Points de sécurité/tenant vérifiés : vérification serveur indépendante du proxy (requireUser), getClaims et non
  getSession, message d'erreur générique, isolation A/B visible dans l'interface, pas de cache des pages authentifiées
Bugs/limites :
  - Erreur Next « Date.now() pendant le prérendu » trouvée puis corrigée par connection() dans le client serveur
  - Reste de P1-01 : mot de passe oublié/reset et vérification e-mail (Mailpit local)
  - Pas de contrôle de rôle coach vs sportif : guards requireCoach/requireAthlete = P1-04
Décisions OPEN/ADR : aucune
Prochaine story : P1-01b (reset mot de passe) ou P1-04 (guards de rôle) ; installer Playwright pour le parcours connexion
```

### Story P1-02 / P1-03 : organisations, membres, admins plateforme et RLS
```
Date : 2026-10-19
Story : P1-02 (organisation + memberships, admin plateforme indépendant) et P1-03 (RLS + tests 2 organisations)
Objectif et fichiers specs lus : docs/02 §1-2 et §6, docs/11 §2, docs/12 §2-3
Fichiers créés/modifiés :
  supabase/migrations/20261019151645_organisations_et_membres.sql
  supabase/seed.sql (2 organisations démo + 2 comptes coachs fictifs @example.test)
  supabase/tests/database/01_isolation_organisations.test.sql (pgTAP)
  package.json (script db:test), README.md
Migrations / endpoints / vues ajoutées :
  tables organizations, organization_members (owner|coach, active|disabled, un seul owner par org), platform_admins
  schéma private + fonction private.is_org_member (security definer, search_path verrouillé)
  RLS : lecture de sa propre organisation et de ses membres uniquement ; aucune écriture client ;
        platform_admins sans policy ; anon sans aucun privilège
Commandes exécutées et résultats :
  npm run db:reset -> 2 migrations + seed appliqués
  npm run db:test -> 16/16 tests PASS
  Contre-épreuve : policy remplacée par using(true) -> tests FAIL (la fuite est détectée) ; reset -> PASS
  Connexion API Auth avec coach-a@example.test / mot de passe démo -> jeton obtenu
Tests automatiques et manuels : 16 tests pgTAP (isolation A/B dans les deux sens, ciblage par ID, membres,
  membre désactivé, admin plateforme sans accès implicite, anon refusé, écritures refusées, owner unique)
Points de sécurité/tenant vérifiés : SEC-01 et DB-01 pour organisations/membres ; ADM-01 (admin sans accès implicite)
Bugs/limites :
  - Pas encore d'interface : connexion (P1-01) et garde-fous serveur requireCoach/... (P1-04) à venir
  - Pas encore de script de création d'un vrai compte coach (prévu avec P1-01/P1-04)
  - owner_user_id de docs/11 remplacé par le membre de rôle 'owner' (un seul par organisation, contrainte en base)
Décisions OPEN/ADR : inscription publique repoussée à P8 (conforme à P8-01)
Prochaine story : P1-01 (connexion, session, déconnexion, page /coach protégée) puis P1-04
```

## Session du matin (P0)
- Date : 2026-10-19
- Objectif : cadrage technique et amorçage P0 (`P0-01` à `P0-03` uniquement).
- Décisions validées par Antonino : Node 24 LTS ; Supabase DEV en local (CLI + Docker) ; un commit par story, **sans** co-auteur.
- Réalisé : socle Next.js, environnements, outillage migrations/seed/reset (détail ci-dessous). **Aucune table métier, aucune auth, aucune RLS** : c'est P1.
- Prochaine tâche recommandée : décider du contenu de P0-04/P0-05 ou passer à P1 (voir « Points à valider »).

### Story P0-01 : socle Next.js TypeScript strict, lint, format, conventions
```
Date : 2026-10-19
Story : P0-01
Objectif et fichiers specs lus : CLAUDE.md, 00_INDEX.md, docs/01, 11, 12, 14
Fichiers créés/modifiés : package.json, package-lock.json, tsconfig.json, eslint.config.mjs, next.config.ts,
  .gitignore, .nvmrc, .prettierrc.json, .prettierignore, src/app/{layout.tsx,page.tsx,globals.css,favicon.ico},
  README.md, AGENTS.md (écrit automatiquement par `next dev`, pointe vers la doc Next embarquée)
Migrations / endpoints / vues ajoutées : page d'accueil neutre « / » (aucune fonctionnalité simulée)
Commandes exécutées et résultats :
  create-next-app 16.4.2 généré dans un dossier temporaire puis fichiers techniques copiés (aucun fichier existant écrasé)
  npm run lint -> exit 0 ; npm run typecheck -> OK ; npm run format:check -> OK ; npm run build -> OK (/ statique)
  next dev -> page servie en 200, lang="fr", contenu attendu
Tests automatiques et manuels : pas encore de test unitaire (aucune règle métier) ; contrôles qualité ci-dessus
Points de sécurité/tenant vérifiés : sans objet à ce stade
Bugs/limites :
  - Next 16.4 active par défaut `cacheComponents` : conservé, à surveiller en P1 (lecture des cookies d'auth)
  - npm audit : 5 alertes « high » sur `braces`, uniquement via la chaîne ESLint (outil de dev, pas en production) ;
    le seul correctif proposé rétrograde eslint-config-next en v14, non appliqué
  - Typographie (Geist/Arial par défaut) non traitée : relève de P0-05
Décisions OPEN/ADR : aucune
Prochaine story : P0-02
```

### Story P0-02 : `.env.example` et séparation des environnements
```
Date : 2026-10-19
Story : P0-02
Fichiers créés/modifiés : .env.example, .gitignore (exception !.env.example), README.md
Commandes exécutées et résultats :
  git check-ignore .env.local .env .env.production -> ignorés ; .env.example -> versionnable
  .env.example ne contient aucune valeur ; npm run check -> exit 0
Points de sécurité vérifiés : clé secrète Supabase documentée « serveur uniquement », jamais NEXT_PUBLIC_
Bugs/limites : projets cloud STAGING/PROD non créés (volontaire, pas nécessaire avant le déploiement)
Prochaine story : P0-03
```

### Story P0-03 : migrations versionnées, seed démo, reset DEV
```
Date : 2026-10-19
Story : P0-03
Fichiers créés/modifiés : supabase/config.toml (project_id = coaching-platform), supabase/.gitignore,
  supabase/migrations/20261019101418_socle_utilitaires.sql (fonction trigger public.set_updated_at),
  supabase/seed.sql (en-tête DÉMO, vide en P0), package.json (supabase CLI 2.121.0 en devDependency,
  scripts db:start/stop/status/reset/new), README.md
Commandes exécutées et résultats :
  npm run db:start -> Supabase local démarré (Postgres 17), migration et seed appliqués
  npm run db:reset (2 fois de suite) -> exit 0 à chaque fois, 1 migration appliquée
  Test SQL dans une transaction annulée : trigger set_updated_at met bien à jour updated_at
Points de sécurité/tenant vérifiés : fonction avec search_path = '' ; aucune donnée personnelle dans le seed
Bugs/limites :
  - Les 2 organisations de test sont reportées en P1 avec leurs tables et leur RLS (choix expliqué à Antonino)
  - Les clés locales Supabase sont les clés de développement par défaut, non commitées
Prochaine story : P0-04 (Vitest) / P0-05 (shell UI) ou P1-01
```

### Points à valider
- **Configuration Auth de production** (à reprendre à la création des projets STAGING/PROD) : inscription désactivée
  (`enable_signup=false` dans [auth], PAS dans [auth.email]), mot de passe >= 10, URLs de redirection limitées au
  domaine réel, gabarits d'e-mails en français, SMTP réel.
- `~/.npmrc` d'Antonino contient `prefix=~/.npm-global`, incompatible avec `nvm use`. Les commandes de cette session
  ont utilisé directement le binaire Node 24 de nvm. À régler par Antonino (voir compte rendu de session).

## Session précédente
- Date : 2026-10-18
- Objectif : livrer spécifications complètes prêtes à être utilisées avec Claude Code.
- Réalisé (pack) : cahier des charges V1.1, stack simplifiée, trajet SaaS, plans ; **aucun code applicatif généré dans cette archive**.
- Questions ouvertes : voir `docs/14_TESTS_ET_ROADMAP.md` (`OPEN-*`).
- Prochaine tâche recommandée : `P0-01` dépôt TypeScript, architecture dossiers et commandes de qualité.

## Format de compte rendu après chaque story
```
Date :
Story :
Objectif et fichiers specs lus :
Fichiers créés/modifiés :
Migrations / endpoints / vues ajoutées :
Commandes exécutées et résultats :
Tests automatiques et manuels :
Points de sécurité/tenant vérifiés :
Bugs/limites :
Décisions OPEN/ADR :
Prochaine story :
```
