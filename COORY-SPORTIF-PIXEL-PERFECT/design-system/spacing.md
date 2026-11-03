# Espacements, rayons, dimensions

## Échelle d’espacement (valeurs réellement utilisées, par fréquence)
`2 · 4 · 6 · 7 · 8 · 10 · 12 · 14 · 16 · 18 · 20 · 22 · 24 · 28` px. Toujours via `gap` (flex/grid), jamais via marges entre frères.

| Contexte | Valeur exacte |
|---|---|
| Cadre desktop : padding / gap sidebar↔main | `14px` / `20px` |
| Pile verticale de `main` | `gap:16px` |
| Pile verticale de la fiche (en-tête, onglets, contenu) | `gap:14px` (fiche) · `16px` (sections d’un onglet) |
| Padding carte standard | `22px` (titre + contenu, `gap:16px`) |
| Padding en-tête de fiche | `20px 22px` |
| Padding header global | `16px 18px 16px 22px` |
| Padding sidebar | `24px 14px 16px`, items `gap:2px` |
| Contenu mobile | `padding:16px 14px 28px`, `gap:12px` |
| Ligne de tableau (1a) | `padding:10px 24px`, `min-height:68px`, colonnes `gap:16px` |
| Grille 2 colonnes de cartes | `gap:16px` (desktop) |

## Rayons
| Élément | Rayon |
|---|---|
| Cadre mobile (planche) | 36 |
| Cartes principales, sidebar, header | 20 |
| Cartes internes / blocs | 14–16 |
| Barre d’onglets, menus déroulants | 14 |
| Champs, segmentés, boutons 46 | 12 |
| Boutons 38–40, onglet | 10 |
| Items de menu, boutons 32 du header | 9 |
| Pastilles/badges (h24) | 12 (= pilule) |
| Avatars, ronds de numérotation | 50% |

## Hauteurs de contrôles
| Contrôle | Hauteur |
|---|---|
| Item de menu latéral | 34 |
| Boutons du header (recherche, IA, cloche, Créer, ···) | 32 |
| Bouton standard de carte (Modifier, Atteint…) | 34–38 |
| Bouton principal de formulaire | 40–46 |
| Champ texte / select | 46 |
| Onglet de fiche | 38 |
| Option de segmenté | 32–36 |
| Option de menu déroulant | ≥ 40 |
| Boutons du top bar mobile | 44 (hamburger) · 40 (IA, cloche, +) |
| Badge | 24 |
