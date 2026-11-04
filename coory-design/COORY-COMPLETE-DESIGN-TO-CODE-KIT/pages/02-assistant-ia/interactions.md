# 02 · Assistant IA — interactions

| Élément | Déclencheur | Comportement attendu | Cas limites / statut |
|---|---|---|---|
| Bouton global « Assistant IA » (SH-03) | Clic | Ouvre / ferme la boîte (`aria-expanded`) | Échap et clic overlay ferment |
| « Plein écran » | Clic | Ouvre la page complète en conservant la conversation en cours | TO-VERIFY : même conversation transférée |
| « Fermer » | Clic | Ferme la boîte ; brouillon conservé | — |
| Suggestion / raccourci | Clic | Envoie le prompt associé (ex. « Prépare le bloc 2 du programme de Lucas ») et affiche la réponse | — |
| Pilule « Sportif » | Clic | Sélecteur de sportif → contexte joint à la demande ; la pilule affiche le nom | PROPOSED : sélecteur non dessiné, utiliser la recherche sportifs existante |
| Textarea | Entrée | Envoie ; Maj+Entrée = nouvelle ligne | Vide → Envoyer grisé |
| Case d’action proposée | Clic | Coche / décoche ; le libellé du bouton devient « Valider N actions » | N = 0 → bouton désactivé |
| « Valider N actions » | Clic | Exécute **seulement** les actions cochées ; réponse de confirmation | TO-VERIFY : API d’actions de l’assistant |
| « Nouvelle conversation » | Clic | Vide la zone et démarre un fil ; l’ancien rejoint l’historique | — |
| Titre dans l’historique | Clic | Ouvre l’ancienne conversation | À COMPLÉTER : non câblé dans la maquette |
| Mobile « Historique » | Tap | Ouvre le panneau d’historique | À COMPLÉTER : panneau non dessiné |
| Mobile « + Plus d’options » | Tap | Menu : Joindre un fichier + suggestions | — |
| Joindre / Dicter | Clic | Pièce jointe / dictée vocale | PROPOSED (statiques en maquette) |

Inventaire exhaustif (handler par élément) : `interactive-elements.md`. Logique de référence : `../../source-design-files/pages/02-assistant-ia/logic.js`.
