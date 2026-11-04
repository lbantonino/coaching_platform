# Règles responsive

## Points de rupture (proposés, à aligner sur ceux de l’app)
- **Mobile** < 768 px : maquette 390 px (zone de contenu = 390 − 2×14 = 362 px).
- **Tablette** 768–1023 px : non dessinée → appliquer la mise en page mobile élargie (une colonne), sidebar en tiroir.
- **Desktop** ≥ 1024 px : maquette 1280 px.

## Desktop (1280 → 3440)
- Coque : sidebar fixe **236 px** (ne s’étire pas), `main` en `flex:1; min-width:0`.
- **Largeur max du contenu** : la fiche est contrainte à `max-width:1600px; margin:0 auto` (exact, source). Au-delà (2560, 3440), le contenu reste centré dans `main`, la sidebar reste à gauche. Le header global suit la largeur de `main`.
- Grilles de cartes : `repeat(2, minmax(0,1fr))` en Vue d’ensemble ; grilles internes `repeat(auto-fit, minmax(min(100%,240–260px),1fr))` → s’adaptent seules.
- Tableau 1a : colonnes en fractions (`20px 1.7fr .8fr 1fr 1.6fr 150px`) → s’élargissent proportionnellement ; noms tronqués avec ellipse seulement si nécessaire.
- **Alignements bas validés** : sur 2d, 2j, 2k le contenu de `main` s’étire jusqu’au bas de la sidebar (le cadre est en `align-items:stretch`, le contenu en `flex:1`).
- Aucun défilement horizontal de page. La barre d’onglets défile horizontalement si elle ne tient pas (barre masquée).

## Mobile (360 → 430)
- Top bar : hamburger 44 · lien retour / titre · groupe d’actions (IA, cloche, +) dans une pilule blanche.
- Contenu en une colonne, cartes pleine largeur, padding latéral 14.
- Onglets → sélecteur déroulant.
- Champs en 16 px, cibles tactiles ≥ 40–44 px.
- Les grilles `auto-fit` passent naturellement à une colonne.
- Zones sûres : prévoir `padding-bottom: env(safe-area-inset-bottom)` sur les pages longues (non dessiné, à ajouter).
- Clavier virtuel : champs en bas de page doivent rester visibles (`scroll-margin`), non dessiné.
