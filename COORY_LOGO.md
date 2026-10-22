# Coory — Logo (version rouge)

> Spécification complète du logo Coory, à placer dans le dossier du projet pour que Claude Code puisse l'intégrer fidèlement.
> Couleur de marque : **Rouge signal `#FF3347`**. Typo : **Geist SemiBold (600)**.
> Fichier compagnon : `COORY_DESIGN_SYSTEM.md`.

---

## 1. Concept

- Nom : **Coory**. Le wordmark s'écrit toujours en **minuscules** : `coory`.
- Idée : les deux **o** sont remplacés par **deux anneaux entrelacés** (un maillon de chaîne). Un anneau = le coach, l'autre = le client : un lien solide.
- L'anneau de gauche reprend la couleur du texte, l'anneau de droite porte l'accent rouge.
- Au croisement du haut, l'anneau **rouge passe par-dessus** ; au croisement du bas, l'anneau **clair passe par-dessus**. Une coupure dans la couleur du fond sépare les deux traits à chaque croisement.

---

## 2. Construction (cohérence typographique)

Les anneaux sont redessinés à partir du « o » de **Geist SemiBold** pour se fondre dans le mot. Unités en /1000 em (taille du corps de la police) :

| Paramètre | Valeur | Explication |
|---|---|---|
| Contour d'un anneau | 525 × 558 u | Encre du « o » Geist 600, débords compris |
| Épaisseur du trait | 128 u | Même fût que les lettres |
| Rayons (axe du trait) | rx 198,5 · ry 215 | Ellipse = (525−128)/2 × (558−128)/2 |
| Entraxe des deux anneaux | 230 u | Anneaux bien imbriqués |
| Coupure aux croisements | 30 u de chaque côté | Halo de la couleur du fond, largeur 128 + 2×30 |
| Ligne de base | 0 | Identique aux lettres (débord bas 12 u) |
| Hauteur d'x | 534 u | Identique aux lettres (débord haut 12 u) |
| Approche c → anneaux | 29 u | Approche naturelle de Geist |
| Approche anneaux → r | −21 u | Crénage « or » de Geist |
| Letter-spacing du mot | −0,05 em | Appliqué à tout le wordmark |

Intégration dans le texte (le SVG remplace « oo ») :

```html
<span class="coory-wordmark">c<svg class="coory-oo" viewBox="-4 -4 763 566" aria-hidden="true">…</svg>ry</span>
```
```css
.coory-wordmark { font: 600 1em/1 'Geist', sans-serif; letter-spacing: -0.05em; white-space: nowrap; }
.coory-oo { height: 0.566em; width: 0.763em; vertical-align: -0.016em; margin: 0 -0.025em 0 0.025em; }
```
Ajouter `aria-label="Coory"` sur le conteneur (ou un texte masqué « Coory ») pour l'accessibilité.

---

## 3. Couleurs du logo

| Nom | Hex | Rôle |
|---|---|---|
| Rouge Coory (Rouge signal) | `#FF3347` | Anneau accent, fond de l'icône d'app |
| Rouge foncé | `#D91E32` | Anneau accent sur fond clair (lisibilité) |
| Graphite | `#0B0B0C` | Fond principal |
| Papier | `#F4F2EF` | Texte et anneau gauche sur fond sombre |
| Encre | `#141416` | Texte et anneau gauche sur fond clair |
| Blanc | `#FFFFFF` | Logo monochrome sur fond rouge |

### Déclinaisons autorisées

| Fond | Lettres + anneau gauche | Anneau droit | Couleur de coupure |
|---|---|---|---|
| **Sombre `#0B0B0C` (version principale)** | `#F4F2EF` | `#FF3347` | `#0B0B0C` |
| Rouge `#FF3347` | `#FFFFFF` | `#FFFFFF` | `#FF3347` |
| Clair `#F4F2EF` / blanc | `#141416` | `#D91E32` | couleur du fond |

