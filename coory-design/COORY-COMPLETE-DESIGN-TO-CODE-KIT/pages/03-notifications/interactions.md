# 03 · Notifications — interactions

| Élément | Déclencheur | Comportement attendu | Cas limites / statut |
|---|---|---|---|
| Onglet Toutes / Non lues / Masquées | Clic | Filtre ; sections vides cachées hors « Toutes » ; compteurs à jour | — |
| « Tout marquer comme lu » | Clic | Marque tout ; toast « Annuler » | Grisé si 0 non lue |
| « Sélectionner » | Clic | Mode sélection (cases + barre d’actions) | « Annuler » quitte |
| Case de ligne / Tout sélectionner | Clic | Sélection ; actions groupées actives si ≥ 1 | — |
| Actions groupées | Clic | Lu / Masquer / Supprimer sur la sélection ; toast « Annuler » | Supprimer : définitif après 5 s |
| Menu « … » | Clic | Ouvre M-MENU sous le bouton, aligné à droite | Clic extérieur / Échap ferme |
| Masquer | Clic | Déplace vers « Masquées » (réversible) | — |
| Supprimer | Clic | Retire définitivement (après toast) | — |
| Ligne | Clic | Ouvre l’élément (conversation, tâche, séance, fiche) et le marque lu | TO-VERIFY routes |
| Lien de section | Clic | Navigue vers la page concernée | — |

Inventaire exhaustif (handler par élément) : `interactive-elements.md`. Logique de référence : `../../source-design-files/pages/03-notifications/logic.js`.
