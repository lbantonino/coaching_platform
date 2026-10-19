# Coaching Platform (nom commercial à définir)

Application web SaaS de programmation et de suivi d'entraînements Running, Musculation, Hyrox et Hybride, avec trois espaces : coach, sportif et administration de la plateforme.

> **État réel du code** : voir [SUIVI_IMPLEMENTATION.md](SUIVI_IMPLEMENTATION.md). Les documents de `docs/` décrivent la cible, pas ce qui est développé.

## Prérequis

- **Node.js 24 LTS** (fichier `.nvmrc`). Avec nvm : `nvm use` à la racine du projet.
- npm (fourni avec Node).

## Démarrage

```bash
npm install
npm run dev        # http://localhost:3000
```

## Commandes de qualité

| Commande | Rôle |
|---|---|
| `npm run lint` | ESLint (règles Next.js, React, TypeScript) |
| `npm run typecheck` | Génère les types de routes Next puis vérifie TypeScript strict (`tsc --noEmit`) |
| `npm run format` | Formate le code avec Prettier (les `.md` et `.pdf` de spécification ne sont jamais reformatés) |
| `npm run format:check` | Vérifie le formatage sans modifier |
| `npm run check` | Les trois contrôles ci-dessus, à lancer avant chaque commit |
| `npm run build` | Build de production |

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
