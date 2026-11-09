# QA accessibilité

- Navigation clavier complète : onglets (flèches gauche/droite, `role="tablist"`), segmentés (`role="radiogroup"`), selects natifs ou combobox ARIA, menus ··· (`aria-haspopup="menu"`, Échap ferme, focus rendu au bouton), feuilles et modales (focus piégé, Échap ferme, `aria-modal`).
- Focus visible : outline 2 px #8b5cf6 offset 2 (PROPOSED, invisible sur les captures).
- Libellés : chaque input a un `<label>` (texte gris au-dessus) ; boutons icône avec `aria-label` (« Assistant IA », « Notifications », « Plus d'actions », « Monter la séance », « Descendre la séance »).
- Contrastes : texte #17151d / #4a4855 / #64626e sur blanc ✓ AA ; #8a8896 réservé aux kickers et métas ≥ 11.5 px gras [vérifier] ; texte #8a6200 sur teinte Hyrox ✓.
- Cibles tactiles mobiles ≥ 44 px (respecté dans les maquettes).
- Cartes dépliables : `<button aria-expanded>` (déjà dans le code de 2c).
- Jours indisponibles : ne pas compter uniquement sur le barré → `aria-disabled` + texte « indispo ».
- PDF : PDF balisé si l'outil le permet (titres H1, ordre de lecture), langue fr-FR, liens identifiables (texte explicite).
