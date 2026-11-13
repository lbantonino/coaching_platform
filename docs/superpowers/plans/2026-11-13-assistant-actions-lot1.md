# Assistant IA qui agit : lot 1, plan de construction

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal :** l'Assistant IA de Coory propose, sous forme de cartes à valider, huit actions (créer un
sportif, créer une séance, déplacer une séance, marquer une séance payée, noter un paiement, noter
une dépense, créer une tâche, créer une liste de tâches), et les exécute au clic « Valider ».

**Architecture :** une demande du coach = une réservation `assistant_usage` puis des **étapes** :
chaque appel à l'action serveur `askAssistant` fait UN appel au modèle. Les outils de lecture sont
exécutés et l'étape suivante est relancée par le navigateur ; les outils d'écriture deviennent des
**propositions** (cartes). `executeAssistantAction` exécute une proposition en passant par les
actions existantes, sans appeler Claude.

**Tech Stack :** Next.js 16 (actions serveur), TypeScript strict, Zod 4, Supabase (RLS, pgTAP),
`@anthropic-ai/sdk` 1.8 (boucle d'outils manuelle, `Anthropic.Tool`, `Anthropic.ToolUseBlock`,
`Anthropic.ToolResultBlockParam`, `Anthropic.MessageParam`), Vitest, Playwright.

**Spec :** `docs/superpowers/specs/2026-11-13-assistant-actions-design.md` (lire en entier).

## Global Constraints

- Rien ne change dans Coory sans le clic « Valider » ; aucun outil de suppression ni de publication.
- Abonnement obligatoire (`coory_plan = 'premium'`), 100 demandes par coach et par mois ; une
  demande du coach = 1, au plus **6 étapes** (appels au modèle), en moins de **5 minutes**.
- Modèle `claude-opus-5-5`, effort `medium`, `max_tokens` 4000 ; consigne et outils mis en cache
  (`cache_control: { type: "ephemeral" }` sur le dernier bloc système).
- Aucun champ de santé, d'accord de santé ni de note privée dans les outils ; jamais de contenu de
  document envoyé à Claude ; ligne sous la saisie : « N'écris pas de données de santé ici. »
- Jamais d'`organization_id` accepté du navigateur ni de Claude : il vient de `requireOrgAccess`.
- `executeAssistantAction` ne fait aucune confiance à la proposition (Zod + appartenance), et passe
  par la même logique que le formulaire habituel ; aucune règle copiée.
- Interface en français, tutoiement, pas de tiret long ; jetons de `src/styles/tokens.css`
  seulement ; téléphone d'abord, cibles de 44 px ; charger les compétences de design (Taste,
  Front-End Design, UX Pro Max, Apple Design, Emil) avant la tâche 6.
- Le modèle simulé (tests) n'est jamais actif sur Vercel (`process.env.VERCEL === "1"`).
- Pas de commit par l'agent : Antonino commite lui-même (les étapes « Commit » sont à remplacer par
  un point d'arrêt où l'on vérifie `git status`).

## Review Focus

1. **Deux sportifs au même prénom** (« Lucas ») : l'assistant doit demander lequel, jamais choisir ;
   une proposition dont le sportif n'est pas un identifiant de l'organisation est refusée (tâche 4).
2. **Double clic ou double exécution** : « Valider » cliqué deux fois, ou une carte déjà faite, ne
   crée qu'une fois la donnée (tâche 6).
3. **Carte liée dont la première est annulée ou échoue** : la seconde passe à « Impossible : … »
   sans rien exécuter (tâche 6).
4. **Dates relatives** (« mardi », « demain ») : la consigne donne la date du jour à Bruxelles et son
   jour de la semaine ; la carte affiche la date en toutes lettres (tâches 2 et 4).
5. **Paramètres faux venant du modèle** (date impossible, montant négatif, séance d'une autre
   organisation) : l'outil répond une erreur à Claude, aucune carte n'apparaît (tâche 4).

---

### Task 1 : Étapes d'une demande, en base

**Files :**
- Create : `supabase/migrations/20261114120000_assistant_etapes.sql`
- Create : `supabase/tests/database/43_assistant_etapes.test.sql`
- Modify : `src/lib/supabase/database.types.ts` (par `npm run db:types`)

