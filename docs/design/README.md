# Design de Coory : ce qui fait foi

Mis à jour le 04/11/2026, après le nettoyage du dossier.

1. **Le code** : `src/styles/tokens.css` (jetons de couleur, clair et sombre) et les composants de
   `src/components/`. C'est la référence finale : la fiche sportif y a été reproduite au pixel près.
2. **`design-system/`** : le design system de la maquette « Sportifs » du 03/11/2026 (couleurs,
   typographie, espacements, composants, responsive, accessibilité), avec ses valeurs exactes. À suivre
   pour toute nouvelle page.
3. **`composants/`** : les composants partagés de cette maquette (cartes, champs, en-têtes, menus,
   navigation) et l'extrait exact du cadre de l'app (`source-shell-fiche.md`, `source-fiche-header.md`).
4. **`COORY_VIOLET_ACCENTS.md`** : la charte « Noir, blanc et violet » (D-77), dont la règle du violet
   rare et les accents du mode sombre.
5. **`coory-brand/`** : le kit du **logo définitif** (04/11/2026) : son README (règles, couleurs, proportions, interdits), les 3 planches de `reference/`, les SVG (copiés dans `public/brand/`), les PNG (favicon, icônes d'écran d'accueil, image de partage, copiés dans `public/`) et le composant `CooryLogo.tsx` (copié dans `src/components/brand/`). Ne jamais redessiner le logo.

Les maquettes déjà réalisées (tableaux de bord successifs, page séance, maquette « Sportifs » et ses
fiches de pages, design system « Graphite & Or ») ont été retirées le 04/11/2026. Elles restent dans
l'historique Git : `git show cc7312c:<chemin>` (par exemple `COORY-SPORTIF-PIXEL-PERFECT/pages/02e-…`
pour l'onglet Programme, pas encore refait).
