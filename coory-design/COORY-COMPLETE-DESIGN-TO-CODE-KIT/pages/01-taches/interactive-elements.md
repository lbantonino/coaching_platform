# 01 · Tâches — inventaire automatique des éléments interactifs

> Généré à partir du fichier source : **tous** les éléments qui portent un handler (`onClick`, `onChange`, `onKeyDown`), un lien (`href`) ou un rôle interactif. Le nom du handler renvoie à `source-design-files/pages/01-taches/logic.js`. Les comportements sont décrits dans `interactions.md`.

## « Tâches desktop »

| # | Élément | Libellé / aria | Handler | État exposé |
|---|---|---|---|---|
| 1 | button | Nouvelle tâche | onClick={{ tapD }} | — |
| 2 | button | {{ s.n }}{{ s.l }} | onClick={{ s.pick }} | aria-pressed={{ s.sel }} |
| 3 | button | {{ l.l }}{{ l.n }} | onClick={{ l.pick }} | aria-pressed={{ l.sel }} |
| 4 | input | Nom de la liste | onChange={{ setListDraft }} onKeyDown={{ onListKey }} | — |
| 5 | button | Nouvelle liste | onClick={{ newListD }} | — |
| 6 | button | Marquer comme terminée | onClick={{ t.toggle }} | aria-checked={{ t.ck }} |
| 7 | input | Nouvelle tâche | onChange={{ setDraft }} onKeyDown={{ onKey }} | — |
| 8 | button | Nouvelle tâche | onClick={{ tapD }} | — |
| 9 | div | — | onClick={{ tapD }} | — |

## « Tâches mobile listes »

| # | Élément | Libellé / aria | Handler | État exposé |
|---|---|---|---|---|
| 1 | button | {{ s.n }}{{ s.l }} | onClick={{ s.pick }} | aria-pressed={{ s.sel }} |
| 2 | button | {{ l.l }}{{ l.n }} | onClick={{ l.pick }} | aria-pressed={{ l.sel }} |
| 3 | input | Nom de la liste | onChange={{ setListDraft }} onKeyDown={{ onListKey }} | — |
| 4 | button | Nouvelle liste | onClick={{ newListM }} | — |
| 5 | button | Nouvelle tâche | onClick={{ fabHome }} | — |

## « Tâches mobile liste »

| # | Élément | Libellé / aria | Handler | État exposé |
|---|---|---|---|---|
| 1 | a | Listes | href=#1b | — |
| 2 | button | {{ c.l }} | onClick={{ c.pick }} | aria-selected={{ c.sel }} |
| 3 | button | Marquer comme terminée | onClick={{ t.toggle }} | aria-checked={{ t.ck }} |
| 4 | input | Nouvelle tâche | onChange={{ setDraft }} onKeyDown={{ onKey }} | — |
| 5 | div | — | onClick={{ tapM }} | — |
| 6 | button | Nouvelle tâche | onClick={{ tapM }} | — |

