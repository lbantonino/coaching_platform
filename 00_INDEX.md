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
1. **Coach** : desktop complet + mobile complet pour créer/éditer ; la facturation SaaS n'est pas une fonctionnalité du coach sportif.
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
- D-12 (20/10/2026) : nom commercial de travail **Coory** (remplace D-07 « nom différé ») ; marques et nom de domaine à vérifier avant lancement. Design system sombre graphite + orange (`src/app/globals.css`).
- D-13 (20/10/2026) : pas de parité avec le concurrent Athleex ; dix différenciateurs retenus (`docs/16_POSITIONNEMENT.md`), insérés dans les phases existantes sans changer leur ordre.
- D-14 (20/10/2026) : contenu de la fiche sportif et règle « blessures » (champ minimal + consentement tracé) : voir OPEN-01 tranché dans `docs/14`.
- D-15 (20/10/2026) : allures par test de Cooper ou de 5 km, % de VMA par défaut modifiables : voir OPEN-13 tranché dans `docs/14`.

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

## Critère de fin du cadrage et premier développement
Une fois les décisions bloquantes de phase 1 validées : initialiser dépôt, configurer environnement, schéma organisation/membership et RLS, parcours authentification, CRUD client et test d'isolation entre deux organisations. **Ne pas coder l'éditeur complet avant ce socle.**
