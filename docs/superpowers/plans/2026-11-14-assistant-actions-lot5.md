# Assistant IA, lot 5 (les sportifs : statut, disponibilités, objectifs, repères, Bibliothèque, photos, note) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
> Exécution native dans la session, sans commit (Antonino commite) ; relecture indépendante à la fin. Feu vert d'Antonino : « go pour lots 5 » (14/11).

**Goal:** l'Assistant IA fait, en cartes à valider, les 21 gestes des sportifs qui lui manquent : statut (actif, en pause, archivé) et discipline d'un sportif, disponibilités, objectifs (ajouter, modifier, atteint, abandonné, principal, supprimer), repères et records (ajouter, depuis un test, supprimer), Bibliothèque (favori, modifier ou supprimer un exercice du coach), photos (sportif ou coach, mettre ou retirer), et ajouter une note privée ; avec les lectures qui lui donnent les identifiants.

**Architecture:** comme le lot 4. Règles PURES dans `src/features/assistant/sportifs.ts` (schémas stricts, refus, lignes de carte, fusions), outils et contrôles dans `src/features/assistant/tools/sportifs.ts` (server-only, `proposeSportifs`), exécution dans `src/features/assistant/execute-sportifs.ts` (server-only, appelé par `executeAssistantAction` après `requireOrgAccess`). L'exécution relit l'état, fusionne les changements dans les valeurs ACTUELLES et appelle l'action du formulaire habituel. Les actions qui ne renvoient rien (`makeGoalMain`, `deleteGoal`, `setGoalStatus`, `deleteRecord`, `deleteReference`, `removeAthletePhoto`, `removeCoachPhoto`) sont précédées d'une relecture de la ligne (de l'organisation, du sportif) : introuvable = refus clair. La photo part du navigateur au « Valider », comme le document du lot 2.

**Tech Stack:** Next.js 16, Zod 4, SDK Anthropic (outils), Vitest, Playwright (faux Claude).

**Spec:** `docs/superpowers/specs/2026-11-13-assistant-actions-design.md` §5, élargie par la règle d'Antonino du 14/11 (« l'Assistant IA fait TOUT ») et ses décisions du 14/11, 19 h (lot 5 = les sportifs ; notes : ajouter, jamais lire).

## Global Constraints

