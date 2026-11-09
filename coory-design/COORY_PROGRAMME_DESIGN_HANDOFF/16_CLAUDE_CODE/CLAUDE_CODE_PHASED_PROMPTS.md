# Prompts par phase (à coller un par un)

**Phase 1 — Audit**
« Lis `coory-design/COORY_PROGRAMME_DESIGN_HANDOFF/16_CLAUDE_CODE/CLAUDE_CODE_MASTER_PROMPT.md` puis tout le dossier dans l'ordre indiqué. Audite le dépôt et écris `AUDIT_REPORT.md` : existant vs maquettes écran par écran (01 à 09), schéma de données vs DATA_MODEL_PROPOSAL, fichiers à modifier, risques. Ne modifie aucun code. »

**Phase 2 — Architecture**
« Propose les migrations minimales et réversibles et les types/contrats d'API nécessaires (phases, modèles, jours fixes, façons de viser, charges Hyrox, exports PDF). Montre le plan avant d'écrire le code. »

**Phase 3a — Fondations UI**
« Ajoute les tokens (`01_DESIGN_SYSTEM/tokens.css`) au design system existant et crée/aligne les composants communs (segmenté, select + chevron, chip, toggle, radio, menu ···, feuille du bas, FAB, carte séance). Diff visuel contre les captures. »

**Phase 3b — Écrans**
« Intègre 01 Page Programmes (onglets Programmes / Modèles) puis 02 Créer un programme, desktop + mobile, pixel perfect (PRG-01…06, WIZ-01…05). » Puis : « 03 Éditeur + 03b Jours fixes (EDT, FIX) ». Puis : « 04, 05, 06 éditeurs de séance (RUN, MUS, HYR) ». Puis : « 07 onglet Programme, 2c Agenda, 08 Publier ».

**Phase 4 — Fonctionnel**
« Implémente chaque ligne de FEATURE_TRACEABILITY_MATRIX.md pour les écrans intégrés, avec BUSINESS_RULES.md. Écris les tests TC-01 à TC-16. »

**Phase 5 — PDF**
« Implémente la génération des 2 PDF selon 12_PDF_SYSTEM (templates, Chromium, liens internes, signets, polices embarquées), compare chaque page aux captures 2×, remplis COMPATIBILITY_MATRIX.md. »

**Phase 6 — Validation**
« Lance toute la QA (14_QA), corrige les écarts, donne le rapport final : écrans conformes, tests, écarts restants. »
