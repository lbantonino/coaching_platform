# QA-REPORT — complétude du kit

| Indicateur | Valeur |
|---|---|
| Pages identifiées | 13 |
| Artboards desktop | 15 |
| Artboards mobile | 18 |
| Modales / panneaux documentés | 8 (+ 36 dans COORY-MODALS-PIXEL-PERFECT-KIT) |
| Fonctionnalités recensées | 69 |
| Captures exportées | 60 |
| Fichiers sources | 28 |
| Pages entièrement documentées | 13/13 |
| Fonctionnalités documentées (15 champs) | 69/69 |

## Suivi par page
| Page | Artboards desktop | Artboards mobile | Captures | Fichiers doc | Fonctionnalités | Manques |
|---|---|---|---|---|---|---|
| 01 Tâches | 1 | 2 | 3 | 10/10 | 6 | — |
| 02 Assistant IA | 2 | 2 | 6 | 10/10 | 9 | historique mobile + ouverture de conversation à compléter |
| 03 Notifications | 1 | 1 | 4 | 10/10 | 6 | — |
| 04 Comptabilité | 1 | 1 | 4 | 10/10 | 7 | — |
| 05 Documents | 1 | 1 | 3 | 10/10 | 5 | — |
| 06 Modifier la séance (individuelle) | 1 | 1 | 2 | 10/10 | 5 | — |
| 07 Messages | 2 | 4 | 3 | 10/10 | 7 | — |
| 08 Créer un exercice / Créer ma variante | 1 | 1 | 4 | 10/10 | 4 | — |
| 09 Inviter un sportif | 1 | 1 | 8 | 10/10 | 4 | — |
| 10 Nouveau sportif | 1 | 1 | 3 | 10/10 | 4 | — |
| 11 Modifier l’exercice | 1 | 1 | 2 | 10/10 | 6 | — |
| 12 Modifier la séance (individuelle + collective) | 1 | 1 | 4 | 10/10 | 8 | — |
| 13 Paramètres | 1 | 1 | 11 | 10/10 | 7 | Profil hors périmètre |

## Éléments manquants
- 02 : panneau **Historique mobile** non dessiné ; ouverture d’une conversation passée non câblée (desktop).
- 13 : rubrique **Profil** hors périmètre (déjà faite, ne pas toucher).
- Messages d’erreur, états de chargement : non dessinés (propositions PROPOSED).
- Menu hamburger mobile : non dessiné (reprendre l’existant).
- Plafonds ultrawide : proposés, non dessinés.

## Décisions du propriétaire (4 nov. 2026)
- « Facturation » : supprimée du menu (la page n’existe plus).
- En-tête mobile des pages secondaires : règle SH-05 (☰ · ← Parent · ✦ 🔔).
- Paramètres : fenêtre par-dessus la page, pas de page.
- Profil : ne pas toucher.
- Règle permanente : tout retour = « ← Nom de l’écran précédent ».

## Points encore à confirmer
1. Panneau Historique mobile (proposition dans features/assistant-ai-chat-history.md).
2. Modèles de données : groupes (07), inscrits (12), conversations IA (02), notifications masquées (03).

## Validation globale H (5 nov. 2026, D-135)
Les 13 pages sont implémentées (D-119 à D-132). Phase H menée sur 16 écrans (01 Tâches et sa liste, 02, 03, 04, 05, 06, 07 et son fil, 08 et la variante, 09, 10, 11, 12, 13 Préférences / Argent / Données), par un script Playwright puis une vérification à l'œil des cas douteux.

| Contrôle | Résultat |
|---|---|
| Débordement horizontal, 1024 → 3440 et 320 → 430 (9 largeurs) | ✅ aucun |
| Plafonds ultrawide | ✅ conformes à `design-system/responsive.md` ; plafonds des listes validés et appliqués (D-136) : 01 à 1 370 px, 03 à 1 400 px, fil 07 à 860 px |
| Noms accessibles des contrôles | ✅ 0 manquant |
| Clavier : Tab, focus visible, Échap, retour du focus | ✅ (6 fenêtres testées, ordinateur et téléphone) |
| Mouvement réduit | ✅ 0,01 ms |
| Zones tactiles à 390 px (mesure au doigt) | ✅ 4 corrigées, puis toutes les pastilles par `tap-44` (D-136), sans changement visuel ; exceptions : icônes du cadre protégé (40 px), barres et légende du graphique |
| Contrastes (sombre et clair, 1280 et 390) | ✅ 0 texte sous 4,5:1 après les variantes « texte » du design system et le violet d'action des compteurs (D-136) |
| Clavier ouvert, safe areas | ⏳ sur le vrai iPhone : `viewport-fit=cover` validé (D-136), à ajouter et essayer pendant la séance iPhone |
| Non-régression | ✅ lint, types, format, Vitest, base (RLS) et Playwright verts ; cadre et routes inchangés hors décisions |

Décisions d'Antonino (5 nov. 2026, D-136) : (1) contrastes corrigés ; (2) pastilles agrandies au toucher ; (3) `viewport-fit=cover` pendant la séance iPhone (seul point encore ouvert) ; (4) plafonds des listes appliqués.
