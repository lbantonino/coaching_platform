# 2a — Critères d’acceptation

## Fidélité visuelle
- [x] Superposition avec `screenshots/desktop.png` à 1280 px : écart ≤ 1 px sur positions et dimensions.
- [x] Superposition avec `screenshots/mobile.png` à 390 px : écart ≤ 1 px.
- [x] Grille 2 colonnes, hauteurs égales par ligne.
- [x] Repères aux couleurs de discipline avec pastille icône.
- [x] Mobile : titres de section hors carte + lien Modifier.
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
Mesures `getBoundingClientRect` maquette / app : ordinateur 0 px sur l'en-tête, la carte d'identité,
les onglets, les lignes et l'historique, ≤ 0,5 px ailleurs ; téléphone ≤ 0,5 px par élément.
Écarts volontaires : ligne « Canal préféré » (ancien chiffre clé), « ··· » dans la carte d'identité
du téléphone (actions de l'en-tête), lien « ← Sportifs » sous la barre du téléphone (règle
d'Antonino), note visible par le sportif gardée, « Écrire » remplacé par « Inviter » pour un
sportif sans compte. Détail : `SUIVI_IMPLEMENTATION.md` (D-92).
