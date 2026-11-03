# 2c — Fiche sportif · Agenda

## A. Identification
| | |
|---|---|
| Fiche | 2c |
| Nom | Fiche sportif · Agenda |
| Objectif | Voir le programme du sportif semaine par semaine. |
| Utilisateur | Coach |
| Route existante | `/coach/sportifs/:id?onglet=agenda` (supposée) — **À vérifier par Claude Code** |
| Captures | [desktop.png](screenshots/desktop.png) (1280 px, 2×) · [mobile.png](screenshots/mobile.png) (390 px, 2×) |
| Valeurs exactes | [source-extract.md](source-extract.md) |
| Relations | Carte de séance → 2d. |

## B. Architecture (haut → bas, gauche → droite)
1. Coque + en-tête + onglets (Agenda actif).
2. **Carte programme** : « Prépa Hyrox Bruxelles · bloc 1 » + « 12 semaines · 26 oct. → 17 janv. · 5 séances par semaine » à gauche ; encadré info violet clair à droite : icône liste + « **Dans l’ordre, au jour choisi.** Inès enchaîne les séances 1 → 5 quand elle veut ; seules celles avec le coach ont une date. »
3. **Barre de vue** : segmenté « Semaine / Toutes les semaines » à gauche ; à droite (vue Semaine) : bouton ‹ · menu « Semaine 2 / 12 ⌄ » · bouton ›.
4. Bandeau (si semaine consultée ≠ actuelle) : « Tu consultes la semaine n. Inès est en semaine 2. » + « Revenir à la semaine 2 ».
5. **Carte semaine** (anneau violet 1.5 px si semaine actuelle) : titre « Semaine 2 » + « 2 nov. – 8 nov. · 2 avec le coach · 3 libres » ; badges « Semaine actuelle » (violet) + phase (« Préparation ») ; rangée de **5 cartes de séance** teintées par discipline : numéro rond coloré, nom, « Discipline · type » (discipline en couleur), et pour les séances avec coach : séparateur + icône personne + « Coach · Aujourd’hui · 07:00 ».
6. Compétition éventuelle : « Compétition · Sam 12 déc. · Hyrox Gent ».

## E. Contenu exact (libellés de la maquette)
Dans l’ordre, au jour choisi. · Semaine · Toutes les semaines · Semaine 2 / 12 · Contour violet : semaine actuelle d’Inès · Tu consultes la semaine n. Inès est en semaine 2. · Revenir à la semaine 2 · Semaine actuelle · Préparation · Allègement · Développement · Spécifique · Coach · Avec le coach · Compétition.

> Les noms, dates, valeurs et compteurs sont des **données de démo** : utiliser les données réelles.
