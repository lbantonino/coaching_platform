# Accès de démonstration pour les visiteurs de Synode (à faire)

Demande d'Antonino du 14/11/2026. Rien n'est construit : ce fichier garde la demande, le plan
proposé et les décisions attendues. Même note côté site : `livrables/Site-Web/Synode-agency/docs/SITE_A_COMPLETER.md`.

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

## Décisions attendues d'Antonino

1. Fréquence de remise à zéro des données de démo : chaque nuit (proposé), chaque semaine, jamais.
2. Inscription libre des prospects : publier le code d'accès de la bêta sur Synode (proposé, simple),
   ou ouvrir les inscriptions sans code.
3. L'adresse et le mot de passe du compte de démonstration.

## Ce qu'il faudra faire ensuite

- Coory : drapeau « démo », refus côté serveur, bandeau, données fictives et leur remise à zéro (tâche
  planifiée dans Supabase), adresse ajoutée à la liste de l'assistant, mention dans la politique de
  confidentialité.
- Synode : la page Coory affiche l'accès de démonstration et la phrase sur l'inscription libre.
