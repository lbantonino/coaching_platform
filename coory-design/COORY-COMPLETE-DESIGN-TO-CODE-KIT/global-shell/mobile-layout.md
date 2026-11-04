# Shell global — mobile

> Référence canonique : **04 Comptabilité mobile** et **01 Tâches mobile** (identiques au kit COORY-SPORTIF). Les barres d’état « 9:41 · 5G » visibles sur certaines maquettes (06, 08–13) sont un **habillage de présentation** : ne pas les implémenter.

## Cadre
| Élément | Valeur exacte |
|---|---|
| Largeur de référence | 390 px · hauteur 844 px |
| Fond | `#f3f2f7` |
| Zone défilante | `flex:1; min-height:0; overflow:auto; padding:16px 14px 110px; gap:12px` (le 110 px du bas laisse la place au FAB / à la barre fixe) |
| Cards | pleine largeur, `border-radius:22px` (formulaires) ou `20px`, fond `#fff`, padding `18px 16px` |

## SH-05 En-tête mobile
```
[☰ 44×44]  [icône 18 + Titre de page ……………]  [ (✦ 40×40) (🔔 40×40) ]
```
| Élément | Valeur |
|---|---|
| Ligne | `display:flex; align-items:center; gap:10px; padding:10px 12px 0` |
| Hamburger | `44×44; border-radius:14px; background:#fff` ; icône 18×18 (3 traits) trait 1.8 |
| Titre | `flex:1; padding-left:4px; gap:9px; font:500 16px; letter-spacing:-.01em; white-space:nowrap` ; icône 18×18 trait `#6a3ee0` |
| Groupe d’actions | `display:flex; gap:4px; padding:4px; border-radius:16px; background:#fff` |
| Assistant IA (SH-03 mobile) | `40×40; border-radius:12px; background:#8b5cf6` ; étincelle 16×16 pleine blanche → ouvre la boîte de dialogue mobile (02) |
| Cloche (SH-04 mobile) | `40×40` ; icône 16×16 ; badge `15×15; top:4px; right:4px; background:#8b5cf6; font:600 9px/15px #fff` |

## SH-08 Bouton flottant (FAB)
| Propriété | Valeur exacte (source 04) |
|---|---|
| Position | `position:absolute` (fixe à l’écran dans l’app) ; `right:20px; bottom:28px` + safe area : `bottom: calc(28px + env(safe-area-inset-bottom))` |
| Taille / forme | `60×60; border-radius:18px; background:#17151d; color:#fff` |
| Ombre | `0 12px 28px -8px rgba(22,18,40,.5)` |
| Icône | « + » 24×24, trait 2.2 ; **rotation 45°** (`transition:transform .2s`) quand le menu est ouvert → devient « × » |
| Pression | `transform:scale(.95)` |
| Accessibilité | `aria-label` explicite (« Ajouter un paiement ou une dépense » / « Fermer »), `aria-expanded` |
| Menu associé | `right:20px; bottom:104px; width:230px; padding:6px; border-radius:18px; background:#fff; box-shadow:0 24px 48px -12px rgba(22,18,40,.35)` ; items `min-height:52px` ; overlay `rgba(22,18,40,.32)` qui ferme au tap |
| Pages qui l’utilisent | 04 Comptabilité (+ → Nouveau paiement / Nouvelle dépense), 07 Messages (+ → Nouvelle conversation / Nouveau groupe), 05 Documents (Importer) |
| Pages qui ne l’utilisent PAS | 06, 08–13 : leur action principale est **Enregistrer** → barre fixe en bas (voir ci-dessous), pas un FAB. |

## Barre d’action fixe (formulaires mobiles)
| Propriété | Valeur |
|---|---|
| Conteneur | `position:absolute; left:0; right:0; bottom:0; padding:12px 16px 30px` (30 px = safe area) ; fond dégradé `linear-gradient(rgba(243,242,247,0), #f3f2f7 30%)` |
| Bouton secondaire | « Annuler » `height:54px; padding:0 20px; border-radius:15px; background:#fff; box-shadow:inset 0 0 0 1px rgba(22,18,40,.12); font:500 15px` |
| Bouton principal | `flex:1; height:54px; border-radius:15px; background:#17151d; color:#fff; font:600 16px; box-shadow:0 12px 28px -10px rgba(22,18,40,.45)` |
| Clavier ouvert | la barre reste collée au-dessus du clavier (`visualViewport`) ; si la hauteur disponible < 420 px, la masquer pendant la saisie (TO-VERIFY selon le comportement actuel). |

## Menu hamburger
Non dessiné dans ces maquettes : **reprendre le tiroir existant** de l’app (même contenu que SH-01). TO-VERIFY.
