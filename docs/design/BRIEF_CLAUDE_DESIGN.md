# Coory : brief de design complet (pour Claude Design)

> Document à donner à Claude Design avec les fichiers joints listés en fin de page.
> Objectif : dessiner **l'application entière, toutes les pages**, **en commençant par le téléphone**.
>
> **Important : aucune page grisée, aucun état « Bientôt ».** Chaque module (programmes, séances,
> bibliothèque, facturation, comptabilité, documents, messages, tâches, espace sportif, admin…) est
> à dessiner **complet et fonctionnel en apparence**, avec des données d'exemple réalistes, comme si
> l'app était terminée. La distinction « déjà codé / pas encore codé » de ce brief sert seulement à
> savoir quels contenus et champs sont déjà fixés par le code.

---

## 1. Le produit en bref

**Coory** est une application web de coaching sportif (SaaS). Un coach indépendant y gère ses
sportifs, leur prépare des programmes d'entraînement (running, musculation, Hyrox, hybride),
organise son agenda et, plus tard, sa facturation. Le sportif y consulte son programme, surtout
**sur son téléphone, à la salle ou sur la piste**, et renvoie ses retours.

- Langue de l'interface : **français** (tutoiement côté sportif, ton factuel côté coach).
- Utilisateur réel de référence : un coach à Bruxelles (Gianluca), qui encadre par exemple une
  séance collective « Behybrid on Tracks » tous les mercredis à 19 h au Parc de Woluwe / Merode.
- Pas de page vitrine : l'arrivée sur Coory se fait directement sur la **connexion** ou
  l'**inscription**.

### Trois rôles

| Rôle | Ce qu'il fait | Appareil principal |
| --- | --- | --- |
| **Coach** (propriétaire de son organisation) | Gère ses sportifs, programmes, agenda, séances, documents, plus tard factures | Ordinateur **et** téléphone (tout doit être faisable sur téléphone) |
| **Sportif** | Consulte sa séance du jour, son programme, sa progression ; envoie ses retours | **Téléphone** avant tout |
| **Admin plateforme** | Supervise organisations et comptes | Ordinateur |

---

## 2. Règle n°1 : MOBILE FIRST

- Chaque page se dessine **d'abord à 390 px de large** (iPhone), puis en tablette, puis en
  ordinateur (1440 px).
- Tester aussi la lisibilité à **360 px** et **320 px** : aucun défilement horizontal de la page
  (seuls des carrousels ou agendas assumés peuvent défiler horizontalement à l'intérieur d'une zone).
- Zones tactiles **≥ 44 × 44 px**, texte courant **≥ 16 px** côté sportif.
- Sur téléphone, le coach n'a **pas de barre d'onglets en bas** : un **menu hamburger** en haut
  (panneau plein écran ou latéral). En-tête de page centré.
- Le mobile n'est pas un rétrécissement du bureau : listes à la place des tableaux, cartes
  empilées, feuilles du bas (bottom sheets) pour les choix, boutons monter / descendre à la place du
  glisser-déposer.
- Sportif : la séance du jour est atteignable **en 2 actions maximum** depuis l'accueil.

---

## 3. Identité visuelle (déjà fixée)

Sources de vérité jointes : `COORY_DESIGN_SYSTEM.md` et `COORY_LOGO.md`. Résumé :

