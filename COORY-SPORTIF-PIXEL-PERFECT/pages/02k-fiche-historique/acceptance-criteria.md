# 2k — Critères d’acceptation

## Fidélité visuelle
- [x] Superposition avec `screenshots/desktop.png` à 1280 px : écart ≤ 1 px.
- [x] Superposition avec `screenshots/mobile.png` à 390 px : écart ≤ 1 px.
- [x] 6 éléments par défaut, total dans le bouton.
- [x] Valeurs CSS conformes à `source-extract.md`.
- [x] Aucun chevauchement ni retour à la ligne non prévu.

## Responsive
- [x] 1440, 1920, 2560, 3440 : proportions conservées.
- [x] 360, 390, 430 : une colonne, pas de scroll horizontal.

## Fonctionnel
- [x] Interactions de `interactions.md` opérationnelles avec les données réelles.
- [x] Fonctionnalités existantes conservées ; nouvelles intégrées et testées.

## Vérification (Claude Code, 4/11/2026)
Mesures `getBoundingClientRect` maquette / app : 0 px sur ordinateur et téléphone (carte, bouton,
premier événement, titre et date). Écarts dus aux données : compteur (32 au lieu de 16) et dernier
événement avec détail. « Voir tout / Réduire » testé par Playwright (ordinateur et téléphone).
Détail : `SUIVI_IMPLEMENTATION.md` (D-104).
