# 12 · Modifier la séance — individuelle et collective — interactions

| Élément | Déclencheur | Comportement attendu | Cas limites / statut |
|---|---|---|---|
| Pilule d’inscrit | Clic | Inscrit / désinscrit ; compteur, avatars et prix par inscrit à jour | — |
| Tout désélectionner | Clic | Vide la sélection | Confirmation PROPOSED |
| Recherche sportif | Saisie | Filtre les pilules | — |
| Prix collectif | Saisie | Calcule le prix par inscrit (prix TTC ÷ N) | Affichage seulement — aucune facturation modifiée |
| Note du coach | Saisie | Enregistrée avec la séance | TO-VERIFY champ |
| Autres | — | Voir 06 | — |

Inventaire exhaustif (handler par élément) : `interactive-elements.md`. Logique de référence : `../../source-design-files/pages/12-modifier-seance-collective/logic.js`.
