# CLAUDE.md — Coaching Platform (nom commercial à définir)

> Ce fichier est la règle d'engagement de Claude Code. Il ne remplace pas les spécifications métier dans `docs/`. Produit : SaaS multi-coachs dès la conception, première mise en service pour un seul coach (Gianluca). Date de cadrage : 18 octobre 2026. Langue interface : français, internationalisation possible plus tard.

## Mission
Construire progressivement une application web responsive/PWA de programmation et suivi sportifs, permettant à un coach de gérer ses sportifs et de créer des programmes Running, Musculation, Hyrox et Hybride, puis aux sportifs de consulter, exécuter et commenter leurs séances. Fournir un portail d'administration SaaS séparé. Le nom provisoire « Coaching Platform » est un identifiant de travail ; **ne jamais choisir automatiquement « BeHybrid » comme nom commercial**. Les fichiers BeHybrid fournis sont des références de workflow et de données d'entraînement, pas la marque du logiciel.

## Documents de référence — ordre de lecture
1. `00_INDEX.md` : carte et décisions structurantes.
2. `docs/01_VISION_PRODUIT.md` + `docs/02_ROLES_ET_PARCOURS.md` : mission, personas, frontières.
3. `docs/04_EDITEUR_PROGRAMMES.md`, `docs/05_MOTEUR_RUNNING.md`, `docs/06_MOTEUR_MUSCULATION.md`, `docs/07_MOTEUR_HYROX_HYBRIDE.md` : métier et édition.
4. `docs/11_BASE_DONNEES_ET_API.md` + `docs/12_ARCHITECTURE_SECURITE.md` : contrats et sécurité.
5. `docs/14_TESTS_ET_ROADMAP.md` : définition du terminé et ordre d'exécution.
6. Pour chaque fonctionnalité, lire **le document correspondant** ainsi que la section associée de la roadmap ; ne pas relire tout le dossier sans besoin.

## Contraintes non négociables
- L'architecture est **multi-tenant** (plusieurs organisations/coachs sans fuite de données), même lorsque la première organisation ne contient qu'un coach.
- Il existe **trois rôles / espaces** : coach, sportif et administrateur de plateforme ; coach et sportif ont chacun une UX desktop ET mobile. Une messagerie n'est pas un troisième rôle.
- Un programme peut être purement Running, Musculation, Hyrox ou mixte/hybride : **ne pas forcer Hyrox** comme objectif.
- Exercices -> blocs -> modèles de séance -> modèles de semaine -> programme client -> version publiée. Les modèles restent inchangés quand le coach personnalise une copie.
- Entraînements complexes = objets structurés, typés et versionnés, pas un gros champ de texte libre. Prévoir aussi un champ de notes libres.
- Une séance client publiée, son PDF et l'affichage côté sportif proviennent d'une même **version figée** ; les modifications ultérieures créent un brouillon ou une nouvelle publication explicite.
- Toute mutation est autorisée côté serveur selon utilisateur, organisation, droit d'accès et appartenance ; sécuriser également par RLS PostgreSQL. Ne jamais accepter librement un `tenant_id` du navigateur.
- Mobile coach : création, édition et publication réellement utilisables, pas une simple vue consultation. Mobile sportif : séance lisible et utilisable pendant l'entraînement.
- Pas de fausses données dans les écrans de production ; les seeds sont clairement identifiés comme démonstration et réservés au développement/tests.
- L'automatisation de messages doit respecter consentement, choix du canal, désinscription, règles métier ; l'IA n'est pas prescriptrice et ne modifie jamais un programme sans validation coach.

