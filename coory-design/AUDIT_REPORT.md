# Audit · intégration de la partie « Programmes » (phase 1)

Date : 9 novembre 2026. Source : `coory-design/COORY_PROGRAMME_DESIGN_HANDOFF/` (lu en entier, dans l'ordre du README). **Aucun code n'a été modifié.** Captures de l'existant : `coory-design/AUDIT_AVANT/` (ordinateur, 1 440 px de large).

---

## 0. En bref

- **Ce qui existe aujourd'hui** : la **lecture** d'un programme publié, et rien d'autre.
  - Côté données : 3 tables (`programs`, `program_publications`, `publication_sessions`), remplies seulement par le seed.
  - Dans la fiche d'un sportif : l'onglet Programme (une carte de résumé), l'onglet Agenda (semaine par semaine, 5 cartes colorées) et la page d'une séance.
  - Pas d'éditeur, pas de brouillon, pas de modèle, pas d'écriture en base, pas de PDF de programme.
  - La page Programmes (`/coach/programmes`) est un module vide (« Aucun programme pour l'instant »).
- **Ce que demande la livraison** :
  - **9 écrans entièrement nouveaux** : 01, 02, 03, 03b, 04, 05, 06, 08 et 09.
  - **2 écrans existants à refaire** : 07 Onglet Programme et 2c Agenda.
  - Un nouveau modèle de données pour les brouillons, modèles, phases, jours fixes, façons de viser et charges Hyrox.
  - 2 PDF interactifs.
- **Ampleur** : c'est le plus gros chantier du projet, de l'ordre de plusieurs semaines. Il ne tient pas d'ici le 13/11.
- **Avant la phase 2, j'ai besoin de tes réponses** sur 19 points : 15 contradictions entre la livraison et le projet (§3), plus 4 écarts de la maquette et précisions (§3 bis). Il faut aussi accepter ou refuser les propositions [P] (§4). Les plus importantes sont C-1 (moteur PDF), C-2 (modèle de données), C-3 (couleurs) et C-8 (un ou plusieurs programmes publiés par sportif).

---

## 1. Le code aujourd'hui

### Pile technique

- **Application** : Next.js 16 (App Router), React 19, TypeScript strict, Tailwind v4.
- **Données** : Supabase (PostgreSQL, Auth, RLS), validation Zod.
- **Tests** : Vitest et Playwright.
- **PDF** : `@react-pdf/renderer` 4.9.0, déjà utilisé pour les factures (ADR 0002).
- **Police** : Plus Jakarta Sans 400 à 800, chargée par `next/font` (`src/app/layout.tsx`).
- **Icônes** : `lucide-react`.
- **Glisser-déposer** : aucune bibliothèque.

### Routes concernées

| Route | État |
|---|---|
| `/coach/programmes` (via `(coach)/coach/[module]/page.tsx`) | Module vide (`COACH_MODULES.programmes` dans `src/components/layout/modules.ts`) |
| `/coach/o/[orgId]/sportifs/[athleteId]?onglet=programme` | Onglet Programme : une carte (titre, objectif, période, durée, séances, version, « Voir le programme semaine par semaine ») |
| `/coach/o/[orgId]/sportifs/[athleteId]?onglet=agenda` | Agenda du programme : bascule Semaine / Toutes les semaines, sélecteur de semaine, 5 cartes colorées, séances avec le coach |
| `/coach/o/[orgId]/sportifs/[athleteId]/programme/[sessionId]` | Page d'une séance publiée (le graphique a été retiré le 08/11, D-152) |
| `/coach` (tableau de bord) | Lit `listActivePrograms` (carte « programmes en cours ») |

### Composants réutilisables

- **En-tête et coquille** :
  - `PageHeader` (chemin « ← Précédent · Page » sur une ligne, D-124), `app-shell`, `side-nav`, `mobile-bar`, `header-tools` ;
  - la sidebar et l'en-tête de l'app correspondent déjà aux maquettes.
- **Éléments d'interface** : `segmented`, `dropdown`, `overlay` (fenêtre centrée et feuille du bas), `toast`, `mobile-action-bar`, `empty-state`, `status-pill`, `badge`, `avatar`, `skeleton`, `confirm-submit-button`, `count-badge`.
- **Métier** :
  - `exercise-image` et `library-filter` (Bibliothèque), `week-picker` ;
  - les cartes de séance de l'agenda (`program-weeks.tsx`).
- **Règles** :
  - `src/domain/training/` : `discipline.ts`, `pace.ts`, `vma.ts` (allures depuis la VMA, déjà testées) et `program-session.ts` (schéma de séance v1) ;
  - `src/features/programs/` : `queries.ts` et `session-display.ts`.

### Données utiles déjà en base

| Besoin de la maquette | Existant | Écart |
|---|---|---|
| VMA, allures | `athlete_reference_metrics` (`pace_*`) | aucun |
| FC max, FC repos | `athlete_reference_metrics` (`hr_max`, `hr_rest`) | aucun |
| Max d'un exercice (% du max) | `strength_load` avec `exercise_label` **en texte libre** | pas de lien vers l'exercice de la Bibliothèque (voir C-11) |
| Catégorie Hyrox (« Open Femme ») | `athlete_goals.hyrox_category` (open, pro, doubles, relay) + sexe du sportif | « Open Femme » se déduit des deux ; pas de catégorie hors objectif |
| Disponibilités | `athlete_profiles.available_days` (lun à dim) | pas de matin / soir (non requis) |
| Séance avec le coach | séances encadrées de l'agenda, `withCoach.sessionId` dans la séance | aucun |
| Jour d'une séance | `publication_sessions.planned_date` (prévue, jamais remplie) | heure absente |

### Schéma des programmes : existant, livraison, cahier des charges

| Sujet | Existant (`20261026120000_programmes.sql`) | `DATA_MODEL_PROPOSAL.md` (livraison) | `docs/11` (cahier des charges du projet) |
|---|---|---|---|
| Programme | `programs` : sportif **obligatoire**, `start_date` **un lundi obligatoire**, 1 à 52 semaines, statut | `Program` avec `athleteId` nul pour un modèle, `isTemplate` | `programs` |
| Brouillon | **aucun** | les tables normalisées sont le brouillon | `program_drafts` (un JSON structuré + `revision` contre les modifications simultanées) |
| Semaines, séances, blocs | dans le JSON de la publication | tables `Week`, `Session`, `Block` (arbre) | dans le JSON du brouillon |
| Version publiée | `program_publications` (photo figée) + `publication_sessions` (une ligne par séance) | « publishedVersion » | identique à l'existant |
| Modèles | **aucun** | un `Program` avec `isTemplate` | `session_templates`, `week_templates`, `program_templates` ; `organization_id` nul = catalogue Coory |
| PDF | **aucun** | `ProgramExport` | `pdf_exports` |
| Écriture | **aucune** (RLS en lecture seule ; « la publication passera par une fonction contrôlée ») | non précisé | actions serveur + RLS |

---

## 2. Écran par écran

| Écran | Maquettes | Existant | Travail |
|---|---|---|---|
| **01 Page Programmes** | PRG-01 à 06 | Module vide (`AUDIT_AVANT/avant-01-page-programmes.jpg`) | **Nouveau.** Liste de tous les programmes, filtres (statut avec compteurs, discipline, sportif, recherche), onglet Modèles, états vide et sans résultat, bouton flottant sur téléphone. Onglets dans l'en-tête : `PageHeader` à étendre. |
| **02 Créer un programme** | WIZ-01 à 05 | Aucun | **Nouveau.** Assistant en 4 étapes (ordinateur : colonne d'étapes ; téléphone : 4 barres + barre d'action fixe). Façon de viser pré-choisie depuis les repères, phases, organisation, point de départ (zéro, copie, modèle) avec aperçu en grille. |
| **03 Éditeur de programme** | EDT-01 à 05 | Aucun | **Nouveau.** Grille 196 / 1fr / 304, phases, semaines « allégées », cartes de séance avec ↑ ↓, menu ···, mode modèle Coory en lecture seule, pile de 3 écrans sur téléphone. Brouillon et enregistrement automatique. |
| **03b Jours fixes** | FIX-01 à 05 | `planned_date` inutilisée, `available_days` | **Nouveau.** Proposition de jours, bandeau 7 jours, sélecteur de jour, heure, portée (semaine, phase, programme), séance du coach verrouillée, autorisation de déplacement. |
| **04 Running** | RUN-01 à 03 | Schéma v1 = lignes de texte (« 4 min @4:55 min/km ») | **Nouveau éditeur + schéma de séance v2 structuré** (étapes, mesure, cible allure ou zone de FC, Répéter). Les calculs d'allure existent (`vma.ts`). |
| **05 Musculation** | MUS-01 à 03 | Bibliothèque d'exercices (feuille de choix réutilisable) | **Nouveau.** Séries, saisie rapide, kg ou % du max, superset, EMOM, repos, tempo, consigne. |
| **06 Hyrox** | HYR-01 à 03 | 8 stations dans la Bibliothèque | **Nouveau.** Blocs à format, stations, ergomètres en min/500 m, charges du coach ou officielles, simulation de course. |
| **07 Onglet Programme** | TAB-01 à 04 | Une carte de résumé (`avant-07-onglet-programme.jpg`) | **À refaire.** Semaine en cours avec statuts (faite, prochaine, à faire), ressenti, résumé du programme à droite, « Autres semaines », état vide avec 2 actions. Les statuts « Faite » et le ressenti n'ont pas de données (voir C-13). |
| **2c Agenda** | AGD-01 à 04 | Très proche (`avant-2c-agenda.jpg`) : mêmes en-tête, encart « Dans l'ordre », bascule, cartes colorées | **À adapter.** Lignes de détail dans chaque carte (« 20 min @ 6:00 »), séance **dépliée sous la rangée** (ordinateur) ou dans la carte (téléphone), bouton PDF dans le détail, variante jours fixes (le jour sur chaque carte). La page séance séparée existe aujourd'hui (voir C-15). |
| **08 Publier** | PUB-01, 02 | Aucun | **Nouveau.** Fenêtre et feuille de confirmation, avertissements bloquants ou non, toast « Programme publié (version N) · Voir ». Demande la fonction de publication côté serveur. |
| **09 PDF** | PDF-01 à 10 | Aucun PDF de programme (React-PDF existe pour les factures) | **Nouveau.** PDF 1 « Agenda du programme » (1 + N pages) et PDF 2 « Fiches et repères » (1 + K pages) : liens internes, ‹ ›, bouton sommaire, signets, polices embarquées. |

**Commun à tous les écrans** :

- **Déjà conformes** : la sidebar, l'en-tête 64 px, le chemin sur une ligne et le bouton Assistant IA.
- **À ajouter** :
  - le statut « Enregistré » dans l'en-tête des éditeurs ;
  - les onglets dans l'en-tête (écran 01) ;
  - le bandeau de programme ;
  - les variantes du segmenté (piste #e8e7ee, 2 à 5 segments).

---

## 3. Contradictions à trancher (je ne choisis pas seul)

| # | Sujet | La livraison dit | Le projet dit | Ma recommandation |
|---|---|---|---|---|
| **C-1** | Moteur PDF | Chromium (`page.pdf`) + `pdf-lib` pour les signets | ADR 0002 : **React-PDF**, Chromium **écarté** (trop lourd chez un hébergeur) | **Garder React-PDF.** Il gère les liens internes (`id` + `Link src="#…"`), les signets (`bookmark`) et les polices embarquées. Aucune dépendance ajoutée. Les couleurs `color-mix` seront calculées en hexadécimal. |
| **C-2** | Modèle de données | Tables normalisées (Semaine, Séance, Bloc) ; un modèle = un programme sans sportif | `docs/11` : brouillon = **un document JSON validé par Zod** (`program_drafts`) + tables de modèles ; publications figées existantes | **Suivre `docs/11`.** Ça colle aux publications déjà en place, avec moins de migrations et une copie de modèle simple. Le contenu des séances passe en **schéma v2** (structuré), et la v1 reste lisible. |
| **C-3** | Couleurs | « N'invente aucune couleur » : valeurs de la maquette | CLAUDE.md : **jetons de `tokens.css` uniquement**. Écarts (maquette → app) : texte secondaire #4a4855 → #3b3946 ; gris discret #8a8896 → #6e6c79 (corrigé exprès pour le contraste) ; fond doux #f6f5fa → #f8f7fb ; Running texte #4f4ed6 → #4b4ad6 ; Musculation texte #b51f39 → #b81d38 ; Hyrox #FEC14F → #ffc04f, texte #8a6200 → #9a5b00 ; danger #b51f39 → #be123c | **Garder les jetons de l'app** (écarts invisibles à l'œil, contraste AA garanti) et n'**ajouter** que les valeurs sans équivalent (piste du segmenté, anneaux, ombres). Conséquence : un diff au pixel ne sera jamais nul sur les couleurs. |
| **C-4** | Thème sombre | Non dessiné | CLAUDE.md : chaque écran vérifié en clair **et** en sombre | Le dériver des jetons sombres existants, sans nouvelle couleur. |
| **C-5** | Bascule ordinateur / téléphone | Ordinateur à partir de 1 200 px, tablette 768 à 1 199 [P] | L'app bascule à 1 024 px (`lg:`) partout | Garder 1 024 px, pour la cohérence avec toutes les autres pages. |
| **C-6** | Diff visuel ≤ 1 % (Playwright) | Exigé pour chaque écran | Les captures téléphone contiennent la barre d'état « 9:41 » et le cadre de l'appareil de la planche ; données, badges et avatar différents (C-7) | Comparer seulement la zone de contenu, avec les mêmes données de démo, et documenter la tolérance réelle. Sinon, « ≤ 1 % » serait annoncé sans être vrai. |
| **C-7** | Données de démo | 2 jeux dans la même livraison : « Inès Ben Ali · Prépa HYROX Gand · Julien Mertens » (01 à 08) et « Inès Benali · Prépa Hyrox Bruxelles · bloc 1 · Gianluca Lo Bianco » (2c) | Le seed actuel = le 2e jeu, 5 séances par semaine (la maquette 03 en montre 4) | Garder le seed actuel et le compléter (Lucas, Sophie, Thomas, Nora, Yanis, modèles Coory de démo). À toi de dire si tu préfères renommer en « Prépa HYROX Gand ». |
| **C-8** | Plusieurs programmes publiés | Statuts « En cours » **et** « À venir » pour un même sportif possibles | Index unique : **un seul programme publié par sportif** | Autoriser un programme publié par période **sans chevauchement** (un en cours + un à venir). C'est une migration et une règle métier : ta décision. |
| **C-9** | Date de début | « lun. 26 oct. » | `start_date` doit être **un lundi** (contrainte en base) | Garder la règle : le sélecteur de date ne propose que des lundis. Les modèles (sans date) vont dans leurs propres tables (C-2). |
| **C-10** | Charges Hyrox officielles | BR-15 : Open Femme = sled push 102 kg, sled pull 78 kg, farmers 2 × 16 kg, sandbag 10 kg, wall balls 4 kg | D-153 : **valeurs à vérifier sur la source HYROX** avant de coder ; catégories de l'app = open, pro, doubles, relay + sexe | Je vérifie le tableau officiel (Open, Pro, Doubles, Relay, femme et homme) en phase 2 et je te le montre avant de le coder. |
| **C-11** | % du max | « Max de Lucas : 20 kg par haltère » relié à l'exercice | Le repère « Charge de référence » nomme l'exercice **en texte libre** | Ajouter un lien facultatif vers l'exercice de la Bibliothèque (`exercise_key`) dans les repères. Sans lien : % seul, avec un avertissement. |
| **C-12** | Zones de FC | BR-13 [P] : Z4 = 84 à 91 % de la FC max | Rien de décidé | À choisir avec Gianluca : % de la FC max (simple) ou méthode de Karvonen (avec la FC repos, déjà en base). |
| **C-13** | « Faite », RPE, ressenti (07, 2c) | Dessinés avec des valeurs (« Ressenti 7/10 ») | Aucune donnée : le sportif valide dans **son** espace (tranche 3, pas construite) ; le coach peut cocher à sa place (décision du 26/10) | Afficher « Prochaine » et « À faire » maintenant. « Faite » et le ressenti arrivent avec l'espace sportif, ou avec un bouton « Marquer faite » pour le coach : ton choix. |
| **C-14** | Le sportif déplace une séance (BR-08) | Avec notification au coach | Espace sportif non construit | Enregistrer l'autorisation maintenant, pour l'utiliser plus tard. |
| **C-15** | Détail d'une séance | Déplié **dans l'agenda** (2c) | Une page séparée existe (`/programme/[sessionId]`) ; la règle 4 interdit de supprimer une route | Déplier dans l'agenda comme la maquette, et garder la page (lien « Ouvrir » ou depuis le PDF). |

### 3 bis. Écarts de la maquette elle-même et précisions

| # | Point | Proposition |
|---|---|---|
| **C-16** | PRG-01 : le champ de recherche **dépasse** la zone de contenu de 12 px à 1 280 px. AGD-01 : « Toutes les semaines » et « Semaine actuelle » passent **sur 2 lignes**. EDT-01 : la ligne sous « Semaine 2 » et la méta du bandeau aussi. Ces 3 cas contredisent la règle « une info = une ligne ». | Corriger (largeurs, `nowrap` + points de suspension) plutôt que reproduire les défauts. |
| **C-17** | `tokens.css` de la livraison charge Google Fonts en ligne | L'app charge déjà la police par `next/font` (400 à 800) : rien à ajouter. Pour les PDF, embarquer les fichiers de police (licence OFL) dans le projet. |
| **C-18** | Vignettes d'exercice grises dans les maquettes | Mettre les vraies images de la Bibliothèque (fond lavande), comme le dit `ASSET_MANIFEST.json`. |
| **C-19** | Le script de QA appelle `/coach/programmes/<id>` | L'app range les pages d'une organisation sous `/coach/o/[orgId]/…`. Proposition : `/coach/o/[orgId]/programmes` (liste), `/nouveau`, `/[programId]` (éditeur), `/[programId]/seances/[cle]` (éditeur de séance), `/modeles/[id]`. `/coach/programmes` redirige vers la liste, sans route supprimée. |

---

## 4. Propositions [P] à valider (non dessinées)

**Je propose de les accepter, sauf avis contraire** :

- l'onglet dans l'adresse (`?onglet=modeles`) ;
- « Continuer » désactivé tant qu'un champ requis est vide ;
- le toast « Brouillon créé » ;
- la confirmation avant de supprimer une séance ou une phase, ou de revenir « dans l'ordre » ;
- Échap referme ;
- les états chargement (squelettes), erreur d'enregistrement (toast) et erreur de champ (anneau rouge) ;
- le survol et le focus clavier ;
- l'arrondi au 0,5 kg ;
- le % sans max connu : % seul + avertissement ;
- un jour indisponible : avertissement sans blocage ;
- des phases contiguës, une semaine dans une seule phase ;
- la règle tablette « 768 à 1 199 » remplacée par la bascule à 1 024 de l'app (C-5).

**Écrans à dessiner ou à décider** (non dessinés, nécessaires au parcours) :

1. Fenêtre « Enregistrer comme modèle » (choisir le nom).
2. Sélecteur « Depuis un modèle » (choisir une séance modèle).
3. Sélecteur « Dupliquer vers… » (choisir les semaines).
4. « Nouveau modèle » depuis l'onglet Modèles (l'assistant sans sportif ni dates).
5. « Le préparer avec l'Assistant IA » (PRG-F08) : il ouvre l'Assistant avec l'intention « créer un programme », sans création automatique.

Je propose de les faire avec les composants existants (fenêtre ou feuille, liste à cocher), sans nouveau style. Dis-moi si tu préfères les faire dessiner d'abord.

**Plus tard, à valider** :

- PDF régénéré à chaque publication, avec historique ;
- lien « Ouvrir dans Coory » dans le PDF ;
- gabarit PDF « téléphone » ;
- génération du PDF par le sportif.

**Non dessiné, je ne le développe pas** : éditeur hybride, envoi automatique chaque semaine, séances manquées / reportées / annulées, champs remplissables dans le PDF, fenêtre « Utiliser un modèle » (le parcours passe par l'assistant, étape 4).

---

## 5. Fichiers que je vais toucher (prévision, à confirmer en phase 2)

### Modifiés

- **Coquille de l'app** :
  - `src/components/layout/modules.ts` : Programmes quitte la liste des modules vides ;
  - `navigation.ts` : lien vers la vraie page ;
  - `page-header.tsx` : onglets dans l'en-tête, statut « Enregistré ».
- **Thème et composants** :
  - `src/styles/tokens.css` : uniquement les jetons sans équivalent ;
  - `src/components/ui/segmented.tsx`, `dropdown.tsx`, `overlay.tsx`, `toast.tsx`, `mobile-action-bar.tsx`, `status-pill.tsx`, `empty-state.tsx` : variantes.
- **Règles et lecture** :
  - `src/domain/training/program-session.ts` : schéma v2 + lecture de la v1 ;
  - `src/features/programs/queries.ts` : brouillons, liste, modèles ;
  - `session-display.ts` : lignes « 20 min @ 6:00 ».
- **Fiche sportif** (`src/app/(coach)/coach/o/[orgId]/sportifs/[athleteId]/`) :
  - `page.tsx` ;
  - `athlete-agenda.tsx` : onglet 07 ;
  - `program-weeks.tsx` : agenda 2c ;
  - `week-picker.tsx` ;
  - `programme/[sessionId]/page.tsx` : schéma v2.
- **Tableau de bord** : `src/app/(coach)/coach/page.tsx` (compatibilité de `listActivePrograms`).
- **Données et tests** :
  - `supabase/seed.sql` : démo des maquettes, modèles Coory **de démonstration** ;
  - `tests/e2e/athlete-overview.spec.ts`, `agenda.spec.ts`, `helpers.ts`.

### Créés

- **Base de données** : `supabase/migrations/2026111x_*` (additives et réversibles) :
  - `program_drafts` ;
  - tables de modèles avec le catalogue Coory (`organization_id` nul, lecture pour tous les coachs, écriture admin) ;
  - colonnes de programme (discipline, façon de viser, séances par semaine) ;
  - écriture sous RLS et fonction de publication ;
  - `pdf_exports` ;
  - lien d'exercice dans les repères (C-11) ;
  - règle de publication (C-8).
- **Pages** (`src/app/(coach)/coach/o/[orgId]/programmes/`) :
  - `page.tsx` (01) ;
  - `nouveau/page.tsx` (02) ;
  - `[programId]/page.tsx` (03, 03b) ;
  - `[programId]/seances/[cle]/page.tsx` (04 à 06) ;
  - `modeles/[id]/page.tsx` ;
  - les 2 routes PDF.
- **Règles et actions** (`src/features/programs/`) :
  - `actions.ts`, `schemas.ts`, `drafts.ts`, `templates.ts` ;
  - `scheduling.ts` (jours fixes) ;
  - `aims.ts` (allure, zones de FC, % du max) ;
  - `hyrox-official.ts` ;
  - `pdf/agenda.tsx`, `pdf/fiches.tsx`.
- **Composants** : `src/components/programs/`
  - carte programme, carte modèle, étapes de l'assistant ;
  - liste des semaines et phases, carte de séance ;
  - bandeau 7 jours, sélecteur de jour ;
  - liste d'étapes, panneau d'édition ;
  - publier.
- **Polices du PDF** : `public/fonts/PlusJakartaSans-*.ttf`.
- **Tests** :
  - unitaires : façons de viser, jours fixes, copie de modèle, schéma v2 ;
  - parcours : TC-01 à TC-18 ;
  - diff visuel par écran.
- **Suivi** : `00_INDEX.md`, `SUIVI_IMPLEMENTATION.md`, `CARNET_TECHNIQUE.md`.

Aucune donnée, route ni fonctionnalité existante n'est supprimée. L'authentification n'est pas touchée.

---

## 6. Risques

1. **Volume** : 50 écrans de référence, 3 éditeurs différents, 2 PDF. Je propose de livrer par tranches vérifiables. Par exemple : 01 + 02 + 03 avec une séance Running, puis Musculation, puis Hyrox, puis 03b, 07, 2c, 08 et 09.
2. **Schéma de séance v1 → v2** : les publications sont figées et doivent rester lisibles. Il faut un lecteur des deux versions et des tests sur le seed actuel.
3. **Écriture en base** : c'est la première écriture des programmes. Actions serveur avec vérification complète (identité, organisation, propriété) et RLS, plus des tests d'isolation entre deux organisations.
4. **Catalogue Coory partagé entre organisations** : lecture seule pour les coachs, politiques RLS dédiées. Le **contenu** des modèles Coory sera à écrire avec Gianluca (D-154) ; ceux du seed seront marqués comme démonstration.
5. **Enregistrement automatique** (« Enregistré ») et modifications simultanées : un numéro de `revision` pour ne jamais écraser un changement.
6. **PDF** : 13 pages ou plus, polices embarquées, liens à tester dans 5 lecteurs. Je peux tester Aperçu et Chrome sur le Mac. Safari iOS, Android et Acrobat demandent tes appareils.
7. **Diff au pixel** : voir C-3, C-6 et C-16 ; je donnerai le chiffre réel de chaque écran, sans arrondir.

---

## 7. Ce qu'il me faut de toi pour lancer la phase 2

1. Une réponse sur **C-1 à C-15** (« d'accord avec la recommandation » suffit, point par point ou en bloc).
2. **C-16 à C-19** : d'accord pour corriger ces défauts de la maquette, utiliser les vraies images et ranger les routes sous `/coach/o/[orgId]/programmes` ?
3. Les **[P] du §4** : accepter la liste, et choisir pour les 5 écrans non dessinés (« faits avec les composants existants » ou « à faire dessiner »).
4. L'**ordre des tranches** (§6, point 1).

Docker : la base locale est nécessaire à partir de la phase 2 (migrations, seed, tests). Elle n'a servi ici qu'aux captures « avant ».