- Une carte par action ; rien avant « Valider » ; « ancien → nouveau » pour chaque champ ; « (définitif) » pour une suppression ; conséquences avec les mots de l'interface.
- **Santé jamais** : `healthConstraints` (blessures) n'entre dans aucune lecture, aucune carte, aucun paramètre ; à l'exécution des disponibilités, il est repris TEL QUEL de la fiche relue. Ni notes de santé, ni accords.
- **Notes** (décision du 14/11) : `ajouter_note` AJOUTE un texte à la note privée du coach (relue côté serveur, jamais envoyée à Claude) ; la carte ne montre que le texte ajouté ; aucune lecture des notes.
- Modèles de formulaire : objectif = `GoalFormInput` + `parseGoalForm` ; record = `RecordFormInput` + `parseRecordForm` ; repère = `ReferenceFormInput` + `parseReferenceForm` ; test = `parseTestForm` ; exercice = `parseCoachExerciseForm` ; validés dès la proposition sur les valeurs fusionnées.
- Bibliothèque : un exercice Coory se met en favori, ne se modifie ni ne se supprime (comme l'interface).
- Photos : seulement le fichier JOINT (bouton « Joindre »), image, 2 Mo au plus (`PHOTO_MAX_BYTES`) ; Claude ne voit que nom, type et taille.
- Lectures bornées (100 lignes) ; aucun vrai appel à Claude dans les tests ; données de test remises en état par `supabase/seed-tests-assistant.sql`.

## Review Focus

1. Disponibilités modifiées pour un sportif qui a des blessures notées : elles restent intactes, et n'apparaissent ni sur la carte ni chez Claude.
2. Ajouter une note à un sportif qui en a déjà une : l'ancienne reste, la nouvelle s'ajoute dessous ; jamais d'écrasement.
3. Archiver un sportif : la carte dit ce que l'interface dit (il quitte les listes, ses données restent) ; un sportif archivé se réactive.
4. Modifier un exercice Coory ou d'une autre organisation : refus, aucune carte.
5. « Objectif principal » sur un objectif déjà principal, ou statut sur un objectif déjà atteint : refus clair plutôt qu'une carte sans effet.

---

### Task 1 : règles pures (`sportifs.ts`) et lectures

**Files:** Create `src/features/assistant/sportifs.ts` ; Modify `src/features/assistant/proposals.ts` (kinds, `PARAMS`, union, `summarize` délègue à `summarizeSportifs`), `src/features/assistant/tools/shape.ts` (`shapeAthleteSheet` gagne `discipline` et `disponibilites` SANS blessures ; `shapeGoals`, `shapeReferences`) ; Test `tests/unit/assistant-lot5.test.ts`

**Interfaces — Produces** `SPORTIFS_PARAMS` (17 kinds) :
- `statut_sportif { athleteId, statut: "active" | "paused" | "archived" }` ; `discipline_sportif { athleteId, discipline: DISCIPLINES }` ;
- `disponibilites { athleteId, changes: { sessionsPerWeek?: 1..14 | null, maxSessionMinutes?: 10..300 | null, availableDays?: WEEK_DAYS[], scheduleConstraints?: texte ≤ 500 | null } }` (≥ 1 champ ; aucun champ santé) ;
- `ajouter_objectif { athleteId, objectif: { goalType, priority?, targetDate?, targetTime?, isCompetition?, competitionName?, competitionLocation?, hyroxCategory?, description? } }` ; `modifier_objectif { athleteId, goalId, changes: mêmes champs facultatifs, null efface }` ; `statut_objectif { athleteId, goalId, statut: "atteint" | "abandonne" | "principal" }` ; `supprimer_objectif { athleteId, goalId }` ;
- `ajouter_repere { athleteId, repere: ReferenceFormInput sans champ libre inconnu }` ; `reperes_depuis_test { athleteId, test: "cooper" | "5k", distance?, time?, measuredOn, zones? }` ; `supprimer_repere { athleteId, referenceId }` ; `ajouter_record { athleteId, record: RecordFormInput }` ; `supprimer_record { athleteId, recordId }` ;
- `favori_exercice { exerciseId, favori: boolean }` ; `modifier_exercice { exerciseId, changes: { name?, category?, muscleGroups?, equipment? (EQUIPMENT_KEYS | null), instructions?, videoUrl? | null } }` ; `supprimer_exercice { exerciseId }` ;
- `photo { action: "mettre" | "retirer", athleteId? }` (sans `athleteId` : la photo du coach) ;
- `ajouter_note { athleteId, texte: 1..2000 }`.
- Produces les fusions pures `mergeAvailability(current, changes)`, `mergeGoal(current: GoalFormInput, changes)`, `mergeCoachExercise(current, changes)` et le texte de note `appendNote(existing: string | null, texte: string, today: string): string` (« ancien\n\n14/11/2026 : texte » ; vide → seulement la ligne datée).
- Produces les refus purs : `goalStatusRefusal(goal, statut)` (déjà principal, déjà atteint/abandonné) ; `coachExerciseRefusal(exercise)` (Coory ou introuvable) ; `photoRefusal(attachment, action)` (pas de fichier, pas une image, > 2 Mo ; `retirer` sans photo).
- Produces `summarizeSportifs(action, names, currency)` ; titres : « Statut du sportif », « Discipline du sportif », « Disponibilités », « Nouvel objectif », « Modifier l'objectif », « Objectif atteint » / « Objectif abandonné » / « Objectif principal », « Supprimer l'objectif », « Nouveau repère », « Repères depuis un test », « Supprimer le repère », « Nouveau record », « Supprimer le record », « Favori » / « Retirer des favoris », « Modifier l'exercice », « Supprimer l'exercice », « Photo du sportif » / « Photo du coach » (mettre / retirer), « Ajouter à la note privée ».

- [ ] **Step 1 : tests qui échouent** : un schéma par famille (champ inconnu, `healthConstraints` dans `disponibilites.changes` refusé) ; `appendNote(null, "Préfère le matin", "2026-11-14")` = « 14/11/2026 : Préfère le matin » et `appendNote("Ancienne note", …)` = « Ancienne note\n\n14/11/2026 : Préfère le matin » ; carte « Disponibilités » : « Séances par semaine : 2 → 3 », « Jours : lundi, jeudi → lundi, mercredi, vendredi » ; carte « Statut du sportif » archivé : « Statut : Actif → Archivé » et la phrase de l'interface ; carte « Ajouter à la note privée » : seulement le texte ajouté ; `shapeAthleteSheet` n'a aucune clé contenant « sante » ou « blessure » ; refus : objectif déjà principal, exercice Coory, photo non image ou > 2 Mo.
- [ ] **Step 2-4 :** FAIL → implémenter → PASS ; typecheck vert (exécution provisoire « fail » pour les 17 kinds, remplacée à la tâche 2).

### Task 2 : serveur (outils, contrôles, exécution, photo, lectures)

**Files:** Create `src/features/assistant/tools/sportifs.ts` (`SPORTIFS_TOOLS`, `proposeSportifs(orgId, kind, params, names, context)`), `src/features/assistant/execute-sportifs.ts` (`executeSportifs(orgId, userId, action)`) ; Modify `tools/write.ts`, `execute.ts` (délégation ; action « use server » `executePhotoUpload(organizationId, formData)` qui revalide puis appelle `uploadAthletePhoto` / `uploadCoachPhoto`), `src/components/blocks/assistant.tsx` (une carte `photo` « mettre » part avec le fichier joint, comme `importer_document`), `tools/definitions.ts` + `tools/read.ts` + `loop.ts` (`voir_objectifs { sportif_id }`, `voir_reperes { sportif_id }` : repères et records), `rules.ts` (consigne).

**Interfaces:** Consumes Task 1. `proposeSportifs` : sportif de l'organisation (actif, ou archivé seulement pour `statut_sportif`), objectif / repère / record du sportif, exercice du coach (`getCoachExercise` + organisation), fichier joint pour `photo` mettre ; formulaire habituel validé sur les valeurs fusionnées ; `names` = valeurs « avant » et noms.

- [ ] **Step 1 :** implémenter ; vérifier typecheck, lint, Vitest complet.
- [ ] **Step 2 :** relecture ciblée du point santé : aucune lecture ni carte ne contient `healthConstraints` (grep), test unitaire du shape.

### Task 3 : données de test et parcours

**Files:** Modify `supabase/seed-tests-assistant.sql` (deux sportifs de test du coach B à identifiants fixes, « Léa Test » pour l'ordinateur et « Noah Test » pour le téléphone, avec une note privée existante, un objectif, un repère, un record, des disponibilités ET une blessure notée ; un exercice du coach B par appareil), `tests/e2e/fixtures/assistant-script.json` ; Test `tests/e2e/assistant-actions.spec.ts`

- [ ] **Step 1 : parcours qui échouent** (ordinateur = Léa, téléphone = Noah) : (a) disponibilités changées → la fiche (onglet Disponibilités) les montre ET la blessure est intacte ; (b) une note ajoutée → l'onglet Notes montre l'ancienne note ET la nouvelle ; (c) objectif ajouté puis rendu principal ; (d) repère supprimé et record ajouté ; (e) archiver le sportif → il quitte la liste des sportifs actifs ; (f) exercice du coach renommé ; (g) un exercice Coory à modifier → aucune carte.
- [ ] **Step 2-3 :** implémenter les données → parcours verts sur les deux appareils, rejoués deux fois (remise en état).

### Task 4 : finition

- [ ] Captures téléphone et ordinateur, sombre et clair : « Disponibilités », « Ajouter à la note privée ».
- [ ] typecheck, lint, Vitest, format, suite Playwright complète ; 00_INDEX (D-184), SUIVI, CARNET, mémoire (retirer le lot 5 de « Reste avant Gianluca ») ; relecture indépendante.
