# Compte de démonstration partagé (OPEN-24), plan de construction

> Exécution native dans la session (superpowers:executing-plans), sans commit (Antonino commite).

**Goal :** un compte coach de démonstration (`demo@synode-agency.com`) que les visiteurs de Synode
utilisent sans s'inscrire, avec l'Assistant IA, sans pouvoir le confisquer, et dont les données
fictives sont remises à zéro chaque nuit.

**Spec :** `docs/DEMO_SYNODE.md` (demande et décisions d'Antonino du 14/11/2026).

## Global Constraints

- Aucune donnée réelle dans le jeu de démo ; noms inventés ; dates relatives au jour de la remise à zéro.
- Mot de passe et adresse jamais dans Git : l'utilisateur est créé par Antonino dans Supabase.
- La remise à zéro ne touche jamais `assistant_usage` (sinon le plafond de 100 demandes repartirait
  chaque nuit) ni une autre organisation.
- Protection réelle dans la base (déclencheur sur `auth.users`), refus dans l'app en plus.
- Pas d'envoi de fichiers sur le compte de démo (stockage non nettoyable en SQL, et données réelles).

## Review Focus

1. Un visiteur change le mot de passe ou l'e-mail par l'API d'authentification : refusé dans la base.
2. Une facture émise (appel direct à la base) ne bloque pas la remise à zéro.
3. La remise à zéro d'une démo ne touche aucune autre organisation.
4. Le programme de démo est valide pour l'éditeur (`programDraftSchema`).
5. Antonino peut quand même changer le mot de passe de la démo (fonction d'administration).

---

### Task 1 : base (migration `20261114150000_compte_demo.sql`, test SQL 45)

`private.demo_accounts` ; déclencheur `protect_demo_account` (mot de passe, e-mail, téléphone figés,
sauf `private.set_demo_password`) ; `public.is_demo_account()` ; `private.seed_demo_data(org, user)` ;
`private.reset_demo_data()` (catégories par défaut recréées, factures émises supprimables pendant la
remise à zéro seulement) ; `private.setup_demo_account(email)` ; tâche pg_cron `coory-demo-reset`
chaque nuit à 2 h UTC (3 h ou 4 h à Bruxelles).

- [ ] Test SQL 45 → échec → migration → vert.

### Task 2 : app

`isDemoAccount()` ; bandeau dans l'espace coach ; refus serveur « Désactivé sur le compte de
démonstration » pour mot de passe, e-mail, photos (coach, sportif, exercice) et documents ; compte de
démo local dans la graine (`coach-demo@example.test`).

- [ ] Tests unitaires (programme de démo valide) et parcours (bandeau, refus) → échec → code → vert.

### Task 3 : documentation et mise en service

Guide de déploiement (créer l'utilisateur, `select private.setup_demo_account(...)`, adresse ajoutée à
la liste de l'assistant), 00_INDEX, SUIVI, CARNET, mémoire ; relecture indépendante.
