# COORY — Kit logo (brief pour Claude Code)

> Logo **définitif et validé**. Ce dossier contient tout ce qu'il faut pour l'intégrer partout dans le site **Next.js (App Router)** : header, menu de l'app, favicon, icônes d'écran d'accueil, image de partage, e-mails.
> **Règle n°1 : ne jamais redessiner le logo.** Toujours utiliser les fichiers de ce dossier ou le composant `CooryLogo.tsx`.

Regarde d'abord les 3 images de `reference/` :
- `reference/01-construction.png` — comment le logo est construit
- `reference/02-ou-placer-le-logo.png` — où il va dans le site et l'app
- `reference/03-a-faire-a-eviter.png` — ce qui est interdit

---

## 1. Le logo en une phrase

Un **ovale (forme de piste) coupé en deux par une diagonale** : la moitié gauche forme le **C** (le coach, en noir ou blanc), la moitié droite forme l'**O violet** (le sportif). À côté : le nom **COORY** en **Plus Jakarta Sans ExtraBold (800)**, en capitales.

## 2. Géométrie exacte (source officielle)

`viewBox="0 0 240 120"` (ratio 2:1). Deux tracés, sans clipPath ni masque :

```svg
<svg viewBox="0 0 240 120" xmlns="http://www.w3.org/2000/svg">
  <path fill="#17151D" d="M126.69 0H60A60 60 0 0 0 60 120H95.31L103.68 88H60A28 28 0 0 1 60 32H118.32Z"/>  <!-- C (coach) -->
  <path fill="#8B5CF6" d="M144.69 0H180A60 60 0 0 1 180 120H113.31L121.68 88H180A28 28 0 0 0 180 32H136.32Z"/>  <!-- O (sportif) -->
</svg>
```

- Ovale 240 × 120, trait 32 (rayon extérieur 60, intérieur 28).
- Deux coupes parallèles, écart 18, inclinées d'environ 76°.
- **Le violet est toujours à droite. Jamais sur le C.**

## 3. Couleurs

| Rôle | Hex |
|---|---|
| Violet Coory | `#8B5CF6` |
| Encre (C sur fond clair, texte) | `#17151D` |
| Papier (C sur fond sombre) | `#F4F4F2` |
| Nuit (fond très sombre) | `#0A0A0C` |

| Fond | C | O | Texte COORY |
|---|---|---|---|
| Clair | `#17151D` | `#8B5CF6` | `#17151D` |
| Sombre | `#F4F4F2` | `#8B5CF6` | `#F4F4F2` |
| Violet | `#FFFFFF` | `#17151D` | `#FFFFFF` |

## 4. Proportions du logo complet

`h` = hauteur de l'icône (l'icône fait `2h` de large).

| | Horizontal (principal) | Empilé |
|---|---|---|
| Taille du texte COORY | `h × 1,16` | `h × 0,64` |
| Écart icône ↔ texte | `h × 0,39` | `h × 0,24` |
| Graisse / lettrage | 800 · `letter-spacing: 0.01em` | idem |

**Espace libre** autour du logo : au moins `h ÷ 2`. **Tailles minimales** : icône 24 px de large, logo horizontal 96 px de large.

## 5. Contenu du dossier

```
COORY-LOGO-KIT/
├── README.md                 ← ce brief
├── PROMPT-CLAUDE-CODE.md     ← le prompt à coller
├── reference/                ← 3 planches à regarder (PNG)
├── code/
│   ├── CooryLogo.tsx         ← composant React <CooryLogo/> et <CooryMark/>
│   ├── layout-metadata.tsx   ← metadata Next.js (favicon, OG, theme-color) à fusionner
│   └── manifest.ts           ← app/manifest.ts (PWA)
├── svg/
│   ├── icone/   coory-icone-fond-clair|fond-sombre|fond-violet|mono-noir|mono-blanc.svg
│   ├── logo/    coory-logo-horizontal-fond-clair|fond-sombre|fond-violet.svg, coory-logo-empile-fond-clair|fond-sombre.svg
│   ├── favicon/ favicon.svg (s'adapte au mode sombre), safari-pinned-tab.svg
│   └── app/     coory-app-icone-sombre|clair|maskable.svg
└── png/
    favicon.ico (16/32/48), favicon-16|32|48.png, apple-touch-icon.png (180),
    icon-192.png, icon-512.png, icon-maskable-512.png, og-image.png (1200×630), coory-icone-960.png
```