**Interfaces :**
- Produces : colonne `assistant_usage.steps integer not null default 1` ; fonction
  `public.continue_assistant_use(p_id uuid) returns integer` (nouveau nombre d'étapes) ;
  `finish_assistant_use` ADDITIONNE désormais les jetons (`input_tokens = coalesce(input_tokens,0) +
  p_input_tokens`, idem sortie) et accepte d'être appelée à chaque étape tant que `status = 'pending'`
  (statut final seulement quand `p_status` vaut `'done'` ou `'failed'` ; nouveau statut d'étape
  `'step'` qui additionne sans clore).

- [ ] **Step 1 : écrire le test pgTAP** `43_assistant_etapes.test.sql`, sur le modèle de
  `41_assistant_abonnement.test.sql` (même coach A abonné) :
  - `continue_assistant_use` sur sa réservation renvoie 2, puis 3… jusqu'à 6 ; la 7e lève
    `etapes_epuisees` (P0001) ;
  - un autre coach : `acces_refuse` (42501) ;
  - réservation de plus de 5 minutes (`created_at` reculé de 6 min) : `demande_expiree` (P0001) ;
  - réservation close (`status = 'done'`) : `demande_expiree` ;
  - `finish_assistant_use(id, 'step', 'claude-opus-5-5', 100, 50)` deux fois puis `'done'` avec
    (10, 5) : `input_tokens = 210`, `output_tokens = 105`, `status = 'done'`.
- [ ] **Step 2 :** `npx supabase test db` → le nouveau fichier échoue (fonction absente).
- [ ] **Step 3 :** écrire la migration (`steps`, `continue_assistant_use` en `security definer`,
  `search_path = ''`, verrou consultatif par coach comme `reserve_assistant_use`, `finish` réécrit
  avec `'step'`), droits `execute` à `authenticated` seulement, retour arrière en commentaire.
- [ ] **Step 4 :** `npx supabase migration up --local` puis `npx supabase test db` → tout passe ;
  `npm run db:types`.
- [ ] **Step 5 :** point d'arrêt (`git status`).

### Task 2 : Modèle (réel ou simulé) et étape de la boucle

**Files :**
- Create : `src/features/assistant/model.ts`
- Create : `src/features/assistant/loop.ts`
- Modify : `src/features/assistant/rules.ts`
- Modify : `src/features/assistant/actions.ts`
- Test : `tests/unit/assistant-loop.test.ts`

**Interfaces :**
- Consumes : tâche 1 (`continue_assistant_use`, `finish_assistant_use` avec `'step'`).
- Produces (rules.ts) : `ASSISTANT_MAX_STEPS = 6` ; `systemPrompt(firstName: string, todayIso: string): string`
  (ajoute « Nous sommes le jeudi 13 novembre 2026 (Bruxelles). » et les règles d'action de la spec
  §5.4) ; `ApiMessages = Anthropic.MessageParam[]`.
- Produces (model.ts, `server-only`) : `type AssistantModel = (params: { system: Anthropic.TextBlockParam[]; tools: Anthropic.Tool[]; messages: Anthropic.MessageParam[] }) => Promise<Anthropic.Message>` ;
  `getAssistantModel(): AssistantModel | null` (réel si `ANTHROPIC_API_KEY` ; simulé si
  `ASSISTANT_FAKE_SCRIPT` est défini et `process.env.VERCEL !== "1"` ; sinon null).
  Le simulé lit un fichier JSON `{ [question: string]: Anthropic.Message["content"][] }` : la n-ième
  étape d'une question renvoie le n-ième contenu (`stop_reason` « tool_use » s'il contient un
  `tool_use`, sinon « end_turn »), `usage` à 0.
