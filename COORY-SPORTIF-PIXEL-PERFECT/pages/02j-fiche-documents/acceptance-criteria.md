# 2j — Critères d’acceptation

## Fidélité visuelle
- [ ] Superposition avec `screenshots/desktop.png` à 1280 px : écart ≤ 1 px.
- [ ] Superposition avec `screenshots/mobile.png` à 390 px : écart ≤ 1 px.
- [ ] Desktop : carte jusqu’au bas du panneau, bord droit aligné.
- [ ] Valeurs CSS conformes à `source-extract.md`.
- [ ] Aucun chevauchement ni retour à la ligne non prévu.

## Responsive
- [ ] 1440, 1920, 2560, 3440 : proportions conservées.
- [ ] 360, 390, 430 : une colonne, pas de scroll horizontal.

## Fonctionnel
- [ ] Interactions de `interactions.md` opérationnelles avec les données réelles.
- [ ] Fonctionnalités existantes conservées ; nouvelles intégrées et testées.

## Vérification (Claude Code, 4/11/2026)
Mesures `getBoundingClientRect` maquette / app : ordinateur 0 px (section 996 × 486 px, bas = bas du
menu) ; téléphone 0 px, sauf la date de démo (« 4 novembre », 0,26 px plus large que « 3 novembre »)
qui passe à la ligne entre la taille et la date. Icône dans la couleur de sa catégorie (D-68) au lieu
de la tuile blanche de la maquette. Détail : `SUIVI_IMPLEMENTATION.md` (D-102).
