# Espace sportif, étape 1 : « Mon programme » (18/11/2026)

## Pourquoi
Aujourd'hui, Gianluca envoie ses programmes en PDF sur WhatsApp. Le sportif doit retrouver le bon
fichier, sur son téléphone, juste avant ou pendant la séance. L'étape 1 donne au sportif suivi par un
coach Coory **son programme publié, lisible sur téléphone**, sans rien à recopier ni à chercher.

C'est la base de tout ce qui suit : « Faite » et le ressenti (étape 2), le carnet de musculation
(étape 3), le choix du jour et « prévenir mon coach » (étape 4), puis Garmin, puis l'app native. Le
but d'Antonino est une Coory « indispensable », indépendante des montres, et plus grande qu'Athleex.

**Plateforme (décision d'Antonino du 18/11, modèle Strava)** : un seul serveur (Supabase : base,
comptes, règles d'accès) et deux façades. Maintenant, l'espace sportif dans l'app web actuelle, pensé
pour le téléphone et installable sur l'écran d'accueil. Plus tard, une app native Expo POUR LE SPORTIF,
qui ne refait que les écrans. Les coachs restent sur le web (ordinateur et téléphone).

## Objectifs
1. Le coach invite son sportif (invitation existante, rallumée) ; la page d'invitation montre **le nom
   du coach**, plus seulement son organisation.
2. Le sportif connecté voit : **Aujourd'hui**, **Programme**, **Séance**, le **PDF** de son programme,
   **Profil**. Téléphone d'abord, ordinateur ensuite (même contenu).
3. Un sportif ne voit que **sa version publiée**. Jamais celle d'un autre, ni les brouillons, les
   notes privées, les prix, les factures ou les données de santé d'un autre.
4. Tout reste caché sur la bêta tant qu'Antonino ne décide pas de l'ouvrir.

## Non-objectifs (étapes suivantes)
- « Faite », partielle, sautée, ressenti, RPE, commentaire (étape 2) ; carnet de charges (étape 3) ;
  le sportif qui choisit ou déplace le jour d'une séance, « prévenir mon coach » (étape 4).
- Mode « séance en cours » (minuteur, étapes cochées), Progression, Messages, notifications poussées,
  historique des anciennes versions à l'écran, programmes précédents.
- Garmin (en pause, voir la mémoire du projet), l'abonnement payant des sportifs et ce que l'Assistant
  IA fait pour eux.
- Connexion Google sur la page d'invitation, photo du sportif (initiales à la place, voir Données).

## Anti-objectifs (échec même si « ça marche »)
- Une fuite entre sportifs ou entre organisations, ou un sportif qui lit un brouillon, un prix, une
  note privée.
- Un affichage de séance différent de celui du coach ou du PDF (même version figée, mêmes cartes).
- Des chiffres inventés (pas de « 0 » à la place de « aucune donnée », pas de distance devinée).
- Une barre d'onglets en bas de l'écran (décision d'Antonino : tout passe par le menu ☰).
- Du code de lecture réservé au web qui obligerait à tout refaire pour l'app native.

## Contraintes
- Règles non négociables du CLAUDE.md du projet : multi-tenant, RLS, version publiée figée, mobile
  first (≈ 390 px d'abord), pas de fausses données, Zod aux frontières, tests (Vitest, pgTAP,
  Playwright), SUIVI_IMPLEMENTATION.md et CARNET_TECHNIQUE.md à la fin.
- Charte Coory : jetons de `src/styles/tokens.css` seulement, Plus Jakarta Sans, violet rare
  (aujourd'hui, sélection, liens), action principale blanche en sombre et noire en clair, **aucune
  pastille ronde** (D-188 : barre de couleur, étiquette en rectangle arrondi), allures « 4:05-4:15 /km »,
  course en minutes. Vérifier téléphone ET ordinateur, sombre ET clair. Compétences de design à charger
  avant tout écran (Taste, Front-End Design, UX Pro Max, Apple Design, Emil).
- Espace sportif : texte courant **16 px minimum**, grandes zones tactiles (≥ 44 px), rien au survol.
- Fuseau : Europe/Brussels (`todayIsoInBrussels`).
- Un utilisateur peut être sportif dans **plusieurs organisations** (index unique
  `(organization_id, athlete_user_id)`) : rien ne doit supposer un seul lien.
- **Préparer l'app native** : toute lecture passe par Supabase sous la session du sportif (règles
  d'accès RLS ou fonctions RPC), jamais par une action serveur réservée au web ; les calculs (semaine
  en cours, séance du jour, états) sont des fonctions TypeScript pures dans `src/domain/`.

## Approches envisagées
**Accès aux données**
1. **Règles d'accès (RLS) pour le sportif**, en lecture seule. Lisible tel quel par la future app
   native, testable en pgTAP. **Retenue pour les séances publiées** (`publication_sessions`).
2. Des fonctions RPC « security definer » qui renvoient seulement des colonnes sûres. **Retenue là où
   une ligne entière exposerait trop** : l'en-tête du programme et de la publication (la note privée
   du coach y est rangée), les rendez-vous du coach (prix, notes), le nom du coach, l'objectif du
   sportif.
3. Clé « administrateur » côté serveur. **Écartée** : contourne la RLS, interdit par le projet.

**Écrans** : réutiliser les composants et fonctions du coach (cartes de séance, `sessionCards`,
`cardLines`, `sessionStats`, `pickCurrentProgram`) avec un mode « lecture seule » et une taille de
texte « sportif » (**retenu**), plutôt que des composants à part qui finiraient par diverger du PDF.

**Plateforme** : web d'abord puis app native Expo (**décidé par Antonino**), plutôt que natif tout de
suite (trop long seul) ou un code unique pour tout (réécrire l'espace coach).

**Vue ordinateur** : trois pistes montrées (téléphone élargi, deux colonnes, semaine et séance côte à
côte) ; **Antonino a choisi la troisième, panneaux inversés** (séance à gauche, semaine à droite).

## Décidé par Antonino (maquettes validées)
Maquettes de référence, dans `coory-design/espace-sportif-etape-1/` (ouvrir dans un navigateur ; bouton
Sombre / Clair en haut) : `planche-1-telephone.html` (écrans 1 à 5), `planche-2-telephone.html`
(écrans 6 à 11), `ordinateur.html` (écran 12). Elles fixent la mise en page, les textes et la
hiérarchie ; les valeurs exactes (rayons, tailles) suivent les jetons et composants existants.

1. **Aujourd'hui** (écran 1) : « Salut {prénom} », date et « semaine X sur Y », objectif en cours
   (« Semi-marathon de Bruxelles dans 47 jours ») s'il existe ; grande carte de la séance du jour
   (barre de couleur de la discipline, « Aujourd'hui » en violet, « Séance 3 sur 7 », titre, étiquettes
   discipline et moment, une ligne de résumé, bouton « Voir la séance ») ; « Ta semaine » (7 jours,
   carrés numérotés à la couleur de la discipline, aujourd'hui en violet) ; « Demain » ; carte de
   l'accord santé.
2. **Semaine « dans l'ordre »** (écran 2) : « Cette semaine, N séances à faire dans l'ordre, aux jours
   qui t'arrangent », liste numérotée ; « Avec ton coach » (prochain rendez-vous, vraie date et heure) ;
   « Ton programme en PDF ».
3. **Programme** (écran 3) : la même page que chez le coach, sans rien pour modifier : carte du
   programme (nom, dates, nombre de semaines, « Mis à jour par ton coach le … », barre des semaines,
   « Télécharger le PDF »), sélecteur « ‹ Semaine 3 / 10 ⌄ › », bande des 7 jours, séances par jour
   (« Lun 16, 2 séances », « Mar 17, Repos », « Mer 18, Aujourd'hui »), cartes avec numéro, titre,
   étiquette de discipline, résumé, étiquette de moment (Matin, Soir…).
4. **Séance** (écran 4) : « Mercredi 18 novembre, séance 3 », titre, étiquettes (discipline,
   « Aujourd'hui », moment), deux chiffres clés (durée et un autre), Objectif, Conseil du coach,
   « Déroulé » en cartes (les mêmes que chez le coach et dans le PDF, en plus grand).
5. **Navigation** (écran 5) : **pas de barre en bas**. Barre du haut comme chez le coach : bouton ☰ à
   gauche, nom de la page avec son icône, cloche à droite ; sur une séance, « ← Programme » à la place
   du nom. Le ☰ ouvre le menu plein écran du coach : Aujourd'hui, Programme, Profil, et le compte en bas.
6. **Assistant IA** (écran 6) : bouton violet à côté de la cloche **pour les sportifs abonnés**,
   comme chez le coach. L'abonnement des sportifs n'existe pas encore : le bouton n'apparaît pour
   personne dans l'étape 1, mais la barre lui garde sa place (condition prévue : abonnement actif).
7. **Jour de repos** (écran 7) : « Repos. Pas de séance prévue. La récupération fait partie du
   programme. », puis la prochaine séance et la semaine.
8. **Pas encore de programme** (écran 8) : « Bienvenue {prénom} », « Ton coach : {nom} », « Ton coach
   prépare ton programme » et la demande d'accord santé (« Donner mon accord », « En savoir plus » vers
   la page de confidentialité).
9. **Programme à venir** (écran 9) : « Ton programme commence lundi 18 janvier, dans 5 jours », carte
   du programme et « Voir le programme » (on peut déjà le parcourir).
10. **Invitation** (écran 10) : style actuel des pages d'entrée (photo d'en-tête, feuille arrondie) ;
    carte « Invitation de ton coach » avec **le nom du coach** en gras, puis l'organisation et
    « pour {sportif} », la date de fin ; formulaire inchangé (e-mail de la fiche verrouillé, mot de
    passe, confirmation, « J'ai 18 ans ou plus », « Créer mon compte »). L'étiquette « nouveau » de la
    maquette est une annotation, pas un élément de l'app.
11. **Profil** (écran 11) : identité (initiales, nom, e-mail), « Ton coach » (nom, organisation),
    accord santé (interrupteur et « Retirer mon accord », avec confirmation), thème (Automatique,
    Sombre, Clair), « Se déconnecter ». **Ajout (choix de Claude, pas maquetté)** : « Supprimer mon
    compte » en bas, avec la boîte de confirmation du kit (voir Règles).
12. **Ordinateur** (écran 12) : menu à gauche (Aujourd'hui, Programme, Profil, compte en bas), barre du
    haut en carte ; « Salut {prénom} » ; **à gauche le détail de la séance** (celle du jour au départ),
    **à droite la semaine** ; un clic sur une séance de la semaine change le panneau de gauche sans
    changer de page.

## Comportement attendu (règles)
**Quel programme** : celui de `pickCurrentProgram` (en cours, sinon le prochain), programme
`published` du sportif, version = `active_publication_id`. Plusieurs organisations : un programme par
lien ; si le sportif en a plusieurs en cours, l'écran Aujourd'hui les empile (rare ; l'ordre et la
présentation fine sont laissés au constructeur, sans fusionner les données de deux organisations).

**États de l'écran Aujourd'hui** (fonction pure, testée) :
- compte créé sans fiche liée : écran existant « Ton compte est prêt » ;
- fiche liée, aucun programme publié : écran 8 ;
- programme publié qui commence plus tard : écran 9 ;
- programme en cours, semaine à jours fixes : séance(s) du jour en grandes cartes (jusqu'à 4 par
  jour, D-164, dans l'ordre des moments), sinon écran 7 (repos) ;
- programme en cours, semaine « dans l'ordre » (pas de `planned_date`) : écran 2 ;
- programme terminé (dernière semaine passée) : « Ton programme est terminé » et « Voir le programme »
  (pas maquetté : même gabarit que l'écran 9) ;
- une semaine peut mélanger des séances datées et une séance avec le coach (`withCoach`) : celle-ci
  prend la date et l'heure du rendez-vous.

**« Séance N sur M »** : rang dans la semaine (ordre de l'écran Programme). **« Semaine X sur Y »** :
depuis `programs.start_date` (un lundi) et le nombre de semaines publiées. **Objectif en cours** :
l'objectif principal du sportif (`athlete_goals`) daté d'aujourd'hui ou plus tard, « {nom} dans N
jours » ; rien s'il n'y en a pas. **« Mis à jour par ton coach le … »** : date de la publication active.

**Chiffres clés d'une séance** : ceux que montre déjà le coach (`sessionStats`), jamais un chiffre
calculé exprès pour le sportif ; s'il n'y en a qu'un, une seule tuile.

**Rendez-vous avec le coach** (une seule fonction RPC, colonnes sûres) :
- les séances encadrées **citées par la publication active du sportif** (`withCoach`), pour toutes les
  semaines du programme : ce qu'il faut à `findCoachMeeting` pour trouver la vraie date (jour, heure,
  récurrence, exceptions), afin que Programme, Séance et PDF montrent la même date que chez le coach ;
- les séances encadrées à venir où le sportif est **inscrit** (individuelles ou de groupe), sur 14
  jours, pour la carte « Avec ton coach ».
Le titre d'une séance n'est renvoyé que si le sportif y est inscrit ; sinon le libellé est « Séance
avec ton coach » (une séance individuelle d'un autre sportif ne doit rien révéler). Jamais le prix,
la TVA ni les notes.

**Adresse d'une séance** : `/app/seance/[id]` (id de `publication_sessions`). Si le coach a republié,
l'ancien id ne fait plus partie de la version active : on renvoie vers la séance de même
`source_session_key` dans la version active ; si elle n'existe plus, message « Cette séance ne fait
plus partie de ton programme » et lien vers le Programme. Sur ordinateur, cette adresse affiche la vue
à deux panneaux avec cette séance à gauche. Afficher les anciennes versions (ATH-06) est hors de
l'étape 1 ; les données restent lisibles par le sportif pour le faire plus tard.

**Vue ordinateur selon les cas** (choix de Claude, dans le style de l'écran 12) :
- le panneau de gauche montre la séance choisie ; au départ : la première séance du jour ; un jour de
  repos : la carte « Repos » puis la prochaine séance (comme l'écran 7) ; une semaine « dans
  l'ordre » : la première séance de la semaine ; plusieurs séances aujourd'hui : la première, les
  autres marquées « Aujourd'hui » dans la liste ;
- le panneau de droite montre la semaine (sélecteur de semaine en haut), puis, sous la liste, « Avec
  ton coach », « Ton programme en PDF » et la carte d'accord santé (« Demain » n'est pas répété :
  la semaine le montre) ;
- sans programme, programme à venir ou terminé : pas de deux panneaux, le contenu du téléphone
  (écrans 8 et 9) au centre ;
- la page Programme sur ordinateur : les mêmes deux panneaux, avec la carte du programme (nom, dates,
  barre des semaines, PDF) en haut du panneau de droite.

**Cloche** : elle reste (maquettes validées) et ouvre un petit panneau honnête, « Aucune notification
pour l'instant ». Pas de page `/app/notifications` dans l'étape 1. Les vraies notifications du
sportif (par exemple « Ton coach a mis à jour ton programme ») viendront plus tard.

**Note privée du coach** : la « Note » de l'objectif d'un programme (« Ce que tu veux garder en tête
pour ce programme ») est un aide-mémoire du coach. Elle ne doit jamais atteindre le sportif : ni
`programs.goal` (programmes v1), ni `snapshot_json.goal.note`. D'où la RPC pour l'en-tête du programme,
et un test pgTAP qui le vérifie.

**Supprimer mon compte** (sportif) : supprime son compte de connexion après confirmation ; sa fiche
reste chez le coach, déliée (le coach est responsable de ces données), et la boîte le dit
clairement. Reprendre le mécanisme de suppression du compte coach (migration
`20261118120000_supprimer_mon_compte.sql`). C'est aussi ce qu'Apple et Google exigeront de l'app
native.

**PDF** : les deux PDF du coach (« Agenda du programme », « Fiches et repères »), générés depuis la
même version publiée, par une route réservée au sportif (`requireAthlete`) qui lit avec ses droits.
Le bouton « Télécharger le PDF » ouvre le même petit menu à deux choix que chez le coach.

**Accord santé** : composant et actions existants (`grantHealthConsentByAthlete`,
`withdrawHealthConsentByAthlete`), sur Aujourd'hui (carte d'état) et dans Profil (interrupteur).

**Côté coach** : les boutons « Inviter » existants redeviennent actifs avec le drapeau ; rien d'autre ne
change dans l'espace coach. En particulier, l'interrupteur « le sportif peut déplacer la séance » de
l'éditeur, lié aujourd'hui au drapeau de l'espace sportif, reste caché (il appartient à l'étape 4).

**Le coach d'un sportif** (nom affiché sur l'invitation, Aujourd'hui et Profil) : il n'existe pas de
colonne « coach responsable ». Règle : celui qui a créé l'invitation acceptée ; à défaut, le
propriétaire de l'organisation.

## Données et sécurité
- **Nouvelle règle d'accès (lecture seule, rôle `authenticated`)** : `publication_sessions` des
  programmes de SES fiches liées (non archivées), statut `published` ou `archived` (jamais `draft`).
  S'appuyer sur `private.is_linked_athlete(org_id)` ou un équivalent qui renvoie les fiches liées non
  archivées de l'utilisateur.
- **Aucun nouvel accès direct** à `programs`, `program_publications` (note privée), `program_drafts`,
  `coach_sessions` (prix, notes, TVA), `coach_profiles`, `athlete_goals`, factures, paiements, notes
  privées.
- **Fonctions RPC « security definer »** (colonnes sûres seulement, appartenance vérifiée dedans) :
  en-tête du programme et de sa publication active (nom, dates, semaines, plan des semaines utile à
  l'affichage, date et numéro de publication, sans aucune note) ; rendez-vous du coach (voir Règles) ;
  carte du coach (nom affiché et organisation) pour chaque lien ; objectif principal à venir (nom,
  date) ; `get_invitation` étendue avec le nom du coach (voir « Le coach d'un sportif »).
- **Drapeaux côté navigateur** : `FEATURES` est importé par des composants client ; une fois réglable
  par environnement, sa valeur leur est transmise depuis le serveur.
- **Photo** : les fichiers des fiches sont lisibles seulement par les membres de l'organisation ;
  l'étape 1 affiche les initiales du sportif.
- **Tests d'isolation pgTAP** : un sportif A ne lit ni les programmes, ni les publications, ni les
  séances de B (même organisation et autre organisation) ; aucun brouillon ; aucune colonne de
  `coach_sessions` hors RPC ; une fiche archivée ne donne plus rien ; un sportif lié à deux
  organisations voit les deux.

## Drapeaux et ouverture
`FEATURES.athleteSpace` et `FEATURES.invitations` sont aujourd'hui des constantes à `false` (D-167).
Ils deviennent réglables par environnement (variable d'environnement lue côté serveur, défaut
`false`) : allumés en local et dans les tests, éteints sur la bêta jusqu'à ce qu'Antonino décide
d'ouvrir l'espace sportif aux sportifs de Gianluca. Le test `mvp.spec.ts` (état masqué) et
`invitation.spec.ts` (état ouvert) restent valables chacun dans son mode.

## Choix laissés au constructeur
- Le mécanisme exact du mode « lecture seule » et de la taille « sportif » des cartes (prop,
  variante), tant que l'affichage reste celui du coach et du PDF.
- Le découpage en lots, les squelettes de chargement, les animations (sobres, `prefers-reduced-motion`).
- Le regroupement des semaines dans la liste du sélecteur (par phase comme chez le coach, ou simple).
- L'état « programme terminé » et « plusieurs programmes en cours » (règles ci-dessus, présentation
  libre dans le style des maquettes).
- Le numéro de décision (D-…) : le prochain libre dans `SUIVI_IMPLEMENTATION.md` au moment du code.

## Vérification (le « terminé »)
- **Vitest** : fonctions pures des états d'Aujourd'hui (jours fixes, « dans l'ordre », repos, à venir,
  terminé, plusieurs séances par jour, séance avec le coach), « semaine X sur Y », « séance N sur M »,
  objectif en cours, renvoi d'un ancien id de séance.
- **pgTAP** : la liste d'isolation ci-dessus, les nouvelles RPC, l'absence de la note privée du coach
  côté sportif, et le titre d'une séance encadrée d'un autre sportif jamais renvoyé.
- **Playwright** (drapeaux allumés, comptes de démo `thomas.peeters`, `ines.benali`,
  `nadia.elamrani`) : connexion du sportif, Aujourd'hui, Programme, Séance, PDF, Profil, menu ☰ ;
  URL de la séance d'un autre sportif = page introuvable ; invitation avec le nom du coach puis arrivée
  sur `/app` ; suppression du compte sportif ; captures téléphone (390 px) et ordinateur, sombre et
  clair. Tests ATH-01 à ATH-03 de `docs/09_ESPACE_SPORTIF.md` (ATH-06, anciennes versions, à l'étape
  qui les affichera).
- Mise à jour de `SUIVI_IMPLEMENTATION.md`, `CARNET_TECHNIQUE.md` et de `docs/14` (P6-01, P6-02).
