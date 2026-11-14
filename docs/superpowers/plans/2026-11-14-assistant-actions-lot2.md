# Assistant IA, lot 2 (fiche, exercice, PDF, document) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
> Exécution native dans la session, sans commit (Antonino commite) ; relecture indépendante à la fin.

**Goal:** l'Assistant IA propose, en cartes à valider, de compléter une fiche sportif, créer un exercice dans la Bibliothèque, donner les PDF d'un programme publié et importer un document joint par le coach.

**Architecture:** même chemin que le lot 1 (`docs/superpowers/plans/2026-11-13-assistant-actions-lot1.md`) : paramètres stricts dans `PARAMS` (proposals.ts), outil dans `WRITE_TOOLS` (tools/write.ts), vérifications d'appartenance dans `proposeAction`, résumé dans `summarize`, exécution dans `executeAssistantAction` (execute.ts) qui appelle la logique des formulaires existants, jamais une copie. Le document est la seule exception : le fichier reste dans le navigateur et part au clic « Valider » par une action serveur à part (`executeDocumentImport`), seuls son nom, son type et sa taille vont à Claude.

**Tech Stack:** Next.js 16 (actions serveur), Zod 4, SDK Anthropic (outils), Vitest, Playwright (faux Claude `ASSISTANT_FAKE_SCRIPT`, `tests/e2e/fixtures/assistant-script.json`).

**Spec:** `docs/superpowers/specs/2026-11-13-assistant-actions-design.md` (§5.3 tableau « lot 2 », « Importer un document », « PDF », §5.5, §5.6), validée par Antonino le 13/11 et confirmée le 14/11.

## Global Constraints

