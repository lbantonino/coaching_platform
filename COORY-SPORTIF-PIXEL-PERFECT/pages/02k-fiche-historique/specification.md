# 2k — Fiche sportif · Historique

## A. Identification
| | |
|---|---|
| Fiche | 2k |
| Nom | Fiche sportif · Historique |
| Objectif | Journal de la fiche. |
| Utilisateur | Coach |
| Route existante | `?onglet=historique` (supposée) — **À vérifier par Claude Code** |
| Captures | [desktop.png](screenshots/desktop.png) (1280 px, 2×) · [mobile.png](screenshots/mobile.png) (390 px, 2×) |
| Valeurs exactes | [source-extract.md](source-extract.md) |
| Relations | Depuis 2a « Voir tout ». |

## B. Architecture (haut → bas, gauche → droite)
1. Coque + en-tête de fiche + onglets (onglet courant actif).
2. Carte unique pleine largeur (pleine hauteur en desktop) : « Historique » + « Tout ce qui s’est passé sur cette fiche, du plus récent au plus ancien. » (bloc `flex:1 1 280px`) ; bouton **« Voir tout l’historique (16) ⌄ » / « Réduire ⌃ »** (contour h34) ; timeline : rond 32 `#f3f2f7` + icône 15, trait 1 px `#e6e4ec`, titre `600 14px/1.4`, date `400 12.5px #8b8996` à droite, détail `400 13px/1.45 #64626e`. **6 éléments par défaut.**

## E. Contenu exact (libellés de la maquette)
Historique · Voir tout l’historique (n) · Réduire · Performance ajoutée · Mesure ajoutée · …

> Les noms, dates, valeurs et compteurs sont des **données de démo** : utiliser les données réelles.
