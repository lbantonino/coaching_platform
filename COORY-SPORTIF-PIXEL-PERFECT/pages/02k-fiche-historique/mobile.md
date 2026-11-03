# 2k — Mobile (référence 390 px)

![mobile](screenshots/mobile.png)

Coque commune : voir [../../shared-components/navigation.md](../../shared-components/navigation.md) (sidebar, header, barre mobile)

## Ordre exact des sections
1. Barre supérieure + carte identité + sélecteur d’onglet (« Historique n / 10 »).
2. Bouton « Voir tout l’historique » **sous** le titre/sous-titre ; timeline identique.

## Règles
- Contenu : `padding:16px 14px 28px`, `gap:12px`, cartes pleine largeur.
- Inputs `16px`, cibles ≥ 40 px, aucun scroll horizontal.
- Prévoir `env(safe-area-inset-bottom)` (non dessiné).
