# Shell global — desktop

## Cadre de page
| Élément | Valeur exacte |
|---|---|
| Fond de l’application | `#f3f2f7` |
| Padding extérieur | `14px` (tous côtés) |
| Gap sidebar ↔ contenu | `20px` |
| Colonne de contenu (`main`) | `flex:1; min-width:0; display:flex; flex-direction:column; gap:16px` |
| Largeur de référence des maquettes | 1280 px (artboards) |

## SH-01 Sidebar
| Propriété | Valeur |
|---|---|
| Largeur | `236px` (`flex:none`) |
| Fond / rayon | `#fff` / `20px` |
| Padding | `24px 14px 16px` |
| Disposition | colonne, `gap:2px` ; hauteur = hauteur de la fenêtre moins 2×14 px ; `position:sticky; top:14px` quand la page défile (01, 04, 10) |
| Logo | SVG Coory `width:96` (viewBox 0 0 472 72), anneau droit violet `#8b5cf6`, trait 16 ; ligne `padding:4px 10px 24px`, `justify-content:space-between` |
| Bouton « replier le menu » | icône 17×17, trait `#64626e` 1.8 |
| Entrée de menu | `height:34px; padding:0 12px; border-radius:9px; gap:10px; font:400 13.5px; color:#4a4855` ; icône 16×16 trait 1.7 `currentColor` |
| Entrée active | fond `rgba(139,92,246,.1)` à `.12`, texte `#6a3ee0` (cf. écarts) |
| Séparateur entre groupes | `height:1px; background:rgba(22,18,40,.08); margin:10px 4px` |
| Groupe 1 | Tableau de bord · Agenda · Sportifs · Programmes · Comptabilité · Bibliothèque (« Facturation » supprimée — la page n’existe plus) |
| Groupe 2 | Assistant IA · Messages · Tâches · Documents · Notifications |
| Badge de compteur | `min-width:20px; height:20px; border-radius:10px; background:rgba(139,92,246,.12); color:#6a3ee0; font:500 11px/20px; text-align:center` |
| Bloc utilisateur (bas) | poussé par `flex:1` ; `padding:8px; gap:10px` ; avatar 38×38 rond `#2a2733`, initiales `600 12px #fff`, anneau `box-shadow:0 0 0 2px #fff,0 0 0 3.5px #8b5cf6`, pastille de présence verte `#15803d` (pages 04/06) ; nom `600 14px`, rôle « Coach » `400 12px #64626e` |

## SH-02 Header
| Propriété | Valeur |
|---|---|
| Conteneur | `border-radius:20px; background:#fff; padding:14px 18px 14px 22px; display:flex; align-items:center; gap:10px` |
| Zone titre (`flex:1`) | colonne `gap:3px` |
| Fil d’Ariane (optionnel) | lien `font:500 12px; color:#64626e; gap:6px` + flèche ← 12×12 trait 2 |
| Titre de page | `font:600 15px; color:#17151d` ; icône de page 17×17 trait `#6a3ee0` 1.8, `gap:10px` (pages sans fil d’Ariane : 16 px, cf. 01/03) |
| SH-06 Recherche | `height:32px; width:200px; padding:0 6px 0 10px; border-radius:9px; background:#f8f7fb; box-shadow:inset 0 0 0 1px rgba(22,18,40,.12); font:400 12.5px; color:#64626e` ; loupe 13×13 ; touche « ⌘K » `font:500 10px; padding:2px 5px; border-radius:5px; box-shadow:inset 0 0 0 1px rgba(22,18,40,.14)` |
| SH-03 Assistant IA | `height:32px; padding:0 12px; border-radius:9px; background:#8b5cf6; color:#fff; font:500 12.5px; gap:6px` ; étincelle 13×13 pleine blanche |
| SH-04 Cloche | `32×32; border-radius:9px; box-shadow:inset 0 0 0 1px rgba(22,18,40,.12)` ; icône 14×14 ; badge `16×16; top:-6px; right:-6px; border-radius:50%; background:#8b5cf6; font:600 9.5px/16px #fff` |
| Action principale de page | après la cloche, ex. 01 : `height:32px` fond `#17151d`, texte blanc `600 12.5px`, icône « + » |

## Grilles de contenu (rappel, détaillées par page)
- Cards de contenu : `border-radius:20px; background:#fff; box-shadow:inset 0 0 0 1px rgba(22,18,40,.05)`.
- **Règle de mise en page validée (4 nov. 2026)** : sur les formulaires (06, 08, 10, 11, 12), **pas de colonne latérale** à droite. Les cards sont empilées et prennent **toute la largeur** de la colonne de contenu ; la card récap/aperçu est **au-dessus** du formulaire ; la card de suppression ou de validation est **en dessous**. Aucun vide en bas à droite.
