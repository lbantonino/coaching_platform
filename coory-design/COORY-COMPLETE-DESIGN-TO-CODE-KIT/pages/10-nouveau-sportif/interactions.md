# 10 · Nouveau sportif — interactions

| Élément | Déclencheur | Comportement attendu | Cas limites / statut |
|---|---|---|---|
| Pilules lieux / jours | Clic | Choix multiple (`✓`) | — |
| Statut | Clic | Choix unique | Défaut Actif |
| Interrupteur d’accord | Clic | Affiche/masque le champ blessures | Retrait d’accord = suppression des blessures notées (confirmation) |
| Enregistrer le sportif | Clic | Création via l’API existante → fiche du sportif | Désactivé tant que Prénom vide |

Inventaire exhaustif (handler par élément) : `interactive-elements.md`. Logique de référence : `../../source-design-files/pages/10-nouveau-sportif/logic.js`.
