# Accessibilité

- Contraste : textes `#17151d` / `#4a4855` / `#64626e` sur blanc ≥ 4.5:1. `#8b8996` réservé aux placeholders et textes secondaires de grande taille ou non essentiels. Jaune HYROX jamais en texte : utiliser `#8a6200`.
- Rôles présents dans la maquette : `role="tablist"`/`tab` + `aria-selected` (onglets), `role="listbox"`/`option` + `aria-selected` (menus), `aria-haspopup` + `aria-expanded` (déclencheurs), `aria-pressed` (segmentés, cartes sélectionnables), `aria-label` sur boutons icônes (« Créer », « Supprimer », « Nouveau sportif »), `role="img" aria-label="Coory"` sur le logo.
- Clavier : Tab sur tous les contrôles ; Entrée/Espace activent ; Échap ferme les menus déroulants ; flèches ↑↓ dans les listes (à implémenter, non visible).
- Focus visible obligatoire (non dessiné) : anneau violet `rgba(139,92,246,.55)` 2 px.
- Cibles tactiles mobiles ≥ 40 px (44 recommandé).
- Graphiques : fournir un équivalent texte (le tableau « Voir les valeurs en tableau » en 2g).
