# 16 — Positionnement de Coory face à la concurrence et différenciateurs retenus

**Statut** : décisions produit validées par Antonino le 20/10/2026, comparatif corrigé le 22/10/2026 (D-17 business du coach, D-18 musculation). **Ce document décrit des objectifs, pas des fonctionnalités développées** : l'état réel du code est dans `SUIVI_IMPLEMENTATION.md`. Chaque différenciateur reste soumis aux règles de `CLAUDE.md` (tranche verticale, tests, pas de faux écran, IA jamais prescriptrice).

## 1. Nom

**Coory** (choisi le 20/10/2026). Les noms « Athleex » (concurrent direct existant) et « Athlix » (déjà utilisé par plusieurs produits) ont été écartés. Le nom est centralisé dans `src/config/brand.ts`. **À faire avant toute mise en ligne publique** : vérification des marques (BOIP Benelux, EUIPO) et disponibilité du nom de domaine.

## 2. Concurrent de référence : Athleex

Logiciel pour coachs sportifs lancé en août 2026 (Product Hunt), slogan « Personal trainer software that also runs your business ». Web, iOS, Android, 6 langues, gratuit jusqu'à 3 sportifs. Fonctions relevées (sources publiques : Product Hunt, Capterra) :

- constructeur d'entraînements par glisser-déposer (exercices, séries, répétitions, supersets, vidéos) ;
- fiche client : mensurations, composition corporelle, objectifs, photos de progression ;
- saisie de séance en direct par le sportif, notification au coach ;
- plans de nutrition et de compléments alimentaires ;
- messagerie, facturation multi-devises, tableau de bord business (MRR, ARR, ARPU, LTV, churn) ;
- « Churn Radar » (score de risque de départ sur 9 signaux), « Athlete Twin » (prédiction de 1RM, de risque de récupération, de date d'objectif), « Athleex Score » (note de 0 à 100).

## 3. Stratégie : un outil tout-en-un, des différences assumées

Coory vise un outil **tout-en-un** : le coach ne doit avoir besoin d'aucun autre logiciel pour programmer, suivre ses sportifs et suivre son activité (forfaits, paiements reçus, factures : D-17). Coory couvre **quatre disciplines natives, indépendantes ou combinables** : Musculation (y compris remise en forme et cardio de salle, D-18), Running, Hyrox et Hybride. Il ne copie pas Athleex fonction par fonction : il se différencie par la précision par sportif, les groupes, le PDF, la transparence des indicateurs et l'ancrage local (français, Belgique, données en UE).

**Écarté volontairement** : recommandations de compléments alimentaires, prédictions de « risque de récupération » ou de blessure, scores opaques sans base vérifiable. Raisons : responsabilité santé (Belgique/UE), règle du projet « pas de statistiques inventées », volume de données insuffisant.

| | Athleex | Coory |
|---|---|---|
| Disciplines | Coaching généraliste, surtout musculation (séries / répétitions) | **Musculation, Running, Hyrox, Hybride**, chacune seule ou combinée ; musculation complète (supersets, dropsets, tempo, RPE / RIR, machines) |
| Précision par sportif | Non relevé | **Allures et charges calculées pour chaque sportif** à partir de ses repères datés (test Cooper / 5 km, charges de référence) |
| Business du coach | Facturation multi-devises, paiements, tableau de bord MRR / ARR / churn | Suivi des forfaits et paiements reçus, factures PDF, export comptable (D-17) ; **aucun encaissement en ligne** |
| Nutrition | Plans de nutrition et de compléments | Non (responsabilité santé) |
| Programmes | Constructeur d'entraînements | Modèles de semaines et de cycles, copie et progression **validée par le coach** |
| Livrable sportif | Application | Application **et PDF identiques**, issus d'une version publiée figée |
| Coach sur téléphone | Non vérifié | Édition complète sur téléphone (exigence du cahier des charges) |
| Indicateurs | Scores et prédictions propriétaires | **Uniquement des données réelles**, règles d'alerte lisibles |
| Cible | Coachs individuels, international | Coachs en salle (remise en forme, musculation), coachs running et Hyrox, **run clubs et salles Hyrox** ; francophone (BE/FR) d'abord, données hébergées en UE |

### Forces et faiblesses de Coory face à Athleex (22/10/2026)

**Plus fort** :
- précision par sportif (allures en running, kilos en musculation), là où un coach pense en allures et en pourcentages ;
- séances de groupe personnalisées (run club, salle), quand Athleex est pensé pour le 1 à 1 ;
- PDF identique à l'application et import des programmes Sheets / PDF existants : le coach change d'outil sans tout ressaisir ;
- indicateurs lisibles (la règle de chaque alerte est visible), IA qui propose sans décider ;
- prudence santé (ni compléments ni prédiction de blessure) et ancrage local.

**Plus faible** :
- Coory n'est pas encore en production, quand Athleex est en ligne (applications iOS et Android, 6 langues, gratuit jusqu'à 3 sportifs) ;
- le business du coach arrive après P6, sans encaissement en ligne ni tableaux MRR ;
- pas de nutrition, messagerie seulement en P7 ;
- moyens d'une seule personne ; au 22/10/2026, seuls les repères datés et le calcul des allures existent parmi les différenciateurs ;
- pas de scores prédictifs, argument commercial auquel Coory renonce volontairement.

**À vérifier** : ouvrir un compte gratuit Athleex et y programmer une vraie semaine, pour contrôler la gestion des allures et l'édition sur téléphone (deux points non vérifiés ci-dessus).

