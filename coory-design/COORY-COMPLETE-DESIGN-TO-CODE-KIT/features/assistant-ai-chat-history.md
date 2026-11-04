# Assistant IA — historique des conversations (F-02.6, F-02.7)

> Demande explicite du propriétaire : **retrouver l’historique des chats**, sur desktop **et** mobile, avec un fonctionnement réel (pas seulement visuel).

## 1. Ce qui est dessiné
| Élément | Desktop (maquette 1c) | Mobile (maquette 1d) |
|---|---|---|
| Point d’accès | colonne permanente à gauche de la page complète | bouton **« Historique »** (icône ⟲) dans l’en-tête, à gauche de « Nouvelle conversation » |
| Nouvelle conversation | bouton noir « ✎ Nouvelle conversation » en haut de la colonne (`height:40px; radius:11px`) | bouton noir ✎ 40×40 dans l’en-tête |
| Liste | groupes datés « AUJOURD’HUI », « CETTE SEMAINE » (`600 12px; .04em; #8b8996`) ; titres `400 14px`, 1 ligne + ellipsis | **non dessiné** |
| Sélection d’une conversation | **non câblée** dans la maquette | **non dessinée** |

Données de démo : Bloc 2 de Lucas · Planning de la semaine · Relance facture Sophie · Résumé de la semaine d’Inès · Idées de séances Hyrox · Programme de Chloé après blessure.

## 2. Comportement cible
| # | Comportement | Statut |
|---|---|---|
| H1 | Chaque conversation est enregistrée dès le 1er message ; son **titre** = résumé court généré (ou 1re demande tronquée à 40 caractères) | TO-VERIFY (persistance) |
| H2 | Liste triée par dernière activité, groupée : Aujourd’hui · Hier · Cette semaine · Ce mois-ci · Plus ancien | NEW-VALIDATED (groupes 1–3 dessinés) |
| H3 | Clic sur un titre → charge ses messages dans la zone de conversation ; l’item devient actif (fond `#f5f2fe`, texte `#17151d` `600`) | À COMPLÉTER (style actif PROPOSED) |
| H4 | On peut **reprendre** : la saisie envoie dans la conversation rouverte | NEW-VALIDATED |
| H5 | « Nouvelle conversation » : la conversation courante reste dans l’historique, la zone revient à l’accueil | NEW-VALIDATED |
| H6 | Conversation ouverte depuis la **boîte** puis « Plein écran » → elle est sélectionnée dans l’historique | TO-VERIFY |
| H7 | États : **chargement** (3 lignes squelettes 14 px `#f1f0f5`), **vide** (« Tes conversations apparaîtront ici. »), **erreur** (« Impossible de charger l’historique. Réessayer ») | PROPOSED |
| H8 | Renommer / supprimer une conversation (menu « … » au survol) | PROPOSED (non dessiné, ne pas implémenter sans validation) |
| H9 | Recherche dans l’historique | PROPOSED |

## 3. Mobile — à compléter (proposition, à valider)
Le bouton « Historique » existe mais son panneau n’est pas dessiné. Proposition cohérente avec le système :
- **Feuille plein écran** glissant depuis la gauche (ou M-SHEET depuis le bas), en-tête « Historique » + Fermer (×) 44×44.
- Même liste groupée qu’en desktop, lignes `min-height:52px`, titre `500 15px`, date relative `13px #8b8996`.
- Bouton « ✎ Nouvelle conversation » pleine largeur en haut.
- Tap sur une conversation → ferme le panneau et l’ouvre ; **« ← Conversation »** en haut à gauche pour revenir (règle permanente « flèche + nom de l’écran précédent ») ; geste retour / Échap ferme.
- Safe areas haut et bas.
**Statut : À COMPLÉTER** — demander au propriétaire de valider ce panneau (ou de le faire dessiner) avant implémentation.

## 4. Données (TO-VERIFY dans le code)
```
Conversation { id, coachId, title, createdAt, updatedAt, source: 'dialog'|'page', contextAthleteId? }
Message      { id, conversationId, role: 'user'|'assistant', content, actions?: Action[], createdAt }
Action       { id, label, payload, status: 'proposed'|'accepted'|'rejected'|'done' }
```
Permissions : un coach ne lit que ses conversations. Pagination de l’historique par 30. Si rien n’existe côté serveur : **ne pas inventer** — signaler au propriétaire et proposer ce modèle.
