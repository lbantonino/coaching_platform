# Brief Claude Design · Les programmes de Coory

> **Pour Antonino, avant d'envoyer :** donne à Claude Design ce fichier et les 4 captures du dossier `PAGES-INTERNES-A-REDESIGNER/08-onglet-programme/`. **Ne lui donne aucune image d'exercice RepDB** (captures de la Bibliothèque ou des fiches exercice comprises) : la licence l'interdit. Les illustrations d'exercices sont dessinées en blocs gris dans les maquettes ; l'app mettra les vraies.

---

## 1. Le produit

**Coory** est une application web de coaching sportif pour les **coachs** (téléphone et ordinateur). Premier client : Gianluca, coach de Running, Hyrox et musculation en Belgique. Le coach gère ses sportifs, son agenda, sa comptabilité et, surtout, **crée les programmes d'entraînement de ses sportifs**. C'est le cœur de l'app, et c'est ce que tu dessines ici.

Ce qui existe déjà et que tu ne redessines pas : le menu de gauche, l'en-tête des pages, la barre du téléphone, la fiche d'un sportif (sauf son onglet Programme), la Bibliothèque d'exercices, l'Agenda, les boîtes de dialogue.

## 2. Comment fonctionne un programme (règles métier)

- Un **programme** appartient à **un sportif** : un titre, une discipline principale (Running, Musculation ou Hyrox ; « Hybride » plus tard), une date de début, un nombre de semaines (souvent 8 à 16), un objectif facultatif (ex. une course et sa date).
- Un programme est fait de **semaines**. Chaque semaine contient des **séances numérotées** : Séance 1, Séance 2, Séance 3…
- Les semaines se regroupent en **phases** nommées (ex. Base, Spécifique, Affûtage), et une semaine peut être marquée « allégée ». **Les phases font partie de la première version.**
- **Une séance n'a pas d'heure.** Par défaut, elle n'a pas non plus de jour : le sportif les fait dans l'ordre, quand il veut dans la semaine. En option, un coach peut fixer un jour à chaque séance (lundi, mercredi…).
- Une séance peut être faite **avec le coach** : elle correspond alors à un rendez-vous de l'agenda, qui a une date et une heure.
- Une séance est **structurée**, jamais un grand texte. Elle est faite de **blocs** qui contiennent des **étapes**, avec des répétitions. Il y a un seul modèle, mais **l'éditeur s'adapte à la discipline** :
  - **Running** : des étapes (échauffement, course, récupération, repos, retour au calme) avec une durée ou une distance et une cible, et des blocs « Répéter N fois » (ex. 5 × [2 min vite + 2 min trot]). **Deux façons de viser, toutes deux indispensables** : à l'**allure** (min/km ou % de VMA) pour les sportifs confirmés, à la **zone de fréquence cardiaque** (Z1 à Z5, avec sa plage en bpm) pour les débutants qui n'ont pas encore d'allures. L'effort ressenti reste possible ;
  - **Musculation** : des exercices choisis dans la Bibliothèque, des séries (type : échauffement, normale, dégressive, échec ; répétitions fixes ou en fourchette ; charge **en kg** pour les confirmés **ou en % du max (1RM)** pour les débutants, les deux indispensables ; effort cible RIR ou RPE), un repos, un tempo, des supersets et des circuits ;
  - **Hyrox** : des blocs avec un format (circuit à tours, for time, AMRAP, EMOM, intervalles, simulation de course), des étapes de course (distance, allure), des stations (les 8 stations Hyrox de la Bibliothèque : distance, répétitions, charge ; la charge est **celle du coach** pour l'entraînement, ou **la charge officielle de la catégorie** du sportif pour une vraie simulation, les deux indispensables), des ergomètres (allure en min/500 m), des repos et transitions, un temps cible ou une limite de temps.
- Le programme est d'abord un **brouillon**. « Publier » fige une **version**, que le sportif verra (dans son espace, plus tard) et dont on tire les **PDF**. Modifier un programme publié crée un nouveau brouillon, puis une version 2.
- **Modèles de programmes et de séances**, deux sources dans la première version : « Mes modèles » (le coach enregistre un programme ou une séance comme modèle) et les « Modèles Coory » fournis par l'app. Utiliser un modèle crée une copie ; modifier la copie ne change jamais le modèle ; un modèle Coory se duplique dans « Mes modèles » pour être adapté.
- Le coach **garde toujours la main** : l'app propose (modèles, allures calculées depuis les repères du sportif), le coach corrige et décide.

Ce que Coory reprend des applis de référence (Garmin Connect, Campus Coach, Runna, Fréquence Running, RoxFit, Hevy, Hevy Coach, Alpha Progression, TrueCoach), **l'idée, jamais leur look** :

- La séance « étapes + Répéter » de Garmin.
- Les allures pré-remplies depuis une référence du sportif (Runna).
- Les types de série et le repos par exercice (Hevy).
- Le superset par simple lien entre deux exercices (TrueCoach).
- La simulation Hyrox avec un temps cible par partie de course (RoxFit).
- Partir d'un modèle plutôt que d'une page vide.
- Dupliquer une semaine, puis ajuster.

## 3. Le style de Coory (à respecter)

- **Police unique** : Plus Jakarta Sans (400, 500, 600, 700). **Jamais de police à chasse fixe.**
- **Couleurs** :
  - fond de l'app `#F3F2F7` ; cartes `#FFFFFF` ;
  - texte `#17151D`, secondaire `#64626E`, discret `#8A8896` ;
  - violet `#8B5CF6`, violet texte `#6A3EE0`, lavande `#F1EDFC` : **rares**, réservés à la page active, aux liens, au « maintenant », à l'Assistant IA et à la progression ;
  - action principale : bouton **noir** `#17151D` à texte blanc (blanc en thème sombre) ;
  - contours en ombre intérieure `inset 0 0 0 1px rgba(22,18,40,.06)` pour les cartes, `.12` pour les champs et boutons secondaires ;
  - **couleurs des disciplines**, en pastille de 7 à 8 px ou en petit filet, jamais en grand aplat : Musculation `#DD2D4A`, Hyrox `#FEC14F`, Running `#7776FF`, Hybride `#26CBB8`.
- **Rayons** : 20 px pour les cartes de page, 14 à 16 px pour les cartes internes, 11 px pour les champs de 40 px, 9 px pour les boutons de 32 px, 999 px pour les pastilles.
- **Coquille ordinateur (1 280 px)** :
  - menu de 236 px à gauche, marge de 14 px autour, 20 px entre le menu et le contenu ;
  - en-tête de page en carte de 64 px : icône et titre de la page, puis à droite l'Assistant IA (violet), la cloche et l'action principale (32 px) ;
  - **plus de champ de recherche dans l'en-tête.**
- **Page « à l'intérieur » d'une autre** (règle fixe) : sur ordinateur, le chemin tient sur **une seule ligne** dans l'en-tête, « [icône] ← Page précédente · Page en cours » (ex. « ← Programmes · Prépa Hyrox Gand ») ; sur téléphone, « ← Page précédente » est dans la barre du haut, et le titre de la page est en tête du contenu, 20 px sous la barre.
- **Téléphone (390 px)** :
  - barre du haut : carte ☰ à gauche, nom de la page, et une pilule blanche à droite avec l'Assistant IA et la cloche ;
  - marges de 14 px ;
  - bouton flottant noir « + » en bas à droite pour l'action principale (60 px, rayon 18) ;
  - cibles tactiles de 44 px au moins ; champs en 16 px.
- **Feuilles et menus** :
  - sur téléphone, une feuille qui monte du bas, **flottante à 8 px des bords**, rayon 30, poignée en haut ;
  - sur ordinateur, un menu ancré sous son bouton (256 px, rayon 14) ou une fenêtre centrée ;
  - **ton et langue** : français, le coach est **tutoyé** ; libellés courts, en phrases simples.
- **Pas de graphiques** sur les séances et les programmes (déroulé en barres, courbes d'intensité, camemberts…) : Antonino les juge décoratifs et le « Déroulé de la séance » a été retiré de l'app le 08/11/2026. Les chiffres utiles (durée, distance, nombre de séries) s'écrivent en texte.
- Maquettes en **thème clair**. Le sombre sera dérivé ensuite.

## 4. Les écrans à dessiner

Pour chaque écran : **ordinateur (1 280 px) et téléphone (390 px)**, téléphone d'abord.

### 01 · Page Programmes (`/coach/programmes`, entrée « Programmes » du menu)

- **Liste des programmes de tous les sportifs**, regroupés ou filtrés :
  - par statut : En cours, Brouillons, À venir, Terminés ;
  - par discipline ;
  - par sportif.
- **Carte d'un programme** :
  - la photo et le nom du sportif ;
  - le titre du programme ;
  - la pastille de discipline ;
  - la période (26 oct. → 17 janv.) ;
  - « Semaine 3 / 12 » ;
  - la progression des séances faites (ex. 9 / 48) ;
  - le statut (Brouillon, Publié v2) ;
  - l'objectif s'il y en a un (« HYROX Gand · 13 déc. »).
- **Deux onglets** : « Programmes » et « Modèles ». Dans « Modèles » : filtres (Coory ou Mes modèles, discipline, programme ou séance) ; carte de modèle (nom, discipline, nombre de semaines ou durée, séances par semaine, badge « Coory ») ; état vide de « Mes modèles » qui explique comment en créer un.
- **Action principale** « Créer un programme » : bouton noir dans l'en-tête sur ordinateur, bouton flottant « + » sur téléphone.
- **États** : la liste remplie, la liste vide (aucun programme : une invitation claire à en créer un), une recherche ou un filtre sans résultat.

### 02 · Créer un programme (assistant en 4 étapes)

On y arrive depuis la page Programmes ou depuis la fiche d'un sportif ; dans ce cas, le sportif est déjà choisi.

1. **Pour qui** : choisir le sportif (liste avec recherche), titre du programme.
2. **Objectif** : discipline principale (Running, Musculation, Hyrox), objectif facultatif (course, date, catégorie Hyrox), note ; et la **façon de viser par défaut** : allure ou zones de FC (Running), kg ou % du max (Musculation), pré-choisie d'après les repères du sportif et modifiable ensuite, séance par séance et étape par étape.
3. **Calendrier** : date de début, nombre de semaines, séances par semaine (de 1 à 7, le plus souvent 2 à 5), et le choix « Dans l'ordre, sans jour » (par défaut) ou « Un jour fixe par séance » (choisir les jours) ; puis les **phases** (nom et semaines de chacune), qu'on peut aussi poser plus tard dans l'éditeur.
4. **Point de départ** : partir de zéro, copier un programme précédent du sportif, ou **partir d'un modèle** (Mes modèles ou Modèles Coory). Puis un **aperçu** (12 semaines × 4 séances) et le bouton « Créer le brouillon ».

À proposer : une page avec ses étapes sur ordinateur (chemin « ← Programmes · Nouveau programme »), plein écran sur téléphone (étapes en haut, boutons « Retour » et « Continuer » en bas).

### 03 · Éditeur de programme (le programme d'un sportif)

- **En-tête** : sportif, titre, période, statut (Brouillon, Publié v1), et les actions **Aperçu**, **Publier**, **PDF** (et ••• : renommer, dupliquer, enregistrer comme modèle, archiver, supprimer).
- **Ordinateur** : les semaines à gauche (Semaine 1 à 12, regroupées sous leurs phases « Base », « Spécifique », « Affûtage », pastille « allégée »), les séances de la semaine choisie au centre, la séance ouverte à droite (résumé ou éditeur).
- **Téléphone** : une pile.
  - D'abord la liste des semaines : chaque semaine en carte, avec ses séances numérotées en résumé.
  - Puis une semaine et ses séances.
  - Puis une séance.
- **Carte de séance** :
  - « Séance 2 » ;
  - la pastille de discipline et le titre (« Endurance rapide ») ;
  - un résumé (« 5 × 2 min · 50 min ») ;
  - le jour s'il y en a un ;
  - « Avec le coach » si c'est un rendez-vous.
- **Gestes** :
  - ajouter une séance, vide ou **depuis un modèle de séance** (feuille sur téléphone, panneau sur ordinateur) ;
  - dupliquer une séance ou **une semaine vers d'autres semaines** (feuille ou menu pour choisir les semaines) ;
  - changer l'ordre (boutons monter et descendre ; glisser-déposer en plus sur ordinateur) ;
  - créer, renommer ou supprimer une phase, et changer ses semaines ;
  - marquer une semaine « allégée » ;
  - supprimer, avec confirmation.
- **États** : programme vide juste créé (des semaines avec des séances « À remplir »), programme rempli, brouillon d'un programme déjà publié (« Modifications non publiées »).

### 04 · Éditeur de séance Running

- **En-tête de séance** : titre, type (Endurance, Fractionné, Sortie longue, Tempo, Récupération…), objectif, conseil du coach.
- **Liste verticale des étapes**, colorées selon leur rôle :
  - **effort** en couleur de la discipline ;
  - **récupération** en gris ;
  - **bloc « Répéter N fois »** en encadré, avec ses étapes dedans.
- **Chaque étape** : type, mesure (durée **ou** distance **ou** « libre »), cible (plage d'allure « 5:00 – 5:10 min/km », % de VMA, **zone de FC « Z2 · 128-142 bpm »**, effort ressenti, ou aucune), note. Le choix entre allure et zone de FC doit être simple et visible, pas caché dans un menu.
- **Modifier une étape** : feuille sur téléphone, panneau à droite sur ordinateur, avec de grands champs et le bon clavier.
- **Pré-rempli** : échauffement et retour au calme déjà posés ; les allures et les zones de FC sont proposées à partir des repères du sportif (« Calculée depuis la VMA d'Inès : 16 km/h », « Calculée depuis la FC max de Noah : 192 bpm »), toujours modifiables. Sans repère, le coach écrit la valeur lui-même.
- **Résumé calculé en direct** : « 5 × (2 min + 2 min) », la durée et la distance totales estimées, en texte. **Pas de graphique** (voir la règle « Pas de graphiques » plus haut).
- **Exemples** :
  - à l'allure (Inès, confirmée) : « Endurance rapide » = 15 min d'échauffement à 6:15 min/km, puis 5 × (2 min à 5:00 min/km + 2 min de trot), puis 10 min de retour au calme ;
  - en zones de FC (Noah, débutant) : « Footing progressif » = 10 min en zone 1, puis 4 × (3 min en zone 3 + 2 min en zone 1), puis 10 min en zone 2.

### 05 · Éditeur de séance Musculation

- **En-tête** : titre (« Full Body A »), échauffement et retour au calme en texte libre, conseil du coach.
- **Liste des exercices** dans l'ordre : vignette (**bloc gris**, pas d'image RepDB), nom, résumé « 3 × 8-10 · 14 kg · RIR 2 · repos 90 s ».
- **Ajouter un exercice** : feuille sur téléphone, panneau sur ordinateur ; recherche dans la Bibliothèque (français ou anglais), filtres Catégorie, Muscles et Matériel, favoris, « Mes exercices ».
- **Régler les séries** d'un exercice : une ligne par série (type, répétitions fixes ou en fourchette, charge **en kg ou en % du max**, RIR ou RPE). En %, l'app écrit à côté les kg calculés quand le max du sportif est connu (« 70 % · ≈ 56 kg »). Le choix entre kg et % se fait par exercice. Une saisie rapide « 3 séries de 8 à 10 » remplit tout d'un coup, puis on ajuste une ligne. Repos, tempo (« 3-1-1-0 ») et consigne de l'exercice.
- **Supersets et circuits** : relier deux exercices ou plus (un lien visible entre les cartes), avec un nombre de tours et un repos en fin de tour. Formats EMOM et AMRAP (ex. « EMOM 6 min : 20 s de pompes, 40 s de repos »).
- **Exemple** :
  - Bulgarian split squat 3 × 8-10 à 14 kg, RIR 2 ;
  - Tirage vertical 3 × 10-12 ;
  - superset Pompes + Tirage bûcheron unilatéral ;
  - Leg curl assis en pyramide 20-15-10-8 ;
  - pour un débutant : Squat goblet 3 × 10 à 60 % du max ;
  - EMOM pompes 6 min.

### 06 · Éditeur de séance Hyrox

- **Blocs avec un format** : Circuit (N tours), For time, AMRAP (durée), EMOM, Intervalles, **Simulation de course**. Chaque bloc a son nombre de tours, sa limite de temps (time cap), son temps cible et son repos entre tours.
- **Étapes d'un bloc** :
  - **Run** : distance et allure en min/km ;
  - **Station** : une des 8 stations de la Bibliothèque, avec distance, répétitions et charge ; la charge est **libre** (celle du coach) ou **officielle** (celle de la catégorie du sportif, remplie par l'app) ; pastille Hyrox jaune ;
  - **Ergomètre** : SkiErg ou rameur, distance et allure en **min/500 m**, jamais confondue avec l'allure de course ;
  - **Repos** ou **transition** ;
  - **exercice de force**.
- **Simulation de course** : modèle prêt avec les 8 runs de 1 km et les 8 stations dans l'ordre officiel. Un **temps cible pour chaque partie**, puis le total. Un choix « Charges officielles · Open Femme » (la catégorie du sportif) ou « Mes charges » remplit toutes les stations d'un coup. Le coach corrige chaque ligne. Dans la maquette, les charges sont fictives : l'app mettra les valeurs officielles.
- **Exemple** :
  - échauffement : run 1 000 m ;
  - 5 tours de run 600 m à 5:45 min/km + 25 m de sled push ;
  - AMRAP 25 min : 12 burpee broad jumps, 40 m de sandbag lunges, 15 wall balls à 6 kg ;
  - limite de temps 60 min.

### 07 · Onglet « Programme » de la fiche d'un sportif

Captures de l'état actuel, à redessiner : `08-onglet-programme/` (avec et sans programme, ordinateur et téléphone).

- **Avec un programme** :
  - le résumé : titre, période, « Semaine 3 / 12 », séances faites / total, version publiée ;
  - **la semaine en cours** : ses séances numérotées, avec leur état (Faite, À faire, Pas faite) et, si le sportif l'a donné, son ressenti ;
  - un accès aux autres semaines ;
  - les boutons « Ouvrir l'éditeur » et « PDF ».
- **Sans programme** : un état vide qui invite à « Créer un programme » (l'assistant s'ouvre avec ce sportif choisi).
- Les onglets de la fiche et son en-tête restent ceux de l'app ; tu ne dessines que le contenu de l'onglet.

### 08 · Publier

- Une fenêtre de confirmation :
  - le résumé (12 semaines, 48 séances) ;
  - les avertissements (« 2 séances sont encore à remplir », bloquant ou non) ;
  - la version créée (« Version 2 ») ;
  - les boutons « Annuler » et « Publier ».
- Après publication, un message court « Programme publié (version 2) ».

### 10 · Modèle ouvert (l'écran 03 en mode modèle, pas un nouvel écran)

- Le même éditeur que l'écran 03, sans sportif ni dates : Semaine 1 à N, phases et séances. Chemin « ← Modèles · Prépa Hyrox ».
- Une séance s'enregistre aussi comme modèle depuis les éditeurs de séance (04 à 06).
- Un modèle Coory s'ouvre en lecture seule, avec « Dupliquer dans Mes modèles ».
- Exemples de Modèles Coory : programmes « Premier 10 km · 8 semaines », « Prépa Hyrox · 12 semaines », « Force débutant · 8 semaines » ; séances « Sortie longue », « Fractionné 30/30 », « Endurance en zone 2 », « Full Body A », « Simulation Hyrox complète ».

### 09 · Les PDF (A4 portrait)

- **Programme** : en-tête (logo Coory, sportif, titre, période, objectif), puis semaine par semaine. Chaque séance numérotée a son type, sa durée, ses blocs et étapes **en entier** (allures, séries, charges, repos, conseils). Pied de page avec la version et la date.
- **Agenda** : le calendrier du sportif sur la période. Chaque semaine liste ses séances de programme (et leur jour s'il y en a un), les rendez-vous avec le coach (date et heure) et les compétitions.
- Lisible imprimé en noir et blanc ; la couleur ne doit jamais être la seule information.

## 5. Données d'exemple (inventées)

- **Sportive** : Inès Ben Ali.
  - Programme : « Prépa HYROX Gand ».
  - Objectif : HYROX Gand, 13 déc. 2026, catégorie Open Femme.
  - 12 semaines dès le 26 oct., 4 séances par semaine : Sortie longue, Endurance rapide, Race pace, Circuit Hyrox.
- **Sportif** : Lucas Janssens, programme « Force bloc 1 » en Musculation, 8 semaines, 3 séances (Full Body A, B, C), charges en kg.
- **Sportif débutant** : Noah Dubois, programme « Premier 10 km », 8 semaines, 3 séances, cibles en zones de FC (FC max 192 bpm) et renforcement en % du max.
- **Sportive** : Sophie Lambert, programme « Renforcement bloc 1 » en Musculation, publié, version 1.
- **Coach** : Julien Mertens.

N'emploie que des noms inventés, jamais de vraies personnes.

## 6. Ce que j'attends en retour

Le même format que tes livraisons précédentes de Coory (Bibliothèque, pages d'erreur), qui ont très bien fonctionné :

- `README.md` (les écrans et leur ordre de lecture), `IMPLEMENTATION_GUIDE.md`, `DESIGN_SYSTEM.md` ;
- `01_DESIGN_TOKENS/`, `02_COMPONENTS/` (chaque nouveau composant avec ses mesures exactes : carte de séance, étape, bloc Répéter, ligne de série, lien de superset, sélecteur de semaines) ;
- `03_PAGES/<écran>/` avec `desktop.html`, `mobile.html` (styles exacts), `desktop.png`, `mobile.png` (captures 2×), `SPECIFICATIONS.md`, `INTERACTIONS.md` ;
- `07_VALIDATION/missing-information.md` : ce que tu n'as pas dessiné ou ce que tu proposes ;
- **statut de chaque valeur** : EXACT (dans le code de la maquette), MEASURED, ESTIMATED, ou PROPOSED (non dessiné, à valider) ;
- les **états** : vide, rempli, erreur de saisie, et aussi survol et focus si tu les dessines.

Ordre de priorité si tu dois découper : 04, 05 et 06 (les éditeurs de séance, le plus important), puis 03, 07, 02 et 01, puis 10, et enfin 08 et 09.
