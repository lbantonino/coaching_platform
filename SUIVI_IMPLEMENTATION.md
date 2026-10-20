# Journal d'implémentation — source de vérité sur l'état réel du code

**État initial du package V1.1 le 18/10/2026** : spécifications techniques et de produit actualisées ; **aucun code métier, base de données, test ou intégration de l'application n'est créé ni vérifié par ce dossier**. L’utilisateur peut déjà avoir lancé Claude Code sur son Mac : inspecter d’abord son dépôt local pour établir l’état réel. Ne jamais marquer une tâche terminée au motif qu'elle est documentée.

## Statut des phases
| Phase | État | Tests exécutés | Preuve |
|---|---|---|---|
| P0 Bootstrap | En cours : P0-01, P0-02, P0-03 faits ; P0-04 à P0-06 à faire | lint, typecheck, format:check, build, dev, db:reset x2, test trigger SQL | Commits P0-01 à P0-03, session du 19/10/2026 ci-dessous |
| P1 Auth/organisations | **Fait** : P1-01 à P1-05 (connexion, mot de passe oublié, organisations, RLS, garde-fous coach/sportif/admin, invitation sportif) ; vérification d'e-mail sans objet tant qu'il n'y a pas d'inscription | db:test 54/54, test:e2e 27/27 (x3 stables), check, build | Sessions du 19 et 20/10/2026 |
| P2 CRM | En cours : P2-01 partiel (fiche sportif minimale, liste, ajout) ; modification, recherche, filtres à faire | db:test 34/34, test:e2e 21/21 (x3 stables) | Session du 20/10/2026 |
| P3 Bibliothèque | À faire | Aucun | - |
| P4 Éditeur multi-sports | À faire | Aucun | - |
| P5 Publications/PDF | À faire | Aucun | - |
| P6 Sportif/feedback | À faire | Aucun | - |
| P7 Communication | À faire | Aucun | - |
| P8 SaaS commercial | À faire | Aucun | - |

## Dernière session
- Date : 2026-10-20
- Objectif : finir P1, dans l'ordre choisi par Antonino : P1-04 guards -> Playwright -> mot de passe oublié -> P1-05 invitation.

### Story P1-05 : invitation sportif par lien à copier
```
Date : 2026-10-20
Story : P1-05 (+ requireAthlete de P1-04, + page /app minimale)
Décisions d'Antonino : lien à copier (pas d'envoi auto avant P7), validité 7 jours, case obligatoire « J'ai 18 ans
  ou plus » (OPEN-11 : mineurs bloqués), page /app honnête
Objectif et fichiers specs lus : docs/02 §1, §5, §7 ; docs/11 §2 (jamais de jeton en clair) ; docs/12 §2
Fichiers créés/modifiés :
  supabase/migrations/20261020081355_invitations_sportifs.sql : athlete_invites (hash SHA-256, FK composite
    fiche+organisation, une seule invitation en attente par fiche, 7 jours max, révocation seule côté client),
    private.is_linked_athlete, policies sportif (sa fiche, son organisation), get_invitation (lecture par
    empreinte), accept_invitation (atomique : validité, expiration, âge, e-mail identique, fiche non déjà liée)
  supabase/tests/database/04_invitations.test.sql (20 tests)
  src/lib/supabase/admin.ts (clé secrète, server-only, une seule procédure), src/lib/format.ts
  src/features/invitations/{token,queries,actions}.ts ; src/features/auth/{guards,session}.ts (requireAthlete,
    getAthleteLinks, aiguillage /app) ; src/proxy.ts (/app protégé)
  src/app/(coach)/coach/o/[orgId]/sportifs/[athleteId]/inviter/{page,invite-form}.tsx,
  src/app/invitation/[token]/{page,accept-form}.tsx, src/app/(athlete)/app/page.tsx, liste des sportifs (Inviter)
  tests/e2e/invitation.spec.ts (3 scénarios x 2 profils)
Commandes exécutées et résultats :
  npm run db:test -> 54/54 PASS ; npm run check -> exit 0 ; npm run build -> OK
  npm run test:e2e -> 27 passés + 1 ignoré volontairement, 3 exécutions stables
  Clé secrète recherchée dans .next/static : 0 occurrence
Scénarios E2E : coach crée la fiche, génère le lien, « Copier » vérifié dans le presse-papiers ; sportif dans un autre
  navigateur : case 18 ans obligatoire, création d'accès, arrivée /app, refus /coach, lien à usage unique,
  reconnexion -> /app ; coach voit « compte activé » ; lien révoqué inutilisable ; lien inventé refusé
Points de sécurité vérifiés : jeton jamais stocké en clair, lien non réaffichable, invitation limitée à la même
  organisation, acceptation atomique, sportif isolé (sa fiche et son organisation seulement), AUTH-01
Bugs/limites :
  - Fiche sans e-mail : invitation impossible tant que la modification de fiche n'existe pas (P2-01 suite)
  - Sportif ayant déjà un compte : doit se connecter puis rouvrir le lien (pas de redirection automatique après login)
  - Pas de limitation du nombre d'essais sur la page d'invitation (jeton de 256 bits, risque faible) : à revoir avant prod
  - Défaut de test corrigé : fiche B ciblée avait déjà une invitation (le mauvais refus était testé)
Décisions OPEN/ADR : clé secrète utilisée pour une procédure de confiance unique (création du compte invité)
Prochaine story : P2-01 suite (modifier une fiche, recherche, filtres, archivage) ou P0-05 (shell UI / design)
```

