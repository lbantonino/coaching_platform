# Coaching Platform (nom commercial à définir)

Application web SaaS de programmation et de suivi d'entraînements Running, Musculation, Hyrox et Hybride, avec trois espaces : coach, sportif et administration de la plateforme.

> **État réel du code** : voir [SUIVI_IMPLEMENTATION.md](SUIVI_IMPLEMENTATION.md). Les documents de `docs/` décrivent la cible, pas ce qui est développé.
> **Pourquoi le projet est construit ainsi** (stack, architecture, sécurité, progression) : voir [CARNET_TECHNIQUE.md](CARNET_TECHNIQUE.md).

## Prérequis

- **Node.js 24 LTS** (fichier `.nvmrc`). Avec nvm : `nvm use` à la racine du projet.
- npm (fourni avec Node).

## Démarrage

```bash
npm install
npm run dev        # http://localhost:3000
```

## Environnements et variables

Un projet Supabase **par environnement**, jamais partagé :

| Environnement | Supabase | Données |
|---|---|---|
| DEV | Local, via le CLI et Docker (`npm run db:start`) | Seed de démonstration uniquement |
| STAGING | Projet cloud dédié, région UE (créé plus tard) | Données de test |
| PROD | Projet cloud dédié, région UE (créé plus tard) | Données réelles, jamais copiées en DEV |

```bash
cp .env.example .env.local   # puis remplir avec les valeurs de `npx supabase status`
```

- `.env.local` et tous les `.env*` sont ignorés par Git ; seul `.env.example` (noms sans valeurs) est versionné.
- Seules les variables `NEXT_PUBLIC_*` atteignent le navigateur. La clé secrète Supabase reste côté serveur.

## Base de données locale (DEV)

Prérequis : **Docker Desktop lancé**. Le CLI Supabase est une dépendance du projet (`npx supabase`), aucune installation globale.

| Commande | Rôle |
|---|---|
| `npm run db:start` | Démarre Supabase en local (Postgres, Auth, Storage, Studio). Le premier lancement télécharge les images Docker (plusieurs Go) |
| `npm run db:status` | Affiche les URL et les clés locales (à recopier dans `.env.local`) |
| `npm run db:reset` | Recrée la base locale de zéro : toutes les migrations puis `supabase/seed.sql` |
| `npm run db:new <nom>` | Crée un fichier de migration horodaté dans `supabase/migrations/` |
| `npm run db:test` | Lance les tests SQL/RLS (pgTAP) de `supabase/tests/` sur la base locale |
| `npm run db:types` | Régénère `src/lib/supabase/database.types.ts` depuis le schéma local (après chaque migration) |
| `npm run db:stop` | Arrête les conteneurs (les données locales sont conservées) |

Comptes de démonstration locaux (créés par le seed, mot de passe `demo-coach-local`) : `coach-a@example.test` (Organisation Démo A), `coach-b@example.test` (Organisation Démo B) et `admin@example.test` (administrateur de la plateforme, sans organisation).

URL locales utiles : Studio http://127.0.0.1:54323, boîte mail de test (Mailpit) http://127.0.0.1:54324.

**Règles des migrations** : le schéma ne change que par un nouveau fichier de migration, jamais à la main dans Studio. Une migration déjà commitée n'est pas modifiée ; on corrige avec une nouvelle migration. Chaque migration indique en commentaire son SQL de retour arrière.

## Commandes de qualité

| Commande | Rôle |
|---|---|
| `npm run lint` | ESLint (règles Next.js, React, TypeScript) |
| `npm run typecheck` | Génère les types de routes Next puis vérifie TypeScript strict (`tsc --noEmit`) |
| `npm run format` | Formate le code avec Prettier (les `.md` et `.pdf` de spécification ne sont jamais reformatés) |
| `npm run format:check` | Vérifie le formatage sans modifier |
| `npm run check` | Les trois contrôles ci-dessus, à lancer avant chaque commit |
| `npm run build` | Build de production |
| `npm run test:e2e` | Tests de parcours Playwright (ordinateur + téléphone) sur le build de production. Prérequis : Supabase local démarré et seedé |

## Architecture : monolithe modulaire

Une seule application Next.js (App Router) en TypeScript strict. Pas de backend séparé : le serveur Next.js exécute la logique métier, Supabase fournit PostgreSQL, Auth, Storage et RLS (à partir de P1).

```text
src/
  app/                 # pages et layouts, groupés par espace : (auth), (coach), (athlete), (admin)
    api/               # uniquement les vrais endpoints HTTP (téléchargement PDF, webhooks)
  domain/              # règles métier pures, sans UI ni accès base, testables unitairement
  features/<module>/   # cas d'usage d'un module : lectures, actions, schémas Zod
  components/ui/       # composants d'interface réutilisables
  lib/                 # intégrations techniques (client Supabase, etc.)
supabase/
  migrations/          # SQL versionné, seule façon de modifier le schéma
  seed.sql             # données de DÉMONSTRATION uniquement
```

Un dossier n'est créé qu'au moment où il reçoit son premier fichier.

### Lecture, mutation, HTTP

| Outil Next.js | Usage | Règle |
|---|---|---|
| **Server Component** | Lire des données et rendre une page | Lecture via les services de `features/` |
| **Server Action** | Mutation déclenchée par un formulaire de l'application | Appelable directement par n'importe qui : revérifier identité, rôle, organisation, propriété et Zod **dans l'action** |
| **Route Handler** (`app/api/`) | Vrai endpoint HTTP (fichier, callback, webhook) | Mêmes services et mêmes vérifications que les actions |

La logique métier n'est écrite qu'une fois, dans `domain/` et `features/` ; les trois points d'entrée l'appellent. La RLS PostgreSQL ajoute une défense en profondeur, elle ne remplace pas les vérifications serveur.

### Conventions

- `organization_id` sépare les locataires ; il est toujours déduit de la session côté serveur, jamais accepté tel quel depuis le navigateur.
- IDs UUID, champs `created_at`, `updated_at`, `created_by`.
- Interface en français, unités explicites (min/km, bpm, kg, m, km, s, répétitions).
- Aucune donnée personnelle réelle dans le code, les seeds ou les commits.

## Documentation

Règles d'engagement : [CLAUDE.md](CLAUDE.md). Carte des spécifications : [00_INDEX.md](00_INDEX.md). Feuille de route et critères de recette : [docs/14_TESTS_ET_ROADMAP.md](docs/14_TESTS_ET_ROADMAP.md).
