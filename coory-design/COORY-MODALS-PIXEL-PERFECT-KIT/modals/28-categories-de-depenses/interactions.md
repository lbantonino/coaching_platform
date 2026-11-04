# 28 — Interactions

> ✅ = visible dans la maquette · ⚠️ = règle d’implémentation à vérifier dans le code existant de COORY.

- ✅ Ouverture : Nouvelle dépense → Gérer les catégories.
- ⚠️ Fermeture : bouton ✕, « Annuler », clic sur l’overlay, touche Échap. Mobile : glisser la poignée vers le bas.
- ✅ Bouton retour : revient au menu parent (sans fermer).
- ⚠️ Garder exactement les validations, champs obligatoires et appels API actuels. Les « (facultatif) » indiquent les champs non obligatoires.
- ⚠️ Erreur de champ : bordure #c8243c + message 13 px #c8243c sous le champ (non dessiné, à confirmer).
- ⚠️ Pendant l’envoi : bouton principal désactivé avec indicateur de chargement ; fermeture après succès.
- ⚠️ Modifications non enregistrées : comportement actuel à conserver.
- ⚠️ Focus piégé dans la boîte, restauré sur le déclencheur à la fermeture ; `role="dialog"`, `aria-modal="true"`, `aria-labelledby` sur le titre.
- ✅ Zones tactiles mobile ≥ 44 px.
