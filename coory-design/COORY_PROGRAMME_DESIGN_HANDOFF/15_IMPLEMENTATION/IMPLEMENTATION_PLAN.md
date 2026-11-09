# Plan d'implémentation (à adapter après l'audit du dépôt)

| Phase | Contenu | Livrable / sortie |
|---|---|---|
| 1 · Audit | framework, routes, composants, design system existant, schéma BDD, ce qui existe déjà (programmes, séances, agenda, repères, disponibilités, bibliothèque d'exercices, PDF) | `AUDIT_REPORT.md` : écarts maquettes ↔ existant, liste des fichiers à toucher. **Stop, validation du client.** |
| 2 · Architecture | mapping du modèle de données (DATA_MODEL_PROPOSAL) sur l'existant, migrations minimales et réversibles, contrats d'API, composants partagés | plan de migration + types ; validation |
| 3 · UI pixel perfect | tokens → composants communs (segmenté, select, chip, toggle, radio, carte séance, menu ···, feuilles du bas, FAB) → écrans 01, 02, 03, 03b, 04, 05, 06, 07, 2c, 08 (desktop + mobile) | diff visuel ≤ 1 % par écran |
| 4 · Fonctionnel | création, édition, réorganisation, phases, modèles (copie), jours fixes, façons de viser, charges, simulation, publication / versions | TEST_CASES TC-01 à TC-16 verts |
| 5 · PDF | templates, génération Chromium, liens internes, signets, métadonnées, stockage par version | PDF_QA + matrice de compatibilité remplie |
| 6 · Validation | régressions, permissions, responsive (390 / 768 / 1280 / 1440 / 1920), accessibilité | rapport final |

Hors périmètre : éditeur hybride, envoi automatique hebdomadaire, champs PDF remplissables, statuts manquée/reportée/annulée (non dessinés — attendre validation).