> Les SVG `logo/` contiennent le texte COORY en `<text>` : ils ont besoin de la police. **Dans le site, utilise le composant `CooryLogo.tsx`**, pas ces SVG. Ils servent pour Figma, les documents et les e-mails.

## 6. Où mettre les fichiers dans le projet Next.js

| Fichier du kit | Destination dans le projet |
|---|---|
| `png/favicon.ico` | `public/favicon.ico` (et supprimer `app/favicon.ico` s'il existe) |
| `svg/favicon/favicon.svg` | `public/icon.svg` |
| `png/favicon-16.png`, `favicon-32.png` | `public/` |
| `png/apple-touch-icon.png` | `public/apple-touch-icon.png` |
| `png/icon-192.png`, `icon-512.png`, `icon-maskable-512.png` | `public/` |
| `svg/favicon/safari-pinned-tab.svg` | `public/safari-pinned-tab.svg` |
| `png/og-image.png` | `public/og-image.png` |
| `svg/` (tout le dossier) | `public/brand/` (pour e-mails, PDF, partenaires) |
| `code/CooryLogo.tsx` | `components/brand/CooryLogo.tsx` (ou `src/components/...` selon le projet) |
| `code/manifest.ts` | `app/manifest.ts` |
| `code/layout-metadata.tsx` | **fusionner** dans `app/layout.tsx` (ne pas écraser) |

## 7. Où afficher le logo (voir `reference/02`)

| Endroit | Version | Taille |
|---|---|---|
| Header du site public | `<CooryLogo tone="light" height={28} />` (ou `dark` si header sombre), lien vers `/` | 26–32 px |
| Menu latéral de l'app (desktop) | `<CooryLogo height={20} />` | 20 px |
| Barre du haut mobile | `<CooryMark height={18} />` ou logo 18 px | 18 px |
| Pages connexion / inscription | `<CooryLogo height={32} />` | 32 px |
| Écran de chargement / splash | `<CooryMark height={56} />` centré | 48–60 px |
| Pied de page | `<CooryLogo height={22} tone="dark" />` si footer sombre | 22 px |
| E-mails transactionnels | `public/brand/logo/…` en PNG ou SVG hébergé | 28 px |
| Bloc sur fond violet | `tone="violet"` | — |
| Onglet du navigateur | `favicon.ico` + `icon.svg` | auto |
| Écran d'accueil iOS / Android | `apple-touch-icon.png`, `icon-192/512`, maskable | auto |
| Partage (WhatsApp, LinkedIn, iMessage) | `og-image.png` | 1200×630 |

**Remplacer tous les anciens logos** : rechercher dans le code les anciens SVG, images (`logo`, `Logo`, `brand`, `C∞RY`, ancien wordmark) et les remplacer par le composant.

## 8. Interdits (voir `reference/03`)

Ne pas : déformer, pencher, changer le violet, inverser les couleurs (violet sur le C), changer la police, ajouter ombre/lueur/dégradé, modifier l'écart icône–texte, poser le logo violet sur fond violet (utiliser `tone="violet"`).

## 9. Vérifications finales

- [ ] Le favicon apparaît dans l'onglet (clair et sombre), y compris après vidage du cache.
- [ ] `/manifest.webmanifest` répond et liste les 3 icônes.
- [ ] Ajout à l'écran d'accueil iPhone : icône sombre avec le logo.
- [ ] Aperçu de partage OK (tester avec un validateur Open Graph).
- [ ] Plus aucun ancien logo dans le code (`grep`).
- [ ] Le logo est net à toutes les tailles, rien n'est flou ou pixelisé.
- [ ] Contraste correct sur chaque fond.
