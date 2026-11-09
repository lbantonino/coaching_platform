# 17 · Étude des applis de référence pour les programmes

Étude du 08/11/2026, demandée par Antonino. But : voir comment les meilleures applis font créer un entraînement et un plan, et en tirer le parcours du coach dans Coory, discipline par discipline, avant de dessiner (brief pour Claude Design : `coory-design/BRIEF_CLAUDE_DESIGN_PROGRAMMES.md`) puis de coder.

Applis étudiées :

- **Running** : Garmin Connect, Campus Coach, Runna, Fréquence Running ;
- **Hyrox** : RoxFit (et, pour comparer, TrainRox et Centr) ;
- **Musculation** : Hevy, Hevy Coach, Alpha Progression, TrueCoach.

**Méthode et limites.** Sources publiques uniquement : sites officiels, centres d'aide, fiches App Store, tests et avis (liens en fin de document). Les écrans des applis n'ont pas pu être ouverts : le détail exact de certains parcours est inconnu et marqué comme tel. Ce qui vient de ma connaissance de Garmin Connect, sans avoir été revérifié pour cette étude, est signalé « à vérifier ».

Point de départ, déjà décidé pour Coory (docs 04 à 07, décisions d'Antonino et de Gianluca) :

- une séance de programme n'a **pas d'heure** ; elle est numérotée dans sa semaine (Séance 1, 2, 3…) et le sportif la fait quand il veut, dans l'ordre ; un coach pourra en option fixer un jour par séance ;
- le programme s'affiche **semaine par semaine** ;
- une séance est un **objet structuré** (blocs, étapes, cibles), jamais un grand texte ;
- le coach crée un programme depuis la page Programmes **ou** depuis la fiche d'un sportif (sportif déjà choisi) ;
- conçu **pour le téléphone d'abord**, puis l'ordinateur ;
- le coach garde toujours la main : aucune séance générée et imposée par une machine.

---

## 1. Running

### Garmin Connect

- **Une séance est une liste ordonnée d'étapes.** Chaque étape a :
  - un type : échauffement, course, récupération, repos, retour au calme ;
  - une durée : temps, distance, ou « jusqu'à l'appui sur le bouton » (à vérifier) ;
  - une cible : allure, zone ou plage de fréquence cardiaque, cadence, puissance ; une cible secondaire est possible.
- Un bloc **« Répéter N fois »** entoure des étapes (ex. 10 × [400 m vite + 200 m trot]).
- **Parcours** : Entraînement › Séances › Créer, nommer, « Ajouter une étape », grouper en « Répéter », enregistrer. La séance se range dans une bibliothèque, se pose sur le calendrier et s'envoie à la montre (à vérifier pour le détail des écrans).
- **Pendant la séance**, la montre affiche l'étape et la cible, et alerte quand on sort de la cible.
- **À reprendre** : c'est le modèle de séance de référence ; c'est exactement ce qu'il faut à Coory.
- **À éviter** : la saisie étape par étape sur plusieurs écrans successifs, lourde sur téléphone.

### Campus Coach (France)

- Des plans de 12 semaines à un an, générés à partir de l'objectif de course, du niveau et des disponibilités.
- Types de séances : endurance facile, fractionné à allure 10 km, VMA, sortie longue, récupération, renforcement. Les cibles sont en allure et en **% de VMA**.
- Le plan s'ajuste aux séances faites ou manquées ; aucune montre n'est nécessaire.
- **À reprendre** : le vocabulaire des types de séances, la VMA comme référence (Coory a déjà un calculateur de VMA dans les Repères), le plan qui part d'un objectif de course.
- **À éviter** : un plan entièrement généré, où le coach n'a pas la main.

### Runna (Strava)

- Un accueil court : niveau ou course récente, objectif (distance, date, temps visé), nombre de séances et jours, puis le plan est généré.
- Les **allures de chaque séance sont calculées à partir d'une course récente**. Une plage d'allure par étape, ou un mode « effort ». Des séances de renfo sont intégrées au plan.
- **À reprendre** : les allures pré-remplies à partir des repères du sportif (Coory les a déjà sur la fiche, onglet Repères) ; le coach peut toujours les corriger.
- Le détail du graphique de séance n'a pas été vérifié.

### Fréquence Running (frequence-running.com, France)

- Un plan généré selon le niveau, l'emploi du temps et l'objectif (10 km, semi, marathon, trail). Le sportif choisit ses jours et son terrain (piste, route, trail).
- Le sportif peut **modifier, échanger ou reporter** une séance. Le **ressenti** après séance sert à adapter la suite.
- Signaux sonores pendant les fractionnés ; export vers Garmin, COROS, Polar et Strava.
- **À reprendre** : le ressenti après séance (déjà prévu côté sportif dans Coory) ; la souplesse de l'ordre des séances, qui correspond au choix de Gianluca (séances dans l'ordre, sans jour imposé).

