# 2g — Fiche sportif · Repères

## A. Identification
| | |
|---|---|
| Fiche | 2g |
| Nom | Fiche sportif · Repères |
| Objectif | Suivre allures, charges, records et leur évolution. |
| Utilisateur | Coach |
| Route existante | `?onglet=reperes` (supposée) — **À vérifier par Claude Code** |
| Captures | [desktop.png](screenshots/desktop.png) (1280 px, 2×) · [mobile.png](screenshots/mobile.png) (390 px, 2×) |
| Valeurs exactes | [source-extract.md](source-extract.md) |
| Relations | Depuis 2a « Repères et mesures ». |

## B. Architecture (haut → bas, gauche → droite)
1. Coque + en-tête de fiche + onglets (onglet courant actif).
2. **Carte « Allures et repères »** (+ « Valeurs propres à ce sportif, datées. Une nouvelle mesure ne remplace pas l’ancienne : l’historique est conservé. ») :
   - **Deux cartes de repère interchangeables** (grille `auto-fit minmax(min(100%,260px),1fr)`, gap 12) : ligne haute = pastille icône 40 r12 teintée + catégorie « RUNNING » / « MUSCULATION » (`600 11px` `.07em` `#8b8996`) + bouton **« Changer ⌄ »** ; nom du repère `500 13.5px #4a4855` ; valeur `700 26px/1.1` couleur + unité ; détail `400 12.5px/1.5` ; lien « Voir l’évolution ↓ » / « Affiché dans le graphique » `500 13px #6a3ee0`. Carte affichée dans le graphique : anneau 1.5 px de sa couleur.
   - « ⇄ Inverser les deux cartes » centré.
   - **Évolution** (contour .08, r16, p18) : titre + **menu repère** (point + nom tronqué + chevron) + **menu période** (1 semaine · 4 semaines · 1 mois · 6 mois · 1 an) ; ligne de progression (nowrap) + valeur actuelle colorée `700 16px` ; graphique 160 px (axe Y 36 px, 5 graduations, `margin-top:10px`) ; 3 dates X ; note sur l’axe.
   - Accordéons : Voir les valeurs en tableau · Historique et corrections (4 mesures) · Calculer les allures depuis un test (Cooper ou 5 km).
   - **Ajouter une mesure** : Type de repère · Allure (min/km) « 4:55 ou 6:40-7:15 » + aide · Date de la mesure · Source (Test/Constaté/Estimation coach) · Note privée du coach (facultatif) · « Ajouter la mesure ».
3. **Records personnels** : sous-cartes (5 km 23:15 · Hyrox Open 1:21:30), accordéon « Toutes les performances (3) », **Ajouter une performance** (Épreuve · Temps « mm:ss ou h:mm:ss, temps officiel ou chrono final. » · Date · Course (facultatif) · « Ajouter la performance »).

## E. Contenu exact (libellés de la maquette)
Repères running : Endurance (zone 2), Tempo, Seuil, Allure 5 km, Allure 10 km, Allure semi-marathon, Allure marathon, Race pace (Hyrox), FC max, FC repos. Charges : Wall ball, Back squat, Soulevé de terre (exemples). Groupes du menu : ALLURES ET REPÈRES RUNNING · CHARGES DE RÉFÉRENCE. Autres libellés : voir specification B.

> Les noms, dates, valeurs et compteurs sont des **données de démo** : utiliser les données réelles.
