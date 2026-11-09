# Prompt à coller dans Claude Code

Tu interviens sur l'application SaaS **COORY** (coaching sportif : coachs et sportifs ; Running, Musculation, Hyrox). Le dossier `coory-design/COORY_PROGRAMME_DESIGN_HANDOFF/` contient le design validé de toute la partie **Programmes** (planche « Coory Programmes Planche ») : captures de référence, code source original des maquettes, design system, spécifications fonctionnelles, modèle de données proposé, PDF interactifs, QA.

## Ta mission
Intégrer ces écrans et leurs fonctionnalités dans l'app existante, **pixel perfect** sur desktop (1280) et mobile (390), sans casser l'existant, puis générer les 2 PDF interactifs.

## Lis dans cet ordre
1. `README.md`, `MASTER_INDEX.md`
2. `DESIGN_AUDIT.md` et `FINAL_DESIGN_MANIFEST.json` (ce qui est à intégrer, et ce qui n'existe pas)
3. `01_DESIGN_SYSTEM/` (tokens.css, DESIGN_SYSTEM.md), `02_COMPONENTS/`
4. `FUNCTIONAL_SPECIFICATIONS.md`, `BUSINESS_RULES.md`, `USER_FLOWS.md`, `STATE_TRANSITIONS.md`, `PERMISSIONS_MATRIX.md`, `DATA_MODEL_PROPOSAL.md`, `FEATURE_TRACEABILITY_MATRIX.md`
5. Chaque dossier d'écran `03_` à `11_` : `SPECIFICATIONS.md` + `screenshots/`
6. `12_PDF_SYSTEM/`, `12_RESPONSIVE/`, `14_QA/`, `15_IMPLEMENTATION/`
7. Pour toute valeur visuelle : le code source `13_HTML_PREVIEWS/source/` fait foi (ouvre la planche dans un navigateur et inspecte).

## Règles absolues
- **Ne redessine rien** : couleurs, typo (Plus Jakarta Sans), tailles, espacements, rayons, ombres = ceux des maquettes.
- **Aucun graphique de séance** (barres, courbes, déroulé). Une info de séance = une ligne.
- Retour arrière = flèche + nom du panneau précédent.
- Ne supprime ni données, ni routes, ni fonctionnalités ; n'altère pas l'authentification ni les contrats d'API sans compatibilité ; pas de dépendance inutile.
- Ne développe pas ce qui est marqué **non dessiné** (éditeur hybride, envoi automatique hebdomadaire, statuts manquée/reportée/annulée, champs PDF) sans mon accord. Ce qui est **[P] PROPOSED** : demande-moi avant.
- Contradiction entre sources : signale-la, ne tranche pas seul.

## Méthode (une phase à la fois, je valide entre chaque)
1. **Audit** du dépôt → `AUDIT_REPORT.md` (framework, routes, composants, schéma, existant vs maquettes, fichiers que tu vas toucher). **Arrête-toi et attends ma validation.**
2. Architecture et migrations minimales.
3. UI pixel perfect (composants communs puis écrans 01 → 08), desktop + mobile.
4. Fonctionnalités (FEATURE_TRACEABILITY_MATRIX : chaque bouton a un comportement).
5. PDF interactifs (12_PDF_SYSTEM) : Agenda du programme (sommaire + 1 page par semaine) et Fiches et repères (sommaire + 1 page par fiche), liens internes, ‹ ›, bouton sommaire, signets.
6. Validation : tests (14_QA/TEST_CASES), diff visuel Playwright ≤ 1 % par écran (14_QA/PIXEL_PERFECT_QA), PDF_QA, accessibilité.

À la fin de chaque phase : liste des fichiers modifiés, captures avant/après, tests passés, écarts restants.