### Ce que Coory retient pour le Running

- **Séance** : liste ordonnée d'étapes, et blocs « Répéter N fois » (un seul niveau d'imbrication suffit au départ).
- **Étape** :
  - un type (échauffement, course, récupération, repos, retour au calme) ;
  - une mesure : durée, distance ou libre ;
  - une cible : plage d'allure en min/km, % de VMA, zone ou plage de FC, effort ressenti (RPE), ou aucune ;
  - une note courte.
- **Résumé calculé tout seul** : « 10 × 400 m », distance et durée totales estimées.
- **Pré-remplissage** : échauffement et retour au calme déjà posés ; allures proposées à partir des repères du sportif (VMA, allures de course), toujours modifiables.
- **Pas d'aperçu graphique** : le « déroulé » en barres a été retiré de la page d'une séance le 08/11/2026 (D-152), Antonino jugeant ces graphiques décoratifs. Le résumé chiffré, en texte, suffit.

---

## 2. Hyrox

### RoxFit

- **Constat important : RoxFit n'a pas de programmes sur plusieurs semaines** (sa FAQ le dit : « pas encore disponible ») **ni d'espace coach.** C'est une appli de séances et de course.
- **Séances** : un constructeur en blocs, tours et intervalles, à partir de milliers d'exercices. Un lecteur de séance guide exercice par exercice (minuteurs, alertes vocales, montre). Un assistant IA crée une séance à partir d'une phrase.
- **L'idée la plus forte, « Race Goals »** : le sportif donne le lieu de la course, sa catégorie (Open, Pro, Doubles, Relay), son genre et son temps visé. RoxFit propose un **temps cible pour chaque partie de la course** (chaque run, chaque station, et les transitions dans la « Roxzone »), modifiable ligne par ligne.
- **Résultats** : les courses HYROX réelles sont importées avec les temps de chaque partie.

### Pour comparer : TrainRox et Centr

- **TrainRox** : un programme semaine par semaine jusqu'à la course, qui mélange intervalles de course, force, sled et simulations. Formats : stations, AMRAP, EMOM, for time, intervalles. Le sportif saisit charge, répétitions, distance et temps à chaque tour.
- **Centr** (programme certifié HYROX) : 12 semaines en phases, avec un affûtage d'environ 2 semaines avant la course.

### Ce que Coory retient pour l'Hyrox

- **Séance** : des blocs ordonnés. Chaque bloc a :
  - un format : circuit à tours, intervalles, for time, AMRAP, EMOM, simulation de course, séries de force ;
  - un nombre de tours, une limite de temps (time cap), un temps cible, un repos entre tours ;
  - des étapes ordonnées.
- **Étapes** :
  - **course** : distance ou durée, et allure ;
  - **station** : un exercice de la Bibliothèque (les 8 stations y sont déjà), avec distance, répétitions et charge ;
  - **ergomètre** : allure en min/500 m, à ne jamais confondre avec une allure de course en min/km ;
  - **repos** ou **transition** (Roxzone) ;
  - **exercice de force** (comme en musculation).
