# 01 — Responsive

- **≥ 768 px** : fenêtre centrée, largeur 460px, `max-width: calc(100vw - 48px)`, `max-height: min(720px, 100vh - 48px)`. La largeur ne grandit pas sur grand écran (1280 → 3440 px : identique).
- **< 768 px** : bottom sheet pleine largeur, `max-height: calc(100% - 44px)`, coins hauts 28 px, padding bas + `env(safe-area-inset-bottom)` ⚠️.
- Contenu long : la liste défile, l’en-tête reste visible.
- ⚠️ Clavier virtuel ouvert : la feuille remonte (`visualViewport`), le pied reste au-dessus du clavier.
