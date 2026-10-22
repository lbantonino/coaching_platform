# Coory — Logo (symbole infini, rouge)

> Spécification complète du logo Coory. À placer à la racine du projet Coory pour que Claude Code l'intègre fidèlement.
> Remplace toute version précédente du logo (anneaux entrelacés, etc.).
> Couleur de marque : **Rouge signal `#FF3347`** · Typo du logo : **Space Grotesk Bold (700)** · Fichier compagnon : `COORY_DESIGN_SYSTEM.md`.

---

## 1. Concept

- Wordmark : **`C∞ry`** — un **C majuscule**, puis les deux **o** fusionnés en **une seule boucle continue en forme d'infini**, puis **`ry`**.
- L'infini = le lien continu coach ↔ client, le suivi qui ne s'arrête pas.
- Les lettres sont en couleur texte, **seule la boucle est rouge**.
- Le symbole seul (la boucle ∞) sert d'icône d'app, de favicon et d'avatar de marque.

---

## 2. Construction (cohérence typographique)

Police : **Space Grotesk** (Google Fonts, licence libre OFL) — `<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&display=swap" rel="stylesheet">`.

La boucle est dessinée à partir du « o » de **Space Grotesk Bold** pour se fondre dans le mot. Unités en /1000 em (taille du texte) :

| Paramètre | Valeur |
|---|---|
| Hauteur de la boucle | 524 u (= encre du « o » Space Grotesk 700 : 510 au-dessus, 14 sous la ligne de base) |
| Largeur de la boucle | 1132 u (= de l'encre du 1er « o » à celle du 2e ; o = 520 u d'encre, chasse 612) |
| Épaisseur du trait | 124 u (= fût des lettres Space Grotesk Bold), `stroke-linejoin: round` |
| Rayon de chaque anneau (axe du trait) | 200 u |
| Entraxe des deux anneaux | 608 u |
| Taille (pincement central) | axe du trait à ±96 u du centre → vide central ≈ 68 u |
| Ligne de base / hauteur d'x | identiques aux lettres (débord 12 u en haut et en bas) |
| Approche C → boucle | 46 u · boucle → r : 46 u (approches du « o », aucun crénage C-o / o-r dans la police) |
| Letter-spacing du mot | −0,03 em (compensé dans la marge droite de la boucle : −14 u) |

### Intégration HTML/CSS

```html
<span class="coory-wordmark" role="img" aria-label="Coory">C<svg class="coory-loop" viewBox="-4 -4 1140 532" fill="none" aria-hidden="true"><path d="M390.6 108.8C440.4 150.6 510 166 566 166C622 166 691.6 150.6 741.4 108.8A200 200 0 1 1 741.4 415.2C691.6 373.4 622 358 566 358C510 358 440.4 373.4 390.6 415.2A200 200 0 1 1 390.6 108.8Z" stroke="currentColor" stroke-width="124" stroke-linejoin="round"/></svg>ry</span>
```
```css
.coory-wordmark { font: 700 1em/1 'Space Grotesk', system-ui, sans-serif; letter-spacing: -0.03em; white-space: nowrap; color: var(--text); }
.coory-loop     { height: 0.532em; width: 1.140em; vertical-align: -0.018em; margin: 0 -0.018em 0 0.042em; color: var(--accent); }
```
La taille du logo se règle uniquement avec `font-size` sur `.coory-wordmark`.

---

## 3. Couleurs

| Nom | Hex | Rôle |
|---|---|---|
| Rouge Coory | `#FF3347` | Boucle sur fond sombre, fond de l'icône rouge |
| Rouge foncé | `#D91E32` | Boucle sur fond clair (lisibilité) |
| Graphite | `#0B0B0C` | Fond principal, fond de l'icône d'app |
| Papier | `#F4F2EF` | Lettres sur fond sombre |
| Encre | `#141416` | Lettres sur fond clair |
| Blanc | `#FFFFFF` | Tout le logo sur fond rouge |

| Fond | Lettres « C » « ry » | Boucle ∞ |
|---|---|---|
| **Sombre `#0B0B0C` (principale)** | `#F4F2EF` | `#FF3347` |
| Rouge `#FF3347` | `#FFFFFF` | `#FFFFFF` |
| Clair `#F4F2EF` / blanc | `#141416` | `#D91E32` |

---

## 4. Symbole — SVG de référence

