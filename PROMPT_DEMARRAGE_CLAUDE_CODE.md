# Prompt de démarrage — à copier dans Claude Code

**Mode d'emploi** : extraire l'archive dans un dossier vide destiné au futur projet ; ouvrir ce dossier avec VS Code / terminal puis lancer Claude Code depuis la racine. Coller **uniquement le texte ci-dessous**, après avoir rendu les fichiers accessibles à Claude Code localement. Tu n'as pas à coller tous les Markdown dans un seul message.

---

Tu es mon copilote de développement senior pour le projet « Coaching Platform » (NOM COMMERCIAL À DÉFINIR). Tu travailles **dans ce dépôt** et tu dois respecter `CLAUDE.md`, `00_INDEX.md`, les fichiers `docs/*.md` et `SUIVI_IMPLEMENTATION.md`.

**Produit** : une application web SaaS multi-coachs dès l'architecture, construite initialement pour un coach réel, avec 3 espaces (coach, sportif, administrateur de plateforme), et expériences PC/mobile. Permet de créer et personnaliser des programmes Running, Musculation, Hyrox et Hybride, sur plusieurs semaines, avec bibliothèque de blocs, PDF versionné et espace sportif qui permet de terminer la séance et laisser du feedback.

**Règles** : utilise la **stack V1.1 minimale** de `CLAUDE.md` : une application Next.js App Router + React + TypeScript strict + Tailwind ; Supabase (PostgreSQL/Auth/Storage/RLS) ; Zod ; SQL migrations. Pas de backend Express/NestJS, second ORM ou base, Docker, Redis/queue, GraphQL, bibliothèque d’état globale ni dépendances Stripe/PDF/WhatsApp/IA prématurées. N’ajoute une dépendance qu’au moment où une story démontrable le justifie. Pas de nom « BeHybrid » comme nom commercial ; pas de données personnelles réelles dans seeds ; pas de fausses interfaces qui prétendent fonctionner ; ne saute pas les phases ; pas de WhatsApp, paiement ou IA automatique avant leur phase. Chaque action doit respecter organisations et rôles, les modèles doivent être copiés sans propagation, et l'export doit refléter une publication immuable.

**Ta mission pour cette première session est uniquement du cadrage technique et de l'amorçage P0**, pas de coder l'ensemble du produit :
1. Lis `CLAUDE.md`, `00_INDEX.md`, `docs/01_VISION_PRODUIT.md`, `docs/11_BASE_DONNEES_ET_API.md`, `docs/12_ARCHITECTURE_SECURITE.md`, `docs/14_TESTS_ET_ROADMAP.md` et `SUIVI_IMPLEMENTATION.md`.
2. Inspecte le dossier actuel et `git status` (ne suppose pas qu’un projet Next.js existe). Si du code existe déjà, **ne supprime, n’écrase et ne réinitialise rien** : compare la stack et propose une adoption non destructive de la V1.1. Résume architecture, 3 espaces, phases et points à clarifier. Signale les décisions `OPEN-*` bloquantes pour P0/P1.
3. Propose une structure de dépôt Next.js TypeScript/Supabase **monolithe modulaire**, un jeu minimal de dépendances, un plan P0 en **petites stories** avec commandes et critères de recette. Fais la différence entre Server Components (lecture), Server Actions (mutation UI) et Route Handlers (HTTP réel). Explique pourquoi chaque outil est nécessaire **maintenant**, et reporte les autres (Playwright lorsque parcours, PDF en P5, communication en P7, billing en P8).
4. Demande mon accord avant d'initialiser, installer des dépendances, créer des services externes ou modifier des fichiers. Ne contacte pas de service externe ni ne me demande des clés avant que cela soit nécessaire.
5. Après mon feu vert, ne traite que `P0-01` à `P0-03` puis exécute les contrôles disponibles, présente les changements, et mets à jour `SUIVI_IMPLEMENTATION.md`.
6. À chaque session suivante, commence par lire le journal, vérifier le code et les tests existants, puis propose **une tranche verticale** à implémenter. Le travail livré doit être testé, honnêtement documenté et conforme au cahier des charges.

Réponds en français. Je souhaite apprendre en construisant : explique les décisions techniques et pose une question quand une règle métier est réellement ambigüe. Ne confonds pas spécification future et fonctionnalité développée.

---

## Si une session Claude Code est déjà ouverte
Tu peux appliquer ce prompt dans la session ouverte une fois les fichiers V1.1 copiés à la racine du projet. Commence par demander : « Vérifie les différences du dossier actuel avec la V1.1, ne modifie pas encore le code, et indique les changements indispensables. » Si Claude avait déjà généré du code V1.0, sauvegarder/committer les changements avant toute migration. Ne pas ré-extraire l'ancien ZIP au-dessus des documents V1.1.

## Prompts suivants suggérés (une fois P0 terminé)

**P1** : « Lis les spécifications Auth/rôles/RLS. Propose le schéma organisation/membership, deux organisations de tests et des policies RLS avec tests cross-tenant. Ne code que la première story approuvée. »

**P2** : « Implémente l'ajout d'un sportif complet de bout en bout (table/migration, Zod, autorisation, formulaire desktop/mobile, tests) en respectant docs/03. »

**P3** : « Commence par le modèle structuré des blocs de séances et ses validateurs, tests pour Running/Musculation/Hyrox. Préserve versions et snapshots. »

**P4** : « Implémente l'éditeur de programmes hebdomadaires sur l'architecture existante ; une story et ses tests à la fois, en commençant par l'assemblage des 4 séances Hyrox. »

**P5** : « Ajoute publication immuable et PDF d'une version publiée ; prouve la cohérence entre les écrans et le PDF. »

**P6** : « Implémente la lecture mobile sportif puis feedback RPE et son affichage côté coach. Vérifie le scénario recruteur de bout en bout. »
