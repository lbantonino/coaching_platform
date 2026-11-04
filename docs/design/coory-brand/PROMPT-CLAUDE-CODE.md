# Prompt à coller dans Claude Code

```
Lis entièrement COORY-LOGO-KIT/README.md, puis ouvre et regarde les 3 images :
- COORY-LOGO-KIT/reference/01-construction.png
- COORY-LOGO-KIT/reference/02-ou-placer-le-logo.png
- COORY-LOGO-KIT/reference/03-a-faire-a-eviter.png

C'est le logo définitif de Coory. Ta mission : l'intégrer partout dans mon site Next.js (App Router), sans le redessiner.

1. Avant de coder, résume-moi en 5 lignes ce que tu as compris du logo, puis liste :
   - les fichiers que tu vas créer ou modifier,
   - tous les endroits du code où un ancien logo est utilisé (fais une recherche).
   Attends ma validation.
2. Copie les fichiers du kit aux emplacements du tableau §6 du README.
   - Supprime app/favicon.ico s'il existe (sinon il écrase le nouveau).
   - Ne touche pas à la logique, aux pages ni au style, en dehors du logo.
3. Ajoute le composant code/CooryLogo.tsx dans components/brand/, et la police Plus Jakarta Sans 800 via next/font si elle n'est pas déjà chargée (variable --font-jakarta).
4. Fusionne code/layout-metadata.tsx dans app/layout.tsx : icons, manifest, openGraph, twitter, viewport.themeColor. Ne supprime rien de ce qui existe déjà ; demande-moi le domaine pour metadataBase.
5. Ajoute app/manifest.ts.
6. Remplace chaque ancien logo par <CooryLogo/> ou <CooryMark/>, avec les tailles et les tons du tableau §7.
7. Lance le build et vérifie la checklist §9. Donne-moi la liste des fichiers modifiés et ce qu'il me reste à vérifier à la main (favicon dans l'onglet, icône iPhone, aperçu de partage).
```
