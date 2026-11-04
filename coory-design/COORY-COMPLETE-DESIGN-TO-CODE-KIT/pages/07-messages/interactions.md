# 07 · Messages — interactions

| Élément | Déclencheur | Comportement attendu | Cas limites / statut |
|---|---|---|---|
| Nouveau message / + | Clic | Menu Nouvelle conversation · Nouveau groupe | — |
| Filtres | Clic | Filtre la liste | — |
| Conversation | Clic | Ouvre le fil, marque lu | — |
| Planifier | Clic | Ouvre « Nouvelle séance » pré-remplie avec le sportif (kit Modals) | TO-VERIFY |
| Voir la séance | Clic | Fiche séance liée au groupe | — |
| Voir les membres | Clic | Liste des membres (PROPOSED : panneau non dessiné) | — |
| Trombone | Clic | Pièce jointe | TO-VERIFY stockage |
| Composer | Entrée | Envoie ; Maj+Entrée nouvelle ligne | Vide → Envoyer grisé |
| Créer le groupe (N) | Clic | Crée le groupe, ouvre son fil | Nom requis, N ≥ 2 (TO-VERIFY) |

Inventaire exhaustif (handler par élément) : `interactive-elements.md`. Logique de référence : `../../source-design-files/pages/07-messages/logic.js`.
