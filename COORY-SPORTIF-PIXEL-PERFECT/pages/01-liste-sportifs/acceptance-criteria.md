# 1a / 1b — Critères d’acceptation

## Fidélité visuelle
- [x] Superposition avec `screenshots/desktop.png` à 1280 px : écart ≤ 1 px sur positions et dimensions.
- [x] Superposition avec `screenshots/mobile.png` à 390 px : écart ≤ 1 px.
- [x] Colonnes du tableau exactement aux proportions données.
- [x] Noms longs tronqués avec ellipse, symbole sexe toujours visible.
- [x] Mobile : chaque sportif en carte-ligne, objectif en sous-carte.
- [x] Couleurs, polices, rayons, ombres conformes à `source-extract.md`.
- [x] Aucun chevauchement ni retour à la ligne non prévu.

## Responsive
- [x] 1440, 1920, 2560, 3440 : proportions conservées, pas de débordement.
- [x] 360, 390, 430 : une colonne, pas de scroll horizontal non prévu.

## Fonctionnel
- [x] Toutes les interactions de `interactions.md` fonctionnent avec les données réelles.
- [x] Fonctionnalités existantes de la page toutes conservées (liste établie avant modification).
- [x] Nouvelles fonctionnalités intégrées et testées.

## Vérification (Claude Code, 3/11/2026)
Mesures par `getBoundingClientRect` sur la maquette HTML et sur l'app aux mêmes largeurs : écart 0 px
sur la coque, les filtres, les colonnes, les lignes et le pied (1280), et sur la barre, les filtres et
les cartes (390). Écarts volontaires, signalés : loupe de la recherche d'en-tête non écrasée (la
maquette la réduit à 5 px), « Fiche à compléter » gardé sur téléphone, gris discret `#6e6c79` au lieu
de `#8b8996` (contraste), photo de profil dans l'avatar quand elle existe, interactions « ··· » et
« Choisir » branchées sur les menus existants. Détail : `SUIVI_IMPLEMENTATION.md` (D-91).
