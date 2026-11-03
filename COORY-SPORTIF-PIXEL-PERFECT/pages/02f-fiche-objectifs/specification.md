# 2f — Fiche sportif · Objectifs

## A. Identification
| | |
|---|---|
| Fiche | 2f |
| Nom | Fiche sportif · Objectifs |
| Objectif | Gérer les objectifs et compétitions. |
| Utilisateur | Coach |
| Route existante | `?onglet=objectifs` (supposée) — **À vérifier par Claude Code** |
| Captures | [desktop.png](screenshots/desktop.png) (1280 px, 2×) · [mobile.png](screenshots/mobile.png) (390 px, 2×) |
| Valeurs exactes | [source-extract.md](source-extract.md) |
| Relations | Depuis 2a « Objectif actuel ». |

## B. Architecture (haut → bas, gauche → droite)
1. Coque + en-tête de fiche + onglets (onglet courant actif).
2. **Carte « Objectifs et compétitions »** + « Ce que le sportif prépare. Un seul objectif principal à la fois ; un objectif atteint ou abandonné reste dans l’historique. »
   - **Objectif principal** : carte **jaune** `#fdf0d2` + anneau `inset 0 0 0 1px rgba(214,150,30,.28)`, r16, p18, gap10 ; badges blancs (● Hyrox, Compétition) + « Principal » violet ; « J-137 » violet à droite ; « Hyrox Bruxelles » `600 18px` `-.015em` ; « Catégorie Pro · Bruxelles · 20 mars 2027 · Temps visé 1:15:00 » `400 13px #5c5340` ; description `400 14px #4a4855` ; actions : Modifier + Atteint (contour, fond blanc, h38) · Abandonné (texte) · poubelle 38×38 `#6b5f45` à droite.
   - **Objectif secondaire** : blanc, anneau .10 ; badges gris ; J-39 ; « Hyrox Gent » ; actions + « Rendre principal » `#6a3ee0`.
   - Accordéon « Objectifs passés (1) ».
3. **Carte « Ajouter un objectif »** : Type d’objectif (« Choisir… ») · Date cible (facultatif, jj/mm/aaaa) · Temps visé (facultatif, « Ex. : 1:15:00 ») · Priorité (segmenté Principal/Secondaire) + aide · case « C’est une compétition » · Description (facultatif) · « Ajouter l’objectif ».

## E. Contenu exact (libellés de la maquette)
Objectifs et compétitions · Principal · Secondaire · Compétition · J-137 · Modifier · Atteint · Abandonné · Rendre principal · Objectifs passés (1) · Ajouter un objectif · Type d’objectif · Choisir… · Date cible · Temps visé · Priorité · Choisir « Principal » fait passer l’objectif principal actuel en secondaire. · C’est une compétition · Description · Ajouter l’objectif.

> Les noms, dates, valeurs et compteurs sont des **données de démo** : utiliser les données réelles.
