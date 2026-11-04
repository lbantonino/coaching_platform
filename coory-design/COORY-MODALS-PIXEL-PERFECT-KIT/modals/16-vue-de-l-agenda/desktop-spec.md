# 16 — Vue de l’agenda · Desktop

Capture : ![](screenshots/desktop-original.png)

Toutes les valeurs ci-dessous sont **exactes** : extraites du fichier source `Coory Boites.dc.html` (styles inline). Les largeurs de colonnes marquées « ≈ » sont calculées.

## Géométrie

| Propriété | Valeur | Statut |
|---|---|---|
| Cadre de référence | 1200px × 780px | exact (source) |
| Type | menu ancré (popover) | exact |
| Position | ancré : left 560px, top 82px, bottom auto (dans un cadre 1200×780 ; à ancrer au bouton déclencheur) | exact |
| Largeur | 280px | exact |
| Hauteur | selon contenu · max 720px | exact |
| Rayon | 18px | exact |
| Fond | #ffffff | exact |
| Ombre | 0 30px 80px -20px rgba(23,21,29,.45), 0 0 0 1px rgba(23,21,29,.05) | exact |
| Overlay | rgba(23,21,29,.44) plein écran | exact |
| En-tête | aucun | exact |
| Liste | padding 8px · ligne min-height 50px · padding 8 px 12 px · rayon 14 · gap 2 px | exact |
| Tuile d’icône | 38 × 38, rayon 11, icône 19 px trait 1.8 | exact |
| Libellé / description | 15.5 px 600 / 13 px 400 #64626e | exact |

## Contenu (haut → bas)

| # | Élément | Texte | Icône (Lucide) | État |
|---|---|---|---|---|
| 1 | Action | Jour | square · tuile #f3f2f7 · icône #17151d | à droite « J » |
| 2 | Action | Semaine | calendar · tuile #f3f2f7 · icône #17151d | sélectionné (fond #f5f1fe + coche violette), à droite « S » |
| 3 | Action | Mois | layout-grid · tuile #f3f2f7 · icône #17151d | à droite « M » |
| 4 | Action | Liste | rows-2 (approx.) · tuile #f3f2f7 · icône #17151d | à droite « L » |
