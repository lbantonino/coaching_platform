# COORY — Kit Pixel Perfect des boîtes de dialogue

36 boîtes × desktop + mobile = 72 maquettes, issues de la planche **Coory Boites**.

## Lire dans cet ordre

1. `README.md` (ce fichier)
2. `MASTER-INDEX.md`
3. `design-system/` puis `shared-components/`
4. `IMPLEMENTATION-ORDER.md`
5. `FUNCTIONAL-GAP-ANALYSIS.md`
6. `implementation/claude-code-master-prompt.md`
7. Pour chaque boîte : `modals/NN-nom/`

## Fiabilité des valeurs

- **Exact** : tout ce qui vient du fichier source (styles inline) : tailles, couleurs, rayons, paddings, textes.
- **Calculé (≈)** : largeurs de colonnes de formulaire.
- **⚠️ À vérifier** : tout comportement (validations, API, focus, clavier) — la maquette est statique, le code existant de COORY fait foi.

## Fichiers sources

Voir `SOURCE-FILES-MANIFEST.md`. Le fichier `Coory Boites.dc.html` est l’original ; il s’ouvre dans un navigateur avec `support.js` à côté.

## Captures

72 captures PNG à 2× (desktop 2400 × 1560, mobile 780 × 1688), une paire par dossier `modals/NN-*/screenshots/`. Elles sont produites par un rendu DOM : quelques retours à la ligne peuvent différer très légèrement du navigateur. **En cas de doute, ouvrir `source-design-files/shared/Coory Boites.dc.html`, qui fait foi.** Pas de version annotée : les mesures exactes sont dans `desktop-spec.md` / `mobile-spec.md`.
