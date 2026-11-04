# 02 · Assistant IA — inventaire automatique des éléments interactifs

> Généré à partir du fichier source : **tous** les éléments qui portent un handler (`onClick`, `onChange`, `onKeyDown`), un lien (`href`) ou un rôle interactif. Le nom du handler renvoie à `source-design-files/pages/02-assistant-ia/logic.js`. Les comportements sont décrits dans `interactions.md`.

## « Assistant dialogue desktop »

| # | Élément | Libellé / aria | Handler | État exposé |
|---|---|---|---|---|
| 1 | button | Assistant IA | onClick={{ toggleDlgD }} | aria-expanded={{ dlgDExp }} |
| 2 | div | — | onClick={{ closeD }} | — |
| 3 | a | Plein écran | href=#1c | — |
| 4 | button | Fermer | onClick={{ closeD }} | — |
| 5 | button | {{ a.mark }}{{ a.l }} | onClick={{ a.toggle }} | aria-checked={{ a.ck }} |
| 6 | button | {{ g.btn }} | onClick={{ g.validate }} | — |
| 7 | textarea | Message à l’assistant | onChange={{ c_dlgD.setDraft }} onKeyDown={{ c_dlgD.onKey }} | — |
| 8 | button | Joindre un fichier | (statique en maquette) | — |
| 9 | button | {{ c.l }} | onClick={{ c.pick }} | aria-pressed={{ c.sel }} |
| 10 | button | Dicter | (statique en maquette) | — |
| 11 | button | Envoyer | onClick={{ c_dlgD.send }} | disabled={{ c_dlgD.cantSend }} |
| 12 | button | {{ s.l }} | onClick={{ s.pick }} | — |

## « Assistant dialogue mobile »

| # | Élément | Libellé / aria | Handler | État exposé |
|---|---|---|---|---|
| 1 | button | Assistant IA | onClick={{ toggleDlgM }} | aria-expanded={{ dlgMExp }} |
| 2 | div | — | onClick={{ closeM }} | — |
| 3 | a | Plein écran | href=#1c | — |
| 4 | button | Fermer | onClick={{ closeM }} | — |
| 5 | button | {{ a.mark }}{{ a.l }} | onClick={{ a.toggle }} | aria-checked={{ a.ck }} |
| 6 | button | {{ g.btn }} | onClick={{ g.validate }} | — |
| 7 | button | {{ p.l }} | onClick={{ p.pick }} | — |
| 8 | textarea | Message à l’assistant | onChange={{ c_dlgM.setDraft }} onKeyDown={{ c_dlgM.onKey }} | — |
| 9 | button | Plus d’options | onClick={{ togglePlusM }} | aria-expanded={{ plusMExp }} |
| 10 | button | Dicter | (statique en maquette) | — |
| 11 | button | Envoyer | onClick={{ c_dlgM.send }} | disabled={{ c_dlgM.cantSend }} |

## « Assistant page desktop »

| # | Élément | Libellé / aria | Handler | État exposé |
|---|---|---|---|---|
| 1 | button | Nouvelle conversation | onClick={{ newChatD }} | — |
| 2 | textarea | Message à l’assistant | onChange={{ c_pageD.setDraft }} onKeyDown={{ c_pageD.onKey }} | — |
| 3 | button | Joindre un fichier | (statique en maquette) | — |
| 4 | button | {{ c.l }} | onClick={{ c.pick }} | aria-pressed={{ c.sel }} |
| 5 | button | Dicter | (statique en maquette) | — |
| 6 | button | Envoyer | onClick={{ c_pageD.send }} | disabled={{ c_pageD.cantSend }} |
| 7 | button | {{ p.t }}{{ p.s }} | onClick={{ p.pickD }} | — |
| 8 | button | {{ a.mark }}{{ a.l }} | onClick={{ a.toggle }} | aria-checked={{ a.ck }} |
| 9 | button | {{ g.btn }} | onClick={{ g.validate }} | — |
| 10 | textarea | Message à l’assistant | onChange={{ c_pageD.setDraft }} onKeyDown={{ c_pageD.onKey }} | — |
| 11 | button | Joindre un fichier | (statique en maquette) | — |
| 12 | button | {{ c.l }} | onClick={{ c.pick }} | aria-pressed={{ c.sel }} |
| 13 | button | Dicter | (statique en maquette) | — |
| 14 | button | Envoyer | onClick={{ c_pageD.send }} | disabled={{ c_pageD.cantSend }} |

## « Assistant page mobile »

| # | Élément | Libellé / aria | Handler | État exposé |
|---|---|---|---|---|
| 1 | button | Historique | (statique en maquette) | — |
| 2 | button | Nouvelle conversation | onClick={{ newChatM }} | — |
| 3 | button | {{ p.t }}{{ p.s }} | onClick={{ p.pickM }} | — |
| 4 | button | {{ a.mark }}{{ a.l }} | onClick={{ a.toggle }} | aria-checked={{ a.ck }} |
| 5 | button | {{ g.btn }} | onClick={{ g.validate }} | — |
| 6 | textarea | Message à l’assistant | onChange={{ c_pageM.setDraft }} onKeyDown={{ c_pageM.onKey }} | — |
| 7 | button | Joindre un fichier | (statique en maquette) | — |
| 8 | button | {{ c.l }} | onClick={{ c.pick }} | aria-pressed={{ c.sel }} |
| 9 | button | Dicter | (statique en maquette) | — |
| 10 | button | Envoyer | onClick={{ c_pageM.send }} | disabled={{ c_pageM.cantSend }} |

