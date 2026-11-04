# 06 · Modifier la séance (individuelle) — inventaire automatique des éléments interactifs

> Généré à partir du fichier source : **tous** les éléments qui portent un handler (`onClick`, `onChange`, `onKeyDown`), un lien (`href`) ou un rôle interactif. Le nom du handler renvoie à `source-design-files/pages/06-modifier-seance/logic.js`. Les comportements sont décrits dans `interactions.md`.

## « Modifier séance desktop »

| # | Élément | Libellé / aria | Handler | État exposé |
|---|---|---|---|---|
| 1 | a | Agenda · Coaching force | href=# | — |
| 2 | input | — | onChange={{ setTitle }} | — |
| 3 | button | Répéter chaque semaineLe même jour et à la même heure | onClick={{ toggleRec }} | aria-checked={{ rec }} |
| 4 | input | — | onChange={{ setPrice }} | — |
| 5 | button | {{ p.l }} | onClick={{ p.on }} | — |
| 6 | button | {{ tvaMark }}TVA comprise dans le prix | onClick={{ toggleTva }} | aria-checked={{ tva }} |
| 7 | a | Voir la fiche | href=# | — |

## « Modifier séance mobile »

| # | Élément | Libellé / aria | Handler | État exposé |
|---|---|---|---|---|
| 1 | input | — | onChange={{ setTitle }} | — |
| 2 | button | Répéter chaque semaineMême jour, même heure | onClick={{ toggleRec }} | aria-checked={{ rec }} |
| 3 | input | — | onChange={{ setPrice }} | — |
| 4 | button | {{ p.l }} | onClick={{ p.on }} | — |
| 5 | button | {{ tvaMark }}TVA comprise dans le prix | onClick={{ toggleTva }} | aria-checked={{ tva }} |