La **couleur de coupure doit toujours être exactement la couleur du fond** derrière le logo. Sur une photo ou un fond non uni, utiliser la version sur pastille (icône).

---

## 4. Symbole — SVG de référence

Le symbole (les deux anneaux seuls) sert d'icône d'app, de favicon et d'avatar. Copier ces SVG tels quels.

### Fond sombre (principal)
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="-4 -4 763 566" fill="none">
  <rect x="-4" y="-4" width="763" height="566" fill="#0B0B0C"/>
  <defs>
    <clipPath id="dka"><rect x="262.5" y="-200" width="1200" height="479"/></clipPath>
    <clipPath id="dkb"><rect x="258.5" y="-200" width="1200" height="485"/></clipPath>
  </defs>
  <!-- 1. right ring (accent) -->
  <ellipse cx="492.5" cy="279" rx="198.5" ry="215" stroke="#FF3347" stroke-width="128"/>
  <!-- 2. left ring: knock-out halo in background color, then ring -->
  <ellipse cx="262.5" cy="279" rx="198.5" ry="215" stroke="#0B0B0C" stroke-width="188"/>
  <ellipse cx="262.5" cy="279" rx="198.5" ry="215" stroke="#F4F2EF" stroke-width="128"/>
  <!-- 3. right ring passes OVER the left ring at the top crossing -->
  <g clip-path="url(#dka)"><ellipse cx="492.5" cy="279" rx="198.5" ry="215" stroke="#0B0B0C" stroke-width="188"/></g>
  <g clip-path="url(#dkb)"><ellipse cx="492.5" cy="279" rx="198.5" ry="215" stroke="#FF3347" stroke-width="128"/></g>
</svg>
```

### Fond rouge (icône d'app)
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="-4 -4 763 566" fill="none">
  <rect x="-4" y="-4" width="763" height="566" fill="#FF3347"/>
  <defs>
    <clipPath id="rda"><rect x="262.5" y="-200" width="1200" height="479"/></clipPath>
    <clipPath id="rdb"><rect x="258.5" y="-200" width="1200" height="485"/></clipPath>
  </defs>
  <!-- 1. right ring (accent) -->
  <ellipse cx="492.5" cy="279" rx="198.5" ry="215" stroke="#FFFFFF" stroke-width="128"/>
  <!-- 2. left ring: knock-out halo in background color, then ring -->
  <ellipse cx="262.5" cy="279" rx="198.5" ry="215" stroke="#FF3347" stroke-width="188"/>
  <ellipse cx="262.5" cy="279" rx="198.5" ry="215" stroke="#FFFFFF" stroke-width="128"/>
  <!-- 3. right ring passes OVER the left ring at the top crossing -->
  <g clip-path="url(#rda)"><ellipse cx="492.5" cy="279" rx="198.5" ry="215" stroke="#FF3347" stroke-width="188"/></g>
  <g clip-path="url(#rdb)"><ellipse cx="492.5" cy="279" rx="198.5" ry="215" stroke="#FFFFFF" stroke-width="128"/></g>
</svg>
```

### Fond clair
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="-4 -4 763 566" fill="none">
  <rect x="-4" y="-4" width="763" height="566" fill="#F4F2EF"/>
  <defs>
    <clipPath id="lta"><rect x="262.5" y="-200" width="1200" height="479"/></clipPath>
    <clipPath id="ltb"><rect x="258.5" y="-200" width="1200" height="485"/></clipPath>
  </defs>
  <!-- 1. right ring (accent) -->
  <ellipse cx="492.5" cy="279" rx="198.5" ry="215" stroke="#D91E32" stroke-width="128"/>
  <!-- 2. left ring: knock-out halo in background color, then ring -->
  <ellipse cx="262.5" cy="279" rx="198.5" ry="215" stroke="#F4F2EF" stroke-width="188"/>
  <ellipse cx="262.5" cy="279" rx="198.5" ry="215" stroke="#141416" stroke-width="128"/>
  <!-- 3. right ring passes OVER the left ring at the top crossing -->
  <g clip-path="url(#lta)"><ellipse cx="492.5" cy="279" rx="198.5" ry="215" stroke="#F4F2EF" stroke-width="188"/></g>
  <g clip-path="url(#ltb)"><ellipse cx="492.5" cy="279" rx="198.5" ry="215" stroke="#D91E32" stroke-width="128"/></g>
