# Discipline d'un programme (D-180) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
> Exécution native dans la session, sans commit (Antonino commite).

**Goal:** la discipline du programme se lit dans les deux PDF (« Programme hybride »…) et se change depuis le menu « ··· » d'un programme ou d'un modèle du coach.

**Architecture:** un libellé pur `programKindLabel` (discipline.ts) ; les modèles des PDF reçoivent la discipline de la version publiée (`AthleteProgram.discipline`, déjà lue dans l'instantané) ; une fenêtre `DisciplineSheet` (editor-sheets.tsx) modifie `plan.discipline` par `update`, comme « Renommer » ; l'enregistrement existant (save_program_draft, modèles, publication) porte déjà la discipline.

**Tech Stack:** Next.js 16, React 19, TypeScript, Vitest, Playwright, React-PDF.

**Spec:** `docs/superpowers/specs/2026-11-14-discipline-programme-design.md`

## Global Constraints

- Libellés exacts : « Programme running », « Programme musculation », « Programme Hyrox », « Programme hybride ».
- PDF : la discipline vient de la VERSION PUBLIÉE ; programme v1 sans discipline : textes actuels inchangés.
- Programme publié : « La nouvelle discipline apparaîtra dans la fiche et les PDF à la prochaine publication. »
- Interface en français, jetons de `tokens.css` seulement, vérifiée sur téléphone puis ordinateur, sombre et clair.

## Review Focus

1. Programme v1 (discipline null) : les PDF gardent « Agenda du programme · N semaines », « Sommaire », « Fiches et repères ».
2. Programme archivé ou modèle Coory (lecture seule) : pas d'action « Changer la discipline ».
3. Rouvrir la fenêtre après un changement : la discipline actuelle est cochée (pas l'ancienne).

---

### Task 1 : la discipline dans les PDF

**Files:**
- Modify: `src/domain/training/discipline.ts`, `src/domain/training/pdf-agenda.ts` (PdfProgramInput, AgendaTocPage, modèle), `src/domain/training/pdf-fiches.ts` (headerSubtitle), `src/features/programs/pdf/agenda-pdf.tsx` (surtitre du sommaire), `src/features/programs/pdf/program-pdf-source.ts`
- Test: `tests/unit/pdf-agenda.test.ts`, `tests/unit/pdf-fiches.test.ts`, `tests/unit/pdf-fixtures.ts` (`demoProgram` : `discipline: "hybrid"`)

**Interfaces:**
- Produces: `programKindLabel(discipline: Discipline | null): string | null` ; `PdfProgramInput.discipline: Discipline | null` ; `AgendaTocPage.kicker: string`.

- [ ] **Step 1 : tests qui échouent**
  - `programKindLabel("hybrid")` = « Programme hybride », `"running"` = « Programme running », `"strength"` = « Programme musculation », `"hyrox"` = « Programme Hyrox », `null` = `null`.
  - Agenda de `demoProgram(6)` : `headerSubtitle` = « Programme hybride · Agenda · 6 semaines » ; sommaire : `kicker` = « Programme hybride · Sommaire ».
  - Même programme avec `discipline: null` : « Agenda du programme · 6 semaines » et « Sommaire ».
  - Fiches : `headerSubtitle` = « Programme hybride · Fiches et repères » ; avec `null` : « Fiches et repères ».
- [ ] **Step 2 :** `npx vitest run tests/unit/pdf-agenda.test.ts tests/unit/pdf-fiches.test.ts` → FAIL.
- [ ] **Step 3 :** implémenter ; `agenda-pdf.tsx` affiche `page.kicker` à la place du « Sommaire » écrit en dur ; `loadProgramPdfInput` passe `discipline: program.discipline`.
- [ ] **Step 4 :** mêmes tests + `tests/unit/pdf-render.test.ts` → PASS ; `npm run typecheck`.

### Task 2 : « Changer la discipline »

**Files:**
- Modify: `src/app/(coach)/coach/o/[orgId]/programmes/_editor/editor-sheets.tsx` (nouvelle `DisciplineSheet`), `src/app/(coach)/coach/o/[orgId]/programmes/_editor/program-editor.tsx` (entrée de menu après « Renommer » pour un programme et pour un modèle du coach ; état `sheet === "discipline"`)
- Test: `tests/e2e/modeles-coory.spec.ts`

**Interfaces:**
- Consumes: `disciplineLabels`, `disciplineStyles`, `DISCIPLINES` (discipline.ts) ; `RadioMark` (radio-choice.tsx) ; `Sheet`, `DialogFooter` (overlay.tsx).
- Produces: `DisciplineSheet({ open, onClose, title, initial: Discipline, hint?: string, onConfirm: (discipline: Discipline) => void })`.

- [ ] **Step 1 : parcours qui échoue** (`D-180 : changer la discipline d'un programme`), ordinateur et téléphone : programme créé depuis « Préparation 10 km » par « Utiliser ce modèle » ; menu « Plus d'actions sur le programme » → « Changer la discipline » ; « Running » coché ; choisir « Hybride » → « Changer » ; la pastille de discipline du programme dit « Hybride » ; la page Programmes filtrée sur Hybride (`?discipline=hybride`) montre le programme ; rouvrir la fenêtre : « Hybride » coché.
- [ ] **Step 2 :** `npx playwright test tests/e2e/modeles-coory.spec.ts -g "D-180"` → FAIL (menu absent).
- [ ] **Step 3 :** `DisciplineSheet` (4 choix radio avec la pastille de couleur, comme l'étape Objectif ; la valeur repart de `initial` à chaque ouverture, comme `TextSheet`) ; menu « Changer la discipline » (icône `Shapes` de lucide) pour un programme non archivé et un modèle du coach ; `onConfirm` → `update((current) => ({ ...current, discipline }))` ; programme publié : la phrase de la contrainte globale en `hint`.
- [ ] **Step 4 :** le parcours → PASS sur les deux projets ; captures de la fenêtre (téléphone, ordinateur, sombre, clair).
- [ ] **Step 5 :** typecheck, lint, Vitest complet, format, suite Playwright complète ; 00_INDEX (D-180), SUIVI, CARNET, mémoire.
