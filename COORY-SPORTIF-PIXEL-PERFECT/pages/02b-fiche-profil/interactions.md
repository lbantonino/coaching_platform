# 2b — Interactions et états

## F. Éléments interactifs
| Élément | Déclencheur | Comportement attendu (maquette) | Statut |
|---|---|---|---|
| Changer la photo | clic | sélecteur de fichier (JPEG/PNG/WebP ≤ 2 Mo), upload privé | Existant ? |
| Retirer | clic | supprime la photo (confirmation à vérifier) | Existant ? |
| Selects | clic | listes de valeurs existantes | Existant ? |
| Pastilles lieux | clic | bascule multi-sélection | Existant ? |
| Statut | clic | Actif / En pause / Archivé | Existant ? |
| Enregistrer | clic | sauvegarde ; message de succès non dessiné | Existant ? |

Statuts : **Existant ?** = à vérifier dans le code · **Nouveau** = demandé explicitement pendant la conception · **Non déterminé** = la maquette ne permet pas de le savoir.

## G. États
| État | Dessiné ? | Consigne |
|---|---|---|
| Normal | oui | captures |
| E-mail non modifiable | oui | champ verrouillé + aide |
| Chargement | non | proposition : squelettes aux dimensions des cartes, fond `#f3f2f7`, pulsation douce — à valider |
| Erreur | non | conserver le mécanisme d’erreur existant de l’app |
| Focus clavier | non | anneau `rgba(139,92,246,.55)` 2 px |
