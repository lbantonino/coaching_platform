# 2j — Interactions et états

## F. Éléments interactifs
| Élément | Déclencheur | Comportement attendu (maquette) | Statut |
|---|---|---|---|
| Onglets / sélecteur mobile | clic | change d’onglet | Existant ? |
| Écrire | clic | messagerie avec le sportif | Existant ? |
| Importer un document | clic | upload existant | Existant ? |
| Voir dans Documents | clic | navigation | Existant ? |
| Ligne document | clic | ouvrir | Non déterminé |

Statuts : **Existant ?** = à vérifier dans le code · **Nouveau** = demandé explicitement pendant la conception · **Non déterminé** = la maquette ne permet pas de le savoir.

## G. États
| État | Dessiné ? | Consigne |
|---|---|---|
| Normal | oui | captures |
| Aucun document | non | proposition : « Aucun document pour ce sportif. » |
| Chargement | non | proposition : squelettes aux dimensions des cartes — à valider |
| Erreur | non | conserver le mécanisme d’erreur existant |
| Succès d’enregistrement | non | conserver le retour existant ; sinon proposition dans shared-components/forms.md |
| Focus clavier | non | anneau `rgba(139,92,246,.55)` 2 px |
