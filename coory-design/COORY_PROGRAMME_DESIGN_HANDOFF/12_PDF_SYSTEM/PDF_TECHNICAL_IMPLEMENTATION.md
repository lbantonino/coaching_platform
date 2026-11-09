# PDF — implémentation technique (pour Claude Code)

## Approche recommandée
1. **Templates HTML/CSS** reprenant `CooryPdfDoc` (source dans `13_HTML_PREVIEWS/source/programmes/CooryPdfDoc.dc.html`), une page = un `<section class="page">` 210 × 297 mm, `break-after: page`.
2. Rendu serveur avec **Playwright/Chromium `page.pdf({ format: 'A4', printBackground: true, preferCSSPageSize: true })`** — conserve le texte vectoriel et les liens `<a href="#week-2">` en annotations internes.
3. Post-traitement **pdf-lib** (ou équivalent déjà présent dans le projet) pour : signets (`/Outlines`), métadonnées (Title, Author = coach, Subject, CreationDate), langue `fr-FR`. Vérifier si le projet a déjà une solution PDF avant d'ajouter une dépendance.

## Données
Source = la **version publiée** du programme (jamais le brouillon). PDF 1 : Program + Weeks + Sessions + Blocks (résumés une ligne par info). PDF 2 : sessions réutilisables (fiches), workloads, repères du sportif (AthleteBenchmarks).

## Règles de mise en page
- Une semaine = une page. Si une semaine déborde (> 7 jours très détaillés) : réduire à 3 lignes par séance + « → détail dans Coory » ; ne jamais couper une carte de jour sur deux pages (`break-inside: avoid`).
- Une fiche = une page ; si elle déborde : continuer sur la page suivante avec en-tête « Full Body A (suite) » et la même barre de navigation.
- Semaine sans séance : page présente, 7 × « Repos ».
- Exercice sans image : aucune image dans le PDF de toute façon (texte seul).
- Séance multi-disciplines [P] : une carte par bloc de discipline dans le jour.

## Cycle de vie
- Généré à la demande (« PDF » dans 03) et à chaque **publication** [P] ; stocké (ProgramExport) avec le numéro de version.
- Le PDF est un **instantané** : pied « Version n · généré le … ». Un nouveau PDF remplace l'ancien ; l'ancien reste téléchargeable dans l'historique [P].

## Sécurité
- Fichiers privés (accès coach + sportif concerné), URL signées à durée limitée, aucun secret ni jeton dans les liens imprimés dans le PDF. Les liens vers COORY ouvrent une page qui demande la connexion.

## Tests
Voir `../14_QA/PDF_QA.md` : chaque lien testé sur Aperçu (macOS), Acrobat Reader, Chrome, Safari iOS (Fichiers), Google Drive / lecteur Android.
