# COORY — Parcours Sportif · Dossier Pixel Perfect

Cahier des charges d’implémentation UI/UX des écrans **Sportifs** de COORY (liste + fiche sportif + détail de séance), desktop et mobile.

## Source unique
Planche `Coory Sportifs.dc.html` (copiée dans `reference/source/`), qui importe `CooryFicheSportif.dc.html` (onglets de la fiche) et `CooryFicheSeance.dc.html` (détail d’une séance).

## Inventaire réel
La planche contient **12 pages = 24 écrans** (12 desktop à 1280 px + 12 mobile à 390 px). Il n’y a **pas 30 pages** : voir `MASTER-INDEX.md` § « Écrans absents ».

## Niveaux de vérité (du plus fort au plus faible)
1. `reference/source/*.dc.html` — **valeurs CSS exactes** (tout le style est inline). En cas de doute, c’est la référence.
2. `pages/*/source-extract.md` — même source, découpée par page et indentée (lecture rapide, valeurs exactes).
3. `pages/*/screenshots/*.png` — rendu de référence, capturé en **2×** (diviser les mesures par 2 pour obtenir des px CSS).
4. `pages/*/specification.md`, `desktop.md`, `mobile.md`, `interactions.md` — description rédigée, hiérarchie, comportements.
5. `reference/logic/*.logic.js` — logique de la maquette (données de démonstration, calculs des états). **Ne pas copier les données de démo** : utiliser les vraies données COORY.

## Ordre de lecture
1. `README.md` (ce fichier) → 2. `MASTER-INDEX.md` → 3. `design-system/` → 4. `shared-components/` → 5. `IMPLEMENTATION-GUIDE.md` → 6. une page à la fois dans `pages/`.

## Arborescence
```text
COORY-SPORTIF-PIXEL-PERFECT/
├── README.md · MASTER-INDEX.md · IMPLEMENTATION-GUIDE.md · FUNCTIONAL-GAP-ANALYSIS.md
├── design-system/        colors · typography · spacing · components · responsive · accessibility
├── shared-components/    navigation · headers · cards · forms · modals · source-shell-fiche · source-fiche-header
├── pages/<nn-nom>/       specification · desktop · mobile · interactions · acceptance-criteria · source-extract · screenshots/
├── quality-assurance/    visual · responsive · functional · regression
└── reference/            source/ (maquettes exactes) · logic/ (logique des maquettes)
```

## Règle absolue
Ne pas reconstruire COORY. Adapter l’apparence des pages existantes, réutiliser les composants existants, ajouter seulement les fonctionnalités nouvelles identifiées dans `FUNCTIONAL-GAP-ANALYSIS.md`, ne supprimer aucun comportement métier.

## Conventions de ce dossier
- **Exact** = valeur lue dans la source. **Estimé** = déduit d’une capture (toujours signalé).
- « Données de démo » = contenu d’exemple (Inès Benali, Gianluca Lo Bianco, dates…) à remplacer par les données réelles.
- Couleurs en hex/rgba telles qu’écrites dans la source.
