# 2g — Interactions et états

## F. Éléments interactifs
| Élément | Déclencheur | Comportement attendu (maquette) | Statut |
|---|---|---|---|
| Onglets / sélecteur mobile | clic | change d’onglet | Existant ? |
| Écrire | clic | messagerie avec le sportif | Existant ? |
| Changer (carte) | clic | menu de tous les repères ; remplace le repère de la carte et l’affiche dans le graphique | Nouveau |
| Voir l’évolution ↓ | clic | affiche le repère dans le graphique | Nouveau |
| Inverser les deux cartes | clic | échange gauche/droite | Nouveau |
| Menu repère | clic | change courbe, couleur, axe, valeur, phrase | Nouveau |
| Menu période | clic | 1 sem / 4 sem / 1 mois / 6 mois / 1 an | Nouveau |
| Accordéons | clic | déplier | Existant ? |
| Ajouter la mesure / performance | clic | création datée | Existant ? |

Statuts : **Existant ?** = à vérifier dans le code · **Nouveau** = demandé explicitement pendant la conception · **Non déterminé** = la maquette ne permet pas de le savoir.

## G. États
| État | Dessiné ? | Consigne |
|---|---|---|
| Normal | oui | captures |
| Menu ouvert | oui (source) | chevron pivoté, surcouche |
| Repère sans mesure | non | proposition : « Pas encore de mesure » |
| Chargement | non | proposition : squelettes aux dimensions des cartes — à valider |
| Erreur | non | conserver le mécanisme d’erreur existant |
| Succès d’enregistrement | non | conserver le retour existant ; sinon proposition dans shared-components/forms.md |
| Focus clavier | non | anneau `rgba(139,92,246,.55)` 2 px |
