# Assistant IA, lot 3b (tout faire sur les programmes et les modèles) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
> Exécution native dans la session, sans commit (Antonino commite) ; relecture indépendante à la fin.

**Goal:** l'Assistant IA fait, en cartes à valider, TOUT ce que le coach fait à la main sur un programme et sur ses modèles : chaque geste de l'éditeur (séances, semaines, phases, jours, titre, discipline, dates, objectif, façon de viser) et chaque action (publier, archiver, désarchiver, dupliquer, enregistrer comme modèle), sans jamais écraser un brouillon modifié entre-temps.

**Architecture:** les gestes de l'éditeur existent déjà en fonctions PURES (`src/domain/training/plan-edit.ts` : addWeek, removeWeek, setWeekLight, duplicateWeekTo, addSession, moveSession, moveSessionTo, duplicateSession, removeSession, replaceSession, addPhase, renamePhase, setPhaseRange, removePhase…). Un moteur pur (`src/features/assistant/program-edit.ts`) traduit chaque opération de l'assistant en l'appel de CES fonctions (jamais de copie de règle), puis valide le résultat (`programDraftSchema` ou `programPlanSchema`) et le décrit pour la carte. Une lecture `voir_brouillon` (sommaire, puis 1 ou 2 semaines détaillées) donne à Claude les clés et le contenu. Les actions de programme appellent les actions serveur existantes (`publishProgram`, `archiveProgram`, `unarchiveProgram`, `duplicateProgram`, `saveProgramAsTemplate`, `saveSessionAsTemplate`, `updateTemplate`, `duplicateTemplate`, `archiveTemplate`, `createProgramTemplate`).

**Tech Stack:** Next.js 16, Zod 4, SDK Anthropic (outils), Vitest, Playwright (faux Claude).

**Spec:** `docs/superpowers/specs/2026-11-13-assistant-actions-design.md` §5.3, ÉLARGIE par la règle d'Antonino du 14/11/2026 (mémoire « L'Assistant IA fait TOUT ») : tout geste manuel est ouvert à l'assistant, par carte validée ; « jamais de publication, jamais d'archivage » de la spec est remplacé. Exceptions décidées : données de santé et sécurité du compte (hors de ce lot de toute façon).

## Global Constraints