## Approche de développement obligatoire
1. Avant de coder, expliquer en 10 lignes maximum la fonctionnalité, son document source, les tables/API/composants touchés, risques et tests.
2. Proposer **une tranche verticale** (UI + règles + stockage + droits + tests) réalisable et vérifiable, pas 15 modules simultanés.
3. Si une règle métier manque, ajouter `OPEN-XXX` à `docs/14_TESTS_ET_ROADMAP.md` et demander une décision, sans la présenter comme constatée.
4. Faire migrations explicites avec rollback/reproductibilité, pas de changements manuels incontrôlés en base.
5. Implémenter types et validations partagés (Zod), règles métier côté serveur, tests unitaires + intégration + parcours Playwright.
6. Après chaque tâche, rapporter : fichiers créés/modifiés, commandes, résultats des tests, limitations, points à valider, tâche suivante. Mettre à jour `SUIVI_IMPLEMENTATION.md`.
7. N'annoncer « terminé » qu'après test local/exécuté. Si des secrets ou services manquent, marquer « intégration préparée, non testée en réel ».

## Stack V1.1 — décisions retenues (ne pas suréquiper)
**Un seul dépôt, une seule application et un seul langage applicatif : TypeScript.** SQL est conservé pour les migrations/policies PostgreSQL ; HTML/CSS sont normaux pour les interfaces/PDF. Le choix de technologies vise le besoin réel, pas un catalogue d'outils.

| Besoin | Solution retenue | Moment |
|---|---|---|
| Web coach/sportif/admin, desktop et mobile | Next.js App Router + React + TypeScript strict | P0 |
| Styles | Tailwind CSS ; composants accessibles natifs ou shadcn/ui uniquement à la demande | P0 puis selon écrans |
| Règles métier et API internes | Modules TypeScript + Server Components pour la lecture ; Server Actions/Functions pour les mutations de l'application ; Route Handlers pour téléchargements, callbacks ou accès HTTP utile | À mesure des fonctionnalités |
| Base, sessions, comptes et fichiers privés | **Un** projet Supabase par environnement : PostgreSQL + Auth + Storage + RLS ; client officiel Supabase, SSR conforme à sa documentation actuelle | P1 |
| Données, intégrité et validation | SQL migrations versionnées + contraintes/transactions ; Zod dans les frontières serveur | P1 puis par story |
| Tests | `typecheck`/lint dès P0 ; Vitest au premier module métier ; tests d'isolation SQL/RLS dès P1 ; Playwright lorsqu'un parcours existe | Progressif |
| Documents PDF | Choix d'un seul moteur PDF TypeScript/Node après prototype réel et vérification du rendu | P5 |
| Abonnements | Fournisseur de paiement à confirmer (Stripe est **une option**, pas une dépendance installée) ; état métier et webhooks sûrs | P8 |

**Pas de serveur Express/NestJS séparé, pas de microservices, pas de GraphQL, pas de Redis/queue, pas de Docker obligatoire, pas de Prisma/Drizzle, pas de Redux global, pas de seconde base de données** au démarrage. Ces outils ne sont pas interdits à vie ; il faut démontrer un besoin concret, vérifier qu'il n'est pas couvert par la stack actuelle et faire valider une courte ADR avant de les ajouter. Ne jamais installer deux bibliothèques faisant le même travail sans justification.

**En particulier :** les chemins `/api/v1/...` dans `docs/11_BASE_DONNEES_ET_API.md` sont des *contrats fonctionnels indicatifs*, pas une obligation de créer des endpoints REST pour chaque formulaire. Les composants serveur, les actions et les routes API partagent les mêmes services de domaine et la même vérification d'autorisation. Chaque Server Action est appelable directement : revérifier identité, rôle, organisation, propriété de la ressource et Zod **dans l'action**, puis s'appuyer en complément sur RLS. Ne pas désactiver RLS pour simplifier.

