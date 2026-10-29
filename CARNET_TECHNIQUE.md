# Carnet technique : comment ce projet est construit, et pourquoi

> Document personnel d'Antonino, pour comprendre le projet et pouvoir l'expliquer (entretien, recruteur, client).
> Le code est écrit avec l'aide de Claude Code ; ce carnet explique **les décisions**, pas chaque ligne.
> Il est mis à jour à la fin de chaque story. Dernière mise à jour : **29/10/2026** (design « Graphite & Or », vue Liste de l'Agenda, factures émises, classement des Documents, Coory à l'international).
>
> Les autres documents : [SUIVI_IMPLEMENTATION.md](SUIVI_IMPLEMENTATION.md) = le journal détaillé et les preuves de tests ;
> [README.md](README.md) = comment lancer le projet ; `docs/` = le cahier des charges (ce qu'on VEUT construire).

---

## 1. Le projet en 30 secondes

Une application web SaaS pour coachs sportifs (Running, Musculation, Hyrox, Hybride). Un coach crée des programmes d'entraînement sur plusieurs semaines, les publie, et ses sportifs les consultent sur téléphone puis donnent leur ressenti. Un administrateur gère la plateforme.

**« SaaS multi-tenant »** : plusieurs coachs utilisent la même application et la même base de données, mais chacun ne voit **jamais** les données des autres. Un coach (ou un studio) = une **organisation**. C'est la contrainte n°1 du projet, et elle explique beaucoup de choix ci-dessous.

**Le nom : Coory. Le positionnement** (détail dans `docs/16_POSITIONNEMENT.md`) : un concurrent, Athleex, fait du coaching généraliste orienté musculation et business. Coory ne le copie pas : même socle, mais spécialisé **Running, Hyrox et Hybride**, avec dix différences prévues (allures calculées par sportif, mode club, minuteur de séance, boîte à outils Hyrox, import de programmes existants, marque du coach, IA d'assistance validée par le coach, import Strava/Garmin, hors ligne). Phrase pour un recruteur : « On n'a pas cherché la parité avec le concurrent, on a choisi une niche qu'on connaît et des fonctions qu'il ne fait pas bien. »

---

## 2. La stack, et pourquoi chaque outil

| Outil | Rôle | Pourquoi lui |
|---|---|---|
| **Next.js 16** (App Router) | Le site ET le serveur, dans une seule application | Évite d'avoir un frontend et un backend séparés à maintenir. Le serveur Next exécute la logique métier. |
| **React 19** | Les composants d'interface | Standard du marché, imposé par Next. |
| **TypeScript strict** | Le langage | Les erreurs de type sont détectées avant d'exécuter le code. « Strict » = pas de raccourcis permissifs. |
| **Tailwind CSS 4** | Le style | Styles écrits directement dans les composants, rapide, cohérent, responsive facile. Les couleurs et tailles du design system y sont déclarées une seule fois (tokens). |
| **Lucide** | Les icônes | Imposées par le design system Coory : traits fins, monochromes, sans emoji. |
| **Supabase** | Base PostgreSQL + comptes (Auth) + fichiers (Storage) | Un seul service pour trois besoins. Et surtout la **RLS** de PostgreSQL (voir §5). |
| **Zod** | Valider les données reçues | Tout ce qui vient du navigateur est vérifié côté serveur avant usage. |
| **Docker** | Faire tourner Supabase sur le Mac | Développer hors ligne, gratuitement, et remettre la base à zéro en quelques secondes. Uniquement en développement. |
| **pgTAP** | Tests de la base de données | Prouver par des tests que la sécurité SQL fonctionne. Intégré à Supabase. |
| **Playwright** | Tests « comme un humain » | Un robot ouvre un vrai navigateur (ordinateur et téléphone), clique, remplit, vérifie. |
| **Vitest** | Tests unitaires | Vérifie en une fraction de seconde les règles « pures » (validations, calculs, jetons), sans base ni navigateur. |
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
├── COORY_DESIGN_SYSTEM.md, COORY_LOGO.md   La charte visuelle et le logo (source de vérité du style)
├── src/
│   ├── app/                        Les pages et les routes (une URL = un dossier)
│   │   ├── (auth)/                 Connexion, mot de passe oublié, nouveau mot de passe
│   │   ├── (coach)/coach/          Espace coach
│   │   │   └── o/[orgId]/sportifs/ Liste, ajout et invitation des sportifs d'une organisation
│   │   ├── (athlete)/app/          Espace sportif
│   │   ├── invitation/[token]/     Page publique où le sportif accepte son invitation
│   │   ├── (admin)/admin/          Espace administrateur
│   │   ├── auth/confirm/           Retour des liens reçus par e-mail
│   │   └── espace/                 Aiguillage : envoie chacun vers son espace
│   ├── features/auth/              La logique « comptes » : actions, garde-fous, validations
│   ├── domain/training/            Règles sportives PURES (allures…), sans base ni écran
│   ├── features/athletes/          La logique « sportifs » : validation, lecture, création
│   ├── features/references/        La logique « repères » (allures, FC, charges)
│   ├── features/invitations/       La logique « invitations » : jetons, création, acceptation
│   ├── components/ui/              Composants du design system (bouton, badge, carte, logo, thème…)
│   ├── styles/tokens.css           Les couleurs du design system, en sombre et en clair
│   ├── config/brand.ts             Le nom de la marque, à un seul endroit
│   ├── lib/                        Outils techniques (clients Supabase, variables d'env, dates)
│   └── proxy.ts                    S'exécute avant chaque requête (session, redirections)
├── public/logo/                    Les symboles du logo en SVG (pour les e-mails et exports à venir)
├── supabase/
│   ├── migrations/                 L'historique du schéma de la base, en SQL
│   ├── seed.sql                    Les données de démonstration (fictives)
│   ├── tests/database/             Les tests SQL de sécurité
│   └── config.toml                 La configuration de Supabase local
└── tests/e2e/                      Les tests Playwright
```

Les crochets comme `[orgId]` sont des **segments dynamiques** : `/coach/o/1234/sportifs` donne `orgId = "1234"`. Les parenthèses comme `(auth)` sont des **groupes de routes** Next : ils rangent les fichiers sans apparaître dans l'URL. `src/app/(coach)/coach/page.tsx` répond à `/coach`.

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
2. **Les garde-fous serveur** (`src/features/auth/guards.ts`) : `requireCoach()`, `requireAthlete()`, `requirePlatformAdmin()`, `requireOrgAccess(id)`. Appelés en tête de chaque page ou action protégée. Ils vérifient le **rôle réel** dans la base.
3. **La RLS PostgreSQL** (Row Level Security, dans `supabase/migrations/`) : la base elle-même filtre chaque ligne. Même si le code oubliait une vérification, un coach ne recevrait jamais une ligne d'une autre organisation.

Règles qui en découlent :
- Le navigateur n'envoie **jamais** « je suis de l'organisation X » : le serveur le déduit de la session.
- Un rôle ne se lit **jamais** dans des données modifiables par l'utilisateur.
- « Interdit » et « n'existe pas » donnent la même réponse : on ne révèle pas l'existence d'une donnée.
- Les pages personnelles ne sont jamais mises en cache (`Cache-Control: private, no-store`).
- La **clé secrète** Supabase (qui contourne la RLS) n'est utilisée que dans un fichier serveur isolé (`lib/supabase/admin.ts`), pour une seule procédure : créer le compte d'un sportif qui accepte une invitation valide. On a vérifié qu'elle n'apparaît dans aucun fichier envoyé au navigateur.
- Dans un fichier `"use server"`, **chaque fonction exportée est une porte d'entrée publique**. On n'y exporte que les actions voulues, les autres restent internes.

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

### Fiche sportif, début de P2-01 (20/10)
Avant de pouvoir inviter un sportif, il faut qu'il existe : on a donc créé la table `athlete_profiles` (nom obligatoire, e-mail et téléphone facultatifs, statut actif / en pause / archivé), la liste des sportifs et le formulaire d'ajout. Une fiche **n'est pas un compte** : le sportif n'a pas besoin de se connecter pour que le coach le suive, le lien avec un compte viendra avec l'invitation.

Trois choix de sécurité à retenir. L'**e-mail est unique par organisation** (le même sportif peut être suivi par deux coachs différents, mais pas apparaître deux fois chez le même). Un sportif **ne peut jamais changer d'organisation** : la base n'autorise la modification que de certains champs. Et l'adresse contient l'identifiant de l'organisation (`/coach/o/[orgId]/sportifs`) : c'est la première vraie utilisation de `requireOrgAccess`, testée en remplaçant l'identifiant par celui d'une autre organisation (« Accès refusé »). Ce type d'attaque s'appelle un **IDOR**.

Les champs restent volontairement minimaux : la fiche complète (objectifs, disponibilités, allures) attend la validation de Gianluca. On n'invente pas de règle métier.

### Invitation des sportifs, P1-05 (20/10)
Le coach clique sur « Inviter » à côté d'un sportif, génère un lien et le copie (un vrai bouton « Copier », testé). Il l'envoie lui-même par WhatsApp ou e-mail : pas de faux « message envoyé », les envois automatiques arriveront en P7. Le sportif ouvre le lien, choisit son mot de passe, coche « J'ai 18 ans ou plus » (les mineurs ne sont pas pris en charge pour l'instant), et arrive dans son espace `/app`, volontairement simple et honnête en attendant ses programmes.

Ce qui rend le lien sûr. Il contient 32 octets aléatoires, impossibles à deviner. La base ne stocke **que son empreinte** (hash SHA-256) : même si la base fuitait, aucun lien ne serait utilisable. Il expire après 7 jours, ne sert qu'une fois, et le coach peut le révoquer. Générer un nouveau lien annule l'ancien.

Comment le compte est créé. L'inscription libre est fermée, donc c'est le serveur qui crée le compte, avec la clé secrète, et uniquement pour l'e-mail inscrit sur la fiche par le coach. Puis une **fonction SQL unique et atomique** vérifie tout d'un coup (lien valide, non expiré, e-mail identique, âge confirmé) et relie la fiche au compte. « Atomique » veut dire : soit tout réussit, soit rien ne change.

Côté droits, un sportif ne lit que sa propre fiche et le nom de son organisation, et ne peut jamais entrer dans `/coach`. Après connexion, chacun arrive au bon endroit : coach, sportif ou administrateur. **Avec cette story, P1 (comptes et sécurité multi-coachs) est terminé.**

### Premier design system (« Athlix », orange), P0-05 (20/10)
Antonino a fourni son design system (« Sombre, précis, une seule couleur qui compte ») : graphite en base, orange `#FF5A1F` réservé à l'action, police Geist partout. On l'a traduit en **tokens** : des variables déclarées une seule fois dans `globals.css` (couleurs, rayons, tailles de texte). Les composants utilisent `bg-surface`, `text-muted` ou `bg-accent`, jamais une couleur en dur. Avantage : changer une teinte ou passer au thème clair se fait à un seul endroit.

On a aussi créé la **navigation** : barre latérale sur ordinateur, onglets en bas sur téléphone, avec seulement les sections qui existent vraiment (pas de faux liens). Le tableau de bord affiche de **vrais chiffres** calculés depuis la base, avec une seule carte orange par ligne comme le veut le design system. Pages d'erreur et 404 propres, sans jamais afficher de détail technique.

Méthode de vérification : les 27 tests Playwright ont confirmé que le changement de style ne cassait aucun parcours, puis des **captures d'écran automatiques** (ordinateur et téléphone) ont permis de repérer trois défauts visuels sur mobile, corrigés aussitôt. Le nom de marque est centralisé dans `src/config/brand.ts`. Une recherche a montré que « Athleex » est déjà un logiciel concurrent et qu'« Athlix » est utilisé ailleurs : Antonino a donc choisi **Coory**, appliqué en changeant une seule ligne. Le design system garde ses couleurs et sa police. Marque et nom de domaine à vérifier avant le lancement.

### Vitest et note de décision, fin de P0 (20/10)
Trois niveaux de tests désormais : **pgTAP** pour la base et la sécurité, **Vitest** pour les règles pures (11 tests en 0,3 seconde : validations de formulaires, jetons d'invitation), **Playwright** pour les parcours. La pyramide classique : beaucoup de petits tests rapides, quelques tests complets plus lents. On a aussi écrit une **ADR** (Architecture Decision Record, `docs/adr/0001`) : une page qui dit quelle stack on a choisie, ce qu'on a refusé et pourquoi. Tout nouvel outil devra passer par une ADR. C'est une pratique d'équipe professionnelle, utile en entretien.

### Fiche sportif, recherche et filtres, fin de P2-01 (20/10)
Chaque sportif a maintenant sa **fiche** : on y modifie le nom, le contact et le statut (actif, en pause, archivé) avec un **sélecteur segmenté** du design system. Archiver n'efface rien : le sportif quitte la liste active et peut être restauré. Une règle métier protège la cohérence : quand le sportif a activé son compte, son e-mail devient son identifiant de connexion, donc il n'est plus modifiable depuis la fiche (vérifié côté serveur, pas seulement grisé à l'écran).

La liste a une **recherche** et des **pastilles de filtre**. Choix technique : le filtre est **dans l'adresse** (`?statut=archives&q=camille`), pas dans la mémoire de la page. Avantages : on peut partager ou mettre en favori une liste filtrée, le bouton retour du navigateur fonctionne, et ça marche même sans JavaScript. Les valeurs lues dans l'adresse sont validées par Zod : une adresse bricolée retombe sur des valeurs sûres.

Leçon de test du jour : deux tests lancés **en parallèle** ont créé des sportifs à la même milliseconde, donc avec le même nom « unique ». On ajoute maintenant une partie aléatoire aux noms de test.

### Repères datés et premier module de domaine, P2-03 (20/10)
Chaque sportif peut avoir ses **repères** : allures (endurance, seuil, 5 km… y compris une plage comme `6:40–7:15`), fréquence cardiaque, charges de référence. Chaque mesure est **datée** et l'historique est **immuable** : une nouvelle valeur ne remplace pas l'ancienne, elle s'ajoute ; la plus récente fait foi. La base interdit même la modification d'une mesure (on supprime une erreur puis on ressaisit). Pourquoi ? Parce que les programmes déjà publiés doivent garder les allures de leur époque.

C'est aussi le premier code dans `src/domain/` : la lecture et l'écriture des allures (`4:55` ↔ 295 secondes par km, vitesse en km/h). Ce sont des **règles pures**, sans base de données ni écran, donc faciles à tester (19 tests en quelques millisecondes). Une saisie ambiguë comme `4:5` est refusée avec une explication plutôt que devinée : en sport, une allure mal interprétée, c'est une séance mal dosée.

Piège découvert : avec React 19, un formulaire relié à une action **se vide après chaque envoi, même en cas d'erreur**. Le coach aurait perdu sa saisie au moindre faute de frappe. Les actions renvoient maintenant ce qui a été saisi, et un test vérifie que la saisie reste affichée.

### Calcul des allures depuis un test (20/10)
Décision du coach : les allures se déterminent par un **test de Cooper** (distance maximale en 12 minutes) ou un **test de 5 km**. On en déduit la **VMA** (vitesse maximale aérobie) : distance ÷ 200 pour Cooper, vitesse du 5 km ÷ 95 % pour le 5 km. Chaque allure est ensuite un **pourcentage de la VMA** (endurance 65–75 %, marathon 80 %, seuil 85 %, 10 km 90 %, 5 km 95 %).

Trois choix à savoir expliquer. **Le calcul propose, le coach décide** : il voit l'aperçu en direct, décoche ce qu'il ne veut pas, puis valide. **Le serveur refait le calcul** à partir du résultat brut du test : il ne fait jamais confiance aux chiffres envoyés par le navigateur. Et **la même fonction** sert à l'aperçu (dans le navigateur) et à l'enregistrement (sur le serveur) : c'est l'intérêt d'avoir mis ces règles dans `src/domain/`, sans dépendance à la base. Chaque allure enregistrée garde une note qui dit d'où elle vient.

### Design system Coory rouge, logo et thème clair (22/10)
Antonino a fourni la version finale de la charte, en deux fichiers rangés à la racine : `COORY_DESIGN_SYSTEM.md` et `COORY_LOGO.md`. Le rouge signal `#FF3347` remplace l'orange. Grâce aux **tokens** posés le 20/10, le changement de couleur s'est fait à un seul endroit (`src/styles/tokens.css`) ; le reste du travail a consisté à aligner les composants sur les nouvelles mesures (rayons, tailles, pastilles) et à appliquer une règle plus stricte : **un seul bouton rouge par écran**. Sur la fiche sportif, seul « Enregistrer » reste rouge ; les autres actions passent en bouton « inversé » (clair sur sombre).

Le **logo** n'est pas une image mais un composant React qui dessine le logo en SVG. Avantages : il reste net à toutes les tailles, il prend automatiquement les couleurs du thème, et un lecteur d'écran l'annonce « Coory ». Première version : deux anneaux entrelacés. Version finale, le même jour : **« C∞ry »**, où les deux « o » deviennent une seule **boucle infinie** rouge, le lien continu entre le coach et son sportif. La boucle est un seul tracé SVG (deux arcs reliés par deux courbes), donc plus simple que les anneaux qui demandaient des masques. Grâce au composant, changer de logo n'a touché qu'un fichier : tous les écrans ont suivi. Le composant a deux formes : le **mot** « C∞ry » sur les pages d'accès (accueil, connexion), et dans l'app sur ordinateur, en plus grand ; le **symbole** seul (la boucle) dans l'app sur téléphone, où la place manque. Les deux versions sont dans la page, et une classe Tailwind (`md:hidden`, `hidden md:inline-flex`) montre l'une ou l'autre selon la largeur de l'écran. Le favicon est le même dessin en fichier `icon.svg` : Next.js le détecte tout seul et ajoute la balise dans chaque page. L'icône Apple et le `favicon.ico` (pour les vieux navigateurs), qui doivent être des images, ont été produits en faisant afficher le SVG par le Chromium de Playwright, déjà installé : aucun outil de plus.

Le logo a amené une **troisième police**, Space Grotesk, plus technique, réservée au logo, aux titres et aux grands chiffres (jamais sous 18 px). Tout le reste reste en Geist, plus calme à lire, et les données en Geist Mono. Les trois sont servies par `next/font` depuis notre propre domaine. Une classe `font-display` suffit pour l'appliquer : on l'a ajoutée aux 19 titres de page.

Le **thème clair** se choisit avec un bouton soleil/lune. Il change un seul attribut (`data-theme="light"` sur la balise `<html>`) et toutes les couleurs suivent, puisque les composants ne lisent que des variables. Le choix est gardé dans le navigateur (`localStorage`), et un petit script s'exécute **avant** l'affichage pour éviter un « flash » sombre puis clair au chargement. Un test Playwright vérifie que le choix survit à un rechargement.

Point d'attention noté honnêtement : le texte blanc sur le rouge vif a un contraste de 3,6 pour 1. C'est suffisant pour les gros chiffres et les boutons, mais en dessous de la norme (4,5) pour les petits textes de la carte rouge du tableau de bord. C'est un choix de la charte, à rediscuter si l'accessibilité devient une exigence.

### Décision produit : le business du coach, sans encaisser l'argent (22/10)
Antonino veut que le coach n'ait besoin d'aucun autre outil. Coory suivra donc son activité : forfaits, séances restantes, paiements reçus, relances, puis factures et export pour le comptable. Mais **aucun paiement ne passera par Coory**. Pourquoi ? Encaisser de l'argent pour le compte de quelqu'un d'autre est une activité réglementée : il faut un prestataire de paiement spécialisé, vérifier l'identité de chaque coach, gérer remboursements et litiges. Le suivi et les factures couvrent le vrai besoin, sans ce risque. C'est différent de l'abonnement que le coach paiera à Coory (P8). Les règles de facturation (mentions, TVA, numérotation) seront vérifiées par un comptable avant d'écrire la moindre ligne de code.

### Fiche enrichie, partie 1 : identité, contact et profil sportif (22/10)
La fiche a maintenant un **prénom** et un **nom** séparés, un **canal de contact préféré**, un **niveau**, l'**expérience**, les **lieux d'entraînement** et le **matériel**. C'est la première fois qu'on transforme des données déjà existantes : chaque fiche avait un seul « nom ». La migration le coupe au premier espace (« Camille Test » donne « Camille » et « Test »). Avant de l'appliquer, on a sauvegardé les 128 noms de la base locale, puis comparé après : identiques. C'est la bonne habitude pour toute migration qui touche des données : **prouver qu'on n'a rien perdu**, pas le supposer.

Choix technique à savoir expliquer : le nom complet est devenu une **colonne calculée** par la base (prénom + nom). Personne ne peut l'écrire directement, donc il ne peut jamais contredire le prénom et le nom. Et tout ce qui le lisait déjà (liste, tri, recherche, page d'invitation) a continué de marcher sans modification. Les choix proposés (canaux, niveaux, lieux) sont des **listes fermées** vérifiées deux fois : par Zod dans le serveur, et par une contrainte dans la base. Un formulaire bricolé qui enverrait « pigeon » comme canal est refusé aux deux endroits. Les lieux se cochent comme des pastilles, mais restent de vraies cases à cocher pour le clavier et les lecteurs d'écran.

Pour qu'Antonino puisse « voir » le produit, la base de démo contient maintenant des **sportifs inventés mais crédibles** (Sophie en remise en forme, Thomas coureur avec ses allures, Inès en Hyrox, Nadia en force athlétique…) au lieu des fiches « Camille Test 1792… » laissées par les tests automatiques. Ils sont dans le **seed** : ils reviennent à l'identique à chaque `npm run db:reset`, sans aucune donnée réelle. Les tests, eux, créent leurs fiches temporaires et on remet la base au propre après.

Petit défaut trouvé sur les captures, pas par les tests : une pastille cochée perdait son contraste quand la souris passait dessus. Corrigé en limitant l'effet de survol aux pastilles non cochées. Les tests vérifient que ça marche ; les captures vérifient que c'est lisible.

### Objectifs et compétitions (22/10)
Chaque sportif peut maintenant avoir plusieurs **objectifs** (un semi, un Hyrox, de la force, une remise en forme…), dont **un seul principal**. Une **compétition** est simplement un objectif qui a un nom, un lieu et une date ; pour un Hyrox, on note la catégorie (Open, Pro, Doubles, Relay). Un objectif atteint ou abandonné ne disparaît pas : il passe dans l'historique, comme le premier Hyrox d'Inès. La fiche affiche un compte à rebours (« J-149 »), calculé chaque jour à partir de la date de Bruxelles.

Deux règles sont garanties **par la base**, pas seulement par l'écran : une compétition a forcément une date, et il n'y a jamais deux objectifs principaux en cours (un **index unique partiel** : unique seulement parmi les objectifs principaux en cours). Quand le coach choisit un nouvel objectif principal, le serveur fait d'abord passer l'ancien en secondaire. Autre choix volontaire : le coach peut seulement changer la priorité et le statut d'un objectif ; pour corriger une erreur de saisie, il le supprime et le recrée. C'est plus simple, et la base refuse toute autre modification.

Le nouveau test navigateur a trouvé un vrai défaut, présent aussi dans la fiche de la partie 1. Après un envoi refusé, React remet le formulaire à ses valeurs de départ : les champs texte retrouvaient bien la saisie, mais pas les **listes déroulantes** ni les **cases à cocher**. Un coach qui changeait le niveau puis se trompait de téléphone perdait son choix de niveau. Correction : après chaque réponse du serveur, le formulaire est reconstruit avec la saisie renvoyée. Un test vérifie désormais aussi les listes et les cases.

### Disponibilités et données de santé avec accord (22/10)
La fiche indique maintenant le temps dont le sportif dispose : séances par semaine, jours, durée maximale, contraintes d'organisation. Plus délicat : les **blessures et contraintes physiques**. Ce sont des **données de santé**, protégées par l'article 9 du RGPD : on ne peut les noter qu'avec l'**accord explicite** de la personne. Antonino a choisi que cet accord puisse venir de deux côtés : du sportif lui-même, depuis son espace (« J'accepte »), ou du coach qui note l'accord reçu en précisant comment (oral, écrit, formulaire signé).

Ce qui rend la règle solide, c'est qu'elle est garantie **par la base**, pas par l'écran. Une contrainte de la table refuse tout texte de santé sans accord en cours. La date d'accord ne peut être écrite par personne directement : seulement par deux **fonctions** en base qui vérifient qui appelle (le sportif concerné ou un coach de son organisation), puis écrivent la fiche et le **journal** dans la même transaction. Le journal ne se modifie jamais : on y ajoute seulement « accord donné » ou « accord retiré », avec la date et qui l'a fait. C'est ce qu'on appelle une **piste d'audit**. Retirer l'accord **efface** ce qui avait été noté, et le sportif voit toujours ce que son coach a écrit sur lui.

Les 21 tests SQL de cette partie essaient justement de contourner la règle : écrire la date d'accord à la main, écrire dans le journal, donner l'accord pour quelqu'un d'autre, depuis une autre organisation, sans être connecté. Tout est refusé.

### La fiche à onglets, d'après la maquette d'Antonino (22/10)
Antonino a dessiné la fiche qu'il voulait. On l'a reproduite en gardant deux règles du projet. D'abord le **design system** : pas de dégradé dans l'en-tête, des icônes neutres, un seul rouge par écran. Ensuite **pas de fausse interface** : le bouton « Créer un programme », les menus Programmes ou Séances, la cloche et les phases d'entraînement n'apparaîtront qu'avec les phases qui les rendent réels. Un recruteur qui clique partout ne doit jamais tomber sur un bouton qui ne fait rien.

La fiche a maintenant une **vue d'ensemble en lecture** (profil, objectif actuel, disponibilités, repères) et des **onglets** pour modifier. Chaque bouton « Modifier » ouvre l'onglet qui contient le formulaire. Comme pour les filtres de la liste, l'onglet ouvert est **dans l'adresse** (`?onglet=objectifs`) : un lien peut ouvrir directement la bonne partie de la fiche, et le bouton retour du navigateur fonctionne. Les chiffres clés en haut (prochaine compétition dans 149 jours, séances souhaitées…) sont **calculés** à partir des données déjà saisies : rien n'est stocké en double.

Côté tests, une dizaine de parcours remplissaient les formulaires directement sur la fiche. Il a suffi d'une petite fonction partagée, « ouvrir l'onglet », ajoutée aux bons endroits. C'est l'intérêt d'écrire les tests comme un humain qui cherche un bouton par son nom, et non par sa position dans la page.

Après coup, on a relu la maquette d'un œil critique. Deux défauts ont été corrigés : les mêmes informations apparaissaient deux fois (dans les chiffres clés et dans les cartes), et sur téléphone, les cinq chiffres clés repoussaient les onglets hors de l'écran. Ils forment maintenant un bandeau qui défile de côté. Autre constat honnête : ces chiffres clés sont provisoires. Ceux qu'un coach regarde vraiment (séances faites, dernier RPE, régularité) n'existeront qu'avec l'espace sportif (P6) ; c'est noté dans la roadmap.

### Notes du coach et historique (22/10)
Le coach a deux notes par sportif : une **privée**, et un **message** que le sportif lit dans son espace. Choix à savoir expliquer : elles sont dans une **table à part**, pas dans la fiche. Pourquoi ? Le sportif a le droit de lire sa propre fiche ; une note privée rangée dedans lui serait donc lisible. Dans leur propre table, la règle de sécurité (RLS) ne lui montre que le message qui lui est destiné. Un test SQL vérifie précisément qu'il ne voit jamais la note privée. Sous la note privée, un rappel dit de ne pas y écrire de blessures : les notes libres sont le chemin classique par lequel des données de santé fuient sans accord.

L'**historique** est une frise construite à partir de ce qui existe déjà : la date de création de la fiche, des objectifs, des mesures, des accords, des invitations et des notes. On n'a ajouté aucune table « journal » : chaque événement est déjà daté là où il est enregistré. La fonction qui assemble et trie la frise est **pure** (sans base de données), donc testée en quelques millisecondes, y compris un piège : comparer des dates écrites dans des fuseaux différents.

### Sexe du sportif et une app plus colorée (22/10)
Antonino voulait une app plus intuitive : distinguer d'un coup d'œil les femmes et les hommes, et plus de couleur partout. Pour le sexe, on n'a pas « deviné » à partir du prénom : on a ajouté un vrai champ, **facultatif**, avec trois valeurs (Femme, Homme, Non précisé), contrôlé par la base comme par Zod. Il a une utilité métier (les catégories Hyrox), ce qui justifie de le demander. L'affichage est un petit symbole ♀ rose ou ♂ bleu ciel à côté du nom ; pour un lecteur d'écran, il est annoncé « Femme » ou « Homme », car un symbole seul ne se lit pas. L'avatar, lui, garde la couleur de la discipline : une couleur = une seule signification.

Pour les couleurs, un réflexe à retenir : quand deux écrans affichent la même chose (les repères dans la vue d'ensemble et dans l'onglet Repères), on crée **un seul composant partagé**. La règle « allure = bleu, race pace = orange, FC = rouge, charge = violet » n'existe donc qu'à un endroit. Le script de contraste a encore servi : en thème clair, le texte gris des cartes teintées du tableau de bord passait juste sous le seuil ; on a baissé la teinte de 7 % à 5 % plutôt que de renoncer à la couleur.

### Graphique d'évolution des repères (22/10)
Dernière étape de la fiche à onglets : une courbe montre comment un repère évolue (la VMA de Thomas, la race pace d'Inès, le squat de Nadia). Choix à savoir défendre : **aucune bibliothèque de graphiques**. Une courbe, quelques graduations et une bulle au survol tiennent en un composant SVG ; ajouter Recharts ou Chart.js aurait alourdi l'app pour un seul écran, contre la règle « pas d'outil sans besoin démontré ».

Le travail est séparé en deux. La **préparation des données** (regrouper les mesures par repère, choisir des graduations rondes, écrire « 0,9 km/h de plus depuis le 14 avril ») est une fonction pure, testée par Vitest. Le **dessin** est un petit composant navigateur qui ne reçoit que le résultat. Quelques règles de lecture : jamais deux unités sur un même axe (une courbe à la fois), l'écart entre deux points respecte le temps réellement écoulé, et pour une allure l'axe est inversé, pour que « monter » veuille toujours dire « progresser ». Accessibilité : les mêmes informations qu'au survol s'obtiennent au clavier, et un tableau donne toutes les valeurs sans graphique.

### Records personnels (22/10)
Dernier morceau de la fiche demandée par le coach. Même philosophie que les repères : on n'écrase jamais une performance, on en ajoute une nouvelle avec sa date, et le **record se calcule** (le meilleur temps). Pour Hyrox, la base refuse un temps sans catégorie, car un chrono en Pro ne se compare pas à un chrono en Open. Les bornes de vraisemblance attrapent les fautes de frappe : « 3:15 » pour un marathon veut dire 3 minutes 15, donc la saisie est refusée avec un exemple au bon format.

Incident instructif : en test, un Hyrox a été enregistré comme un 5 km. Après une erreur, React 19 remet les champs du formulaire à leur valeur de départ ; le menu « Épreuve » revenait sur « 5 km » alors que l'écran affichait encore les champs Hyrox. Correctif : reconstruire le formulaire après chaque réponse du serveur. Leçon : un test de bout en bout qui **vérifie le résultat enregistré**, pas seulement le message « ajouté », attrape ce genre de bug silencieux.

### Agenda, première couche : les compétitions (22/10)
Le coach a une page Agenda. Comme les séances n'existent pas encore, elle montre d'abord ce qui est réellement daté : les compétitions et objectifs des sportifs. Antonino a ensuite précisé sa vision : l'agenda est surtout celui de **ses séances encadrées** (collectives chaque semaine, individuelles), les compétitions restent comme calque. Le calcul du calendrier (grille du lundi au dimanche, changement de mois) est une fonction pure testée, faite en UTC pour éviter le piège du passage à l'heure d'hiver. Les filtres sont dans l'adresse, comme pour la liste des sportifs : partageables et utilisables sans JavaScript.

### Séances encadrées du coach, fin de P2 (22/10)
Antonino a précisé sa vision : l'agenda du coach, ce sont **ses séances en présentiel**. Une séance collective (« chaque mercredi à 19 h sur piste », avec ses inscrits) ou individuelle (avec un sportif). Choix technique à savoir défendre : on enregistre **la règle** (premier jour, heure, chaque semaine, date de fin éventuelle), **jamais la liste des dates**. Les dates sont calculées à l'affichage par une fonction pure et testée. Avantages : pas de milliers de lignes à générer, et changer l'heure ou arrêter la séance mi-décembre modifie toutes les dates d'un coup. La contrepartie est assumée et notée (`OPEN-18`) : annuler un seul mercredi demandera plus tard une table d'exceptions.

Deux détails de sécurité : le serveur revérifie que chaque sportif inscrit appartient bien à l'organisation (on ne fait jamais confiance à la liste envoyée par le navigateur), et la base refuse de changer le type d'une séance ou son sportif (droit de modification colonne par colonne). L'heure est stockée en heure locale de Bruxelles : un agenda de salle se lit à l'heure du lieu, et le calcul des dates se fait en jours, donc le passage à l'heure d'hiver ne décale rien. Les séances que Gianluca prépare dans les programmes viendront s'ajouter à cet agenda avec P4 à P6.

### Le tableau de bord de la maquette, sans faux chiffres (22-23/10)
Antonino a fourni la maquette du tableau de bord qu'il veut. Difficulté : la moitié des cartes parle de modules qui n'existent pas encore (programmes, factures, revenus, tâches). Choix fait avec lui : la page prend **exactement la mise en page** de la maquette, ce qui existe affiche de vraies données (séances de la semaine, sportifs, agenda), et le reste est dessiné avec un badge « Bientôt » et sa phase. Un recruteur ou un coach voit tout de suite ce qui marche et ce qui arrive, sans être trompé par des chiffres inventés.

Les **photos de profil** sont une vraie fonctionnalité de stockage. Les images vont dans un espace **privé** de Supabase Storage ; elles n'ont aucune adresse publique, l'app les sert par sa propre route après avoir vérifié la session, et ce sont les règles de la base (RLS) qui décident qui peut les voir : un coach de l'organisation B ne peut pas télécharger la photo d'un sportif de A, même en connaissant l'adresse (un test le vérifie). On ne fait pas confiance au nom du fichier ni au type annoncé : on lit les premiers octets pour reconnaître un vrai JPEG, PNG ou WebP. Les photos de démonstration sont libres de droits et ne sont chargées qu'en local, par un script qui refuse de tourner ailleurs.

Sur téléphone, l'agenda reprend le principe du calendrier de l'iPhone : trois jours en colonnes qu'on fait défiler, en commençant par aujourd'hui. Petit point technique instructif : pour que la colonne des heures reste collée à gauche pendant le défilement, les largeurs sont exprimées en **unités de conteneur** (`cqw`, la largeur de la zone qui défile) plutôt qu'en pourcentages. Enfin, les tests ont révélé un vrai bug : sur téléphone, la liste de la semaine passait par-dessus la barre d'onglets du bas et volait les clics ; le menu hamburger a remplacé cette barre.

### Les couleurs de la maquette, mesurées plutôt que devinées (23/10)
Pour coller aux maquettes, on n'a pas choisi les couleurs à l'œil : un petit script lit la couleur exacte des pixels sur les images (fond bleu nuit #0B1019, panneaux #121821, blocs d'agenda…), puis un second calcule le contraste de chaque texte sur chaque fond **avant** de toucher au code. Grâce aux jetons de couleur, le changement tient en quelques lignes et s'applique à toute l'app. Un piège évité : des teintes plus fortes rendaient le gris illisible en thème clair ; l'intensité des teintes est donc devenue elle-même un jeton, différent pour chaque thème.

### L'inscription libre (23/10)
Jusqu'ici, les comptes étaient créés à la main. Désormais, un coach ou un sportif s'inscrit seul. Trois choix à savoir expliquer. **Confirmation de l'e-mail obligatoire** : sans elle, n'importe qui pourrait créer des espaces au nom d'une adresse qui n'est pas la sienne. **Un message identique** que l'adresse soit nouvelle ou déjà inscrite : sinon, le formulaire servirait à découvrir qui utilise Coory. **La création de l'organisation passe par une fonction de la base** (`complete_signup`) : le navigateur ne peut jamais s'attribuer le rôle de propriétaire lui-même, et la fonction refuse un compte non confirmé ou déjà finalisé.

Google, Facebook et Apple sont **préparés mais pas activés** : il faut des clés chez chacun. Plutôt que d'afficher des boutons qui ne marchent pas, un bouton n'apparaît que si son fournisseur est déclaré configuré. Leçon au passage : un test qui modifie un compte de démonstration partagé finit par abîmer les données de quelqu'un ; chaque test doit utiliser un compte qui lui est réservé.

### Les pages d'accès redessinées (23/10)
Antonino a fourni un brief précis (`COORY_AUTH_PAGES.md`). La règle : changer la présentation sans toucher à la logique. Les actions serveur de connexion et d'inscription sont restées les mêmes ; seule l'inscription renvoie en plus le nom du champ en erreur, pour afficher le message au bon endroit. Petite astuce CSS : le sur-titre « Espace coach / Espace sportif » du panneau de gauche suit le choix fait dans le formulaire sans une ligne de JavaScript, grâce au sélecteur `:has()` (« si la case sportif est cochée quelque part dans la page »). La page d'accueil a disparu : un coach ou un sportif arrive directement sur la connexion.

### Un nouveau cap : construire d'après les prototypes de Claude Design (23/10)
Antonino a fait dessiner toute l'app par Claude Design (prototypes interactifs téléphone et ordinateur, planche de 57 pages), puis a fourni un prompt de développement. La construction suit désormais ses 7 étapes ; les phases restent la référence du contenu. Choix important : chaque page reste **branchée sur les vraies données** (pas de fausses données dans l'app), l'apparence suit le prototype.

Étape 1 : les **jetons et les composants**. Les couleurs du projet sont gardées (le prompt le demande), seuls les jetons manquants sont ajoutés. Chaque composant de base est réécrit d'après les mesures du prototype : boutons de 44 px, champs de 50 px en 16 px (en dessous, l'iPhone zoome sur le champ), pastilles de 40 px. Les fenêtres (feuille du bas, menu « ••• », confirmation) reposent sur l'élément HTML natif `<dialog>` : le navigateur fournit gratuitement le focus piégé, la touche Échap et l'annonce aux lecteurs d'écran. Une **vitrine** (`/design/composants`, en développement seulement) affiche tous les composants en sombre et en clair, pour les comparer au prototype côte à côte.

Étape 2 : les **coquilles de navigation**. Trois espaces partagent le même cadre (`AppShell`) : une barre latérale sur ordinateur, et sur téléphone une barre du haut avec le titre de la page au centre, plus un menu hamburger (coach, admin) ou une barre d'onglets en bas (sportif, pour atteindre sa séance du jour en deux gestes). Le titre de la barre du haut se déduit de l'adresse de la page : le cadre n'a pas besoin que chaque page le lui dise. Les modules pas encore construits ont désormais leur vraie adresse (`/coach/programmes`…) et une page vide honnête : quand un module sera construit, seule sa page changera, pas le menu. Piège rencontré : en Tailwind, une taille de texte nommée « page » se confondait avec la couleur « page » ; la classe `text-page` peignait le titre en bleu nuit sur fond bleu nuit. Renommée `text-heading`.

Retouche demandée par Antonino après l'étape 2 : le **thème clair devient le défaut**. Plutôt que de poser un attribut sur chaque page, les couleurs claires sont maintenant celles de `:root`, et le sombre s'active par `data-theme="dark"`. Le bloc sombre est écrit après le bloc clair : à spécificité égale, c'est le dernier qui gagne. Sur la connexion, une carte de marque n'apparaît que sur téléphone ; pour centrer le formulaire sans toucher aux autres pages, la page se signale par un attribut (`data-mobile-fill`) et la coquille ne lui donne toute la hauteur que si elle le trouve (`:has()`). Des captures avant / après comparées pixel par pixel ont prouvé que l'inscription n'avait pas bougé.

Étape 3 : les **pages d'entrée**. La logique ne bouge pas, mais chaque action renvoie maintenant une erreur par champ, pour l'afficher sous le bon champ comme le prototype. Nouveauté : la page « Vérifie ta boîte mail ». Pour y afficher l'adresse sans la mettre dans l'URL (elle finirait dans l'historique et les journaux), l'inscription la range dans un cookie illisible par le navigateur (httpOnly) pendant une heure, la durée du lien. La page « Bienvenue » montre l'écran du prototype quand l'inscription par e-mail a déjà tout fourni ; un clic crée l'espace. Piège rencontré : le serveur de développement servait encore l'ancien cadre des pages d'accès malgré le bon fichier ; la vérification s'est faite sur la version de production, qui était juste.

Étape 4a, première partie : un **tableau de bord vivant et un agenda qu'on manipule**, retouchés en direct avec Antonino. Il voulait voir des tâches et des messages dans les cartes du haut ; plutôt que d'inventer des chiffres dans le code, on a créé les **vraies tables** (tâches, messages, suivi des factures), protégées par organisation comme le reste, et seul le **jeu de démo** les remplit. Une tâche se coche d'un rond, comme dans l'app Rappels de l'iPhone : l'écran change tout de suite (`useOptimistic` de React), le serveur enregistre, et si l'enregistrement échoue, le rond revient seul. Qui a coché la tâche est écrit par la base elle-même, jamais envoyé par le navigateur. Ouvrir une conversation marque ses messages lus, mais seulement **après** l'affichage, dans le navigateur : un simple préchargement de la page ne doit rien marquer.

L'agenda est devenu interactif. Un clic sur un créneau vide ouvre la fenêtre « Nouvelle séance » au bon jour et à la bonne heure, et c'est **la même fenêtre partout** (tableau de bord, Agenda, Séances), montée une seule fois dans la coquille de l'espace coach. Une séance se **glisse** à la souris ou, sur téléphone, après un appui long (sinon le doigt ne pourrait plus faire défiler les jours). Le vrai problème était métier : déplacer « Piste du mercredi », c'est déplacer une date ou toute la série ? On demande à chaque fois. Une date seule devient une ligne d'**exception** (date d'origine, nouvelle place), et toute la série se décale avec ses exceptions dans **une seule fonction SQL**, donc en une transaction : jamais une série à moitié déplacée. Le calcul des dates d'une séance est centralisé dans une fonction pure, testée, utilisée par la grille, les listes et la fiche. Enfin, un **nouveau sportif** se crée depuis la fenêtre même : on tape son nom, sa fiche minimale existe aussitôt dans Sportifs et la séance lui est rattachée. Une première version laissait la séance « sans sportif » en attendant ; Antonino a préféré la fiche tout de suite, plus simple : la règle « une séance individuelle a toujours son sportif » est revenue, par une nouvelle migration qui n'a rien perdu. Une icône signale les fiches **à compléter** (sans nom de famille, ou sans moyen de contact) ; ce n'est pas une case cochée en base mais un calcul, donc le repère disparaît tout seul dès que la fiche est complète.

Premier retour du coach lui-même (D-36) : il ne savait pas combien il gagnait par semaine. La vraie question était « qu'est-ce qui compte comme chiffre d'affaires ? ». Réponse : l'**argent reçu**, le jour où il est reçu (un forfait de 3 000 € payé d'avance compte ce jour-là). On a donc créé une table des **paiements reçus**, sans se lancer tout de suite dans les forfaits. Le coach note le montant **TVA comprise** (c'est ce qu'il a en main) et le taux ; le HTVA et la TVA se calculent, en centimes entiers pour ne jamais perdre un centime d'arrondi (HTVA arrondi, TVA = le reste, donc le total tombe toujours juste). Le mode de paiement sépare ce qui arrive sur le compte bancaire (virement, Bancontact) du reste. Les messages non lus quittent les grandes cartes pour une **pastille rouge**, comme sur l'iPhone, sur l'entrée Messages et la cloche.

Antonino a repéré une incohérence : la cloche affichait « 3 », mais la page Notifications était vide. La page est devenue réelle, rangée en sections (messages non lus, tâches du jour ou en retard, factures en retard, fiches à compléter). Il n'y a **pas de table des notifications** : chaque section est une requête sur les données existantes, donc une notification disparaît d'elle-même quand la chose est faite, et elle ne peut jamais être « en retard » sur la réalité.

Derniers réglages du cadre (D-38) : le menu de gauche gagne « Assistant IA » et « Notifications », et la carte de la personne devient un **menu du compte** (Mon profil, Paramètres, Changer de compte, Thème, Se déconnecter), dessiné d'après une maquette d'Antonino. Le thème accepte maintenant « Système » : le petit script lancé avant l'affichage suit le réglage de l'appareil, même s'il change pendant la visite. Piège rencontré : un menu qui doit déborder d'une barre latérale qui défile est coupé par celle-ci ; il est donc positionné par rapport à l'écran (position fixe), calculée sur la carte au moment de l'ouverture.

Côté outils de développement, deux causes faisaient sans cesse déconnecter Antonino : « Se déconnecter » fermait toutes les sessions du compte (les tests, connectés avec le même compte, le déconnectaient aussi), et chaque remise à zéro de la base effaçait les sessions. La déconnexion ne ferme plus que l'appareil, comme partout, et `npm run db:reset` garde les sessions récentes et le profil du développeur. Ce script a lui-même eu un défaut instructif : enchaîné par `&&`, il ne restaurait rien quand le reset échouait, et la sauvegarde suivante écrasait la bonne copie. Il restaure maintenant toujours, et une sauvegarde ne recule jamais.

Étape 4a, deuxième partie : la **liste des sportifs**. Antonino a remplacé les libellés d'accès (« Compte activé », « Invitation en attente », « Sans compte ») par des signes plus discrets : une petite icône message, qui ouvre directement la conversation, et un fond vert très doux pour un compte activé ; une petite icône pour une invitation envoyée ; rien du tout sans compte, seulement le bouton « Inviter ». Les chiffres du haut (actifs, en pause, compétitions à venir, fiches à compléter) sont calculés sur la même lecture que la liste, et les filtres sont dans l'adresse (`?statut=`, `?discipline=`) : un filtre se partage et survit au rechargement. Leçon de test : une icône dont le nom accessible contient « Nom de famille » entrait en collision avec le champ du même nom dans les tests ; le texte caché aux yeux (sr-only) plus une infobulle évitent ce piège.

Puis Antonino a dessiné la liste qu'il voulait : un **tableau** où le statut et le type de programme se changent d'un appui sur leur pastille, plus des cases à cocher pour agir sur plusieurs sportifs à la fois. Question de fond : le « type de programme » était jusque-là **déduit** de l'objectif principal. Pour qu'un sportif qui a fini son Hyrox repasse en Hybride sans toucher à ses objectifs, c'est devenu un **vrai champ** de la fiche, par une nouvelle migration, avec son test SQL (le coach le change pour ses sportifs, jamais pour ceux d'une autre organisation, et le sportif ne le change pas lui-même). Une seule action serveur sert à la fois pour une ligne et pour une sélection : la liste d'identifiants vient du navigateur, donc elle est validée (Zod) et la mise à jour est limitée à l'organisation du coach. Sur téléphone, le tableau devient une carte par sportif : les mêmes cellules, rangées autrement par la grille CSS (`display: contents` sur ordinateur). Piège de test : un texte caché « Sélectionner Thomas Peeters » pour la case à cocher faisait trouver deux fois « Thomas Peeters » ; le nom est passé sur la case elle-même (`aria-label`).

Retouches du 26/10, sur le vrai téléphone d'Antonino. D'abord un piège de développement : le bouton « œil » du mot de passe ne répondait pas. Le bouton n'était pas en cause : ouvert par l'adresse du Mac sur le Wi-Fi, Next 16 bloque par sécurité le JavaScript en développement ; la page s'affichait et la connexion marchait (un formulaire fonctionne sans JavaScript), mais rien d'interactif. Une ligne de configuration autorise le réseau de la maison. Ensuite, trois retouches : sur téléphone, les filtres deviennent deux boutons qui montrent le choix en cours et ouvrent la liste des choix, au lieu de rangées de pastilles qui passent à la ligne ; la vue d'ensemble de la fiche sépare chaque information par un filet, libellé au-dessus, valeur en dessous, comme le prototype ; et un objectif se **modifie** enfin. Côté base, la règle était volontaire (« pour corriger : supprimer puis recréer ») : une migration ouvre la modification des seuls champs de saisie, jamais le sportif ou l'organisation, et le test SQL le vérifie. La fenêtre de modification réutilise exactement les champs de l'ajout : une seule source de règles.

Le même jour, un **audit** du tableau de bord et des sportifs face au prompt Claude Design a confirmé l'ordre de travail et fait ressortir ce qui manquait à la fiche. Elle gagne le bouton rouge « Créer un programme » : créer un programme depuis un sportif est, pour Antonino, le cœur de l'application. En attendant le module, le bouton mène à la page Programmes. Elle gagne aussi un menu « ••• » identique à celui de la liste, une carte « Prochaines séances » (réutilisant le calcul de l'agenda, déjà testé, filtré sur le sportif) et un « temps visé » sur les objectifs. Leçon : une carte d'une grille CSS sans colonnes déclarées prend la largeur de son plus long texte sur une ligne ; `grid-cols-1` (une colonne de largeur `minmax(0, 1fr)`) la ramène à celle de l'écran.

Puis le **cœur** : les programmes. Antonino a montré le tableur de Gianluca et ses maquettes : une ligne par semaine, des séances numérotées, **sans jour** (le sportif les place quand il veut). Le cahier des charges avait déjà prévu la bonne structure : un programme, des **versions publiées figées** (le sportif suit toujours une version précise, que le coach ne peut pas modifier en douce), et une ligne par séance publiée, repérée par sa semaine et son numéro ; c'est cette ligne que les retours du sportif viseront. Le contenu d'une séance est un **objet structuré** (étapes, bloc « Répéter 4 fois », conseils), vérifié à chaque lecture : une donnée mal formée est écartée plutôt qu'affichée de travers. On a commencé par l'**affichage**, avec un programme de démo inventé de 12 semaines, pour valider la forme avant de construire l'éditeur, qui est la partie la plus délicate. Les tables sont en lecture seule depuis le navigateur tant que la publication contrôlée n'existe pas.

Deux leçons. Une zone de message toujours présente avec `role="status"` se confond avec les messages de statut des formulaires : les tests qui cherchaient « le » statut en trouvaient deux. Et le serveur de développement peut garder une ancienne version d'un module : une constante nouvellement exportée arrivait `undefined` ; la déplacer dans un nouveau fichier a suffi.

En fin de journée, le **tableau de bord** a été recentré sur ce que Gianluca doit voir en premier : ses tâches et l'argent encaissé dans la semaine. Les chiffres de l'agenda (coachings du jour, heures de la semaine) descendent sous le calendrier, en petites tuiles colorées. Ces tuiles existaient déjà sur la page Agenda, écrites directement dans la page : elles deviennent un composant partagé (`StatTiles`), pour que les deux pages gardent le même style sans copier le code. La vue « Aujourd'hui » de la page Agenda reprend la grille horaire du tableau de bord au lieu d'une liste. Leçon d'accessibilité : quand le libellé complet d'une carte est masqué sur téléphone au profit d'un titre court, le lien perd son nom pour les lecteurs d'écran ; un `aria-label` complet le lui rend, et les tests qui cherchaient la carte par son nom l'ont signalé aussitôt.

Dernier chantier du jour : **le prix des séances**. Antonino voulait, où qu'une séance soit créée, un prix, une case TVA et le mode (espèces ou virement), reliés à la carte « Encaissé cette semaine ». Le choix important : une séance avec un prix n'est **pas** de l'argent reçu. On garde la règle de la comptabilité (l'encaissé, c'est ce qui est vraiment arrivé) et on relie les deux : sur la page de la séance, chaque date se « marque payée », ce qui crée un vrai paiement reçu, daté du jour, avec le montant, la TVA et le mode de la séance, calculés par le serveur, jamais envoyés par le navigateur. Un index unique en base garantit qu'une date ne se paie qu'une fois, même en cliquant deux fois. Puis deux retours de Gianluca ont affiné le modèle. D'abord, certains sportifs paient **trois mois d'avance** : un paiement peut couvrir une période, il compte en entier la semaine où il est reçu, et les dates du sportif dans la période se montrent « comprises dans le forfait ». Ensuite, sa façon de compter : **facturé par virement = prix hors TVA, la TVA s'ajoute** (65 € deviennent 78,65 €) ; **en espèces = prix direct**. Plutôt que deux prix, le formulaire garde un seul prix et une case « TVA comprise » que le mode choisi règle tout seul, modifiable. Leçon : les règles d'un métier arrivent par petites phrases, après coup ; un modèle simple (un prix, un mode, une case) les absorbe sans tout refaire.

### Le nouveau sportif, en une seule page (28/10)
La page « Nouveau sportif » ne demandait que le nom et le contact ; tout le reste se remplissait ensuite onglet par onglet. Elle reçoit maintenant la fiche complète en une fois : profil, objectif principal, disponibilités, et une carte « Accord santé ». Le choix important : **ne rien réécrire**. Les champs des onglets Profil et Disponibilités ont été sortis dans des composants partagés, et la lecture du formulaire réutilise les règles déjà testées (fiche, disponibilités, objectifs, accord). Un sportif créé ici est donc exactement celui qu'on aurait obtenu onglet par onglet. L'accord santé suit la même voie que sur la fiche : une fonction SQL qui vérifie qui appelle et journalise l'accord, et la base refuse toute contrainte physique sans accord en cours. Leçon de test : Next 16 garde la page quittée cachée dans le DOM ; avec un formulaire plus riche, des libellés comme « Domicile » existaient deux fois. Les tests ciblent donc les éléments visibles, ou passent par le rôle (case à cocher, liste déroulante), qui ignore les éléments cachés.

### L'audit du mouvement, façon Apple (28/10)
Un audit fondé sur les conférences de design d'Apple a fait ressortir ce qui séparait Coory d'une « vraie » app : les fenêtres apparaissaient d'un coup. Elles montent maintenant du bas avec un **ressort** : pas une durée fixe, mais un mouvement qui part de la vitesse du doigt quand on lâche la fenêtre après l'avoir glissée. Le navigateur sait animer une courbe décrite point par point (`linear()`) : on calcule cette courbe à partir de la physique d'un ressort, sans bibliothèque. Deux leçons. D'abord, **ne jamais bloquer l'interface pendant une animation** : une fenêtre qui se ferme en glissant restait « modale » quelques dixièmes de seconde, et la page ne répondait pas. La vraie fenêtre se ferme désormais tout de suite, et c'est une copie visuelle, inerte, qui joue la sortie. Ensuite, les tests automatiques ont trouvé deux vrais défauts de geste : le relâcher d'un glissé passait pour un clic sur le fond, et un message d'erreur qui apparaît pendant l'appui faisait bouger le bouton sous le doigt.

### La case Notes et les données de santé (28/10)
Antonino voulait une case où Gianluca note les blessures, et une autre où il écrit ce qu'il veut. Le piège : mettre les deux dans le même champ. Une blessure est une **donnée de santé**, que le RGPD protège plus fort que le reste : on ne la garde qu'avec l'accord explicite du sportif. Une préférence (« n'aime pas courir le matin ») n'en est pas une. Deux cases donc : « Blessures et points d'attention », qui n'apparaît qu'avec l'accord et que la base refuse sans lui, et « Notes libres », privées entre coachs. Le champ santé quitte l'onglet Disponibilités et s'enregistre par sa propre action : modifier ses horaires ne peut plus effacer une blessure par accident. Leçon : la bonne structure de données vient parfois d'une règle juridique, pas d'un besoin d'écran.

### Des Paramètres de vraie app (28/10)
Pour faire des Paramètres « comme une vraie app », on a regardé ce que proposent les outils de coaching et de facturation, et gardé cinq sections : Profil, Préférences, Facturation et légal, Sécurité, Données. Le choix important : **chaque réglage fait vraiment quelque chose**. La durée, le lieu, le prix et le mode proposés d'office préremplissent la fenêtre « Nouvelle séance » ; les heures de l'agenda règlent les grilles ; les interrupteurs de la cloche changent son compteur et la page Notifications. Un réglage qui ne change rien serait un faux écran. Côté légal, Gianluca a deux structures (son activité d'indépendant et l'ASBL) : on en enregistre plusieurs, avec des numéros **vérifiés par leur clé de contrôle** (le numéro d'entreprise belge et l'IBAN se vérifient par un calcul modulo 97), ce qui attrape une faute de frappe avant qu'elle n'arrive sur une facture. Côté sécurité, changer de mot de passe redemande l'actuel, et l'export JSON donne toutes les données de l'organisation, comme le RGPD le prévoit. La suppression complète d'un compte est volontairement repoussée : il faut d'abord décider quoi faire des sportifs liés et de leurs photos.

### Les Paramètres en fenêtre, comme Claude.ai (28/10)
Antonino n'aimait pas la page des Paramètres : on quittait ce qu'on faisait pour y aller. Il voulait qu'un clic sur son nom, puis « Paramètres », ouvre une grande fenêtre par-dessus la page, comme les réglages de Claude.ai. Première piste, les **routes interceptées** de Next.js (l'adresse change, mais la page reste derrière) : le routage strict de Next 16 l'a refusée (page de connexion en 404, puis deux routes jugées identiques). On a donc choisi plus simple : un **contexte React** qui ouvre la fenêtre et charge les données à l'ouverture, par une action serveur qui revérifie qui demande. Le contenu est un seul composant, partagé entre la fenêtre et la page complète, qui reste pour un lien direct. Leçon technique : un fichier marqué `"use client"` ne doit exporter que des composants ; la liste des sections, exportée depuis ce fichier et lue par une page serveur, arrivait sous forme de « référence client » et faisait planter la page (`SECTIONS.find is not a function`). Elle vit maintenant dans un petit module neutre que les deux côtés lisent.

### Les outils, tranche 1 : des tâches qu'on gère vraiment (28/10)
Les tâches se cochaient, mais on ne pouvait ni en créer, ni en corriger, ni en supprimer. Le choix : une seule fenêtre « tâche », montée une fois pour toutes les pages coach, comme « Nouvelle séance ». Elle s'ouvre vide pour créer, ou remplie quand on touche le titre d'une tâche, et la suppression passe par une confirmation. Les règles du formulaire sont écrites une fois (Zod) et la base les répète (contraintes, droits par colonne) : le navigateur ne peut pas glisser une catégorie inventée ni changer l'organisation d'une tâche. Leçon d'écran : sur téléphone, mettre les pastilles à droite du titre le coupait au bout de quelques mots ; on les a passées dessous, et le titre tient sur deux lignes.

### Les outils, tranche 2 : des documents privés (28/10)
Pour les documents, la question n'était pas l'écran mais la confiance : un contrat ou une facture ne doit jamais être lisible par un autre coach. On a repris le modèle des photos : un espace de stockage **privé**, rangé par dossier d'organisation, avec des règles RLS sur les fichiers eux-mêmes, et une route de l'app qui sert le fichier avec la session de la personne. Une autre organisation reçoit un 404, comme si le document n'existait pas. Deux précautions de plus : le format est lu dans les premiers octets du fichier (un texte renommé en .pdf est refusé), et le chemin de stockage est tiré au hasard, jamais le nom envoyé par le navigateur. Leçon d'écran : l'envoi se fait « à la main » plutôt que par l'action automatique du formulaire, car React vide le formulaire après l'envoi ; en cas d'erreur, le fichier choisi et les champs restent en place.

### Les outils, tranche 3 : lire et masquer des notifications calculées (28/10)
Les notifications de Coory ne sont pas stockées : elles sont calculées à partir des vraies données (une tâche en retard, une facture impayée). Comment alors en « lire » une ? On garde seulement l'état choisi par le coach, rangé sous une **clé** qui décrit la situation : « cette tâche, avec cette échéance ». Si la tâche est reportée, la clé change, et la notification revient non lue, ce qui est le comportement attendu. Chaque coach a ses propres états (lire n'efface rien pour un collègue). Leçon de test : un test qui compte la cloche du coach A échouait au hasard, parce qu'un autre test créait en même temps des compétitions pour ce même coach. Le test tourne maintenant avec le coach B, en série, et remet tout en place à la fin.

### Les outils, tranche 4 : une recherche qui ne fait pas confiance à la saisie (28/10)
La recherche globale interroge cinq tables à la fois et range les résultats par groupe pendant qu'on tape. Le point délicat : ce que le coach tape finit dans une requête SQL de type « contient ». Les caractères spéciaux de cette requête (`%`, `_`) sont donc échappés, et ceux qui servent à combiner des filtres (virgules, parenthèses) deviennent des espaces : taper « %% » ne renvoie pas toute la base, et un test le vérifie. Comme partout, l'action revérifie l'organisation et la RLS fait le reste : le document d'un autre coach ne sort jamais. Côté écran, seule la dernière réponse compte : si une recherche lente arrive après une plus récente, elle est ignorée. Leçon : un état React ne se met pas à jour dans un effet ; la recherche part du gestionnaire de saisie, ce qui est aussi plus simple à lire.

### Le design « Graphite & Or », sans toucher à l'architecture (29/10)
Antonino a fourni un nouveau design system et des images de référence. Consigne : changer **le style seul**, pas la structure ni les fonctionnalités. Les **tokens** ont tout rendu possible : couleurs, polices et rayons sont déclarés à un seul endroit (`tokens.css`, `globals.css`), donc la plupart des écrans ont changé sans être ouverts. La palette des disciplines a été recalculée en **OKLCH**, un espace de couleur où la luminosité est fiable : toutes les couleurs ont la même clarté et seule la teinte change, d'où un ensemble qui « va ensemble », lisible en sombre comme en clair. Chaque couleur a un rôle fixe : l'or pour l'action, le rouge pour les erreurs et les suppressions, l'orange pour les retards.

Trois petites mécaniques méritent d'être expliquées. Le **menu repliable** retient son état dans le navigateur, et un script lu avant l'affichage évite que le menu « saute » au chargement (comme pour le thème). La **flèche retour** se souvient de la page précédente et de son titre (dans `sessionStorage`, propre à l'onglet) : ouverte depuis le tableau de bord, une séance ramène au tableau de bord et l'annonce. On ne se sert pas du « précédent » du navigateur, car les onglets d'une fiche ajoutent des étapes à l'historique. L'**agenda sur 24 h** garde une grille complète mais n'en montre que la plage choisie dans les Paramètres, et défile dans sa carte. Leçon de test : les tests du glisser-déposer calculaient la position d'une heure à partir d'une grille de 6 h à 22 h ; ils ont été adaptés, et c'est exactement le genre de casse qu'on veut voir arriver dans un test plutôt que chez le coach.

### Une page de moins : la vue Liste de l'Agenda (29/10)
La page Séances montrait les mêmes séances que l'Agenda, sous une autre forme : deux endroits pour une seule information, c'est deux endroits à maintenir et un coach qui se demande où regarder. Elle devient une **vue de l'Agenda**, à côté de Semaine et Mois, comme le « Planning » de Google Agenda. Rien ne change en base : la vue lit les mêmes séances avec le même garde-fou. La liste par jour du tableau de bord a été sortie dans un **composant partagé**, pour que les deux écrans restent identiques sans copier le code. Supprimer une page, c'est aussi retirer son entrée de menu, son module et les liens qui y menaient : un test vérifie maintenant que « Voir tout » arrive bien sur la vue Liste.

### Des factures qu'on ne peut plus trafiquer (29/10)
Une facture est un document légal : une fois envoyée, elle ne doit plus changer, et les numéros doivent se suivre sans trou. On l'a donc modélisée en deux états : un **brouillon** qu'on corrige librement, puis une facture **émise**, figée. Le numéro n'est pas calculé dans l'application mais **par la base**, dans une fonction SQL qui verrouille un compteur par structure et par année : si deux clics « Émettre » arrivent en même temps, l'un attend l'autre, et si l'émission échoue, le numéro n'est pas consommé (tout est dans la même transaction). Même un développeur qui contournerait l'écran ne pourrait pas modifier une facture émise : un **trigger** l'interdit en base, et un test pgTAP le prouve hors RLS. La facture garde aussi une **copie** de la structure (raison sociale, TVA, IBAN) au moment de l'émission : changer d'adresse plus tard ne réécrit pas les anciennes factures.

Le PDF est fabriqué avec **React-PDF** (note de décision ADR 0002) : la facture s'écrit en composants React, rendue sur le serveur sans navigateur. Il a été choisi parmi trois options parce qu'il reste léger et marche chez n'importe quel hébergeur ; il servira aussi aux programmes. Côté métier, deux règles de Gianluca se retrouvent dans le code : seuls les virements se facturent, et une facture « déjà payée » crée aussi le **vrai paiement** dans la Comptabilité, pour que le chiffre d'affaires reste juste.

### Une app pour tous les pays : Coory ne joue pas au juriste (29/10)
Première version des factures : des phrases légales belges écrites dans le code (« régime de franchise… »), et une liste de points « à faire valider par un comptable ». Antonino a pointé le problème : si Coory sert un jour en France ou ailleurs, l'app ne peut pas connaître les lois de chaque pays. La décision (D-66) : Coory fournit des **outils neutres** (numéro qui se suit, structure, TVA au choix, mentions libres, PDF) et le coach reste responsable de ce qu'il écrit. Techniquement, c'est surtout du code en moins : les phrases en dur ont disparu, et le PDF imprime les mentions saisies par le coach. Même logique pour les espèces : plutôt que d'imposer la règle d'un seul coach, un **réglage** laisse chacun choisir s'il veut les voir dans « À facturer ».

### Des catégories que le coach choisit lui-même (29/10)
Les Documents avaient cinq catégories fixes, écrites dans le code et dans une contrainte de la base. Pour que chaque coach range à sa façon, la catégorie est devenue une **table** : chaque organisation a ses propres catégories, et un document pointe vers l'une d'elles. Trois détails comptent. Une **clé étrangère composée** (identifiant + organisation) empêche un document de pointer vers la catégorie d'un autre coach, même en contournant l'écran. Supprimer une catégorie ne supprime pas ses documents : la base remet simplement leur catégorie à vide (`ON DELETE SET NULL`). Et un **trigger** donne les cinq catégories de départ à chaque nouvelle organisation, pour qu'un nouveau coach ne commence pas devant une liste vide. La migration a converti les documents existants : rien ne s'est perdu en route.

Sur les factures, le coach saisit maintenant son prix **hors TVA** (c'est ainsi que Gianluca raisonne : 65 € HTVA) et voit la TVA s'ajouter en direct. Avant de changer, on a vérifié par un petit script que passer du HTVA au TVAC puis revenir ne perd jamais un centime (un million de montants testés pour chaque taux) : on peut donc garder un seul montant en base sans risque d'écart.

---


### Une app vendable hors de Belgique (29/10)
Jusqu'ici, l'euro et la TVA belge (21, 12, 6, 0 %) étaient écrits partout. Pour vendre Coory ailleurs, trois idées. **Le taux de TVA devient libre** : plutôt que de tenir une liste de taux pour chaque pays (et de la suivre à chaque changement de loi), le coach écrit le sien une fois dans sa structure, et Coory le propose sur chaque facture. Les calculs se font en **nombres entiers** (8,1 % devient 810 centièmes de point) : en JavaScript, 0,1 + 0,2 ne fait pas exactement 0,3, et un centime perdu sur une facture, ça se voit. **Chaque montant garde sa devise** : un paiement reçu en euros reste en euros, même si le coach déménage en Suisse ; c'est la base (un trigger) qui pose la devise, jamais le navigateur. Et le **pays décide des formats** : le contrôle du numéro belge ne s'applique qu'à une structure belge.

L'inscription demande tout cela tout de suite (pays deviné d'après la langue du navigateur, devise proposée d'après le pays), mais la TVA peut attendre : un coach qui ne facture pas avec Coory utilise quand même l'agenda et les programmes. Détail appris en route : dans une fonction SQL `SECURITY DEFINER`, `current_user` est le propriétaire de la fonction, pas la personne qui l'appelle ; le trigger de devise est donc en `SECURITY INVOKER` pour savoir qui écrit. Autre détail : les noms des pays sont **figés dans un fichier** plutôt que calculés à la volée, pour que le serveur et chaque navigateur affichent exactement le même texte. Les icônes des documents ont aussi pris la **couleur de leur catégorie** (Facture en or, Bilan en bleu), choisie dans une palette fermée de jetons du design system.

### Déménager sans fausser l'historique (29/10)
Un coach qui passe de la Belgique à la Suisse change de devise. Tout convertir aurait été simple, mais faux : un paiement reçu en euros a vraiment été reçu en euros, il figure ainsi sur le relevé bancaire, et une facture émise ne se modifie plus. On a donc séparé le **passé** (gardé dans sa devise) du **futur** (converti au taux que le coach saisit). Tout se fait dans **une seule fonction SQL**, en une transaction : si une étape échoue, rien ne change. Chaque changement est **gardé dans un historique** ; il sert ensuite à afficher un total « ≈ » quand une période mélange deux devises, avec le détail (« 121,00 € + 108,10 CHF »). Le convertisseur sait suivre une chaîne de déménagements (EUR puis CHF puis GBP). On n'a pas branché de service de change en ligne : une dépendance externe de plus pour un cas rare, et le coach connaît le taux de sa banque.

### Un graphique qu'on peut croire, et une couleur de sélection (29/10)
La Comptabilité a gagné un graphique circulaire et un vrai tableau (période par période, mode de paiement par mode). Pour les couleurs du graphique, on n'a pas choisi « à l'œil » : un petit script vérifie qu'aucune paire de parts voisines ne se confond, y compris pour les daltoniens, en sombre comme en clair. Le premier choix (les couleurs des disciplines) a échoué au test : le bleu et le violet étaient presque identiques pour un daltonien. Dans un anneau, seules les parts voisines se touchent : on a donc placé les deux couleurs proches face à face. Et la couleur n'est jamais seule : chaque part a son montant écrit dans la légende, et le tableau donne tous les chiffres. Côté calcul, tout est une fonction pure testée (périodes, sommes par mode, TVA), y compris après un changement de devise.

Autre leçon, sur le jaune de sélection : un or légèrement transparent posé sur un fond presque noir donne du brun, c'est mécanique (on mélange du jaune avec du noir). On a comparé plusieurs teintes côte à côte avant de choisir un jaune citron plus franc. Et quand Antonino a vu un contour blanc au lieu du jaune, la cause était un serveur de développement qui servait l'ancienne feuille de style : une bordure sans couleur connue prend la couleur du texte.

### Les dépenses, le résultat, et une page en widgets (29/10)
La Comptabilité sait maintenant ce que le coach dépense, et donc ce qu'il gagne vraiment. Deux idées. Une dépense qui revient (le loyer) n'est écrite **qu'une fois**, avec « chaque mois » : le calcul la fait compter chaque mois (un 31 compte le 28 février), et « Arrêter » lui donne une date de fin sans effacer le passé. Et le résultat suit le **statut TVA** : pour un coach soumis à la TVA, la TVA n'est pas à lui (il la reverse ou la récupère), donc on compare gagné HTVA et dépensé HTVA. Le changement de devise a dû apprendre à **couper** une dépense mensuelle en cours : la partie passée reste en euros, une copie convertie reprend à la prochaine date.

Côté mise en page, chaque rangée de widgets a la même hauteur. L'astuce vient du tableau de bord : la colonne de droite est posée « par-dessus » sa case (position absolue), si bien que c'est le tableau de gauche qui décide de la hauteur, et la liste de droite défile à l'intérieur. Enfin, l'en-tête de toutes les pages a été unifié ; un piège rencontré : une icône est une fonction, et une fonction ne peut pas être envoyée d'un composant serveur à un composant du navigateur. L'icône imposée est donc dessinée côté serveur.
## 8. Problèmes rencontrés et ce qu'ils ont appris

Ces incidents sont de bons sujets d'entretien : ils montrent qu'on teste vraiment.

- **« Date.now() pendant le prérendu »** : Next 16 essayait de pré-calculer la page coach, alors que la session dépend de l'heure. Solution : `connection()` force le calcul à chaque requête. Bonus : les données personnelles ne sont jamais en cache.
- **L'adresse restait sur `/espace` après connexion** : la page affichée était bonne, mais l'URL non. Trouvé par Playwright, corrigé en redirigeant directement au bon endroit.
- **L'inscription libre était ouverte** : sans page d'inscription, l'API de Supabase acceptait quand même de créer des comptes. Fermé dans la configuration et vérifié.
- **Des tests « chanceux »** : deux fois, un test cliquait puis naviguait sans attendre la fin de l'action (déconnexion, changement de page). Il passait par chance de timing, puis a échoué plus tard. Leçon : toujours attendre un signe visible (nouvelle adresse, nouveau titre) avant l'étape suivante, et relancer la suite plusieurs fois pour vérifier sa stabilité.
- **« styleText n'existe pas »** : Vitest refusait de démarrer. Le terminal utilisait une ancienne version de Node, pas la version 24 du projet. Leçon : quand un outil plante dès le démarrage sur une fonction de Node, vérifier d'abord `node -v`.
- **« Il n'y a pas de couleurs »** : après le graphite, Antonino trouvait encore la fiche terne. Nouvelle série d'aperçus, nouveau choix : un sombre encore plus clair, et des couleurs qui gardent un sens (l'en-tête prend la couleur de la discipline de l'objectif principal, chaque chiffre clé a sa pastille). La mesure a refusé une seule idée : des initiales orange sur un avatar orangé n'étaient pas assez lisibles, elles restent donc en couleur texte. Leçon : un design system est un point de départ ; quand l'utilisateur final le trouve terne, on l'adapte, mais en documentant l'écart et en vérifiant la lisibilité.
- **« Le dark est trop dark »** : plutôt que de discuter de couleurs dans le vide, on a produit quatre aperçus de la même fiche (actuel, graphite, bleu nuit, icônes colorées) en injectant les couleurs seulement dans le navigateur qui prend la capture, sans toucher au code. Antonino a choisi sur image. Retenu : un fond graphite, et des couleurs qui ont un **sens** (une par discipline) plutôt que décoratives. Effet de bord évité : le rouge texte a dû s'éclaircir pour rester lisible sur le graphite, alors le logo a reçu son propre jeton pour garder le rouge exact de la marque.
- **« On ne lit pas très bien en sombre »** : Antonino avait raison, et les chiffres l'ont confirmé. Le texte « discret » n'atteignait que 2,5:1 de contraste, alors que la norme d'accessibilité (WCAG) demande 4,5:1. Plutôt que d'éclaircir au jugé, on a mesuré chaque couple texte / fond avec la formule officielle, avant et après. Grâce aux jetons, la correction a tenu en cinq valeurs dans un seul fichier. On a même évité un effet de bord : le rouge du logo utilise le même jeton que le texte rouge, on l'a donc laissé intact et corrigé le fond de la pastille à la place.
- **Une liste déroulante qui oubliait la saisie** : après une erreur, React remettait les listes déroulantes et les cases à cocher à leur valeur de départ (les champs texte, eux, étaient bien conservés). Trouvé par un test, corrigé dans les deux formulaires concernés. Leçon : tester la conservation de la saisie pour chaque **sorte** de champ, pas seulement pour les champs texte.
- **« Ça marche chez moi, pas dans les tests »** : avec Next 16, la page qu'on vient de quitter reste dans la page, **cachée**, pour un retour instantané. Un test qui cherchait « le » champ Sportif en trouvait deux : le vrai, et la carte Sportif de la page précédente, invisible. Leçon : chercher les éléments par leur **rôle** (liste déroulante, bouton), qui ignore ce qui est caché.
- **Une heure de 0 pixel** : la hauteur d'une heure dépendait d'une variable CSS (`--span`) posée sur un élément enfant. Or une variable se calcule là où on la déclare : sur le parent, elle n'existait pas, et toute la grille s'écrasait. Trouvé en mesurant au navigateur, pas en relisant le code.
- **Une sauvegarde qui écrasait la bonne copie** : le script qui garde la session pendant les remises à zéro ne restaurait rien si le reset échouait (étapes enchaînées par `&&`), puis la sauvegarde suivante enregistrait l'état vide par-dessus. Leçon : une étape de restauration doit tourner quoi qu'il arrive, et une sauvegarde ne doit jamais remplacer une meilleure copie.
- **Une icône qui se faisait passer pour un champ** : l'icône « Fiche à compléter : nom de famille, e-mail ou téléphone » portait ce texte en `aria-label`. Les tests qui cherchaient le champ « Téléphone » par son libellé la trouvaient aussi (24 tests en échec d'un coup). L'icône annonce maintenant juste « Fiche à compléter », le détail est dans l'infobulle, et les tests cherchent les champs par leur rôle.
- **Deux tests qui se marchaient dessus** : en parallèle, deux tests créaient une séance au même créneau ; la séance de l'un recouvrait le créneau de l'autre. Leçon : chaque test garde sa semaine et son heure, comme s'il était seul.
- **Un droit trop large refusé à juste titre** : « créer ou mettre à jour » (upsert) une date déplacée échouait, car il réécrit aussi des colonnes que le navigateur n'a pas le droit de modifier. La base avait raison : on lit d'abord, puis on met à jour ou on crée.
- **« SECTIONS.find is not a function »** : une liste exportée d'un fichier `"use client"` et lue par une page serveur n'est pas la liste, mais une référence vers le code du navigateur. Leçon : un fichier client n'exporte que des composants ; les données partagées vont dans un module neutre.
- **Une correction qui a tout cassé** : en fermant l'inscription, un deuxième réglage a coupé toute connexion. Les tests l'ont attrapé immédiatement. Leçon : c'est exactement pour ça qu'on a des tests automatiques.

---

## 9. Questions probables d'un recruteur

- **« Comment garantis-tu qu'un coach ne voit pas les clients d'un autre ? »** Trois couches (proxy, garde-fous serveur, RLS), et 133 tests SQL, 74 tests unitaires et 55 tests navigateur qui le prouvent avec deux organisations.
- **« Pourquoi pas un backend séparé ? »** Next.js exécute déjà du code serveur. Un second backend doublerait le travail et les risques, sans bénéfice à cette échelle.
- **« Comment tu testes ? »** Trois niveaux : pgTAP pour la base, vérifications HTTP, Playwright pour les parcours sur ordinateur et téléphone.
- **« Comment gères-tu des données de santé ? »** Le moins possible : un champ court, sans diagnostic, qui n'existe que pendant un accord explicite du sportif. La base le garantit (contrainte + fonctions qui vérifient l'appelant), chaque accord est journalisé, et le retrait efface les données. Le sportif voit ce qui est noté sur lui.
- **« Comment gères-tu le thème sombre et clair ? »** Toutes les couleurs sont des variables CSS. Un attribut sur `<html>` change leur valeur, donc aucun composant n'a besoin de savoir quel thème est actif. Un script lancé avant l'affichage évite le flash.
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
- **IDOR** : attaque qui consiste à changer un identifiant dans l'adresse pour accéder aux données de quelqu'un d'autre.
- **Segment dynamique** : partie variable d'une adresse, comme `[orgId]`.
- **Domaine (code de)** : les règles métier pures (calculs, validations), indépendantes de la base et de l'interface.
- **Hash (empreinte)** : transformation à sens unique d'un texte. On peut vérifier qu'un lien correspond à l'empreinte, mais pas retrouver le lien à partir d'elle.
- **VMA** : vitesse maximale aérobie, la vitesse de course à partir de laquelle on calcule les allures d'entraînement.
- **Atomique** : une opération qui réussit entièrement ou ne change rien du tout.
- **ADR** : courte note qui documente une décision technique, ses alternatives et ses conséquences.
- **Colonne calculée** : colonne dont la base calcule elle-même la valeur à partir d'autres colonnes (ici le nom complet) ; on ne peut pas l'écrire.
- **Données de santé (RGPD art. 9)** : catégorie de données sensibles ; on ne peut les traiter qu'avec un accord explicite (ou une autre base légale précise).
- **Fonction SECURITY DEFINER** : fonction de la base qui s'exécute avec des droits élevés ; elle doit donc vérifier elle-même qui l'appelle avant d'agir.
- **Piste d'audit (journal)** : liste d'événements datés qu'on ne peut que compléter, jamais modifier, pour prouver ce qui s'est passé.
- **Contraste (ratio WCAG)** : rapport de luminosité entre un texte et son fond, de 1:1 (invisible) à 21:1 (noir sur blanc) ; 4,5:1 minimum pour un texte normal.
- **Index unique partiel** : règle de la base qui interdit les doublons seulement pour certaines lignes (ici : un seul objectif principal parmi ceux en cours).
- **Liste fermée** : ensemble de valeurs autorisées (ex. Débutant, Intermédiaire, Confirmé, Compétiteur), vérifié par le serveur et par la base.
- **Token (design)** : une valeur de design nommée (couleur, rayon, taille) définie une fois et réutilisée partout.
- **Thème / data-theme** : attribut posé sur `<html>` qui fait basculer toutes les variables de couleur d'un coup.
- **Flash (FOUC)** : bref affichage dans le mauvais style avant que le bon s'applique ; évité ici par un script dans `<head>`.
- **SVG** : dessin vectoriel écrit en code (des tracés plutôt que des pixels), net à toutes les tailles ; c'est le format du logo.
- **Contraste** : rapport de luminosité entre un texte et son fond ; la norme d'accessibilité demande 4,5 pour 1 pour un texte normal.
- **TVAC / HTVA** : toutes taxes (TVA) comprises / hors TVA. Le chiffre d'affaires d'un assujetti à la TVA se compte HTVA.
- **Comptabilité de caisse** : on compte un revenu le jour où l'argent est reçu, pas le jour où le service est rendu.
- **Mise à jour optimiste** : l'écran montre tout de suite le résultat d'un clic, avant la réponse du serveur, et revient en arrière si elle échoue.
- **Exception (de récurrence)** : une date d'une série hebdomadaire qui a lieu ailleurs (autre jour ou autre heure), notée à part sans toucher à la série.
- **Déclencheur (trigger)** : petit programme de la base lancé automatiquement à chaque écriture, pour vérifier ou compléter une ligne.
- **Devise ISO 4217** : code à trois lettres d'une monnaie (EUR, CHF, USD) ; Coory ne garde que celles qui ont des centimes.
- **SECURITY INVOKER** : fonction de la base qui s'exécute avec les droits de celui qui l'appelle (le contraire de SECURITY DEFINER).
- **Clé secrète (service role)** : clé Supabase qui contourne la RLS ; réservée au serveur, à quelques procédures précises.
