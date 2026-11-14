# Mettre Coory en ligne (MVP « espace coach seul »)

Guide du 13/11/2026 pour Antonino. But : des coachs utilisent Coory dès maintenant, avec une vraie
base de données, la connexion Google et l'Assistant IA réservé à l'abonnement. À suivre dans l'ordre.
Rien de tout cela n'a encore été fait : **intégration préparée, non testée en réel**.

Ce qui part en ligne : l'espace coach. La messagerie, les invitations et l'espace sportif sont masqués
(D-167, `src/config/features.ts`) ; l'inscription ne crée que des comptes coach.

## 0. Ce qu'il te faut

| Service | Rôle | Remarque |
| --- | --- | --- |
| GitHub | le code (`lbantonino/coaching_platform`, privé) | déjà en place |
| Supabase | base de données, comptes, fichiers | un **nouveau** projet, région UE |
| Vercel | héberge l'application Next.js | relié au dépôt GitHub |
| Google Cloud | bouton « Continuer avec Google » | gratuit |
| Anthropic | Assistant IA (Claude) | payant à l'usage, plafond à fixer |
| Brevo | envoi des e-mails (confirmation, mot de passe) | tu l'utilises déjà |
| Un nom de domaine | ex. `coory.app` (à choisir) | tout le reste en dépend |

Vérifie les tarifs du jour sur chaque site. Repères : Supabase gratuit met le projet en pause après
une semaine sans visite et n'a pas de sauvegarde quotidienne ; avec de vraies données de coachs, prends
l'offre Pro. Vercel « Hobby » est réservé à un usage non commercial : dès que Coory est vendu, il faut
l'offre Pro.

## 1. Supabase (base de production)

1. supabase.com, « New project » : nom `coory-prod`, **région UE** (Francfort ou Paris), mot de passe
   de base long (garde-le dans ton gestionnaire de mots de passe).