### Principes
1. **Sombre par défaut**, thème clair disponible (les deux sont à dessiner).
2. **Un seul accent, utilisé rarement** : rouge `#FF3347`. **Un seul bouton rouge par écran**
   (l'action principale).
3. **Plat** : pas de dégradé, pas de lueur, pas de verre dépoli, pas d'ombre sur les cartes.
4. **Bordures fines plutôt qu'ombres** : carte = surface + filet de 1 px.
5. **Les chiffres d'abord** : grands nombres, valeurs en police mono, unités en gris.
6. **Pas d'emoji.** Glyphes autorisés : → ↗ ✓ ⌘K · ♀ ♂.

### Couleurs du thème sombre (bleu nuit, mesurées sur les maquettes)
| Jeton | Valeur | Usage |
| --- | --- | --- |
| `--page` | `#070b12` | fond extérieur |
| `--bg` | `#0b1019` | fond de l'app |
| `--surface` | `#121821` | cartes |
| `--surface-2` | `#1a2331` | cartes imbriquées, survol |
| `--chip` | `#243044` | pastilles |
| `--bar` | `#2b3648` | barres de progression vides |
| `--text` | `#f1f4f8` | texte |
| `--muted` | `#9ba6b5` | texte secondaire |
| `--faint` | `#97a2b2` | texte tertiaire |
| `--accent` | `#ff3347` | bouton principal, élément actif |
| `--accent-text` | `#ff6b79` | texte rouge sur fond sombre |

### Thème clair (après audit de contraste)
Texte secondaire `#5d5d64`, tertiaire `#62626a`, accent `#d91f34`, texte rouge `#bb1529`,
vert « ok » `#166534`, orange « attention » `#8a4b06`, ambre `#924207`.
**Tout texte doit atteindre un contraste ≥ 4,5:1** dans les deux thèmes.

### Couleurs de sens
- **Disciplines** : Running = bleu, Musculation = violet, Hyrox = orange, Hybride = sarcelle (teal).
  Toujours accompagnées d'un libellé (jamais la couleur seule).
- **Sexe** : couleur femme / couleur homme + symbole ♀ / ♂ (« Non précisé » : neutre).
- **Teintes** : les cartes chiffrées et l'élément de menu actif sont teintés (fond coloré léger,
  plus marqué en thème clair pour rester lisible).

### Typographie
- Titres : **Space Grotesk** · Texte : **Geist** · Chiffres et heures : **Geist Mono**.
- Format français : `6 240 €`, `102,5 kg`, `4×8`, `09:30`, `5:00/km`, séparateur ` · `,
  guillemets « ».

### Icônes
Lucide, contour fin, monochromes.

### Logo
`C∞ry` : le double « o » remplacé par une boucle d'infini rouge. Détails et SVG dans
`COORY_LOGO.md`.

---

## 4. Structure commune de l'espace coach

### Menu (ordinateur : colonne latérale)
- **Principal** : Tableau de bord · Sportifs · Programmes · Agenda · Séances · Facturation ·
  Comptabilité · Bibliothèque.
- **Secondaire (en bas)** : Tâches · Documents · Messages · Paramètres.
- **Carte du coach** tout en bas : photo, prénom nom, « Coach ».
- Élément actif sur fond rouge teinté.
- Tous les modules sont actifs et cliquables dans les maquettes (pas de badge « Bientôt »).

### Menu (téléphone)
Barre du haut : logo, titre de la page centré, bouton hamburger. Le hamburger ouvre le même menu
(principal + secondaire + carte du coach + déconnexion).

### En-tête de page (ordinateur)
Titre (H1) + phrase d'explication ; à droite : champ « Rechercher dans Coory… », cloche des
notifications, **bouton rouge d'action principale**.

### Motifs récurrents (voir les maquettes)
- **Quatre cartes chiffrées** en haut de page (grand chiffre + libellé + précision), chacune teintée.
  Sur téléphone : grille 2 × 2 ou carrousel horizontal.
- **Carte principale** : titre, sous-titre, filtres en pastilles, recherche, tableau (ordinateur)
  ou liste de cartes (téléphone), menu « ••• ».

---

## 5. Règles de contenu à respecter dans les maquettes

1. **Données d'exemple réalistes partout** : noms fictifs, valeurs plausibles (allures, charges,
   montants en euros, dates). Toutes les pages sont remplies, aucune n'est grisée.
