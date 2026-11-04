# 07 · Messages — inventaire automatique des éléments interactifs

> Généré à partir du fichier source : **tous** les éléments qui portent un handler (`onClick`, `onChange`, `onKeyDown`), un lien (`href`) ou un rôle interactif. Le nom du handler renvoie à `source-design-files/pages/07-messages/logic.js`. Les comportements sont décrits dans `interactions.md`.

## « Messages desktop »

| # | Élément | Libellé / aria | Handler | État exposé |
|---|---|---|---|---|
| 1 | button | Nouveau message | onClick={{ toggleMenu }} | — |
| 2 | button | Nouvelle conversationÉcrire à un sportif | onClick={{ toggleMenu }} | — |
| 3 | a | Nouveau groupeCours collectif, small group | onClick={{ toggleMenu }} href=#2a | — |
| 4 | button | Nouveau message | onClick={{ toggleMenu }} | — |
| 5 | button | {{ f.l }} | onClick={{ f.on }} | — |
| 6 | button | {{ c.ini }}{{ c.sx }} {{ c.name }}{{ c.time }} {{ c.last }}{ | onClick={{ c.pick }} | — |
| 7 | a | {{ cur.sub }} | href=# | — |
| 8 | input | Écrire un message… | onChange={{ setDraft }} onKeyDown={{ onKey }} | — |
| 9 | button | Envoyer | onClick={{ send }} | — |

## « Messages mobile liste »

| # | Élément | Libellé / aria | Handler | État exposé |
|---|---|---|---|---|
| 1 | button | {{ f.l }} | onClick={{ f.on }} | — |
| 2 | a | {{ c.ini }}{{ c.sx }} {{ c.name }}{{ c.time }} {{ c.last }}{ | href={{ c.href }} | — |
| 3 | a | Nouveau message | href=#2b | — |

## « Messages mobile groupe »

| # | Élément | Libellé / aria | Handler | État exposé |
|---|---|---|---|---|
| 1 | a | Messages | href=#1b | — |

## « Nouveau groupe desktop »

| # | Élément | Libellé / aria | Handler | État exposé |
|---|---|---|---|---|
| 1 | input | — | onChange={{ setGName }} | — |
| 2 | button | {{ a.ini }} {{ a.n }}{{ a.s }} {{ a.mark }} | onClick={{ a.toggle }} | aria-checked={{ a.on }} |

## « Nouveau message mobile »

| # | Élément | Libellé / aria | Handler | État exposé |
|---|---|---|---|---|
| 1 | a | Créer un groupeCours collectif, small group | href=#2c | — |

## « Nouveau groupe mobile »

| # | Élément | Libellé / aria | Handler | État exposé |
|---|---|---|---|---|
| 1 | a | Retour | href=#2b | — |
| 2 | input | — | onChange={{ setGName }} | — |
| 3 | button | {{ a.ini }} {{ a.n }}{{ a.s }} {{ a.mark }} | onClick={{ a.toggle }} | aria-checked={{ a.on }} |

