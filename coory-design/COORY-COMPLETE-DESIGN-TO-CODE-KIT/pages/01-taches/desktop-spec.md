# 01 · Tâches — spécification desktop (1280 px)

![desktop](screenshots/desktop-original.png)

## Architecture desktop (haut → bas, gauche → droite)
1. **Shell** (SH-01 entrée « Tâches » active, SH-02 titre « Tâches » + icône liste) ; action de page **« + Nouvelle tâche »** (fond `#17151d`) après la cloche.
2. **Card principale** `flex:1; min-height:640px; border-radius:20px; display:flex; overflow:hidden`
   - **Colonne gauche** `width:270px; padding:18px 14px; background:#fbfafd; border-right:1px solid rgba(22,18,40,.06); gap:18px`
     - Grille 2×2 `gap:8px` de **listes intelligentes** (boutons `aria-pressed`) : Aujourd’hui (icône calendrier violette), À venir (horloge noire), Toutes (sélectionnée : contour violet 1.5 px + fond `#f5f2fe`), Terminées (coche grise). Chaque tuile : icône ronde 22–24 px en haut à gauche, compteur `700` en haut à droite, libellé en bas.
     - « MES LISTES » (`600 12px; letter-spacing:.04em; #8b8996`) puis lignes de listes : pastille ronde colorée 24 px avec icône liste blanche, nom, compteur à droite.
     - En bas : lien **« + Nouvelle liste »** (`#6a3ee0`) → ligne de saisie inline « Nom de la liste » (Entrée valide, Échap annule), couleur suivante attribuée automatiquement.
   - **Colonne droite** `flex:1`
     - En-tête `padding:24px 24px 16px` : titre de la vue `700 26px/1.1; -.025em` (couleur de la liste si liste perso) + compteur « 9 tâches » à droite.
     - Lignes de tâches `padding:14px 24px; gap:16px; border-top:1px solid rgba(22,18,40,.06)`, hover `#faf9fc` : rond à cocher 22 px · titre `500 15px` + ligne meta (avatar initiales du sportif 18 px + nom · pastille de liste + nom) · badge priorité « Haute » (`#fff3d6`/`#9a5b0a`) · échéance à droite (« Aujourd’hui » en violet, sinon « Lun 9 » gris).
     - Dernière ligne : **ajout rapide** « Nouvelle tâche » (input inline, fond `#faf8ff` quand actif).
Mesures exactes : `layout-measurements.md` § « Tâches desktop ».

> Valeurs non citées ici : voir `layout-measurements.md` (exactes). Shell : `../../global-shell/`.