2. **« Aucune donnée » plutôt que 0** quand une statistique n'a pas assez de mesures.
3. Toute valeur a son **unité** (km, min, kg, /km, bpm, RPE).
4. Chaque écran a ses états : **vide**, **chargement**, **erreur**, **succès**.
5. Les champs facultatifs portent la mention **« (facultatif) »** en italique.
6. Les erreurs de formulaire s'affichent **sous le champ concerné**.
7. Les actions destructrices demandent une confirmation.

---

## 6. Pages déjà codées (contenus fixés, à redessiner)

Ces pages fonctionnent déjà. Le design doit garder **exactement ces contenus et champs**.

### 6.1 Entrée dans l'app

Le cahier détaillé de ces deux pages est joint : `COORY_AUTH_PAGES.md`.

**Connexion** (`/login`)
- Ordinateur : deux colonnes (visuel de marque à gauche, formulaire à droite). Téléphone : une
  colonne, logo en haut.
- Titre « Bon retour. ».
- Champs : Adresse e-mail · Mot de passe (icône œil / œil barré pour afficher ou masquer).
- Lien « Mot de passe oublié ? ».
- Bouton « Se connecter → ».
- Boutons Google / Facebook / Apple **préparés mais cachés** pour l'instant (à dessiner quand même,
  état « visible »).
- Lien « Créer un compte ».

**Inscription** (`/inscription`)
- Choix du type de compte : **Coach** ou **Sportif** (deux grandes cartes radio).
- Champs : Prénom · Nom · Adresse e-mail · Téléphone *(facultatif)* · Nom de l'entreprise *(facultatif,
  coach seulement)* · Mot de passe (œil + **jauge de robustesse**).
- Case à cocher : « J'accepte les conditions d'utilisation et la politique de confidentialité »
  (liens).
- Bouton « Créer mon compte → ». Lien « Déjà un compte ? Se connecter ».
- Après envoi : écran « Vérifie ta boîte mail » (un e-mail de confirmation est envoyé).

**Autres pages d'entrée**
- **Bienvenue** (`/bienvenue`) : après confirmation de l'e-mail, finalise le compte. Coach : son
  espace est créé. Sportif : message « Ton coach te rattachera à son espace par une invitation ».
- **Mot de passe oublié** : champ e-mail, bouton « Recevoir le lien ».
- **Nouveau mot de passe** : nouveau mot de passe + jauge.
- **Invitation** (`/invitation/[jeton]`) : le sportif invité par son coach crée son mot de passe
  (nom du coach et de l'organisation affichés).
- **Lien invalide ou expiré**, **Accès refusé** : pages d'erreur simples avec un chemin de retour.
- **Conditions d'utilisation**, **Politique de confidentialité**, **Mentions légales** : pages de
  lecture longue (texte provisoire), très lisibles sur téléphone.

### 6.2 Tableau de bord coach (`/coach`)
Modèle : `maquettes/tableau-de-bord.png` (déjà construit à son image).
- « Bonjour {prénom} », période, bouton rouge **« Créer »** qui ouvre un menu : Programme, Séance,
  Sportif, Facture, Tâche.
- Cartes chiffrées : coachings de la semaine · sportifs actifs · programmes à livrer · factures en
  attente.
- **Agenda** avec vues Semaine / Mois / Aujourd'hui :
  - ordinateur : grille 7 jours, heures en colonne gauche, séances en blocs colorés par discipline ;
  - **téléphone : 3 jours visibles, défilement horizontal, positionné sur aujourd'hui** ; « Mois »
    affiche une grille du mois ; « Aujourd'hui » une seule colonne.
- Tâches prioritaires · Revenus du mois (montant, évolution vs mois précédent, mini-graphique) ·
  Sportifs récents · Programmes en cours (barre « Semaine 6/12 ») · Factures récentes (n°, client,
  montant, statut). Toutes ces cartes remplies avec des données d'exemple.

### 6.3 Sportifs : liste (`/coach/o/[org]/sportifs`)
- Titre « Sportifs », bouton rouge « Nouveau sportif ».
- Filtres : statut (Actif / En pause / Archivé) et discipline ; recherche par nom.
- Chaque ligne : photo ou initiales, nom, symbole ♀/♂, discipline(s), niveau, statut, objectif
  principal, prochaine compétition.
- Téléphone : liste de cartes.
- État vide : « Ajoute ton premier sportif ».

### 6.4 Nouveau sportif / modification
Champs exacts :
- Nom complet · Sexe (Femme / Homme / Non précisé) · Adresse e-mail *(facultatif)* · Téléphone
  *(facultatif)* · Canal préféré (E-mail / Appel / SMS / WhatsApp).
- Niveau (Débutant / Intermédiaire / Confirmé / Compétiteur) · Expérience.
- Disciplines (Running, Musculation, Hyrox, Hybride).
- Objectif principal · Prochaine compétition.
- Lieux d'entraînement (Salle de sport, Extérieur (route, trail), Piste d'athlétisme, Domicile,
  Box Hyrox / CrossFit) · Matériel disponible.
