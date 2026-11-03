# 2d — Critères d’acceptation

## Fidélité visuelle
- [x] Superposition avec `screenshots/desktop.png` à 1280 px : écart ≤ 1 px sur positions et dimensions.
- [x] Superposition avec `screenshots/mobile.png` à 390 px : écart ≤ 1 px.
- [x] Étapes 1-2-3 empilées, lues avant le graphique.
- [x] Graphique compact en bas de la carte.
- [x] Bas des cartes aligné sur le bas du panneau latéral.
- [x] Mobile : Séance puis Récapitulatif puis Conseil.
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
Mesures `getBoundingClientRect` maquette / app : ordinateur 0 px, téléphone ≤ 1 px. Les durées,
allures et récupérations sont lues dans le texte des séances (module testé) ; une séance sans
durées s'affiche sans déroulé. Écart voulu : numéro du bloc principal en texte foncé (contraste).
Détail : `SUIVI_IMPLEMENTATION.md` (D-96).