## 4. Différenciateurs retenus

Identifiants stables `DIF-xx`, à reporter dans les stories correspondantes.

| ID | Différenciateur | Ce que ça change pour l'utilisateur | Phase | Prérequis / points d'attention |
|---|---|---|---|---|
| DIF-01 | **Import Google Sheets / PDF** | Le coach reprend ses programmes existants au lieu de tout ressaisir | Après P4 | Modèle de séance structuré stable (P3–P4) ; l'import propose, le coach valide chaque séance avant enregistrement |
| DIF-02 | **Boîte à outils Hyrox** | Calculateur d'allures et de temps de passage par station, simulation de course, compte à rebours et affûtage | P4 (calculs) puis P6 | Calculs déterministes et testés ; aucune valeur présentée comme une prescription |
| DIF-03 | **File « retours à traiter »** (radar transparent) | Tous les retours sportifs (RPE, douleur, commentaires, séances manquées) au même endroit, triés par urgence, avec la **règle** qui a déclenché chaque alerte | P6 (file) puis P7 (règles configurables) | Règles lisibles et paramétrables (ex. « RPE ≥ 9 trois fois », « aucune séance depuis 7 jours ») ; jamais de score opaque |
| DIF-04 | **Allures et charges calculées par sportif** | Running : le coach écrit « 4 × 1000 m allure seuil », chaque sportif reçoit SES allures en min/km. Musculation : « 4 × 8 à 75 % du 1RM », chaque sportif reçoit SES kilos | P4 | Repères datés par sportif (P2-03 fait : allures, VMA, charges de référence) ; formules documentées ; le coach peut corriger |
| DIF-05 | **Mode groupe / club** | Une séance envoyée à un groupe (run club, salle), personnalisée par sportif (allures, charges) | P4 (assignation) et P6 (vue sportif) | Notion de groupe dans l'organisation ; publication par sportif conservée (immutabilité) |
| DIF-06 | **Minuteur intégré à la séance** | EMOM, AMRAP, intervalles et récupérations enchaînés automatiquement pendant l'entraînement | P6 | Blocs structurés ; écran actif (Wake Lock) ; utilisable d'une main |
| DIF-07 | **Coory aux couleurs du coach** (marque blanche) | Logo et couleurs du coach dans l'espace sportif et dans les PDF | P5 | `branding_json` déjà prévu sur `organizations` ; contraste et accessibilité vérifiés |
| DIF-08 | **Saisie en langage courant (IA d'assistance)** | Le coach tape une séance en une phrase, l'IA propose une séance structurée **que le coach valide** | P9 (démo possible plus tôt) | Jamais d'enregistrement ni de publication sans validation ; pas de notes privées envoyées sans accord ; fournisseur et coûts à choisir |
| DIF-09 | **Sorties réelles importées** (Strava / Garmin) | Les séances réellement faites remontent automatiquement, comparées au prévu | P9 | **Étape 1 : import de fichiers .FIT / .GPX / .TCX** (aucune dépendance à une API). Étape 2 : API **seulement après vérification des conditions** : Strava limite depuis nov. 2024 l'affichage des données d'un utilisateur à d'autres personnes (cas du coach contesté) et interdit l'usage IA ; Garmin aurait suspendu les nouvelles demandes d'accès (à confirmer sur son portail) |
| DIF-10 | **Mode hors ligne pendant la séance** | La séance du jour reste lisible sans réseau ; le retour (RPE, fait/non fait) est mis en attente puis envoyé au retour du réseau | V3 / P9 | PWA : mise en cache de la version publiée + file d'envoi locale ; limites de synchronisation en arrière-plan sur iOS ; jamais de faux « envoyé » tant que le serveur n'a pas confirmé |

## 5. Ordre de réalisation

L'ordre des phases du cahier des charges ne change pas : **P2 → P6 d'abord** (utile à Gianluca, puis démo de bout en bout). Les différenciateurs s'insèrent dans leur phase naturelle :

- **P2** : repères datés par sportif (préalable à DIF-04).
- **P4** : DIF-04 (allures), DIF-05 (groupes), DIF-02 (calculateur Hyrox).
- **P5** : DIF-07 (marque du coach dans l'espace sportif et le PDF).
- **P6** : DIF-06 (minuteur), DIF-03 (file de retours), DIF-02 (simulation, compte à rebours).
- **Après P4** : DIF-01 (import Sheets / PDF), dès que le modèle de séance est stable.
- **P7** : DIF-03 (règles d'alerte configurables).
- **P9 / V3** : DIF-08 (IA d'assistance), DIF-09 (fichiers puis API), DIF-10 (hors ligne).
- **Business du coach (D-17)** : étape A (suivi) proposée après P6, placement à confirmer ; étape B (factures) après P5 et `OPEN-17`.

## 6. Questions ouvertes liées

- `OPEN-13` : **tranché le 20/10/2026** (test de Cooper ou de 5 km, % de VMA par défaut modifiables) : voir `docs/14`.
- `OPEN-14` : définition d'un groupe (club, salle) et droits associés, avant DIF-05.
- `OPEN-15` : conditions actuelles des API Strava et Garmin, à vérifier sur leurs portails officiels avant DIF-09 étape 2.
- `OPEN-16` : fournisseur d'IA, coûts, hébergement des données et consentement, avant DIF-08.
- `OPEN-17` : règles de facturation du coach, en vérification chez un comptable, avant l'étape B de D-17.
