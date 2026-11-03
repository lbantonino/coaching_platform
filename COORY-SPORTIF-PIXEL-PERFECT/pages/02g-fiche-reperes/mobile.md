# 2g — Mobile (référence 390 px)

![mobile](screenshots/mobile.png)

Coque commune : voir [../../shared-components/navigation.md](../../shared-components/navigation.md) (sidebar, header, barre mobile)

## Ordre exact des sections
1. Barre supérieure + carte identité + sélecteur d’onglet (« Repères n / 10 »).
2. Cartes repère empilées et aérées (`padding:20px 18px`), « Changer » dans la carte ; Évolution : titre puis les deux menus sur une ligne pleine largeur ; accordéons ; formulaires une colonne ; records empilés.

## Règles
- Contenu : `padding:16px 14px 28px`, `gap:12px`, cartes pleine largeur.
- Inputs `16px`, cibles ≥ 40 px, aucun scroll horizontal.
- Prévoir `env(safe-area-inset-bottom)` (non dessiné).
