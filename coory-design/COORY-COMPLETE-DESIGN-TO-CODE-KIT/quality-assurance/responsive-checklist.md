# Checklist responsive

> Validation globale H, 05/11/2026 (D-135) : 16 écrans x 9 largeurs, mode sombre ; captures 320, 390, 1280 et 3440.

| Largeur | À vérifier | Résultat |
|---|---|---|
| 1024 | pas de débordement horizontal | ✅ aucun débordement, aucun élément hors écran |
| 1280 | pixel perfect | ✅ superpositions faites à la livraison de chaque page (D-119 à D-132) |
| 1440 | proportions conservées | ✅ |
| 1920 | plafonds de largeur respectés | ✅ règle de `design-system/responsive.md` : formulaires 1 120 px à gauche, Inviter centré, Assistant 720 px, Comptabilité 1 600 px, listes pleine largeur |
| 2560 | idem, pas d'étirement | ✅ idem ; plafonds des listes validés par Antonino (D-136) : Tâches 1 370 px (liste 1 100), Notifications 1 400 px, fil des Messages et saisie centrés sur 860 px |
| 3440 | idem | ✅ idem |
| 320 | mobile compact : pas de chevauchement | ✅ aucun chevauchement ; le titre « Assistant IA » est coupé (« A… ») dans la barre du haut |
| 390 | pixel perfect mobile | ✅ superpositions faites à la livraison de chaque page |
| 430 | grand mobile | ✅ aucun débordement |
| Clavier ouvert | barre fixe / saisie au-dessus du clavier | ⏳ à vérifier sur le vrai iPhone (séance iPhone en suspens) ; pas de `interactive-widget=resizes-content` dans la page |
| Safe areas | iPhone avec encoche et barre d'accueil | ⏳ le code utilise `env(safe-area-inset-*)` à 17 endroits, mais la page ne déclare pas `viewport-fit=cover` : ces valeurs valent 0 sur iPhone. Validé par Antonino (D-136) : à ajouter et essayer pendant la séance sur son vrai iPhone |
