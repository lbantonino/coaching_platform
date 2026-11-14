# Assistant IA, lot 4 (le quotidien : agenda, comptabilité, tâches, documents) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
> Exécution native dans la session, sans commit (Antonino commite) ; relecture indépendante à la fin.

**Goal:** l'Assistant IA fait, en cartes à valider, les 22 gestes du quotidien qui lui manquent : modifier, supprimer ou « dé-payer » une séance de l'agenda ; supprimer un paiement ou une dépense, arrêter une dépense mensuelle, gérer les catégories de dépenses ; cocher, modifier, supprimer une tâche, vider les terminées, modifier ou supprimer une liste ; modifier ou supprimer un document, gérer les catégories de documents ; avec les lectures qui lui donnent les identifiants.

**Architecture:** comme les lots 2 et 3b. Règles PURES dans un nouveau module `src/features/assistant/daily.ts` (schémas stricts, refus, lignes de carte), outils et contrôles dans `src/features/assistant/tools/daily.ts` (server-only), exécution dans `src/features/assistant/execute-daily.ts` (server-only, appelé par `executeAssistantAction` APRÈS `requireOrgAccess` ; jamais un fichier « use server », dont chaque export serait appelable du navigateur). L'exécution appelle l'action du formulaire ou du bouton habituel ; quand cette action redirige (`updateSession`, `deleteSession`) ou ne renvoie rien (`deletePayment`, `deleteExpense`, `stopExpense`), son cœur est extrait dans un fichier server-only qu'elle appelle elle-même (même modèle que `create-exercise.ts`, lot 2). Une modification repart de l'état ACTUEL (relu au clic) et n'écrit que les champs de la carte.

**Tech Stack:** Next.js 16, Zod 4, SDK Anthropic (outils), Vitest, Playwright (faux Claude).

**Spec:** `docs/superpowers/specs/2026-11-13-assistant-actions-design.md` §5, élargie par la règle d'Antonino du 14/11/2026 (mémoire « L'Assistant IA fait TOUT ») et ses décisions du 14/11, 19 h : trois lots (4 quotidien, 5 sportifs, 6 réglages) ; jamais santé ni sécurité du compte.

## Global Constraints

- Une carte par action ; rien avant « Valider » ; la carte dit chaque changement « ancien → nouveau » (« — » pour un champ vide) et les conséquences avec les mots de l'interface ; « (définitif) » pour toute suppression.
- Phrases reprises de l'interface : séance répétée supprimée « toutes ses dates seront supprimées » ; dépense mensuelle supprimée « Elle disparaît de TOUS les mois » ; paiement supprimé « il disparaît des chiffres » ; arrêter « ne compte plus après aujourd'hui, le passé reste ».
- Conséquences à écrire sur la carte : séance supprimée → « les paiements déjà notés restent » ; paiement d'une date de séance supprimé → « la séance du … redevient à encaisser » ; catégorie supprimée → « ses N dépenses (documents) restent, sans catégorie » ; liste supprimée → « ses N tâches restent, sans liste ».
- Noms d'outils de l'agenda suffixés `_agenda` (`modifier_seance_agenda`, `supprimer_seance_agenda`) : jamais confondus avec les opérations `modifier_seance` / `supprimer_seance` d'un programme (relecture du lot 3b, n°11).
- Chaque identifiant est vérifié dans l'organisation à la proposition (refus = aucune carte) ET par l'action au clic.
- Lectures bornées à 100 lignes ; jamais le contenu d'un document ; jamais santé ni notes d'un sportif.
- Aucun vrai appel à Claude dans les tests ; données de test sans le marqueur de nettoyage, remises en état par `supabase/seed-tests-assistant.sql`.

## Review Focus

