# Navigation (coque commune à toutes les pages)

Extrait exact : [source-shell-fiche.md](source-shell-fiche.md) (sidebar + header des fiches).
> **Ne pas modifier le panneau latéral existant s’il est déjà conforme.** Comparer d’abord.

## Desktop — Panneau latéral (`<aside>`)
| Propriété | Valeur exacte |
|---|---|
| Largeur | 236 px, `flex:none` |
| Hauteur | `min-height:740px` ; s’étire à la hauteur de `main` (cadre en `align-items:stretch`) ; `position:sticky; top:14px` sur 1a |
| Fond / rayon | `#fff` / 20 |
| Padding / gap | `24px 14px 16px` / `2px` |
| En-tête | logo COORY (SVG 96 px de large, traits `#17151d`, 2ᵉ « O » `#8b5cf6`) à gauche + icône « réduire le panneau » 17 px `#64626e` à droite ; `padding:4px 10px 24px` |
| Item | h34, `padding:0 12px`, rayon 9, `gap:10px`, icône 16 (trait 1.7), `400 13.5px`, nowrap |
| Item actif | fond `rgba(139,92,246,.12)`, texte `#17151d` |
| Item inactif | transparent, `#4a4855` |
| Groupe 1 | Tableau de bord · Agenda · **Sportifs** (actif sur toutes ces pages) · Programmes · Facturation · Comptabilité · Bibliothèque |
| Séparateur | 1 px `rgba(22,18,40,.08)`, `margin:10px 4px` |
| Groupe 2 | Assistant IA · Messages (badge 3) · Tâches · Documents · Notifications (badge 6) |
| Badge compteur | min 20×20, rayon 10, fond `rgba(139,92,246,.12)`, `#6a3ee0`, `500 11px/20px`, centré |
| Pied | carte utilisateur `padding:8px` : avatar 38 (`#2a2733`, anneau violet, point en ligne `#15803d`), nom `600 14px` (ellipse), rôle « Coach » `400 12px #64626e` |
Les compteurs (3, 6) sont des **données de démo**.

## Desktop — Header global
| Propriété | Valeur exacte |
|---|---|
| Conteneur | fond `#fff`, rayon 20, `padding:16px 18px 16px 22px`, flex, `gap:10px`, centré verticalement |
| Gauche | 1a : icône Sportifs + « Sportifs » (titre). Fiches : lien retour flèche 14 + « Sportifs » (`400 14px #4a4855`). 2d : « ← Inès Benali » |
| Recherche | 200×32, rayon 9, fond `#f8f7fb`, contour .12, loupe 13, « Rechercher dans Coory » `400 12.5px #64626e`, touche « ⌘K » `500 10px` contour .14 rayon 5 |
| Assistant IA | h32, `padding:0 12px`, rayon 9, `#8b5cf6`, blanc `500 12.5px`, étincelle 13 |
| Cloche | 32×32, rayon 9, contour .12 ; badge 16×16 `#8b5cf6`, `600 9.5px/16px`, position `top:-6px; right:-6px` |
| Action principale | 1a : « + Nouveau sportif » ; fiches 2a–2k : « + Créer » + bouton « ··· » 32×32 ; 2d : aucun |
| Bouton principal | h32, `padding:0 14px`, rayon 9, `#17151d`, blanc `500 12.5px` |

## Mobile — Barre supérieure
| Élément | Valeur exacte |
|---|---|
| Conteneur | `padding:10px 12px 0`, flex, `gap:10px` |
| Hamburger | 44×44, rayon 14, fond `#fff`, icône 18 |
| Titre / retour | 1b : icône + « Sportifs ». Fiches : flèche 16 + « Sportifs » (2d : « Inès Benali ») `500 15px #64626e`, nowrap |
| Groupe d’actions | pilule `#fff`, rayon 16, `padding:4px`, `gap:4px` : IA 40×40 rayon 12 `#8b5cf6` · cloche 40×40 (badge 15×15 `#8b5cf6` `600 9px`, top/right 4) · « + » 40×40 rayon 12 `#17151d` (`aria-label="Créer"` / « Nouveau sportif ») — absent en 2d |
| Menu (hamburger) | **comportement à vérifier dans l’app** : ouvre la navigation principale (tiroir) — non dessiné |