- Produces (loop.ts, `server-only`) :
  `runAssistantStep(ctx: StepContext, messages: Anthropic.MessageParam[]): Promise<StepResult>` avec
  `StepContext = { organizationId: string; userId: string; firstName: string; model: AssistantModel }`
  et
  ```ts
  type StepResult =
    | { kind: "continue"; messages: Anthropic.MessageParam[]; progress: string }
    | { kind: "proposals"; text: string; proposals: AssistantProposal[]; messages: Anthropic.MessageParam[] }
    | { kind: "answer"; text: string }
    | { kind: "error"; error: AssistantErrorKind };
  ```
  (`AssistantProposal` vient de la tâche 4 ; d'ici là, `proposals` reste un tableau vide).
- Produces (actions.ts) :
  ```ts
  type AskAssistantInput =
    | { start: { history: { from: "coach" | "assistant"; text: string }[]; question: string } }
    | { next: { usageId: string; messages: Anthropic.MessageParam[] } };
  type AskAssistantResult =
    | { ok: true; step: StepResult; usageId: string; remaining: number }
    | { ok: false; kind: AssistantErrorKind; error: string; remaining: number | null };
  askAssistant(organizationId: string, input: unknown): Promise<AskAssistantResult>
  ```
  `start` réserve (`reserve_assistant_use`), `next` appelle `continue_assistant_use(usageId)` ;
  chaque étape appelle `finish_assistant_use` avec `'step'`, ou `'done'` / `'failed'` quand
  l'étape termine la demande. `askAssistantSchema` valide les deux formes (messages : 40 au plus,
  200 000 caractères au total).