### Boucle seule, rouge (fond transparent)
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="-4 -4 1140 532" fill="none">
  <path d="M390.6 108.8C440.4 150.6 510 166 566 166C622 166 691.6 150.6 741.4 108.8A200 200 0 1 1 741.4 415.2C691.6 373.4 622 358 566 358C510 358 440.4 373.4 390.6 415.2A200 200 0 1 1 390.6 108.8Z" stroke="#FF3347" stroke-width="124" stroke-linejoin="round"/>
</svg>
```

### Boucle seule, thémable (React / Vue)
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="-4 -4 1140 532" fill="none">
  <path d="M390.6 108.8C440.4 150.6 510 166 566 166C622 166 691.6 150.6 741.4 108.8A200 200 0 1 1 741.4 415.2C691.6 373.4 622 358 566 358C510 358 440.4 373.4 390.6 415.2A200 200 0 1 1 390.6 108.8Z" stroke="currentColor" stroke-width="124" stroke-linejoin="round"/>
</svg>
```

### Icône d'app principale — boucle rouge sur graphite (1024×1024)
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">
  <rect width="1024" height="1024" rx="236" fill="#0B0B0C"/>
  <g transform="translate(164 350) scale(0.6108)">
    <path d="M390.6 108.8C440.4 150.6 510 166 566 166C622 166 691.6 150.6 741.4 108.8A200 200 0 1 1 741.4 415.2C691.6 373.4 622 358 566 358C510 358 440.4 373.4 390.6 415.2A200 200 0 1 1 390.6 108.8Z" fill="none" stroke="#FF3347" stroke-width="124" stroke-linejoin="round"/>
  </g>
</svg>
```

### Icône d'app alternative — boucle blanche sur rouge (1024×1024)
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">
  <rect width="1024" height="1024" rx="236" fill="#FF3347"/>
  <g transform="translate(164 350) scale(0.6108)">
    <path d="M390.6 108.8C440.4 150.6 510 166 566 166C622 166 691.6 150.6 741.4 108.8A200 200 0 1 1 741.4 415.2C691.6 373.4 622 358 566 358C510 358 440.4 373.4 390.6 415.2A200 200 0 1 1 390.6 108.8Z" fill="none" stroke="#FFFFFF" stroke-width="124" stroke-linejoin="round"/>
  </g>
</svg>
```

---

## 5. Icône d'app & favicon

- **Icône principale** : boucle `#FF3347` sur fond `#0B0B0C`, coins arrondis ≈ 23 % (fournir un carré plein pour iOS, qui applique son propre masque). Sur fond d'écran sombre, un filet `rgba(255,255,255,.13)` de 1 px peut entourer l'icône.
- **Icône alternative** : boucle blanche sur `#FF3347` (recommandée pour le favicon et les petites tailles).
- La boucle occupe ≈ 68 % de la largeur de l'icône, centrée.
- Exports : 1024, 512, 192, 180 (apple-touch-icon), 32, 16 px.
- PWA : `theme_color` et `background_color` = `#0B0B0C`.

---

## 6. Règles d'usage

- **Zone de protection** : la hauteur d'un « o » (≈ 0,56 × la taille du texte) tout autour.
- **Taille minimale** : 16 px de haut.
- Tailles dans l'app : 17–20 px (sidebar desktop), 22–28 px (connexion, onboarding, header mobile).
- **Interdits** :
  - déformer, incliner, faire pivoter la boucle ;
  - séparer les deux boucles ou en faire deux « o » ;
  - colorer les lettres en rouge ou la boucle en blanc sur fond sombre ;
  - ajouter ombre, contour, dégradé, lueur ;
  - écrire « COORY » en capitales ou utiliser une autre police que Space Grotesk Bold.

---

## 7. Intégration — à faire par Claude Code

1. Créer `assets/logo/` avec : `coory-loop.svg` (§4, rouge), `coory-loop-current.svg` (thémable), `coory-icon-dark.svg` et `coory-icon-red.svg` (1024×1024).
2. Créer un composant `<CooryLogo variant="wordmark" | "symbol" | "icon" tone="dark" | "red" | "light" size={…} />` :
   - `wordmark` = « C » + boucle SVG + « ry » (§2) ; `size` = font-size en px ;
   - `tone` applique le tableau du §3 (couleur des lettres + couleur de la boucle) ;
   - `icon` = tuile carrée arrondie du §5.
3. Remplacer l'ancien logo partout : sidebar coach, écran de connexion, header mobile, e-mails, splash screen.
4. Générer favicon (`favicon.ico` 16/32), `apple-touch-icon.png` 180, icônes PWA 192/512 depuis `coory-icon-red.svg` (petites tailles) et `coory-icon-dark.svg` (grandes tailles).
5. Vérifier en thème sombre et clair que le tableau du §3 est respecté.
