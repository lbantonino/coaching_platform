# Phase 2 · Architecture des programmes (plan à valider avant le code)

> 9 novembre 2026. Suite de `AUDIT_REPORT.md`, avec les décisions d'Antonino : recommandations C-1 à C-19 acceptées, liste [P] du §4 acceptée, les 5 petits écrans faits avec les composants existants, ordre des tranches validé.
> Ce document propose les **migrations** et les **types et contrats** (prompt « Phase 2 · Architecture » de la livraison).
>
> **Statut, 09/11/2026 au soir** : plan validé par Antonino (points 1 à 4 du §11 acceptés : max estimé par Epley, zones de FC par défaut, bouton PDF désactivé sur un brouillon jamais publié, division Hyrox précise) et **écrit** : 3 migrations, types, actions, seed, tests. Une seule différence avec le plan, au §9 (le seed).

## 0. En bref

- **3 migrations**, toutes additives et réversibles. Aucune table ni colonne supprimée. Seul l'index « un seul programme publié par sportif » est remplacé par la règle « pas de chevauchement » (C-8).
- **Aucune nouvelle dépendance npm.** Une extension PostgreSQL standard (`btree_gist`) pour la règle C-8.
- Le brouillon d'un programme = **un document JSON validé par Zod** (`program_drafts`, comme le prévoit `docs/11`). Les publications figées existantes ne changent pas.
- Les **modèles** ont leurs propres tables : `program_templates` et `session_templates`. Une ligne sans organisation = modèle Coory, en lecture seule.
- Les calculs (allure depuis la VMA, zones de FC, kg depuis un %, charges officielles Hyrox, jours fixes) sont des **fonctions pures** en TypeScript, testées par Vitest, sans table.
- **Pas de table `pdf_exports` pour l'instant** : les 2 PDF sont générés à la demande depuis la version publiée (§8).
- 4 points à trancher, en §11. Seul le point 1 bloque le début du code.

## 1. Le principe

```text
programs (1 par programme)  ──  program_drafts (1 brouillon, n° de révision)
     │
     └── program_publications (v1, v2… figées)  ──  publication_sessions (1 ligne par séance)

program_templates / session_templates  (organization_id vide = modèle Coory)
```

- L'éditeur travaille **uniquement** sur le brouillon. Chaque enregistrement automatique envoie le brouillon complet avec son numéro de révision. Si quelqu'un l'a modifié entre-temps, l'enregistrement est refusé (`REVISION_CONFLICT`) au lieu d'écraser.
- **Publier** copie le brouillon dans une nouvelle version figée (v n+1), dans une seule transaction.
- **« Modifications non publiées »** = la révision du brouillon est plus récente que celle de la dernière publication.
- **Utiliser un modèle** copie son contenu dans le brouillon. Le programme garde l'origine (`source_template_id` et `source_template_version`), et le modèle n'est jamais modifié par la copie (BR-10).

## 2. Les migrations

### M1 · `20261110090000_programmes_editables.sql`

**`programs`**, colonnes ajoutées :

| Colonne | Type | Rôle |
|---|---|---|
| `discipline` | texte (running, strength, hyrox, hybrid), facultatif | discipline principale, pour les filtres de la page 01 |
| `source_template_id` | uuid, facultatif | le modèle d'origine (lien rompu sans erreur si le modèle est archivé) |
| `source_template_version` | entier, facultatif | la version du modèle au moment de la copie |

Règle de lecture de ces colonnes : pour un programme publié, `title`, `discipline`, `start_date` et `weeks_count` sont ceux de la **version publiée** (ce que voit le sportif). Pour un brouillon jamais publié, ce sont ceux du brouillon. La liste 01 et la règle C-8 s'appuient dessus.

**C-8, plusieurs programmes publiés** :

- l'index unique `programs_one_published_idx` est remplacé par une contrainte d'exclusion : deux programmes publiés d'un même sportif ne peuvent pas avoir de périodes qui se chevauchent ;
- cela permet un programme « En cours » et un « À venir » ;
- il faut l'extension `btree_gist`, standard dans PostgreSQL et disponible chez Supabase ;
- **alternative sans extension** : vérifier dans la fonction de publication, avec un verrou. Je préfère la contrainte, parce que la base garantit la règle même si le code change.