**SaaS** : un coach/une structure = une organisation (`organization_id`). Dès P1, isolation réelle entre organisations, testée avec deux tenants. Les utilisateurs et sportifs ne sont pas les clients facturés par défaut : l'abonnement commercial appartient à l'organisation. **Pas de Stripe, de prix, de limitation artificielle ni d'écran facturation avant P8**, sauf besoin métier confirmé ; les tables de facturation proposées dans la spec restent un design futur. Le modèle organisationnel doit néanmoins permettre à terme des comptes indépendants et des studios multi-coachs. Distinct de cet abonnement : le **suivi de facturation des clients du coach** (D-17 : forfaits, paiements reçus, factures, export comptable) est prévu, mais **aucun paiement d'un client au coach ne transite par la plateforme**.

**Exploitation :** PWA signifie ici application *responsive installable si validée plus tard*, pas offline garanti. Pas de cron/worker tant qu'aucun traitement asynchrone réel ne le nécessite. Les e-mails/WhatsApp sont des intégrations ultérieures, pas des envois simulés présentés comme réussis. Aucune clé de service privilégiée dans le navigateur.


## Mobile first (demande d'Antonino, 23/10/2026, priorité haute)
Tout nouvel écran ou toute retouche se conçoit **d'abord pour le téléphone** (≈ 390 px), puis s'élargit vers la tablette et l'ordinateur. Concrètement : écrire les classes de base pour le mobile et ajouter `md:` / `lg:` pour les grands écrans ; cibles tactiles ≥ 44 px ; pas de tableau ou de grille illisible sur téléphone (liste, colonnes défilantes ou cartes à la place) ; chaque story est vérifiée et capturée **en premier sur téléphone**, puis sur ordinateur, en sombre et en clair.

## Charte visuelle « Noir, blanc et violet » (D-77, 01/11/2026)
Source de vérité du **style** (voir `docs/design/README.md`) : les jetons `src/styles/tokens.css` et les composants de l'app, le design system de la maquette « Sportifs » du 03/11/2026 (`docs/design/design-system/` et `docs/design/composants/`), la fiche `docs/design/COORY_VIOLET_ACCENTS.md` et le kit de marque `docs/design/coory-brand/` (copié dans `public/brand/`). Elle remplace « Graphite & Or » (D-63) ; les anciennes maquettes ont été retirées le 04/11/2026 (historique Git). `COORY_PROMPT_CLAUDE_CODE.md` reste la référence du **contenu** de chaque page, pas de son style. Règles : jetons de `src/styles/tokens.css` uniquement (jamais de couleur en dur) ; violet `--violet` rare (page active, liens, aujourd'hui, « maintenant », assistant IA, compteurs, progression) ; action principale `--cta` blanche en sombre, noire en clair ; police unique Plus Jakarta Sans, **jamais de police mono** ; ne pas changer tailles, polices ni graisses du design validé ; logo définitif (04/11/2026) via `<CooryLogo />` / `<CooryMark />` (`src/components/brand/`, rendus selon le thème par `themed-logo.tsx`), jamais redessiné (règles : `docs/design/coory-brand/README.md`) ; charger les compétences de design (Taste, Front-End Design, UX Pro Max, Apple Design, Emil) avant tout travail de design ; chaque écran modifié vérifié sur téléphone ET ordinateur, en sombre ET en clair.

