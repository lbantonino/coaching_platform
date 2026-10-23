# Connexion avec Google, Facebook et Apple (D-30)

État au 23/10/2026 : **intégration préparée, non testée en réel**. Le code est en place (bouton
« Continuer avec … », retour par `/auth/confirm`, dernière étape « Bienvenue ») mais aucun fournisseur
n'est activé : il faut créer des clés chez chacun. Tant qu'un fournisseur n'est pas déclaré dans
`AUTH_PROVIDERS`, son bouton n'apparaît pas.

## Principe

1. Le visiteur clique « Continuer avec Google » ; Supabase l'envoie chez Google.
2. Google le renvoie à Supabase (`…/auth/v1/callback`), puis Supabase à l'app (`/auth/confirm?next=/espace`).
3. Nouveau compte : la page « Bienvenue » demande coach ou sportif, prénom, nom et l'acceptation des
   conditions. Compte existant : il arrive directement dans son espace.

Adresse de retour à déclarer chez chaque fournisseur :

| Environnement | Adresse de retour (callback) |
| --- | --- |
| Local | `http://127.0.0.1:54321/auth/v1/callback` |
| Production | `https://<projet>.supabase.co/auth/v1/callback` |

## Google (gratuit)

1. Google Cloud Console → nouveau projet « Coory » → « API et services » → « Écran de consentement
   OAuth » (type externe, nom Coory, adresse de contact).
2. « Identifiants » → « Créer des identifiants » → « ID client OAuth » → application Web ; ajouter
   l'adresse de retour ci-dessus.
3. Copier l'ID client et le code secret.

## Facebook (gratuit)

1. developers.facebook.com → « Créer une app » → cas d'usage « Authentifier et demander des données
   aux utilisateurs avec Facebook Login ».
2. Paramètres de Facebook Login → « URI de redirection OAuth valides » : l'adresse de retour.
3. Copier l'ID de l'app et la clé secrète ; publier l'app (mode « Live ») avant la production.

## Apple (compte Apple Developer, 99 $ par an)

1. developer.apple.com → « Certificates, Identifiers & Profiles » → créer un **Services ID** avec
   « Sign in with Apple », domaine et adresse de retour.
2. Créer une **clé** « Sign in with Apple » (fichier .p8) ; Supabase en dérive le secret (voir sa
   documentation « Login with Apple »).

## Activer un fournisseur

**En local** (`supabase/config.toml`) :

```toml
[auth.external.google]
enabled = true
client_id = "<ID client>"
secret = "env(SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET)"
```

Mettre le secret dans le fichier `.env` à la racine du projet (lu par la CLI Supabase, **jamais commité**) :
`SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET=<secret>`, puis `npm run db:stop` et `npm run db:start`.

Enfin, dans `.env.local` : `AUTH_PROVIDERS=google` (ou `google,facebook,apple`), et relancer l'app
(`npm run dev` ou un nouveau `npm run build`).

**En production** : mêmes informations dans le tableau de bord Supabase (Authentication → Providers),
et `AUTH_PROVIDERS` dans les variables de l'hébergeur.