**`program_drafts`** (nouvelle table, un brouillon par programme) :

| Colonne | Rôle |
|---|---|
| `program_id` | clé, le programme (même organisation, vérifié par clé étrangère composée) |
| `organization_id` | pour la RLS |
| `revision` | entier, +1 à chaque enregistrement |
| `schema_version` | 2 |
| `draft_json` | le brouillon (§3), taille limitée à 1 Mo |
| `updated_at`, `updated_by` | traçabilité |

**`program_publications`** : ajout de `source_revision`, la révision du brouillon qui a été publiée. Elle sert à « Modifications non publiées » et à rendre la publication **idempotente** : un double clic sur « Publier » ne crée pas deux versions.

**`publication_sessions`** : ajout de `planned_time` (heure facultative d'une séance à jour fixe). `planned_date` existe déjà et sera enfin rempli pour les jours fixes.

**Écriture** : uniquement par 4 fonctions PostgreSQL, sans écriture directe depuis le navigateur. Les publications restent ainsi impossibles à modifier ou à fabriquer à la main.

| Fonction | Ce qu'elle fait, dans une seule transaction |
|---|---|
| `create_program(org, athlete, draft, template?, version?)` | crée le programme et son brouillon (révision 1) |
| `save_program_draft(program, révision attendue, draft)` | enregistre ou refuse (`REVISION_CONFLICT`) ; met à jour les colonnes d'un programme jamais publié |
| `publish_program(program, révision attendue, snapshot, séances)` | crée v n+1 et ses séances, la rend active, met à jour les colonnes ; refuse un chevauchement (`OVERLAP`) |
| `archive_program(program)` | passe le programme en « archivé » |

Chaque fonction revérifie que l'utilisateur est membre de l'organisation du programme (`private.is_org_member`) et que le sportif appartient à cette organisation. L'action serveur, elle, valide le brouillon avec Zod **avant** l'appel, comme partout ailleurs (CLAUDE.md).

### M2 · `20261110090100_modeles_de_programmes.sql`

Deux tables de même forme :

| Colonne | `program_templates` | `session_templates` |
|---|---|---|
| `organization_id` | vide = **Coory** ; sinon, Mes modèles | idem |
| `origin` | `coory` ou `coach` (cohérent avec la colonne précédente, vérifié en base) | idem |
| `title`, `discipline` | oui | oui |
| `weeks_count`, `sessions_per_week` | oui | non |
| `session_type` | non | oui (« Sortie longue », « Circuit »…) |
| `version` | +1 à chaque modification | idem |
| `content_json` | le plan sans sportif ni dates (§3) | une séance (§4) |
| `archived_at` | suppression douce | idem |

- **RLS** : lecture des modèles Coory par tout utilisateur connecté (même règle que le catalogue d'exercices) et des modèles de son organisation. Écriture seulement dans son organisation, jamais sur une ligne Coory.
- **Les modèles Coory n'entrent jamais par une migration.** Leur contenu doit être écrit avec Gianluca et validé par lui (D-154). D'ici là, ceux de démonstration sont seulement dans `seed.sql` (développement et démo), donc jamais en production.
- `block_templates` et `week_templates` (prévus dans `docs/11`) ne sont **pas** créés : aucun écran ne les utilise.

### M3 · `20261110090200_repere_lie_a_exercice.sql` (C-11)

- `athlete_reference_metrics.exercise_id` : lien facultatif vers l'exercice de la Bibliothèque, seulement pour une « charge de référence ».
- Le libellé libre existant reste ; rien n'est perdu.
- Sans lien : en mode %, l'éditeur affiche le % seul et un avertissement (point [P] accepté).

### Retour arrière

Chaque migration a son retour arrière écrit en commentaire, comme les précédentes. Pour M1, il faut d'abord ramener à 1 le nombre de programmes publiés par sportif, avant de recréer l'index.

## 3. Le brouillon d'un programme (`draft_json`, schéma v2)

Il réunit un **plan** (commun aux programmes et aux modèles de programme) et ce qui est propre au sportif.

```text
ProgramDraft
├─ schemaVersion: 2
├─ title, discipline (running | strength | hyrox)
├─ startDate (un lundi, C-9), weeksCount (1 à 52), sessionsPerWeek (1 à 7)
├─ goal?: { raceName, raceDate, hyroxDivision, note }
├─ aimDefaults: { running: pace | hr, strength: kg | pct }      (D-153, BR-12)
├─ phases: [{ id, name, weekFrom, weekTo }]                      (facultatives, contiguës, une semaine dans une seule phase)
└─ weeks: [{ index, light, scheduling: ordered | fixed, sessions: [SessionDraft] }]

SessionDraft
├─ key            (identifiant stable, il devient source_session_key à la publication)
├─ discipline     (running | strength | hyrox ; « hybrid » refusé : non dessiné)
├─ title, sessionType, objective?, coachTip?
├─ fixedDay?: mon … sun, fixedTime?: HH:mm                       (03b)
├─ athleteCanMove: boolean                                       (C-14 : enregistré, pas encore utilisé)
├─ withCoach?: { coachSessionId, date, time }                    (rendez-vous : jour verrouillé, BR-06)
├─ sourceTemplate?: { id, version }
└─ content        (selon la discipline, §4)
```

- Un **modèle de programme** a le même plan, sans `startDate` ni `goal` : semaines « Semaine 1 à N » (BR-11).
- Les dates des semaines ne sont pas stockées : elles se calculent depuis `startDate`.
- `hyroxDivision` est plus précis que la catégorie de l'objectif (voir §5.4).

## 4. Le contenu d'une séance (schéma v2)

Une union par discipline, validée par Zod. **La v1 actuelle reste lisible** : les publications déjà figées ne sont jamais réécrites. Un lecteur unique renvoie les lignes à afficher, quelle que soit la version.

**Running** (04) :

- une liste d'**étapes** et de blocs **« Répéter N fois »** (conteneur : modifier une étape enfant modifie toutes les répétitions) ;
- une étape :
  - `role` : échauffement, course, récupération, repos ou retour au calme ;
  - `measure` : durée, distance ou libre ;
  - `target` : aucune, **allure** (plage min/km, et le % de VMA s'il a servi au calcul) ou **zone de FC** (Z1 à Z5 et plage en bpm) ;
  - `note`.

**Musculation** (05) :

- des **exercices** (lien vers la Bibliothèque, avec le nom copié pour que la publication reste lisible même si l'exercice change) ;
- par exercice :
  - `loadMode` : kg ou % du max ;
  - les séries `[{ type: échauffement | normale, reps ou plage, kg ?, pct ?, rir ? }]` ;
  - repos, tempo, consigne ;
- des groupes **Superset** (tours, repos en fin de tour) et **EMOM** (durée, travail et repos) ;
- échauffement et retour au calme en texte.

**Hyrox** (06) :

- des **blocs** avec leur format :
  - Circuit, For time, AMRAP, EMOM, Intervalles ou Simulation ;
  - tours, repos, temps cible, limite ;
  - `loads` : du coach ou officielles ;
- dans un bloc, des **lignes** :
  - Run (distance, allure en min/km) ;
  - Station (une des 8, liée au catalogue grâce à `exercises.hyrox_station`) ;
  - Ergomètre (allure en min/500 m, jamais mélangée avec le min/km, BR-16) ;
  - Transition ;
- chaque ligne peut reprendre la main sur la charge (« corrige ensuite chaque ligne »).

**Ce qui est figé, et quand** :

- dans le brouillon, on garde l'**intention** (70 %, Z4, charges officielles) et la dernière valeur calculée ;
- dans l'éditeur, « Recalculer » met la valeur à jour avec les repères du jour ;
- à la publication, les valeurs (kg, bpm, allures) sont **figées** dans la version, et le PDF et le sportif lisent exactement ces valeurs.

## 5. Les calculs (fonctions pures, testées)

### 5.1 Allure depuis la VMA

On réutilise `vma.ts`, qui existe déjà : VMA en km/h, allure = 3 600 ÷ (VMA × %). Exemple de la maquette : 16 km/h à 95 % donne environ 3:57 min/km.

### 5.2 Zones de FC (C-12, à valider par Gianluca)

Je propose ce tableau par défaut, en **% de la FC max**. Il retombe sur les exemples des maquettes, à 1 bpm près (FC max 192 : Z2 = 128 à 142, Z4 = 161 à 175).

| Zone | % FC max | Pour FC max 192 |
|---|---|---|
| Z1 | 57 à 66 % | 109 à 127 bpm |
| Z2 | 67 à 74 % | 129 à 142 bpm |
| Z3 | 75 à 83 % | 144 à 159 bpm |
| Z4 | 84 à 91 % | 161 à 175 bpm |
| Z5 | 92 à 100 % | 177 à 192 bpm |

Autre méthode possible : **Karvonen**, avec la FC de repos qui est déjà en base. Le tableau est dans le code : le changer plus tard ne demande pas de migration.

### 5.3 kg depuis un % du max (C-11, BR-14)

- kg = % × max du sportif pour cet exercice, arrondi au 0,5 kg (point [P] accepté).
- **Question ouverte (OPEN-22)** : un repère « 80 kg × 5 » n'est pas un max. Soit on l'ignore, soit on estime le max (formule d'Epley) et on l'affiche « max estimé ». Voir §11.

### 5.4 Charges officielles Hyrox (C-10, vérifiées)

Source : règlements officiels HYROX, **saison 26/27** (Singles p. 8 et p. 35, Doubles p. 8, Relay p. 8), téléchargés depuis hyrox.com le 09/11/2026. Les poids des traîneaux comprennent le traîneau. La course fait 8 × 1 km.

| Station | Femmes Open | Hommes Open · Femmes Pro | Hommes Pro |
|---|---|---|---|
| SkiErg | 1 000 m | 1 000 m | 1 000 m |
| Sled push (4 × 12,5 m) | 102 kg | 152 kg | 202 kg |
| Sled pull (4 × 12,5 m) | 78 kg | 103 kg | 153 kg |
| Burpee broad jumps | 80 m | 80 m | 80 m |
| Rameur | 1 000 m | 1 000 m | 1 000 m |
| Farmers carry (200 m) | 2 × 16 kg | 2 × 24 kg | 2 × 32 kg |
| Fentes sandbag (100 m) | 10 kg | 20 kg | 30 kg |
| Wall balls (100 rép.) | 4 kg | 6 kg | 9 kg |

Hauteur de cible des wall balls : 2,70 m pour les femmes (Open et Pro), 3,00 m pour les hommes.

**Doubles** :

- Doubles Femmes : la colonne Femmes Open ;
- Doubles Hommes, Doubles Femmes Pro et **Doubles Mixte** : la colonne du milieu, pour les deux partenaires ;
- Doubles Hommes Pro : la colonne Hommes Pro.

**Relais** :

- Femmes, Hommes ou Mixte (2 femmes et 2 hommes) ;
- chacun utilise la colonne Open de son sexe. Pour le mixte, je le déduis du tableau : le texte ne le dit pas mot pour mot.

Les chiffres de BR-15 (Open Femme) sont confirmés. Certains sites parlent de 75 wall balls pour les femmes : c'est **faux** pour 26/27, le règlement dit 100 pour toutes les divisions.

**Ce que ça change pour l'app** : l'objectif du sportif ne connaît que « open, pro, doubles, relay » et le sexe. Il ne sait pas dire « Doubles Mixte » ou « Doubles Pro ». Je propose que l'étape 2 de l'assistant (« catégorie ») offre la **division précise** :

- Open ou Pro, femmes ou hommes ;
- Doubles femmes, hommes ou mixte, et les deux Doubles Pro ;
- Relais.

Elle est pré-remplie quand l'objectif et le sexe suffisent, et enregistrée dans le brouillon. Il n'y a pas de migration. La saison est notée dans le code : à la saison suivante, on revérifie le tableau.

### 5.5 Jours fixes (03b)

`scheduling.ts` regroupe ces règles :

- en jours fixes, la numérotation des séances suit l'ordre des jours (BR-03) ;
- deux séances le même jour : avertissement (BR-04) ;
- jour indisponible : avertissement sans blocage, affiché barré (BR-05) ;
- séance avec le coach : son jour est verrouillé sur la date du rendez-vous (BR-06) ;
- portée « cette semaine / la phase / tout le programme », sans jamais toucher une semaine passée (BR-07) ;
- **proposition automatique** des jours : les disponibilités du sportif, les rendez-vous du coach, et pas deux séances dures de suite.

## 6. Avant de publier

`validateForPublish(brouillon)` est une fonction pure, appelée dans la fenêtre « Publier » (08) puis revérifiée côté serveur :

- **Bloquant** :
  - une séance invalide ;
  - aucune séance dans tout le programme ;
  - une date de début qui n'est pas un lundi ;
  - un chevauchement avec un autre programme publié du sportif.
- **Non bloquant** :
  - une semaine vide ;
  - deux séances le même jour ;
  - un jour indisponible ;
  - un % sans max connu ;
  - des charges officielles sans division ;
  - un rendez-vous coach introuvable.

## 7. Actions serveur et lectures (les contrats)

Chaque action revérifie l'identité, l'organisation, la propriété et Zod (CLAUDE.md). Les erreurs sont typées : `REVISION_CONFLICT`, `OVERLAP`, `INVALID` (avec la liste des problèmes), `NOT_FOUND`, `FORBIDDEN`. On ne divulgue jamais l'existence d'un programme d'une autre organisation.

| Action (`src/features/programs/actions.ts`) | Entrée | Sortie |
|---|---|---|
| `createProgram` | les réponses de l'assistant (sportif, titre, discipline, objectif, façons de viser, dates, phases, organisation, point de départ : zéro, ancien programme ou modèle) | `programId` |
| `saveDraft` | `programId`, révision attendue, brouillon | nouvelle révision |
| `publishProgram` | `programId`, révision attendue | numéro de version, avertissements |
| `archiveProgram` | `programId` | état |
| `duplicateProgram` | `programId` | nouveau `programId` (brouillon) |
| `saveAsTemplate` | programme ou séance, titre | `templateId` |
| `duplicateTemplate` | `templateId` (Coory vers Mes modèles) | `templateId` |
| `saveTemplate` | `templateId`, version attendue, contenu | nouvelle version |
| `archiveTemplate` | `templateId` | état |

| Lecture (`queries.ts`) | Pour |
|---|---|
| `listPrograms(org, filtres)` | page 01, onglet Programmes : statut calculé (Brouillon, En cours, À venir, Terminé, Archivé), « non publié », semaine en cours |
| `listTemplates(org, filtres)` | onglet Modèles : Tous, Coory ou Mes modèles ; programmes ou séances ; discipline ; recherche |
| `getProgramEditor(org, programId)` | 03 à 06 : brouillon, révision, dernière version, et le contexte du sportif (VMA, FC max et repos, max par exercice, division Hyrox, sexe, disponibilités, rendez-vous du coach sur la période) |
| `getTemplate(org, templateId)` | modèle ouvert dans 03 (lecture seule si Coory) |
| `getAthleteProgram` (existant, adapté) | 07 et 2c : le programme en cours, sinon le prochain ; lecture v1 et v2 |

## 8. Les PDF (contrat seulement, code en phase 5)

- Deux routes de téléchargement : `…/programmes/[programId]/pdf/agenda` et `…/pdf/fiches`.
- Elles génèrent avec **React-PDF** (C-1) à partir de la **version publiée**, jamais du brouillon, pour respecter la règle « une même version figée » de CLAUDE.md.
- **Conséquence (§11, point 3)** : sur un programme jamais publié, le bouton « PDF » est désactivé, avec « Publie le programme pour générer les PDF ».
- Pas de stockage ni de table `pdf_exports` pour l'instant. Elle viendra avec l'historique des PDF, que tu as mis en « plus tard ».

## 9. Le seed (données de démo)

- ~~Les programmes de démo passent au schéma v2.~~ **Changé à l'écriture** : les 16 programmes publiés du seed (environ 600 séances) **restent en v1**. Les réécrire à la main n'apportait rien, et les garder prouve que l'ancien format reste lisible (une publication ne se réécrit jamais). Leur brouillon v2 est repris **sans perte** de la version publiée à la première ouverture dans l'éditeur (chaque étape devient un bloc texte), puis créé au premier enregistrement (révision 0). Les écrans actuels gardent donc exactement leur rendu.
- Les nouvelles données v2 sont produites par les règles de l'application (schémas Zod, `buildPublication`) et relues par `tests/unit/seed-programmes.test.ts`.
- Ajouts :
  - un brouillon jamais publié : Nadia, « Force · bloc 2 », en % du max ;
  - un programme « À venir » (C-8) : Inès, « Prépa HYROX · bloc 2 », publié, 6 semaines après son bloc 1, avec phases, jours fixes, séances avec le coach et charges officielles Pro Femmes ;
  - deux **Mes modèles** (« Bloc force 4 semaines », « Mon fractionné du mercredi ») ;
  - les **modèles Coory de démonstration** cités dans le brief (« Prépa Hyrox · 12 semaines », « Premier 10 km · 8 semaines », « Sortie longue », « Full Body A », « Simulation Hyrox ») ;
  - les repères « Soulevé de terre » et « Développé couché » reliés à leur exercice (C-11).
- Cohérence : le bloc 2 d'Inès garde ses 4 séances par semaine (3 en semaine allégée), ses rendez-vous du mardi et du samedi, et ne chevauche pas son bloc 1.

## 10. Tests

- **Vitest** (fonctions pures) :
  - allure depuis la VMA ;
  - zones de FC ;
  - kg depuis un %, avec l'arrondi ;
  - table Hyrox par division ;
  - règles des jours fixes ;
  - schéma du brouillon (valide et invalide) ;
  - lecture v1 et v2 ;
  - lignes d'affichage ;
  - `validateForPublish` ;
  - indépendance d'une copie de modèle.
- **SQL, pgTAP** (`supabase/tests/database/36_*` à `38_*`) :
  - isolation entre deux organisations sur les brouillons, les programmes et les modèles ;
  - modèles Coory en lecture seule ;
  - refus d'une révision périmée ;
  - publication atomique et idempotente ;
  - refus d'un chevauchement ;
  - un sportif d'une autre organisation refusé ;
  - lien de repère.
- **Playwright** : les parcours existants doivent rester verts. Les nouveaux arrivent avec les écrans (phase 3b).

## 11. À trancher

1. **OPEN-22 · le max en musculation** *(bloque seulement la tranche Musculation, pas le début)*. Un repère « 80 kg × 5 » :
   - **(a)** ne compte pas comme max : seuls les repères à 1 répétition servent, sinon % seul et avertissement ;
   - **(b)** donne un **max estimé** (formule d'Epley : 80 × (1 + 5/30) ≈ 93 kg), affiché « max estimé depuis 80 kg × 5 ».

   Je recommande (b), à faire valider par Gianluca : les coachs notent souvent des charges sur plusieurs répétitions, et sans estimation le mode % servirait rarement.
2. **OPEN-21 · zones de FC (C-12)** : le tableau du §5.2 par défaut, ou Karvonen. **Ne bloque pas** : c'est une table dans le code.
3. **PDF d'un brouillon jamais publié** : bouton désactivé (§8). D'accord ?
4. **Division Hyrox précise** dans l'assistant (§5.4), sans migration. D'accord ?

Rappel, non bloquant maintenant : **C-13** (« Faite » et le ressenti), soit avec l'espace sportif, soit avec un bouton « Marquer faite » pour le coach.

## 12. Ce que la phase 2 écrira, une fois validée

- les 3 migrations, puis la régénération de `database.types.ts` ;
- `src/domain/training/` :
  - `program-plan.ts` (brouillon, phases, semaines, séances) ;
  - `session-running.ts`, `session-strength.ts`, `session-hyrox.ts` ;
  - `program-session.ts` (lecture v1 et v2) ;
  - `aims.ts`, `hyrox-official.ts`, `scheduling.ts`, `publish-validation.ts` ;
- `src/features/programs/` :
  - `actions.ts`, `drafts.ts`, `templates.ts` ;
  - `queries.ts` et `session-display.ts` adaptés ;
- `supabase/seed.sql` ;
- les tests (§10) ;
- le suivi : `00_INDEX.md`, `SUIVI_IMPLEMENTATION.md`, `CARNET_TECHNIQUE.md`, et les OPEN-21 et OPEN-22 dans `docs/14`.

**Pas d'écran dans cette phase** : les écrans arrivent en phase 3, dans l'ordre validé.
