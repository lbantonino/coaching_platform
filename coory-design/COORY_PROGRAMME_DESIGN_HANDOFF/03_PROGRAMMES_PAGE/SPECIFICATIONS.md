# 01 · Page Programmes — spécifications (PRG-01 à PRG-06)

Source : `programmes/CooryProgEcrans.dc.html` (part a). Repère : coordonnées relatives au cadre de l'écran. Toutes les valeurs **EXACT** (code).

## Desktop 1280 × 820 (PRG-01, 03, 05)
| Élément | Position / taille | Style |
|---|---|---|
| Cadre app | 1280 × 820, padding 14, flex gap 20, fond #f3f2f7 | — |
| Sidebar | x14 y14, 236 × 792, radius 20, padding 24 14 16 | logo 17 px haut ; items 36 haut, radius 10, 13.5/500 ; actif « Programmes » fond rgba(139,92,246,.12) ; séparateur 1 px #ecebf1 marge 12/8 ; 2e groupe (Assistant IA, Messages 3, Tâches, Documents, Notifications 9) ; avatar coach 38 en bas |
| Main | x270, largeur 996, colonne gap 12 | — |
| Header | 996 × 64, radius 20, padding 0 16 0 20 | icône programmes violette 17 ; **onglets Programmes / Modèles** (piste #f3f2f7 padding 3, onglets 34 haut, 14/600, actif blanc + ombre) ; Assistant IA 32 haut violet ; cloche 32 ; « + Créer un programme » noir 32 (onglet Modèles : « + Nouveau modèle ») |
| Barre de filtres (Programmes) | ligne space-between | onglets de statut Tous 6 · En cours 4 · Brouillons 1 · À venir 1 · Terminés 3 (piste #e8e7ee, segments 32, 13/500, compteur 12/500 #8a8896) ; 2 selects « Toutes les disciplines », « Tous les sportifs » (40 haut, radius 11) ; recherche 220 × 40 |
| Grille | 3 colonnes minmax(0,1fr), gap 12 | carte : radius 20, padding 18, colonne gap 12 |
| Carte programme | — | avatar 34 + nom 13.5/500 #4a4855 + statut (pilule 24 : Publié vN #f3f2f7 / Brouillon contour .22 / À venir violet 10 %) ; titre 16.5/600 ; pastille discipline 7 + « Hyrox · 26 oct. → 17 janv. » 12.5 ; « Semaine 2 / 12 » + « 5 / 48 séances » ; barre 6 px #ecebf1, remplissage #8b5cf6 ; objectif ⚑ séparé par 1 px #f0eff4 |
| Barre de filtres (Modèles, PRG-05) | idem | source Tous 9 · Coory 5 · Mes modèles 4 ; selects « Programmes et séances », « Toutes les disciplines » ; recherche « Rechercher un modèle » |
| Carte modèle | radius 20, padding 16 18, gap 9 | type (PROGRAMME / SÉANCE kicker) + badge « Coory » (violet 12 %, #6a3ee0) ou « Mes modèles » (#f3f2f7) ; titre 16.5/600 ; discipline · détail ; pied « Fourni par Coory / Utilisé N fois » + bouton « Utiliser » 30 haut contour |
| État vide (PRG-03) | section blanche pleine hauteur, centrée | icône 68 r21 #f1edfc ; « Ton premier programme » 26/700 ; texte 15/1.6 max 470 ; CTA « Créer un programme » noir 46 + « Le préparer avec l'Assistant IA » violet 46 |

## Mobile 390 × 844 (PRG-02, 04, 06)
| Élément | Style |
|---|---|
| Barre d'état | padding 16 28 8, 14/600 |
| Header | hamburger 46 r14 blanc ombre ; titre « Programmes » 16/600 ; pilule IA (violet 40) + cloche 40 dans pilule blanche r16 |
| Contenu | padding 20 14 130, gap 12 |
| Onglets | piste #e8e7ee r13 padding 4, segments 38, 14/600 |
| Filtres | « Statut : Tous ▾ » (flex 1, 44, r12) + « Filtres » (44) |
| Recherche | 44, r12 ; active : anneau #8b5cf6, texte 16 #17151d (PRG-04 « marathon ») |
| Carte programme mobile | r20, padding 16, gap 10 ; mêmes infos que desktop |
| Modèles (PRG-06) | chips source 36 (actif noir) ; cartes modèle r20 padding 16 |
| Sans résultat (PRG-04) | carte r22 padding 36 24 ; icône 52 ; « Aucun programme trouvé » 19/700 ; bouton « Effacer la recherche et les filtres » 44 |
| FAB | 60 × 60 r18 noir, right 14 bottom 28 (pas sur l'onglet Modèles) |

## Interactions
Voir `FEATURE_TRACEABILITY_MATRIX.md` (PRG-F01 à PRG-F12).
