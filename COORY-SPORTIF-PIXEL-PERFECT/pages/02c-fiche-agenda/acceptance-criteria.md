# 2c — Critères d’acceptation

## Fidélité visuelle
- [x] Superposition avec `screenshots/desktop.png` à 1280 px : écart ≤ 1 px sur positions et dimensions.
- [x] Superposition avec `screenshots/mobile.png` à 390 px : écart ≤ 1 px.
- [x] 5 séances alignées en desktop, empilées en mobile.
- [x] Semaine actuelle encadrée en violet.
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
Mesures `getBoundingClientRect` maquette / app : ordinateur ≤ 0,5 px, téléphone 0 px. Interactions
vérifiées au navigateur et par Playwright : Semaine / Toutes les semaines, ‹ ›, menu des semaines,
bandeau et « Revenir à la semaine », ouverture d'une séance. Écart voulu : numéros Running et Hyrox
en texte foncé (contraste). Détail : `SUIVI_IMPLEMENTATION.md` (D-94).
