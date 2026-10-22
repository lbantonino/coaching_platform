# Carnet technique : comment ce projet est construit, et pourquoi

> Document personnel d'Antonino, pour comprendre le projet et pouvoir l'expliquer (entretien, recruteur, client).
> Le code est écrit avec l'aide de Claude Code ; ce carnet explique **les décisions**, pas chaque ligne.
> Il est mis à jour à la fin de chaque story. Dernière mise à jour : **22/10/2026** (P2-04 étape 2 : notes du coach et historique).
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

---

## 8. Problèmes rencontrés et ce qu'ils ont appris

Ces incidents sont de bons sujets d'entretien : ils montrent qu'on teste vraiment.

- **« Date.now() pendant le prérendu »** : Next 16 essayait de pré-calculer la page coach, alors que la session dépend de l'heure. Solution : `connection()` force le calcul à chaque requête. Bonus : les données personnelles ne sont jamais en cache.
- **L'adresse restait sur `/espace` après connexion** : la page affichée était bonne, mais l'URL non. Trouvé par Playwright, corrigé en redirigeant directement au bon endroit.
- **L'inscription libre était ouverte** : sans page d'inscription, l'API de Supabase acceptait quand même de créer des comptes. Fermé dans la configuration et vérifié.
- **Des tests « chanceux »** : deux fois, un test cliquait puis naviguait sans attendre la fin de l'action (déconnexion, changement de page). Il passait par chance de timing, puis a échoué plus tard. Leçon : toujours attendre un signe visible (nouvelle adresse, nouveau titre) avant l'étape suivante, et relancer la suite plusieurs fois pour vérifier sa stabilité.
- **« styleText n'existe pas »** : Vitest refusait de démarrer. Le terminal utilisait une ancienne version de Node, pas la version 24 du projet. Leçon : quand un outil plante dès le démarrage sur une fonction de Node, vérifier d'abord `node -v`.
- **Une liste déroulante qui oubliait la saisie** : après une erreur, React remettait les listes déroulantes et les cases à cocher à leur valeur de départ (les champs texte, eux, étaient bien conservés). Trouvé par un test, corrigé dans les deux formulaires concernés. Leçon : tester la conservation de la saisie pour chaque **sorte** de champ, pas seulement pour les champs texte.
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
- **Index unique partiel** : règle de la base qui interdit les doublons seulement pour certaines lignes (ici : un seul objectif principal parmi ceux en cours).
- **Liste fermée** : ensemble de valeurs autorisées (ex. Débutant, Intermédiaire, Confirmé, Compétiteur), vérifié par le serveur et par la base.
- **Token (design)** : une valeur de design nommée (couleur, rayon, taille) définie une fois et réutilisée partout.
- **Thème / data-theme** : attribut posé sur `<html>` qui fait basculer toutes les variables de couleur d'un coup.
- **Flash (FOUC)** : bref affichage dans le mauvais style avant que le bon s'applique ; évité ici par un script dans `<head>`.
- **SVG** : dessin vectoriel écrit en code (des tracés plutôt que des pixels), net à toutes les tailles ; c'est le format du logo.
- **Contraste** : rapport de luminosité entre un texte et son fond ; la norme d'accessibilité demande 4,5 pour 1 pour un texte normal.
- **Clé secrète (service role)** : clé Supabase qui contourne la RLS ; réservée au serveur, à quelques procédures précises.
