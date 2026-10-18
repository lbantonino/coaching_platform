# Coaching Platform — Notes de mise à jour V1.1

**Date : 18 octobre 2026. Nom commercial : à définir.** Cette archive remplace le dossier **de spécifications** V1.0 ; ce n'est pas du code prêt à déployer.

## Ce qui a changé

1. **Stack minimaliste clarifiée** : une application Next.js App Router / React / TypeScript strict / Tailwind, Supabase (PostgreSQL/Auth/Storage/RLS), SQL migrations et Zod. Lint/typecheck dès le début ; tests ajoutés à la phase concernée.
2. **Aucune technologie redondante** imposée : pas de backend NestJS/Express, ORM Prisma/Drizzle, GraphQL, Redis, Docker obligatoire, état global lourd, second stockage, intégrations premium précoces. Une exception exige une décision documentée et validée.
3. **API simplifiée** : le tableau de routes `docs/11_*` décrit des opérations métier ; Server Components + Server Actions/Functions sont suffisants pour une majorité de parcours internes, Route Handlers uniquement pour les vrais endpoints HTTP, PDF et webhooks.
4. **SaaS préparé dès P1** : organisations, rôles, autorisations et tests RLS sur deux tenants ; stockage privé. **Abonnements, Stripe (si sélectionné), factures et limites : P8, pas P0**.
5. **Spécifications P8 détaillées** : unité de facturation = organisation, tables futures, signatures webhooks, idempotence, quotas côté serveur, absence de suppression abusive des programmes en cas d'impayé, critères de tests.
6. **Prompt Claude Code adapté** : détection d'un dépôt existant et interdiction d'écraser le travail ; premier objectif P0 uniquement.
7. **PDFs régénérés** pour correspondre à la V1.1 des Markdown.

## Ce qui reste inchangé

- Les **17 fichiers Markdown de référence** (CLAUDE, index et `docs/01` à `docs/15`) restent présents, avec les moteurs Running, Musculation, Hyrox et Hybride.
- 3 espaces : Coach (PC/mobile), Sportif (PC/mobile), Administration SaaS.
- CRM, bibliothèque, séances typées, modèles réutilisables, progression, publications immuables, PDF, RPE et feedback.
- Le scénario recruteur de 3 minutes et les neuf PDF BeHybrid comme sources métier ; ces PDF personnels **ne sont pas inclus** dans l'archive.

## Limites et décisions ouvertes

- Le fournisseur de paiement, les tarifs, essais et contraintes fiscales ne sont **pas arrêtés**. Stripe est candidat, pas une dépendance incluse.
- Le moteur PDF doit être choisi et testé sur de vrais exemples à P5.
- Les décisions métier `OPEN-*` seront validées avec le coach ; ne pas inventer des règles sportives.
- Les spécifications **ne constituent pas une application développée**. Les versions de dépendances et instructions Supabase SSR doivent être vérifiées au moment de l'installation.

Voir `DEMARRAGE_APRES_MAJ.md` pour passer du ZIP V1.0 ou d'une session Claude ouverte à la V1.1.
