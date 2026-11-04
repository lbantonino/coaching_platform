# 16 — Vue de l’agenda · Mobile

Capture : ![](screenshots/mobile-original.png)

Toutes les valeurs ci-dessous sont **exactes** : extraites du fichier source `Coory Boites.dc.html` (styles inline). Les largeurs de colonnes marquées « ≈ » sont calculées.

## Géométrie

| Propriété | Valeur | Statut |
|---|---|---|
| Cadre de référence | 390px × 844px | exact (source) |
| Type | bottom sheet | exact |
| Position | feuille du bas : left 0, right 0, bottom 0 | exact |
| Largeur | 100 % du viewport (390 px) | exact |
| Hauteur | selon contenu · max calc(100% - 44px) | exact |
| Rayon | 28px 28px 0 0 | exact |
| Fond | #ffffff | exact |
| Ombre | 0 30px 80px -20px rgba(23,21,29,.45), 0 0 0 1px rgba(23,21,29,.05) | exact |
| Overlay | rgba(23,21,29,.44) plein écran | exact |
| Poignée | 40 × 5 px, rayon 5, #dcdae3, padding 10 px 0 2 px | exact |
| En-tête | padding 10px 18px 10px 20px · titre 21px/1.2 700 · sous-titre 14/1.5 400 #64626e · fermer 38 px | exact |
| Liste | padding 4px 10px 20px · ligne min-height 62px · padding 8 px 12 px · rayon 14 · gap 2 px | exact |
| Tuile d’icône | 38 × 38, rayon 11, icône 19 px trait 1.8 | exact |
| Libellé / description | 15.5 px 600 / 13 px 400 #64626e | exact |

## Contenu (haut → bas)

| # | Élément | Texte | Icône (Lucide) | État |
|---|---|---|---|---|
| 1 | Action | Aujourd’hui | calendar-check · tuile color-mix(in srgb, #6a3ee0 16%, #fff) · icône #6a3ee0 | à droite « mer. 4 nov. » |
| 2 | Titre de section | « VUE » | — | — |
| 3 | Action | Liste | rows-2 (approx.) · tuile #f3f2f7 · icône #17151d | — |
| 4 | Action | Jour | square · tuile #f3f2f7 · icône #17151d | — |
| 5 | Action | 3 jours | columns-3 · tuile #f3f2f7 · icône #17151d | sélectionné (fond #f5f1fe + coche violette) |
| 6 | Action | Semaine | calendar · tuile #f3f2f7 · icône #17151d | — |
| 7 | Action | Mois | layout-grid · tuile #f3f2f7 · icône #17151d | — |
| 8 | Titre de section | « SÉANCES » | — | — |
| 9 | Case cochée | Individuelles | pastille #6a3ee0 | — |
| 10 | Case cochée | Collectives | pastille #c4b5fd | — |
