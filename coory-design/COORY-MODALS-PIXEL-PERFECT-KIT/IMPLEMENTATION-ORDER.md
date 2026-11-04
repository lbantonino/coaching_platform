# IMPLEMENTATION ORDER

Justification : 4 composants partagés couvrent 34 boîtes sur 36. On construit d’abord ces composants, puis on les valide sur les boîtes les plus simples, avant les cas complexes.

## Phase A — Fondations
Tokens (design-system/colors.md), ModalShell (center / anchored / sheet), overlay, focus trap, Échap, en-tête, pied, boutons, Field (tous types).
**Critère de passage** : un ModalShell vide s’ouvre/ferme au clavier et à la souris, desktop + mobile.
**État** : ✅ faite le 04/11/2026 (jetons --dlg-*, `src/components/ui/dialog-styles.ts`, `src/components/ui/overlay.tsx` : coque, DialogHeader, DialogFooter, Sheet, PanelDialog, ActionMenu, ConfirmDialog). Le menu ancré (16, 32) sera fait en phase G.

## Phase B — Menus simples (ActionMenu)
36, 30, 17, 05, 22, 09 — une seule liste, pas de sous-menu.
Risque : faible. Vérifier tuiles d’icônes, états destructifs.
**État** : ✅ faite le 04/11/2026, 0 px d'écart mesuré. Écarts signalés : 17 sans « ••• » sur téléphone, texte de 05 (préremplissage pas encore codé), role="menu" non appliqué.

## Phase C — Confirmations (ConfirmDialog)
11, 12, 18, 20, 25, 29, 31, 35 — composant unique, textes différents.
Prérequis : B (ouvertes depuis des menus). Risque : actions destructives — ne pas changer les appels.
**État** : ✅ faite le 04/11/2026, 0 px d'écart mesuré ; texte de 29 corrigé selon l'endroit (documents / dépenses).

## Phase D — Menus avec sélection et sous-menus
07, 08, 14, 15 (sélection ✓), puis 06, 13 (chevrons vers 07/08/14/15), puis 01 (chevrons vers formulaires).
Risque : navigation menu → sous-menu → retour.
**État** : ✅ faite le 04/11/2026, 0 px d'écart mesuré ; sous-titres réels (statut · niveau · discipline), icônes du kit pour Running et Hybride.

## Phase E — Formulaires simples
24, 03, 19 (avec Supprimer → 20), 21 (zone de dépôt).

## Phase F — Formulaires riches
02, 04, 10, 27, 34 (dépendances : récurrence, forfait, compétition, conversion), 26 et 28 (CategoryList, 28 ouvert depuis 27, 29 depuis 28).

## Phase G — Cas à part
16 (menu ancré + feuille mobile différente), 32 (menu ancré bas-gauche, thème).

## Phase H — Grands panneaux
23 (aperçu PDF réel), 33 (paramètres, navigation latérale ; 34 et 35 s’y ouvrent).

## Phase I — Validation globale
Relancer quality-assurance/* sur les 36 boîtes, desktop et mobile.
