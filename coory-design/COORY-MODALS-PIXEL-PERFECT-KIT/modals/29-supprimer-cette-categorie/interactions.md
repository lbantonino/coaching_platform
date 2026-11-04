# 29 — Interactions

> ✅ = visible dans la maquette · ⚠️ = règle d’implémentation à vérifier dans le code existant de COORY.

- ✅ Ouverture : Catégories de dépenses → corbeille.
- ⚠️ Fermeture : bouton ✕, « Annuler », clic sur l’overlay, touche Échap. Mobile : glisser la poignée vers le bas.
- ⚠️ Focus initial sur « Annuler » (action non destructive).
- ✅ Le bouton rouge exécute l’action ; fermer ensuite et afficher le retour actuel de l’app.
- ⚠️ Focus piégé dans la boîte, restauré sur le déclencheur à la fermeture ; `role="dialog"`, `aria-modal="true"`, `aria-labelledby` sur le titre.
- ✅ Zones tactiles mobile ≥ 44 px.
