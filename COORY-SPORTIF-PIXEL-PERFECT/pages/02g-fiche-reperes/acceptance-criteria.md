# 2g — Critères d’acceptation

## Fidélité visuelle
- [x] Superposition avec `screenshots/desktop.png` à 1280 px : écart ≤ 1 px.
- [x] Superposition avec `screenshots/mobile.png` à 390 px : écart ≤ 1 px.
- [x] Deux cartes changeables et inversables.
- [x] Menus repère + période côte à côte.
- [x] Valeurs CSS conformes à `source-extract.md`.
- [x] Aucun chevauchement ni retour à la ligne non prévu.

## Responsive
- [x] 1440, 1920, 2560, 3440 : proportions conservées.
- [x] 360, 390, 430 : une colonne, pas de scroll horizontal.

## Fonctionnel
- [x] Interactions de `interactions.md` opérationnelles avec les données réelles.
- [x] Fonctionnalités existantes conservées ; nouvelles intégrées et testées.

## Vérification (Claude Code, 3/11/2026)
Mesures `getBoundingClientRect` maquette / app : ordinateur et téléphone 0 px sur les blocs (valeur
des cartes 2,5 px plus bas à l'intérieur de la carte). Interactions vérifiées au navigateur :
Changer (échange si le repère est déjà sur l'autre carte), Inverser, menu du repère, période (avec
« Depuis le début » en plus). Détail : `SUIVI_IMPLEMENTATION.md` (D-97).
