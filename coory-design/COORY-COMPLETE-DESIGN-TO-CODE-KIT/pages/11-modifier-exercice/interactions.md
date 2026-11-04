# 11 · Modifier l’exercice — interactions

| Élément | Déclencheur | Comportement attendu | Cas limites / statut |
|---|---|---|---|
| Parcourir / dépôt | Clic / glisser | Sélection d’image ; upload existant | Formats JPEG/PNG/WebP ; ne pas modifier l’upload |
| Lien vidéo | Saisie | URL validée (http/https) | Erreur si invalide (composant existant) |
| Supprimer l’exercice / corbeille | Clic | Confirmation (kit Modals) puis suppression | TO-VERIFY API |
| Enregistrer | Clic | Sauvegarde | — |

Inventaire exhaustif (handler par élément) : `interactive-elements.md`. Logique de référence : `../../source-design-files/pages/11-modifier-exercice/logic.js`.
