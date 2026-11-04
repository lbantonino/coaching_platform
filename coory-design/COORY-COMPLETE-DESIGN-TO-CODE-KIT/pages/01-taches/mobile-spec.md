# 01 · Tâches — spécification mobile (390 px)

![mobile-original-listes.png](screenshots/mobile-original-listes.png)
![mobile-original-liste-ouverte.png](screenshots/mobile-original-liste-ouverte.png)

## Architecture mobile — 2 écrans
**1b · Accueil des listes**
1. SH-05 (☰ · « Tâches » · ✦ 🔔).
2. Zone défilante `padding:18px 14px 110px; gap:22px` :
   - Grille 2×2 `gap:10px` des listes intelligentes (tuiles plus hautes).
   - Titre « Mes listes » `700 20px; -.02em` + card `border-radius:18px` regroupant les listes (lignes `min-height:56px`, pastille 30 px) + ligne « Nouvelle liste ».
3. **FAB « + »** (SH-08) → crée une tâche dans la liste par défaut (handler `fabHome`).

**1c · Liste ouverte**
1. En-tête : lien retour **« ‹ Listes »** `min-height:44px; font:500 16px; color:#6a3ee0` (→ 1b).
2. Titre de la liste `700 28px/1.1` + compteur.
3. **Onglets de listes défilants horizontalement** (`role=tablist`, `gap:6px`, débordement `margin:0 -14px`) pour passer d’une liste à l’autre sans revenir.
4. Card `border-radius:20px 20px 0 0` qui remplit le bas de l’écran : lignes de tâches + ligne « Nouvelle tâche ».
5. Bouton « Nouvelle tâche » (handler `tapM`).

> Barre d’état « 9:41 » éventuelle = présentation, ne pas implémenter. En-tête : appliquer `../../global-shell/mobile-layout.md` et `contextual-navigation.md`.
