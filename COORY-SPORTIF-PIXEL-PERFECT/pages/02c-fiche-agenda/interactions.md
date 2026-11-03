# 2c — Interactions et états

## F. Éléments interactifs
| Élément | Déclencheur | Comportement attendu (maquette) | Statut |
|---|---|---|---|
| Semaine / Toutes les semaines | clic | vue une semaine ou liste de toutes les semaines | Nouveau ? |
| ‹ › | clic | semaine précédente / suivante (désactivé aux bornes, couleur #c9c7d1) | Nouveau ? |
| Menu Semaine n / 12 | clic | choisir une semaine (actuelle signalée) | Nouveau ? |
| Revenir à la semaine actuelle | clic | retour | Nouveau ? |
| Carte de séance | clic | ouvre 2d | Non déterminé |

Statuts : **Existant ?** = à vérifier dans le code · **Nouveau** = demandé explicitement pendant la conception · **Non déterminé** = la maquette ne permet pas de le savoir.

## G. États
| État | Dessiné ? | Consigne |
|---|---|---|
| Normal | oui | captures |
| Semaine non actuelle | oui (logique) | bandeau + bouton retour |
| Bornes | oui | flèche grisée |
| Chargement | non | proposition : squelettes aux dimensions des cartes, fond `#f3f2f7`, pulsation douce — à valider |
| Erreur | non | conserver le mécanisme d’erreur existant de l’app |
| Focus clavier | non | anneau `rgba(139,92,246,.55)` 2 px |