## En-tête des pages « à l'intérieur » d'une autre (règle d'Antonino du 05/11/2026, D-124)
Toute page avec un retour (Créer / Modifier un exercice, Inviter, Nouveau sportif, Modifier la séance, fiche d'un sportif, page d'une séance…), **y compris les pages futures, même si une maquette dessine autre chose** :
- **Ordinateur** : le chemin tient sur **une seule ligne** dans la carte d'en-tête, qui garde sa hauteur de base (64 px) : `[icône de la page] ← Page précédente · Page en cours` (ex. « ← Bibliothèque · Créer un exercice », « ← Coaching force · Modifier la séance »). « ← Page précédente » ramène là où on était ; jamais de titre ni de phrase sur une deuxième ligne. Les boutons de l'en-tête font 32 px sur ordinateur (plus de recherche globale dans l'en-tête depuis D-146).
- **Téléphone** : le retour est dans la barre du haut (« ☰ ← Page précédente  IA cloche ») ; le titre de la page (et son bouton à droite, ex. la corbeille) est en tête du contenu, **à 20 px sous la barre** pour respirer.
- Tout passe par `PageHeader` (`back`, `title`, `titleAside`, `visibleTitle`) : ne jamais recréer un en-tête à la main.

## Conventions de code
- `src/domain/` = règles et types indépendants de l'UI ; `src/features/` = cas d'usage ; `src/app/` = pages ; `src/components/` = UI réutilisable ; `supabase/migrations/` = SQL.
- `organization_id` pour la séparation des locataires ; `coach_id` pour le responsable ; `athlete_user_id` pour le compte sportif si activé.
- `template_id + template_version + snapshot_json` ou équivalent pour conserver l'origine **et** la copie personnalisée. Une publication est immuable.
- ID UUID ; champs `created_at`, `updated_at`, `created_by` et éventuellement `deleted_at` ; contraintes en base en plus de Zod.
- Transitions d'état explicites (brouillon -> publié -> remplacé/archivé), idempotence des actions sensibles (publication/envoi).
- UI en français ; unités affichées clairement : min/km, bpm, kg, m, km, secondes, répétitions.
- Aucun numéro de téléphone, email, données personnelles de sportifs réels dans des seeds ou commits. Références PDF = données d'exemple à anonymiser pour les démos.

## Démarrage de chaque session Claude Code
1. Lire `00_INDEX.md`, `SUIVI_IMPLEMENTATION.md` et la section « phase actuelle » de `docs/14_TESTS_ET_ROADMAP.md`.
2. Vérifier structure du dépôt, statut Git, package.json, migrations et tests existants.
3. Vérifier la stack V1.1 ci-dessus ; demander validation du petit périmètre prévu ; ne jamais générer tout le SaaS en un seul passage et ne jamais réinitialiser un projet déjà codé sans analyser les changements existants.
4. Exécuter une tranche, tester, consigner, proposer suivante.

## Carnet technique obligatoire (demande d'Antonino, 20/10/2026)
`CARNET_TECHNIQUE.md` explique à Antonino **pourquoi** chaque choix a été fait (stack, architecture, sécurité, progression), pour qu'il puisse le relire et l'expliquer à un recruteur. **À la fin de chaque story**, en plus de `SUIVI_IMPLEMENTATION.md` : ajouter un court paragraphe dans « La progression » (quoi, pourquoi maintenant, ce qu'on a appris), compléter les autres sections si un nouvel outil, dossier, concept ou incident apparaît, et mettre à jour la date en tête. Ton simple, paragraphes courts, pas de détail ligne par ligne.

## Rappel Docker obligatoire (demande d'Antonino, 19/10/2026)
Supabase DEV tourne en local dans Docker. **À chaque session**, sans attendre qu'on le demande :
- **Au début**, vérifier `docker ps --filter name=coaching-platform`, puis dire clairement soit « Lance Docker Desktop puis `npm run db:start` » (si la tâche touche la base, l'auth, les migrations, les tests d'intégration ou l'app avec données), soit « Pas besoin de Docker pour cette tâche ».
- **À la fin** (récap final, fin de journée, changement de projet), si les conteneurs tournent : « Pense à arrêter : `npm run db:stop` puis quitter Docker Desktop ».

## Critère de succès concret
Un coach crée un client 4 séances/semaine, applique une trame sur 8 semaines (Sortie longue, Endurance, Race Pace, Circuit), personnalise chaque séance, duplique/progresse une semaine, publie et exporte un PDF ; le sportif consulte la version publiée sur mobile, marque une séance faite et saisit RPE/commentaires ; le coach voit le retour dans sa fiche. Ce parcours est documenté dans `docs/15_DEMO_RECRUTEURS.md`.