</svg>
```

### Version thémable (sans fond) pour React / Vue
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="-4 -4 763 566" fill="none">
  <defs>
    <clipPath id="tha"><rect x="262.5" y="-200" width="1200" height="479"/></clipPath>
    <clipPath id="thb"><rect x="258.5" y="-200" width="1200" height="485"/></clipPath>
  </defs>
  <!-- 1. right ring (accent) -->
  <ellipse cx="492.5" cy="279" rx="198.5" ry="215" stroke="var(--accent)" stroke-width="128"/>
  <!-- 2. left ring: knock-out halo in background color, then ring -->
  <ellipse cx="262.5" cy="279" rx="198.5" ry="215" stroke="var(--bg)" stroke-width="188"/>
  <ellipse cx="262.5" cy="279" rx="198.5" ry="215" stroke="currentColor" stroke-width="128"/>
  <!-- 3. right ring passes OVER the left ring at the top crossing -->
  <g clip-path="url(#tha)"><ellipse cx="492.5" cy="279" rx="198.5" ry="215" stroke="var(--bg)" stroke-width="188"/></g>
  <g clip-path="url(#thb)"><ellipse cx="492.5" cy="279" rx="198.5" ry="215" stroke="var(--accent)" stroke-width="128"/></g>
</svg>
```
Dans un composant, donner un `id` unique aux `clipPath` (ex. `useId()` en React), sinon plusieurs logos sur la même page se marchent dessus.

---

## 5. Icône d'app & favicon

- **Icône principale** : symbole blanc sur fond **`#FF3347`**, coins arrondis ≈ 23 % de la taille (iOS gère son propre masque : fournir un carré plein).
- **Icône alternative** : symbole `#F4F2EF` + anneau rouge sur fond `#0B0B0C`.
- Le symbole occupe ≈ 68 % de la largeur de l'icône, centré.
- Tailles à exporter : 1024, 512, 192, 180 (apple-touch-icon), 32, 16 px. À 16 px, utiliser la version sur fond rouge.
- `theme-color` : `#0B0B0C`.

---

## 6. Règles d'usage

- **Zone de protection** : la hauteur d'un « o » (≈ 0,56 × la taille du texte) libre tout autour.
- **Taille minimale** : 16 px de haut pour le wordmark comme pour le symbole.
- Wordmark dans l'app : 17–20 px dans la sidebar desktop, 22–26 px dans les écrans d'accueil / connexion.
- **À ne pas faire** :
  - déformer, incliner, faire pivoter ;
  - ajouter une ombre, un contour, un dégradé ou un effet lumineux ;
  - inverser l'ordre des anneaux ou les deux couleurs ;
  - mettre l'anneau rouge sur un fond rouge ;
  - écrire « Coory » en majuscules dans le logo ou changer de police ;
  - remplacer les anneaux par des « o » de texte.

---

## 7. Intégration — à faire par Claude Code

1. Créer `assets/logo/` avec `coory-symbol-dark.svg`, `coory-symbol-red.svg`, `coory-symbol-light.svg` (SVG du §4).
2. Créer un composant `<CooryLogo variant="wordmark|symbol" tone="dark|red|light" size={…} />` :
   - `wordmark` = « c » + SVG thémable + « ry » (§2) ;
   - `tone` règle les trois couleurs du §3 (lettres, anneau droit, coupure).
3. Remplacer l'ancien logo partout : sidebar coach, écran de connexion, header mobile, e-mails, favicon, manifest PWA.
4. Générer les favicons / icônes (§5) depuis `coory-symbol-red.svg`.
