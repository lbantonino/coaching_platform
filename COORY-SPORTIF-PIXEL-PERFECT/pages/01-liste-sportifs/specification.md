# 1a / 1b — Liste des sportifs

## A. Identification
| | |
|---|---|
| Fiche | 1a / 1b |
| Nom | Liste des sportifs |
| Objectif | Voir, filtrer, trier et agir sur tous les sportifs du coach. |
| Utilisateur | Coach |
| Route existante | `/coach/sportifs` (supposée) — **À vérifier par Claude Code** |
| Captures | [desktop.png](screenshots/desktop.png) (1280 px, 2×) · [mobile.png](screenshots/mobile.png) (390 px, 2×) |
| Valeurs exactes | [source-extract.md](source-extract.md) |
| Relations | Ligne → 2a. « Nouveau sportif » → création (page existante). |

## B. Architecture (haut → bas, gauche → droite)
1. **Coque** : sidebar (Sportifs actif) + header global (icône + titre « Sportifs », recherche globale, Assistant IA, cloche, **+ Nouveau sportif**).
2. **Carte liste** (`#fff`, r20) contenant :
   - **Barre d’outils** : 2 menus déroulants « Statut » et « Programme » (bouton à deux lignes : libellé `#64626e` + valeur forte, chevron) à gauche ; champ « Rechercher un sportif » (loupe) aligné à droite.
   - **Barre de sélection** (visible quand ≥ 1 ligne cochée) : « n sélectionné(s) » + Changer le statut · Changer le programme · Inviter · Annuler.
   - **En-tête de tableau** : case « tout sélectionner » · Sportif ↑ · Statut ↕ · Programme ↕ · Objectif ↕ · Actions (aligné à droite).
   - **Lignes** : case · avatar initiales (fond pastel) · nom (ellipse) + symbole ♀/♂ coloré · niveau en dessous · statut (point + libellé) · programme (point discipline + libellé, ou bouton pointillé « Choisir ») · objectif (date en fort + nom en dessous, ou « Sans date », ou « Aucun objectif » atténué) · actions (« Inviter » contour / « ✉ Invité » / bouton message carré) + « ··· ».
   - **Pied** : « 18 sportifs affichés » à gauche, « Trié par nom, croissant » à droite.
   - **État vide** : « Aucun sportif trouvé » + « Essaie un autre filtre ou une autre recherche. »

## E. Contenu exact (libellés de la maquette)
Statut · Tous (18) · Programme · Tous · Rechercher un sportif · Sportif · Statut · Programme · Objectif · Actions · Actif · En pause · Archivé · Musculation · Running · Hyrox · Hybride · Choisir · Sans date · Aucun objectif · Fiche à compléter · Inviter · Invité · Changer le statut · Changer le programme · Annuler · Tout sélectionner · 18 sportifs affichés · Trié par nom, croissant · Aucun sportif trouvé · Essaie un autre filtre ou une autre recherche. · Nouveau sportif · Programme à choisir (mobile).

> Les noms, dates, valeurs et compteurs sont des **données de démo** : utiliser les données réelles.
