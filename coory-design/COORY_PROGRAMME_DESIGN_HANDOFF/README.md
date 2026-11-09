# COORY — Dossier de livraison « Programmes » (Design → Code)

Planche : **Coory Programmes Planche** · Livré le 9 nov. 2026 · 50 captures de référence · code source original inclus.

## Ordre de lecture pour Claude Code
1. `16_CLAUDE_CODE/CLAUDE_CODE_MASTER_PROMPT.md` — le prompt à coller.
2. `MASTER_INDEX.md` — carte du dossier.
3. `DESIGN_AUDIT.md` + `FINAL_DESIGN_MANIFEST.json` — quoi intégrer, quoi ne pas inventer.
4. `01_DESIGN_SYSTEM/DESIGN_SYSTEM.md` + `tokens.css`.
5. `02_COMPONENTS/COMPONENT_INVENTORY.md`.
6. `FUNCTIONAL_SPECIFICATIONS.md`, `BUSINESS_RULES.md`, `DATA_MODEL_PROPOSAL.md`, `FEATURE_TRACEABILITY_MATRIX.md`.
7. Dossiers écran `03_…` à `12_…` : `SPECIFICATIONS.md` + `screenshots/`.
8. `12_PDF_SYSTEM/` — PDF interactifs.
9. `12_RESPONSIVE/`, `14_QA/` puis `15_IMPLEMENTATION/`.

## Hiérarchie des sources
1. Captures finales + code source de la planche (`13_HTML_PREVIEWS/source`, ORIGINAL_SOURCE) — apparence.
2. Tokens (`01_DESIGN_SYSTEM`) — extraits du code (EXACT).
3. Specs de ce dossier (EXACT / MEASURED / PROPOSED indiqués).
4. Règles métier et sécurité **du code existant de COORY** — priment pour les comportements critiques.
En cas de contradiction : la signaler, ne pas trancher seul.

## Ouvrir les maquettes
Ouvre `13_HTML_PREVIEWS/source/Coory Programmes Planche.dc.html` dans un navigateur (servi en local, ex. `npx serve 13_HTML_PREVIEWS/source`). Les écrans sont inspectables (DevTools) et interactifs (assistant 02, éditeur 03, agenda, PDF 9a-9d).
