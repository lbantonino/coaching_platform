# Responsive

Viewports dessinés : **desktop 1280** et **mobile 390** (EXACT). Tablette : **non dessinée**. Breakpoints : PROPOSED.

| Plage | Layout |
|---|---|
| ≥ 1200 | Desktop dessiné. Au-delà de 1280 : contenu fluide (colonnes `1fr`), sidebar 236 fixe, panneaux 304 / 340 fixes ; max-width conseillée du contenu 1600 [P]. |
| 768 – 1199 | [P] sidebar repliée (hamburger comme mobile), header desktop conservé ; éditeur 03 : semaines en select en haut + grille 1fr / 304 ; éditeurs de séance : panneau en feuille latérale. |
| < 768 | Mobile dessiné : pile de navigation, FAB, feuilles du bas, barres d'action fixes. |

## Transformations desktop → mobile (EXACT, dessinées)
| Écran | Desktop | Mobile |
|---|---|---|
| 01 | onglets dans le header ; filtres en ligne ; grille 3 colonnes | onglets segmentés sous le header ; « Statut ▾ » + « Filtres » ; liste 1 colonne ; FAB |
| 02 | colonne d'étapes 250 + contenu | barre de progression 4 segments + contenu en carte + barre Retour/Continuer fixe en bas |
| 03 | 3 colonnes (semaines / semaine / séance) | 3 écrans empilés : Semaines → Semaine → Séance, retour « ← Précédent » |
| 03b | bandeau 7 cases + panneau jour à droite ; proposition en modale | mini-bandeau 7 colonnes ; proposition et choix du jour en feuilles du bas |
| 04–06 | liste + panneau droit 340 | liste ; panneau en feuille du bas (max 760, défilable) ; FAB |
| 07 / 2c | cartes en rangée (2c : 5 colonnes), détail sous la rangée | cartes empilées pleine largeur, détail déplié dans la carte |
| 08 | modale 480 centrée | feuille du bas, boutons empilés 48 |
| 09 | lecteur PDF | lecteur PDF téléphone (page à 0,587×) |

Règles : boutons tactiles ≥ 44 px ; inputs 16 px ; aucun défilement horizontal ; textes de séance une info par ligne ; feuilles du bas au-dessus d'un voile .34.