2. Envoie toutes les migrations (tables, sécurité, catalogue d'exercices) par l'**intégration GitHub**
   (gratuite depuis avril 2026, choisie le 14/11) : **Project Settings → Integrations → GitHub**,
   dépôt `lbantonino/coaching_platform`, **Working directory** `.`, **Deploy to production** activé,
   branche `main`, branches automatiques désactivées (payantes). Ensuite, **chaque `git push` sur
   `main` applique les nouvelles migrations** à la base en ligne. Les réglages de connexion (`[auth]`
   de `config.toml`) et la graine de démonstration sont ignorés : la base en ligne n'a jamais de faux
   sportifs. Vérification après un envoi : « Last migration » sur l'accueil du projet, et la table
   `organizations` vide tant qu'aucun coach ne s'est inscrit. Règle : ne pousser une migration
   qu'après `npm run db:test` en local, car elle part directement en production.

   Sans l'intégration (solution de secours), avec Node 24 :

   ```bash
   npx supabase login
   npx supabase link --project-ref <ref du projet>
   npx supabase db push
   ```

   Projet de la bêta (14/11/2026) : `Coory-beta`, région **eu-west-1 (Irlande, UE)**, plan gratuit.
3. **Authentication → URL Configuration** : Site URL `https://<ton domaine>` ; Redirect URLs
   `https://<ton domaine>/**`.
4. **Authentication → Sign In / Providers → Email** : confirmation de l'e-mail **activée**,
   « Secure password change » **activé**, longueur minimale du mot de passe **10** (comme l'app).
5. **Authentication → Emails → SMTP** : brancher Brevo (hôte `smtp-relay.brevo.com`, port 587, ton
   identifiant SMTP Brevo, expéditeur `noreply@<ton domaine>` après avoir validé le domaine chez
   Brevo). Sans SMTP, Supabase n'envoie que quelques e-mails par heure.
6. **Authentication → Emails → Templates** : coller le modèle « Confirm signup » de
   `supabase/templates/confirmation.html` (les autres restent ceux de Supabase).
7. **Code d'accès de la bêta** (D-140) : **Authentication → Hooks → Before User Created** →
   fonction `public.before_user_created_access_code`. Puis, dans **SQL Editor** :

   ```sql
   select private.set_signup_access_code('UN-CODE-DE-12-CARACTERES-OU-PLUS');
   ```

   Sans code enregistré, les inscriptions sont fermées (sûr par défaut). Tu donnes le code aux coachs
   que tu invites.
8. **Modèles Coory** (Prépa Hyrox, 10 km, semi-marathon, marathon, trois séances) : ils ne sont pas
   dans les migrations (D-155 : leur contenu se valide avec Gianluca). Quand Gianluca a validé les
   allures, colle le contenu de `supabase/content/modeles_coory.sql` dans **SQL Editor** et exécute-le
   une fois (le rejouer ne crée pas de doublon). Avant cela, l'onglet « Modèles Coory » est vide.

## 2. Connexion Google

1. console.cloud.google.com : nouveau projet « Coory » → « API et services » → **Écran de
   consentement OAuth** : externe, nom Coory, ton e-mail de contact, domaine autorisé = ton domaine.
   Passe l'application **en production** (sinon seuls les « utilisateurs test » peuvent se connecter).
2. **Identifiants → Créer → ID client OAuth → Application Web** :
   - Origines JavaScript autorisées : `https://<ton domaine>`
   - URI de redirection autorisée : `https://<ref du projet>.supabase.co/auth/v1/callback`
3. Supabase, **Authentication → Providers → Google** : activer, coller l'ID client et le secret.
   Laisser « Skip nonce checks » **désactivé**.
4. Vercel (étape 4) : `AUTH_PROVIDERS=google`, sinon le bouton n'apparaît pas.

**Google et le code d'accès** : le crochet de l'étape 1.7 contrôle **toute** création de compte, Google
compris. Pendant la bêta privée :

- un coach crée son compte par e-mail **avec le code** ; ensuite « Continuer avec Google » avec la
  **même adresse Gmail** le connecte à ce compte (Supabase relie les deux, pas de nouveau compte) ;
- une inscription directe par Google, sans compte existant, est **refusée** (pas de code).

Pour ouvrir les inscriptions à tous (Google compris) : désactiver le crochet dans **Hooks**. Ajoute
alors un CAPTCHA (étape 6) avant.

## 3. Assistant IA (clé Claude)

L'assistant ne répond **qu'aux organisations abonnées** (D-168), Gianluca compris : sans abonnement,
aucune demande ne part chez Anthropic et rien n'est facturé. Abonné, chaque coach a **100 demandes par
mois** au plus. La base vérifie les deux à chaque demande (`reserve_assistant_use`).

1. console.anthropic.com : crée l'organisation, ajoute des crédits (Billing).
2. **Settings → Limits** : fixe une **limite de dépense mensuelle** (ex. 20 $). C'est le filet de
   sécurité ultime, même en cas de bug.
3. **API Keys → Create Key** : nom `coory-production`, **Linked account : un compte de service** (pas toi : la clé ne dépend pas de ton compte) et **limitée à un espace de travail** (ex. Default). Sinon l'API refuse chaque demande (400 « This API key is not scoped to a workspace »). Copie-la **une seule fois** dans Vercel
   (`ANTHROPIC_API_KEY`, étape 4). Jamais dans le code, dans Git ni dans un message.
4. Activer l'abonnement d'une organisation (toi seul, dans **SQL Editor** de Supabase) :

   ```sql
   select id, name, coory_plan from public.organizations;
   update public.organizations set coory_plan = 'premium' where id = '<id>';
   ```

   Pour le retirer : `coory_plan = 'free'`. Les coachs ne peuvent pas le changer eux-mêmes.

   **Ou par adresse e-mail** (D-171 : Gianluca et toi pour l'instant), même sans abonnement de
   l'organisation, en minuscules :

   ```sql
   insert into private.assistant_allowed_emails (email, note) values ('<adresse>', '<qui>');
   -- retirer : delete from private.assistant_allowed_emails where email = '<adresse>';
   ```

   Tous les autres coachs voient la carte « disponible avec l'abonnement mensuel Coory ».
5. Suivre la consommation : `select user_id, count(*), sum(input_tokens), sum(output_tokens) from
   public.assistant_usage where created_at > date_trunc('month', now()) group by user_id;`

Coût indicatif : modèle Claude Opus 5.5 (4 $ par million de jetons envoyés, 20 $ par million reçus,
à vérifier sur la page des tarifs). Une demande coûte de l'ordre de 2 à 5 centimes ; avec la limite de
100, au plus quelques dollars par coach et par mois.

## 4. Vercel (l'application)

1. vercel.com → « Add New Project » → importer `lbantonino/coaching_platform`. Framework Next.js
   (détecté). Node 24 (Settings → General → Node.js Version).
2. **Settings → Functions → Region** : Francfort (`fra1`) ou Paris (`cdg1`), près de Supabase.
   Vérifie aussi **Settings → Functions → Fluid Compute** activé : l'espace coach demande jusqu'à
   300 s par fonction (`maxDuration`), car l'Assistant IA peut écrire un programme pendant 4 minutes
   au plus (D-172).
3. **Environment Variables** (Production) :

   | Nom | Valeur | Où la trouver |
   | --- | --- | --- |
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://<ref>.supabase.co` | Supabase → Project Settings → API |
   | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | clé « publishable » | même page |
   | `AUTH_PROVIDERS` | `google` | |
   | `ANTHROPIC_API_KEY` | la clé de l'étape 3 (cocher « Sensitive ») | console Anthropic |

   **Pas** de `SUPABASE_SECRET_KEY` pour ce MVP : elle ne sert qu'aux invitations, masquées. Moins
   de clé secrète en ligne, moins de risque.
4. « Deploy ». Puis **Settings → Domains** : ajouter ton domaine et suivre les indications DNS.
5. Mise à jour plus tard : `git push` sur `main` redéploie. Si une nouvelle migration arrive, lance
   `npx supabase db push` **avant** de pousser le code qui en a besoin.

**Limite connue** : Vercel refuse les envois de plus de 4,5 Mo. Les documents sont donc limités à
**4 Mo** (photos : 2 Mo). Pour aller au-delà, il faudra envoyer les fichiers directement au stockage
Supabase.

## 5. Vérifications après la mise en ligne

Sur téléphone puis sur ordinateur :

- [ ] Inscription par e-mail **sans** code : refusée. **Avec** le code : e-mail Brevo reçu, lien qui
      mène à « Bienvenue », compte coach créé.
- [ ] « Continuer avec Google » avec la même adresse : connexion au même compte.
- [ ] « Mot de passe oublié » : e-mail reçu, nouveau mot de passe enregistré.
- [ ] Créer un sportif, un programme depuis un modèle Coory (après l'étape 1.8), le publier,
      télécharger le PDF.
- [ ] Documents : envoyer un PDF de moins de 4 Mo, l'ouvrir.
- [ ] `/coach/messages` ramène au tableau de bord ; « Écrire » et « Inviter » ouvrent « Bientôt
      disponible ».
- [ ] Assistant IA verrouillé ; après `coory_plan = 'premium'`, une question reçoit une réponse et le
      compteur « demandes restantes » baisse.
- [ ] Les en-têtes de sécurité sont là (securityheaders.com sur ton domaine).

## 6. Avant d'ouvrir les inscriptions au public

- **CAPTCHA** (Cloudflare Turnstile) sur l'inscription et la connexion : Supabase → Authentication →
  Attack Protection, et l'app doit transmettre le jeton (petit changement de code à prévoir).
- **Protection des mots de passe divulgués** (offre Pro de Supabase).
- **Pages légales** : conditions et confidentialité à finaliser, avec la liste des sous-traitants :
  Supabase (hébergement UE), Vercel, Brevo (e-mails), Google (connexion) et **Anthropic** pour
  l'Assistant IA (les questions du coach sont envoyées à Claude ; recommander de ne pas y écrire de
  données de santé). Aucun cookie autre que ceux de la session : pas de bandeau de cookies tant
  qu'aucun outil de statistiques n'est ajouté.
- **Bibliothèque** : les images et données RepDB exigent la mention « Exercise data by RepDB »
  (déjà dans l'app) ; vérifie que leur licence couvre un usage commercial.
- **Allures des modèles de course** : à faire valider par Gianluca.
