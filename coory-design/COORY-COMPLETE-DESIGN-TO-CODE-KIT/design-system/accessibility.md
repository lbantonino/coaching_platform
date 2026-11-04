# Accessibilité

- **Contrastes** : `#17151d` sur `#fff` (17:1), `#64626e` sur `#fff` (5.9:1), `#6a3ee0` sur `#fff` (6.3:1) ✅. `#8b8996` sur `#fff` (3.4:1) → réservé aux aides/placeholders ≥ 12 px, jamais au texte essentiel. Blanc sur `#8b5cf6` (4.2:1) → OK pour libellés 12.5 px **600** ; préférer `#6a3ee0` si texte long.
- **Zones tactiles** : ≥ 44×44 px sur mobile (boutons 44, items de menu 46–52, pilules 40 → ajouter 2 px de zone tactile invisible).
- **Focus** : anneau visible `0 0 0 3px rgba(139,92,246,.35)` sur tous les éléments interactifs (non dessiné → PROPOSED).
- **Rôles** : sélecteurs segmentés `tablist/tab` + `aria-selected` ; pilules `aria-pressed` ; interrupteurs `role="switch"` + `aria-checked` ; menus `role="menu"/"menuitem"` + `aria-expanded` sur le déclencheur ; modales `role="dialog"` + `aria-modal` + focus initial sur le 1er champ, retour du focus au déclencheur à la fermeture.
- **Libellés** : chaque bouton icône a un `aria-label` (liste exacte dans `pages/*/interactive-elements.md`).
- **Mouvement** : rotation du FAB et transitions ≤ 200 ms, désactivées si `prefers-reduced-motion`.
