# Coory

Coory est une application web pour les coachs sportifs indépendants : running, musculation, Hyrox
et entraînement hybride. Elle réunit dans un seul outil ce qu'un coach gère d'habitude entre
tableurs, PDF, agenda et messages : ses sportifs, ses programmes, ses séances et son argent. Un
assistant IA intégré peut préparer chacune de ces actions, que le coach valide d'un clic.

**Bêta en ligne :** [coory-beta.vercel.app](https://coory-beta.vercel.app)

## Sommaire

- [Présentation](#présentation)
- [Fonctionnalités](#fonctionnalités)
- [Stack technique](#stack-technique)
- [Architecture](#architecture)
- [Structure du projet](#structure-du-projet)
- [Installation](#installation)
- [Tests](#tests)
- [Déploiement](#déploiement)
- [Crédits](#crédits)

## Présentation

Un coach indépendant jongle souvent avec plusieurs outils : un tableur pour les programmes, un
agenda pour les séances, des PDF envoyés à la main et un carnet pour les paiements. Coory remplace
cet ensemble par un espace unique, pensé pour son métier.

Quelques principes guident le produit :

- **Le téléphone d'abord.** Chaque écran est conçu pour le mobile, puis adapté à l'ordinateur.
  L'application s'installe sur l'écran d'accueil (manifeste web) et propose un thème clair, sombre
  ou celui de l'appareil.
- **Le coach décide.** L'assistant IA prépare, le coach valide. Rien n'est enregistré sans son clic.
- **Un espace isolé par coach.** Chaque organisation ne voit que ses propres données, avec une
  protection appliquée jusque dans la base.
- **Des données sensibles traitées à part.** Les notes de santé demandent l'accord du sportif et
  restent hors de portée de l'assistant.

L'interface est en français. L'application est en bêta privée : l'inscription demande un code
d'accès. La version actuelle couvre l'espace coach. L'espace sportif, la messagerie et les
invitations sont écrits mais masqués par des drapeaux de fonctionnalités
(`src/config/features.ts`), en attendant leur ouverture.

## Fonctionnalités

### Programmes d'entraînement

- Éditeur de programmes semaine par semaine (jusqu'à 52 semaines), découpé en phases.
- Quatre disciplines : running, musculation, Hyrox et hybride. Un programme hybride combine des
  séances de course et de musculation.
- Séances placées dans l'ordre de la semaine ou sur un jour fixe, avec plusieurs séances possibles
  le même jour.
- Séances de course construites par étapes (échauffement, course, récupération, repos, retour au
  calme), en durée ou en distance, avec une cible d'allure (plage en min/km, calculable depuis un
  pourcentage de VMA) ou une zone de fréquence cardiaque, et des blocs « Répéter N fois ».
- Séances de musculation à partir des exercices de la bibliothèque : séries en répétitions ou en
  secondes, charge en kilos ou en pourcentage du maximum du sportif, supersets et EMOM.
- Séances Hyrox par blocs : course, stations officielles, ergomètres, avec les charges officielles
  de la division du sportif ou celles choisies par le coach.
- Brouillon et publication : le sportif suit une version publiée et figée, le coach continue de
  modifier le brouillon. Un programme se duplique, s'archive, se désarchive ou se supprime.
- Onze modèles Coory prêts à l'emploi (5 km, 10 km, semi-marathon, marathon, seuil, VMA, Hyrox,
  force, hypertrophie, deux programmes hybrides), plus les modèles de programme et de séance du
  coach.
- Deux PDF par programme publié : l'agenda du programme (un sommaire puis une page par semaine) et
  les fiches de séances avec les repères du sportif.

### Assistant IA

- Le coach écrit sa demande en langage naturel, ou la dicte avec le micro du navigateur. Par
  exemple : « prépare un programme semi-marathon de 12 semaines, 4 séances par semaine ».
- L'assistant lit ce dont il a besoin (agenda, fiches, programmes, modèles, bibliothèque,
  paiements) puis prépare des actions : créer un sportif, planifier ou déplacer une séance, noter
  un paiement ou une dépense, créer une tâche, écrire ou modifier un programme, le publier,
  compléter une fiche, créer un exercice, ranger un document joint, changer un réglage.
- Chaque action apparaît sous forme de carte. Le coach la relit, puis la valide ou l'annule.
- L'assistant ne touche jamais aux données de santé, ni à la sécurité du compte (mot de passe,
  e-mail de connexion, suppression). Il peut ajouter une note privée mais ne lit jamais les notes,
  et il n'envoie aucun message.
- Il est limité à 100 demandes par coach et par mois, une limite appliquée par la base.

### Agenda et séances

- Agenda en vue Jour, 3 jours, Semaine, Mois ou Liste, avec les séances individuelles et
  collectives et des filtres par type.
- Création rapide d'une séance, y compris pour un nouveau client dont la fiche minimale se crée au
  passage. Séances hebdomadaires récurrentes, avec une date de fin facultative.
- Déplacement d'une séance par glisser-déposer, à la souris ou au doigt (appui long), pour une seule
  date ou toute la série.
- Changement de période en glissant le doigt sur téléphone.
- Prix, TVA et mode de paiement par séance, puis suivi des séances à encaisser.

### Suivi des sportifs

- Liste des sportifs avec recherche, tri et statut (actif, en pause, archivé).
- Une fiche par sportif, en onglets : vue d'ensemble, profil, agenda, programme, objectifs, repères,
  disponibilités, notes, documents et historique.
- Repères d'allure et de charge, records personnels, et calcul de la VMA et des allures depuis un
  test de Cooper ou de 5 km.
- Objectifs avec date de compétition et temps visé.
- Notes privées du coach, et notes de santé (blessures, points d'attention) enregistrées seulement
  avec l'accord du sportif.
- Signal « fiche à compléter » quand il manque de quoi joindre le sportif.

### Bibliothèque d'exercices

- Près de 700 exercices illustrés en musculation, cardio et Hyrox, avec les muscles travaillés, le
  matériel et les consignes en français.
- Recherche, filtres et favoris.
- Exercices propres au coach, avec leurs images.

### Gestion de l'activité

- Tableau de bord : prochaine séance, tâches à faire, montant encaissé dans la semaine, séances à
  venir, programmes en cours et activité financière.
- Paiements (espèces, virement, Bancontact ou carte, autre) et forfaits qui couvrent une période,
  par exemple trois mois payés d'avance. Dépenses par catégorie, ponctuelles ou mensuelles.
- Comptabilité simple : gagné, dépensé, résultat et « à encaisser », par semaine, mois ou année,
  avec la TVA. C'est un aperçu de gestion : Coory ne produit pas de factures.
- Pays et devise de l'organisation. En cas de changement de devise, le coach saisit le taux : le
  passé reste dans sa devise, ce qui est à venir est converti.
- Tâches avec échéance, priorité et listes.
- Documents classés par catégorie, liés ou non à un sportif, avec aperçu des PDF et des images.
- Notifications calculées depuis les vraies données : compétition qui approche, tâche à échéance,
  séance à encaisser, fiche à compléter.

### Compte et sécurité

- Inscription par e-mail avec confirmation de l'adresse, connexion Google, Facebook ou Apple quand
  elles sont configurées, « Se souvenir de moi » et mot de passe oublié.
- Export de toutes les données de l'organisation dans un fichier JSON (droit à la portabilité).
- Suppression du compte par le coach lui-même.
- Compte de démonstration partagé, protégé dans la base (identifiants figés, aucun dépôt de
  fichier) et remis à zéro chaque nuit.
- Pages légales : conditions, confidentialité, mentions légales.

## Stack technique

- **Framework** : Next.js 16 (App Router, Server Components, Server Actions, Turbopack).
- **Interface** : React 19, TypeScript 5 en mode strict, Tailwind CSS 4, icônes Lucide.
- **Validation** : Zod 4, sur le serveur comme dans les règles métier.
- **Base et comptes** : Supabase, avec PostgreSQL 17, Auth, Storage privé, RLS et pg_cron.
- **Assistant IA** : API Claude d'Anthropic, via le SDK officiel `@anthropic-ai/sdk`.
- **PDF** : `@react-pdf/renderer`, avec la police Plus Jakarta Sans embarquée.
- **Tests** : Vitest, pgTAP (`supabase test db`) et Playwright.
- **Qualité** : ESLint (configuration Next.js) et Prettier.
- **Hébergement** : Vercel pour l'application, Supabase pour la base et les fichiers.

## Architecture

### Vue d'ensemble

```text
Navigateur
   │
   ▼
src/proxy.ts            rafraîchit la session Supabase, redirections « optimistes »
   │
   ▼
src/app                 Server Components, Server Actions et Route Handlers
   │                    chaque entrée revérifie l'utilisateur et son organisation
   ▼
src/features            cas d'usage : lectures, écritures, schémas de formulaire
   │
   ├──► src/domain      règles métier pures (calculs, validations, mises en page)
   ▼
Supabase                PostgreSQL avec RLS, Auth, Storage privé
```

### App Router et groupes de routes

Les routes vivent dans `src/app`, regroupées par espace grâce aux groupes de routes de Next.js :
`(auth)` pour la connexion et le mot de passe, `(entree)` pour l'inscription et l'accueil du
nouveau coach, `(coach)` pour l'espace coach, `(athlete)` pour l'espace sportif, `(admin)` pour
l'administration de la plateforme et `(legal)` pour les pages légales.

Les pages qui dépendent d'une organisation portent son identifiant dans l'adresse :
`/coach/o/[orgId]/agenda`, `/coach/o/[orgId]/sportifs`, `/coach/o/[orgId]/programmes`. Quelques
Route Handlers servent des fichiers privés (photos, documents, images d'exercices), les PDF des
programmes, l'export des données et le retour des liens d'e-mail.

`src/proxy.ts` (l'ancien middleware, renommé dans Next.js 16) ne fait qu'une redirection rapide
vers la connexion. Ce n'est pas la protection des données : chaque page, Server Action et Route
Handler revérifie l'accès, et la base filtre en dernier ressort.

### Les couches du code

- **`src/domain`** : les règles métier pures. Allures et VMA, plan d'un programme, contenu des
  séances, publication, durées, montants et TVA, comptabilité, tâches, notifications, contenu des
  PDF. Ces modules n'importent que Zod : ni base, ni React, ni Next.js. Ils se testent directement
  avec Vitest.
- **`src/features`** : les cas d'usage, un dossier par sujet (sportifs, séances, programmes,
  facturation, documents, assistant…). On y trouve en général `queries.ts` pour les lectures
  (marqué `server-only`), `actions.ts` pour les Server Actions (`"use server"`) et `schemas.ts`
  pour la validation des formulaires.
- **`src/components`** : l'interface. `ui` pour les briques de base (boutons, champs, fenêtres,
  étiquettes), `layout` pour la structure (menu, en-têtes, barre mobile), `blocks` pour les blocs
  métier (grille de l'agenda, carte de séance, assistant), `programs` pour les cartes et le détail
  des séances, `brand` pour le logo.
- **`src/lib`** : les clients Supabase, le formatage des dates et des montants, le thème.

### Server Components et Server Actions

Les pages sont des Server Components. L'option `cacheComponents` de Next.js est activée : les
données liées à la requête (session, organisation) se lisent derrière des blocs `Suspense`, et les
données personnelles ne sont jamais prérendues ni mises en cache. Les écritures passent par des
Server Actions. Chacune commence par un garde (`requireOrgAccess`), valide sa saisie avec Zod,
écrit avec le client Supabase de l'utilisateur, puis rafraîchit les pages concernées
(`revalidatePath`). Les composants client (`"use client"`) se limitent à l'interactivité :
glisser-déposer, fenêtres, éditeurs, dictée.

### Plusieurs organisations, isolées

Coory est multi-organisation. Une organisation est l'espace privé d'un coach ou d'une structure,
et chaque donnée métier porte un `organization_id`. L'isolation tient à trois niveaux :

1. **Côté serveur**, `requireOrgAccess` valide l'identifiant reçu et vérifie que l'utilisateur est
   membre actif de cette organisation. Une organisation inconnue et celle d'un autre coach donnent
   la même réponse.
2. **Dans la base**, la sécurité au niveau des lignes (RLS) est activée sur les tables métier. Les
   politiques s'appuient sur une fonction `private.is_org_member(organization_id)`, rangée dans un
   schéma que l'API ne publie pas.
3. **Dans le stockage**, les photos, documents et images d'exercices sont dans des espaces privés.
   Ils sont servis par l'application avec la session de l'utilisateur, et les règles du stockage
   décident de l'accès.

La clé secrète de Supabase, qui contourne la RLS, est réservée à deux procédures serveur : l'accueil
d'un sportif invité et la suppression d'un compte. Le code d'accès de l'inscription est vérifié
dans Supabase par un crochet d'authentification et rangé haché. Enfin, `next.config.ts` ajoute des
en-têtes de sécurité à toutes les pages : pas d'affichage dans le cadre d'un autre site, type des
fichiers jamais deviné par le navigateur (`nosniff`), adresse d'origine réduite pour les autres
sites, micro autorisé pour la dictée seulement, HTTPS imposé en production. Les tests pgTAP
vérifient cette isolation.

### Assistant IA

L'assistant (`src/features/assistant`) suit une boucle courte, entièrement côté serveur :

1. Le coach envoie sa demande. Le serveur vérifie son accès, puis la base **réserve** la demande :
   organisation abonnée ou adresse autorisée, et quota mensuel non atteint.
2. Une étape correspond à un appel à l'API Claude, avec une consigne et une liste d'outils. La
   consigne et les outils sont mis en cache d'un appel à l'autre.
3. Les **outils de lecture** (chercher un sportif, voir l'agenda, lire un brouillon de programme…)
   s'exécutent tout de suite, avec les droits du coach, et leur résultat repart vers le modèle.
4. Les **outils d'écriture** ne s'exécutent jamais à ce stade. Chacun devient une proposition,
   validée par un schéma Zod strict, et s'affiche comme une carte. Un champ inconnu fait refuser la
   proposition, et ces schémas ne contiennent aucun champ de santé ni d'organisation.
5. Au clic sur « Valider », une Server Action dédiée revérifie l'accès et le schéma, puis appelle
   **la même logique que le formulaire habituel**. Cette validation n'appelle pas le modèle. Une
   carte liée (par exemple une tâche pour un sportif que l'assistant vient de proposer de créer)
   attend la carte dont elle dépend.

Garde-fous :

- six étapes au plus par demande et 100 demandes par coach et par mois, appliqués par des
  fonctions SQL ;
- une réponse coupée ou un refus du modèle n'exécute rien ;
- seuls le nom, le type et la taille d'un fichier joint partent vers le modèle, jamais son contenu ;
- la base ne garde que le nombre d'étapes et de jetons, ni la question ni la réponse ;
- la clé de l'API reste sur le serveur. Sans clé, l'assistant affiche qu'il n'est pas branché.

Pour les tests de parcours, un modèle simulé rejoue un script JSON. Il ne coûte rien et ne
s'active jamais sur Vercel.

## Structure du projet

```text
.
├── src/
│   ├── app/                    Routes (App Router)
│   │   ├── (auth)/             Connexion, mot de passe oublié, confirmation de l'e-mail
│   │   ├── (entree)/           Inscription et accueil du nouveau coach
│   │   ├── (coach)/coach/      Espace coach (tableau de bord, bibliothèque, comptabilité…)
│   │   │   └── o/[orgId]/      Agenda, sportifs et programmes d'une organisation
│   │   ├── (athlete)/app/      Espace sportif (masqué pour l'instant)
│   │   ├── (admin)/admin/      Administration de la plateforme
│   │   ├── (legal)/            Conditions, confidentialité, mentions légales
│   │   └── …                   Route Handlers : photos, documents, images, retour d'e-mail
│   ├── domain/                 Règles métier pures (training, billing, tasks, exercises…)
│   ├── features/               Cas d'usage : lectures, Server Actions, schémas
│   │   └── assistant/          Boucle de l'assistant, outils, cartes, exécution
│   ├── components/             ui, layout, blocks, programs, brand
│   ├── config/                 Marque, textes légaux, drapeaux de fonctionnalités
│   ├── lib/                    Clients Supabase, formatage, thème
│   ├── styles/tokens.css       Jetons de couleur du design system
│   └── proxy.ts                Session et redirections avant chaque requête
├── supabase/
│   ├── migrations/             Schéma, politiques RLS, fonctions SQL
│   ├── tests/database/         Tests pgTAP
│   ├── content/                Modèles de programmes et de séances Coory
│   ├── seed.sql                Données de démonstration (local uniquement)
│   ├── templates/              E-mail de confirmation
│   └── config.toml             Configuration de Supabase en local
├── tests/
│   ├── unit/                   Tests Vitest
│   └── e2e/                    Tests Playwright
├── scripts/                    Reset de la base, photos de démo, catalogue d'exercices
├── resources/exercise-library/ Sources et fabrication du catalogue d'exercices
└── public/                     Logos, icônes et images des exercices
```

## Installation

### Prérequis

- **Node.js 24**, la version indiquée dans `.nvmrc` et dans `package.json` (`engines`). Avec nvm :
  `nvm use`.
- **Docker Desktop**, lancé, pour faire tourner Supabase en local.
- Le CLI Supabase est fourni par les dépendances de développement : aucune installation globale
  n'est nécessaire.

### Démarrage

```bash
# 1. Dépendances
nvm use
npm install

# 2. Supabase local (Docker Desktop doit être lancé)
npm run db:start

# 3. Variables d'environnement
cp .env.example .env.local
npm run db:status   # affiche l'URL de l'API et les clés locales à reporter dans .env.local

# 4. Base locale : migrations, modèles Coory, données de démonstration et photos
npm run db:reset

# 5. Application
npm run dev         # http://localhost:3000
```

Les comptes de démonstration locaux et le code d'accès de l'inscription en local sont décrits en
tête de `supabase/seed.sql`. Les données de démonstration sont inventées et utilisent le domaine
réservé `example.test`. En local, Supabase Studio est sur `http://localhost:54323` et les e-mails
envoyés (confirmation, mot de passe oublié) sont visibles sur `http://localhost:54324`.

Pour remettre la base locale à zéro, utiliser `npm run db:reset` plutôt que `supabase db reset` :
le script recharge aussi les photos de démonstration, qu'un seed SQL ne peut pas déposer.

### Variables d'environnement

Le modèle est `.env.example`, à copier vers `.env.local`.

| Variable                               | Rôle                                                              | Portée              |
| -------------------------------------- | ----------------------------------------------------------------- | ------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`             | URL de l'API Supabase                                             | Navigateur, serveur |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Clé publique ; les données restent protégées par la RLS           | Navigateur, serveur |
| `SUPABASE_SECRET_KEY`                  | Clé secrète, réservée aux deux procédures serveur de confiance    | Serveur             |
| `AUTH_PROVIDERS`                       | Connexions sociales actives (`google`, `facebook`, `apple`)       | Serveur             |
| `ANTHROPIC_API_KEY`                    | Clé de l'API Claude pour l'assistant ; vide, il n'est pas branché | Serveur             |

Les deux variables Supabase publiques sont vérifiées au démarrage (`src/lib/env.ts`) : sans elles,
l'application et le build s'arrêtent avec un message explicite. `AUTH_PROVIDERS` peut rester vide
en local : seule la connexion par e-mail est alors proposée.

### Commandes

| Commande                            | Rôle                                                               |
| ----------------------------------- | ------------------------------------------------------------------ |
| `npm run dev`                       | Serveur de développement                                           |
| `npm run build` / `npm run start`   | Build et serveur de production                                     |
| `npm run lint`                      | ESLint                                                             |
| `npm run typecheck`                 | Types des routes Next.js, puis vérification TypeScript             |
| `npm run format` / `format:check`   | Prettier                                                           |
| `npm run check`                     | Lint, types, format et tests unitaires                             |
| `npm run db:start` / `db:stop`      | Démarre ou arrête Supabase en local                                |
| `npm run db:status`                 | URL et clés de Supabase en local                                   |
| `npm run db:reset`                  | Recrée la base locale avec ses données de démonstration            |
| `npm run db:new <nom>`              | Crée une nouvelle migration                                        |
| `npm run db:types`                  | Régénère les types TypeScript de la base                           |
| `npm run db:test`                   | Tests pgTAP de la base                                             |
| `npm run db:clean-tests`            | Retire de la base locale les données laissées par les tests        |
| `npm run content:modeles`           | Régénère la partie générée de `supabase/content/modeles_coory.sql` |
| `npm run test` / `npm run test:e2e` | Tests unitaires (Vitest) / tests de parcours (Playwright)          |

## Tests

L'application est testée à trois niveaux.

**Tests unitaires (Vitest).** Plus de 80 fichiers dans `tests/unit` couvrent les règles pures :
allures et VMA, plan et publication d'un programme, cartes des séances, montants et TVA,
comptabilité, notifications, contenu des PDF, boucle et cartes de l'assistant. Ils tournent sans
base ni navigateur.

```bash
npm run test
```

**Tests de la base (pgTAP).** Plus de 40 fichiers dans `supabase/tests/database` vérifient le
schéma, les politiques RLS et les fonctions SQL, à commencer par l'isolation entre organisations.
Chaque fichier s'exécute dans une transaction annulée à la fin. Supabase doit être démarré.

```bash
npm run db:test
```

**Tests de parcours (Playwright).** Plus de 40 fichiers de scénarios dans `tests/e2e` parcourent
l'application comme un utilisateur : inscription, fiche sportif, agenda, éditeur de programmes,
PDF, comptabilité, assistant, suppression du compte. La suite tourne sur deux configurations, un
ordinateur (Chromium) et un téléphone (Pixel 7). Elle construit le build de production et le
sert sur le port 3100. L'assistant y utilise le modèle simulé, sans aucun appel payant. En fin de
suite, les données créées par les tests sont retirées de la base locale.

```bash
npx playwright install   # la première fois : navigateurs de Playwright
npm run db:start         # si Supabase n'est pas déjà démarré
npm run db:reset         # base de démonstration propre
npm run test:e2e
```

Avant un commit, `npm run check` enchaîne le lint, les types, le format et les tests unitaires.

## Déploiement

La bêta tourne sur Vercel pour l'application et sur Supabase pour la base, les comptes et les
fichiers, dans l'Union européenne.

### Supabase

1. Créer un projet Supabase dans une région de l'Union européenne.
2. Lier le dépôt au projet, puis appliquer les migrations :

   ```bash
   npx supabase link --project-ref <identifiant-du-projet>
   npx supabase db push
   ```

   Le fichier `supabase/seed.sql` n'est jamais appliqué en production.

3. Exécuter `supabase/content/modeles_coory.sql` dans l'éditeur SQL pour charger les modèles Coory.
   Le fichier se rejoue sans risque : il met à jour les modèles Coory et ne touche pas à ceux des
   coachs.
4. Dans Authentication, reporter les réglages de `supabase/config.toml` : URL du site et adresses
   de retour (domaine de production), confirmation de l'e-mail obligatoire, e-mail de confirmation
   (`supabase/templates/confirmation.html`), serveur SMTP pour les e-mails de compte, et
   fournisseurs Google, Facebook ou Apple si besoin.
5. Activer le crochet « Before User Created » sur la fonction
   `public.before_user_created_access_code`, puis définir le code d'accès de l'inscription dans
   l'éditeur SQL avec `private.set_signup_access_code`. Sans code enregistré, les inscriptions
   restent fermées.
6. L'assistant s'ouvre par organisation abonnée ou par adresse autorisée. Ces deux réglages se font
   par l'administrateur, directement en base ; aucun écran ne les expose.

### Vercel

1. Importer le dépôt dans Vercel. Le framework Next.js est détecté et la version de Node vient de
   `engines` dans `package.json`.
2. Définir les variables de `.env.example` avec les valeurs du projet Supabase de production et la
   clé de l'API Claude. Les variables Supabase sont nécessaires au build : elles doivent exister
   dans chaque environnement Vercel qui compile le projet (Production, et Preview pour les aperçus
   de branche).
3. Déployer. Les pages de l'espace coach déclarent une durée maximale de 300 secondes, le temps
   qu'une étape de l'assistant peut demander, et les Server Actions acceptent des envois jusqu'à
   5 Mo (photos et documents).

## Crédits

- Données et images des exercices de musculation et de cardio :
  [Exercise data by RepDB (repdb.co)](https://repdb.co).
- Police Plus Jakarta Sans, sous licence SIL Open Font License.
- Photos des sportifs fictifs de démonstration : Unsplash, en local uniquement.

---

Antonino Lo Bianco · 2026
