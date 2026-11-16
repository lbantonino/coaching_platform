# Séances en cartes, même page ordinateur et téléphone : plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans. Exécution native dans la
> session, sans commit (Antonino commite) ; relecture indépendante à la fin. Feu vert d'Antonino :
> maquettes « ok parfait », « peux-tu coder cela ? » (15/11).

**Goal :** le détail d'une séance en cartes (une par étape, grandes cartes pour ce qui se répète), sans
pastilles ni RIR, avec « ⋯ » ; la page d'un programme identique sur ordinateur et téléphone.

**Spec :** `docs/superpowers/specs/2026-11-15-seances-en-cartes-design.md`.

## Global Constraints
- Jetons de `src/styles/tokens.css` seulement ; Plus Jakarta Sans ; mobile first ; 44 px de cible sur
  téléphone ; vérifié sur téléphone ET ordinateur, en sombre ET en clair.
- Une seule vue des cartes (`src/components/programs/session-cards.tsx`) pour tous les endroits qui
  montrent une séance : page du programme, page d'un modèle, récap de l'éditeur de séance, agenda.
- Jamais « RIR », « RPE » ni pastille dans l'affichage d'une séance.

## Review Focus
1. Séries différentes d'une série à l'autre (pyramide) : une ligne par série, rien de perdu.
2. % du max sans max connu : « 70 % du max », jamais un poids inventé.
3. Supprimer le dernier exercice d'un superset (2 au moins) ou la dernière étape d'un « Répéter » :
   refusé proprement, pas de brouillon invalide.
4. Une séance v1 (texte) s'affiche encore en entier.
5. Téléphone : changer de semaine puis faire le geste de retour quitte bien la page (comme la barre).

### Task 1 : les cartes, règles pures
**Files :** create `src/domain/training/session-cards.ts` (`sessionCards(content)`,
`viewStepCards(steps)` pour la v1) ; modify `session-view.ts` (`exerciseLine` sans RIR) ; test
`tests/unit/session-cards.test.ts`.
**Produces :** `StepCard { kind: "card"; role: "warmup" | "work" | "rest" | "cooldown"; title; aside?;
lines: string[]; rest?; path: string[]; exerciseId? }`, `GroupCard { kind: "group"; title; aside?;
cards: StepCard[]; footer?; path: string[] }`.
- [ ] Tests d'abord (exercice uniforme / pyramide / % sans max / repos ; superset ; EMOM ; course pas
  et « Répéter » ; Hyrox simple et circuit, transition ; v1), vus en échec ; implémenter ; verts.

### Task 2 : la vue en cartes partout
**Files :** create `src/components/programs/session-cards.tsx` ; modify `session-detail.tsx`
(`SessionDetailModel.cards`), `session-line.tsx` (sans pastille), `week-session-cards.tsx` (détail de
l'agenda en cartes, depuis la version publiée), page d'un modèle, récap de l'éditeur de séance.
- [ ] Test e2e d'abord (détail d'une séance de musculation : une carte par exercice, « séries » en
  haut, pas de « RIR ») ; implémenter ; specs touchées vertes.

### Task 3 : « ⋯ » sur les cartes de la page du programme
**Files :** create `src/domain/training/session-items.ts` (`duplicateItem`, `removeItem` par chemin,
avec leurs limites) ; modify `program-editor.tsx` ; tests unitaires et e2e.
- [ ] Tests d'abord ; implémenter (« Voir dans la Bibliothèque » si l'exercice est lié).

### Task 4 : même page sur téléphone et ordinateur
**Files :** `editor-session-card.tsx` (barre de couleur, ligne du type sur téléphone),
`program-editor.tsx` (téléphone ouvert sur la semaine, « ‹ Semaine N / 12 ⌄ › », liste des semaines
en niveau, retour cohérent), tests e2e (`program-editor-back.spec.ts` et autres parcours téléphone).
- [ ] Tests d'abord ; implémenter ; suite complète ; captures ; docs (D-187), mémoire ; relecture.