### Story P2-01a : fiche sportif minimale, liste et ajout (préalable à l'invitation P1-05)
```
Date : 2026-10-20
Story : P2-01 (partie a), décidée avec Antonino avant P1-05 : on invite toujours un sportif qui a déjà une fiche
Objectif et fichiers specs lus : docs/03 §1 et §6, docs/11 §2, docs/02 §1
Fichiers créés/modifiés :
  supabase/migrations/20261020080822_fiches_sportifs.sql (athlete_profiles, e-mail unique par organisation
    insensible à la casse, RLS membres, update limité par colonnes, pas de delete)
  supabase/tests/database/03_isolation_sportifs.test.sql (13 tests)
  src/features/athletes/{schemas,queries,actions}.ts
  src/app/(coach)/coach/o/[orgId]/sportifs/page.tsx, .../nouveau/{page,new-athlete-form}.tsx, coach/page.tsx (liens)
  tests/e2e/athletes.spec.ts ; tests/e2e/password-reset.spec.ts (attente de fin de déconnexion)
  src/lib/supabase/database.types.ts (régénéré)
Commandes exécutées et résultats :
  npm run db:test -> 34/34 PASS ; npm run check -> exit 0 ; npm run test:e2e -> 21 passés + 1 ignoré, 3 exécutions stables
Points de sécurité/tenant vérifiés : SEC-01 sur les sportifs (lecture, création, modification, ciblage par ID),
  IDOR par URL /coach/o/[ID de B]/sportifs -> /acces-refuse, created_by et athlete_user_id non falsifiables,
  organization_id non modifiable, pas de suppression
Bugs/limites :
  - Champs minimaux (nom, e-mail, téléphone, statut) : fiche complète en attente d'OPEN-01
  - Pas encore de modification, recherche, filtres ni archivage depuis l'interface
  - Le test E2E ajoute un sportif à chaque exécution dans la base locale (nettoyé par npm run db:reset)
  - Défaut de test corrigé : course entre déconnexion et navigation (test « mot de passe oublié »)
Décisions OPEN/ADR : choix Antonino du 20/10 pour P1-05 : lien à copier, 7 jours, case « 18 ans ou plus », page /app honnête
Prochaine story : P1-05 invitation sportif
```

