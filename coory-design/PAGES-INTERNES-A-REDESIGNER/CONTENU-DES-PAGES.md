# Contenu des 13 pages internes à redessiner (Coory, espace coach)

Ce document est l'inventaire exact de ce que contient chacune des 13 pages internes à redessiner. Il a été relevé dans le code de l'application le 04/11/2026 : libellés, champs, boutons, messages et cas particuliers, tels qu'ils s'affichent aujourd'hui. Il sert de liste de contrôle pour que le nouveau design n'oublie rien.

**Règle : le contenu ci-dessous doit rester, seule la présentation change.** Un libellé, un champ, une aide, un message d'erreur ou un cas particulier peut être déplacé ou remis en forme, mais pas supprimé sans décision d'Antonino.

Conventions de lecture :

- Les textes entre « » sont affichés tels quels à l'écran. `<Nom>`, `<date>`, `<N>` désignent une valeur qui change.
- « (facultatif) » fait partie du libellé quand il est écrit ainsi à l'écran.
- « Message au fil de la saisie » : message qui apparaît sous un champ quand on le quitte avec une valeur fausse (le champ passe en rouge), et qui disparaît dès que la valeur est corrigée.
- « Message à l'envoi » : message renvoyé après un appui sur le bouton d'enregistrement ; un seul message à la fois (le premier problème trouvé). La saisie est toujours conservée après une erreur.
- Toutes les pages ont l'en-tête de page commun (voir « Composants partagés » à la fin).

---

## 01. Modifier une séance

### Adresse et accès

- Adresse : `/coach/o/<organisation>/agenda/seances/<séance>/modifier`
- On y arrive depuis la page d'une séance (ouverte depuis l'Agenda, le tableau de bord ou la fiche d'un sportif) :
  - ordinateur : bouton « Modifier » (icône crayon) dans l'en-tête, en haut à droite ;
  - ordinateur : bouton « Modifier » dans la barre d'actions en bas de la page ;
  - ordinateur : menu « ••• » de l'en-tête, ligne « Modifier toute la série » (séance hebdomadaire) ou « Modifier la séance » (séance unique) ;
  - téléphone : bouton « Modifier » de la barre fixe en bas de l'écran (à côté de « Écrire » quand la séance a un sportif).

### Contenu dans l'ordre de l'écran

1. En-tête : lien de retour « ← `<titre de la séance>` » (vers la page de la séance), titre « Modifier la séance ». Pas de sous-titre.
2. Une seule carte, qui contient tout le formulaire :
   1. Une phrase d'information, à la place du choix du type :
      - séance individuelle : « Séance individuelle avec `<Nom du sportif>`. Pour changer de type ou de sportif, supprime la séance et crée-en une nouvelle. »
      - séance collective : « Séance collective. Pour changer de type ou de sportif, supprime la séance et crée-en une nouvelle. »
   2. Titre, Discipline, Lieu, Date, Heure, Durée.
   3. Case « Chaque semaine, le même jour et à la même heure », puis (si cochée) le champ « Jusqu'au ».
   4. Séance collective seulement : « Sportifs inscrits (facultatif) ».
   5. Bloc « Prix (facultatif) » : prix, paiement, case TVA, phrase de calcul.
   6. « Note du coach (facultatif) ».
   7. Bouton « Enregistrer » et, à côté, le message d'erreur éventuel.

### Champs

