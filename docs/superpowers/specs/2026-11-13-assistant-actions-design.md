# Assistant IA qui agit dans Coory : conception

Date : 13/11/2026. Demande d'Antonino. Approche choisie : A (« carte d'action »). Suite de D-168
(assistant branché à Claude, réservé à l'abonnement) dans le MVP « espace coach seul » (D-167).

## 1. Intention

Aujourd'hui, l'Assistant IA de Coory ne fait que discuter. Antonino veut qu'il **agisse dans
l'application** : un coach écrit en langage courant (« Crée la fiche de Lucas Martin,
intermédiaire, objectif semi en avril », « Déplace la séance de Sophie de mardi à jeudi même
heure », « Note 60 € de Thomas en liquide ») et l'assistant fait l'action à sa place, **après un clic
de validation**. Le but : faire gagner du temps à Gianluca sur les actions qu'il fait le plus souvent,
sans changer d'écran.

Actions visées, par ordre de fréquence donné par Antonino : créer un sportif ; créer une séance ;
déplacer une séance ; nouveau paiement ; nouvelle dépense ; créer un programme ; modifier un
programme ; ajouter un exercice ; ajouter une tâche ; créer une liste de tâches ; importer un
fichier ; compléter une fiche sportif incomplète ; « envoyer » le programme (l'agenda et les fiches
en PDF).

## 2. Objectifs, non-objectifs, anti-objectifs

**Objectifs**
- Chaque action ci-dessus peut être demandée en une phrase, sur téléphone comme sur ordinateur.
- L'assistant retrouve seul ce dont il a besoin (« Lucas », « la séance de mardi », la liste
  « Facturation ») et pose une question courte seulement s'il y a un doute réel (deux « Lucas »).
- Rien ne change dans Coory sans le clic « Valider » du coach.
- Une action faite par l'assistant respecte exactement les mêmes règles, droits et validations
  qu'avec le formulaire habituel.

