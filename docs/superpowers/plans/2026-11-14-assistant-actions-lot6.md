# Assistant IA, lot 6 (les réglages : Paramètres et notifications) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
> Exécution native dans la session, sans commit (Antonino commite) ; relecture indépendante à la fin. Feu vert d'Antonino : « Go lot 6 » (14/11).

**Goal:** dernier lot de l'Assistant IA : en cartes à valider, les 11 gestes des réglages hors sécurité du compte : profil du coach (prénom, nom, entreprise, téléphone), nom, pays et devise de l'organisation, préférences (durée, lieu, prix et paiement par défaut, heures de l'agenda), notifications voulues par sorte, et l'état des notifications (lues, non lues, masquées, affichées, supprimées, rétablies).

**Architecture:** comme les lots 4 et 5 : règles pures `src/features/assistant/reglages.ts`, contrôles `tools/reglages.ts` (server-only), exécution `execute-reglages.ts` (server-only, après `requireOrgAccess`) qui appelle les actions de la fenêtre Paramètres et de la page Notifications. Les valeurs actuelles viennent de `loadSettings` (mêmes données que la fenêtre).

**Tech Stack:** Next.js 16, Zod 4, SDK Anthropic (outils), Vitest, Playwright (faux Claude).

**Spec:** `docs/superpowers/specs/2026-11-13-assistant-actions-design.md` §5, élargie par la règle d'Antonino (« l'Assistant IA fait TOUT ») et ses décisions du 14/11 (lot 6 = réglages, sauf la sécurité du compte).

## Global Constraints

- **Jamais la sécurité du compte** : ni e-mail de connexion, ni mot de passe, ni déconnexion (`changeEmail`, `changePassword`, `signOutEverywhere` restent hors de l'assistant).
- Le téléphone du coach : « rempli » ou « vide » dans les lectures, et la note « [Fait : …] » ne garde que les noms des champs (même règle que la fiche d'un sportif, lot 2).
- Devise : propriétaire seulement ; la carte dit le taux et ce qui sera converti / ce qui reste, avec les mots de la fenêtre « Changer de devise » (« Sera converti en … », « Reste en … », « séances à venir avec prix », « Ton prix par défaut des séances », « paiements reçus »).
- Notifications : seulement les sortes visibles (pas « Messages » tant que la messagerie est masquée) ; 500 clés au plus par carte, chacune de forme connue.
- Une carte par action, « ancien → nouveau », rien avant « Valider » ; aucun vrai appel à Claude dans les tests.

## Review Focus

1. Changer la devise sans être propriétaire : refus clair, aucune carte.
2. Un taux invalide (0, négatif, texte) : refus à la proposition, comme la fenêtre.
3. Le téléphone du coach n'atteint jamais Claude (lecture, note « [Fait : …] »).
4. Masquer puis rétablir des notifications : l'état revient comme avant.
5. Préférences : heures de l'agenda incohérentes (fin avant début) refusées comme la fenêtre.

---

### Task 1 : règles pures et lectures

**Files:** Create `src/features/assistant/reglages.ts` ; Modify `proposals.ts` (kinds, union, `summarize` → `summarizeReglages`), `cards.ts` (`noteFor` : seulement les noms des champs pour `modifier_profil`), `tools/shape.ts` (`shapeSettings`, `shapeNotifications`) ; Test `tests/unit/assistant-lot6.test.ts`

**Interfaces — Produces** `REGLAGES_PARAMS` :
- `modifier_profil { changes: { firstName?, lastName? | null, companyName? | null, phone? | null } }` ;
- `nom_organisation { nom }` ; `pays_organisation { pays: code ISO à 2 lettres }` ; `devise_organisation { devise: CURRENCIES, taux: texte « 0,94 » }` ;
- `preferences { changes: { defaultSessionMinutes?, defaultLocation? | null, defaultPrice? | null, defaultPaymentMethod?, agendaFirstHour?, agendaLastHour? } }` ;
- `preference_notification { sorte: NotificationKind visible, active: boolean }` ;
- `notifications { action: "lues" | "non_lues" | "masquer" | "afficher" | "supprimer" | "retablir", cles: string[] 1..500 }`.
- `mergeProfile(current: ProfileInput, changes)`, `mergePreferences(current: PreferencesInput, changes)` (null → « ») ; `summarizeReglages(action, names)` ; `shapeSettings(data: SettingsData)` (téléphone « rempli »/« vide », jamais l'e-mail de connexion) ; `shapeNotifications(notifications: Notifications)` (`cle`, `sorte`, `texte`, `lue`, `masquee`, 100 au plus, sans « Messages » masqués).

- [ ] **Step 1 : tests qui échouent** : schémas (champ inconnu, e-mail ou mot de passe dans `modifier_profil.changes` refusés ; 501 clés refusées ; sorte « messages » refusée) ; fusions ; carte « Devise » (« Devise : EUR → CHF », « Taux : 1 EUR = 0,94 CHF », « Sera converti en CHF : 3 séances à venir avec prix, ton prix par défaut des séances », « Reste en EUR : 12 paiements reçus ») ; carte « Notifications » (« 3 notifications masquées » et leurs textes) ; `shapeSettings` sans e-mail ni numéro ; `noteFor(modifier_profil)` sans valeurs.
- [ ] **Step 2-4 :** FAIL → implémenter → PASS ; typecheck vert (exécution provisoire, remplacée à la tâche 2).

### Task 2 : serveur et parcours

**Files:** Create `tools/reglages.ts` (`REGLAGES_TOOLS`, `proposeReglages`), `execute-reglages.ts` ; Modify `tools/write.ts`, `execute.ts`, `tools/definitions.ts` + `read.ts` + `loop.ts` (`voir_parametres`, `voir_notifications`), `rules.ts` (consigne) ; `tests/e2e/fixtures/assistant-script.json`, `tests/e2e/assistant-actions.spec.ts`, `supabase/seed-tests-assistant.sql` (remise en état des réglages du coach B touchés par les tests).

- [ ] **Step 1 : parcours qui échouent** (coach B ; un seul appareil pour ce qui touche l'organisation, l'autre pour ses préférences, afin de ne pas se gêner en parallèle) : (a) préférences : durée par défaut 60 → 75 min, visible dans la fenêtre Paramètres ; (b) notification « Tâches » désactivée puis réactivée ; (c) nom de l'organisation changé puis remis ; (d) devise par un coach non propriétaire → refus (ou, faute de compte non propriétaire, un taux invalide → aucune carte) ; (e) masquer une notification puis la rétablir.
- [ ] **Step 2-3 :** implémenter → parcours verts, rejoués deux fois.

### Task 3 : finition

- [ ] Captures (« Devise », « Préférences ») ; typecheck, lint, Vitest, format, suite complète ; 00_INDEX (D-185), SUIVI, CARNET, mémoire (le point 2 « Terminer l'Assistant IA » ne garde que les mineurs) ; relecture indépendante.
