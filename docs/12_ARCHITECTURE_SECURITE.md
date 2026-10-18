# 12 — Architecture, sécurité multi-tenant, confidentialité, exploitation

## 1. Architecture logique
**Web** : Next.js App Router, React, TypeScript strict, Tailwind, composants accessibles. **Domaine** : services Node côté serveur avec contrats Zod et fonctions pures de validation/progression. **Données** : PostgreSQL géré Supabase avec Auth et RLS, Storage privé. **Services externes** : email, PDF, WhatsApp, notifications via adaptateurs isolés. **Traçabilité** : journaux applicatifs sans données sensibles, audit métiers.

Arborescence suggérée :
```text
src/app/(auth)/login/
src/app/(coach)/coach/
src/app/(athlete)/app/
src/app/(admin)/admin/
src/app/api/                  # uniquement routes HTTP nécessaires (PDF, webhooks...)
src/components/ui/
src/components/training/
src/features/athletes/
src/features/programs/
src/features/library/
src/features/publications/
src/features/feedback/
src/domain/training/
src/lib/auth/
src/lib/db/
src/lib/pdf/
src/lib/communications/
supabase/migrations/
supabase/seed.sql
tests/unit/
tests/integration/
tests/e2e/
```
Architecture retenue : **monolithe modulaire Next.js/TypeScript**, aucun service backend distinct au lancement. Supabase rassemble base PostgreSQL, Auth et Storage ; ne pas installer une seconde base/auth ou un ORM par défaut. `src/app/api/v1/` n'est **pas une obligation** : créer des Route Handlers seulement quand un véritable endpoint est justifié. Les écrans internes privilégient composants serveur pour lire et Server Actions/Functions pour muter, chaque action revalidant auth/rôles/propriété et Zod ; tous partagent les services métier. Les transactions SQL sensibles restent explicites et testées.

## 2. Authentification et rôles
- Supabase Auth (email/mot de passe, magic link éventuel), vérification email, reset, session, logout, contrôle des routes serveur.
- Les rôles organisation se lisent dans `organization_members`; administrateur global dans table protégée contrôlée par serveur. **Ne jamais se fier à un rôle transmis via formulaire, URL ou `user_metadata` modifiable.**
- Connexion coach/sportif partage identité mais redirige selon autorisations ; supporter un même utilisateur sportif dans 2 organisations explicitement liées, sans fusionner les données.
- Onboarding organisation/sportif avec lien invitation expirant, hash du jeton, usage unique, rate limit, gestion révocation.

## 3. Isolation organisations (SEC-01)
- RLS activé sur **toutes** tables avec données personnelles ou métier ; politiques SELECT/INSERT/UPDATE/DELETE par appartenance et portée.
- Coach lit `athletes` dans son organisation et les clients assignés selon droits. Sportif lit seulement données publiées qui lui sont destinées, et écrit seulement résultats associés.
- Stockage : bucket privé ; clés path org/publication/UUID ; accès par route serveur ou signed URL brève, vérifiant session/org/athlete, pas de lien public permanent.
- Les clés `service_role` ne sont jamais accessibles client ou exposées dans les logs. Service role seulement dans procédures de confiance expressément protégées.
- Test anti-IDOR : essayer avec client A et sportif B IDs provenant d'autre tenant à chaque endpoint et bucket.

## 4. RGPD/Belgique/UE (orientation conformité, validation juridique nécessaire)
- Définir rôles responsable de traitement/sous-traitant selon déploiement commercial, contrats DPA et base légale de chaque finalité.
- Collecter minimum nécessaire : identité, contact, objectifs, données d'entraînement ; éviter données médicales/santé sensibles non indispensables et mineurs avant cadrage spécifique.
- Informer et enregistrer consentements marketing/communications lorsque requis ; possibilité d'opposition, désinscription, gestion préférences.
- Prévoir procédures droit d'accès, rectification, export, suppression/effacement et rétention ; sauvegardes avec politique rétention appropriée.
- Hébergement/région et transferts hors EEE à vérifier fournisseurs (Supabase, e-mail, messagerie), contrats et mesures.
- Distinguer données opérationnelles (programme/feedback) de contenu de logs ; ne jamais envoyer notes privées coach à un service externe IA sans accord et protection.

## 5. Sécurité applicative
- Validation Zod partout, requêtes paramétrées, CSRF selon actions/auth, cookies sécurisés, rate limit login/invitation/envoi/export, protection XSS et HTML dans notes/PDF.
- Rendu PDF escape HTML et interdiction de charger URL arbitraire du contenu utilisateur (risque SSRF) ; URLs images acceptées sur domaines contrôlés, stockage privé.
- Secrets `.env.local` ignorés par Git, `.env.example` avec noms seulement ; politique rotation et déploiement. Pas de clés API dans `NEXT_PUBLIC_*` sauf identifiants explicitement publics.
- Surveillance dépendances et audits, sauvegardes récurrentes testées, plan récupération incident, politiques d'accès support.
- Audit log pour publication, accès admin exceptionnel, export, invitations et changements de permissions.

