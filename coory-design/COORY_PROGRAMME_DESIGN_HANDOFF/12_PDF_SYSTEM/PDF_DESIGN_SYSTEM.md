# PDF — design system (EXACT, extrait de `CooryPdfDoc.dc.html`)

## Format
- **A4 portrait** : 210 × 297 mm. Maquette : 620 × 877 px CSS (ratio 1 : 1,414). Échelle d'impression : 1 px maquette ≈ 0,339 mm.
- Marges : 28 (haut) · 36 (côtés) · 18 (bas) px maquette → ≈ 9,5 / 12,2 / 6,1 mm.
- Polices intégrées : Plus Jakarta Sans 400/500/600/700/800 (embarquer les fichiers, pas de Google Fonts en ligne).
- Texte **vectoriel et sélectionnable** ; jamais une page aplatie en image.

## Structure de chaque page
1. **En-tête** : logo Coory 15 px haut à gauche ; à droite « Prépa HYROX Gand · Inès Ben Ali » (10.5/600) + nom du document (10.5/400 #64626e).
2. **Barre de navigation** (30 px de haut, gap 6) : « ‹ Précédente » (contour #cfcdd8, 11/600) · **bouton central noir** (« Semaine 2 sur 12 ▾ » / « Full Body A · 1 sur 4 ▾ » / « Sommaire ») qui renvoie au sommaire · « Suivante › ». Aux extrémités, le bouton désactivé affiche « — » en #c9c7d1.
3. **Titre de page** : kicker 10/800 MAJ +0.07em (couleur de discipline ou #64626e) · H1 30/800 -0.03em · sous-titre 12/500 #4a4855 · filet 1.5 px #17151d.
4. **Contenu** (voir ci-dessous).
5. **Pied** : filet 1 px #dcdae3 ; « Coory · Julien Mertens · Version 1 » / « Page n sur N » (10/400 #64626e, sans retour à la ligne).

## Pages du PDF 1 · Agenda du programme (1 + N pages)
- **Sommaire** : lignes 38 px (r8, contour #e6e4ec) : barre de phase 6 px (Base #7776FF · Spécifique #FEC14F · Affûtage #26CBB8), « Semaine n » 12.5/700, dates · phase (10.5), étiquette (★ course / allégée), « p. n → » violet. Note d'usage en bas.
- **Semaine** : badge « Jours fixés par le coach » ; 7 lignes de jour : colonne jour 62 px (12/700 + date 10.5) ; repos = cadre pointillé #cfcdd8 « Repos » ; séance = carte r8 bordure teinte 45 % (Hyrox 70 %) : en-tête teinte 14 % (Hyrox 24 %) « RUNNING / Endurance rapide / ≈ 55 min » ; lignes 11/1.4 (gras = bloc principal, violet = renvoi « → fiche dans Fiches et repères »), **une info par ligne**.
- Variantes : semaines allégées (moins de répétitions), semaine de course (★ HYROX Gand le dimanche).

## Pages du PDF 2 · Fiches et repères (1 + K pages)
- **Sommaire** : lignes 52 px, barre de couleur par type (Musculation #DD2D4A, Hyrox #FEC14F, Repères #7776FF).
- **Fiche musculation** (Full Body A, B…) : Échauffement en texte ; tableaux par groupe (Gainage, Musculation) : en-tête teinte 14 % 10/700 MAJ ; colonnes Exercice 2.3fr · Séries .6 · Répét. 1 · Repos .8 · Commentaire 1.6 ; étiquettes A1/A2 (superset) ; ligne EMOM fusionnée ; Retour au calme ; encart « Conseil » #f6f5fa.
- **Workload Hyrox** : une carte par semaine (colonne semaine 72 px), état (fait / cette semaine en jaune / à venir), blocs 1-2-3 numérotés.
- **Allures** : tableau Repère · Allure · Vitesse · Utilisé pour, lignes alternées #fbfafd ; encart « À retenir » (min/km vs min/500 m).

## Lisibilité téléphone
Une page A4 sur un téléphone de 390 px est affichée à ≈ 0,59× : corps 11 px → ≈ 6,5 px apparents ; lecture confortable avec pince/zoom ou tablette. **Option PROPOSED** (non dessinée) : un second gabarit « téléphone » 105 × 210 mm (ratio 1:2) avec corps 14 px, généré depuis les mêmes données. À valider par le client avant développement.
