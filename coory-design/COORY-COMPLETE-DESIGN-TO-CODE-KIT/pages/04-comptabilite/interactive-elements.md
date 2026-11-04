# 04 · Comptabilité — inventaire automatique des éléments interactifs

> Généré à partir du fichier source : **tous** les éléments qui portent un handler (`onClick`, `onChange`, `onKeyDown`), un lien (`href`) ou un rôle interactif. Le nom du handler renvoie à `source-design-files/pages/04-comptabilite/logic.js`. Les comportements sont décrits dans `interactions.md`.

## « Comptabilité desktop »

| # | Élément | Libellé / aria | Handler | État exposé |
|---|---|---|---|---|
| 1 | button | {{ p.l }} | onClick={{ p.pick }} | aria-selected={{ p.sel }} |
| 2 | button | {{ b.aria }} | onClick={{ b.pick }} | aria-pressed={{ b.sel }} |
| 3 | button | {{ c.l }} | onClick={{ c.pick }} | aria-pressed={{ c.sel }} |
| 4 | button | {{ t.l }} | onClick={{ t.pick }} | aria-selected={{ t.sel }} |
| 5 | button | {{ f.l }} | onClick={{ f.pick }} | aria-pressed={{ f.sel }} |
| 6 | button | Actions | (statique en maquette) | — |
| 7 | button | {{ mv.moreL }} | onClick={{ toggleAll }} | — |
| 8 | button | Tableau de comptabilité{{ tableSub }} {{ tableBtn }} | onClick={{ toggleTable }} | aria-expanded={{ tableExp }} |
| 9 | button | {{ emptyL }} | onClick={{ toggleEmpty }} | — |

## « Comptabilité mobile »

| # | Élément | Libellé / aria | Handler | État exposé |
|---|---|---|---|---|
| 1 | button | {{ p.l }} | onClick={{ p.pick }} | aria-selected={{ p.sel }} |
| 2 | button | {{ b.aria }} | onClick={{ b.pick }} | aria-pressed={{ b.sel }} |
| 3 | button | {{ c.l }} | onClick={{ c.pick }} | aria-pressed={{ c.sel }} |
| 4 | button | {{ t.l }} | onClick={{ t.pick }} | aria-selected={{ t.sel }} |
| 5 | button | {{ f.l }} | onClick={{ f.pick }} | aria-pressed={{ f.sel }} |
| 6 | button | Actions | (statique en maquette) | — |
| 7 | button | {{ mv.moreL }} | onClick={{ toggleAll }} | — |
| 8 | button | Tableau de comptabilité{{ tableSub }} {{ tableBtn }} | onClick={{ toggleTable }} | aria-expanded={{ tableExp }} |
| 9 | div | — | onClick={{ closeSheet }} | — |
| 10 | button | {{ s.l }} | onClick={{ closeSheet }} | — |
| 11 | button | {{ fabLabel }} | onClick={{ toggleSheet }} | aria-expanded={{ sheetExp }} |