- Rien n'est exécuté avant « Valider » ; jamais d'envoi au sportif ; jamais de santé, de blessure, de note privée ni d'`organization_id` dans une proposition (schémas `z.strictObject`).
- « Compléter une fiche » : seulement les champs manquants ou demandés ; la carte montre chaque changement « ancien → nouveau » ; jamais le statut (archiver), jamais l'e-mail d'un sportif qui a activé son compte (règle d'`updateAthlete`).
- Exercice : exercice du coach (`source: "coach"`), sans photo ; même validation que « Créer un exercice ».
- PDF : seulement un programme publié ; les deux liens (Agenda, Fiches et repères) de la dernière version publiée ; pas d'envoi.
- Document : seuls le nom, le type et la taille sont envoyés à Claude, jamais le contenu ; 4 Mo au plus (règle d'`uploadDocument`) ; une conversation recommencée oublie le fichier ; le compte de démonstration refuse les fichiers (DEMO_NO_FILES, déjà dans `uploadDocument`).
- Aucun vrai appel à Claude dans les tests (faux Claude) ; textes en français, tutoiement.

## Review Focus

1. `completer_fiche` d'un sportif d'une autre organisation ou archivé : refusé dès la proposition, et à l'exécution.
2. `completer_fiche` ne doit vider aucun champ non proposé : l'exécuteur repart de la fiche actuelle (test : téléphone ajouté, adresse et niveau inchangés).
3. `preparer_pdf` d'un programme brouillon (jamais publié) : refusé avec « Ce programme n'est pas encore publié ».
4. Document : la carte « Valider » sans fichier en mémoire (conversation rechargée) dit « Joins à nouveau le fichier » au lieu d'échouer en silence.
5. Exercice au nom déjà pris dans la Bibliothèque du coach : la carte prévient (doublon possible), l'exécution suit la règle actuelle du formulaire.

---

### Task 1 : `voir_fiche` et `completer_fiche`

**Files:**
- Modify: `src/features/assistant/tools/definitions.ts` et `tools/read.ts` (outil `voir_fiche { sportif_id }` : prénom, nom, sexe, e-mail, téléphone, contact préféré, niveau, expérience, lieux, matériel, adresse ; ni santé, ni notes), `proposals.ts` (`completer_fiche`), `tools/write.ts`, `form-data.ts`, `execute.ts`, `src/components/blocks/assistant-card.tsx` (« Modifier » ouvre `…/sportifs/<id>?onglet=profil`)
- Test: `tests/unit/assistant-lot2.test.ts`, `tests/e2e/assistant-actions.spec.ts`, `tests/e2e/fixtures/assistant-script.json`

**Interfaces:**
- Produces: `PARAMS.completer_fiche = z.strictObject({ athleteId: z.uuid(), changes: z.strictObject({ firstName?, lastName?, sex?, email?, phone?, preferredContact?, level?, experience?, trainingPlaces?, equipment?, addressLine?, postalCode?, city?, country? }) })` avec au moins un champ ; `athleteUpdateFormData(current: AthleteFormValues & AddressFormValues, changes): FormData` (form-data.ts, pur) ; résumé « Prénom Nom » puis une ligne par champ « Téléphone : — → +32 470 12 34 56 ».

- [ ] **Step 1 : tests unitaires qui échouent** : schéma refuse `status`, `health`, un champ inconnu, `changes` vide ; `athleteUpdateFormData` garde tous les champs actuels et n'écrase que ceux de `changes` ; résumé avec « — » pour un champ vide.
- [ ] **Step 2 :** `npx vitest run tests/unit/assistant-lot2.test.ts` → FAIL.
- [ ] **Step 3 :** implémenter ; `proposeAction` charge la fiche (`getAthlete`), refuse si introuvable ou archivée, met l'ancienne valeur dans `names` pour le résumé ; l'exécuteur recharge la fiche, fusionne, appelle `updateAthlete(orgId, athleteId, blankState, formData)` et renvoie `href` = la fiche.
- [ ] **Step 4 :** tests → PASS.
- [ ] **Step 5 : parcours** (faux Claude) : « Ajoute le téléphone de Sarah : 0470 12 34 56 » → carte « Compléter la fiche » → Valider → la fiche affiche le téléphone, le niveau et l'adresse sont inchangés ; ordinateur et téléphone.

### Task 2 : `creer_exercice`

**Files:**
- Modify: `src/features/exercises/coach-actions.ts` (extraire le cœur `insertCoachExercise(orgId: string, userId: string, values: CoachExerciseValues, photo: null): Promise<{ ok: true; id: string } | { ok: false; error: string }>` appelé par `createCoachExercise` ET l'exécuteur ; la redirection reste dans le formulaire), `proposals.ts`, `tools/write.ts`, `execute.ts`, `assistant-card.tsx` (pas de « Modifier » : l'exercice se modifie ensuite dans sa page)
- Test: `tests/unit/assistant-lot2.test.ts`, `tests/unit/` existant des exercices du coach (doit rester vert), e2e

**Interfaces:**
- Produces: `PARAMS.creer_exercice = z.strictObject({ nameFr, category, equipment?, primaryMuscles?, bodyweight?, instructions?, videoUrl? })` avec les valeurs permises de `parseCoachExerciseForm` ; résumé : nom, catégorie, matériel, muscles.

- [ ] **Step 1 : tests qui échouent** : schéma (catégorie inconnue refusée, pas de photo) ; résumé.
- [ ] **Step 2 :** FAIL. **Step 3 :** extraire `insertCoachExercise`, brancher l'outil, `proposeAction` cherche un exercice du coach au même nom (sans casse) et ajoute « Un exercice porte déjà ce nom dans ta Bibliothèque » au résumé ; exécution → `href` = `/coach/bibliotheque/<id>`.
- [ ] **Step 4 :** PASS, et le parcours existant « Créer un exercice » (formulaire) reste vert.
- [ ] **Step 5 : parcours** : « Crée l'exercice Fentes sautées, poids du corps, quadriceps » → carte → Valider → la page de l'exercice existe.

### Task 3 : `preparer_pdf`

**Files:**
- Modify: `proposals.ts` (`PARAMS.preparer_pdf = z.strictObject({ programId: z.uuid() })`), `tools/write.ts`, `assistant-card.tsx` (carte sans « Valider » : deux liens « Agenda du programme » et « Fiches et repères » vers `…/programmes/<id>/pdf/agenda` et `…/pdf/fiches`, ouverts dans un nouvel onglet), `execute.ts` (refus explicite si appelée : rien à exécuter)
- Test: unitaire, e2e

- [ ] **Step 1 : tests qui échouent** : `proposeAction` refuse un brouillon jamais publié (« Ce programme n'est pas encore publié : publie-le d'abord ») et un programme d'une autre organisation ; résumé = titre, sportif, « Version N publiée le … ».
- [ ] **Step 2-4 :** FAIL → implémenter (`getPublishedProgram`) → PASS.
- [ ] **Step 5 : parcours** : « Donne-moi les PDF du programme de Lucas » → carte avec les deux liens, chacun renvoie un PDF (`content-type: application/pdf`).

### Task 4 : `importer_document` (bouton « Joindre »)

**Files:**
- Modify: `src/components/blocks/assistant.tsx` (bouton « Joindre » à côté du micro, un seul fichier, pastille nom + taille + retirer ; le `File` reste dans l'état du navigateur ; la demande envoyée porte en plus `attachment: { name, type, size }`), `src/features/assistant/actions.ts` (le message utilisateur reçoit la ligne « [Fichier joint : nom, type, taille] », rien d'autre), `proposals.ts` (`PARAMS.importer_document = z.strictObject({ name, categoryId?, athleteId? })`), `tools/write.ts` (refus s'il n'y a pas de fichier joint dans la demande), nouvelle action serveur `executeDocumentImport(organizationId: string, formData: FormData): Promise<ExecuteResult>` dans `execute.ts` (relit les paramètres dans le champ `params`, revalide le schéma, puis appelle `uploadDocument`), `assistant-card.tsx` (« Valider » envoie le fichier en mémoire ; sans fichier : « Joins à nouveau le fichier »), outil de lecture `voir_categories_de_documents`
- Test: unitaire, e2e (`setInputFiles` avec un petit PDF de test généré dans le test)

- [ ] **Step 1 : tests qui échouent** : la ligne envoyée à Claude ne contient que nom, type, taille ; schéma refuse `file`, `content` ; résumé « Document : Bilan.pdf (120 Ko) · Catégorie · Sportif ».
- [ ] **Step 2-4 :** FAIL → implémenter → PASS.
- [ ] **Step 5 : parcours** : joindre `bilan-test.pdf`, « Range ce document dans la fiche de Sarah » → carte → Valider → le document est dans l'onglet Documents de Sarah ; compte de démo : refus « Désactivé sur le compte de démonstration ».

### Task 5 : finition

- [ ] Consigne système (rules.ts / loop) : les 4 nouveaux outils et quand les utiliser ; `voir_fiche` avant `completer_fiche`.
- [ ] Captures téléphone et ordinateur, sombre et clair : les 4 cartes, la pastille du fichier joint.
- [ ] typecheck, lint, Vitest, format, suite Playwright complète ; 00_INDEX (D-181), SUIVI, CARNET, mémoire ; relecture indépendante de tout le lot.