- Contraintes physiques (donnée de santé, demande un accord, voir 6.6) · Contraintes d'organisation.
- Statut (Actif / En pause / Archivé).

### 6.5 Fiche sportif (`/coach/o/[org]/sportifs/[id]`)
Modèle : `maquettes/fiche-sportif.png`.
- **En-tête** : photo, nom, ♀/♂, statut, niveau ; boutons « Inviter dans son espace » et
  « Créer un programme » (le rouge = action principale).
- **Cinq chiffres clés.**
- **Onglets** (sur téléphone : pastilles défilantes) :
  1. **Vue d'ensemble** : profil résumé, objectif actuel avec phases (Préparation → Compétition),
     disponibilités, repères et évolution, notes, historique récent.
  2. **Profil** : tous les champs de 6.4 ; bloc **accord santé** (voir 6.6).
  3. **Objectifs** : objectifs en cours et passés. Champs : type (Course 5 km, Course 10 km,
     Semi-marathon, Marathon, Autre course, Hyrox, Force, Composition corporelle, Remise en forme /
     santé, Objectif personnel), catégorie Hyrox (Open, Pro, Doubles, Relay), date, temps visé,
     priorité (Principal / Secondaire), statut (En cours / Atteint / Abandonné). Badge coloré par
     discipline.
  4. **Disponibilités** : jours disponibles (Lundi → Dimanche), séances / semaine, durée max /
     séance, lieu, remarques.
  5. **Repères** : tuiles des repères actuels + **graphique d'évolution** + historique. Types :
     VMA, Endurance (zone 2), Tempo, Seuil, Allure 5 km, Allure 10 km, Allure semi-marathon, Allure
     marathon, Race pace (Hyrox), FC max, FC repos, Charge de référence. Source : Test / Constaté /
     Estimation coach. Un **calculateur de test** aide à convertir (ex. temps sur une distance →
     allure). Plus les **records personnels** (5 km, 10 km, Semi, Marathon, Hyrox + catégorie) avec
     historique et meilleur temps mis en avant.
  6. **Notes** : notes privées du coach, datées.
  7. **Historique** : journal des événements de la fiche (création, modifications, invitation…).

### 6.6 Accord santé (dans la fiche et chez le sportif)
Les contraintes physiques sont une donnée de santé : elles ne s'enregistrent qu'avec l'accord du
sportif. Le coach note la preuve (Oral / Par écrit / Formulaire signé) ; l'historique de l'accord est
visible. Côté sportif, une carte lui permet de donner ou retirer son accord.

