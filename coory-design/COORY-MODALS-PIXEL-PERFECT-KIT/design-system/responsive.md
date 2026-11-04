# Responsive

- Point de bascule : **768 px**. Au-dessus : fenêtre centrée (ou menu ancré). En dessous : bottom sheet.
- Largeurs fixes desktop : menu 460, formulaire 600, confirmation 460, aperçu 980, paramètres 1000, menus ancrés 280 (16) / 320 (32). Toujours `max-width: calc(100vw - 48px)`.
- Hauteur max desktop : min(720 px, 100vh − 48 px) ; panneaux 700 px.
- Les boîtes ne s’élargissent jamais sur grand écran (testé conceptuellement 1280 → 3440).
- Mobile : 360–430 px, max-height calc(100% − 44 px), safe-area en bas ⚠️.
