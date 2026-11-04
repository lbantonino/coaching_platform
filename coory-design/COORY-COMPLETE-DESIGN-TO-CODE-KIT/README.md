# COORY — Kit Design-to-Code complet (planche « Coory Pages »)

Ce dossier transmet à **Claude Code** tout le travail de design de la planche **Coory Pages** (13 pages, 01 → 13) : captures, valeurs CSS exactes, textes, interactions, fonctionnalités, ordre d’implémentation et contrôle qualité.

## Périmètre
- **Inclus** : 01 Tâches · 02 Assistant IA · 03 Notifications · 04 Comptabilité · 05 Documents · 06 Modifier la séance · 07 Messages · 08 Créer un exercice / ma variante · 09 Inviter un sportif · 10 Nouveau sportif · 11 Modifier l’exercice · 12 Modifier la séance (individuelle + collective) · 13 Paramètres — et leurs modales/panneaux.
- **Kits complémentaires du même projet** (à lire aussi, non dupliqués ici) : `COORY-SPORTIF-PIXEL-PERFECT/` (liste Sportifs + 11 onglets de fiche) et `COORY-MODALS-PIXEL-PERFECT-KIT/` (36 boîtes de dialogue). Ils partagent le même shell et le même design system.

## Les 3 sources de vérité
| Source | Fait foi pour |
|---|---|
| **A. Maquettes** (`source-design-files/`, `pages/*/screenshots/`) | disposition, dimensions, couleurs, typo, composants, responsive |
| **B. Code COORY existant** | fonctionnalités, données, routes, API, permissions, validations, règles métier |
| **C. Nouvelles fonctionnalités** (`features/FEATURE-INDEX.md`) | à intégrer si **NEW-VALIDATED** ; ne rien faire sur PROPOSED / À COMPLÉTER sans accord |

Claude Code **adapte** l’application aux maquettes ; il ne la reconstruit pas, ne redessine pas le shell global, ne supprime aucune fonctionnalité.

## Par où commencer
1. `MASTER-INDEX.md` → 2. `design-system/` → 3. `global-shell/` → 4. `IMPLEMENTATION-ORDER.md` → 5. `CLAUDE-CODE-MASTER-PROMPT.md` (à donner tel quel à Claude Code).

## Comment lire les valeurs
- `pages/*/layout-measurements.md` = **valeurs exactes** extraites automatiquement des styles inline des fichiers sources (aucune estimation). Seules les valeurs marquées « PROPOSED » ailleurs dans le kit sont des propositions.
- Les captures sont des rendus 2× des fichiers sources. Le rendu d’export peut, à de rares endroits, couper un titre sur deux lignes (ex. « Messages non lus ») : **le fichier source et les mesures font foi**.
- La barre d’état « 9:41 · 5G », le cadre arrondi des artboards et les **notes jaunes** sont des éléments de présentation : ne pas les implémenter.

## Ouvrir les maquettes
Les fichiers `.dc.html` de `source-design-files/pages/` s’ouvrent dans un navigateur (avec `source-design-files/shared/support.js` placé à côté) et sont **interactifs** (onglets, menus, états).
