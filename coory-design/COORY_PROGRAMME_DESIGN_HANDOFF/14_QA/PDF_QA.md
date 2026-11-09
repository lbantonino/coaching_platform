# QA PDF

1. Générer les 2 PDF du programme de démo (12 semaines).
2. Vérifier : nombre de pages (13 / 5), format A4 portrait, polices embarquées (`pdffonts`), texte sélectionnable, métadonnées.
3. Cliquer **chaque** lien listé dans `12_PDF_SYSTEM/LINKS_AND_DESTINATIONS.md` dans les 5 lecteurs de `compatibility-tests/COMPATIBILITY_MATRIX.md`.
4. Vérifier les signets.
5. Comparer chaque page aux captures 2× `12_PDF_SYSTEM/screenshots/` (diff visuel ≤ 1 %).
6. Vérifier qu'aucune carte de jour n'est coupée entre deux pages, aucun texte ne déborde (une info par ligne).
7. Vérifier qu'aucun jeton ni secret n'apparaît dans les liens.
