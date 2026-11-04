# Bordures, rayons, ombres

## Rayons (occurrences)
| Rayon | Usage |
|---|---|
| 50% | avatars, pastilles |
| 20px (85) | cards desktop, sidebar, header |
| 22px | cards mobiles |
| 24–26px | modale (13 : 24), boîte Assistant (26), feuilles mobiles (`26px 26px 0 0`) |
| 18px | FAB, menu du FAB, notes |
| 16–17px | cards de paramètres (16), pilules (17 = hauteur 34/2) |
| 14–15px | toggles larges (14), boutons mobiles 54 px (15) |
| 12–13px | champs (11–12), boutons 44 px, menus |
| 9–11px | boutons desktop 32–42 px, entrées de menu (9) |
| 8px | segments internes, badges de maquette |

## Bordures
Les bordures sont **dessinées en `box-shadow: inset`** (pas de `border`) pour ne pas modifier les dimensions :
| Usage | Valeur |
|---|---|
| Champ | `inset 0 0 0 1px rgba(22,18,40,.12)` (96 occ.) |
| Champ focus | `inset 0 0 0 1.5px #8b5cf6` |
| Card | `inset 0 0 0 1px rgba(22,18,40,.05)` |
| Bouton secondaire / pilule | `inset 0 0 0 1px rgba(22,18,40,.14)` |
| Card de paramètres | `inset 0 0 0 1px rgba(22,18,40,.08)` |
| Séparateurs | `1px solid rgba(22,18,40,.06)–.07` (border-top / border-left) |

## Ombres
| Usage | Valeur |
|---|---|
| Modale | `0 30px 80px -20px rgba(22,18,40,.5)` |
| Menu déroulant | `0 18px 40px -12px rgba(22,18,40,.35), 0 0 0 1px rgba(22,18,40,.06)` |
| FAB | `0 12px 28px -8px rgba(22,18,40,.5)` |
| Bouton principal mobile | `0 12px 28px -10px rgba(22,18,40,.45)` |
| Segment actif | `0 1px 2px rgba(22,18,40,.08)`–`0 1px 3px rgba(22,18,40,.12)` |
| Pouce d’interrupteur | `0 1px 2px rgba(0,0,0,.2)` |
| Zone de saisie Assistant | `inset 0 0 0 1px rgba(22,18,40,.10), 0 18px 40px -18px rgba(124,58,237,.45)` |
| Cadre d’artboard `0 0 0 1px rgba(22,18,40,.16),0 24px 60px -24px rgba(22,18,40,.28)` | **présentation uniquement — ne pas reproduire** |
