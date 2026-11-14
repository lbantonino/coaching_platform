# Accès de démonstration pour les visiteurs de Synode

Demande d'Antonino du 14/11/2026. **Construit le 14/11 côté Coory (D-176)** ; mise en service :
`docs/DEPLOIEMENT.md` §5 bis. Reste : la page Coory du site Synode. Même note côté site : `livrables/Site-Web/Synode-agency/docs/SITE_A_COMPLETER.md`.

## La demande

- Sur synode-agency.com, donner aux bêta-testeurs et aux prospects une **adresse e-mail et un mot de
  passe inventés** pour entrer directement dans Coory, sans s'inscrire.
- Ce compte a l'**Assistant IA**, avec **100 demandes par mois au plus** (le plafond de Coory par coach),
  pour ne pas dépasser le crédit Claude d'Antonino.
- Le site dit aussi que **chacun peut créer son propre compte**, mais sans l'Assistant IA.

## Les risques d'un compte partagé, et les protections proposées

| Risque | Protection proposée |
|---|---|
| Un visiteur change le mot de passe ou l'e-mail, ou supprime le compte : plus personne n'entre | Compte marqué « démo » : ni mot de passe, ni e-mail, ni suppression du compte modifiables (refus côté serveur) |
| Un visiteur saisit de vraies données (un vrai client, des notes de santé) vues par tous les autres (RGPD) | Bandeau permanent « Compte de démonstration partagé : n'y mettez aucune donnée réelle » + remise à zéro régulière |
| Données effacées, salies ou absurdes pour le visiteur suivant | Données fictives (sportifs, séances, programmes) remises à zéro automatiquement |
| Les 100 demandes du mois épuisées par les premiers visiteurs | Accepté : c'est le plafond de coût voulu ; message « plus de demande ce mois-ci » |
| Vraies données de Gianluca exposées | Aucun risque : chaque organisation est isolée par la base (RLS, testée) |

Adresse proposée : `demo@synode-agency.com` (domaine d'Antonino et Killian ; aucune boîte nécessaire, le
compte est confirmé par l'administrateur). Jamais une adresse sur un domaine qui ne lui appartient pas.

## Décisions d'Antonino (14/11/2026)

1. **Remise à zéro des données de démo chaque nuit, à 3 h (heure de Bruxelles)**, par une tâche planifiée
   dans Supabase (pg_cron, gratuite). Chaque heure était possible et gratuit, écarté : un visiteur
   perdrait ce qu'il crée en pleine visite.
2. **Le code d'accès de la bêta est publié sur Synode** : les inscriptions deviennent libres pour qui
   visite le site ; l'Assistant IA reste fermé à ces comptes. Le code n'est jamais écrit dans le code
   du site : variable Netlify, changeable sans toucher au code.
3. **Adresse du compte de démo : `demo@synode-agency.com`.** `demo@coory.app` refusé : `coory.app` est
   libre (vérifié le 14/11) mais n'appartient pas à Antonino ; un futur propriétaire recevrait les
   e-mails « mot de passe oublié » et prendrait le compte. Le mot de passe (public par nature) est
   choisi par Antonino à la création du compte dans Supabase et saisi dans Netlify, jamais dans Git.

Point technique : Supabase laisse un utilisateur connecté changer son mot de passe directement par
l'API d'authentification, sans passer par l'app. La vraie protection sera donc dans la base (un
déclencheur sur `auth.users` qui garde le mot de passe et l'e-mail du compte de démo), en plus des
refus dans l'app.

## Relecture indépendante du 14/11

Corrigés : « Déconnecter partout » ne sort que le visiteur sur la démo ; métadonnées du compte figées ;
profil du coach remis entièrement à ses réglages par défaut ; tests SQL du blocage des fichiers et des
factures d'une autre organisation. Reportés (mineurs) : double authentification (à désactiver dans
Supabase, voir le guide) ; le compte de démo peut accepter une invitation de sportif d'une autre
organisation (invitations masquées pour l'instant) ; pas de boîte e-mail pour l'adresse de démo (alias
recommandé) ; `set_demo_password` ne coupe pas les sessions ouvertes ; la tâche terminée de la démo n'a
pas d'auteur ; un échec de remise à zéro bloque toutes les démos sans alerte (surveiller
`cron.job_run_details`) ; catégories par défaut recopiées depuis les déclencheurs ; 2 h UTC = 3 h l'hiver,
4 h l'été à Bruxelles.

## Ce qu'il faudra faire ensuite

- Coory : drapeau « démo », refus côté serveur, bandeau, données fictives et leur remise à zéro (tâche
  planifiée dans Supabase), adresse ajoutée à la liste de l'assistant, mention dans la politique de
  confidentialité.
- Synode : la page Coory affiche l'accès de démonstration et la phrase sur l'inscription libre.
