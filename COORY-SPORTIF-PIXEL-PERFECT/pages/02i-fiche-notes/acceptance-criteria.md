# 2i — Critères d’acceptation

## Fidélité visuelle
- [ ] Superposition avec `screenshots/desktop.png` à 1280 px : écart ≤ 1 px.
- [ ] Superposition avec `screenshots/mobile.png` à 390 px : écart ≤ 1 px.
- [ ] Bandeau d’accord sans chevauchement.
- [ ] Notes libres et Message côte à côte en desktop.
- [ ] Valeurs CSS conformes à `source-extract.md`.
- [ ] Aucun chevauchement ni retour à la ligne non prévu.

## Responsive
- [ ] 1440, 1920, 2560, 3440 : proportions conservées.
- [ ] 360, 390, 430 : une colonne, pas de scroll horizontal.

## Fonctionnel
- [ ] Interactions de `interactions.md` opérationnelles avec les données réelles.
- [ ] Fonctionnalités existantes conservées ; nouvelles intégrées et testées.

## Vérification (Claude Code, 4/11/2026)
Écarts VOULUS par Antonino (4/11) : carte « Message au sportif » retirée ; « Notes libres » en haut,
pleine largeur ; « Blessures et points d'attention » en dessous, étirée jusqu'au bas du menu sur
ordinateur. Mesures `getBoundingClientRect` maquette / app à l'intérieur des cartes : 0 px (Blessures
ordinateur et téléphone, Notes libres téléphone). Parcours vérifiés par Playwright (notes.spec,
availability.spec). Détail : `SUIVI_IMPLEMENTATION.md` (D-99).
