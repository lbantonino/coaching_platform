# 2i — Interactions et états

## F. Éléments interactifs
| Élément | Déclencheur | Comportement attendu (maquette) | Statut |
|---|---|---|---|
| Onglets / sélecteur mobile | clic | change d’onglet | Existant ? |
| Écrire | clic | messagerie avec le sportif | Existant ? |
| Enregistrer les blessures | clic | sauvegarde (accord requis) | Existant ? |
| Retirer l’accord | clic | efface les données de santé (confirmation à vérifier) | Existant ? |
| Historique de l’accord | clic | déplie | Existant ? |
| Enregistrer (notes) | clic | sauvegarde + horodatage | Existant ? |
| Envoyer le message | clic | visible côté sportif | Existant ? |

Statuts : **Existant ?** = à vérifier dans le code · **Nouveau** = demandé explicitement pendant la conception · **Non déterminé** = la maquette ne permet pas de le savoir.

## G. États
| État | Dessiné ? | Consigne |
|---|---|---|
| Normal | oui | captures |
| Sans accord | non | à vérifier : saisie blessures désactivée |
| Chargement | non | proposition : squelettes aux dimensions des cartes — à valider |
| Erreur | non | conserver le mécanisme d’erreur existant |
| Succès d’enregistrement | non | conserver le retour existant ; sinon proposition dans shared-components/forms.md |
| Focus clavier | non | anneau `rgba(139,92,246,.55)` 2 px |