## 6. Background jobs / intégrations
MVP : routes synchrones courtes pour CRUD ; PDF généré via job ou appel borné avec timeout/retry, stockage et statut. Notifications et emails via outbox + worker/cron fiables avec idempotence, pas `setTimeout` ou front-end ouvert. WhatsApp via fournisseur officiel après activation, consentements, modèles approuvés, gestion erreurs et quotas.

## 7. CI/CD et observabilité
Pipeline : formatter -> lint -> typecheck -> unit tests -> integration RLS tests -> Playwright smoke -> build -> déploiement staging -> vérification migrations -> déploiement production. Enregistrer erreurs sans PII, métriques réponse et jobs, alertes échec PDF/envoi. Séparer environnements development/staging/prod et organisations de test.

## 8. Performance
- Index tenant et client, pagination filtrée, requêtes anti-N+1 ; chargement différé des pages volumineuses de 12+ semaines.
- PDF depuis snapshot : hash/cache après génération, limiter la taille des images, paginer lisiblement, job retry.
- Autosave cohérent même sur réseau mobile lent, contrôle optimistic concurrency `revision`, réponse conflit explicite.

## 9. Contrôles avant mise en ligne
- [SEC-01] Suite multi-tenant : aucun cross-org via ID, recherche, PDF, fichier, template, invitation, feedback.
- [SEC-02] Pen test manuel de base : accès URL direct, XSS dans notes, rôle falsifié, signed URLs expiration, imports invalides.
- [OPS-01] Rollback migration et restauration d'une base staging testés.
- [OPS-02] CGU/confidentialité/DPA/politique conservation validées avant ouvrir au public.
- [OPS-03] Monitoring détecte erreurs sans exposer identité/notes du sportif.

## 10. Politique de dépendances minimales et déploiement progressif (V1.1)

**Noyau P0/P1** : Next.js (React + TypeScript), Tailwind, Supabase (`@supabase/supabase-js` et assistance SSR conforme à la version officielle courante), Zod, SQL migrations ; lint et typecheck. Aucun backend Node séparé : le serveur Next.js traite les cas d'usage applicatifs. `shadcn/ui` ou une petite bibliothèque de composants accessible **au besoin**, pas un kit complet préinstallé. Vitest dès l'apparition des premières règles métier ; tests RLS dès P1 ; Playwright lors des premiers parcours vérifiables, pas nécessairement au premier commit.

**À ne pas installer à P0** : Stripe, service mail, WhatsApp, outils d'IA, Redis, workers/queues, Prisma, Drizzle, GraphQL, NestJS, Express, bibliothèques de diagrammes lourdes, dépendance PWA/offline ou second gestionnaire de state. Ne pas interdire ces technologies si un besoin réel apparaît : faire une ADR concise (besoin, alternative native insuffisante, coût, impact/tests, accord utilisateur).

**Choix selon usage** : afficher d'abord des données via Server Components, garder les formulaires réactifs dans de petits composants client ; n'ajouter un state manager externe qu'en cas de douleur mesurée. Un PDF se génère à partir d'une publication figée avec **un moteur** testé sur les 9 documents de référence et des cas couvrant plusieurs pages ; choisir à P5. Pour jobs réels (relances, emails), démontrer d'abord pourquoi une file persistante/idempotente est nécessaire à P7. Les tâches qui ne sont pas de vrais besoins métiers ne justifient aucun service additionnel.

**SSR/auth** : sessions protégées par cookies avec l'approche recommandée par Supabase pour Next.js au moment du codage. Ne jamais considérer `getSession()` sans vérification d'identité serveur comme une preuve suffisante si la doc actuelle exige une vérification de claims/utilisateur. L'accès cross-org doit être refusé en Server Actions, Route Handlers, fonctions SQL et politiques RLS, tests à l'appui. Eviter le cache partagé pour les réponses personnalisées/authentifiées.

**Commercialisation future** : chaque organisation est l'unité de facturation ; Stripe ou un autre prestataire se branche par un **adaptateur isolé** en P8. Checkout/webhooks/portail de paiement ne deviennent des dépendances que lorsque le marché, les offres et la conformité sont validés. Le portail admin SaaS n'a jamais d'accès implicite libre aux données privées sportives : accès support exceptionnel journalisé et contrôlé.

Références officielles à vérifier à l'implémentation (versions susceptibles d'évoluer) :
- Next.js Server Actions et vérification d'autorisation : https://nextjs.org/docs/app/getting-started/mutating-data
- Supabase SSR pour Next.js : https://supabase.com/docs/guides/auth/server-side/creating-a-client
- Supabase Auth/RLS : https://supabase.com/docs/guides/auth
- Stripe Billing (si retenu en P8) : https://docs.stripe.com/billing/subscriptions/overview
