# 15 — Interactions

> ✅ = visible dans la maquette · ⚠️ = règle d’implémentation à vérifier dans le code existant de COORY.

- ✅ Ouverture : Liste · pastille du programme.
- ⚠️ Fermeture : bouton ✕, clic sur l’overlay, touche Échap, choix d’une action. Mobile : glisser la poignée vers le bas.
- ✅ Bouton retour : revient au menu parent (sans fermer).
- ✅ Ligne entière cliquable ; survol desktop #f6f5f9.
- ⚠️ Clavier : flèches ↑/↓ entre les lignes, Entrée pour valider (role="menu"/"menuitem").
- ⚠️ Focus piégé dans la boîte, restauré sur le déclencheur à la fermeture ; `role="dialog"`, `aria-modal="true"`, `aria-labelledby` sur le titre.
- ✅ Zones tactiles mobile ≥ 44 px.
