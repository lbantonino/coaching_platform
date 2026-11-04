# 09 · Inviter un sportif — interactions

| Élément | Déclencheur | Comportement attendu | Cas limites / statut |
|---|---|---|---|
| Générer le lien | Clic | Appelle la génération existante → état 2 | TO-VERIFY API |
| Copier le lien | Clic | Presse-papiers + toast « Lien copié » | — |
| WhatsApp / E-mail / SMS | Clic | Liens `https://wa.me/?text=`, `mailto:?body=`, `sms:?&body=` avec message pré-rempli + lien | Aucun envoi côté serveur |
| Générer un nouveau lien | Clic | Invalide l’ancien, nouveau lien → état 2 | Confirmation (kit Modals) |
| Révoquer ce lien | Clic | Confirmation puis état 1 | — |
| Voir la fiche / Envoyer un message | Clic | Navigation | — |

Inventaire exhaustif (handler par élément) : `interactive-elements.md`. Logique de référence : `../../source-design-files/pages/09-inviter-sportif/logic.js`.
