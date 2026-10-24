# Coaching Platform — index directeur et mode d'emploi

**Statut** : spécifications de cadrage v1.1 ; source de vérité produit à valider avec le coach. **Nom commercial** : À DÉFINIR (pistes futures associant Antonino, Gianluca et coaching). **Architecture** : SaaS multi-organisations dès l'origine ; déploiement initial mono-coach. **Livraison** : application web responsive/PWA, coach et sportif sur PC/téléphone, portail admin.

## Comment utiliser les fichiers avec Claude Code
- Mettre `CLAUDE.md` et `00_INDEX.md` à la racine du dépôt ; garder `docs/` sous le même chemin.
- Déposer `SUIVI_IMPLEMENTATION.md` à la racine : c'est le journal de ce qui est **réellement implémenté**.
- Ouvrir Claude Code à la racine du dépôt et coller `PROMPT_DEMARRAGE_CLAUDE_CODE.md`.
- Faire **une phase, puis une user story à la fois**. Relire les tests d'acceptation avant chaque implémentation.
- Les spécifications sont des **objectifs** ; aucun composant, route ou intégration n'est présumé codé avant vérification du dépôt.

## Cartographie des 17 fichiers de référence
| Fichier | Responsabilité |
|---|---|
| `CLAUDE.md` | Directives de Claude Code, discipline de réalisation |
| `00_INDEX.md` | Vision globale, traçabilité, méthode |
| `docs/01_VISION_PRODUIT.md` | Vision, périmètre MVP/v2/v3, fonctionnalités exhaustives |
| `docs/02_ROLES_ET_PARCOURS.md` | Coach, sportif, admin, droits et scénarios métier |
| `docs/03_CRM_COACH_ET_AGENDA.md` | Clients, profils, planification, agenda |
| `docs/04_EDITEUR_PROGRAMMES.md` | Modèles, semaines, sessions, édition, publication |
| `docs/05_MOTEUR_RUNNING.md` | Types et données d'entraînements running |
| `docs/06_MOTEUR_MUSCULATION.md` | Types et données d'entraînements musculation |
| `docs/07_MOTEUR_HYROX_HYBRIDE.md` | Stations, circuits, mélange multi-disciplines |
| `docs/08_BIBLIOTHEQUE_ET_PROGRESSION.md` | Catalogue, versionnage et planification de progression |
| `docs/09_ESPACE_SPORTIF.md` | Consultation, exécution, résultats et feedback |
| `docs/10_DESIGN_UI_UX.md` | Cartes d'écrans desktop/mobile et accessibilité |
| `docs/11_BASE_DONNEES_ET_API.md` | Modèle relationnel, types métier et endpoints |
| `docs/12_ARCHITECTURE_SECURITE.md` | Multi-tenancy, auth, RLS, RGPD, infra, CI |
| `docs/13_PDF_MESSAGES_AUTOMATISATIONS.md` | Exports, invitations, emails, WhatsApp, rappels |
| `docs/14_TESTS_ET_ROADMAP.md` | Backlog priorisé, critères de recette, risques |
| `docs/15_DEMO_RECRUTEURS.md` | Storyboard démonstration 3 minutes, preuves techniques |

**Fichiers auxiliaires, hors des 17 de référence** : `PROMPT_DEMARRAGE_CLAUDE_CODE.md`, `SUIVI_IMPLEMENTATION.md`, `README_MAJ_V1_1.md` et `DEMARRAGE_APRES_MAJ.md`.

**Ajouts après la V1.1** : `docs/16_POSITIONNEMENT.md` (nom Coory, concurrent Athleex, différenciateurs `DIF-01` à `DIF-10` et leur phase), `CARNET_TECHNIQUE.md` (explication des choix techniques, mis à jour à chaque story).

## 3 espaces applicatifs et 4 surfaces
1. **Coach** : desktop complet + mobile complet pour créer/éditer ; la facturation SaaS n'est pas une fonctionnalité du coach sportif ; le **suivi de facturation de ses propres clients** (forfaits, paiements reçus, factures) est en revanche prévu (D-17), sans aucun encaissement par la plateforme.
2. **Sportif / client** : desktop + mobile orienté consultation, exécution et feedback ; pas de droit de modifier les prescriptions du coach.
3. **Admin plateforme** : gestion organisation, compte, support autorisé, état des abonnements, audit de la plateforme ; jamais accès arbitraire aux données sensibles des sportifs.

