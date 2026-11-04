# 01 — Interactions

> ✅ = visible dans la maquette · ⚠️ = règle d’implémentation à vérifier dans le code existant de COORY.

- ✅ Ouverture : Tableau de bord · Créer / +.
- ⚠️ Fermeture : bouton ✕, clic sur l’overlay, touche Échap, choix d’une action. Mobile : glisser la poignée vers le bas.
- ✅ Ligne entière cliquable ; survol desktop #f6f5f9.
- ⚠️ Clavier : flèches ↑/↓ entre les lignes, Entrée pour valider (role="menu"/"menuitem").
- ⚠️ Focus piégé dans la boîte, restauré sur le déclencheur à la fermeture ; `role="dialog"`, `aria-modal="true"`, `aria-labelledby` sur le titre.
- ✅ Zones tactiles mobile ≥ 44 px.
