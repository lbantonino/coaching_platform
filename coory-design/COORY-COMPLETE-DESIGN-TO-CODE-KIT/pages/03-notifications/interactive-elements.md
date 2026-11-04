# 03 · Notifications — inventaire automatique des éléments interactifs

> Généré à partir du fichier source : **tous** les éléments qui portent un handler (`onClick`, `onChange`, `onKeyDown`), un lien (`href`) ou un rôle interactif. Le nom du handler renvoie à `source-design-files/pages/03-notifications/logic.js`. Les comportements sont décrits dans `interactions.md`.

## « Notifications desktop »

| # | Élément | Libellé / aria | Handler | État exposé |
|---|---|---|---|---|
| 1 | button | {{ t.l }}{{ t.n }} | onClick={{ t.on }} | — |
| 2 | button | Sélectionner | onClick={{ startSel }} | — |
| 3 | button | Tout marquer comme lu | onClick={{ readAll }} | — |
| 4 | button | {{ allSelMark }}{{ selLabel }} | onClick={{ toggleAllSel }} | — |
| 5 | button | Marquer comme lu | onClick={{ selRead }} | — |
| 6 | button | Masquer | onClick={{ selHide }} | — |
| 7 | button | Supprimer | onClick={{ selDel }} | — |
| 8 | button | Annuler | onClick={{ endSel }} | — |
| 9 | a | {{ sec.link }} | href=# | — |
| 10 | button | {{ it.selMark }} | onClick={{ it.onSel }} | aria-checked={{ it.sel }} |
| 11 | button | Actions | onClick={{ it.onMenu }} | — |
| 12 | button | {{ it.readLabel }} | onClick={{ it.onRead }} | — |
| 13 | button | {{ it.hideLabel }} | onClick={{ it.onHide }} | — |
| 14 | button | Supprimer | onClick={{ it.onDel }} | — |
| 15 | button | Annuler | onClick={{ undo }} | — |

## « Notifications mobile »

| # | Élément | Libellé / aria | Handler | État exposé |
|---|---|---|---|---|
| 1 | button | {{ t.l }} | onClick={{ t.on }} | — |
| 2 | button | Tout marquer comme lu | onClick={{ readAll }} | — |
| 3 | button | Sélectionner | onClick={{ startSel }} | — |
| 4 | button | {{ allSelMark }}{{ selLabel }} | onClick={{ toggleAllSel }} | — |
| 5 | button | Annuler | onClick={{ endSel }} | — |
| 6 | button | {{ it.selMark }} | onClick={{ it.onSel }} | aria-checked={{ it.sel }} |
| 7 | button | Actions | onClick={{ it.onMenu }} | — |
| 8 | button | {{ it.readLabel }} | onClick={{ it.onRead }} | — |
| 9 | button | {{ it.hideLabel }} | onClick={{ it.onHide }} | — |
| 10 | button | Supprimer | onClick={{ it.onDel }} | — |
| 11 | button | Lu | onClick={{ selRead }} | — |
| 12 | button | Masquer | onClick={{ selHide }} | — |
| 13 | button | Supprimer | onClick={{ selDel }} | — |
| 14 | button | Annuler | onClick={{ undo }} | — |

