# Typographie

**Police : Plus Jakarta Sans** (Google Fonts, graisses 400/500/600/700). Secours : `system-ui, sans-serif`. Toute la maquette utilise cette seule famille.
> À vérifier par Claude Code : si l’app charge déjà une autre police, ne pas la remplacer sans accord — signaler l’écart.

Notation `graisse taille/interligne` exacte (raccourci CSS `font:`). Interligne non précisé = `normal`.

| Rôle | Style exact | Couleur | Notes |
|---|---|---|---|
| Nom du sportif (en-tête fiche, desktop) | `600 26px/1.15`, letter-spacing `-.025em` | `#17151d` | nowrap |
| Titre de séance (2d) | `600 26px/1.2`, `-.02em` | `#17151d` | |
| Titre de carte | `600 17px`, `-.01em` | `#17151d` | nowrap |
| Titre de sous-carte / bloc | `600 15–16px` | `#17151d` | |
| Valeur repère (grand chiffre) | `700 24–26px/1.1`, `-.02em` | couleur de discipline | nowrap ; unité `600 13.5px` même couleur |
| Corps / valeurs de champ | `400 15px` | `#17151d` | inputs : 15px desktop, **16px mobile** (évite le zoom iOS) |
| Sous-titre de carte | `400 13.5px/1.5` | `#64626e` | `text-wrap:pretty` |
| Libellé de champ | `500 13.5px` | `#17151d` | « (facultatif) » en `400` `#8b8996` |
| Onglet / bouton / item de menu | `500 13.5px` (onglets, boutons) · `400 13.5px` (menu latéral) | voir composants | |
| Métadonnée | `400 12.5px/1.45` | `#64626e` | |
| Badge / pastille | `500 12px` | selon statut | hauteur 24 |
| En-tête de tableau | `500 12.5px` | `#64626e` | |
| Sur-titre / groupe | `600 11–11.5px`, letter-spacing `.07–.08em`, MAJUSCULES | `#8b8996` ou `#4f4ed6` (2d) | |
| Compteur badge | `500 11px/20px` | `#6a3ee0` | |
| Axe de graphique | `400 11–11.5px` | `#8b8996` | |

Chiffres tabulaires (`font-variant-numeric: tabular-nums`) sur les heures et compteurs alignés.
Troncature : noms longs en liste → `white-space:nowrap; overflow:hidden; text-overflow:ellipsis` (cf. « Antoine Ma… » en 1a à 1280 px).
