# 2b — Critères d’acceptation

## Fidélité visuelle
- [x] Superposition avec `screenshots/desktop.png` à 1280 px : écart ≤ 1 px sur positions et dimensions.
- [x] Superposition avec `screenshots/mobile.png` à 390 px : écart ≤ 1 px.
- [x] Carte photo compacte sur une ligne en desktop, boutons dessous en mobile.
- [x] 5 groupes avec sur-titres en majuscules.
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
Mesures `getBoundingClientRect` maquette / app : ordinateur 0 px jusqu'au bas de la carte
Informations (1287,5 px), pastilles ≤ 0,8 px ; téléphone 0 px sauf l'aide de l'adresse.
Écarts volontaires : aide de l'adresse de D-90 (« Utile pour ses factures, faites dans ton logiciel
de facturation. », deux lignes sur téléphone, +18 px) ; « Ajouter la photo » sans « Retirer » quand
le sportif n'a pas de photo ; champs en 16 px sur téléphone (zoom iOS). Barre d'onglets de
l'ordinateur sans piste, onglet ouvert en verre (demande d'Antonino). Détail :
`SUIVI_IMPLEMENTATION.md` (D-93).
