# Assistant IA — spécification fonctionnelle

Sources : `../pages/02-assistant-ia/` (captures, mesures, logique `logic.js`). Fonctionnalités : F-02.1 → F-02.9.

## 1. Deux éléments à ne pas confondre
| Élément | Rôle | Statut |
|---|---|---|
| **Bouton global « Assistant IA »** (SH-03, header desktop + ✦ mobile) | Ouvre la **boîte de dialogue** par-dessus la page courante | **PROTÉGÉ** : design et comportement existants conservés |
| **Page complète Assistant IA** (entrée de menu « Assistant IA », ou « Plein écran » depuis la boîte) | Espace de travail avec historique | À intégrer selon les maquettes 1c / 1d |

## 2. Principe produit
« L’assistant ne fait jamais rien seul : il propose des actions à cocher, le coach valide. » (note de la maquette). Toute réponse qui modifie des données arrive sous forme de **card « ACTIONS PROPOSÉES »** ; rien n’est exécuté avant « Valider N actions ».

## 3. Parcours
1. Ouvrir (bouton global → boîte, ou menu → page).
2. Rédiger (textarea ; Entrée envoie, Maj+Entrée = retour ligne ; Envoyer désactivé si vide).
3. (Option) joindre un **contexte Sportif** (pilule).
4. Envoyer → bulle utilisateur à droite (`#17151d`) → indicateur « l’assistant écrit… » (non dessiné : 3 points animés dans la zone de réponse, PROPOSED) → réponse avec orbe.
5. Cocher/décocher les actions → « Valider N actions » → message de confirmation.
6. Retrouver / reprendre / démarrer une conversation : voir `assistant-ai-chat-history.md`.

## 4. États
| État | Desktop | Mobile |
|---|---|---|
| Vide | accueil + saisie + suggestions / 3 cards | accueil + raccourcis + saisie fixée en bas |
| Envoi en cours | bouton Envoyer → spinner, saisie verrouillée (PROPOSED) | idem |
| Réponse | fil défilant (boîte : max 330 px ; page : colonne 720 px) | fil plein écran |
| Erreur réseau | message dans le fil « Je n’ai pas pu répondre. Réessayer » (PROPOSED) | idem |
| Actions validées | card passe en lecture seule « ✓ 3 actions faites » (PROPOSED) | idem |

## 5. Mobile (priorité à la conversation)
- Saisie **fixée en bas** dans la safe area ; suit le clavier via `visualViewport` ; le fil défile au-dessus ; le dernier message reste visible à l’ouverture du clavier.
- Messages longs : retour à la ligne, bulle max 82 % (boîte) / pleine largeur (page) ; listes et cards d’actions ne débordent jamais horizontalement.
- Le bouton ✦ global n’apparaît pas sur la page complète (EX-01) ; « Historique » et « Nouvelle conversation » le remplacent.

## 6. À vérifier dans le code (TO-VERIFY)
- API de l’assistant existante (endpoint, streaming ?), format des « actions », exécution côté serveur.
- Persistance des conversations, permissions (un coach ne voit que ses conversations), durée de conservation.
- La boîte et la page partagent-elles la même conversation courante (« Plein écran ») ?
