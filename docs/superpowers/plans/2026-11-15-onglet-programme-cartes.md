# Onglet Programme en cartes, « Modifier la séance » dans l'agenda : plan

> Exécution native dans la session, sans commit (Antonino commite). Feu vert d'Antonino : « oui on fait
> cette organisation », « Tu peux commencer […] la carte programme dans l'onglet programme » (15/11).

**Goal :** une seule vue d'un programme : l'onglet Programme de la fiche montre les cartes de ses
programmes (celles de la page Programmes) ; l'agenda de la fiche permet de modifier une séance.

**Spec :** `docs/superpowers/specs/2026-11-15-onglet-programme-cartes-design.md`.

## Global Constraints
- Mobile first, jetons existants, la carte `ProgramCard` réutilisée telle quelle (pas de copie).
- Le retour de la page du programme ouvert depuis l'onglet ramène à `?onglet=programme` (`?retour=`).
- Rien ne change sur la page Programmes ni dans la page du programme.

## Review Focus
1. Un sportif sans aucun programme : l'état vide et « Créer un programme ».
2. Seulement d'anciens programmes (terminés, brouillons) : « Créer » et « Copier » restent accessibles.
3. Une fiche archivée : pas d'assistant proposé (règle B11 gardée).
4. Le retour depuis le programme et depuis une séance ramène au bon onglet et à la bonne semaine.
5. Un programme archivé reste visible (historique du sportif), en dernier.

### Task 1 : l'onglet Programme en cartes
**Files :** `src/domain/training/program-status.ts` (`sortAthletePrograms`), `sportifs/[athleteId]/
program-tab.tsx` (réécrit), `page.tsx` (données : `listPrograms(org, { athleteId, includeArchived })`),
suppression de `program-week-board.tsx` ; tests : `tests/unit/program-status-order.test.ts`,
`tests/e2e/athlete-program-cards.spec.ts`, mise à jour de `program-editor.spec.ts` et
`athlete-overview.spec.ts`.
- [ ] Tests d'abord (ordre des cartes ; cartes d'Inès, appui → programme → retour à l'onglet), vus en échec.
- [ ] Implémenter ; tests verts ; specs touchées vertes.

### Task 2 : « Modifier la séance » dans l'agenda de la fiche
**Files :** `program-weeks.tsx` / `week-session-cards.tsx` (lien par séance, `sessionEditHref` avec
retour `?onglet=agenda&semaine=N`) ; test e2e.
- [ ] Test d'abord (le lien existe et ramène à l'agenda, à la même semaine), vu en échec.
- [ ] Implémenter ; suite complète ; 00_INDEX (D-186), SUIVI, CARNET, mémoire.