### Plans d'entraînement pris en charge
- Running pur, Musculation pure, Hyrox pur, Hybride (Running + musculation, Hyrox + running, etc.), rééducation et médical **hors périmètre** de prescription.
- Séance autonome, modèle de séance, modèle de semaine, macrocycle multi-semaines, version personnalisée par client.
- Nombre de séances variable : 1..14/semaine selon règles de validation métier ; interface optimisée pour 2..6 ; heures et journées libres, pas d'assignation de jour forcée.
- Un sportif peut avoir plusieurs programmes successifs et un programme courant ; règles de chevauchement à décider (OPEN-02).

## Sources fournies et ce qu'elles prouvent
Neuf PDF « BeHybrid - HYROX PREP - ANTONINO » fournis le 18 octobre 2026 (1 Full Body A, 5 pages Running, 3 pages Workload Hyrox). **Ils décrivent des exemples de séances pour un sportif et ne décrivent pas la totalité des pratiques du coach, ni une base universelle de prescription.**

| Fichier source | Observations directement visibles (exemples, non valeurs obligatoires) |
|---|---|
| `FULL BODY A.pdf` | Table « Core » et « Musculation » ; FRONT PLANK 3 x 45 sec, repos 15 sec ; LEG CURL ASSIS 3 séries et liste de reps 20-15-10-8 ; POMPES sous format EMOM 6 min ; commentaires coach |
| `Running.pdf` | Objectifs/date d'épreuves ; allures Zone 2 indiquées 6:40-7:15 min/km pour cet athlète ; semaines datées dès le 12/10/2026 ; 5 colonnes séances ; références « FULL BODY A » et « SEE THE WORKLOAD HYROX » |
| `Running_page 2.pdf` | Semaines 02/11 au 30/11/2026, endurance rapide, Hyrox Pace, Easy Run/Sortie Longue, renfo et circuit |
| `Running_page 3.pdf` et `Running_page 4.pdf` | Semaine du 07/12, compétition Hyrox Gent le 14/12 dans l'exemple, et semaines de fin décembre ; `page 3` et `page 4` se recoupent partiellement |
| `Running_page 5.pdf` | Semaines de janvier 2027 ; blocs `2 min à 5:00 + 2 min récup x5`, puis `3 min x5`, `4 min x6`, `4 min x7`, avec variations dans les autres parties de séance |
| `Workload Hyrox_page 1.pdf` | Séances Hyrox circuit avec RUN, SKI, ROW, BBJ, SB lunges, WB, AMRAP 25 min et répétitions de circuits |
| `Workload Hyrox_page 2.pdf` | Sled Push/Sled Pull, charges en kg, longueurs/distance en m, Time Cap 60 min, inclinaison tapis, blocs multiples |
| `Workload Hyrox_page 3.pdf` | « Full stations », Ski, Sled, BBJ, Lunges, WB ; séquences mélangées avec récupération et répétitions |

Les déductions **proposées** (à valider) comprennent : statut publié, comptes utilisateurs, RLS, notifications, RPE, programmation drag-and-drop, organisation SaaS, futur portail admin, collecte de consentement, historiques de version.

## Traçabilité des principales features (identifiants stables)
- `AUTH-` : login, invitation, rôles, memberships.
- `CRM-` : clients, profils, objectifs, contraintes.
- `LIB-` : exercices, blocs, modèles.
- `PRG-` : édition/programmes/semaines/versions.
- `RUN-`, `STR-`, `HYB-` : moteurs sportifs.
- `ATH-` : affichage et résultats sportif.
- `DOC-` : PDF et publications.
- `MSG-` : communication/automatisation.
- `ADM-` : gestion SaaS.
- `SEC-` : isolation organisation, confidentialité, audit.
- `QA-` : tests/observabilité/recette.
Chaque spec donne scénarios, règles et critère d'acceptation ; la roadmap les priorise.