- **Simulation de course** : un modèle prêt avec les 8 runs et les 8 stations dans l'ordre officiel, et un temps cible par partie (idée de RoxFit), que le coach corrige.
- **Charges par catégorie** : la doc 07 interdit d'imposer des charges de compétition (les règles changent). Coory peut **proposer** la charge de la catégorie du sportif, à valider par le coach ; à trancher (question 3).
- **Programme** : en phases optionnelles (base, spécifique, simulation, affûtage), avec la date de la course comme objectif.

---

## 3. Musculation

### Hevy

- Une **routine** (séance) contient des exercices. Pour chacun :
  - des séries, chacune d'un **type** : échauffement, normale, dégressive, échec ;
  - une charge, et des répétitions fixes ou en fourchette (« 3 × 6-10 ») ;
  - un **minuteur de repos propre à l'exercice**.
- **Supersets** : on lie 2 exercices ou plus. Un calculateur ajoute les séries d'échauffement.
- Pas de vrai programme sur plusieurs semaines : des routines rangées dans des dossiers.
- **Pendant la séance**, le sportif remplit charge et répétitions série par série, coche la série, et le repos démarre.
- **À reprendre** : les types de série, le repos par exercice, la rapidité de saisie sur téléphone.

### Hevy Coach

- Le même constructeur, pour des coachs : on construit, puis on assigne à des clients.
- Une critique d'utilisateur relève que les séances arrivent **en vrac dans un dossier**, sans pouvoir être placées dans une semaine. **C'est à éviter** : Coory range tout par semaine.

### Alpha Progression

- Plans **en mésocycles** : séries, répétitions et **RIR cible** (répétitions en réserve) qui évoluent de semaine en semaine, avec une **semaine de décharge** planifiée. Exemple : RIR de 3 à 0 sur 4 semaines, puis décharge.
- **Progression double** : d'abord les répétitions, puis la charge. À chaque série, l'appli affiche la cible (charge, répétitions) et le sportif saisit ce qu'il a fait.
- Plan généré ou fait à la main ; la progression peut être désactivée.
- **À reprendre (plus tard)** : la progression proposée et la décharge en un clic.
- **À éviter** : cacher les réglages importants (RIR, décharge) derrière un abonnement.

### TrueCoach

- Le coach clique un client, son **calendrier** s'ouvre, puis « Ajouter une séance » sur un jour, et il ajoute les exercices par recherche.
- **Par exercice** : séries, répétitions, tempo, repos, description. Échauffement et retour au calme en texte libre.
- **Supersets** par un simple lien entre deux exercices ; **circuits** (EMOM, AMRAP) par un bouton.
- La **vidéo de démonstration se lie toute seule** dès qu'on tape le nom. On peut copier-coller un cycle entier, et poser des blocs récurrents.
- **À éviter** : un outil pensé pour l'ordinateur seulement, et un espace client jugé peu simple.

### Ce que Coory retient pour la Musculation

- **En-tête de séance** : titre, note du coach, échauffement et retour au calme en texte libre.
- **Exercices** choisis dans la Bibliothèque de Coory (recherche, filtres muscles et matériel, déjà en place), seuls ou groupés en **superset** ou **circuit**.
- **Par exercice** : consigne, repos, tempo facultatif ; la vidéo du coach s'affiche si l'exercice en a une.
- **Par série**, une ligne :
  - un type (échauffement, normale, dégressive, échec) ;
  - des répétitions fixes, en fourchette, ou « échec » ;
  - une charge en kg ou en % du 1RM, facultative ;
  - un effort cible en RIR ou RPE, facultatif.
- **Saisie rapide** : « 3 séries de 8 à 10 » se remplit d'un coup, puis on ajuste une série si besoin. Les cas de la doc 06 sont couverts : pyramide 20-15-10-8 en séries distinctes, EMOM pompes 20 s / 40 s.

---

## 4. Ce que toutes ces applis apprennent à Coory

