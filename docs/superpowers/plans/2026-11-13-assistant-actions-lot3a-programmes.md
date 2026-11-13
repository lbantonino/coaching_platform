# Assistant IA qui agit : créer un programme (lot 3a), plan de construction

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal :** l'Assistant IA propose, en carte à valider, un **brouillon de programme** pour un sportif :
depuis un modèle, depuis la copie d'un ancien programme, vide, ou **écrit par l'assistant** (ses
séances), jamais publié par lui.

**Architecture :** nouvel outil d'écriture `creer_programme` dans la boucle du lot 1 (proposition →
carte → `executeAssistantAction`). Pour un programme écrit par l'assistant, Claude décrit chaque
séance UNE fois (avec une référence) puis place les références semaine par semaine : réponse compacte,
donc moins chère et moins longue. Le serveur construit les semaines, vérifie le tout avec les schémas
du brouillon, et l'exécution passe par `createProgram` puis `saveDraft`, comme l'assistant de création
et l'éditeur.

**Tech Stack :** comme le lot 1 ; `z.toJSONSchema` (Zod 4) pour donner à Claude le schéma exact d'une
séance (`sessionBodySchema`, environ 16 000 caractères, mis en cache).

**Spec :** `docs/superpowers/specs/2026-11-13-assistant-actions-design.md` §5.3 (Programmes, lot 3).

## Global Constraints

- Les contraintes du plan du lot 1 s'appliquent (`docs/superpowers/plans/2026-11-13-assistant-actions-lot1.md`).
- Jamais de publication ni d'archivage : le résultat est un brouillon, lien « Ouvrir dans l'éditeur ».
- Même logique que l'assistant de création (`createProgram`, `createProgramInputSchema`) et l'éditeur
  (`saveDraft`, `programDraftSchema`) ; rien n'est copié.
- Exercices de musculation : seulement des identifiants de la Bibliothèque visibles par le coach.
- `max_tokens` 8 000 par étape ; une demande reste 1 sur 100, 6 étapes au plus.
- Données de test marquées `1700000000000`, retirées en fin de suite.

## Review Focus

1. Programme qui chevauche un programme existant du sportif : erreur claire, pas de carte trompeuse.
2. Date de début qui n'est pas un lundi (« commence la semaine prochaine ») : refus expliqué à Claude.
3. Exercice inventé (identifiant inexistant) : refus avant la carte.
4. Programme écrit plus long que la réponse (coupée) : rien d'exécuté (règle du lot 1).
5. Référence de séance inconnue dans une semaine : refus avant la carte.

---

### Task 1 : Lectures pour les programmes

**Files :** Modify `src/features/assistant/tools/{definitions,read,shape}.ts`, `loop.ts` (progression) ;
Test `tests/unit/assistant-read-tools.test.ts`.

**Interfaces :** Produces `voir_modeles` (`{}` → id, titre, discipline, semaines, séances par semaine,
origine coory/coach), `voir_programmes` (`{ sportif_id }` → id, titre, statut, début, fin),
`chercher_exercices` (`{ nom }` → id, nom, mesure « repetitions » ou « secondes », 15 au plus) ;
fonctions pures `shapeTemplates`, `shapePrograms`, `shapeExercises`.

- [ ] Tests des trois mises en forme (filtres, bornes, aucun champ privé) → échec → code → vert.

### Task 2 : Proposition `creer_programme`

**Files :** Modify `src/features/assistant/proposals.ts`, `tools/write.ts`, `form-data.ts` ;
Test `tests/unit/assistant-programmes.test.ts`.

**Interfaces :** paramètres `{ athlete, title, discipline (running|strength|hyrox), startDate (lundi),
weeksCount, sessionsPerWeek, scheduling (ordered|fixed), goal?, phases?, start: blank | template
{templateId} | copy {programId}, seances?: [{ ref, ...séance, fixedDay?, moment? }], semaines?:
[{ index, light?, seances: [ref] }] }` (séances seulement avec un départ vide) ;
`buildCustomWeeks(params): Week[]` (pur : clés `w<semaine>-s<n>`, `athleteCanMove: false`) ;
`programRuleError(params): string | null` (pur : `createProgramInputSchema` puis
`programDraftSchema` sur le brouillon complet) ; résumé : titre, sportif, « Running · 8 semaines ·
4 séances par semaine », « Dès le lundi … , dans l'ordre / aux jours fixés », départ (modèle X, copie
de Y, séances écrites par l'assistant : N, ou vide), objectif, « Brouillon : à relire et publier dans
l'éditeur ». Serveur : sportif, modèle, programme copié et exercices appartiennent au coach.

- [ ] Tests : semaines construites depuis les références ; référence inconnue refusée ; début hors
  lundi refusé ; séances avec un départ « modèle » refusées ; résumé exact → échec → code → vert.

### Task 3 : Exécution et modèle

**Files :** Modify `execute.ts`, `form-data.ts` (`toCreateProgramInput`), `rules.ts`
(`ASSISTANT_MAX_TOKENS` 8 000, consigne : préférer un modèle qui convient, sinon écrire ; lundi ;
exercices via `chercher_exercices` ; brouillon seulement) ; Test `tests/unit/assistant-programmes.test.ts`.

**Interfaces :** `creer_programme` → `createProgram` puis, si des séances sont écrites, `loadDraft` et
`saveDraft` avec les semaines construites ; résultat `href` = page du programme (éditeur).

- [ ] Tests de `toCreateProgramInput` → échec → code → vert ; typage, lint.

### Task 4 : Parcours et documentation

**Files :** `tests/e2e/fixtures/assistant-script.json`, `tests/e2e/assistant-actions.spec.ts`,
`00_INDEX.md` (D-172), `SUIVI_IMPLEMENTATION.md`, `CARNET_TECHNIQUE.md`.

- [ ] E2e (faux Claude, coach B) : programme depuis un modèle Coory → Valider → l'éditeur s'ouvre avec
  le titre ; programme écrit de 2 semaines → Valider → les séances sont dans l'éditeur ; suite
  complète ; captures téléphone et ordinateur.