## Décisions prises
- D-01 : développement initial avec un seul coach et de vrais retours terrain, données préparées pour un SaaS multi-coachs.
- D-02 : une PWA responsive est la première livraison, incluant modification complète des entraînements sur mobile coach.
- D-03 : modèle hybride natif, aucune discipline obligatoire.
- D-04 : PDF **et** espace sportif en ligne, issus d'une publication unique.
- D-05 : suivi après trois séances = règle de communication future, configurable et pas systématiquement un message à chaque séance.
- D-06 : pas de fonctionnalités IA indispensables pour le premier livrable.
- D-07 : nom de marque différé.
- D-08 (V1.1) : un seul dépôt Next.js/React/TypeScript, Supabase (PostgreSQL/Auth/Storage/RLS), SQL et Zod ; aucune couche backend redondante.
- D-09 (V1.1) : la liste des routes API indique des opérations métier, pas une obligation de créer une API REST pour chaque écran ; Server Actions/Functions et Route Handlers sont choisis au cas par cas.
- D-10 (V1.1) : le paiement est **prévu en P8 mais non implémenté** ; facturation portée par l'organisation, Stripe candidat à confirmer, sans hypothèse de prix ni de plan.
- D-11 (V1.1) : dépendances ajoutées à la phase utile, tests sécurité/RLS dès P1, suite E2E quand des parcours réels existent.
- D-12 (20/10/2026) : nom commercial de travail **Coory** (remplace D-07 « nom différé ») ; marques et nom de domaine à vérifier avant lancement. Premier design system sombre graphite + orange, remplacé par D-16.
- D-13 (20/10/2026) : pas de parité avec le concurrent Athleex ; dix différenciateurs retenus (`docs/16_POSITIONNEMENT.md`), insérés dans les phases existantes sans changer leur ordre.
- D-14 (20/10/2026) : contenu de la fiche sportif et règle « blessures » (champ minimal + consentement tracé) : voir OPEN-01 tranché dans `docs/14`.
- D-15 (20/10/2026) : allures par test de Cooper ou de 5 km, % de VMA par défaut modifiables : voir OPEN-13 tranché dans `docs/14`.
- D-16 (22/10/2026) : charte visuelle définitive **Coory, version rouge** (`#FF3347`), logo aux deux anneaux entrelacés (remplacé par D-19), thème sombre par défaut et thème clair au choix. Source de vérité : `COORY_DESIGN_SYSTEM.md` et `COORY_LOGO.md` (racine) ; jetons dans `src/styles/tokens.css`. Remplace la palette « corail » proposée dans `docs/10`.
- D-19 (22/10/2026) : nouveau logo **« C∞ry »** (C majuscule, les deux « o » fusionnés en une boucle infinie rouge, lettres couleur texte) en Space Grotesk Bold ; il remplace les anneaux entrelacés. **Space Grotesk** devient la police des titres H1–H3 et des grands chiffres (jamais sous 18 px), Geist reste celle de l'interface, Geist Mono celle des données. Tailles choisies par Antonino : mot de 40 px dans l'app sur ordinateur, boucle seule de 28 px sur téléphone, mot de 24–26 px sur les pages d'accès. Spécifications mises à jour à la racine.
- D-20 (22/10/2026) : **contraintes physiques** (données de santé, RGPD art. 9) : champ court sans diagnostic, enregistré **seulement pendant un accord en cours** (garanti par la base). L'accord vient **du sportif lui-même** depuis son espace **ou** est **noté par le coach** avec sa preuve (oral, écrit, formulaire signé) ; chaque accord et retrait est journalisé (journal en ajout seul) ; retirer l'accord **efface** ce qui avait été noté. Le sportif voit ce qui a été noté sur lui.
- D-38 (24/10/2026) : **menu de gauche et réglages** : « Assistant IA » au-dessus de Tâches, « Notifications » au-dessus de Messages ; en bas, un **menu du compte** (carte : photo, nom, rôle ; au survol ou au clic : Mon profil, Paramètres, Changer de compte, Thème, Se déconnecter, d'après la maquette d'Antonino) remplace les boutons thème et déconnexion ; « Paramètres » quitte la liste ; ordre de la section : Assistant IA, Messages, Tâches, Documents, Notifications (pastilles rouges sur Messages et Notifications). Le **thème** se choisit dans les Paramètres : **Clair, Sombre ou Système** (celui de l'appareil) ; clair par défaut (D-33).
- D-39 (24/10/2026) : **liste des sportifs, accès en icônes** : plus de libellés d'accès ; compte activé = petite icône message à côté du sexe (ouvre la conversation) et ligne vert très doux ; invitation envoyée = petite icône ; sans compte = seulement le bouton « Inviter ». En haut : sportifs actifs, en pause, compétitions à venir, fiches à compléter ; filtres statut et discipline dans l'adresse.
- D-40 (24/10/2026) : **liste des sportifs en tableau** (maquette d'Antonino, remplace la présentation de D-39 ; les règles d'accès restent) : colonnes Sportif, Statut, Type de programme, Objectif, Actions, triables ; cartes sur téléphone. Le **type de programme** (Running, Musculation, Hyrox, Hybride) devient un champ du sportif, choisi par le coach et **indépendant des objectifs**. Statut et type se changent d'un appui sur leur pastille, ou pour plusieurs sportifs cochés (barre d'actions groupées). Filtres Statut (avec nombres, « Tous » par défaut) et Type de programme. Lignes neutres, sans teinte.
- D-37 (24/10/2026) : **page Notifications réelle, en sections** : Messages non lus, Tâches du jour ou en retard, Factures en retard, Fiches à compléter ; calculée à partir des vraies données (rien de stocké), chaque ligne mène là où on s'en occupe. La cloche compte le total, « Messages » seulement les messages. Retours de séance et invitations acceptées : plus tard (P6).
- D-36 (24/10/2026) : **paiements reçus et Comptabilité, première version** (retour de Gianluca). Le chiffre d'affaires suivi est l'**argent reçu**, à la date du paiement (un forfait payé d'avance compte ce jour-là). Chaque paiement : sportif, date, montant **TVA comprise**, taux (21 % par défaut, 12, 6 ou 0 %, à confirmer par le comptable, OPEN-17), mode (espèces, virement, Bancontact, autre) ; HTVA et TVA calculés. Fenêtre « Nouveau paiement » partout (Créer → Paiement reçu, Comptabilité). Tableau de bord : carte **« encaissés cette semaine »** à la place de « messages non lus » ; les non lus deviennent une **pastille rouge chiffrée** sur « Messages » et la cloche. Page Comptabilité : semaine, mois, TVA du mois, compte bancaire, liste filtrable. Gianluca est assujetti à la TVA ; une séance annulée d'un forfait est **reportée** (règle des forfaits, tranche suivante). Toujours aucun encaissement par Coory (D-17).
- D-35 (23/10/2026) : **étape 4a, partie 1 : tableau de bord et agenda, retouchés avec Antonino**. Cartes du haut : coachings du jour, heures de la semaine, **Tâches** (ronds à cocher façon widget de l'iPhone ; une tâche cochée quitte la carte et passe dans « Terminées ») et **Messages** (non lus, bouton « Répondre » qui ouvre la conversation du sportif). Sous l'agenda : Programmes en cours, Séances à venir, **Activité financière** (factures envoyées et paiements reçus du mois, paiements en attente). Agenda : toute la largeur ; téléphone à la hauteur de l'écran ; ordinateur 40 px par heure, défilant dans sa carte ; un clic sur un créneau vide ouvre « Nouvelle séance » pré-remplie ; **glisser-déposer** à la souris ou par appui long, et pour une séance hebdomadaire le choix « seulement cette date » ou « toute la série ». **Une seule fenêtre « Nouvelle séance »** dans tout l'espace coach (plus de page à part) ; type Individuelle d'abord ; disciplines Musculation, Hyrox, Running, Hybride ; **nouveau sportif** tapé dans la fenêtre : sa fiche minimale est créée aussitôt (la séance lui est rattachée) et signalée **« à compléter »** dans Sportifs tant qu'il manque le nom de famille ou un moyen de contact. Vraies tables, remplies par le seul jeu de démo : tâches, messages (côté coach : lire, lu à l'ouverture, répondre ; ni e-mail ni WhatsApp ; le sportif n'y accède pas encore, P7) et suivi des factures (D-17 étape A en lecture ; saisie et document légal en 4f, après OPEN-17). Premières pages Tâches, Messages et Facturation. La page **Séances** liste toutes les séances encadrées à venir ; les séances des programmes et les retours des sportifs (P6) y viendront en onglet. Les filtres discipline et sportif de l'Agenda sont remplacés par ceux du prototype.
- D-34 (23/10/2026) : **pages d'entrée au gabarit du prototype** (étape 3 de D-32). Inscription : cartes Coach / Sportif, « Nom de l'entreprise », jauge à 4 segments, **confirmation du mot de passe gardée** (choix d'Antonino) et case « J'ai 18 ans ou plus et j'accepte… » gardée (les conditions réservent Coory aux 18 ans et plus). Nouvelle page **/verifier-email** (adresse dans un cookie httpOnly d'une heure, jamais dans l'URL ; « Renvoyer l'e-mail » réel, réponse identique quelle que soit l'adresse). **Bienvenue** : écran du prototype quand l'inscription par e-mail a tout fourni (le bouton finalise le compte), formulaire seulement pour Google / Facebook / Apple. Durées réelles affichées (liens e-mail 1 h, invitations 7 jours) au lieu de celles du prototype.
- D-33 (23/10/2026) : **thème clair par défaut** (demande d'Antonino ; il remplace le « sombre par défaut » de D-16 et du prompt Claude Design §1) : `:root` porte les couleurs claires, `data-theme="dark"` les sombres, au choix de la personne et retenu dans son navigateur. Page de connexion **sur téléphone uniquement** : carte de marque (PLATEFORME DE COACHING, « Programmer, publier et suivre tes sportifs. », phrase d'accroche, boucle ∞ en filigrane) au-dessus du formulaire, centré dans la hauteur restante ; inscription et ordinateur inchangés.
- D-32 (23/10/2026) : **la construction suit le prompt Claude Design** (`COORY_PROMPT_CLAUDE_CODE.md`, racine) et ses prototypes (`docs/design/prototypes/`, à reproduire au pixel près), en 7 étapes vérifiées une à une avec Antonino, **et non plus l'ordre des phases** ; les phases restent écrites comme référence (`docs/14`, `SUIVI_IMPLEMENTATION.md`). Option (a) : chaque page avec ses **vraies fonctionnalités** (pas de `demo-data.ts` dans l'app ; les données d'exemple du prompt §8 pourront remplir la base locale). Modules pas encore construits : **visibles dans le menu sans badge « Bientôt »**, ils ouvrent la page du module, vide (jamais de faux chiffres). Connexion : panneau de marque du prompt sur ordinateur. Couleurs existantes gardées (règle 2 du prompt) ; adresses des pages avec l'organisation gardées (`/coach/o/[orgId]/…`).
- D-31 (23/10/2026) : **plus de page d'accueil publique** : `/` mène à la connexion (ou à l'espace si déjà connecté). Pages `/login` et `/inscription` redessinées d'après `COORY_AUTH_PAGES.md` (racine) : panneau de marque et formulaire sur ordinateur, une colonne sur téléphone, couleurs du projet inchangées, logique d'authentification inchangée.
- D-30 (23/10/2026) : **inscription libre** (avance une partie de P8-01) : un **coach** crée son compte et **son organisation**, un **sportif** crée un compte que son coach rattache ensuite par l'invitation existante. Champs : type de compte, prénom, nom, e-mail, téléphone facultatif, nom de l'activité (coach, facultatif), mot de passe et confirmation ; case « 18 ans ou plus et j'accepte les conditions et la politique de confidentialité » (acceptation datée et versionnée). **Adresse e-mail confirmée obligatoire.** Google, Facebook et Apple : **préparés**, boutons affichés seulement quand leurs clés existent (`docs/AUTH_FOURNISSEURS.md`). Conditions et confidentialité : pages **provisoires**, à faire valider par un juriste avant toute mise en ligne.
- D-29 (23/10/2026) : **couleurs des maquettes** : thème sombre en bleu nuit (fond #0B1019, panneaux #121821, gris bleutés), mesuré au pixel sur les images ; cartes, menu actif et blocs d'agenda plus franchement teintés, intensité réglée par thème (jetons `--tint-*`) pour que le thème clair reste lisible. Remplace le graphite de D-23/D-24 en sombre. Couleurs par discipline et thème clair inchangés.
- D-28 (23/10/2026) : **apparence cible d'après les maquettes d'Antonino** (`docs/design/MAQUETTES.md`, images dans `docs/design/maquettes/`). Tableau de bord refait comme la maquette avec de **vraies données** (séances de la semaine, sportifs actifs avec photos, agenda Semaine / Mois / Aujourd'hui, sportifs récents) ; ce qui dépend d'un module futur (programmes, factures, tâches, revenus) est dessiné avec « Bientôt » et sa phase, **jamais simulé**. Menu complet (Programmes, Séances, Facturation, Comptabilité, Bibliothèque, Tâches, Messages, Documents en « Bientôt », Paramètres = profil du coach), élément actif sur fond rouge teinté (écart assumé avec « actif jamais rouge »). **Photos de profil** réelles (sportif et coach, stockage privé, servies par l'app) ; photos de démo libres de droits (licence Unsplash). Profil coach : prénom, nom, entreprise. Téléphone : menu hamburger, agenda en 3 colonnes à faire défiler, en-tête centré. Chaque autre page suivra sa maquette quand sa phase arrive.
- D-27 (22/10/2026) : **agenda du coach** (P2-05) = ses **séances encadrées en présentiel** (collectives récurrentes, ex. « chaque mercredi 19 h sur piste », avec une liste d'inscrits ; individuelles avec un sportif) + un calque des **compétitions et objectifs datés** des sportifs, filtrable par discipline et sportif. La présence réelle (présent / absent) viendra avec l'espace sportif. L'**agenda du sportif** (séances de ses programmes) arrivera avec P4 à P6 ; rien n'est simulé avant.
- D-26 (22/10/2026) : **records personnels** = historique de performances datées (5 km, 10 km, semi, marathon, Hyrox avec sa catégorie) ; le record est le **meilleur temps calculé**, rien n'est écrasé. Liste d'épreuves fermée (OPEN-01).
- D-25 (22/10/2026) : app **plus colorée et plus intuitive** (demande d'Antonino) : champ **Sexe** facultatif (Femme / Homme / Non précisé, utile pour les catégories Hyrox) avec symbole **♀ rose / ♂ bleu ciel** à côté du nom (liste et fiche), avatars toujours à la couleur de discipline ; pastilles **cerclées** et valeurs colorées sur les cinq chiffres clés ; objectif encadré **entièrement** à la couleur de sa discipline (au lieu du liseré gauche) ; repères colorés (allures bleu Running, race pace orange Hyrox, FC rouge, charges violet) ; tableau de bord avec icônes et cartes teintées (comptes vert, invitations ambre). Contrastes revérifiés.
- D-24 (22/10/2026) : sur aperçus, Antonino veut une app moins sombre et plus colorée : graphite **plus clair** (fond #1C1C21, cartes #26262C) et **touches de couleur sur la fiche** (en-tête et avatar teintés par la discipline de l'objectif principal, icônes des chiffres clés dans des pastilles colorées, compétition en rouge, icônes de cartes rouges, liseré de discipline sur les objectifs). Écart assumé avec « un seul accent, rarement » ; contrastes revérifiés.
- D-23 (22/10/2026) : choix d'Antonino sur aperçus comparés : thème sombre en **graphite** (fond #16161A, cartes #1F1F24) au lieu du quasi-noir ; **couleurs par discipline** qui ont un sens (Running bleu, Musculation violet, Hyrox orange, Hybride turquoise), sur les objectifs puis les séances et le calendrier ; icônes neutres. Rouge texte #FF5C6C en sombre, logo inchangé (#FF3347 via `--logo-loop`). Contrastes revérifiés.
- D-22 (22/10/2026) : **contraste du thème sombre renforcé** (demande d'Antonino) : `--muted` #A3A3AA, `--faint` #828289, filets `--line` .14 et `--line-2` .36, fond de pastille rouge .11 ; tous les textes mesurés ≥ 4,5:1 (WCAG AA), contours de champs ≥ 3:1. Rouge de marque et logo inchangés ; thème clair inchangé.
- D-21 (22/10/2026) : **fiche sportif à onglets** d'après la maquette d'Antonino, **adaptée au design system** (en-tête en aplat sans dégradé, icônes neutres, un seul rouge par écran) ; les éléments sans fonctionnalité réelle (Créer un programme, menus Programmes / Séances / Bibliothèque, cloche, phases d'entraînement, photo de compétition) **ne sont pas affichés** avant leur phase. Réalisation en 3 étapes : vue d'ensemble et onglets, puis notes du coach et historique, puis graphique d'évolution des repères.
- D-17 (22/10/2026) : module **Business du coach**, pour que le coach n'ait besoin d'aucun autre outil pour suivre son activité. **Étape A, suivi** : offres et forfaits (carnet de séances, abonnement mensuel, programme en ligne), forfait de chaque client, séances restantes, échéances, statut payé / en attente / en retard, saisie manuelle d'un paiement reçu (espèces, virement, Bancontact sur place), relances, tableau de bord calculé sur des données réelles. **Étape B, factures** : PDF conformes (numérotation continue, mentions légales, TVA ou franchise) et export comptable. **Exclu : aucun paiement d'un client au coach ne transite par Coory** (pas d'encaissement en ligne pour le compte du coach). Distinct de P8 (abonnement du coach à Coory). Placement proposé : après P6, **à confirmer** ; l'étape B réutilise le moteur PDF de P5 et attend `OPEN-17`. Backlog `BIZ-01` à `BIZ-06` dans `docs/14`.
- D-18 (22/10/2026) : confirmation que la **musculation seule** est une discipline à part entière, au même niveau que Running, Hyrox et Hybride (déjà prévu par `docs/01` et `docs/06`). Un client de salle en remise en forme (cas des clients réguliers de Gianluca) reçoit un programme 100 % musculation et cardio de salle, sans élément running ni Hyrox. Les quatre disciplines sont indépendantes ou combinables.

## Questions ouvertes (avant production, pas nécessairement avant scaffolding)
- OPEN-01 : **tranché le 20/10/2026** (D-14).
- OPEN-02 : programme courant multiple, règles de chevauchement, dates/jours libres.
- OPEN-03 : gestion d'équipe (assistant coach) et délégation des sportifs ; V2.
- OPEN-04 : politique de conservation des données, demandes de suppression/export, pays de résidence.
- OPEN-05 : canaux de communication autorisés, consentements, fournisseurs et coûts.
- OPEN-06 : disposition PDF cible (une semaine/page, sections détaillées, anonymisation, logos), langues.
- OPEN-07 : catalogue d'exercices validé par le coach, valeurs de référence Running et sécurité des prescriptions.
- OPEN-08 : règles d'évolution de séances automatiques, toujours avec confirmation humaine.
- OPEN-09 : tarification SaaS, essai, TVA/facturation et fournisseur de paiement (**P8**, pas P6).
- OPEN-10 : partage du suivi d'entraînement et éventuelles intégrations Garmin/Strava (hors MVP).
- OPEN-11 : politique de récupération de compte, suppression d'organisation, comptes mineurs (bloquer les mineurs au démarrage tant que non cadré).
- OPEN-13 à OPEN-16 : voir `docs/16_POSITIONNEMENT.md` §6 (formules d'allures, groupes, API Strava/Garmin, fournisseur d'IA).
- OPEN-17 : règles de facturation du coach (mentions légales, TVA ou régime de franchise, numérotation, Peppol pour les clients entreprises) ; **Antonino les fait vérifier par un comptable**, avant l'étape B de D-17.

## Critère de fin du cadrage et premier développement
Une fois les décisions bloquantes de phase 1 validées : initialiser dépôt, configurer environnement, schéma organisation/membership et RLS, parcours authentification, CRUD client et test d'isolation entre deux organisations. **Ne pas coder l'éditeur complet avant ce socle.**
