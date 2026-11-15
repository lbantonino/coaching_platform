# Une seule vue d'un programme : l'onglet Programme en cartes (15/11/2026)

## Pourquoi
Test en direct sur iPhone (15/11) : un même programme se voyait de trois façons (page du programme,
onglet Programme de la fiche « une semaine à la fois », onglet Agenda de la fiche), et Gianluca s'y
perdait. Antonino : le programme qu'un coach envoie à son sportif, c'est l'AGENDA (les Excel de
Gianluca, et ce que verra le sportif dans son espace) ; l'onglet Programme ne doit montrer que la carte
du programme, et un appui ouvre le programme pour le modifier.

## Ce qui est décidé (Antonino, 15/11)
- **Onglet Programme de la fiche** : les cartes des programmes du sportif, la MÊME carte que la page
  Programmes (`ProgramCard`) ; un appui ouvre la page du programme, dont le retour ramène à l'onglet.
- **Page du programme** : le seul endroit où l'on construit, modifie et publie.
- **Onglet Agenda de la fiche** : le programme tel que le sportif le reçoit (inchangé), avec en plus
  « Modifier la séance » sur chaque séance ; le retour ramène à l'agenda, à la même semaine.
- « Brouillon » et « Publier » restent tels quels (expliqués à Antonino, pas de changement de mots).

## Approches envisagées
- A. L'onglet ouvre la page du programme : on quitte la fiche sur ordinateur (refusé tel quel).
- B. La page du programme entière dans l'onglet : lourd, colonnes serrées sous l'en-tête de la fiche.
- C. Même vue en lecture seule : deux écrans identiques dont un seul se modifie.
- **Retenue (idée d'Antonino)** : cartes dans l'onglet Programme, agenda = vue du sportif, page du
  programme = modifier. Chaque écran a un seul rôle ; la vue « une semaine à la fois » disparaît.

## Choix laissés au constructeur (pris par Claude)
- Ordre des cartes : en cours, à venir, brouillons, terminés, archivés ; dans chaque groupe, le plus
  récemment modifié d'abord. Grille de la page Programmes (1 colonne, 2 dès md, 3 dès xl).
- Aucun programme : l'état vide actuel (« Créer un programme »). Pas de programme en cours ni à venir,
  mais d'anciens : les boutons « Créer un programme » et « Copier un programme précédent » au-dessus des
  cartes (le geste « bloc suivant » ne doit pas disparaître).
- La carte reste identique à celle de la page Programmes, nom du sportif compris (une seule carte).
- Le bandeau « Modifications non publiées » reste au-dessus des onglets Programme et Agenda.
