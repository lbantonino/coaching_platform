# 1a / 1b — Interactions et états

## F. Éléments interactifs
| Élément | Déclencheur | Comportement attendu (maquette) | Statut |
|---|---|---|---|
| Menu Statut | clic | liste Tous/Actif/En pause/Archivé avec compteurs ; filtre la liste | Existant ? |
| Menu Programme | clic | liste des disciplines/programmes avec compteurs | Existant ? |
| Recherche | saisie | filtre en direct par nom | Existant ? |
| En-têtes triables | clic | tri asc/desc, flèche active, libellé de pied mis à jour | Existant ? |
| Case de ligne / tout sélectionner | clic | active la barre d’actions groupées | Nouveau ? |
| Changer le statut / programme (groupé) | clic | applique aux lignes sélectionnées | Nouveau ? |
| Ligne | clic | ouvre la fiche 2a | Existant ? |
| Inviter | clic | envoie une invitation ; état devient « Invité » | Existant ? |
| Message (icône) | clic | ouvre la conversation | Existant ? |
| Choisir (programme) | clic | attribuer un programme | Non déterminé |
| ··· | clic | menu d’actions de ligne (contenu non dessiné) | Non déterminé |
| + Nouveau sportif | clic | création de sportif | Existant ? |

Statuts : **Existant ?** = à vérifier dans le code · **Nouveau** = demandé explicitement pendant la conception · **Non déterminé** = la maquette ne permet pas de le savoir.

## G. États
| État | Dessiné ? | Consigne |
|---|---|---|
| Normal | oui | captures |
| Vide (filtres) | oui | « Aucun sportif trouvé » |
| Sélection active | oui (logique) | barre d’actions |
| Fiche incomplète | oui | « Fiche à compléter » en orange sous le nom |
| Chargement | non | proposition : squelettes aux dimensions des cartes, fond `#f3f2f7`, pulsation douce — à valider |
| Erreur | non | conserver le mécanisme d’erreur existant de l’app |
| Focus clavier | non | anneau `rgba(139,92,246,.55)` 2 px |
