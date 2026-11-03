# 2e — Fiche sportif · Programme

## A. Identification
| | |
|---|---|
| Fiche | 2e |
| Nom | Fiche sportif · Programme |
| Objectif | Résumé du programme attribué. |
| Utilisateur | Coach |
| Route existante | `?onglet=programme` (supposée) — **À vérifier par Claude Code** |
| Captures | [desktop.png](screenshots/desktop.png) (1280 px, 2×) · [mobile.png](screenshots/mobile.png) (390 px, 2×) |
| Valeurs exactes | [source-extract.md](source-extract.md) |
| Relations | « Voir le programme semaine par semaine » → page Programmes existante. |

## B. Architecture (haut → bas, gauche → droite)
1. Coque + en-tête de fiche + onglets (onglet courant actif).
2. **Carte programme** : « Prépa Hyrox Bruxelles · bloc 1 » + « Objectif : Hyrox Bruxelles · Pro » ; 4 valeurs (Période 26 oct. → 17 janv. · Durée 12 semaines · Séances 60 · Version Publiée n° 1) ; bouton « Voir le programme semaine par semaine ».
> Le reste de l’onglet n’a **pas** été redessiné : conserver l’existant sous cette carte.

## E. Contenu exact (libellés de la maquette)
Objectif : … · Période · Durée · Séances · Version · Publiée n° 1 · Voir le programme semaine par semaine.

> Les noms, dates, valeurs et compteurs sont des **données de démo** : utiliser les données réelles.