1. Séance répétée : « modifier » change toute la série (comme le formulaire) et la carte le dit ; la date d'un seul jour reste `deplacer_seance`.
2. « Arrêter » une dépense non mensuelle, déjà arrêtée ou qui commence plus tard : refus (sinon l'action ne fait rien et la carte mentirait).
3. Deux cartes sur la même tâche (modifier puis supprimer) validées dans le désordre : la seconde échoue avec un message clair, rien de faux n'est écrit.
4. Séance collective : la liste des inscrits remplace l'ancienne, chaque sportif est de l'organisation ; le sportif d'une séance individuelle ne change pas (refus à la proposition).
5. Paiement lié à une date de séance supprimé : la date redevient à encaisser, et la carte l'annonce.

---

### Task 1 : cœurs partagés et lecteurs sans redirection

**Files:** Create `src/features/sessions/session-core.ts` (server-only), `src/features/billing/billing-core.ts` (server-only) ; Modify `src/features/sessions/actions.ts`, `src/features/billing/payment-actions.ts`, `src/features/billing/expense-actions.ts`, `src/features/tasks/queries.ts`, `src/features/documents/queries.ts`, `src/app/(coach)/coach/o/[orgId]/agenda/seances/[sessionId]/modifier/page.tsx`, `src/features/sessions/schemas.ts` ; Test `tests/unit/assistant-lot4.test.ts`

**Interfaces:**
- Produces (pur, `src/features/sessions/schemas.ts`) : `sessionFormInitial(session: CoachSession, enrolledIds: string[]): SessionFormInitial` (le `initial` que la page « Modifier la séance » construit aujourd'hui, déplacé ici ; la page l'appelle).
- Produces (server-only) : `saveSessionChanges(orgId: string, userId: string, session: CoachSession, formData: FormData): Promise<{ ok: true } | { ok: false; error: string }>` et `removeCoachSession(orgId: string, sessionId: string): Promise<{ ok: boolean }>` ; `updateSession` / `deleteSession` les appellent puis gardent leur `redirect`.
- Produces (server-only) : `removePayment(orgId, paymentId)`, `removeExpense(orgId, expenseId)`, `endExpense(orgId, expenseId)` → `Promise<{ ok: boolean }>` (`ok` = une ligne touchée) ; les actions existantes gardent leur signature `Promise<void>` et les appellent.
- Produces : `getTask(orgId: string, taskId: string): Promise<CoachTask | null>` (tasks/queries.ts) ; `getDocument(orgId: string, documentId: string): Promise<CoachDocument | null>` (documents/queries.ts).

- [ ] **Step 1 : tests qui échouent** : `sessionFormInitial` d'une séance collective répétée à 6550 centimes → `price: "65,50"` (6500 → `"65"`, règle actuelle de la page), TVA 8,1 → `applyVat: true, vatRate: "8,1"`, inscrits dans `athleteIds` ; d'une séance individuelle → `athleteId` rempli, `athleteIds: []`.
- [ ] **Step 2-4 :** FAIL → déplacer le code (aucune règle nouvelle) → PASS ; `npm run typecheck` vert (la page compile avec le helper).

### Task 2 : règles pures du lot 4 (`daily.ts`) et lectures (`shape.ts`)

**Files:** Create `src/features/assistant/daily.ts` ; Modify `src/features/assistant/proposals.ts` (les 16 kinds rejoignent `AssistantActionKind`, `PARAMS`, `assistantActionSchema`, `TITLES` ; `summarize` délègue à `summarizeDaily`), `src/features/assistant/tools/shape.ts` ; Test `tests/unit/assistant-lot4.test.ts`

**Interfaces:**
- Produces `DAILY_PARAMS` (schémas stricts) :
  - `modifier_seance_agenda { sessionId, changes: { title?, discipline?, location?, startsOn?, startTime?, durationMinutes?, repeatsWeekly?, endsOn? (date | null), athleteIds? (collective), price? (nombre | null), vatRate?, vatIncluded?, paymentMethod?, notes? } }` (≥ 1 champ) ;
  - `supprimer_seance_agenda { sessionId }` ; `marquer_seance_non_payee { sessionId, sessionDate }` ;
  - `supprimer_paiement { paymentId }` ; `supprimer_depense { expenseId }` ; `arreter_depense { expenseId }` ;
  - `categorie_depenses` et `categorie_documents` : union par `action` : `{ action: "creer", nom }`, `{ action: "renommer", categoryId, nom }`, `{ action: "couleur", categoryId, couleur: CATEGORY_COLORS }`, `{ action: "supprimer", categoryId }` ;
  - `cocher_tache { taskId, faite: boolean }` ; `modifier_tache { taskId, changes: { title?, priority?, dueOn? (date | null), listId? (uuid | null), athleteId? (uuid | null), notes? } }` ; `supprimer_tache { taskId }` ; `supprimer_taches_terminees {}` ; `modifier_liste_de_taches { listId, nom?, couleur?: LIST_COLORS }` ; `supprimer_liste_de_taches { listId }` ;
  - `modifier_document { documentId, changes: { name?, categoryId? (uuid | null), athleteId? (uuid | null) } }` ; `supprimer_document { documentId }`.
- Produces les refus purs : `stopExpenseRefusal(expense: { repeatsMonthly: boolean; spentOn: string; endsOn: string | null } | null, today: string): string | null` (même condition que `stopExpense` : mensuelle, commencée, pas déjà finie) ; `individualAthleteRefusal(session, changes)` (changer `athleteIds` d'une séance individuelle) ; `unpaidRefusal(payments, sessionDate)` (aucun paiement à cette date).
- Produces `summarizeDaily(action, names): { title: string; summary: string[] }` ; titres : « Modifier la séance », « Supprimer la séance », « Séance plus payée », « Supprimer le paiement », « Supprimer la dépense », « Arrêter la dépense », « Nouvelle catégorie » / « Renommer la catégorie » / « Couleur de la catégorie » / « Supprimer la catégorie », « Tâche faite » / « Tâche à refaire », « Modifier la tâche », « Supprimer la tâche », « Vider les tâches terminées », « Modifier la liste », « Supprimer la liste », « Modifier le document », « Supprimer le document ».
- Produces (shape.ts) : `shapeTasks`, `shapePayments`, `shapeExpenses`, `shapeDocuments` (id, libellés lisibles, montants avec devise, dates ; 100 lignes au plus ; jamais de contenu de document).

- [ ] **Step 1 : tests qui échouent** : un schéma par famille (champ inconnu, id invalide, `changes` vide refusés) ; « Modifier la séance » d'une série : lignes « Titre : Coaching → Coaching force », « Heure : 18:00 → 19:00 », « Toute la série (chaque semaine) » ; « Supprimer la séance » répétée : « toutes ses dates seront supprimées (définitif) » et « Les paiements déjà notés restent » ; `stopExpenseRefusal` : non mensuelle, déjà arrêtée (`endsOn ≤ today`), future (`spentOn > today`) → refus, sinon `null` ; « Supprimer le paiement » lié à une date : « La séance du mardi 10 novembre 2026 redevient à encaisser » ; « Supprimer la catégorie » : « Ses 3 dépenses restent, sans catégorie (définitif) » ; « Vider les tâches terminées » : « 4 tâches terminées (définitif) » ; `individualAthleteRefusal` : `athleteIds` sur une séance individuelle → refus ; `shapeTasks` borné à 100 et sans champ inconnu.
- [ ] **Step 2-4 :** FAIL → implémenter → PASS.

### Task 3 : outils, contrôles, exécution, lectures et parcours

**Files:** Create `src/features/assistant/tools/daily.ts` (server-only : `DAILY_TOOLS`, `proposeDaily(orgId, kind, params, names): Promise<{ ok: true; params } | { ok: false; error }>`), `src/features/assistant/execute-daily.ts` (server-only : `executeDaily(orgId, userId, action): Promise<ExecuteResult>`) ; Modify `tools/write.ts` (pousse `DAILY_TOOLS`, appelle `proposeDaily`), `execute.ts` (délègue les 16 kinds), `tools/definitions.ts` + `tools/read.ts` + `loop.ts` (`voir_taches { statut?, sportif_id?, liste_id? }`, `voir_paiements { sportif_id?, du?, au? }`, `voir_depenses { du?, au? }`, `voir_documents { sportif_id?, categorie_id? }`), `supabase/seed-tests-assistant.sql` (lignes de test à identifiants fixes, une série par appareil : séance répétée de Sarah / Hugo, deux tâches, un paiement lié à une date, une dépense mensuelle, un document, une catégorie de dépenses), `tests/e2e/fixtures/assistant-script.json`
- Test: `tests/e2e/assistant-actions.spec.ts`

**Interfaces:**
- Consumes Task 1 (cœurs, `getTask`, `getDocument`, `sessionFormInitial`) et Task 2 (schémas, refus, `summarizeDaily`, shapes).
- `proposeDaily` : vérifie chaque identifiant dans l'organisation (séance via `getSession`, tâche via `getTask`, document via `getDocument`, paiement / dépense / catégorie / liste par requête filtrée sur `organization_id`), applique les refus purs, remplit `names` (valeurs « avant », nom du sportif, nombres de lignes touchées).
- `executeDaily` : relit l'état, refait le refus pur, fusionne `changes` dans les valeurs ACTUELLES (`sessionFormInitial`, valeurs de la tâche ou du document) puis appelle l'action ou le cœur ; `href` vers la page qui montre le résultat (séance, Comptabilité, Tâches, Documents).

- [ ] **Step 1 : parcours qui échouent** (faux Claude, ordinateur = lignes de Sarah, téléphone = lignes de Hugo) : (a) modifier la séance de test (titre et heure) → Valider → la page de la séance montre le nouveau titre ; (b) supprimer la séance de test → elle n'est plus dans l'agenda (vue liste) ; (c) dans une même réponse : tâche cochée, tâche modifiée (échéance), liste supprimée → Tâches montre les trois changements ; (d) supprimer le paiement lié → la date redevient « à encaisser » ; arrêter la dépense mensuelle → « jusqu'au » aujourd'hui ; (e) renommer le document → Documents montre le nouveau nom ; (f) un identifiant d'une autre organisation → aucune carte ; (g) « modifie puis supprime la tâche » : deux cartes, « Supprimer » validée d'abord, puis « Modifier » → message « Tâche introuvable : elle a peut-être été supprimée. », rien d'écrit.
- [ ] **Step 2 :** vérifier qu'aucun test existant du coach B (tâches, comptabilité, documents) ne compte des lignes que la graine de test ajoute ; sinon rattacher ces lignes à des valeurs qu'aucun compte ne voit, et le noter dans le registre.
- [ ] **Step 3-4 :** implémenter → parcours verts sur les deux appareils, nettoyage de fin de suite qui remet chaque ligne (y compris supprimée) en place.

### Task 4 : finition

- [ ] Consigne : ces gestes, lire avant d'agir (voir_agenda, voir_taches, voir_paiements, voir_depenses, voir_documents), « modifier » une série = toute la série, une seule date = deplacer_seance, une suppression est définitive.
- [ ] Captures téléphone et ordinateur, sombre et clair : carte « Modifier la séance », carte « Supprimer le paiement ».
- [ ] typecheck, lint, Vitest, format, suite Playwright complète ; 00_INDEX (D-183), SUIVI, CARNET, mémoire (retirer le lot 4 de la liste « Reste avant Gianluca ») ; relecture indépendante du lot.
