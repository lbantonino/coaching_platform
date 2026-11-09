# PDF — interactions : ce qui est possible, et où

## Niveau 1 · PDF natif (fiable dans tous les lecteurs ciblés)
| Interaction | Mécanisme PDF | Statut maquette |
|---|---|---|
| Sommaire cliquable | annotation `/Link` → destination nommée (`/Dest`) | dessiné (page 1 de chaque PDF) |
| ‹ Précédente / Suivante › | `/Link` vers la page voisine | dessiné |
| Bouton noir central → sommaire | `/Link` vers la page 1 | dessiné (« ▾ » = renvoi au sommaire, **pas** de vrai menu) |
| Signets (outline) | `/Outlines` : Sommaire, Semaine 1…12 / Full Body A, B, Workload, Allures | à implémenter (invisible dans la maquette) |
| Lien externe (ouvrir COORY, vidéo d'exercice) | `/URI` | PROPOSED (aucun lien externe dessiné) |
| Défilement / glisser page par page | natif du lecteur | — |

**Interdit** : JavaScript PDF (compatibilité trop faible), menus déroulants réels, accordéons.

## Liens entre les 2 PDF
Un lien d'un fichier vers un autre (`/GoToR`) **ne marche pas** de façon fiable sur iPhone / Android / navigateurs. Décision : l'agenda écrit « → fiche dans « Fiches et repères » » en **texte non cliquable** (violet). PROPOSED : en plus, un lien `/URI` vers la fiche dans COORY (authentifié).

## Niveau 2 · PDF relié à COORY (PROPOSED)
Lien « Ouvrir dans Coory » → page authentifiée de la séance (feedback, RPE, séance réalisée). Le PDF n'enregistre rien lui-même.

## Niveau 3 · Interface web
Dépliage des séances, glisser-déposer, jours fixes, feedback, sauvegarde : **uniquement dans l'app**.

## Champs remplissables (AcroForm)
Non dessinés. Ne pas en ajouter : un champ rempli dans un PDF n'est pas synchronisé avec COORY. Si le client le demande plus tard : champs « Ressenti » et « RPE » + avertissement « non enregistré dans Coory ».
