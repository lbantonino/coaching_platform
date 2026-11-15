# Séances en cartes et même page sur ordinateur et téléphone (15/11/2026)

## Pourquoi
Test en direct sur iPhone (15/11), avec Gianluca : en musculation et en Hyrox, le détail d'une séance
est « beaucoup trop compact, illisible » ; les coachs connaissent la vue d'un entraînement de Garmin
(une carte par étape, des cartes dans une carte pour les répétitions) et l'app Strong (une carte par
exercice). Et la page d'un programme n'est « pas la même page » sur ordinateur et sur téléphone : un
coach qui passe de l'un à l'autre s'y perd.

## Décidé (Antonino, 15/11 ; maquettes validées « ok parfait », captures du scratchpad `maquette/`)
- **Une carte par étape** : l'échauffement, chaque exercice, le retour au calme. Dans la carte : le nom
  en gras et en grand ; en haut à droite le volume (« 4 séries », « 10 min ») ; dessous la ligne
  (« 5 répétitions · 70 kg », « 1 km · @5:30 ») ; dessous le repos (« Repos 3:00 »).
- **Une grande carte pour ce qui se répète** : superset, EMOM (musculation), « Répéter 8 fois »
  (course), circuit et autres formats à plusieurs tours (Hyrox) : une petite carte par exercice dedans,
  le repos entre les tours écrit en bas de la grande carte.
- **Plus de pastilles** dans les lignes d'une séance (remplacées par une barre de couleur à gauche de
  chaque carte : couleur de la discipline pour un exercice, gris pour un repos ou une transition, gris
  clair pour l'échauffement et le retour au calme). **Plus de RIR ni de RPE** à l'affichage.
- **Kilos** quand le max du sportif est connu (« 70 kg »), sinon « 70 % du max ».
- **« ⋯ » sur chaque carte** de la page du programme : Dupliquer, Voir dans la Bibliothèque (exercice
  lié), Supprimer. Ailleurs (agenda, modèles Coory en lecture) : seulement « Voir dans la Bibliothèque ».
- **Même page sur les deux appareils** : le téléphone ouvre aussi sur la semaine (en cours, sinon la
  première) ; « ‹ Semaine 3 / 12 ⌄ › » change de semaine, « ⌄ » ouvre la liste des semaines par phase
  (la colonne de gauche de l'ordinateur) ; les cartes de séance sont les mêmes partout (barre de
  couleur, « Musculation · Force » aussi sur téléphone). Le geste de retour reste égal au retour de la
  barre.
- Juridique : on reprend l'organisation (cartes, répétitions), jamais le nom, les icônes, les textes
  ni le graphisme de Garmin ; style Coory partout ; Garmin n'est jamais cité dans l'app.

## Hors de ce lot (prochaines maquettes)
L'éditeur « Modifier la séance » en cartes (ajouter une étape, un superset ; lier un exercice en
cherchant ou en parcourant la Bibliothèque) ; les PDF dans le même esprit ; les champs RIR de
l'éditeur (ils ne s'affichent plus, l'éditeur sera revu avec ses maquettes).

## Choix laissés au constructeur (pris par Claude)
- Séries toutes pareilles : « 4 séries » + une ligne ; séries différentes : une ligne par série
  (« Série 1 · 8 répétitions · 60 kg ») ; séries d'échauffement : une ligne « Échauffement : … ».
- Hyrox : un bloc « simple » d'un seul tour reste UNE carte (ses lignes dedans) ; tout autre format,
  ou plusieurs tours, devient une grande carte.
- Séances v1 (texte) : mêmes cartes, construites depuis leurs blocs texte.
