# 13 · Paramètres — interactions

| Élément | Déclencheur | Comportement attendu | Cas limites / statut |
|---|---|---|---|
| Rubrique (menu gauche / déroulant) | Clic | Change le contenu ; mobile : ferme le menu | Modifs non enregistrées → confirmation PROPOSED |
| Fermer | Clic / Échap | Ferme la modale | Idem |
| Thème | Clic | Applique le thème sur cet appareil (localStorage) | Système = prefers-color-scheme |
| Interrupteurs de notifications | Clic | Activent/désactivent les types comptés dans la cloche | — |
| Je facture la TVA | Clic | Affiche/masque le taux | — |
| Changer de devise | Clic | Flux existant (TO-VERIFY) | — |
| Changer d’adresse | Clic | Envoie un lien de confirmation | — |
| Changer le mot de passe | Clic | Validation ≥ 10 + identiques | — |
| Déconnecter partout | Clic | Confirmation puis révocation des sessions | Action sensible |
| Télécharger mes données | Clic | Export JSON existant | — |
| Enregistrer | Clic | Enregistre la rubrique | TO-VERIFY : regrouper les appels API par rubrique |

Inventaire exhaustif (handler par élément) : `interactive-elements.md`. Logique de référence : `../../source-design-files/pages/13-parametres/logic.js`.
