# Règles responsive

## Desktop (maquettes à 1280 px)
| Largeur | Règle |
|---|---|
| 1024–1279 | sidebar conservée (236) ; les grilles 2 colonnes des formulaires passent à 1 colonne sous 1100 px ; C-RECAP passe en 2 lignes (TO-VERIFY) |
| **1280** | référence pixel perfect |
| 1440 | même composition ; la colonne de contenu s’élargit |
| 1920 / 2560 / 3440 | **contenu plafonné** : `main` garde sa largeur fluide mais les zones de lecture ont une largeur max — formulaires (06, 08, 10, 11, 12) `max-width:1120px` ; Inviter (09) card `560px` centrée ; Assistant (02) colonne de conversation `max-width:720px` centrée ; listes (01, 03, 05, 07) pleine largeur avec colonnes de liste `minmax` ; Comptabilité (04) grille `max-width:1600px` (valeurs de plafond = PROPOSED, non dessinées) |
| Ultrawide | les cards **ne s’étirent pas** au-delà des plafonds ci-dessus ; le surplus reste en fond `#f3f2f7` à droite (alignement à gauche, comme la sidebar) |

## Mobile
| Largeur | Règle |
|---|---|
| 320–359 (compact) | marges 12 ; pilules passent à la ligne ; C-RECAP empilé |
| **390** | référence |
| 414–430 (grand) | mêmes composants, largeur fluide |
| Clavier ouvert | barre fixe et zone de saisie collées au clavier (`visualViewport`), contenu défilable au-dessus |
| Safe areas | `env(safe-area-inset-top/bottom)` ajoutés aux en-têtes, FAB, barres fixes |
| Bascule desktop ↔ mobile | < 768 px = shell mobile (TO-VERIFY breakpoint existant) |
