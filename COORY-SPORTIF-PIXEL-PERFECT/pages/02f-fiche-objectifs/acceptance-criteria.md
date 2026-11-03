# 2f — Critères d’acceptation

## Fidélité visuelle
- [x] Superposition avec `screenshots/desktop.png` à 1280 px : écart ≤ 1 px.
- [x] Superposition avec `screenshots/mobile.png` à 390 px : écart ≤ 1 px.
- [x] Objectif principal en jaune #fdf0d2, secondaire en blanc.
- [x] Valeurs CSS conformes à `source-extract.md`.
- [x] Aucun chevauchement ni retour à la ligne non prévu.

## Responsive
- [x] 1440, 1920, 2560, 3440 : proportions conservées.
- [x] 360, 390, 430 : une colonne, pas de scroll horizontal.

## Fonctionnel
- [x] Interactions de `interactions.md` opérationnelles avec les données réelles.
- [x] Fonctionnalités existantes conservées ; nouvelles intégrées et testées.

## Vérification (Claude Code, 3/11/2026)
Mesures `getBoundingClientRect` maquette / app : ordinateur et téléphone 0 px. Toutes les
interactions existantes conservées et testées (Playwright). Écarts voulus : en-tête des cartes refait
au choix d'Antonino (sur-titre « Objectif Principal · Compétition », discipline en texte, nombre de
jours en grand à droite, au lieu des pastilles et du « J-137 ») ; « Date passée » en ambre. Détail :
`SUIVI_IMPLEMENTATION.md` (D-95).
