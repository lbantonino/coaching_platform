# Carnet technique : comment ce projet est construit, et pourquoi

> Document personnel d'Antonino, pour comprendre le projet et pouvoir l'expliquer (entretien, recruteur, client).
> Le code est écrit avec l'aide de Claude Code ; ce carnet explique **les décisions**, pas chaque ligne.
> Il est mis à jour à la fin de chaque story. Dernière mise à jour : **20/10/2026** (fin de P1-01b).
>
> Les autres documents : [SUIVI_IMPLEMENTATION.md](SUIVI_IMPLEMENTATION.md) = le journal détaillé et les preuves de tests ;
> [README.md](README.md) = comment lancer le projet ; `docs/` = le cahier des charges (ce qu'on VEUT construire).

---

## 1. Le projet en 30 secondes

Une application web SaaS pour coachs sportifs (Running, Musculation, Hyrox, Hybride). Un coach crée des programmes d'entraînement sur plusieurs semaines, les publie, et ses sportifs les consultent sur téléphone puis donnent leur ressenti. Un administrateur gère la plateforme.

**« SaaS multi-tenant »** : plusieurs coachs utilisent la même application et la même base de données, mais chacun ne voit **jamais** les données des autres. Un coach (ou un studio) = une **organisation**. C'est la contrainte n°1 du projet, et elle explique beaucoup de choix ci-dessous.

---

## 2. La stack, et pourquoi chaque outil

| Outil | Rôle | Pourquoi lui |
|---|---|---|
| **Next.js 16** (App Router) | Le site ET le serveur, dans une seule application | Évite d'avoir un frontend et un backend séparés à maintenir. Le serveur Next exécute la logique métier. |
| **React 19** | Les composants d'interface | Standard du marché, imposé par Next. |
| **TypeScript strict** | Le langage | Les erreurs de type sont détectées avant d'exécuter le code. « Strict » = pas de raccourcis permissifs. |
| **Tailwind CSS 4** | Le style | Styles écrits directement dans les composants, rapide, cohérent, responsive facile. |
| **Supabase** | Base PostgreSQL + comptes (Auth) + fichiers (Storage) | Un seul service pour trois besoins. Et surtout la **RLS** de PostgreSQL (voir §5). |
| **Zod** | Valider les données reçues | Tout ce qui vient du navigateur est vérifié côté serveur avant usage. |
| **Docker** | Faire tourner Supabase sur le Mac | Développer hors ligne, gratuitement, et remettre la base à zéro en quelques secondes. Uniquement en développement. |
| **pgTAP** | Tests de la base de données | Prouver par des tests que la sécurité SQL fonctionne. Intégré à Supabase. |
| **Playwright** | Tests « comme un humain » | Un robot ouvre un vrai navigateur (ordinateur et téléphone), clique, remplit, vérifie. |
| **ESLint + Prettier** | Qualité et format du code | Repérer les erreurs courantes, garder un style uniforme. |

**Ce qu'on a volontairement refusé** (et pourquoi) : un backend séparé (Express, NestJS), un ORM (Prisma, Drizzle), GraphQL, Redis. Chacun ajoute de la complexité sans besoin réel aujourd'hui : Next + Supabase couvrent tout. La règle du projet : **on n'ajoute un outil qu'au moment où une fonctionnalité le justifie**. Exemple : Zod est arrivé avec le premier formulaire, Playwright avec le premier parcours utilisateur, pas avant.

**Phrase pour un recruteur** : « Un monolithe Next.js en TypeScript, Supabase pour la base, l'auth et la sécurité au niveau des lignes, et des tests à trois niveaux : SQL, HTTP et navigateur. Pas d'outil ajouté sans besoin démontré. »

---

## 3. Où se trouve quoi (l'arborescence)

```text
Coaching_Platform/
├── CLAUDE.md, 00_INDEX.md, docs/   Le cahier des charges : ce qu'on veut construire
├── SUIVI_IMPLEMENTATION.md         Le journal : ce qui est RÉELLEMENT fait et prouvé
├── CARNET_TECHNIQUE.md             Ce document
├── src/
│   ├── app/                        Les pages et les routes (une URL = un dossier)
│   │   ├── (auth)/                 Connexion, mot de passe oublié, nouveau mot de passe
│   │   ├── (coach)/coach/          Espace coach
│   │   ├── (admin)/admin/          Espace administrateur
│   │   ├── auth/confirm/           Retour des liens reçus par e-mail
│   │   └── espace/                 Aiguillage : envoie chacun vers son espace
│   ├── features/auth/              La logique « comptes » : actions, garde-fous, validations
│   ├── components/ui/              Petits composants réutilisables (bouton déconnexion, styles)
│   ├── lib/                        Outils techniques (connexion Supabase, variables d'env)
│   └── proxy.ts                    S'exécute avant chaque requête (session, redirections)
├── supabase/
│   ├── migrations/                 L'historique du schéma de la base, en SQL
│   ├── seed.sql                    Les données de démonstration (fictives)
│   ├── tests/database/             Les tests SQL de sécurité
│   └── config.toml                 La configuration de Supabase local
└── tests/e2e/                      Les tests Playwright
```

Les parenthèses comme `(auth)` sont des **groupes de routes** Next : ils rangent les fichiers sans apparaître dans l'URL. `src/app/(coach)/coach/page.tsx` répond à `/coach`.

**Pourquoi séparer `app/` et `features/` ?** `app/` contient seulement l'affichage. La logique (« qui a le droit ? », « que valider ? ») est dans `features/`. Ainsi la même règle sert à plusieurs pages, et on la teste une seule fois.

---

## 4. Comment l'interface parle au serveur

Next.js offre trois mécanismes, chacun pour un usage précis :

- **Server Component** (lire) : la page est calculée sur le serveur, qui lit la base et envoie du HTML. Exemple : `/coach` affiche ton organisation.
- **Server Action** (modifier) : un formulaire appelle directement une fonction serveur. Exemple : `login()` dans `features/auth/actions.ts`. Important : une action est appelable par n'importe qui sur Internet, donc **elle revérifie toujours** identité, droits et données.
- **Route Handler** (vraie adresse HTTP) : pour ce qui n'est pas une page. Exemple : `/auth/confirm`, qui reçoit le lien du mail de réinitialisation.

---

## 5. La sécurité en trois couches (le cœur du projet)

Une requête traverse trois barrières successives. Si l'une a un bug, la suivante protège encore.

1. **Le proxy** (`src/proxy.ts`) : avant chaque page, il rafraîchit la session et renvoie vers `/login` si on n'est pas connecté. C'est du confort, pas la vraie protection.
2. **Les garde-fous serveur** (`src/features/auth/guards.ts`) : `requireCoach()`, `requirePlatformAdmin()`, `requireOrgAccess(id)`. Appelés en tête de chaque page ou action protégée. Ils vérifient le **rôle réel** dans la base.
3. **La RLS PostgreSQL** (Row Level Security, dans `supabase/migrations/`) : la base elle-même filtre chaque ligne. Même si le code oubliait une vérification, un coach ne recevrait jamais une ligne d'une autre organisation.

Règles qui en découlent :
- Le navigateur n'envoie **jamais** « je suis de l'organisation X » : le serveur le déduit de la session.
- Un rôle ne se lit **jamais** dans des données modifiables par l'utilisateur.
- « Interdit » et « n'existe pas » donnent la même réponse : on ne révèle pas l'existence d'une donnée.
- Les pages personnelles ne sont jamais mises en cache (`Cache-Control: private, no-store`).

**Phrase pour un recruteur** : « Défense en profondeur : redirection optimiste au proxy, autorisation explicite dans chaque action serveur, et isolation finale par RLS PostgreSQL, testée automatiquement avec deux organisations. »

---

## 6. La méthode de travail

- **Lire avant d'écrire.** Au démarrage, on a lu le cahier des charges et inspecté le dossier (sans rien supposer). C'est pour ça que beaucoup de fichiers ont été ouverts au début : comprendre les règles avant de coder.
- **Une tranche verticale à la fois.** Chaque story contient tout : base, logique, écran, sécurité, tests. Jamais « toute l'interface d'abord, la base ensuite ».
- **Prouver, pas affirmer.** Une story n'est « faite » qu'après des tests exécutés. Pour la sécurité, on fait aussi une **contre-épreuve** : on casse volontairement une règle pour vérifier que les tests le détectent.
- **Un commit par story**, avec un message clair. Le journal `SUIVI_IMPLEMENTATION.md` garde les preuves.
- **Migrations, jamais de modification à la main.** Le schéma de la base n'évolue que par des fichiers SQL versionnés. `npm run db:reset` reconstruit tout de zéro : la base est reproductible.
- **Données fictives uniquement** (`@example.test`). Aucune donnée réelle de sportif dans le code.

---

## 7. La progression, étape par étape

### P0-01 : le socle (19/10)
Création de l'app Next.js avec TypeScript strict, Tailwind, ESLint, Prettier, et les commandes `lint`, `typecheck`, `check`. Node 24 (version stable à long terme) imposé par `.nvmrc`. Le squelette a été généré dans un dossier temporaire puis copié, pour **ne jamais écraser** le cahier des charges déjà présent.

### P0-02 : les environnements (19/10)
`.env.example` liste les variables nécessaires, sans valeurs. Les vraies clés vont dans `.env.local`, ignoré par Git. Un projet Supabase distinct par environnement (développement, test, production), pour ne jamais mélanger données de test et données réelles.

### P0-03 : la base reproductible (19/10)
Supabase local dans Docker, première migration (une fonction qui met à jour la date de modification), fichier de seed, commandes `db:start`, `db:reset`, `db:stop`. Vérifié : deux remises à zéro de suite sans erreur.

### P1-02 / P1-03 : organisations et isolation (19/10)
Trois tables : `organizations`, `organization_members` (qui appartient à quelle organisation, rôle propriétaire ou coach) et `platform_admins`. Règles RLS : chacun ne lit que sa propre organisation, personne n'écrit depuis le navigateur. Deux organisations de démo (A et B). **16 tests SQL** prouvent que A ne voit jamais B, et la contre-épreuve prouve que les tests détectent une fuite.

*Pourquoi avant la page de connexion ?* Parce que c'est le socle dont tout dépend. Il se teste sans interface.

### P1-01a : la connexion (19/10)
Page `/login`, déconnexion, espace `/coach` protégé. Le formulaire passe par une Server Action validée par Zod. Message d'erreur volontairement vague (« e-mail ou mot de passe incorrect ») pour ne pas révéler quels comptes existent. Les types TypeScript de la base sont **générés automatiquement** depuis le schéma (`npm run db:types`) : le code connaît exactement les colonnes.

### P1-04 : les garde-fous de rôle (20/10)
`requireCoach`, `requireOrgAccess`, `requirePlatformAdmin`, une page `/admin`, une page « Accès refusé », et l'aiguillage après connexion (coach vers `/coach`, admin vers `/admin`). Le statut d'admin est lu via une petite fonction SQL qui ne répond que pour l'utilisateur connecté. `requireAthlete` attendra que la table des sportifs existe : pas de faux garde-fou.

### Playwright : les tests navigateur (20/10)
Installé au moment où un vrai parcours existait. Chaque test tourne deux fois : écran d'ordinateur et écran de téléphone. Dès le premier passage, il a trouvé un vrai défaut (voir §8).

### P1-01b : mot de passe oublié (20/10)
Demande de lien, e-mail, lien à usage unique, nouveau mot de passe (10 caractères minimum). En local, les e-mails sont capturés par **Mailpit** (http://127.0.0.1:54324) au lieu d'être envoyés : le test Playwright lit l'e-mail via son API et fait tout le parcours. La destination du lien est dans une liste fermée, pour empêcher une redirection vers un site malveillant.

---

## 8. Problèmes rencontrés et ce qu'ils ont appris

Ces incidents sont de bons sujets d'entretien : ils montrent qu'on teste vraiment.

- **« Date.now() pendant le prérendu »** : Next 16 essayait de pré-calculer la page coach, alors que la session dépend de l'heure. Solution : `connection()` force le calcul à chaque requête. Bonus : les données personnelles ne sont jamais en cache.
- **L'adresse restait sur `/espace` après connexion** : la page affichée était bonne, mais l'URL non. Trouvé par Playwright, corrigé en redirigeant directement au bon endroit.
- **L'inscription libre était ouverte** : sans page d'inscription, l'API de Supabase acceptait quand même de créer des comptes. Fermé dans la configuration et vérifié.
- **Une correction qui a tout cassé** : en fermant l'inscription, un deuxième réglage a coupé toute connexion. Les tests l'ont attrapé immédiatement. Leçon : c'est exactement pour ça qu'on a des tests automatiques.

---

## 9. Questions probables d'un recruteur

- **« Comment garantis-tu qu'un coach ne voit pas les clients d'un autre ? »** Trois couches (proxy, garde-fous serveur, RLS), et 16 tests SQL plus des tests navigateur qui le prouvent avec deux organisations.
- **« Pourquoi pas un backend séparé ? »** Next.js exécute déjà du code serveur. Un second backend doublerait le travail et les risques, sans bénéfice à cette échelle.
- **« Comment tu testes ? »** Trois niveaux : pgTAP pour la base, vérifications HTTP, Playwright pour les parcours sur ordinateur et téléphone.
- **« Comment as-tu utilisé l'IA ? »** Claude Code écrit le code à partir d'un cahier des charges détaillé ; je valide chaque décision métier, je teste dans le navigateur, et tout est tracé dans un journal avec les preuves de tests.

---

## 10. Petit glossaire

- **Tenant / organisation** : l'espace isolé d'un coach ou d'un studio.
- **RLS** : règles dans PostgreSQL qui filtrent les lignes selon l'utilisateur connecté.
- **Migration** : fichier SQL daté qui fait évoluer le schéma de la base.
- **Seed** : données de démonstration chargées après les migrations.
- **Server Action** : fonction serveur appelée directement par un formulaire.
- **Proxy** : code exécuté avant chaque requête (s'appelait « middleware » avant Next 16).
- **PKCE** : mécanisme qui garantit qu'un lien reçu par e-mail ne fonctionne que dans le navigateur qui l'a demandé.
- **E2E (end-to-end)** : test d'un parcours complet, du clic à la base de données.