1. **Une seule grammaire de séance, trois éditeurs.** Toutes structurent une séance en **blocs** qui contiennent des **étapes**, avec des répétitions (« Répéter », tours, séries). Coory garde **un seul modèle** (docs 04 et 07) et montre au coach **un éditeur adapté à la discipline** : étapes et allures pour le Running, séries et charges pour la Musculation, formats et stations pour l'Hyrox. Une séance hybride mélange les blocs.
2. **Partir de quelque chose, jamais d'une page blanche.** Modèles de séance, échauffement déjà posé, allures calculées depuis les repères, simulation Hyrox prête : le coach corrige au lieu de tout saisir.
3. **Le coach garde la main.** Les applis grand public génèrent des plans opaques ; un coach veut proposer, ajuster, valider. Pas de génération automatique imposée dans le MVP.
4. **Tout se range par semaine.** C'est la critique principale faite à Hevy Coach. Coory affiche le programme semaine par semaine, séances numérotées.
5. **Dupliquer, puis ajuster.** Copier une séance ou une semaine vers les suivantes, puis modifier une valeur : c'est le geste de base de tous les outils de coach. La progression automatique (+ charge, + répétitions, décharge) vient après le MVP.
6. **Téléphone d'abord, vraiment.** Une liste verticale, une feuille qui monte du bas pour ajouter un exercice, de grands champs avec le bon clavier. L'ordinateur montre plus de choses à la fois, sans être indispensable.
7. **Le retour du sportif** (fait, ressenti, charges réelles, temps réalisés) fait la valeur pour le coach. C'est prévu dans l'espace sportif, après le MVP, mais le modèle de séance doit déjà distinguer **prévu** et **réalisé**.

---

## 5. Le parcours du coach proposé pour Coory

### Créer un programme (assistant, 4 étapes)

1. **Pour qui** : le sportif (déjà choisi si on vient de sa fiche), le titre du programme.
2. **Objectif** : la discipline principale (Running, Musculation, Hyrox ; Hybride plus tard), une course ou un objectif facultatif avec sa date, une note.
3. **Calendrier** : la date de début, le nombre de semaines, le nombre de séances par semaine. Pour les séances, « dans l'ordre, sans jour » par défaut, ou « un jour fixe par séance ».
4. **Point de départ** : vierge, copie d'un programme précédent du sportif, ou plus tard un modèle de semaine. Puis un aperçu, et le programme est créé **en brouillon**.

### Construire le programme (éditeur de programme)

- **Téléphone** : la liste des semaines, puis une semaine et ses séances numérotées, puis une séance.
- **Ordinateur** : les semaines à gauche, les séances de la semaine au centre, la séance ouverte à droite (doc 04).
- **Gestes** :
  - ajouter une séance ;
  - dupliquer une séance ou une semaine vers d'autres semaines ;
  - changer l'ordre (boutons sur téléphone, glisser-déposer en plus sur ordinateur) ;
  - marquer une semaine « allégée » ;
  - nommer des phases (facultatif).

### Construire une séance (éditeur de séance, selon la discipline)

- Choisir un point de départ : un modèle de séance de la discipline, une copie d'une séance existante, ou une séance vide.
- Ajouter et régler les blocs et les étapes :
  - **Running** : étapes et « Répéter » ;
  - **Musculation** : exercices et séries ;
  - **Hyrox** : blocs à format, avec runs et stations.
- Un aperçu en direct montre la séance comme le sportif la verra, avec la durée estimée et le résumé.

### Publier, puis envoyer

