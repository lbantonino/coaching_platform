# Cards

| ID | Usage | Valeurs |
|---|---|---|
| C-BASE | card de contenu desktop | `border-radius:20px; background:#fff; box-shadow:inset 0 0 0 1px rgba(22,18,40,.05)` |
| C-FORM | card formulaire à sections | C-BASE sans padding ; chaque section `padding:22px 24px`, séparée par `border-top:1px solid rgba(22,18,40,.07)` ; titre de section `600 16px` + sous-titre `400 12.5px #64626e` |
| C-RECAP | card récap / aperçu **pleine largeur au-dessus du formulaire** (06, 08, 11, 12) | `padding:18px 22px; display:grid` ; colonnes 06/12 : `220px minmax(0,1fr) 170px` (sportif · récap 5 colonnes séparé par `border-left` · boutons) ; 08/11 : `minmax(0,1fr) minmax(0,1.4fr) 190px 120px` ; libellé « APERÇU » / « SÉANCE … » en `grid-column:1/-1` |
| C-FOOT | card d’action sous le formulaire (06/12) | `padding:16px 22px; display:flex; justify-content:space-between` : avertissement à gauche, « Supprimer la séance » rouge à droite |
| C-SECTION | card numérotée (10) | pastille 26×26 `#f5f2fe` / `#6a3ee0` + titre `600 16px` ; grille interne `1fr 1fr; gap:16px` |
| C-MOBILE | card mobile | `border-radius:22px; padding:18px 16px` |
| C-SETTINGS | card de paramètres (13) | `border-radius:16px; box-shadow:inset 0 0 0 1px rgba(22,18,40,.08); padding:20px` |
| C-LIST | liste à lignes | lignes séparées par `border-top:1px solid rgba(22,18,40,.06)`, `padding:14px 24px`, hover `#faf9fc` |
| C-INFO | bandeau d’info | `padding:12px 14px; border-radius:12px; background:#f5f2fe` + icône violette (variante 08) |
| C-HEALTH | Données de santé (10) | icône bouclier `#11867a` + texte `12.5px/1.5 #64626e` |