### Story P1-01b : mot de passe oublié et durcissement de la config Auth locale
```
Date : 2026-10-20
Story : P1-01 (partie b) : réinitialisation du mot de passe par e-mail
Fichiers créés/modifiés :
  supabase/config.toml : [auth] enable_signup=false (FAILLE CORRIGÉE : l'inscription libre était ouverte via l'API
    malgré l'absence de page) ; minimum_password_length 6 -> 10 ; site_url/additional_redirect_urls localhost:3000 et
    :3100 ; rate limit e-mail local 2 -> 30/h
  src/features/auth/password-actions.ts (requestPasswordReset : réponse identique compte existant ou non ;
    updatePassword : session de récupération requise, Zod, redirection selon rôle)
  src/features/auth/schemas.ts (newPasswordSchema, PASSWORD_MIN_LENGTH)
  src/app/auth/confirm/route.ts (échange du code PKCE, liste fermée de destinations : pas d'open redirect)
  src/app/(auth)/mot-de-passe-oublie/*, src/app/(auth)/nouveau-mot-de-passe/*, src/app/lien-invalide/page.tsx
  src/components/ui/form-styles.ts, src/app/(auth)/login/login-form.tsx (lien « Mot de passe oublié ? »)
  supabase/seed.sql (coach-reset@example.test, dédié au test E2E) ; tests/e2e/password-reset.spec.ts
Commandes exécutées et résultats :
  curl /auth/v1/signup -> signup_disabled ; curl /token coach A -> 200
  npm run test:e2e -> 17 passés + 1 ignoré volontairement (parcours e-mail sur le seul profil ordinateur), 2 exécutions
  consécutives stables ; check exit 0 ; db:test PASS
Incidents rencontrés (transparence) :
  - Ma 1re correction mettait aussi [auth.email] enable_signup=false, ce qui COUPE toute connexion par e-mail :
    détecté par les tests Playwright, corrigé (seul [auth] enable_signup doit être à false)
  - 2 défauts de test (course de navigation, fragment #error ajouté par Supabase), pas de défaut applicatif
Points de sécurité vérifiés : pas d'énumération des comptes, lien à usage unique, lien falsifié refusé,
  destination de redirection en liste fermée, mot de passe >= 10 caractères côté Zod ET côté Supabase
Bugs/limites : la vérification d'e-mail à l'inscription est sans objet (pas d'inscription avant P8) ;
  l'e-mail utilise le gabarit Supabase par défaut (en anglais) : à traduire avant la mise en ligne
Prochaine story : P1-05 invitation sportif (décisions à prendre avec Antonino)
```

### Story Playwright : premiers tests de parcours (P0-04 / P6-06 anticipé sur le parcours connexion)
```
Date : 2026-10-20
Story : installer Playwright au premier parcours réel (connexion), conformément à P0-04
Dépendance ajoutée (justification) : @playwright/test 1.64.1 + Chromium headless uniquement (~99 Mo, cache utilisateur
  hors dépôt) ; profils « ordinateur » (Desktop Chrome) et « telephone » (Pixel 7)
Fichiers créés/modifiés : playwright.config.ts, tests/e2e/auth.spec.ts, package.json (test:e2e), .gitignore,
  .prettierignore, eslint.config.mjs (rapports ignorés), README.md
  Correctif applicatif : src/features/auth/{actions,guards,session}.ts, src/app/espace/route.ts
Commandes exécutées et résultats :
  1er passage : 8 échecs / 10. Analyse : (a) sélecteur de test trop large (Next ajoute un role=alert d'annonce de
  route) ; (b) VRAI DÉFAUT : après connexion, l'adresse restait /espace alors que la bonne page s'affichait
  (double redirection non reflétée par le routeur client).
  Correctif : l'action login calcule la destination avec la session qu'elle vient d'ouvrir et redirige directement.
  2e passage : npm run test:e2e -> 10/10 PASS (5 scénarios x 2 profils, 9,5 s) ; check exit 0 ; db:test PASS
Scénarios : visiteur -> /login ; coach A connexion, voit Démo A et pas Démo B, déconnexion, /coach refermé ;
  mauvais mot de passe -> erreur générique ; coach A refusé sur /admin ; admin -> /admin et refusé sur /coach
Bugs/limites : Supabase doit tourner avant les tests (pas de démarrage automatique) ; pas encore de CI
Prochaine story : mot de passe oublié (P1-01b)
```