- [ ] **Step 1 : tests** `tests/unit/assistant-loop.test.ts` avec un `AssistantModel` écrit dans le
  test (pas de réseau) :
  - réponse texte → `{ kind: "answer", text }` ;
  - `tool_use` d'un outil de lecture inconnu → `messages` se termine par un `tool_result`
    `is_error: true` et `kind: "continue"` ;
  - `stop_reason: "refusal"` → `{ kind: "error", error: "refusal" }` ;
  - `systemPrompt("Gianluca", "2026-11-13")` contient « jeudi 13 novembre 2026 » ;
  - la 7e étape est refusée côté action (`etapes_epuisees` → kind `"steps"`, message
    « Je n'ai pas réussi, reformule ta demande. ») : tester `reserveErrorKind("etapes_epuisees")`.
- [ ] **Step 2 :** `npx vitest run tests/unit/assistant-loop.test.ts` → échec.
- [ ] **Step 3 :** implémenter `model.ts`, `loop.ts` (le contenu de l'assistant est renvoyé tel
  quel, blocs de réflexion compris, dans `messages`), et `askAssistant` ; ajouter les clés d'erreur
  `steps` et `expired` à `ASSISTANT_ERRORS`.
- [ ] **Step 4 :** tests unitaires, `npx tsc --noEmit -p .` → OK.
- [ ] **Step 5 :** point d'arrêt.

### Task 3 : Outils de lecture

**Files :**
- Create : `src/features/assistant/tools/read.ts` (`server-only`)
- Create : `src/features/assistant/tools/definitions.ts`
- Modify : `src/features/assistant/loop.ts`
- Test : `tests/unit/assistant-read-tools.test.ts`

**Interfaces :**
- Produces : `READ_TOOLS: Anthropic.Tool[]` pour `chercher_sportifs` (`{ nom: string }`),
  `voir_agenda` (`{ du: "AAAA-MM-JJ", au: "AAAA-MM-JJ" }`, 31 jours au plus),
  `voir_a_encaisser` (`{ sportif_id?: uuid }`), `voir_listes_de_taches` (`{}`),
  `voir_categories_de_depenses` (`{}`) ;
  `runReadTool(organizationId: string, name: string, input: unknown): Promise<string>` (JSON
  compact ; erreur Zod → texte d'erreur en français) ;
  fonctions pures testées : `shapeAthletes(items: AthleteListItem[], nom: string)` (id, nom complet,
  statut, discipline, `manque`, au plus 10, sans e-mail ni téléphone ni santé) ;
  `shapeAgenda(sessions: CoachSession[], du: string, au: string)` (une ligne par date via
  `sessionOccurrences` : `seance_id`, `date`, `date_originale`, `heure`, `duree_min`, `titre`,
  `sportif` ou « collective », `repetee`) ; `shapeUnpaid(dates: UnpaidDate[], sessions: CoachSession[], sportifId?: string)`.
- Consumes : `listAthletes`, `listSessions`, `listUnpaidDates`, `listTaskLists`,
  `listExpenseCategories`, `sessionOccurrences`.

- [ ] **Step 1 : tests** des trois fonctions de mise en forme : « luc » trouve Lucas Janssens,
  ignore les archivés sauf demande ; aucun champ `email`, `phone`, `health` dans le JSON ;
  une séance hebdomadaire déplacée donne sa nouvelle date avec `date_originale` ; filtre par sportif
  pour l'encaissement.
- [ ] **Step 2 :** lancer → échec.
- [ ] **Step 3 :** implémenter ; brancher `runReadTool` dans `runAssistantStep`.
- [ ] **Step 4 :** tests et typage → OK.
- [ ] **Step 5 :** point d'arrêt.

### Task 4 : Propositions (outils d'écriture du lot 1)

**Files :**
- Create : `src/features/assistant/proposals.ts` (règles pures + résolution serveur séparée)
- Create : `src/features/assistant/tools/write.ts` (`server-only` : résolution et appartenance)
- Modify : `src/features/assistant/tools/definitions.ts`, `src/features/assistant/loop.ts`
- Test : `tests/unit/assistant-proposals.test.ts`

**Interfaces :**
- Produces (proposals.ts) :
  ```ts
  type AssistantActionKind =
    | "creer_sportif" | "creer_seance" | "deplacer_seance" | "marquer_seance_payee"
    | "noter_paiement" | "noter_depense" | "creer_tache" | "creer_liste_de_taches";
  type AthleteRef = { athleteId: string } | { fromCard: string };
  type AssistantAction = { kind: AssistantActionKind; params: Record<string, unknown> };
  type AssistantProposal = AssistantAction & {
    id: string;            // identifiant de carte (randomUUID)
    title: string;         // « Nouvelle séance »
    summary: string[];     // lignes en clair, date en toutes lettres
    dependsOn: string | null;
  };
  assistantActionSchema: z.ZodType<AssistantAction> // union discriminée par kind
  summarize(action: AssistantAction, names: Record<string, string>, currency: Currency): { title: string; summary: string[] }
  ```
  Paramètres par type (noms des champs = ceux des formulaires, voir les lecteurs `readForm` de
  `sessions/actions.ts`, `createPayment`, `createExpense`, `readTaskForm`) :
  `creer_sportif` : prénom, nom, sexe, e-mail, téléphone, niveau, discipline (`programType`),
  objectif (type, date, compétition) ; **jamais** de santé, d'accord ni de note ;
  `creer_seance` : kind individual / group, titre, discipline, lieu, date, heure, durée, répétée,
  fin, sportif (`AthleteRef`) ou inscrits, prix, TVA, mode de paiement, notes ;
  `deplacer_seance` : `MoveSessionInput` ; `marquer_seance_payee` : sessionId, date ;
  `noter_paiement` : sportif (`AthleteRef`), date, montant, TVA, mode, libellé ;
  `noter_depense` : libellé, catégorie, montant, TVA, date, mensuelle, fin ;
  `creer_tache` : titre, priorité, échéance, liste, sportif (`AthleteRef` ou aucun), notes ;
  `creer_liste_de_taches` : nom.
- Produces (write.ts) : `WRITE_TOOLS: Anthropic.Tool[]` ;
  `proposeAction(organizationId: string, name: string, input: unknown, cardIds: string[]): Promise<{ ok: true; proposal: AssistantProposal } | { ok: false; error: string }>`
  (Zod, puis appartenance à l'organisation de chaque identifiant ; `fromCard` accepté seulement s'il
  désigne une carte `creer_sportif` de la même réponse, sinon erreur).
- `runAssistantStep` : chaque `tool_use` d'écriture → `proposeAction` ; erreurs renvoyées à Claude
  en `tool_result` `is_error` (l'étape continue) ; propositions valides → `tool_result`
  « Proposition affichée au coach, en attente de sa validation. » et `kind: "proposals"`.

- [ ] **Step 1 : tests** :
  - `summarize` d'une séance : `["Lucas Janssens", "mardi 18 novembre 2026 · 18:00 · 60 min", "Salle"]` ;
  - paiement : « 60,00 € · espèces » ; dépense mensuelle : « chaque mois jusqu'au … » ;
  - `assistantActionSchema` refuse `healthConstraints`, `coachNote`, un montant négatif, une heure
    hors quart d'heure pour un déplacement, un `organization_id` ;
  - deux cartes : `{ fromCard }` vers une carte `creer_sportif` accepté, vers une carte
    `creer_tache` refusé.
- [ ] **Step 2 :** lancer → échec.
- [ ] **Step 3 :** implémenter ; les descriptions d'outils disent à Claude de chercher avant
  d'agir et de demander en cas de doute (Review Focus 1).
- [ ] **Step 4 :** tests et typage → OK.
- [ ] **Step 5 :** point d'arrêt.

### Task 5 : Exécuteur

**Files :**
- Create : `src/features/athletes/create-athlete.ts` (`server-only`, cœur extrait de `createAthlete`)
- Modify : `src/features/athletes/actions.ts` (`createAthlete` appelle le cœur, comportement inchangé)
- Create : `src/features/assistant/execute.ts` (`"use server"`)
- Create : `src/features/assistant/form-data.ts` (pur)
- Test : `tests/unit/assistant-execute.test.ts`

**Interfaces :**
- Produces : `insertAthlete(orgId: string, userId: string, values: NewAthleteFormInput): Promise<{ ok: true; id: string; incomplete: boolean } | { ok: false; error: string }>` ;
  `toFormData(action: AssistantAction): FormData` (champs exacts des formulaires ; séance avec
  `stay=1`) ;
  `executeAssistantAction(organizationId: string, action: unknown): Promise<{ ok: true; href: string; createdAthleteId?: string; note: string } | { ok: false; error: string }>`
  (`requireOrgAccess`, `assistantActionSchema`, `AthleteRef` résolu obligatoirement en
  `athleteId` par le navigateur avant l'appel, sinon refus ; puis : `insertAthlete`,
  `createSession`, `moveSession`, `markSessionPaid`, `createPayment`, `createExpense`, `createTask`,
  `createTaskList` ; `note` = la phrase « [Fait : …] » pour l'historique).
- Consumes : tâche 4.

- [ ] **Step 1 : tests** de `toFormData` (un cas par type : champs et valeurs exacts, `stay=1`,
  cases cochées en « on », aucune clé de santé) et d'un refus d'`executeAssistantAction` sur
  `{ fromCard }` non résolu (fonction de contrôle pure exportée : `requireResolved(action)`).
- [ ] **Step 2 :** lancer → échec.
- [ ] **Step 3 :** extraire `insertAthlete` (le formulaire garde sa redirection), écrire
  `form-data.ts` et `execute.ts`.
- [ ] **Step 4 :** tests unitaires, typage, `tests/e2e/athletes.spec.ts` et
  `tests/e2e/new-athlete.spec.ts` toujours verts (le formulaire n'a pas changé de comportement).
- [ ] **Step 5 :** point d'arrêt.

### Task 6 : Interface (étapes, cartes, Modifier)

**Files :**
- Modify : `src/components/blocks/assistant.tsx` (état de la conversation, étapes, cartes, notes)
- Create : `src/components/blocks/assistant-card.tsx`
- Modify : `src/components/blocks/new-session-sheet.tsx`, `new-payment-sheet.tsx`, `task-sheet.tsx`
  (pré-remplissage complet pour « Modifier »)
- Modify : `src/app/(coach)/layout.tsx` (passer `execute`)
- Test : `tests/unit/assistant-cards.test.ts` (logique pure des cartes)

**Interfaces :**
- Consumes : `askAssistant` (tâche 2), `AssistantProposal` (tâche 4), `executeAssistantAction` (tâche 5).
- Produces : `AssistantMessage` gagne `cards?: CardState[]` et `progress?: string` ;
  `type CardState = AssistantProposal & { status: "pending" | "running" | "done" | "cancelled" | "error" | "blocked"; result?: string; href?: string }` ;
  fonctions pures `resolveCard(cards: CardState[], id: string, createdAthleteId?: string): CardState[]`
  (remplace `{ fromCard }` par l'identifiant créé dans les cartes qui en dépendent) et
  `blockDependents(cards: CardState[], id: string, reason: string): CardState[]` ;
  ouvertures pré-remplies : `useOpenNewSession()(slot)` accepte toute la séance
  (`Partial<SessionFormInput>` en plus du créneau), `useOpenNewPayment()(prefill?: Partial<PaymentFormValues>)`,
  `useOpenTaskSheet()(undefined, { ...preset, title, dueOn, priority, athleteId, notes })`.
- Comportement : le navigateur enchaîne `askAssistant({ next })` tant que `step.kind === "continue"`
  en affichant `progress` ; une carte « pending » montre Valider, Modifier, Annuler ; « running »
  désactive tout ; « done » montre « Fait » et « Voir » (`href`) ; une carte dépendante reste grisée
  avec « Après la création de … » ; si sa carte mère est annulée ou en erreur → « blocked » avec
  « Impossible : la fiche de … n'a pas été créée. » ; Modifier (séance, paiement, tâche) ouvre la
  fenêtre pré-remplie et passe la carte à « cancelled » avec « Modifiée dans le formulaire » ;
  Modifier (autres) met le curseur dans la saisie avec « Que veux-tu changer ? ». Après Valider ou
  Annuler, la note « [Fait : …] » / « [Annulé : …] » entre dans l'historique envoyé ensuite. Sous la
  saisie : « N'écris pas de données de santé ici. »

- [ ] **Step 1 : tests** de `resolveCard` et `blockDependents` (carte liée débloquée avec
  l'identifiant ; carte liée bloquée quand la mère est annulée ; une carte « done » n'est jamais
  remise en « pending » ; Review Focus 2 et 3).
- [ ] **Step 2 :** lancer → échec.
- [ ] **Step 3 :** charger les compétences de design, puis implémenter la carte (style des boîtes
  du kit, jetons seulement, téléphone d'abord) et l'enchaînement des étapes.
- [ ] **Step 4 :** tests, typage, lint ; vérification visuelle au navigateur sur téléphone et
  ordinateur, clair et sombre.
- [ ] **Step 5 :** point d'arrêt.

### Task 7 : Parcours de bout en bout (modèle simulé) et documentation

**Files :**
- Create : `tests/e2e/fixtures/assistant-script.json`
- Create : `tests/e2e/assistant-actions.spec.ts`
- Modify : `playwright.config.ts` (`webServer.env.ASSISTANT_FAKE_SCRIPT`)
- Modify : `supabase/seed.sql` (organisation B abonnée : `coory_plan = 'premium'`), et la même mise à
  jour appliquée à la base locale par SQL (pas de réinitialisation)
- Modify : `scripts/clean-test-data.sql` (vider `assistant_usage` du coach B en fin de suite)
- Modify : `00_INDEX.md` (D-170), `SUIVI_IMPLEMENTATION.md`, `CARNET_TECHNIQUE.md`

**Interfaces :**
- Consumes : tout le lot. Le script simulé associe des questions fixes à des réponses : par
  exemple « Crée une séance avec Sarah mardi prochain à 18h » → étape 1 `chercher_sportifs`, étape
  2 `creer_seance`.

- [ ] **Step 1 : tests** `assistant-actions.spec.ts` (coach B, les deux projets, données marquées
  pour le nettoyage) : séance créée au clic Valider et visible dans l'agenda ; Annuler → rien dans
  l'agenda ; Modifier → la fenêtre « Nouvelle séance » s'ouvre pré-remplie ; deux cartes liées
  (sportif puis tâche) ; le coach A (sans abonnement) reste verrouillé ; progression affichée.
- [ ] **Step 2 :** lancer → échec.
- [ ] **Step 3 :** compléter jusqu'au vert ; suite Playwright complète.
- [ ] **Step 4 :** documentation (D-170) et captures téléphone / ordinateur, clair / sombre.
- [ ] **Step 5 :** point d'arrêt final ; rappel à Antonino : un premier vrai essai avec sa clé
  demande son accord (coût).