**Non-objectifs (pour cette fois)**
- Les actions masquées par le MVP (messages, invitations, espace sportif) : aucun outil.
- Supprimer quoi que ce soit (sportif, séance, paiement, programme) : pas d'outil de suppression.
- Publier un programme : l'assistant écrit des **brouillons**, la publication reste le geste du coach.
- Enregistrer les conversations (toujours pas d'historique, D-132).
- Envoyer des e-mails ou des messages : Coory n'en envoie pas (le « PDF envoyé » = liens à partager).
- Annuler une action après validation (le coach la défait dans l'écran habituel).

**Anti-objectifs (échec même si « ça marche »)**
- Une action exécutée sans clic du coach, ou différente de ce que montrait la carte.
- Une action refusée par le formulaire habituel mais acceptée par l'assistant (ou l'inverse).
- Des données de santé, notes libres ou contenus de documents envoyés à Anthropic.
- Une facture Anthropic qui dérape : une demande du coach qui déclenche une boucle d'appels sans fin.
- Un sportif, une séance ou un paiement attribué à la mauvaise personne sans que la carte le montre
  clairement (nom complet, date en toutes lettres).

## 3. Contraintes

- **Règles du projet (CLAUDE.md)** : toute mutation est autorisée côté serveur (identité, rôle,
  organisation, appartenance, Zod) et protégée par la RLS ; jamais d'`organization_id` libre venant
  du navigateur ; l'IA n'est pas prescriptrice et ne modifie jamais rien sans validation du coach.
- **Abonnement et quota (D-168)** : aucune demande sans `coory_plan = 'premium'` ; 100 demandes par
  coach et par mois, comptées par `reserve_assistant_use` AVANT l'appel. Gianluca et Antonino ont
  chacun leurs 100.
- **Coût** : Claude Opus 5.5 (`claude-opus-5-5`), facturé aux jetons ; Antonino dispose de 100 $
  de crédits API par mois (plan Max), à ne pas dépasser en usage normal.
- **MVP (D-167)** : drapeaux `FEATURES` respectés ; aucun outil pour ce qui est masqué.
- **Confidentialité** : ce que lisent les outils part chez Anthropic (sous-traitant). Jamais : notes
  de santé, accords de santé, notes libres, contenu des documents, e-mails ou téléphones des sportifs
  au-delà de ce qui est nécessaire à l'action demandée. **Aucun outil d'écriture ne porte de champ de
  santé** (contraintes de santé, accord, blessures) ni de note privée sur le sportif : si le coach en
  parle, l'assistant répond de les noter lui-même dans la fiche (onglet Notes). Une ligne sous la
  saisie rappelle : « N'écris pas de données de santé ici. » Les notes d'une séance ou d'une tâche
  restent possibles (texte de travail du coach).
- **Interface** : téléphone d'abord, jetons de `tokens.css` seulement, Plus Jakarta Sans, cibles de
  44 px, charger les compétences de design avant (Taste, Front-End Design, UX Pro Max, Apple Design,
  Emil) ; vérifier téléphone et ordinateur, clair et sombre.
- **Code** : une seule application Next.js, TypeScript strict, pas de nouvelle dépendance hors
  `@anthropic-ai/sdk` (déjà installé).

## 4. Approches envisagées

- **A. Carte d'action (CHOISIE par Antonino).** Claude reçoit des outils. Les outils de **lecture**
  s'exécutent tout de suite côté serveur. Les outils d'**écriture** ne s'exécutent pas : ils
  produisent une **proposition** affichée en carte (« Nouvelle séance · Lucas Janssens · mardi
  18 novembre · 18:00 · 60 min »), avec **Valider** (exécute), **Modifier** (ouvre le formulaire
  habituel pré-rempli quand il existe) et **Annuler**. Le plus rapide pour le coach ; demande que
  chaque action accepte des données structurées en plus des formulaires.
- **B. Formulaire pré-rempli.** L'assistant ouvre le formulaire habituel déjà rempli et le coach
  clique « Enregistrer ». Moins de code, mais un écran de plus à chaque fois, et plusieurs actions
  n'ont pas de fenêtre. Écartée par Antonino.
- **C. Exécution directe sans validation.** Contraire à la règle du projet. Écartée.
- **D. Agents gérés côté Anthropic (Managed Agents, MCP).** Inutile : les actions vivent dans notre
  serveur, une boucle d'outils dans une action serveur suffit et garde les droits chez nous. Écartée.

## 5. Ce qui est décidé

### 5.1 Le déroulé d'une demande

1. Le coach écrit ; le navigateur envoie l'historique de la conversation (comme aujourd'hui) à
   l'action serveur `askAssistant`.
2. Le serveur réserve **une** demande (`reserve_assistant_use`) puis fait **un** appel à Claude.
   La boucle d'outils est **découpée en allers-retours** entre le navigateur et le serveur : si
   Claude appelle des outils de lecture, le serveur les exécute, renvoie au navigateur l'état de la
   boucle et une ligne de progression (« Je cherche Lucas… »), et le navigateur relance aussitôt
   l'étape suivante. Chaque appel serveur reste court (un seul appel au modèle), quelle que soit
   l'offre Vercel. La boucle s'arrête quand Claude répond en texte, ou quand il appelle un ou
   plusieurs outils d'écriture.
3. **Plafond** : au plus 6 appels au modèle par demande du coach (au-delà, réponse « Je n'ai pas
   réussi, reformule ta demande »). Une demande du coach = 1 sur ses 100, quel que soit le nombre
   d'étapes. Les étapes suivantes sont rattachées à la même réservation, côté base : la ligne
   d'`assistant_usage` reçoit un compteur d'étapes, et une fonction `continue_assistant_use`
   (même coach, demande encore en cours, moins de 5 minutes, au plus 6 étapes) refuse toute étape
   de trop. Les jetons de toutes les étapes sont additionnés sur la ligne.