### Story P1-04 : garde-fous serveur de rôle
```
Date : 2026-10-20
Story : P1-04 (requireCoach, requireOrgAccess, requirePlatformAdmin ; requireAthlete reporté)
Objectif et fichiers specs lus : docs/02 §2, §6, §8 (AUTH-01, ADM-01), docs/12 §2
Fichiers créés/modifiés :
  supabase/migrations/20261020072933_admin_plateforme_verification.sql (public.current_user_is_platform_admin,
    security definer, ne répond que pour l'appelant, interdit à anon)
  supabase/tests/database/02_admin_plateforme.test.sql (5 tests), supabase/seed.sql (admin@example.test)
  src/features/auth/guards.ts (requireCoach, requireOrgAccess avec validation UUID, requirePlatformAdmin, getHomePath)
  src/app/(admin)/admin/page.tsx, src/app/acces-refuse/page.tsx, src/app/espace/route.ts (aiguillage après connexion)
  src/components/ui/logout-button.tsx, src/app/(coach)/coach/page.tsx, src/features/auth/actions.ts, src/proxy.ts
Commandes exécutées et résultats :
  npm run db:reset ; npm run db:test -> 21/21 PASS ; npm run check -> exit 0 ; npm run build -> OK
  next start + curl : coach A /coach OK, /admin refusé (aucun contenu admin dans la réponse) ; admin /admin OK,
  /coach refusé (aucune donnée coach) ; /espace -> /coach (coach), /admin (admin), /login (anonyme) ; 0 erreur serveur
Points de sécurité/tenant vérifiés : refus identique pour « interdit » et « inexistant » (pas de fuite d'existence),
  rôle admin lu côté serveur via fonction SQL, jamais via user_metadata ; admin sans accès aux organisations
Bugs/limites :
  - requireOrgAccess n'est encore utilisé par aucune page : il sera testé dès la première action métier (P2)
  - requireAthlete reporté : la table des sportifs n'existe pas encore (P1-05/P2)
  - Le refus intervenant dans un Suspense, la redirection est faite côté navigateur (pas de code 307/403 HTTP)
Décisions OPEN/ADR : forbidden() de Next 16 écarté car expérimental (authInterrupts) ; page /acces-refuse à la place
Prochaine story : Playwright (parcours connexion coach + refus croisés)
```

## Session du 19/10/2026 (après-midi)
- Date : 2026-10-19 (après-midi)
- Objectif : P1-02 / P1-03, organisations, membres et isolation RLS entre deux tenants.
- Décisions validées par Antonino : **pas de page d'inscription publique avant P8** (P8-01) ; les comptes coachs sont créés par l'administrateur ; on commence par le socle de sécurité avant la page de connexion.

### Story P1-01a : connexion, session, déconnexion, espace coach protégé
```
Date : 2026-10-19
Story : P1-01 (partie a) : connexion e-mail/mot de passe, session, déconnexion, page /coach protégée
Objectif et fichiers specs lus : docs/02 §1-2 et §8 (AUTH-01, SEC-01), docs/12 §2 et §10 (SSR/auth), doc Next 16
  embarquée (proxy, authentication-with-cache-components), guide Supabase SSR Next.js
Dépendances ajoutées (justification) : @supabase/supabase-js + @supabase/ssr (session par cookies), zod (validation
  serveur du formulaire), server-only (empêche l'import de code serveur côté navigateur)
Fichiers créés/modifiés :
  src/proxy.ts (rafraîchit la session via getClaims, redirection optimiste /coach <-> /login, en-têtes anti-cache)
  src/lib/env.ts (validation Zod des variables publiques), src/lib/supabase/server.ts (client typé, connection())
  src/lib/supabase/database.types.ts (généré par npm run db:types)
  src/features/auth/{schemas,session,actions}.ts (Zod, getCurrentUser/requireUser/getCoachMemberships, login/logout)
  src/app/(auth)/login/{page,login-form}.tsx, src/app/(coach)/coach/page.tsx, src/app/page.tsx (lien connexion)
  package.json (script db:types), README.md ; .env.local local créé (ignoré par Git)
Migrations / endpoints / vues ajoutées : aucune migration ; Server Actions login/logout ; pas de Route Handler
Commandes exécutées et résultats :
  npm run check -> exit 0 ; npm run build -> OK (/coach en Partial Prerender, /login statique, Proxy actif)
  next start + curl : /coach sans session -> 307 /login ; /login -> 200 ; coach A voit Démo A et pas Démo B ;
  coach B voit Démo B et pas Démo A ; coach connecté sur /login -> 307 /coach ; cookie falsifié -> 307 /login ;
  /coach connecté servi en Cache-Control private, no-store ; 0 erreur serveur
Tests automatiques et manuels : pas de test automatisé de l'interface (Playwright pas encore installé) ;
  test manuel navigateur par Antonino le 19/10/2026 : connexion coach-a, affichage Démo A, déconnexion,
  mauvais mot de passe -> message d'erreur : OK
Points de sécurité/tenant vérifiés : vérification serveur indépendante du proxy (requireUser), getClaims et non
  getSession, message d'erreur générique, isolation A/B visible dans l'interface, pas de cache des pages authentifiées
Bugs/limites :
  - Erreur Next « Date.now() pendant le prérendu » trouvée puis corrigée par connection() dans le client serveur
  - Reste de P1-01 : mot de passe oublié/reset et vérification e-mail (Mailpit local)
  - Pas de contrôle de rôle coach vs sportif : guards requireCoach/requireAthlete = P1-04
Décisions OPEN/ADR : aucune
Prochaine story : P1-01b (reset mot de passe) ou P1-04 (guards de rôle) ; installer Playwright pour le parcours connexion
```

