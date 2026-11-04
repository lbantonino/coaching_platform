# 2h — Critères d’acceptation

## Fidélité visuelle
- [x] Superposition avec `screenshots/desktop.png` à 1280 px : écart ≤ 1 px.
- [x] Superposition avec `screenshots/mobile.png` à 390 px : écart ≤ 1 px.
- [x] Pastilles sélectionnées préfixées « ✓ ».
- [x] Valeurs CSS conformes à `source-extract.md`.
- [x] Aucun chevauchement ni retour à la ligne non prévu.

## Responsive
- [x] 1440, 1920, 2560, 3440 : proportions conservées.
- [x] 360, 390, 430 : une colonne, pas de scroll horizontal.

## Fonctionnel
- [x] Interactions de `interactions.md` opérationnelles avec les données réelles.
- [x] Fonctionnalités existantes conservées ; nouvelles intégrées et testées.

## Vérification (Claude Code, 4/11/2026)
Mesures `getBoundingClientRect` maquette / app : section 996 × 452,75 px (ordinateur) et
362 × 672,25 px (téléphone) identiques, tous les blocs à 0 px, pastilles à 0,2 px près (« ✓ »
resserré de -0,75 px). Enregistrement, jours cochés et message vérifiés par Playwright
(availability.spec, ordinateur et téléphone). Détail : `SUIVI_IMPLEMENTATION.md` (D-98).

Écart voulu (Antonino, 4/11, ordinateur seulement) : la carte descend jusqu'au bas du menu de gauche,
les contraintes d'organisation prennent la hauteur libre, le bouton s'aligne sur le nom du coach.
