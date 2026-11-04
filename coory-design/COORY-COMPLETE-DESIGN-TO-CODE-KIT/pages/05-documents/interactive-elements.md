# 05 · Documents — inventaire automatique des éléments interactifs

> Généré à partir du fichier source : **tous** les éléments qui portent un handler (`onClick`, `onChange`, `onKeyDown`), un lien (`href`) ou un rôle interactif. Le nom du handler renvoie à `source-design-files/pages/05-documents/logic.js`. Les comportements sont décrits dans `interactions.md`.

## « Documents desktop »

| # | Élément | Libellé / aria | Handler | État exposé |
|---|---|---|---|---|
| 1 | input | Rechercher un document, un sportif… | onChange={{ setQ }} | — |
| 2 | button | Catégorie{{ catLabel }} | onClick={{ openD }} | — |
| 3 | button | {{ f.l }}{{ f.n }}{{ f.mark }} | onClick={{ f.on }} | — |
| 4 | button | Catégorie | onClick={{ sortCat.on }} | — |
| 5 | button | Ajouté le | onClick={{ sortDate.on }} | — |
| 6 | button | {{ moreLabel }} | onClick={{ toggleMore }} | — |

## « Documents mobile »

| # | Élément | Libellé / aria | Handler | État exposé |
|---|---|---|---|---|
| 1 | input | Rechercher | onChange={{ setQ }} | — |
| 2 | button | Catégorie{{ catLabel }} | onClick={{ openM }} | — |
| 3 | button | {{ f.l }}{{ f.n }}{{ f.mark }} | onClick={{ f.on }} | — |
| 4 | button | {{ moreLabel }} | onClick={{ toggleMore }} | — |