### Story P1-02 / P1-03 : organisations, membres, admins plateforme et RLS
```
Date : 2026-10-19
Story : P1-02 (organisation + memberships, admin plateforme indépendant) et P1-03 (RLS + tests 2 organisations)
Objectif et fichiers specs lus : docs/02 §1-2 et §6, docs/11 §2, docs/12 §2-3
Fichiers créés/modifiés :
  supabase/migrations/20261019151645_organisations_et_membres.sql
  supabase/seed.sql (2 organisations démo + 2 comptes coachs fictifs @example.test)
  supabase/tests/database/01_isolation_organisations.test.sql (pgTAP)
  package.json (script db:test), README.md
Migrations / endpoints / vues ajoutées :
  tables organizations, organization_members (owner|coach, active|disabled, un seul owner par org), platform_admins
  schéma private + fonction private.is_org_member (security definer, search_path verrouillé)
  RLS : lecture de sa propre organisation et de ses membres uniquement ; aucune écriture client ;
        platform_admins sans policy ; anon sans aucun privilège
Commandes exécutées et résultats :
  npm run db:reset -> 2 migrations + seed appliqués
  npm run db:test -> 16/16 tests PASS
  Contre-épreuve : policy remplacée par using(true) -> tests FAIL (la fuite est détectée) ; reset -> PASS
  Connexion API Auth avec coach-a@example.test / mot de passe démo -> jeton obtenu
Tests automatiques et manuels : 16 tests pgTAP (isolation A/B dans les deux sens, ciblage par ID, membres,
  membre désactivé, admin plateforme sans accès implicite, anon refusé, écritures refusées, owner unique)
Points de sécurité/tenant vérifiés : SEC-01 et DB-01 pour organisations/membres ; ADM-01 (admin sans accès implicite)
Bugs/limites :
  - Pas encore d'interface : connexion (P1-01) et garde-fous serveur requireCoach/... (P1-04) à venir
  - Pas encore de script de création d'un vrai compte coach (prévu avec P1-01/P1-04)
  - owner_user_id de docs/11 remplacé par le membre de rôle 'owner' (un seul par organisation, contrainte en base)
Décisions OPEN/ADR : inscription publique repoussée à P8 (conforme à P8-01)
Prochaine story : P1-01 (connexion, session, déconnexion, page /coach protégée) puis P1-04
```

## Session du matin (P0)
- Date : 2026-10-19
- Objectif : cadrage technique et amorçage P0 (`P0-01` à `P0-03` uniquement).
- Décisions validées par Antonino : Node 24 LTS ; Supabase DEV en local (CLI + Docker) ; un commit par story, **sans** co-auteur.
- Réalisé : socle Next.js, environnements, outillage migrations/seed/reset (détail ci-dessous). **Aucune table métier, aucune auth, aucune RLS** : c'est P1.
- Prochaine tâche recommandée : décider du contenu de P0-04/P0-05 ou passer à P1 (voir « Points à valider »).