4. Un outil d'écriture appelé par Claude : le serveur **valide** ses paramètres (Zod, mêmes règles
   que le formulaire), **résout** les identifiants (sportif, séance, liste…) dans l'organisation du
   coach, et renvoie au navigateur une **proposition** (type d'action, paramètres validés, lignes de
   résumé lisibles). À Claude, le serveur répond « proposition affichée au coach, en attente de sa
   validation » ; la réponse se termine (pas d'exécution dans la boucle).
5. Le navigateur affiche le texte de Claude et une **carte par proposition** (plusieurs cartes
   possibles : « crée la fiche de Lucas et ajoute une tâche pour l'appeler » = 2 cartes).
6. **Cartes liées** : une proposition peut désigner le sportif créé par une autre carte de la même
   réponse (référence à cette carte au lieu d'un identifiant). La carte qui dépend dit « après la
   création de Lucas Martin » et son « Valider » reste grisé tant que la première n'est pas faite ;
   à l'exécution, la référence devient l'identifiant créé. Si la première est annulée ou échoue, la
   seconde passe à « Impossible : la fiche de Lucas Martin n'a pas été créée ». Pas de nouvelle
   demande décomptée.

### 5.2 La carte et le clic

- Contenu : un titre d'action (« Nouvelle séance »), des lignes de résumé en clair (nom complet du
  sportif, date en toutes lettres, montant avec devise, etc.), et les boutons **Valider**,
  **Modifier**, **Annuler**.
- **Valider** appelle une nouvelle action serveur `executeAssistantAction(organizationId, action)`.
  Elle **ne fait jamais appel à Claude** (aucun coût, aucune demande décomptée), revérifie tout
  (`requireOrgAccess`, Zod du type d'action, appartenance des identifiants) et passe par la **même
  logique** que le formulaire habituel. Résultat : « Fait » avec un lien « Voir » (fiche, séance,
  tâche…), ou le message d'erreur du formulaire sur la carte.
- **Modifier** : pour séance, paiement et tâche, ouvre la fenêtre habituelle (`useOpenNewSession`,
  `useOpenNewPayment`, `useOpenTaskSheet`) pré-remplie avec la proposition ; ces fenêtres doivent
  accepter un pré-remplissage complet. Pour les autres actions, « Modifier » remet le curseur dans la
  saisie avec « Que veux-tu changer ? » : le coach corrige en une phrase et une nouvelle carte
  remplace l'ancienne.
- **Annuler** : la carte passe à « Annulé », rien n'est fait.
- Une carte validée, annulée ou en erreur ne peut plus être revalidée (pas de double exécution) ;
  le bouton est désactivé pendant l'exécution.
- Après Valider ou Annuler, une note est ajoutée à l'historique envoyé à Claude la fois suivante
  (« [Fait : séance créée avec Lucas Janssens le mardi 18 novembre à 18:00] » ou « [Annulé : …] »),
  pour qu'il sache où on en est.

### 5.3 Les outils

**Lecture** (exécutés tout de suite, limités à l'organisation du coach, résultats courts) :
- `chercher_sportifs` (nom approché → id, nom complet, statut, discipline, ce qui manque à la fiche)
- `voir_agenda` (période → séances : id, titre, sportif ou « collective », date, heure, durée)
- `voir_programmes` (sportif → programmes : id, titre, statut, dates, version publiée)
- `voir_programme` (programme → semaines et séances du brouillon, sans notes privées)
- `voir_a_encaisser` (sportif → dates de séances non payées : séance, date, prix)
- `voir_listes_de_taches`, `voir_categories_de_depenses`, `voir_categories_de_documents`
- `chercher_exercices` (Bibliothèque : nom → clé, nom, mesure en répétitions ou secondes)
- `voir_modeles` (modèles Coory et du coach : id, titre, discipline, semaines, séances par semaine)

**Écriture** (proposition puis Valider), en trois lots livrables séparément :

| Lot | Outil | Exécuté par (même logique que) |
|---|---|---|
| 1 | `creer_sportif` | Nouveau sportif (`createAthlete`) |
| 1 | `creer_seance` (individuelle ou collective, répétée ou non) | Nouvelle séance (`createSession`) |
| 1 | `deplacer_seance` (une seule date, ou toute la série comme au glisser) | glisser dans l'agenda (`moveSession`) |
| 1 | `marquer_seance_payee` | « Marquer payée » d'une date (`markSessionPaid`) |
| 1 | `noter_paiement` | Nouveau paiement (`createPayment`) |
| 1 | `noter_depense` | Nouvelle dépense (`createExpense`) |
| 1 | `creer_tache` | fenêtre Tâche (`createTask`) |
| 1 | `creer_liste_de_taches` | `createTaskList` |
| 2 | `completer_fiche` (seulement les champs manquants ou demandés) | Profil (`updateAthlete`) |
| 2 | `importer_document` (le fichier joint par le coach) | Documents (`uploadDocument`) |
| 2 | `creer_exercice` (exercice du coach dans la Bibliothèque) | `createCoachExercise` |
| 2 | `preparer_pdf` (agenda et fiches de la version publiée) | routes PDF existantes |
| 3 | `creer_programme` (depuis un modèle, une copie ou vide) | assistant « Créer un programme » (`createProgram`) |
| 3 | `modifier_programme` (séances du brouillon) | éditeur (`saveDraft`) |

- **Un paiement qui correspond à une séance à encaisser** : avant de proposer `noter_paiement`,
  Claude regarde `voir_a_encaisser`. Si une date non payée du sportif correspond (montant, période),
  il propose `marquer_seance_payee` (la date sort de « À encaisser », pas de double comptage) ; sinon
  un paiement libre. En cas de doute (plusieurs dates possibles), il demande laquelle.
- **Déplacer une séance** : exactement les deux choix du glisser dans l'agenda, une seule date ou
  toute la série (dates passées comprises, de 3 jours au plus dans un sens ou dans l'autre). La
  carte le dit en toutes lettres. Pas de coupure de série (pas de nouvelle logique).
- **Même logique** : l'exécuteur appelle les fonctions existantes. Les actions de formulaire qui
  redirigent (`createAthlete`, `createSession`, `createCoachExercise`) doivent exposer leur cœur
  (valider, écrire, revalider) dans une fonction partagée appelée par le formulaire ET par
  l'exécuteur ; aucune règle n'est copiée.
- **Importer un document** : le coach joint le fichier dans la saisie de l'assistant (bouton
  « Joindre ») ; **seuls le nom, le type et la taille** sont envoyés à Claude, jamais le contenu. Le
  fichier reste dans le navigateur et part avec « Valider » (limite de 4 Mo). Une conversation
  recommencée oublie le fichier.
- **PDF** : seulement pour un programme publié ; la carte affiche les deux liens de téléchargement
  (Agenda, Fiches et repères) de la dernière version publiée. Pas d'envoi.
- **Programmes (lot 3)** :
  - `creer_programme` reprend les choix de l'assistant de création (sportif, titre, discipline,
    date de début au lundi, semaines, séances par semaine, mode jours fixés ou dans l'ordre, point de
    départ modèle / copie / vide). Résultat : un **brouillon**, lien « Ouvrir dans l'éditeur ».
  - Si le coach demande un programme sur mesure sans modèle, Claude peut écrire le contenu des
    séances ; il est validé par les schémas du brouillon (`programDraftSchema`, `sessionBodySchema`)
    avant même d'afficher la carte. Les exercices de musculation doivent venir de la Bibliothèque
    (`chercher_exercices`).
  - `modifier_programme` change des séances du **brouillon** (remplacer un exercice, changer des
    séries, ajouter ou déplacer une séance), avec le numéro de révision du brouillon : si le
    brouillon a changé entre-temps, la carte le dit et rien n'est écrasé. La carte résume le
    changement (« Semaine 3, séance 2 : Back squat → Presse à cuisses, 4 × 8 »).
  - Jamais de publication, jamais d'archivage.

### 5.4 Coût et réglages du modèle

- Une étape dure le temps d'un appel au modèle (souvent 10 à 30 s) ; le navigateur affiche la
  progression de chaque étape (« Je cherche Lucas… », « Je regarde l'agenda de mardi… »).

- Modèle `claude-opus-5-5`, effort `medium`, `max_tokens` 4 000 (8 000 pour l'écriture d'un
  programme sur mesure).
- **Mise en cache** de la consigne et des définitions d'outils (elles sont longues et identiques à
  chaque appel) pour réduire le coût des appels répétés.
- La consigne système dit : français, tutoiement, ne jamais inventer d'identifiant (toujours
  chercher), demander en une phrase en cas de doute, toujours passer par une carte pour agir,
  rappeler que rien n'est fait avant le clic, pas de diagnostic médical.
- Estimation (à mesurer en réel) : une action simple avec une ou deux lectures = quelques centimes ;
  un programme sur mesure = de l'ordre de 0,30 à 1 $.

### 5.5 Sécurité

- `executeAssistantAction` est une action serveur appelable directement : elle ne fait **aucune**
  confiance à la proposition (même niveau de contrôle qu'un formulaire envoyé par le navigateur).
- Les outils de lecture et d'écriture n'acceptent jamais d'`organization_id` : il vient de la session.
- Les résultats de lecture renvoyés à Claude sont des données, pas des instructions (un nom de
  sportif ou un titre de tâche ne peut pas « commander » l'assistant) : la consigne le dit, et aucune
  action ne s'exécute sans clic de toute façon.

### 5.6 Tests

- **Unitaires** : schémas de chaque outil ; construction des résumés de carte ; résolution des
  identifiants (ambiguïté, autre organisation refusée) ; plafond de 6 appels ; note d'historique.
- **Modèle simulé pour les tests de bout en bout** : une variable d'environnement de test remplace
  Claude par un script de réponses (appels d'outils prévus d'avance), **refusée en production**.
  Parcours testés sans coût : demande → carte → Valider → la donnée existe ; Annuler → rien ;
  Modifier → fenêtre pré-remplie ; sans abonnement → verrouillé ; quota atteint.
- **SQL** : migration du compteur d'étapes (`assistant_usage.steps`, `continue_assistant_use`) et
  son test pgTAP (même coach seulement, demande en cours, 6 étapes au plus, 5 minutes au plus).
- Un vrai appel à Claude seulement avec l'accord d'Antonino (ça coûte).

### 5.7 Livraison

Trois lots, chacun utilisable seul : lot 1 (sportif, séance, déplacer, paiement, dépense, tâche,
liste), lot 2 (compléter une fiche, document, exercice, PDF), lot 3 (programmes). Chaque lot :
documentation (00_INDEX, SUIVI, CARNET), captures téléphone et ordinateur en clair et en sombre.

## 6. Décisions prises par Claude après la relecture (à corriger par Antonino s'il le souhaite)

- Cartes liées pour « crée la fiche puis… » (5.1, point 6), plutôt qu'une carte combinée ou une
  deuxième demande payante.
- Paiement : marquer payée une séance à encaisser quand elle correspond, sinon paiement libre (5.3).
- Déplacer : une date ou toute la série, comme le glisser (5.3) ; pas de « à partir de cette date ».
- Santé : aucun champ de santé ni note privée dans les outils, rappel sous la saisie (3).
- Boucle découpée en allers-retours avec progression visible et compteur d'étapes en base (5.1),
  pour des appels courts quel que soit l'hébergement.
- Noms d'exercices envoyés à Claude : autorisé (la licence RepDB n'interdit que ses images à une IA,
  et elles ne sont jamais envoyées).
- PDF : liens de téléchargement réservés au coach connecté (pas de lien public partageable).
- `modifier_programme` sur un programme publié sans brouillon : comme l'éditeur, le brouillon repart
  de la version publiée.

## 7. Laissé au constructeur

- Le schéma exact de chaque outil (noms des champs, descriptions pour Claude).
- La mise en page de chaque carte, dans le style des boîtes existantes.
- La façon d'extraire le cœur des actions de formulaire qui redirigent.
- Le format interne de la proposition renvoyée au navigateur.
- Le contenu exact de la consigne système et des messages d'erreur, dans le ton de l'app.