- Une carte à valider pour chaque proposition ; rien avant le clic ; la carte dit chaque changement en clair, et « Définitif » pour une suppression qui ne se rattrape pas.
- Brouillon : la proposition note la révision lue par le SERVEUR ; à l'exécution, révision différente → « Le brouillon a changé depuis la proposition : rien n'a été modifié. Redemande à l'assistant. » (même règle pour un modèle avec sa `version`). Programme publié : les changements vont dans le brouillon ; la carte le dit ; « Publier » est une carte à part.
- Chaque opération appelle la fonction de `plan-edit.ts` (ou la règle existante des dates, de l'objectif, des jours fixes) ; le résultat passe `programDraftSchema` (programme) ou `programPlanSchema` (modèle) ; contenu de séance validé par `sessionBodySchema`, durée recalculée, exercices de la Bibliothèque vérifiés.
- Publication : les MÊMES contrôles que le bouton « Publier » (bloquants : refus ; avertissements : écrits sur la carte).
- Modèles Coory : lecture seule (comme l'interface) : seulement « Dupliquer dans Mes modèles ».
- `voir_brouillon` : sommaire sans contenu, ou 2 semaines détaillées au plus (une demande est bornée à 80 000 caractères ; un marathon de 16 semaines en fait ~90 000).
- 20 opérations au plus par carte ; aucun vrai appel à Claude dans les tests ; données de santé et sécurité du compte jamais concernées.

## Review Focus

1. Deux cartes sur le même brouillon validées l'une après l'autre : la seconde est refusée (révision), rien n'est écrasé.
2. Retirer une semaine qui contient des séances, ou une phase : même résultat qu'à la main (phases recalées, brouillon valide).
3. Publier un programme qui a un problème bloquant : refus avec la raison ; avec un avertissement : la carte l'affiche avant « Valider ».
4. Programme d'une autre organisation, programme archivé (sauf « Désarchiver »), modèle Coory à modifier : refus, aucune carte.
5. Programme publié sans brouillon enregistré (révision 0) : la modification crée le brouillon, la version publiée ne bouge pas.

---

### Task 1 : lecture `voir_brouillon` (et `voir_modele`)

**Files:** Create `src/features/assistant/program-edit.ts` ; Modify `tools/definitions.ts`, `tools/read.ts`, `loop.ts` ; Test `tests/unit/assistant-lot3b.test.ts`

**Interfaces:** Produces `outlineDraft(plan: ProgramPlan | ProgramDraft, meta: { revision: number; status: string }): DraftOutline` (titre, discipline, dates, objectif, statut, révision, phases, semaines `{ semaine, phase, allegee, organisation, seances: [{ cle, titre, discipline, jour?, resume }] }`) et `weekDetail(plan, weeks: number[]): WeekDetail[]` (contenu complet des séances).

- [ ] **Step 1 : tests qui échouent** : sommaire du modèle « Hybride 3+2 » : 8 semaines × 5 séances, une ligne chacune, < 15 000 caractères en JSON ; détail des semaines [2, 3] complet ; 3 semaines refusées.
- [ ] **Step 2-4 :** FAIL → implémenter (`voir_brouillon { programme_id, semaines? }` par `loadDraft` ; `voir_modele { modele_id, semaines? }` par `getProgramTemplate`) → PASS.

### Task 2 : moteur pur des opérations

**Files:** Modify `src/features/assistant/program-edit.ts` ; Test `tests/unit/assistant-lot3b.test.ts`

**Interfaces:** Produces `type ProgramEdit` (union discriminée par `op`) et :
- séances : `ajouter_seance { semaine, seance, jour?, heure?, moment? }`, `modifier_seance { cle, seance }`, `dupliquer_seance { cle, semaine? }`, `supprimer_seance { cle }`, `deplacer_seance { cle, semaine, position? }`, `jour_seance { cle, jour: Weekday | null, heure?, moment? }` ;
- semaines : `ajouter_semaine {}`, `retirer_semaine { semaine }`, `semaine_allegee { semaine, allegee }`, `dupliquer_semaine { source, vers: number[] }`, `organisation_semaine { semaine, mode: "ordered" | "fixed" }` ;
- phases : `ajouter_phase { nom }`, `renommer_phase { phase, nom }`, `semaines_phase { phase, de, a }`, `retirer_phase { phase }` ;
- programme : `titre { titre }`, `discipline { discipline }`, `debut { date }` (lundi, comme « Modifier les dates »), `objectif { course?, date?, categorie_hyrox?, note? }`, `viser { running?, strength? }`.
- `applyProgramEdits(plan, edits, kind: "program" | "template"): { ok: true; plan } | { ok: false; error }` et `describeProgramEdits(plan, edits): string[]`.

- [ ] **Step 1 : tests qui échouent**, un par famille, chacun comparé à l'appel direct de la fonction de `plan-edit.ts` (même résultat) : remplacer un exercice (« Semaine 2 · Full body A : Back squat → Presse à cuisses ») ; supprimer une séance (« Semaine 3 : « Seuil » supprimée ») ; retirer la semaine 4 (phases recalées, « Semaine 4 retirée (5 séances) ») ; dupliquer la semaine 2 vers 5 et 6 ; semaine allégée ; nouvelle phase et ses semaines ; titre, discipline (« Running → Hybride »), début au lundi (une date mercredi revient au lundi), objectif, façon de viser ; jour fixe sur une semaine « dans l'ordre » refusé comme dans l'éditeur ; clé, semaine ou phase inconnue : refus qui la nomme ; 21 opérations : refus ; un modèle refuse `debut` et `objectif` (pas de dates ni de sportif).
- [ ] **Step 2-4 :** FAIL → implémenter → PASS.

### Task 3 : `modifier_programme` et `modifier_modele`

**Files:** Modify `proposals.ts` (`PARAMS.modifier_programme = { programId, revision, operations }`, `PARAMS.modifier_modele = { templateId, version, operations }`, titres, résumés), `tools/write.ts` (outils ; `proposeAction` : charge, refuse archivé / autre organisation / modèle Coory, applique pour VALIDER, vérifie les exercices, REMPLACE révision ou version par celle du serveur, lignes de `describeProgramEdits`, mention « brouillon à publier » si publié), `execute.ts` (recharge, révision différente = refus, applique, `saveDraft` ou `updateTemplate`, lien vers l'éditeur sur la première semaine touchée), `supabase/seed.sql` (deux brouillons du coach B à identifiants fixes, Sarah et Hugo, 4 semaines, 2 phases : un par appareil de test), fixture du faux Claude
- Test: `tests/unit/assistant-lot3b.test.ts`, `tests/e2e/assistant-actions.spec.ts`

- [ ] **Step 1 : tests qui échouent** : schémas stricts (opération inconnue, 21 opérations, champ inconnu refusés) ; résumé (titre, sportif, une ligne par opération, « Définitif » pour une suppression, mention du brouillon) ; règle pure `revisionConflict(expected, current)`.
- [ ] **Step 2-4 :** FAIL → implémenter → PASS.
- [ ] **Step 5 : parcours** (faux Claude, ordinateur = brouillon de Sarah, téléphone = celui de Hugo) : `voir_brouillon` puis une carte qui remplace un exercice, retire une semaine et renomme le programme → Valider → l'éditeur montre les trois changements ; programme d'une autre organisation → aucune carte.

### Task 4 : actions de programme et de modèle

**Files:** Modify `proposals.ts`, `tools/write.ts`, `execute.ts`, `assistant-card.tsx` (avertissements de publication sur la carte), e2e
- Cartes : `publier_programme { programId }` (contrôles de la publication faits à la proposition : bloquant → refus ; avertissements → lignes de la carte ; exécution par `publishProgram` avec la révision notée), `archiver_programme`, `desarchiver_programme`, `dupliquer_programme { programId }`, `enregistrer_comme_modele { programId, titre }`, `enregistrer_seance_comme_modele { programId, cle, titre }`, `dupliquer_modele { templateId }` (Coory ou du coach → Mes modèles), `archiver_modele { templateId }`, `creer_modele { titre, discipline, semaines, seancesParSemaine }` (`createProgramTemplate`, vide).

- [ ] **Step 1 : tests qui échouent** : schémas ; résumés (« Publier « Préparation 10 km » · version 2 · Sarah Vermeulen », avertissements recopiés) ; refus pur d'un programme archivé pour toute action sauf désarchiver.
- [ ] **Step 2-4 :** FAIL → implémenter → PASS.
- [ ] **Step 5 : parcours** : publier le brouillon de test → la fiche du sportif montre la version publiée ; archiver puis désarchiver ; dupliquer un modèle Coory dans Mes modèles.

### Task 5 : finition

- [ ] Consigne : tous ces gestes, comment lire un programme (sommaire puis 1-2 semaines), carte unique pour plusieurs changements du même brouillon, publier seulement quand le coach le demande.
- [ ] Captures téléphone et ordinateur, sombre et clair : carte de modification (avec suppression), carte de publication (avec avertissement).
- [ ] typecheck, lint, Vitest, format, suite Playwright complète ; 00_INDEX (D-182), SUIVI, CARNET, mémoire ; relecture indépendante du lot.
