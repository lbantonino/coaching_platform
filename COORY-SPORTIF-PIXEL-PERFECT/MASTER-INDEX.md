# Index maître

| # | Fiche | Page | Utilisateur | Dossier | Desktop | Mobile |
|---|---|---|---|---|---|---|
| 01 | 1a / 1b | Liste des sportifs | Coach | [pages/01-liste-sportifs](pages/01-liste-sportifs/specification.md) | [desktop.png](pages/01-liste-sportifs/screenshots/desktop.png) | [mobile.png](pages/01-liste-sportifs/screenshots/mobile.png) |
| 02 | 2a | Fiche sportif · Vue d’ensemble | Coach | [pages/02a-fiche-vue-ensemble](pages/02a-fiche-vue-ensemble/specification.md) | [desktop.png](pages/02a-fiche-vue-ensemble/screenshots/desktop.png) | [mobile.png](pages/02a-fiche-vue-ensemble/screenshots/mobile.png) |
| 03 | 2b | Fiche sportif · Profil | Coach | [pages/02b-fiche-profil](pages/02b-fiche-profil/specification.md) | [desktop.png](pages/02b-fiche-profil/screenshots/desktop.png) | [mobile.png](pages/02b-fiche-profil/screenshots/mobile.png) |
| 04 | 2c | Fiche sportif · Agenda | Coach | [pages/02c-fiche-agenda](pages/02c-fiche-agenda/specification.md) | [desktop.png](pages/02c-fiche-agenda/screenshots/desktop.png) | [mobile.png](pages/02c-fiche-agenda/screenshots/mobile.png) |
| 05 | 2d | Détail d’une séance | Coach (vue de ce que le sportif reçoit) | [pages/02d-detail-seance](pages/02d-detail-seance/specification.md) | [desktop.png](pages/02d-detail-seance/screenshots/desktop.png) | [mobile.png](pages/02d-detail-seance/screenshots/mobile.png) |
| 06 | 2e | Fiche sportif · Programme | Coach | [pages/02e-fiche-programme](pages/02e-fiche-programme/specification.md) | [desktop.png](pages/02e-fiche-programme/screenshots/desktop.png) | [mobile.png](pages/02e-fiche-programme/screenshots/mobile.png) |
| 07 | 2f | Fiche sportif · Objectifs | Coach | [pages/02f-fiche-objectifs](pages/02f-fiche-objectifs/specification.md) | [desktop.png](pages/02f-fiche-objectifs/screenshots/desktop.png) | [mobile.png](pages/02f-fiche-objectifs/screenshots/mobile.png) |
| 08 | 2g | Fiche sportif · Repères | Coach | [pages/02g-fiche-reperes](pages/02g-fiche-reperes/specification.md) | [desktop.png](pages/02g-fiche-reperes/screenshots/desktop.png) | [mobile.png](pages/02g-fiche-reperes/screenshots/mobile.png) |
| 09 | 2h | Fiche sportif · Disponibilités | Coach | [pages/02h-fiche-disponibilites](pages/02h-fiche-disponibilites/specification.md) | [desktop.png](pages/02h-fiche-disponibilites/screenshots/desktop.png) | [mobile.png](pages/02h-fiche-disponibilites/screenshots/mobile.png) |
| 10 | 2i | Fiche sportif · Notes | Coach | [pages/02i-fiche-notes](pages/02i-fiche-notes/specification.md) | [desktop.png](pages/02i-fiche-notes/screenshots/desktop.png) | [mobile.png](pages/02i-fiche-notes/screenshots/mobile.png) |
| 11 | 2j | Fiche sportif · Documents | Coach | [pages/02j-fiche-documents](pages/02j-fiche-documents/specification.md) | [desktop.png](pages/02j-fiche-documents/screenshots/desktop.png) | [mobile.png](pages/02j-fiche-documents/screenshots/mobile.png) |
| 12 | 2k | Fiche sportif · Historique | Coach | [pages/02k-fiche-historique](pages/02k-fiche-historique/specification.md) | [desktop.png](pages/02k-fiche-historique/screenshots/desktop.png) | [mobile.png](pages/02k-fiche-historique/screenshots/mobile.png) |

**Total : 12 pages, 24 écrans de référence.** Desktop capturé à 1280 px de large (cadre complet, 2×). Mobile capturé à 390 px de large (2×).

## Relations entre pages
- 01 Liste → clic sur une ligne → 2a (fiche, onglet Vue d’ensemble).
- 2a → 2k : même coque (sidebar + header + en-tête de fiche + barre d’onglets). Les onglets naviguent entre 2a, 2b, 2c, 2e…2k.
- 2c Agenda → clic sur une carte de séance → 2d Détail d’une séance (header « ← Inès Benali »).
- 2a : boutons « Modifier » des cartes → onglet correspondant (Profil, Repères, Objectifs, Disponibilités, Notes) ; « Agenda » → 2c ; « Voir tout » → 2k.

## Ordre des onglets de la fiche (validé)
Vue d’ensemble · Profil · Agenda · Programme · Objectifs · Repères · Disponibilités · Notes · Documents · Historique.

## Écrans absents de la planche (à ne pas inventer)
- Les pages 3 à 30 évoquées dans le brief **n’existent pas dans cette planche**. Aucun écran n’a été créé pour combler l’écart.
- États non dessinés : chargement (squelettes), erreur réseau, fiche introuvable, permissions refusées, toasts de succès. Voir `interactions.md` de chaque page : ils sont listés comme **« non déterminé par la maquette »**.
- Contenu de l’onglet Programme : seule la carte résumé est dessinée (le détail semaine par semaine renvoie à la page Programmes existante).
- Menus « ··· » (header et lignes de la liste) : déclencheurs dessinés, contenu du menu non dessiné.
- Captures d’états ouverts (menus déroulants ouverts) : non fournies en image ; leur style exact est dans les `source-extract.md` (blocs `role="listbox"`).
