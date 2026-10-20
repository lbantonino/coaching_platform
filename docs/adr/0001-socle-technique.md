# ADR 0001 — Socle technique de Coory

- **Statut** : accepté (20/10/2026), story P0-06.
- **Décideur** : Antonino, sur proposition argumentée.

## Contexte

Une seule personne développe, avec l'aide de Claude Code, une application SaaS multi-organisations (coachs isolés les uns des autres), avec trois espaces (coach, sportif, administration), utilisable sur ordinateur et téléphone. Contraintes : isolation stricte des données, publications immuables, coût de maintenance faible, pas de sur-équipement (`CLAUDE.md`).

## Décision

| Besoin | Choix | Pourquoi ce choix suffit | Alternatives écartées (pour l'instant) |
|---|---|---|---|
| Interface + serveur | **Next.js 16 (App Router), React 19, TypeScript strict** | Une seule application : pages, Server Actions et Route Handlers partagent la même logique métier | Backend séparé Express/NestJS : double maintenance sans besoin |
| Base, comptes, fichiers | **Supabase** (PostgreSQL + Auth + Storage) | Un seul service ; la **RLS** PostgreSQL isole les organisations au niveau de chaque ligne | Seconde base, auth maison : plus de risques de sécurité |
| Accès aux données | Client Supabase + **types générés** depuis le schéma | Requêtes typées sans couche supplémentaire | Prisma / Drizzle : second modèle de données à synchroniser avec les migrations et la RLS |
| Schéma | **Migrations SQL versionnées** | Base reproductible (`db:reset`), retour arrière documenté | Modifications manuelles : non reproductibles |
| Validation | **Zod** aux frontières serveur | Toute donnée du navigateur est vérifiée avant usage, en plus des contraintes SQL | — |
| Style | **Tailwind CSS 4** + tokens du design system | Couleurs, rayons et typographie déclarés une fois (`globals.css`) | Kit de composants complet : poids et styles imposés |
| Icônes | **Lucide** | Imposé par le design system | — |
| Tests | **pgTAP** (base/RLS), **Vitest** (règles pures), **Playwright** (parcours ordinateur + téléphone) | Chaque niveau teste ce qu'il voit le mieux ; la sécurité est prouvée par des contre-épreuves | — |
| Développement local | **Supabase dans Docker** | Hors ligne, gratuit, remise à zéro en secondes ; Docker n'est **pas** utilisé en production | Projet cloud de développement : resets lents, quotas |

Non installés tant qu'aucun besoin réel ne le justifie : GraphQL, Redis/files de messages, gestionnaire d'état global, Stripe (P8), moteur PDF (choisi en P5), fournisseur e-mail (P7), fournisseur d'IA (DIF-08, OPEN-16).

## Conséquences

- **Positives** : un seul langage applicatif (TypeScript, plus SQL), une seule application à déployer, sécurité en trois couches (proxy, garde-fous serveur, RLS) testée automatiquement.
- **Négatives / à surveiller** : dépendance à Supabase (atténuée : PostgreSQL standard et migrations SQL portables) ; Next 16 avec Cache Components impose des règles strictes (session et paramètres d'URL derrière `Suspense`, `connection()` pour les données personnelles) ; certaines fonctions de Next sont encore expérimentales (`forbidden()`), évitées volontairement.
- **Règle pour la suite** : tout nouvel outil (backend, ORM, file, paiement, PDF, IA) passe par une nouvelle ADR courte : besoin concret, pourquoi l'existant ne suffit pas, coût, impact sur les tests, accord d'Antonino.