### Story P0-01 : socle Next.js TypeScript strict, lint, format, conventions
```
Date : 2026-10-19
Story : P0-01
Objectif et fichiers specs lus : CLAUDE.md, 00_INDEX.md, docs/01, 11, 12, 14
Fichiers créés/modifiés : package.json, package-lock.json, tsconfig.json, eslint.config.mjs, next.config.ts,
  .gitignore, .nvmrc, .prettierrc.json, .prettierignore, src/app/{layout.tsx,page.tsx,globals.css,favicon.ico},
  README.md, AGENTS.md (écrit automatiquement par `next dev`, pointe vers la doc Next embarquée)
Migrations / endpoints / vues ajoutées : page d'accueil neutre « / » (aucune fonctionnalité simulée)
Commandes exécutées et résultats :
  create-next-app 16.4.2 généré dans un dossier temporaire puis fichiers techniques copiés (aucun fichier existant écrasé)
  npm run lint -> exit 0 ; npm run typecheck -> OK ; npm run format:check -> OK ; npm run build -> OK (/ statique)
  next dev -> page servie en 200, lang="fr", contenu attendu
Tests automatiques et manuels : pas encore de test unitaire (aucune règle métier) ; contrôles qualité ci-dessus
Points de sécurité/tenant vérifiés : sans objet à ce stade
Bugs/limites :
  - Next 16.4 active par défaut `cacheComponents` : conservé, à surveiller en P1 (lecture des cookies d'auth)
  - npm audit : 5 alertes « high » sur `braces`, uniquement via la chaîne ESLint (outil de dev, pas en production) ;
    le seul correctif proposé rétrograde eslint-config-next en v14, non appliqué
  - Typographie (Geist/Arial par défaut) non traitée : relève de P0-05
Décisions OPEN/ADR : aucune
Prochaine story : P0-02
```

### Story P0-02 : `.env.example` et séparation des environnements
```
Date : 2026-10-19
Story : P0-02
Fichiers créés/modifiés : .env.example, .gitignore (exception !.env.example), README.md
Commandes exécutées et résultats :
  git check-ignore .env.local .env .env.production -> ignorés ; .env.example -> versionnable
  .env.example ne contient aucune valeur ; npm run check -> exit 0
Points de sécurité vérifiés : clé secrète Supabase documentée « serveur uniquement », jamais NEXT_PUBLIC_
Bugs/limites : projets cloud STAGING/PROD non créés (volontaire, pas nécessaire avant le déploiement)
Prochaine story : P0-03
```

### Story P0-03 : migrations versionnées, seed démo, reset DEV
```
Date : 2026-10-19
Story : P0-03
Fichiers créés/modifiés : supabase/config.toml (project_id = coaching-platform), supabase/.gitignore,
  supabase/migrations/20261019101418_socle_utilitaires.sql (fonction trigger public.set_updated_at),
  supabase/seed.sql (en-tête DÉMO, vide en P0), package.json (supabase CLI 2.121.0 en devDependency,
  scripts db:start/stop/status/reset/new), README.md
Commandes exécutées et résultats :
  npm run db:start -> Supabase local démarré (Postgres 17), migration et seed appliqués
  npm run db:reset (2 fois de suite) -> exit 0 à chaque fois, 1 migration appliquée
  Test SQL dans une transaction annulée : trigger set_updated_at met bien à jour updated_at
Points de sécurité/tenant vérifiés : fonction avec search_path = '' ; aucune donnée personnelle dans le seed
Bugs/limites :
  - Les 2 organisations de test sont reportées en P1 avec leurs tables et leur RLS (choix expliqué à Antonino)
  - Les clés locales Supabase sont les clés de développement par défaut, non commitées
Prochaine story : P0-04 (Vitest) / P0-05 (shell UI) ou P1-01
```

### Points à valider
- **Configuration Auth de production** (à reprendre à la création des projets STAGING/PROD) : inscription désactivée
  (`enable_signup=false` dans [auth], PAS dans [auth.email]), mot de passe >= 10, URLs de redirection limitées au
  domaine réel, gabarits d'e-mails en français, SMTP réel.
- `~/.npmrc` d'Antonino contient `prefix=~/.npm-global`, incompatible avec `nvm use`. Les commandes de cette session
  ont utilisé directement le binaire Node 24 de nvm. À régler par Antonino (voir compte rendu de session).

## Session précédente
- Date : 2026-10-18
- Objectif : livrer spécifications complètes prêtes à être utilisées avec Claude Code.
- Réalisé (pack) : cahier des charges V1.1, stack simplifiée, trajet SaaS, plans ; **aucun code applicatif généré dans cette archive**.
- Questions ouvertes : voir `docs/14_TESTS_ET_ROADMAP.md` (`OPEN-*`).
- Prochaine tâche recommandée : `P0-01` dépôt TypeScript, architecture dossiers et commandes de qualité.

## Format de compte rendu après chaque story
```
Date :
Story :
Objectif et fichiers specs lus :
Fichiers créés/modifiés :
Migrations / endpoints / vues ajoutées :
Commandes exécutées et résultats :
Tests automatiques et manuels :
Points de sécurité/tenant vérifiés :
Bugs/limites :
Décisions OPEN/ADR :
Prochaine story :
```
