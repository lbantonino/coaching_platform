# Composants partagés (spécification exacte)

Tous les contours sont des `box-shadow: inset 0 0 0 1px …` (pas de `border`) pour ne pas modifier les dimensions.

## Boutons
| Variante | Style exact |
|---|---|
| Principal (noir) | fond `#17151d`, texte `#fff`, `500 13.5px`, h38–40, `padding:0 14px`, rayon 10, icône 13–14 + `gap:7px`. Ex. « Enregistrer », « Changer la photo », « Ajouter la mesure » |
| Principal header | idem en h32, rayon 9, `500 12.5px` (« Créer », « Nouveau sportif ») |
| IA (violet) | fond `#8b5cf6`, texte blanc, h32, `padding:0 12px`, rayon 9, icône étincelle 13 pleine blanche |
| Contour | fond `#fff`, `inset 0 0 0 1px rgba(22,18,40,.14)`, texte `#17151d`, h34–40, rayon 10 (« Modifier », « Écrire », « Retirer », « Atteint ») |
| Texte | sans fond, `500 13.5px`, `#4a4855` (neutre) ou `#6a3ee0` (lien : « Voir tout », « Agenda », « Rendre principal ») |
| Icône carrée | 32×32 (header) / 40×40 (mobile), rayon 9/12, contour .12 ou fond blanc |
| Désactivé | non dessiné → **à définir** (proposition : opacité .45, `cursor:not-allowed`) |

## Champs
- Input / select fermé : h46, rayon 12, fond `#fff`, `inset 0 0 0 1px rgba(22,18,40,.12)`, `padding:0 14px`, `400 15px` (16px mobile), placeholder `#8b8996`. Chevron 15 `#8b8996` à droite pour les selects.
- Textarea : même style, `min-height:96px`, `padding:12px 14px`, `resize:vertical`.
- Libellé au-dessus : `500 13.5px`, `gap:8px` avec le champ. Aide sous le champ : `400 12.5px/1.45 #64626e`.
- Focus : non dessiné explicitement → proposition : anneau `inset 0 0 0 1.5px rgba(139,92,246,.55)`.

## Contrôle segmenté
Piste `#efeef4`, rayon 12, `padding:4px` ; options h32–36, rayon 9, `padding:0 12–14px`, `500 13–13.5px` ; active : fond `#fff`, texte `#17151d`, ombre `0 1px 3px rgba(22,18,40,.10)` ; inactive : transparent, `#64626e`. Ex. Source (Test / Constaté / Estimation coach), Statut (Actif / En pause / Archivé), Semaine / Toutes les semaines.

## Cases à cocher « puce » (choix multiples)
Pastilles contour avec préfixe « ✓ » quand sélectionnées (Lieux d’entraînement, Jours disponibles). Voir `source-extract.md` de 2b et 2h pour les valeurs exactes.

## Menu déroulant (dropdown)
- Déclencheur : bouton contour (h32–38) + libellé + chevron 14 qui pivote de 180° à l’ouverture (`transition: transform .2s`).
- Liste : `position:absolute; top:calc(100% + 6px)`, `z-index:20`, fond blanc, rayon 14, `padding:6px`, ombre `0 16px 36px rgba(22,18,40,.16),0 0 0 1px rgba(22,18,40,.08)`, `max-width:min(340px, 100vw - 48px)`.
- En-têtes de groupe : `600 11px`, `.07em`, MAJUSCULES, `#8b8996`.
- Option : h≥40, rayon 10, `500 13.5px` ; valeur à droite `400 12.5px #64626e` ; coche « ✓ » `#6a3ee0` ; sélectionnée : fond `rgba(139,92,246,.08)` ; hover `#f6f5fa`.
- 1a (filtres Statut/Programme) : liste en `top:58px` (desktop) / `66px` (mobile), ombre `0 14px 34px rgba(22,18,40,.16),0 0 0 1px rgba(22,18,40,.06)`, option avec compteur à droite.
- `role="listbox"`, options `role="option"` + `aria-selected`, déclencheur `aria-haspopup="listbox"` + `aria-expanded`.

## Onglets de la fiche
Desktop : piste `#e8e7ee`, rayon 14, `padding:4px`, `gap:2px`, `overflow-x:auto` (barre masquée). Onglet : `flex:1 0 auto`, h38, `padding:0 14px`, rayon 10, `500 13.5px`, nowrap. Actif : fond `#fff`, `#17151d`, ombre `0 1px 3px rgba(22,18,40,.10)`. Inactif : `#64626e`.
Mobile : remplacé par un **sélecteur déroulant** (carte blanche affichant l’onglet courant + compteur « n / 10 » + chevron ; liste avec l’option active en `rgba(139,92,246,.10)` / `#6a3ee0`).

## Cartes
- Carte standard : `<section>` fond `#fff`, rayon 20, `inset 0 0 0 1px rgba(22,18,40,.05)`, padding 22, colonne `gap:16px`. En-tête : titre (`600 17px`) + sous-titre (`400 13.5px/1.5 #64626e`) à gauche, action (bouton contour « Modifier » h34 ou lien violet) à droite, `align-items:flex-start; justify-content:space-between`.
- Sous-carte : fond `#f8f7fb`, rayon 14–16, padding 16–18.
- Carte repère (2a, 2g) : sous-carte + pastille icône 40×40 rayon 12 teintée de la couleur de discipline + valeur en couleur.
- Carte « objectif principal » (2f) : fond `#fdf0d2`, anneau `rgba(214,150,30,.28)`.

## Badges
h24, `padding:0 9px`, rayon 12, `500 12px`, `gap:6px`, point 7×7 optionnel. Neutre : `#f3f2f7`/`#4a4855` · Violet : `rgba(139,92,246,.10)`/`#6a3ee0` (Principal, J-137, Semaine actuelle).

## Avatars
Sportif : rond, 32–40 (listes), 60 (en-tête fiche), 64 (photo de profil) ; fond pastel (cf. colors.md) ; initiales `600` `#2a2733`. Coach : 38, `#2a2733`, texte blanc, anneau violet, pastille en ligne 10×10 `#15803d` + contour blanc 2px.

## Graphique d’évolution (2g)
Zone 160 px de haut, grille horizontale 4 intervalles (`repeating-linear-gradient` `rgba(22,18,40,.07)`), axe Y 36 px de large, courbe 2 px couleur de discipline (`vector-effect:non-scaling-stroke`), aire sous la courbe teinte .08–.16, points 9×9 blancs cerclés 2 px. Axe inversé pour les allures (plus haut = plus rapide).

## Chargement / vide
Non dessinés (hors « Aucun sportif trouvé » en 1a). Voir `interactions.md` de chaque page.