### 6.7 Inviter un sportif (`…/sportifs/[id]/inviter`)
Le coach génère un **lien d'invitation personnel** (bouton « Créer le lien »), affiché **une seule
fois** avec un bouton « Copier le lien », puis l'envoie lui-même au sportif (WhatsApp, e-mail…).
États : aucune invitation, invitation en attente (avec date d'expiration), acceptée, expirée.

### 6.8 Agenda (`/coach/o/[org]/agenda`)
Modèle : `maquettes/agenda.png` (refonte visuelle à faire).
- Contient les **séances encadrées** du coach : **collectives** (ex. Behybrid on Tracks, mercredi
  19 h) ou **individuelles**, ponctuelles ou **récurrentes chaque semaine**, avec liste d'inscrits.
- Calque optionnel : **compétitions** des sportifs (issues de leurs objectifs).
- Vues Semaine / Jour / Mois / Aujourd'hui ; navigation « Semaine du … » ; filtres.
- Téléphone : même logique que le tableau de bord (3 jours défilants, ou liste du jour).
- **Nouvelle séance / Modifier** : type (Collective / Individuelle), titre, discipline, date,
  heure, durée, case « Chaque semaine » + date de fin, lieu (« Ex. : Piste d'athlétisme, salle,
  parc »), sportif (individuelle) ou sportifs inscrits en pastilles cochables (collective), note du
  coach (« Ex. : prévoir chronos et plots »).
- **Détail d'une séance** : quand, lieu, discipline, inscrits (avatars), prochaines dates si
  récurrente, actions Modifier / Supprimer.

### 6.9 Paramètres (`/coach/profil`)
Modèle : `maquettes/parametres.png`.
Page complète, tous les blocs à dessiner :
- **Profil et entreprise** : photo de profil (import, recadrage carré, suppression), prénom, nom,
  entreprise, téléphone, nom de l'organisation.
- **Préférences et notifications** : thème sombre / clair, langue, notifications (nouveau retour,
  message, rappel de séance) par canal.
- **Facturation et informations légales** : raison sociale, adresse, n° d'entreprise / TVA, IBAN,
  mentions sur les factures, numérotation.
- **Sécurité et accès** : e-mail, mot de passe, connexions Google / Facebook / Apple, appareils
  connectés, déconnexion partout.
- **Abonnement** : formule, prochaine échéance, historique.

### 6.10 Espace sportif et administration
Seuls quelques morceaux existent (écran d'attente « Ton coach prépare ton programme », carte
d'accord santé). Ils sont à dessiner **dans l'espace sportif complet** (section 7.2) ; de même
l'administration est entièrement décrite en 7.3.

---

## 7. Pages pas encore codées (à dessiner tout aussi complètes)

Les maquettes jointes donnent l'apparence voulue côté ordinateur. **Il manque leur version
téléphone** : c'est la priorité.

### 7.1 Espace coach

**Bibliothèque** (`maquettes/bibliotheque.png`, phase P3)
- Cartes : exercices, modèles de séance, blocs, semaines types.
- Grille filtrable (Tous / Running / Musculation / Hyrox / Hybride) + recherche ; vignette colorée
  par discipline, titre (« Running · Sortie longue »), bouton « Ouvrir le modèle ».
- Fiche exercice : nom, discipline, groupe musculaire ou type, matériel, variantes, consignes.
- Bouton rouge « Ajouter un modèle ».

**Programmes : liste** (`maquettes/programmes.png`, P4)
- Cartes : actifs, à livrer, modèles réutilisables, % de séances réalisées.
- Tableau / liste : sportif, programme (« Plan Hybride · 12 semaines », séances / semaine),
  discipline, progression « Semaine 6/12 », statut (Brouillon / Publié / Archivé).

**Programmes : assistant de création** (5 étapes)
1. Sportif existant ou nouveau. 2. Objectifs, discipline dominante, notes. 3. Date de début,
nombre de semaines (1 à 52), séances par semaine (1 à 14), jours. 4. Point de départ : vierge,
semaine type, programme précédent du sportif, modèle. 5. Aperçu de la structure → création en
brouillon.

**Éditeur de programme** (cœur du produit)
- Ordinateur : **trois panneaux**. Gauche : semaines 1..N groupées par phase. Centre : séances de
  la semaine (jour, type, durée estimée, statut). Droite : inspecteur de la séance ou du bloc
  sélectionné. Bandeau haut : sportif, objectif, période, statut, « Enregistré », Aperçu, Publier,
  PDF.
- **Téléphone : navigation en pile** Programme → Semaine → Séance → Blocs → Paramètres, fil
  d'Ariane, bouton +, sauvegarde toujours visible, feuilles du bas pour choisir, boutons monter /
  descendre, clavier numérique adapté.
- Actions : dupliquer une semaine sur une ou plusieurs semaines, insérer un modèle, remplacer un
  exercice, comparer S1 / S2.

**Éditeur de séance** selon la discipline
- **Running** : segments (Échauffement, Continu, Effort, Récupération, Retour au calme, Éducatifs,
  Côtes, Marche) avec durée ou distance, cible (allure /km, FC, zone, RPE, vitesse), terrain (Route,
  Piste, Tapis, Trail, Pente). Répétitions affichées comme `5 × (2 min @ 5:00/km + 2 min récup)`.
  Ordinateur : frise colorée de la séance. Téléphone : cartes accordéon.
- **Musculation** : exercices avec séries × répétitions, charge (kg ou % de référence), repos, RPE,
  tempo ; supersets et circuits (lettres A1 / A2). Ordinateur : grille. Téléphone : cartes par
  exercice.
- **Hyrox / Hybride** : circuits en « Bloc 1 », « Tour 1/3 », stations (Sled Push 25 m, SkiErg
  1000 m, Wall Balls…) mélangées à des runs.

**Aperçu, versions et publication** : vue « comme le sportif la verra », vérifications avant
publication (séances incomplètes), historique des versions, badge « Nouvelle version ».

**PDF du programme** : prévisualisation, options, téléchargement, envoi par e-mail.

**Séances** (`maquettes/seances.png`, P3 puis P5–P6)
- Cartes : séances aujourd'hui, retours reçus, séances restantes, séance à adapter.
- Planning (Aujourd'hui / À venir / Terminées / En attente de retour) : heure, sportif, type,
  statut. Panneau détail : blocs, retour du sportif (RPE, ressenti, commentaire), « Ouvrir
  l'éditeur de séance ».

**Retours des sportifs** : liste des séances terminées avec RPE, difficulté, commentaire,
**Prescrit vs Réalisé**.

**Documents** (`maquettes/documents.png`)
- Cartes : documents, programmes PDF, factures, récents.
- Liste filtrable (Tous / Programmes / Factures / Contrats / Autres) : document, catégorie, sportif
  associé, dernière modification, actions (ouvrir, télécharger, supprimer).
- Accès rapide ; bouton rouge « Importer un fichier » (nom, catégorie, sportif associé) ;
  aperçu d'un PDF.

**Messages** (`maquettes/messages.png`)
- Liste des conversations (recherche, avatar, nom, dernier message, non lus) et conversation
  sélectionnée (sportif, programme en cours, fil, pièce jointe, « Écrire un message… »).
- Téléphone : la liste, puis la conversation en plein écran. Bouton « Nouveau message ».

**Tâches** (`maquettes/taches.png`)
- Cartes : ouvertes, urgentes, programmes, terminées.
- Liste (Toutes / Aujourd'hui / À venir / Terminées) : case à cocher, tâche, associée à (Programme,
  Facturation, Paiement, Suivi, Agenda), échéance, priorité (Haute / Normale), statut.
- Création d'une tâche : titre, échéance, priorité, élément associé.

**Facturation** (`maquettes/facturation.png`)
- Cartes : encaissé ce mois, en attente, en retard, factures à préparer.
- Liste (Toutes / Brouillons / À envoyer / En attente / Payées / En retard) : n° FAC-2026-014,
  client, date, montant, statut.
- **Créer une facture** : sportif, prestations (ligne, quantité, prix unitaire, TVA), échéance,
  notes, total. **Détail / aperçu de facture** prêt à envoyer en PDF. Paiements et relances.
- Pas de paiement en ligne via Coory : le coach marque la facture comme payée.

**Comptabilité** (`maquettes/comptabilite.png`)
- Cartes : chiffre d'affaires, dépenses, résultat estimé, factures impayées.
- Histogramme du chiffre d'affaires sur 12 mois, anneau de répartition des dépenses (location
  salle, matériel, services, autres), mouvements récents (date, libellé, Revenu / Dépense,
  montant), ajout d'une dépense.
- Mention discrète : « Vue de gestion, pas une comptabilité légale certifiée ».

**Notifications** (cloche) : panneau avec nouveaux retours, messages, invitations acceptées,
factures en retard, tâches du jour.

**Recherche globale** (« Rechercher dans Coory… ») : résultats groupés par sportifs, programmes,
séances, documents.

**Assistant IA** : une fenêtre de discussion où le coach écrit
« Crée Valentin Dupont, musculation, dispo mardi, mercredi, jeudi 19 h » et l'assistant **propose
les actions**, que le coach **valide** avant exécution.

### 7.2 Espace sportif (priorité téléphone)

Navigation téléphone (barre du bas) : **Aujourd'hui · Programme · Progression · Messages · Profil**.
Ordinateur (colonne latérale) : Tableau de bord, Mon programme, Calendrier, Historique, Progression,
Documents, Messages, Paramètres.

| Écran | Contenu |
| --- | --- |
| **Aujourd'hui** | « Salut {prénom} », date, semaine X/Y, objectif ou prochaine épreuve, **grande carte de la séance du jour avec bouton rouge « Commencer »** au-dessus de la ligne de flottaison ; points des jours de la semaine (aujourd'hui en rouge) ; 2 mini-chiffres ; message du coach. États : jour de repos, aucun programme publié (attente + contacter le coach), séance en cours à reprendre |
| **Ma semaine / Programme** | Liste des semaines et séances : jour ou « Séance N », nom, discipline, durée estimée, intensité, état (Prévue / Faite / Partielle / Reportée / Manquée) |
| **Détail de séance** (running, musculation, Hyrox) | Type, nom, objectif, durée ou distance, consignes, matériel ; blocs ordonnés et dépliables, unités très visibles |
| **Mode actif** | Un bloc à la fois, « Bloc 2/3 », « Répétition 3/5 », cible en très grand, cases à cocher, notes ; pas de chrono promis à la seconde ; bouton fixe en bas « Terminer la séance » |
| **Fin de séance** | Statut (Terminée / Partielle / Sautée), RPE 1 à 10, difficulté (Facile / Modérée / Difficile), commentaire, réel par bloc (facultatif) |
| **Historique** | Séances passées, filtres |
| **Progression** | Séances réalisées / prévues, calendrier d'assiduité, RPE moyen (seulement avec assez de réponses), records, repères. « Aucune donnée » si vide |
| **Objectifs et épreuves** | Objectifs en cours, compte à rebours de l'épreuve |
| **Documents** | PDF des programmes publiés |
| **Messages** | Conversation avec le coach |
| **Notifications** | Nouveau programme, nouvelle version, message |
| **Profil** | Photo, identité, préférences, **accord santé**, déconnexion |

Contexte d'usage : à la salle, une main, parfois en sueur, lumière forte : grandes zones tactiles,
fort contraste, rien qui dépend du survol.

### 7.3 Administration (ordinateur, priorité basse)
- **Vue d'ensemble** : cartes (organisations, coachs, sportifs, inscriptions du mois).
- **Organisations** : nom, propriétaire, nombre de sportifs, formule, état (Active / Suspendue).
- **Utilisateurs et rôles** : nom, e-mail, rôle (Coach / Sportif / Admin), dernière connexion.
- **Abonnements et quotas** · **Journal d'audit** (qui, quoi, quand) · **Erreurs et intégrations**
  · **Conformité** (export des données, suppression de compte, avec confirmation renforcée).

---

## 8. Format du rendu : deux prototypes interactifs + une planche

### 8.1 Deux prototypes cliquables
1. **Prototype téléphone** (cadre 390 px) **totalement interactif**.
2. **Prototype ordinateur** (1440 px) **totalement interactif**.

Dans chacun, **toutes les pages de l'app sont réunies dans un seul fichier / une seule page** et
reliées entre elles : on navigue comme dans la vraie app.
- Les menus (latéral, hamburger, barre du bas sportif), onglets, filtres, boutons, liens, feuilles
  du bas, menus « ••• » et fenêtres de confirmation fonctionnent.
- Les formulaires réagissent : saisie, œil du mot de passe, jauge, erreurs sous les champs, envoi
  qui mène à l'écran suivant.
- Un sélecteur permet de passer du **thème sombre au thème clair**.
- On peut basculer entre **espace coach**, **espace sportif** et **admin** (sélecteur de rôle de
  démonstration, discret).

### 8.2 Parcours à suivre, dans cet ordre
1. **Connexion** → lien « Créer un compte » → **Inscription** (choix Coach / Sportif) → « Vérifie ta
   boîte mail » → **Bienvenue**.
2. Mot de passe oublié → nouveau mot de passe ; invitation d'un sportif ; lien invalide ; accès
   refusé ; conditions, confidentialité, mentions légales.
3. Coach : tableau de bord → sportifs (liste, nouveau, fiche et ses 7 onglets, invitation) →
   agenda (vues, nouvelle séance, détail) → programmes (liste, assistant, éditeur, aperçu,
   publication, PDF) → séances et retours → bibliothèque → facturation → comptabilité → tâches →
   documents → messages → notifications → recherche → paramètres → assistant IA.
4. Sportif : Aujourd'hui → programme → détail de séance (running, musculation, Hyrox) → mode
   actif → fin de séance → historique → progression → objectifs → documents → messages →
   notifications → profil.
5. Admin : toutes ses pages.

### 8.3 La planche
Une **planche d'ensemble** qui montre **toutes les pages côte à côte**, rangées dans l'ordre du
parcours ci-dessus (une rangée par espace : entrée, coach, sportif, admin), téléphone et
ordinateur, avec le nom de chaque page. Un clic sur une page de la planche ouvre le prototype à cet
endroit.

### 8.4 Bases communes
Avant les pages, poser les **composants** : boutons, champs (avec « (facultatif) », œil, jauge),
pastilles, badges de statut et de discipline, avatar (photo ou initiales, ♀/♂), carte chiffrée,
onglets, menu latéral, menu hamburger, feuille du bas, états vides / chargement / erreur. Sombre
et clair.

## 9. Exigences pour chaque page

- **Téléphone 390 px** (conçu en premier) et **ordinateur 1440 px**.
- **Thème sombre** et **thème clair**.
- États : rempli, **vide**, **chargement**, **erreur** (et succès pour les formulaires),
  accessibles dans le prototype.
- Contrastes ≥ 4,5:1, zones tactiles ≥ 44 px, une seule action rouge par écran.

## 10. Fichiers à joindre avec ce brief

- `COORY_DESIGN_SYSTEM.md` : jetons, typographie, composants (attention : sa section 7 « Screens »
  décrit une ancienne navigation ; **c'est ce brief qui fait foi** pour les menus et les pages).
- `COORY_LOGO.md` : logo et SVG.
- `COORY_AUTH_PAGES.md` : cahier des pages de connexion et d'inscription.
- `docs/design/MAQUETTES.md` + les 12 images de `docs/design/maquettes/`.
- Facultatif : captures d'écran de l'app actuelle (tableau de bord, fiche sportif, agenda) pour
  montrer l'existant.
