# 13 · Paramètres — inventaire automatique des éléments interactifs

> Généré à partir du fichier source : **tous** les éléments qui portent un handler (`onClick`, `onChange`, `onKeyDown`), un lien (`href`) ou un rôle interactif. Le nom du handler renvoie à `source-design-files/pages/13-parametres/logic.js`. Les comportements sont décrits dans `interactions.md`.

## « Paramètres desktop »

| # | Élément | Libellé / aria | Handler | État exposé |
|---|---|---|---|---|
| 1 | button | {{ t.l }}{{ t.s }} | onClick={{ t.on }} | — |
| 2 | button | {{ o.l }} | onClick={{ o.on }} | — |
| 3 | button | {{ r.l }}{{ r.d }} | onClick={{ r.on }} | aria-checked={{ r.aria }} |

## « Paramètres mobile »

| # | Élément | Libellé / aria | Handler | État exposé |
|---|---|---|---|---|
| 1 | button | {{ cur.l }}{{ cur.s }} | onClick={{ toggleM }} | aria-expanded={{ mAria }} |
| 2 | button | {{ t.l }}{{ t.check }} | onClick={{ t.mon }} | — |
| 3 | button | {{ o.l }} | onClick={{ o.on }} | — |
| 4 | button | {{ r.l }}{{ r.d }} | onClick={{ r.on }} | aria-checked={{ r.aria }} |