- « Publier » vérifie que tout est rempli, fige une **version**, et le sportif la voit dans son espace (après le MVP).
- Le **PDF** du programme et de l'agenda sort de cette version. Pour commencer, le coach envoie **tous les PDF d'un coup** (décision d'Antonino du 09/11/2026).
- Modifier ensuite crée un nouveau brouillon, puis une version 2 (doc 04).

---

## 6. Dans le MVP du 13/11, ou plus tard

| Dans le MVP | Plus tard |
| --- | --- |
| Page Programmes, assistant de création, éditeur de programme | Modèles de semaine |
| Éditeurs de séance Running, Musculation, Hyrox | Éditeur Hybride complet (mélange libre) |
| Dupliquer une séance ou une semaine | Progression automatique, décharge en un clic |
| Allures proposées depuis les repères (VMA) | Plan de course Hyrox par parties (temps cible de chaque run et station) |
| Onglet Programme de la fiche, publication, PDF | Espace sportif : saisie du réalisé, ressenti, envoi vers une montre |
| Envoi de tous les PDF d'un coup | Envoi automatique semaine par semaine (option, tout à la fin) |
| Zones de FC, % du max, charges officielles Hyrox, phases (réponses du 09/11, §7) | |
| Modèles de programmes et de séances : ceux du coach et ceux de Coory (§7) | |

---

## 7. Questions à trancher avec Antonino (et Gianluca)

1. **Cibles du Running** : allure en min/km et % de VMA suffisent-elles pour le MVP, ou faut-il aussi les zones de FC ?
   **Réponse d'Antonino (09/11/2026) : les deux, indispensables.** Gianluca vise à l'allure pour les sportifs confirmés et en zones de FC pour les débutants qui n'ont pas encore d'allures. Les Repères ont déjà VMA, allures, FC max et FC repos.
2. **Charge en musculation** : kg seulement, ou aussi % du 1RM (il faut alors un 1RM par exercice dans les Repères) ?
   **Réponse (09/11) : les deux, indispensables.** En kg pour les confirmés, en % du max pour les débutants ; en %, l'app affiche les kg calculés si le max est connu (repère « Charge de référence »).
3. **Charges Hyrox par catégorie** : Coory propose-t-il la charge de la catégorie du sportif (Open, Pro, Doubles, Homme ou Femme), à valider par le coach, ou le coach la saisit-il toujours lui-même ?
   **Réponse (09/11) : les deux, indispensables.** Ses propres charges à l'entraînement, les charges officielles de la catégorie pour une vraie simulation. Les valeurs officielles seront à vérifier sur la source HYROX avant d'être codées.
4. **Phases** du programme (base, spécifique, affûtage) : utiles dès le MVP, ou plus tard ?
   **Réponse (09/11) : oui, dans la première version.**
5. **Modèles de séance** fournis par Coory au départ (sortie longue, fractionné, Full Body, simulation Hyrox…) : lesquels Gianluca veut-il voir en premier ?
   **Réponse (09/11) : les deux.** Le coach enregistre ses programmes et séances comme modèles (« Mes modèles »), et Coory fournit aussi quelques modèles de programmes et de séances (« Modèles Coory »). Leur contenu sera écrit avec Gianluca et validé par lui, jamais inventé par l'app.

---

## Sources principales

- Garmin : manuel (webhelp Garmin, création d'entraînement), forums Garmin Connect, guide garmin.vaw.be.
- Campus Coach : campus.coach (plans, programmes), test sur blog.therunningcollective.fr.
- Runna : étude de cas uxdesign.cc, test tomsguide.com, screensdesign.com.
- Fréquence Running : App Store (id1099098734), mac4ever.com, alltricks.fr.
- RoxFit : App Store (id6476465403), roxfit.app/faq, roxfit.app/blog/best-apps-for-hyrox.
- TrainRox : App Store (id6743495052). Centr : centr.com (programme HYROX, phase d'affûtage). TrainingPeaks : plan Hyrox de 14 semaines.
- Hevy : help.hevyapp.com (routines, types de séries, supersets), hevyapp.com/features/workout-set-types.
- Hevy Coach : App Store (id6502961756), g2.com, capterra.
- Alpha Progression : alphaprogression.com (progression, périodisation), App Store, hotelgyms.com.
- TrueCoach : help.truecoach.co (workout builder basics), truecoach.co/blog.
