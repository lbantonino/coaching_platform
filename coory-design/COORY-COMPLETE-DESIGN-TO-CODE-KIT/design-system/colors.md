# Couleurs

> Valeurs **exactes** relevées dans les 13 fichiers sources (nombre d’occurrences entre parenthèses, cf. `_data/tokens-usage.json`). Proposer ces noms de tokens si l’app n’en a pas déjà (TO-VERIFY : réutiliser les tokens existants s’ils ont les mêmes valeurs).

## Neutres
| Token proposé | Valeur | Usage |
|---|---|---|
| `--bg-app` | `#f3f2f7` (86) | fond de l’app, fond des sélecteurs segmentés |
| `--surface` | `#fff` (423) | cards, sidebar, header, feuilles |
| `--surface-sunken` | `#f8f7fb` (98) | fond des champs, recherche, colonnes secondaires |
| `--surface-sunken-2` | `#faf9fc` (10) / `#f1f0f5` | fond de sélecteur segmenté (10, 13), piste |
| `--ink` | `#17151d` (333) | texte principal, boutons principaux, FAB |
| `--ink-2` | `#4a4855` (90) | texte de menu, paragraphes secondaires |
| `--ink-3` | `#64626e` (203) | sous-titres, fil d’Ariane, icônes neutres |
| `--ink-4` | `#8b8996` (128) | placeholders, aides, « facultatif », libellés de section |
| `--line` | `rgba(22,18,40,.12)` (106) | bordure de champ (inset 1 px) |
| `--line-soft` | `rgba(22,18,40,.07)`–`.08` | séparateurs internes |
| `--line-card` | `rgba(22,18,40,.05)` (35) | contour de card (inset 1 px) |
| `--line-strong` | `rgba(22,18,40,.14)` (32) | bouton secondaire, pilule non sélectionnée |
| `--avatar-dark` | `#2a2733` | avatar du coach |
| `--avatar-neutral` | `#ecebf1` | avatar sportif sans couleur |

## Violet (accent COORY)
| Token | Valeur | Usage |
|---|---|---|
| `--violet` | `#8b5cf6` (126) | bouton Assistant IA, interrupteurs actifs, badges pleins, focus |
| `--violet-ink` | `#6a3ee0` (107) | liens, entrée de menu active, icône de titre |
| `--violet-ink-2` | `#5b30d6` | texte des pilules sélectionnées |
| `--violet-soft` | `#ede6ff` (12) | fond de pilule sélectionnée, icône de rubrique active |
| `--violet-softer` | `#f5f2fe` (10) / `#f1edfc` | fond de ligne sélectionnée, bandeaux d’info |
| `--violet-tint` | `rgba(139,92,246,.1)`–`.12` | fond d’entrée active, badge de menu |
| Orbe Assistant | `radial-gradient` `#ffffff → #e9ddff → #a78bfa → #7c3aed → #4c1d95` | avatar de l’assistant (02) |

## Statuts
| Token | Valeur | Usage |
|---|---|---|
| `--success` | `#11867a` · fond `#e3f6f1` | résultat positif, « Compte activé » |
| `--success-2` | `#15803d` | pastille de présence |
| `--warning-ink` | `#9a5b0a` · fond `#fff3d6` | « En attente », « À encaisser », priorité « Haute », dépenses |
| `--warning-2` | `#FEC14F` | série « Dépensé » des graphiques |
| `--danger` | `#c0213d` / `#be123c` | supprimer, résultat négatif |
| `--danger-soft` | `#fdeef1` | fond du bouton « Supprimer » groupé (03) |
| Note jaune (maquettes) | `#fffaf0` / `#8a5a00` | **annotation de maquette, ne pas implémenter** |

## Couleurs de catégories (graphiques, listes, avatars)
`#8b5cf6` violet · `#7776FF` indigo (Bancontact) · `#26CBB8` turquoise (Espèces) · `#FEC14F` jaune · `#f472b6` rose · `#d9d7e2` gris (Autre).
Listes de tâches (01, valeurs exactes de `LISTS`) : Programmes `#7776FF`, Facturation `#FEC14F`, Fiches sportifs `#26CBB8`, Bibliothèque `#DD2D4A`.

## Overlays
| Usage | Valeur |
|---|---|
| Modale desktop (13, 07) | `rgba(23,21,29,.42)` |
| Assistant (02) | `rgba(14,12,22,.48)` + `backdrop-filter:blur(2px)` |
| Menu du FAB (04) | `rgba(22,18,40,.32)` |
