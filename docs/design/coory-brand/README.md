# Coory — fichiers du logo

Tous les SVG ont un **fond transparent** (sauf `app-icon/`, qui a un fond plein pour les stores et l'écran d'accueil).

## Contenu
| Fichier | Usage |
|---|---|
| `logo/coory-logo-fond-sombre.svg` | Logo complet, lettres blanches + O violet. Sur fond noir ou sombre. |
| `logo/coory-logo-fond-clair.svg` | Logo complet, lettres noires + O violet. Sur fond blanc ou clair. |
| `logo/coory-logo-mono-blanc.svg` | Tout blanc (photos, fonds colorés). |
| `logo/coory-logo-mono-noir.svg` | Tout noir (impression 1 couleur). |
| `icone/coory-icone-fond-sombre.svg` | Les deux O seuls, carré 1:1, pour fond sombre. |
| `icone/coory-icone-fond-clair.svg` | Les deux O seuls, pour fond clair. |
| `icone/coory-icone-mono-*.svg` | Icône 1 couleur. |
| `app-icon/coory-app-icon-noir.svg` / `-blanc.svg` | Icône d'app 512×512 avec fond et coins arrondis. |
| `favicon.svg` | Favicon : s'adapte au thème clair/sombre du navigateur. |

## Couleurs
- Violet Coory : `#8B5CF6`
- Noir : `#0B0B0D` · Blanc : `#FFFFFF`

## Règles
- Ne pas déformer, ne pas recolorer le O violet (sauf versions mono).
- Zone de protection : la hauteur d'un O (72 unités) tout autour.
- Taille minimale : logo 90 px de large, icône 20 px.

## Intégration (Claude Code)
- Copier le dossier dans `public/brand/`.
- Sidebar / header : `<img src="/brand/logo/coory-logo-fond-sombre.svg" alt="Coory" height="24">` (et la version `fond-clair` en thème clair).
- Favicon : `<link rel="icon" href="/brand/favicon.svg" type="image/svg+xml">`.
- Pour un composant React, coller le contenu du SVG inline : les `id` des masques (`cooryL`, `cooryR`) doivent rester uniques sur la page — les renommer si le logo apparaît plusieurs fois inline (pas nécessaire avec `<img>`).
