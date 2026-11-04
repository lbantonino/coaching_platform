# Ordre d’implémentation

| Phase | Contenu | Pages / composants | Dépendances | Risques | Critères d’acceptation |
|---|---|---|---|---|---|
| **A — Audit** | Lire le kit ; cartographier routes, composants, API, tokens existants ; remplir la colonne « Existant » de FUNCTIONAL-GAP-ANALYSIS | toutes | — | supposer l’existant | rapport d’audit validé par le propriétaire |
| **B — Fondations** | Vérifier/aligner tokens (couleurs, typo, rayons, ombres) ; **ne pas toucher** au shell s’il est conforme ; ajuster seulement les écarts listés dans global-shell/protected-components.md | design-system, global-shell | A | régression globale | captures du shell identiques avant/après |
| **C — Composants partagés** | CHIP, SEG, F-SWITCH, F-CALC, F-DROP, C-RECAP, C-FOOT, C-SECTION, C-INFO, STATUS-PILL, AVATAR-STACK, MOBILE-ACTIONBAR, FAB, M-MENU, M-TOAST | shared-components | B | doublons | chaque composant utilisé ≥ 1 fois, sans variante locale |
| **D — Pages simples** | 09 Inviter · 05 Documents · 11 Modifier l’exercice · 08 Créer un exercice / variante | 09, 05, 11, 08 | C | routes ?variante | checklists de la page |
| **E — Pages complexes** | 06 + 12 Modifier la séance (un seul gabarit) · 10 Nouveau sportif · 13 Paramètres · 01 Tâches · 03 Notifications · 04 Comptabilité · 07 Messages | 06/12, 10, 13, 01, 03, 04, 07 | C, D | calculs TVA, données de santé, modèle groupes | checklists + données réelles |
| **F — Fonctionnalités** | NEW-VALIDATED de FEATURE-INDEX, menées **avec leur page** quand possible ; TO-VERIFY tranchés avec le propriétaire | features | D, E | API manquantes | chaque fiche feature cochée |
| **G — Assistant IA** | boîte (F-02.1) → page complète (F-02.5) → actions validées (F-02.4) → **historique réel** (F-02.6/02.7) ; panneau mobile après validation du design | 02 | API assistant, persistance | stockage des conversations | assistant-ai-chat-history.md H1–H7 |
| **H — Validation globale** | responsive 1024→3440, mobile 320→430 + clavier, accessibilité, non-régression | toutes | tout | — | QA-REPORT mis à jour, 5 checklists cochées |

Ordre conseillé à l’intérieur de E : 06/12 → 10 → 13 → 03 → 01 → 04 → 07 (du plus réutilisant au plus spécifique).
