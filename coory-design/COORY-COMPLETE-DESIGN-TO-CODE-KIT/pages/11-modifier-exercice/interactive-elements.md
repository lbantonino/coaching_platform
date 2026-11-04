# 11 · Modifier l’exercice — inventaire automatique des éléments interactifs

> Généré à partir du fichier source : **tous** les éléments qui portent un handler (`onClick`, `onChange`, `onKeyDown`), un lien (`href`) ou un rôle interactif. Le nom du handler renvoie à `source-design-files/pages/11-modifier-exercice/logic.js`. Les comportements sont décrits dans `interactions.md`.

## « Modifier exercice desktop »

| # | Élément | Libellé / aria | Handler | État exposé |
|---|---|---|---|---|
| 1 | a | {{ crumb }} | href=# | — |
| 2 | a | Voir l’original | href=# | — |
| 3 | input | Ex. Squat goblet | onChange={{ setName }} | — |
| 4 | button | {{ c.mark }}{{ c.l }} | onClick={{ c.on }} | — |
| 5 | button | {{ c.mark }}{{ c.l }} | onClick={{ c.on }} | — |
| 6 | textarea | Tiens-toi debout, pieds à largeur de hanches.
Descends en ga | (statique en maquette) | — |
| 7 | input | https://www.instagram.com/reel/… | (statique en maquette) | — |

## « Modifier exercice mobile »

| # | Élément | Libellé / aria | Handler | État exposé |
|---|---|---|---|---|
| 1 | a | Original | href=# | — |
| 2 | input | Ex. Squat goblet | onChange={{ setName }} | — |
| 3 | button | {{ c.mark }}{{ c.l }} | onClick={{ c.on }} | — |
| 4 | button | {{ c.mark }}{{ c.l }} | onClick={{ c.on }} | — |
| 5 | textarea | Tiens-toi debout, pieds à largeur de hanches.
Descends en ga | (statique en maquette) | — |
| 6 | input | https://www.instagram.com/reel/… | (statique en maquette) | — |

