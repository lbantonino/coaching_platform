# Couleurs (valeurs exactes de la source)

## Neutres
| Rôle | Valeur | Usage |
|---|---|---|
| Encre principale | `#17151d` | titres, textes forts, bouton principal (fond), onglet actif (texte) |
| Texte secondaire | `#4a4855` | items de menu, libellés secondaires, icônes |
| Texte atténué | `#64626e` | sous-titres, métadonnées, onglets inactifs |
| Texte discret / placeholder | `#8b8996` | placeholders, mentions « (facultatif) », axes de graphiques, en-têtes de groupes |
| Séparateur de texte « · » | `#c9c7d1` | points de séparation dans les lignes méta |
| Fond d’application | `#f3f2f7` | fond derrière les cartes (cadres desktop et mobile) |
| Carte | `#ffffff` | toutes les cartes principales |
| Sous-surface | `#f8f7fb` | cartes internes, lignes de liste, blocs de séance |
| Sous-surface claire | `#faf9fc` / `#f6f5fa` / `#fbfafd` | en-tête de tableau, hover, survol d’options |
| Piste d’onglets | `#e8e7ee` | fond de la barre d’onglets de la fiche |
| Piste de contrôle segmenté | `#efeef4` | fond des sélecteurs segmentés (Source, Statut, Semaine/Toutes…) |
| Pastille neutre | `#f3f2f7` | badges neutres, fond des icônes de récapitulatif |
| Avatar coach | `#2a2733` | avatar GL (texte blanc) |
| Lignes / bordures | `rgba(22,18,40,.05)` carte · `.06–.07` séparateurs · `.12` champs · `.14` boutons contour · `.16` cadre | toujours en `box-shadow: inset 0 0 0 1px …` (pas de `border`) |

## Accent COORY (violet)
| Rôle | Valeur |
|---|---|
| Violet plein (boutons IA, badges notif, cases cochées, contour logo) | `#8b5cf6` |
| Violet texte (liens, état sélectionné) | `#6a3ee0` |
| Fond item de menu actif | `rgba(139,92,246,.12)` |
| Fond badge/option sélectionnée | `rgba(139,92,246,.10)` / `.08` |
| Anneau de sélection | `rgba(139,92,246,.35)` (1px) · `.55` (1.5px, focus/ouvert) |
| Anneau avatar coach | `0 0 0 2px #fff, 0 0 0 3.5px #8b5cf6` |

## Disciplines (couleurs officielles)
| Discipline | Couleur | Texte sur fond clair | Teinte de fond |
|---|---|---|---|
| Musculation | `#DD2D4A` | `#DD2D4A` / `#b51f39` | `rgba(221,45,74,.08–.10)` |
| HYROX | `#FEC14F` | `#8a6200` (jamais le jaune pur pour du texte) | `rgba(254,193,79,.16–.24)` · carte objectif principal `#fdf0d2` + anneau `rgba(214,150,30,.28)` |
| Running | `#7776FF` | `#4f4ed6` | `rgba(119,118,255,.10–.14)` · `color-mix(in srgb,#7776FF 9–10%,#fff)` |
| Hybride | `#26CBB8` | à vérifier dans la source (`#0f766e`-like non utilisé) | teinte sobre dérivée |

Point de discipline : rond 7×7 px de la couleur pleine, avant le libellé.

## États
| État | Couleur | Fond |
|---|---|---|
| Actif / succès | `#15803d` (`#14532d` texte fort) | `rgba(21,128,61,.07–.10)` |
| En pause / avertissement | `#d08a1c` (`#a86410` texte) | — |
| Archivé | `#a3a1ad` | — |
| Fiche à compléter | `#d08a1c`-like orangé (voir source 1a) | — |
| Sexe ♀ | `#c2266b` sur `rgba(194,38,107,.10)` | ♂ `#2f6fbf` |

## Avatars sportifs (fond selon l’index)
`#f2d9df`, `#dfddf6`, `#d6ebe5`, `#f0e5d6` — initiales `#2a2733`.

## Ombres
- Cartes : aucune ombre portée, seulement `inset 0 0 0 1px rgba(22,18,40,.05)`.
- Menus déroulants : `0 14px 34px rgba(22,18,40,.16), 0 0 0 1px rgba(22,18,40,.06)` (liste) ou `0 16px 36px rgba(22,18,40,.16), 0 0 0 1px rgba(22,18,40,.08)`.
- Option segmentée active : `0 1px 3px rgba(22,18,40,.10)`.
- Cadre de présentation (planche uniquement, **ne pas reproduire dans l’app**) : `0 0 0 1px rgba(22,18,40,.16), 0 24px 60px -24px rgba(22,18,40,.28)`.

## Interdits
Aucun dégradé décoratif. Pas de nouvelle couleur hors de cette liste sans validation.