| Libellé | Type | Obligatoire | Aide, placeholder | Limites, valeur de départ |
| --- | --- | --- | --- | --- |
| « Titre » | texte | oui | placeholder « Ex. : Piste du mercredi » (collective) ou « Ex. : Coaching force » (individuelle) | 120 caractères ; titre actuel |
| « Discipline (facultatif) » | liste déroulante : « Non précisée », « Musculation », « Hyrox », « Running », « Hybride » (dans cet ordre) | non | | discipline actuelle |
| « Lieu (facultatif) » | texte | non | placeholder « Ex. : Piste d'athlétisme, salle, parc » | 120 caractères |
| « Date », ou « Première séance » si la case hebdomadaire est cochée | date | oui | | date actuelle |
| « Heure » | heure | oui | | heure actuelle |
| « Durée » | nombre, avec « min » écrit dans le champ à droite | oui | | 15 à 480, par pas de 5 |
| « Chaque semaine, le même jour et à la même heure » | case à cocher | non | | état actuel |
| « Jusqu'au (facultatif) » (visible seulement si la case est cochée) | date | non | aide : « Sans date de fin, la séance continue chaque semaine. » | ne peut pas précéder la première séance |
| « Sportifs inscrits (facultatif) » (collective seulement) | pastilles à cocher (plusieurs), une par sportif, coche « ✓ » devant le nom | non | si aucun sportif : « Aucun sportif actif pour l'instant. » | inscrits actuels déjà cochés ; 100 au plus |
| « Prix de la séance (€) » (individuelle) ou « Prix pour toute la séance (€) » (collective) ; le symbole suit la devise de l'organisation | texte décimal | non | placeholder « Ex. : 65 » | « 65 » ou « 65,50 » ; prix actuel |
| « Paiement » | sélecteur à deux choix : « Virement », « Espèces » | non (exigé seulement s'il y a un prix) | | mode actuel, sinon « Virement » |
| « TVA comprise dans le prix » | case à cocher | non | | état actuel |
| « Note du coach (facultatif) » | zone de texte, 2 lignes | non | placeholder « Ex. : prévoir chronos et plots » | 500 caractères |

Phrase de calcul sous le bloc Prix (elle change pendant la saisie) :

- sans prix : « Sans prix, la séance ne compte pas dans l'encaissé. »
- organisation sans TVA : « `<65,00 €>` reçus, sans TVA (réglage dans Paramètres). »
- case TVA cochée : « `<65,00 €>` reçus, TVA comprise : `<53,72 €>` HTVA et `<11,28 €>` de TVA (`<21 %>`). »
- case TVA décochée : « `<65,00 €>` HTVA : le sportif paie `<78,65 €>`, TVA de `<21 %>` comprise. »

Choisir « Virement » décoche la case TVA, choisir « Espèces » la coche ; le coach peut ensuite la changer à la main.

### Boutons et liens

- « Enregistrer » : enregistre et ramène sur la page de la séance (pas de toast). Pendant l'envoi : « Enregistrement… », bouton grisé.
- Le lien de retour de l'en-tête ramène à la page de la séance sans enregistrer. Il n'y a pas de bouton « Annuler ».

### États

- Message au fil de la saisie (prix) : « Montant invalide : écris par exemple 65 ou 65,50. »
- Messages à l'envoi : « Donne un titre à la séance (120 caractères maximum). », « Discipline invalide. », « Lieu trop long (120 caractères maximum). », « Indique la date de la séance. », « Indique l'heure de début, par exemple 19:00. », « Durée invalide : entre 15 et 480 minutes. », « Date de fin invalide. », « La date de fin ne peut pas précéder la première séance. », « Note trop longue (500 caractères maximum). », « Prix invalide : écris par exemple 65 ou 65,50. », « Choisis espèces ou virement. », « Liste de sportifs invalide. », « Sportif introuvable dans ton organisation. », « Séance introuvable. », « La séance n'a pas pu être enregistrée. Réessaie. », « La séance est enregistrée, mais la liste des inscrits n'a pas pu être mise à jour. »
- Séance unique et séance hebdomadaire : le libellé « Date » devient « Première séance » et le champ « Jusqu'au » apparaît quand la case hebdomadaire est cochée.
- Séance individuelle : pas de choix de sportif (il est verrouillé, nommé dans la phrase du haut).
- Séance collective : la liste des pastilles montre les sportifs non archivés, plus ceux déjà inscrits même s'ils ont été archivés depuis.
- Séance inexistante ou d'une autre organisation : page introuvable.

### Téléphone et ordinateur

- Téléphone : une seule colonne. Seuls « Heure » et « Durée » restent côte à côte (deux moitiés). Le sélecteur « Virement / Espèces » prend toute la largeur.
- À partir de la tablette : grille de deux colonnes. « Titre » sur toute la largeur, puis « Discipline » | « Lieu », puis « Date » | (« Heure » + « Durée »). « Jusqu'au » sur une demi-largeur. Dans le bloc Prix : le prix et « Paiement » côte à côte.
- Le formulaire est limité en largeur (environ 768 px) sur ordinateur. Le bouton « Enregistrer » est à la fin du formulaire, il ne reste pas collé en bas.

### À ne pas perdre

- Pour une séance hebdomadaire, cette page modifie toute la série (la page de la séance le dit : « « Modifier » change toute la série. Pour déplacer une seule date, glisse-la dans l'Agenda. »).
- Le type de séance et le sportif d'une séance individuelle ne changent jamais ici.
- Règle de Gianluca sur la TVA : par virement, prix hors TVA (la TVA s'ajoute) ; en espèces, prix direct, TVA comprise. La case reste modifiable.
- Un prix vide veut dire que la séance ne compte pas dans « l'encaissé ».
- Durée entre 15 et 480 minutes ; les inscrits d'une séance collective sont facultatifs.

### La boîte « Nouvelle séance » (déjà refaite, pour mémoire)

La création passe par la boîte « Nouvelle séance » (kit des boîtes, boîte 02), déjà redessinée : mêmes champs et mêmes règles, mais le type « Individuelle / Collective » s'y choisit, la séance individuelle propose « Sportif » (« Choisir… ») ou la carte à cocher « Nouveau sportif » (« Sa fiche est créée avec son nom, à compléter ensuite. ») avec le champ « Nom du nouveau sportif » (placeholder « Ex. : John Martin »), les cases sont des cartes à cocher, la durée et le prix ont leur unité dans le champ, le placeholder du lieu est plus court (« Ex. : piste, salle, parc ») et les boutons « Annuler » / « Créer la séance » sont dans un pied fixe.

---

## 02. Créer un exercice

### Adresse et accès

- Adresse : `/coach/bibliotheque/nouveau`
- On y arrive depuis la page Bibliothèque, bouton « + Créer un exercice » de l'en-tête.

### Contenu dans l'ordre de l'écran

1. En-tête : retour « ← Bibliothèque », titre « Créer un exercice ». Pas de sous-titre.
2. Une seule carte avec le formulaire : nom, rubrique, groupes musculaires, matériel, consignes, photo, lien vidéo, message d'erreur, boutons.

### Champs

| Libellé | Type | Obligatoire | Aide, placeholder | Limites, valeur de départ |
| --- | --- | --- | --- | --- |
| « Nom de l'exercice » | texte | oui | | 80 caractères ; vide |
| « Rubrique » | pastilles, un seul choix : « Musculation », « Cardio », « Hyrox », « Mobilité » | oui | | « Musculation » choisie au départ |
| « Groupes musculaires » | pastilles, plusieurs choix : « Pectoraux », « Dos », « Épaules », « Biceps », « Triceps », « Avant-bras », « Abdominaux », « Lombaires », « Fessiers », « Hanches et adducteurs », « Quadriceps », « Ischio-jambiers », « Mollets » | non (rien ne l'indique à l'écran) | | aucune cochée |
| « Matériel » | liste déroulante groupée, un seul choix (voir la liste ci-dessous) | non | | « Aucun : poids du corps » |
| « Consignes » | zone de texte, 6 lignes | non | placeholder sur deux lignes : « Tiens-toi debout, pieds à largeur de hanches. » / « Descends en gardant le dos droit. » ; aide : « Une consigne par ligne, 15 au maximum. Facultatif. » | 15 consignes, 300 caractères par consigne ; les tirets, puces et numéros en début de ligne sont retirés |
| « Photo » | fichier image, avec aperçu carré une fois choisie | non | aide : « JPEG, PNG ou WebP. Stockée en privé, visible par ton équipe. » | JPEG, PNG ou WebP ; réduite automatiquement à 1 200 px ; 5 Mo au plus |
| « Lien vidéo » | adresse web | non | placeholder « https://www.instagram.com/reel/… » ; aide : « YouTube, Instagram, TikTok… Facultatif, s'ouvre dans un nouvel onglet. » | 300 caractères ; doit commencer par https:// |

Liste « Matériel » (première option « Aucun : poids du corps », puis cinq groupes) :

- « Poids libres » : Barre, Haltères, Kettlebell, Barre EZ, Barre hexagonale, Disques, Sandbag, Médecine-ball, Slam ball, Wall ball, Landmine.
- « Machines » : Poulie, Smith machine, Presse à cuisses, Hack squat, Machine leg curl, Machine leg extension, Machine de tirage vertical, Machine de rowing assis, Machine développé pectoraux, Machine écarté, Pec deck, Machine développé épaules, Machine élévations latérales, Machine oiseau, Machine curl biceps, Machine curl pupitre, Machine triceps, Machine dips, Machine dips à disques, Machine tractions assistées, Machine abdominaux, Banc à lombaires, Machine abducteurs, Machine adducteurs, Machine hip thrust, Machine mollets debout, Machine mollets assis, Machine mollets donkey, Machine shrugs, GHD.
- « Cardio et traîneau » : Tapis de course, Rameur, SkiErg, Air bike, Vélo d'appartement, Vélo, Vélo elliptique, Simulateur d'escalier, Traîneau, Corde de traîneau, Battle rope, Corde à sauter.
- « Barres et suspension » : Barre de traction, Barres parallèles, Anneaux, TRX, Corde à grimper.
- « Petit matériel » : Élastique, Mini-bande, Banc, Box, Marche ou step, Bosu, Ballon de stabilité, Roue abdominale, Wrist roller, Rouleau de massage, Tapis de sol, Mur, Partenaire.

### Boutons et liens

- Bouton photo (icône appareil photo) : « Ajouter une photo » ; pendant la réduction de l'image : « Préparation… » ; une fois une photo choisie : « Changer la photo ».
- « Annuler » : retour à la Bibliothèque, sans enregistrer.
- « Créer l'exercice » : enregistre et ouvre la fiche du nouvel exercice (pas de toast). Pendant l'envoi : « Enregistrement… ». Le bouton est aussi grisé pendant « Préparation… » de la photo.

### États

- Messages à l'envoi : « Donne un nom à l'exercice. », « Nom trop long : 80 caractères maximum. », « Choisis une rubrique. », « Groupe musculaire inconnu. », « Matériel inconnu. », « 15 consignes maximum. », « Une consigne fait plus de 300 caractères. », « Lien vidéo invalide : colle une adresse qui commence par https://. », « Photo trop lourde : 5 Mo maximum. », « Format non accepté : JPEG, PNG ou WebP. », « La photo n'a pas pu être enregistrée. Réessaie. », « L'exercice n'a pas pu être enregistré. Réessaie. »
- Le message d'erreur s'affiche au-dessus des boutons.
- Nom vide ou lien vidéo mal formé : le navigateur peut afficher sa propre bulle d'erreur avant l'envoi (texte du navigateur, absent du code).

### Téléphone et ordinateur

- Une seule colonne partout. Sur ordinateur, la carte est limitée à environ 760 px de large.
- Téléphone : les deux boutons sont empilés sur toute la largeur, « Créer l'exercice » au-dessus de « Annuler ». À partir d'un petit écran de tablette : côte à côte, alignés à droite (« Annuler » puis « Créer l'exercice »).

### À ne pas perdre

- Un seul matériel principal, ou aucun (= poids du corps).
- L'exercice appartient à l'organisation : visible par l'équipe, photo stockée en privé.
- Consignes écrites une par ligne, affichées ensuite numérotées sur la fiche.

---

## 03. Créer ma variante

### Adresse et accès

- Adresse : `/coach/bibliotheque/nouveau?variante=<clé de l'exercice d'origine>`
- On y arrive depuis la fiche d'un exercice du catalogue commun, bouton « Créer ma variante » (icône copie).

### Ce qui change par rapport à « Créer un exercice » (même page, même formulaire)

- Titre : « Créer ma variante ».
- Retour : « ← `<nom de l'exercice d'origine>` » (vers sa fiche) au lieu de « ← Bibliothèque ».
- En haut du formulaire, une phrase : « Variante de « `<nom de l'exercice d'origine>` ». »
- « Annuler » ramène à la fiche de l'exercice d'origine.
- Bouton principal identique : « Créer l'exercice ».

### Ce qui est prérempli

- « Nom de l'exercice » : « `<nom d'origine>` (ma variante) » (coupé à 80 caractères).
- « Rubrique » : celle de l'exercice d'origine.
- « Groupes musculaires » : ceux qui correspondent aux muscles principaux de l'exercice d'origine.
- « Matériel » : le premier matériel connu de l'exercice d'origine, sinon « Aucun : poids du corps ».

### Ce qui n'est pas prérempli

- « Consignes » : vides (le coach écrit les siennes).
- « Photo » : aucune.
- « Lien vidéo » : vide.

### États

- Message à l'envoi supplémentaire : « L'exercice d'origine est introuvable. »
- Clé inconnue ou mal formée dans l'adresse : la page s'affiche comme « Créer un exercice » normal (titre, retour et champs vides).
- Après la création, la fiche de la variante affiche la ligne « Variante de » avec un lien vers l'exercice d'origine (page 05).

---

## 04. Modifier l'exercice

### Adresse et accès

- Adresse : `/coach/bibliotheque/<identifiant de l'exercice>/modifier`
- On y arrive depuis la fiche d'un exercice de l'organisation (badge « Mon exercice »), bouton « Modifier » (icône crayon). Un exercice du catalogue commun n'a pas cette page (page introuvable).

### Ce qui change par rapport à « Créer un exercice » (même formulaire)

- Titre : « Modifier l'exercice ».
- Retour : « ← `<nom de l'exercice>` » (vers sa fiche).
- Tous les champs sont préremplis avec l'exercice : nom, rubrique, groupes musculaires, matériel, consignes (une par ligne), lien vidéo.
- Photo existante : son aperçu s'affiche, le bouton s'appelle « Changer la photo », et une case à cocher « Retirer la photo » apparaît sous l'aide.
- Bouton principal : « Enregistrer » (« Enregistrement… » pendant l'envoi).
- « Annuler » ramène à la fiche de l'exercice.
- Pas de phrase « Variante de … » en haut, même si l'exercice est une variante.

### États

- Message à l'envoi supplémentaire : « Exercice introuvable. »
- Une nouvelle photo remplace l'ancienne ; « Retirer la photo » laisse l'exercice sans photo.
- Après l'enregistrement : retour à la fiche de l'exercice (pas de toast).

---

## 05. Fiche d'un exercice

### Adresse et accès

- Adresse : `/coach/bibliotheque/<clé>` (catalogue commun) ou `/coach/bibliotheque/<identifiant>` (exercice de l'organisation).
- On y arrive depuis la Bibliothèque (une carte d'exercice), depuis le lien « Variante de » d'une autre fiche, et automatiquement après « Créer l'exercice » ou « Enregistrer » (pages 02 à 04).

### Contenu dans l'ordre de l'écran

1. En-tête :
   - retour « ← Bibliothèque » ;
   - titre : le nom de l'exercice ;
   - sous-titre : une rangée de badges, dans cet ordre et seulement s'ils s'appliquent : « Mon exercice » (exercice de l'organisation), la rubrique (« Musculation », « Cardio », « Hyrox » ou « Mobilité »), « Station `<N>` » (station Hyrox), le niveau (« Débutant », « Intermédiaire » ou « Avancé »), « Un côté à la fois » ;
   - actions : voir « Boutons et liens ».
2. Bloc « Illustrations » :
   - jusqu'à trois images sur une grille de deux colonnes, toutes de la même taille : l'illustration principale, « Début du mouvement » et « Fin du mouvement » (légende sous l'image) ;
   - sans aucune image : un bandeau large avec le pictogramme de la rubrique et « Illustration à venir » ;
   - si un lien vidéo existe, dessous : bouton « Voir la vidéo sur `<YouTube | Instagram | TikTok | Vimeo | Facebook>` », ou « Voir la vidéo » si la plateforme n'est pas reconnue (s'ouvre dans un nouvel onglet).
3. Carte « Muscles et matériel » (liste libellé : valeur) :
   - « Muscles principaux » : la liste, ou « À venir » ;
   - « Muscles secondaires » : seulement s'il y en a ;
   - « Matériel » : la liste, ou « Poids du corps » ;
   - « Variante de » : seulement pour une variante, avec un lien souligné vers l'exercice d'origine.
4. Carte « Consignes » : liste numérotée (pastille ronde avec le numéro), ou « Consignes à venir : elles seront écrites puis validées par un coach. »
5. Mentions en petit, sous les cartes, dans cet ordre et selon le cas :
   - exercice dont la source l'exige : « Données de l'exercice : Exercise data by RepDB (repdb.co). » (le texte « Exercise data by RepDB (repdb.co) » est un lien vers repdb.co) ;
   - exercice de l'organisation : « Exercice créé par ton organisation. » ;
   - exercice Hyrox du catalogue : « Illustration : Coory. » ;
   - toujours : « Contenu informatif, pas un avis médical. »

### Boutons et liens

- « Favori » (étoile) : bascule immédiate, étoile pleine quand l'exercice est en favori. En cas d'échec, l'étoile revient et un toast dit « Le favori n'a pas pu être enregistré. Réessaie. »
- Exercice du catalogue commun : « Créer ma variante » (page 03). Pas de « Modifier » ni de « Supprimer ».
- Exercice de l'organisation : « Modifier » (page 04) et « Supprimer » (icône corbeille).
- « Supprimer » ouvre une boîte de confirmation : titre « Supprimer « `<nom>` » ? », texte « L'exercice et sa photo disparaissent de ta bibliothèque. Cette action est définitive. », boutons « Annuler » et « Supprimer ». Après confirmation : toast « Exercice supprimé. » et retour à la Bibliothèque ; en cas d'échec : toast « L'exercice n'a pas pu être supprimé. Réessaie. »

### États

- Catalogue commun ou exercice de l'organisation : badge « Mon exercice », boutons différents, mention « Exercice créé par ton organisation. »
- Avec ou sans images, avec ou sans vidéo, avec ou sans consignes, avec ou sans muscles (« À venir »), avec ou sans matériel (« Poids du corps »), variante ou non.
- Clé inconnue : page introuvable.

### Téléphone et ordinateur

- Ordinateur : grille de 12 colonnes. Illustrations (et bouton vidéo) à gauche sur 5 colonnes, cartes et mentions à droite sur 7 colonnes. Actions à droite dans la carte d'en-tête.
- Téléphone : une seule colonne, les illustrations d'abord, puis les cartes. Les actions passent sous le titre et se partagent la largeur.

### À ne pas perdre

- Le catalogue commun ne se modifie pas : on en fait une variante.
- Mention de source RepDB visible quand elle est exigée (licence), et « Contenu informatif, pas un avis médical. » toujours.
- Les images s'affichent sur une tuile claire dans les deux thèmes, toutes à la même taille.
- La fiche ne montre rien de ce qui se règle dans une séance (répétitions, charge…) : c'est voulu.

---

## 06. Nouveau sportif

### Adresse et accès

- Adresse : `/coach/o/<organisation>/sportifs/nouveau`
- On y arrive depuis :
  - la page Sportifs : bouton « + Nouveau sportif » de l'en-tête (ordinateur) ou « + » de la barre du haut (téléphone) ;
  - la liste vide des sportifs : bouton « Ajouter mon premier sportif » ;
  - le menu « Créer » (bouton « + Créer » de l'en-tête, « + » de la barre du téléphone) : ligne « Sportif », « Une nouvelle fiche ».

### Contenu dans l'ordre de l'écran

1. En-tête : retour « ← Sportifs », titre « Nouveau sportif », sous-titre « Seul le prénom est obligatoire. Tout se modifie ensuite depuis sa fiche. »
2. Colonne principale, cinq cartes :
   1. Carte avec deux parties : « IDENTITÉ » puis « CONTACT ».
   2. Carte « PROFIL SPORTIF » (avec le Statut en bas).
   3. Carte « OBJECTIF PRINCIPAL ».
   4. Carte « DISPONIBILITÉS ».
   5. Carte « NOTES » : un encadré « Blessures et points d'attention », puis « Notes libres ».
3. Colonne de droite (ordinateur) : carte « Données de santé », puis le bouton d'enregistrement.

### Champs

Partie « IDENTITÉ » :

| Libellé | Type | Obligatoire | Aide, placeholder | Limites |
| --- | --- | --- | --- | --- |
| « Prénom » | texte | oui | | 80 caractères |
| « Nom de famille (facultatif) » | texte | non | | 80 caractères |
| « Sexe (facultatif) » | liste : « Non renseigné », « Femme », « Homme », « Non précisé » | non | | « Non renseigné » |

Partie « CONTACT » :

| Libellé | Type | Obligatoire | Aide, placeholder | Limites |
| --- | --- | --- | --- | --- |
| « Adresse e-mail (facultatif) » | e-mail | non | aide : « Il servira à l'inviter dans son espace sportif. » | message au fil de la saisie : « Adresse e-mail invalide. » |
| « Téléphone (facultatif) » | téléphone | non | placeholder « +32 … » | message au fil de la saisie : « Numéro de téléphone invalide (format international conseillé : +32 …). » |
| « Canal de contact préféré » | liste : « Non précisé », « E-mail », « Appel », « SMS », « WhatsApp » | non | | « Non précisé » |

Carte « PROFIL SPORTIF » :

| Libellé | Type | Obligatoire | Aide, placeholder | Limites |
| --- | --- | --- | --- | --- |
| « Niveau » | liste : « Non précisé », « Débutant », « Intermédiaire », « Confirmé », « Compétiteur » | non | | |
| « Type de programme » | liste : « Non précisé », « Running », « Musculation », « Hyrox », « Hybride » | non | | |
| « Expérience » | zone de texte, 2 lignes | non | placeholder « Ex. : course depuis 3 ans, un Hyrox en Open, musculation régulière » | 500 caractères |
| « Lieux d'entraînement » | pastilles, plusieurs : « Salle de sport », « Extérieur (route, trail) », « Piste d'athlétisme », « Domicile », « Box Hyrox / CrossFit » | non | | |
| « Matériel disponible » | zone de texte, 2 lignes | non | placeholder « Ex. : haltères jusqu'à 20 kg, kettlebell 16 kg, rameur » | 500 caractères |
| « Statut » | sélecteur à trois choix : « Actif », « En pause », « Archivé » | oui | | « Actif » |

Carte « OBJECTIF PRINCIPAL » :

| Libellé | Type | Obligatoire | Aide, placeholder | Limites |
| --- | --- | --- | --- | --- |
| « Type d'objectif (facultatif) » | liste groupée : « Pas encore défini » ; « Course à pied » : « Course 5 km », « Course 10 km », « Semi-marathon », « Marathon », « Autre course (trail, 20 km…) » ; « Hyrox » : « Hyrox » ; « Musculation et forme » : « Force », « Composition corporelle », « Remise en forme / santé » ; « Autre » : « Objectif personnel » | non | | « Pas encore défini » |
| « Date visée (facultatif) » | date | non | message au fil de la saisie : « Cette date est déjà passée. » | |
| « Prochaine compétition (facultatif) » | texte | non | placeholder « Ex. : Hyrox Bruxelles » ; aide : « Avec un nom, l'objectif devient une compétition : indique alors sa date. » | 120 caractères |

Carte « DISPONIBILITÉS » :

| Libellé | Type | Obligatoire | Aide, placeholder | Limites |
| --- | --- | --- | --- | --- |
| « Séances par semaine » | nombre | non | | 1 à 14 |
| « Durée maximale d'une séance (min) » | nombre | non | | 10 à 300, par pas de 5 |
| « Jours disponibles » | pastilles, plusieurs : « Lundi » à « Dimanche » | non | | |
| « Contraintes d'organisation » | zone de texte, 2 lignes | non | placeholder « Ex. : déplacements le jeudi ; séances avant 8 h en semaine » | 500 caractères |

Carte « NOTES » :

- Encadré « Blessures et points d'attention » :
  - case à cocher : « Le sportif m'a donné son accord explicite pour que je note ses blessures et points d'attention. » (décochée au départ) ;
  - case décochée : aide « Donnée de santé : coche l'accord pour les noter. Sans accord, tu pourras le faire plus tard depuis sa fiche. » ;
  - case cochée : liste « Comment ? » (« Choisir… » non sélectionnable, « Oral (en séance, au téléphone) », « Par écrit (message, e-mail) », « Formulaire signé »), puis zone de texte « Blessures et points d'attention » (4 lignes, 1 000 caractères, placeholder « Ex. : entorse de la cheville droite en septembre, éviter les sauts ; dos sensible en soulevé de terre », aide « Ce qui change l'entraînement : blessures, douleurs, zones à ménager. Pas de diagnostic ni de traitement. »).
- « Notes libres (facultatif) » : zone de texte, 4 lignes, 2 000 caractères, placeholder « Ex. : très motivée, préfère les séances du matin ; vient en vélo ; aime les défis chronométrés », aide « Caractère, préférences, logistique… Visible seulement par les coachs. Pas de blessures ici : elles vont dans « Blessures et points d'attention », avec l'accord du sportif. »

Carte « Données de santé » (rappel, sans champ) : icône bouclier et « Les blessures ne se notent qu'avec l'accord explicite du sportif (section Notes). Il peut le retirer à tout moment : ce qui a été noté est alors effacé. »

### Boutons et liens

- « Enregistrer le sportif » : crée la fiche et ouvre la fiche du sportif (pas de toast). Pendant l'envoi : « Enregistrement… ».
- Sous le bouton, sur ordinateur seulement : « Seul le prénom est obligatoire : le reste se complète plus tard. »
- Pas de bouton « Annuler » : le retour « ← Sportifs » de l'en-tête en tient lieu.

### États

- Messages au fil de la saisie : e-mail, téléphone, date visée (voir les tableaux).
- Messages à l'envoi : « Le prénom est obligatoire. », « Le prénom est trop long (80 caractères maximum). », « Le nom est trop long (80 caractères maximum). », « Adresse e-mail invalide. », « Numéro de téléphone invalide (format international conseillé : +32 …). », « Sexe invalide. », « Statut invalide. », « Canal de contact invalide. », « Niveau invalide. », « L'expérience est trop longue (500 caractères maximum). », « Lieu d'entraînement invalide. », « La description du matériel est trop longue (500 caractères maximum). », « Type de programme invalide. », « Séances par semaine : un nombre entre 1 et 14. », « Durée maximale d'une séance : entre 10 et 300 minutes. », « Les contraintes d'organisation sont limitées à 500 caractères. », « Les blessures et points d'attention sont limités à 1000 caractères. », « Choisis le type de l'objectif principal. » (date ou compétition sans type), « Date invalide. », « La date de l'objectif est déjà passée. », « Une compétition a besoin d'une date. », « Indique comment le sportif a donné son accord. », « L'accord du sportif est nécessaire pour noter des blessures ou points d'attention. », « La note est limitée à 2000 caractères. », « Un sportif de ton organisation utilise déjà cette adresse e-mail. », « Le sportif n'a pas pu être enregistré. Réessaie. »
- Le message d'erreur s'affiche juste au-dessus du bouton (dans la barre du bas sur téléphone, dans la colonne de droite sur ordinateur).
- Création partielle : la fiche s'ouvre avec le bandeau d'alerte « La fiche est créée, mais son objectif ou son accord santé n'a pas pu être enregistré. Ajoute-les depuis les onglets Objectifs et Profil. »

### Téléphone et ordinateur

- Téléphone : les cartes s'empilent, la carte « Données de santé » arrive après les cinq cartes. Le bouton « Enregistrer le sportif » (et l'erreur) est dans une barre translucide collée en bas de l'écran, visible pendant tout le défilement.
- Ordinateur : grille de 12 colonnes. Formulaire sur 8 colonnes ; à droite (4 colonnes), la carte « Données de santé » et le bouton restent collés en haut pendant le défilement.
- Dans chaque carte : un champ par ligne sur téléphone, deux colonnes à partir de la tablette ; les zones de texte et les pastilles prennent toute la largeur. « Comment ? » sur une demi-largeur.

### À ne pas perdre

- Seul le prénom est obligatoire.
- Les blessures ne se notent qu'avec l'accord explicite du sportif et la façon dont il a été donné ; sans accord, le champ n'existe pas.
- Notes libres : privées aux coachs, pas de santé dedans.
- Un nom de compétition transforme l'objectif en compétition, qui exige une date.
- L'e-mail sert ensuite à l'invitation (page 07).

---

## 07. Inviter un sportif

### Adresse et accès

- Adresse : `/coach/o/<organisation>/sportifs/<sportif>/inviter`
- On y arrive depuis :
  - la fiche du sportif : bouton « Inviter » (icône avion en papier) dans la carte d'identité, si le sportif n'a pas de compte et n'est pas archivé ;
  - le menu « ··· » de la fiche : « Inviter dans son espace » (mêmes conditions) ;
  - la liste des sportifs (ordinateur) : bouton « Inviter » sur la ligne, ou « Invité » (icône enveloppe) quand une invitation attend ;
  - le menu « ··· » d'une ligne de la liste : « Inviter dans son espace ».

### Contenu dans l'ordre de l'écran

1. En-tête : retour « ← Fiche sportif », titre « Inviter `<Nom>` », sous-titre « Génère un lien personnel et envoie-le toi-même (WhatsApp, e-mail, SMS). »
2. Paragraphe toujours présent : « Le sportif ouvrira ce lien pour créer son accès avec l'adresse `<e-mail de la fiche, ou « (aucune) »>`. Le lien est valable 7 jours et ne sert qu'une fois. Aucun message n'est envoyé automatiquement : copie le lien et transmets-le toi-même. » (l'adresse est en gras).
3. Le bloc qui dépend de l'état (voir « États »).

### Champs

- Après génération seulement : « Lien d'invitation (affiché une seule fois) », champ en lecture seule contenant le lien ; tout le lien se sélectionne quand on touche le champ.

### Boutons et liens

- « Générer le lien d'invitation » (pas d'invitation en cours) ou « Générer un nouveau lien (remplace l'ancien) » (une invitation existe). Pendant l'envoi : « Création du lien… ».
- « Révoquer ce lien » (lien souligné, dans la carte de l'invitation en cours) : révoque sans confirmation et recharge la page.
- « Copier le lien » : copie dans le presse-papiers ; devient « Lien copié ».

### États

1. Le sportif a déjà un compte : carte « Ce sportif a déjà activé son compte. » Aucun bouton.
2. Pas d'invitation, fiche avec e-mail : bouton « Générer le lien d'invitation ».
3. Fiche sans e-mail : texte rouge « Cette fiche n'a pas d'adresse e-mail : il faut en ajouter une avant de pouvoir inviter le sportif. » et bouton grisé (le paragraphe du haut affiche « (aucune) »).
4. Invitation en attente, encore valable : carte « Un lien est en attente jusqu'au `<date et heure>`. Pour des raisons de sécurité, il ne peut pas être réaffiché : génère un nouveau lien si besoin. » avec « Révoquer ce lien », puis le bouton « Générer un nouveau lien (remplace l'ancien) ».
5. Invitation expirée : carte « Le dernier lien a expiré le `<date et heure>`. » avec « Révoquer ce lien », puis « Générer un nouveau lien (remplace l'ancien) ».
6. Lien généré : le champ du lien, le bouton « Copier le lien » et la phrase « Copie ce lien maintenant : il ne pourra pas être réaffiché. » ; après la copie : « Lien copié » et « Colle-le dans ton message au sportif (WhatsApp, e-mail…). »
7. Erreurs à la génération (affichées au-dessus du bouton) : « Requête invalide. Recharge la page. », « Sportif introuvable. », « Ce sportif a déjà activé son compte. », « Ajoute d'abord une adresse e-mail à la fiche : elle servira d'identifiant au sportif. », « Impossible de remplacer l'ancien lien. », « Le lien n'a pas pu être créé. Réessaie. »
8. Sportif inexistant : seulement l'en-tête « Sportif introuvable » avec le retour « ← Sportifs ».

### Téléphone et ordinateur

- Ordinateur : la recherche, l'assistant IA et la cloche restent en haut à droite ; le bloc d'invitation (en-tête compris) est centré au milieu de l'écran, sur 600 px de large au plus.
- Téléphone : en-tête habituel, puis le contenu en une colonne.

### À ne pas perdre

- Coory n'envoie rien : le coach copie le lien et l'envoie lui-même.
- Le lien ne s'affiche qu'une fois ; une invitation en attente ne peut pas être réaffichée.
- Un nouveau lien remplace l'ancien ; valable 7 jours, à usage unique.
- L'e-mail de la fiche devient l'identifiant du sportif ; sans e-mail, pas d'invitation.

---

## 08. Onglet « Programme » de la fiche sportif

### Adresse et accès

- Adresse : `/coach/o/<organisation>/sportifs/<sportif>?onglet=programme`
- On y arrive depuis la fiche d'un sportif : onglet « Programme » (4e des 10 onglets) dans la barre d'onglets (ordinateur), ou dans le sélecteur d'onglets en bas de la carte d'identité (téléphone : « Programme  4 / 10 ▾ »).

### Contenu commun à tous les onglets (déjà refait, pour mémoire)

Au-dessus de l'onglet, la fiche garde son en-tête et sa carte d'identité, déjà dessinés d'après la maquette « Sportifs » du 03/11 : retour « ← Sportifs » (dans la barre du haut sur téléphone) ; sur ordinateur, « + Créer » (menu « Créer pour `<Nom>` » : « Programme », « Séance »…) et « ··· » (« Changer le statut », « Changer le programme », « Modifier l'objectif », « Modifier la fiche », puis « Écrire un message » ou « Inviter dans son espace ») ; photo, nom, ♀ / ♂, « Actif · Confirmé · Hyrox », « Fiche à compléter », bouton « Écrire » ou « Inviter » ; puis les onglets. Ce n'est pas l'objet de ce redesign.

### Contenu de l'onglet, sportif AVEC programme publié

Une carte :

1. Titre : le nom du programme.
2. Si le programme a un objectif : « Objectif : `<objectif>` ».
3. Quatre tuiles (libellé en petit, valeur dessous) :
   - « Période » : « `<3 nov.>` → `<28 déc.>` » (début du programme → dimanche de la dernière semaine) ;
   - « Durée » : « `<8>` semaines » ;
   - « Séances » : le nombre total de séances ;
   - « Version » : « Publiée n° `<N>` ».
4. Bouton « Voir le programme semaine par semaine » : ouvre l'onglet « Agenda » de la fiche, qui montre le programme semaine par semaine.

### Contenu de l'onglet, sportif SANS programme

Une carte :

1. Titre : « Programme ».
2. Zone en pointillés : « Aucun programme pour `<Prénom>` pour l'instant. Ici, tu verras son programme semaine par semaine, tu pourras le modifier et y ajouter des séances. »
3. Bouton « Créer un programme » : ouvre la page Programmes (pas de création préremplie pour ce sportif à ce jour).

### Champs

Aucun.

### États

- Avec programme publié, sans programme (ci-dessus). Avec programme, la ligne « Objectif » n'apparaît que si un objectif est renseigné.
- Seule la version publiée est montrée (pas de brouillon).

### Téléphone et ordinateur

- Les quatre tuiles : deux par ligne sur téléphone, quatre sur une ligne à partir d'un petit écran de tablette.
- La carte est limitée à environ 768 px de large et collée à gauche, alors que les onglets déjà refaits (Profil, Objectifs, Repères, Disponibilités, Notes, Documents, Historique) sont en pleine largeur.

### À ne pas perdre

- La période, la durée, le nombre de séances et le numéro de la version publiée.
- Le lien vers la vue semaine par semaine (onglet Agenda).
- Un état vide honnête qui annonce ce que l'onglet contiendra, avec « Créer un programme ».
- Attention au vocabulaire : « Changer le programme » du menu « ··· » change le type de programme du sportif (Running, Musculation, Hyrox, Hybride), pas le programme publié.

---

## 09. Fil d'une conversation dans Messages

### Adresse et accès

- Adresse : `/coach/messages` ; un fil précis : `/coach/messages?sportif=<sportif>` ; filtre : `/coach/messages?filtre=non-lus`.
- On y arrive depuis : le menu de gauche « Messages » (pastille rouge du nombre de messages non lus) ; le bouton « Écrire » de la fiche d'un sportif et de la page d'une séance ; l'icône bulle « Écrire à `<Nom>` » d'une ligne de la liste des sportifs (sportif avec compte) ; « Écrire un message » des menus « ··· » ; l'icône bulle « Écrire à `<Nom>` » de la carte de la prochaine séance du tableau de bord ; le lien « Voir tous les messages non lus » de la cloche (filtre « Non lues »).

### Contenu dans l'ordre de l'écran

1. En-tête : titre « Messages ». Le sous-titre « Conversations 1:1 avec tes sportifs. » existe mais n'est lu que par les lecteurs d'écran (pas affiché).
2. Carte « Conversations » (en résumé) :
   - filtres « Toutes » et « Non lues (`<N>`) » (le nombre seulement s'il y en a) ;
   - une ligne par sportif : photo, nom, heure ou jour du dernier message (« 09:12 » aujourd'hui, sinon « Hier », « Mar 20 »…), aperçu du dernier message précédé de « Toi : » s'il vient du coach, badge orange « `<N>` non lu » / « `<N>` non lus » ;
   - la conversation ouverte est surlignée (ordinateur) ;
   - vide : « Aucune conversation pour l'instant. » ou, avec le filtre, « Aucun message non lu. »
3. Carte du fil (en détail ci-dessous).

### Le fil, en détail

1. Téléphone seulement : lien « ← Conversations » en haut (il garde le filtre « Non lues » s'il était actif).
2. En-tête du fil : photo du sportif, son nom, et dessous le lien « Voir la fiche ».
3. Les messages :
   - le fil s'ouvre en bas, sur le dernier message ; il défile (hauteur limitée à un peu plus de la moitié de l'écran) ;
   - messages du coach : bulle à droite, fond foncé (inversé), coin bas droit moins arrondi ;
   - messages du sportif : bulle à gauche, fond gris clair, coin bas gauche moins arrondi ;
   - les retours à la ligne du message sont conservés ; largeur d'une bulle limitée (85 % sur téléphone, 70 % sur ordinateur) ;
   - sous chaque bulle, l'heure : « 09:12 » si c'est aujourd'hui, sinon « Hier · 09:12 » ou « Mar 20 · 09:12 » ;
   - pas d'indicateur « lu » ou « envoyé » par message ;
   - fil vide : « Aucun message pour l'instant. Écris le premier ci-dessous. »
4. La zone de réponse :
   - zone de texte (2 lignes), placeholder « Écrire un message… », 2 000 caractères au plus, nommée « Ton message » pour les lecteurs d'écran ;
   - à droite, bouton carré icône « Envoyer » (avion), grisé pendant l'envoi ;
   - dessous, en petit : « Le sportif ne voit pas encore ce fil : sa messagerie arrive avec son espace. Aucun e-mail ni WhatsApp n'est envoyé. »
   - sportif archivé : la zone de réponse est remplacée par « Ce sportif est archivé : restaure sa fiche pour lui écrire. »

### Boutons et liens

- Une ligne de conversation : ouvre ce fil (et garde le filtre).
- « Voir la fiche » : fiche du sportif.
- « Envoyer » : enregistre le message ; la zone se vide après un envoi réussi, le message apparaît en bas du fil. Pas de toast.
- « ← Conversations » (téléphone) : retour à la liste.

### États

- Messages à l'envoi (bandeau rouge avec icône, au-dessus de la zone de texte ; le texte saisi est gardé) : « Écris ton message avant de l'envoyer. », « Un message est limité à 2000 caractères. », « Sportif introuvable. », « Ce sportif est archivé : restaure sa fiche pour lui écrire. », « Le message n'a pas pu être enregistré. Réessaie. » (Message vide : le navigateur peut aussi afficher sa propre bulle avant l'envoi.)
- Lu / non lu : ouvrir un fil depuis la liste ou un lien (« ?sportif= ») marque ses messages reçus comme lus, juste après l'affichage ; le badge disparaît alors de la liste.
- Aucun fil choisi (ordinateur) : le fil le plus récent s'affiche d'office ; avec le filtre « Non lues », aucun fil ne s'ouvre tout seul et la carte dit « Choisis une conversation » / « Les conversations qui ont des messages non lus sont dans la liste. »
- Aucune conversation du tout : « Aucune conversation » / « Les messages de tes sportifs apparaîtront ici. »
- Sportif inconnu dans l'adresse : « Conversation introuvable » / « Ce sportif n'existe pas ou n'appartient pas à ton organisation. »

### Téléphone et ordinateur

- Ordinateur : grille de 12 colonnes, la liste sur 4 colonnes à gauche, le fil sur 8 colonnes à droite, côte à côte.
- Téléphone : d'abord la liste seule, en pleine largeur. Toucher une conversation affiche le fil seul, en plein écran, avec « ← Conversations » en haut ; la liste est alors masquée.

### À ne pas perdre

- Une conversation par sportif (1:1).
- Ne jamais faire croire à un envoi : la phrase « Le sportif ne voit pas encore ce fil… Aucun e-mail ni WhatsApp n'est envoyé. » reste visible.
- On n'écrit pas à un sportif archivé.
- Le filtre « Non lues » et les compteurs de non lus.

---

## Paramètres (pages 10 à 13) : les deux emplacements

Les sections Préférences, Pays devise et TVA, Sécurité et Données ont **le même contenu** à deux endroits ; il est décrit une seule fois dans les pages 10 à 13.

1. **La fenêtre des Paramètres** (kit des boîtes, boîte 33, déjà dessinée pour sa coque) :
   - ouverte depuis le menu du compte (carte du coach en bas du menu de gauche sur ordinateur, dans le menu ☰ sur téléphone) : « Mon profil » ouvre la section Profil, « Paramètres » ouvre le sommaire sur téléphone et la section Profil sur ordinateur ;
   - ordinateur : grande fenêtre ; à gauche une colonne « Paramètres » avec les cinq sections (icône et nom) ; à droite, le nom de la section, sa phrase d'aide dessous (« Thème, valeurs par défaut, agenda, notifications », « Ta devise et ton taux de TVA », « E-mail, mot de passe, appareils », « Exporter toutes tes données »), le bouton « Fermer » (croix), puis le contenu qui défile ;
   - téléphone : sommaire (titre « Paramètres », croix, carte du profil en violet pâle avec photo, nom et e-mail, liste des cinq sections avec leur phrase d'aide, bouton « Se déconnecter »), puis la section choisie avec une flèche de retour « Paramètres », son nom, sa phrase d'aide et la croix ;
   - chargement : « Chargement de tes paramètres… » ; échec : « Les paramètres n'ont pas pu être chargés. Ferme la fenêtre et réessaie. »
2. **La page `/coach/profil?onglet=…`** (`preferences`, `argent`, `securite`, `donnees`) :
   - ouverte par un lien direct, au rechargement, ou depuis la page Notifications (« Changer dans Paramètres » mène à `?onglet=preferences`) ;
   - en-tête : titre « Paramètres » (sous-titre « Ton compte, tes préférences et tes structures. » lu seulement par les lecteurs d'écran) ;
   - ordinateur : menu des sections à gauche (260 px, section active surlignée, sans phrase d'aide), section à droite avec son nom en titre (sans phrase d'aide) ;
   - téléphone : sommaire (carte du profil avec photo, nom, e-mail ; liste des sections avec leur phrase d'aide et un chevron ; bouton « Se déconnecter »), puis la section seule avec le lien « ← Paramètres » au-dessus de son nom.

Les cinq sections, dans l'ordre : « Profil », « Préférences », « Pays, devise et TVA », « Sécurité », « Données ».

**La section Profil a déjà été refaite dans la fenêtre (kit, boîte 33) : elle n'est pas détaillée ici.** Sur la page, elle garde encore ses trois cartes « Photo », « Identité », « Organisation ».

---

## 10. Paramètres : Préférences

### Adresse et accès

- Fenêtre des Paramètres, section « Préférences » ; ou page `/coach/profil?onglet=preferences`.

### Contenu dans l'ordre de l'écran

1. Carte « Thème » : phrase « « Système » suit le réglage de ton téléphone ou de ton ordinateur. Retenu sur cet appareil. », puis trois choix avec icône : « Clair », « Sombre », « Système ». Le choix s'applique tout de suite, sans bouton.
2. Carte « Valeurs par défaut », sous-titre : « Pour ne pas retaper les mêmes infos à chaque séance : la fenêtre « Nouvelle séance » se remplit avec ces valeurs (tu peux toujours les changer). Et les heures affichées dans ton agenda. »
   - groupe « Quand tu crées une séance », phrase « Ex. : 60 min, à la salle, 65 € par virement, déjà remplis dans « Nouvelle séance ». » (le symbole suit la devise) ;
   - groupe « Heures de l'agenda » (séparé par un filet), phrase « Heures visibles à l'ouverture de la grille ; elle défile de 00:00 à 24:00 pour noter quelque chose plus tôt ou plus tard. » ;
   - bouton « Enregistrer les préférences ».
3. Carte « Notifications », sous-titre : « Ce qui compte dans la cloche et s'affiche dans Notifications. Rien n'est envoyé par e-mail ou WhatsApp pour l'instant. » ; cinq interrupteurs.

### Champs

| Libellé | Type | Obligatoire | Aide, placeholder | Limites |
| --- | --- | --- | --- | --- |
| « Durée (min) » | nombre | oui | | 15 à 480, par pas de 5 |
| « Lieu (facultatif) » | texte | non | placeholder « Ex. : Salle de sport » | 120 caractères |
| « Prix (€) (facultatif) » | texte décimal | non | placeholder « Ex. : 65 » ; aide selon le paiement : « Par virement : prix hors TVA, la TVA de 21 % s'ajoute. » ou « En espèces : prix direct, TVA comprise. » | message au fil de la saisie : « Montant invalide : écris par exemple 65 ou 65,50. » |
| « Paiement » | sélecteur : « Virement », « Espèces » | oui | | « Virement » si rien n'est réglé |
| « À partir de » | liste d'heures « 00:00 » à « 12:00 » | oui | | |
| « Jusqu'à » | liste d'heures « 13:00 » à « 24:00 » | oui | | |

Interrupteurs « Notifications » (libellé, puis aide) :

1. « Messages non lus » : « Les messages des sportifs que tu n'as pas encore ouverts. »
2. « Tâches du jour et en retard » : « Tes tâches à faire aujourd'hui ou déjà dépassées. »
3. « Séances à encaisser » : « Les séances avec un prix, toujours pas payées une semaine après. »
4. « Compétitions dans les 7 jours » : « Les compétitions proches de tes sportifs. »
5. « Fiches à compléter » : « Les sportifs sans nom de famille ou sans contact. »

### Boutons et liens

- « Enregistrer les préférences » (« Enregistrement… ») : confirmation en vert sous le bouton « Préférences enregistrées. »
- Interrupteurs : effet immédiat, puis toast « Affiché dans la cloche. » ou « Masqué de la cloche. » ; en cas d'échec, l'interrupteur revient et le toast dit « Le réglage n'a pas pu être enregistré. Réessaie. »

### États

- Messages à l'envoi : « Durée par défaut : entre 15 et 480 minutes. », « Lieu trop long (120 caractères maximum). », « Prix invalide : écris par exemple 65 ou 65,50. », « Choisis espèces ou virement. », « Début de l'agenda : entre 0 h et 12 h. », « Fin de l'agenda : entre 13 h et 24 h. », « Les préférences n'ont pas pu être enregistrées. Réessaie. »

### Téléphone et ordinateur

- Les quatre champs de « Quand tu crées une séance » : un par ligne sur téléphone, deux colonnes à partir de la tablette. « À partir de » et « Jusqu'à » toujours côte à côte (sur les deux tiers de la largeur à partir de la tablette).

### À ne pas perdre

- Les valeurs par défaut remplissent la boîte « Nouvelle séance » ; elles ne changent pas les séances existantes.
- Le thème est retenu sur l'appareil (pas sur le compte).
- Rien n'est envoyé par e-mail ou WhatsApp.

---

## 11. Paramètres : Pays, devise et TVA (« Argent »)

### Adresse et accès

- Fenêtre des Paramètres, section « Pays, devise et TVA » ; ou page `/coach/profil?onglet=argent`.

### Contenu dans l'ordre de l'écran

1. Carte « Pays et devise » :
   - « Pays » : liste déroulante des pays ; le choix s'enregistre tout de suite (pas de bouton) et affiche le toast « Pays enregistré. » ; aide « Proposé pour les adresses ; nomme les moyens de paiement de ton pays. » ;
   - « Devise » : texte non modifiable, par exemple « Euro (EUR) », aide « Tes nouveaux montants sont dans cette devise. » ;
   - s'il y a eu des changements de devise, leur liste : « `<15 octobre 2026>` : EUR → CHF (1 EUR = 0,94 CHF) » ;
   - bouton « Changer de devise » (icône double flèche).
2. Carte « TVA », sous-titre : « Pour le prix de tes séances et ton résultat hors TVA dans la Comptabilité. Tes factures se font dans ton logiciel de facturation ou chez ton comptable. »
   - interrupteur « Je facture la TVA », aide « Sinon, tes prix et tes gains s'affichent sans TVA. » ;
   - si activé : champ « Taux de TVA » avec « % » dans le champ, placeholder « 21 », aide « Pour tes prochains paiements ; ceux déjà notés gardent leur taux. » ;
   - bouton « Enregistrer ».

### La boîte « Changer de devise » (déjà refaite, kit des boîtes, boîte 34)

- Titre « Changer de devise », sous-titre « Pour un déménagement : le passé reste dans sa devise, le futur est converti. »
- « Nouvelle devise » : les 20 devises de Coory sauf l'actuelle, écrites « Nom (CODE) », dans cet ordre : Euro (EUR), Franc suisse (CHF), Livre sterling (GBP), Dollar des États-Unis (USD), Dollar canadien (CAD), Dollar australien (AUD), Dollar néo-zélandais (NZD), Couronne suédoise (SEK), Couronne norvégienne (NOK), Couronne danoise (DKK), Zloty polonais (PLN), Couronne tchèque (CZK), Leu roumain (RON), Dirham marocain (MAD), Dirham des Émirats arabes unis (AED), Dollar de Singapour (SGD), Dollar de Hong Kong (HKD), Rand sud-africain (ZAR), Réal brésilien (BRL), Peso mexicain (MXN). La première de la liste est choisie au départ.
- « Taux : 1 `<EUR>` = … `<CHF>` », placeholder « Ex. : 0,94 » ; aide qui change : « Le taux du jour, celui de ta banque par exemple. » puis « `<100,00 €>` deviendront `<94,00 CHF>`. »
- Deux cartes : « Sera converti en `<CHF>` » (« `<N>` séance(s) à venir avec prix » et « Ton prix par défaut des séances ») et « Reste en `<EUR>` » (« `<N>` paiement(s) reçu(s) ») ; « Calcul… » pendant le chargement.
- Aide : « Les totaux qui mélangent les deux devises s'affichent « ≈ », convertis avec ce taux. »
- Pied : « Annuler » et « Passer en `<CHF>` » (grisé tant que le taux est vide ou faux ; « Changement… » pendant l'envoi). Succès : toast « Devise changée : `<Franc suisse (CHF)>`. »

### Boutons et liens

- « Changer de devise » : ouvre la boîte ci-dessus (propriétaire seulement).
- « Enregistrer » (TVA, propriétaire seulement) : confirmation « TVA enregistrée. »

### États

- **Non-propriétaire de l'organisation** : le pays est grisé avec l'aide « Seul le propriétaire peut changer le pays. » ; pas de bouton « Changer de devise » ; l'interrupteur TVA est grisé avec l'aide « Seul le propriétaire peut changer la TVA. » ; pas de bouton « Enregistrer ».
- Erreurs du pays (le choix revient à l'ancien pays) : « Seul le propriétaire peut changer le pays. », « Pays invalide. », « Le pays n'a pas pu être enregistré. Réessaie. »
- Erreurs de TVA : « Indique ton taux de TVA (un nombre entre 0 et 100). », « Seul le propriétaire peut changer la TVA. », « La TVA n'a pas pu être enregistrée. Réessaie. »
- Erreurs de devise (dans la boîte) : « Seul le propriétaire peut changer la devise. », « Choisis la nouvelle devise. », « C'est déjà la devise de ton organisation. », « Taux invalide : un nombre plus grand que 0 (ex. 0,94). », « La devise n'a pas pu être changée. Réessaie. »
- TVA désactivée : le champ « Taux de TVA » disparaît (taux 0).

### Téléphone et ordinateur

- « Pays » et « Devise » : l'un sous l'autre sur téléphone, côte à côte à partir de la tablette. Le champ du taux de TVA reste étroit (environ 220 px).

### À ne pas perdre

- « Passé gardé, futur converti » : les paiements reçus restent dans leur devise, les prix à venir et le prix par défaut sont convertis ; l'historique des changements reste visible.
- Coory ne fait pas de factures ; un seul taux de TVA, choisi librement, 0 si le coach ne facture pas la TVA.
- Seul le propriétaire change le pays, la devise et la TVA.

---

## 12. Paramètres : Sécurité

### Adresse et accès

- Fenêtre des Paramètres, section « Sécurité » ; ou page `/coach/profil?onglet=securite`.

### Contenu dans l'ordre de l'écran

1. Carte « Adresse e-mail » : « Adresse actuelle : `<e-mail>` », champ « Nouvelle adresse e-mail », bouton « Changer d'adresse ».
2. Carte « Mot de passe » : trois champs, bouton « Changer le mot de passe ».
3. Carte « Appareils connectés », sous-titre « Un téléphone perdu, un ordinateur partagé : déconnecte tous tes appareils d'un coup, celui-ci compris. » ; boutons « Déconnecter partout » et « Se déconnecter ».

### Champs

| Libellé | Type | Obligatoire | Aide | Limites |
| --- | --- | --- | --- | --- |
| « Nouvelle adresse e-mail » | e-mail | oui | « Un lien de confirmation part à la nouvelle adresse ; rien ne change avant ton clic. » | message au fil de la saisie : « Adresse e-mail invalide. » |
| « Mot de passe actuel » | mot de passe | oui | | |
| « Nouveau mot de passe » | mot de passe | oui | « Au moins 10 caractères. » | 10 à 128 caractères |
| « Confirmer le nouveau » | mot de passe | oui | | identique au nouveau |

### Boutons et liens

- « Changer d'adresse » (« Enregistrement… ») : succès en vert « Un lien de confirmation a été envoyé à `<nouvelle adresse>`. Ton adresse change dès que tu cliques dessus. »
- « Changer le mot de passe » (« Enregistrement… ») : succès « Mot de passe changé. »
- « Déconnecter partout » (icône sortie) : boîte de confirmation, titre « Déconnecter tous les appareils ? », texte « Tu devras te reconnecter partout, y compris ici. », boutons « Annuler » et « Déconnecter partout » ; puis page de connexion.
- « Se déconnecter » : déconnexion de cet appareil.

### États

- Erreurs e-mail : « Indique ton adresse e-mail. », « Cette adresse e-mail ne semble pas valide. », « C'est déjà ton adresse actuelle. », « Le changement n'a pas pu être demandé (adresse déjà utilisée ?). Réessaie. »
- Erreurs mot de passe : « Indique ton mot de passe actuel. », « Choisis un mot de passe. », « Au moins 10 caractères, s'il te plaît. », « Le mot de passe est trop long (128 caractères maximum). », « Les deux nouveaux mots de passe ne correspondent pas. », « Le nouveau mot de passe doit être différent de l'actuel. », « Mot de passe actuel incorrect. », « Le mot de passe n'a pas pu être changé. Réessaie. »
- Les messages (erreur en rouge, succès en vert) s'affichent à côté du bouton de la carte concernée.

### Téléphone et ordinateur

- Téléphone : un champ par ligne. À partir de la tablette : « Nouvelle adresse e-mail » sur deux tiers de la largeur ; « Mot de passe actuel » seul sur une demi-largeur, puis « Nouveau mot de passe » et « Confirmer le nouveau » côte à côte.

### À ne pas perdre

- Le changement d'adresse ne prend effet qu'après le clic dans l'e-mail de confirmation.
- « Déconnecter partout » demande toujours une confirmation et déconnecte aussi l'appareil en cours.

---

## 13. Paramètres : Données

### Adresse et accès

- Fenêtre des Paramètres, section « Données » ; ou page `/coach/profil?onglet=donnees`.

### Contenu dans l'ordre de l'écran

1. Carte « Exporter mes données », sous-titre : « Un fichier JSON avec tout ce que contient ton organisation : sportifs, objectifs, séances, programmes, paiements, factures, tâches, messages, notes et structures. Utile pour une sauvegarde ou pour changer d'outil. »
2. Bouton « Télécharger mes données » (icône téléchargement).
3. Note : « Il contient des données de santé (blessures notées avec l'accord des sportifs) : garde-le en lieu sûr. »

### Champs

Aucun.

### Boutons et liens

- « Télécharger mes données » : télécharge le fichier `coory-export-<AAAA-MM-JJ>.json`. Pas de confirmation, pas de toast.

### États

- Aucun état particulier dans le code (pas de message d'attente ni d'erreur affiché sur la page).

### Téléphone et ordinateur

- Aucune différence de structure.

### À ne pas perdre

- L'avertissement sur les données de santé contenues dans le fichier.

---

## Composants partagés

Ce que touche un même redesign à plusieurs endroits :

- **En-tête de page** (toutes les pages) : lien de retour, titre, sous-titre, actions ; sur ordinateur, recherche « Rechercher dans Coory… », assistant IA et cloche à droite. Sur téléphone, le titre d'une page sans retour est remplacé par le nom de la page dans la barre du haut, et le sous-titre n'est alors pas affiché (cas de Messages et de Paramètres). Le lien de retour affiche le nom de la page d'où l'on vient quand on vient d'une autre page de l'app (« retour là où j'étais »), sinon le libellé indiqué dans ce document.
- **Formulaire de séance** : page 01 « Modifier la séance » et boîte « Nouvelle séance » (déjà refaite). Même fichier, mêmes champs, mêmes règles de prix et de TVA, deux présentations.
- **Formulaire d'exercice** : pages 02, 03 et 04 (un seul formulaire, trois usages).
- **Champs de la fiche sportif** (identité, contact, profil sportif, disponibilités, blessures et points d'attention, notes libres) : page 06 « Nouveau sportif » et onglets Profil, Disponibilités et Notes de la fiche sportif. Mêmes libellés et mêmes limites ; les onglets de la fiche ont déjà leur habillage « fiche » (maquette « Sportifs » du 03/11), la page 06 a encore l'ancien.
- **Contenu des sections des Paramètres** : fenêtre des Paramètres et page `/coach/profil` (pages 10 à 13).
- **Pastilles à cocher** : Rubrique et Groupes musculaires (02 à 04), Sportifs inscrits (01), Lieux d'entraînement et Jours disponibles (06).
- **Sélecteur à choix exclusifs (segmenté)** : Paiement (01, 10), Statut (06).
- **Contrôle au fil de la saisie** : montant (01, 10), e-mail (06, 12), téléphone (06, profil), date future (06). Mêmes messages partout.
- **Boîte de confirmation** (déjà refaite, kit) : « Supprimer » un exercice (05), « Déconnecter partout » (12).
- **Toasts** (messages brefs en bas de l'écran) : favori, suppression d'exercice (05), pays, devise, interrupteurs de la cloche (10, 11).
- **Image d'exercice sur tuile claire** : fiche d'exercice (05), aperçu photo du formulaire (02 à 04), cartes de la Bibliothèque.
- **Bouton « Favori »** : fiche d'exercice (05) ; la même étoile existe en version ronde sur les cartes de la Bibliothèque.
- **Carte avec titre et sous-titre** : Paramètres (10 à 13), fiche d'exercice (05), carte « Données de santé » (06).
- **Interrupteur** : notifications (10), « Je facture la TVA » (11).
- **Champ taux de TVA avec « % »** : Paramètres (11), et aussi les formulaires de paiement et de dépense.
- **Choix du thème « Clair / Sombre / Système »** : Paramètres (10) et menu du compte.
- **Bouton « Se déconnecter »** : Sécurité (12), sommaires des Paramètres sur téléphone, menu du compte.
- **Avatar (photo ou initiales)** : Messages (09), sommaires des Paramètres, fiche sportif.
- **État vide** (icône, titre, texte) : fil de Messages (09).
