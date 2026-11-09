# Audit de la planche « Coory Programmes Planche »

Date : 9 novembre 2026 · Fichier source : `13_HTML_PREVIEWS/source/Coory Programmes Planche.dc.html` (ORIGINAL_SOURCE)

> Note : le nom exact de la planche est **« Coory Programmes Planche »** (le brief l’écrit « Cooryy Programme Planche »).

## 1. Méthode
- Lecture du code source réel de chaque maquette (les maquettes sont du HTML/CSS inline + logique JS ; les valeurs sont donc **EXACT**).
- Inventaire automatique des écrans (attribut `data-screen-label`) : **50 rendus** (dont 2 doublons PDF dans le lecteur téléphone).
- Captures prises à 1× (écrans) et 2× (pages PDF) directement depuis la planche.

## 2. Ordre de la planche (source de vérité)
01 Page Programmes → 02 Créer un programme → 03 Éditeur de programme → 03b Fixer les jours → 04-06 Éditeurs de séance → 07 Onglet Programme → 2c Agenda du sportif (séance dépliée) → 08 Publier → 09 PDF du programme.

## 3. Inventaire des écrans finaux
| ID | Écran | Variante | Viewport | ID planche | Statut | Capture |
|---|---|---|---|---|---|---|
| PRG-01 | 01 Page Programmes | Liste remplie | Desktop 1280×820 | 1a | Finale | `03_PROGRAMMES_PAGE/screenshots/PRG-01-1a-desktop-liste.png` |
| PRG-02 | 01 Page Programmes | Liste remplie | Mobile 390×844 | 1b | Finale | `03_PROGRAMMES_PAGE/screenshots/PRG-02-1b-mobile-liste.png` |
| PRG-03 | 01 Page Programmes | Aucun programme (empty state) | Desktop 1280×820 | 1c | Finale | `03_PROGRAMMES_PAGE/screenshots/PRG-03-1c-desktop-vide.png` |
| PRG-04 | 01 Page Programmes | Recherche sans résultat | Mobile 390×844 | 1d | Finale | `03_PROGRAMMES_PAGE/screenshots/PRG-04-1d-mobile-sans-resultat.png` |
| PRG-05 | 01 Page Programmes | Onglet Modèles | Desktop 1280×820 | 1e | Finale | `03_PROGRAMMES_PAGE/screenshots/PRG-05-1e-desktop-modeles.png` |
| PRG-06 | 01 Page Programmes | Onglet Modèles | Mobile 390×844 | 1f | Finale | `03_PROGRAMMES_PAGE/screenshots/PRG-06-1f-mobile-modeles.png` |
| WIZ-01 | 02 Créer un programme | Assistant interactif (capturé à l’étape 3) | Desktop 1280×820 | 2a | Finale | `04_CREATE_WIZARD/screenshots/WIZ-01-2a-desktop-etape3.png` |
| WIZ-02 | 02 Créer un programme | Étape 1 · Pour qui | Mobile 390×844 | 2c | Finale | `04_CREATE_WIZARD/screenshots/WIZ-02-2c-mobile-etape1.png` |
| WIZ-03 | 02 Créer un programme | Étape 2 · Objectif + façon de viser | Mobile 390×844 | 2d | Finale | `04_CREATE_WIZARD/screenshots/WIZ-03-2d-mobile-etape2.png` |
| WIZ-04 | 02 Créer un programme | Étape 3 · Calendrier + phases | Mobile 390×844 | 2e | Finale | `04_CREATE_WIZARD/screenshots/WIZ-04-2e-mobile-etape3.png` |
| WIZ-05 | 02 Créer un programme | Étape 4 · Point de départ | Mobile 390×844 | 2f | Finale | `04_CREATE_WIZARD/screenshots/WIZ-05-2f-mobile-etape4.png` |
| EDT-01 | 03 Éditeur de programme | Brouillon d’un programme publié · menu ··· ouvert | Desktop 1280×860 | 1a | Finale | `05_PROGRAM_EDITOR/screenshots/EDT-01-1a-desktop-menu-ouvert.png` |
| EDT-02 | 03 Éditeur de programme | Modèle Coory ouvert · lecture seule | Desktop 1280×860 | 1g | Finale | `05_PROGRAM_EDITOR/screenshots/EDT-02-1g-desktop-modele-lecture-seule.png` |
| EDT-03 | 03 Éditeur de programme | 1. Les semaines (par phase) | Mobile 390×844 | 1b | Finale | `05_PROGRAM_EDITOR/screenshots/EDT-03-1b-mobile-semaines.png` |
| EDT-04 | 03 Éditeur de programme | 2. Une semaine | Mobile 390×844 | 1c | Finale | `05_PROGRAM_EDITOR/screenshots/EDT-04-1c-mobile-semaine.png` |
| EDT-05 | 03 Éditeur de programme | 3. Une séance | Mobile 390×844 | 1d | Finale | `05_PROGRAM_EDITOR/screenshots/EDT-05-1d-mobile-seance.png` |
| FIX-01 | 03b Fixer les jours | Passer en jours fixes · proposition | Desktop 1280×860 (modale) | Ja | Finale | `05_PROGRAM_EDITOR/screenshots/FIX-01-Ja-desktop-proposition.png` |
| FIX-02 | 03b Fixer les jours | Semaine en jours fixes · panneau jour | Desktop 1280×860 | Jb | Finale | `05_PROGRAM_EDITOR/screenshots/FIX-02-Jb-desktop-editeur-jours.png` |
| FIX-03 | 03b Fixer les jours | Semaine en jours fixes | Mobile 390×844 | Jc | Finale | `05_PROGRAM_EDITOR/screenshots/FIX-03-Jc-mobile-semaine.png` |
| FIX-04 | 03b Fixer les jours | Proposition (feuille) | Mobile 390×844 | Jd | Finale | `05_PROGRAM_EDITOR/screenshots/FIX-04-Jd-mobile-proposition.png` |
| FIX-05 | 03b Fixer les jours | Choisir le jour (feuille) | Mobile 390×844 | Je | Finale | `05_PROGRAM_EDITOR/screenshots/FIX-05-Je-mobile-choisir-jour.png` |
| RUN-01 | 04 Éditeur séance Running | Étape sélectionnée · cible allure · menu ··· ouvert | Desktop 1280×900 | 4a | Finale | `06_RUNNING_EDITOR/screenshots/RUN-01-4a-desktop.png` |
| RUN-02 | 04 Éditeur séance Running | Étapes | Mobile 390×844 | 4b | Finale | `06_RUNNING_EDITOR/screenshots/RUN-02-4b-mobile-etapes.png` |
| RUN-03 | 04 Éditeur séance Running | Modifier une étape · zone de FC | Mobile 390×844 (feuille) | 4c | Finale | `06_RUNNING_EDITOR/screenshots/RUN-03-4c-mobile-zone-fc.png` |
| MUS-01 | 05 Éditeur séance Musculation | Exercice sélectionné · charge en kg | Desktop 1280×1093 | 5a | Finale | `07_STRENGTH_EDITOR/screenshots/MUS-01-5a-desktop.png` |
| MUS-02 | 05 Éditeur séance Musculation | Exercices | Mobile 390×844 | 5b | Finale | `07_STRENGTH_EDITOR/screenshots/MUS-02-5b-mobile-exercices.png` |
| MUS-03 | 05 Éditeur séance Musculation | Régler les séries · en % du max | Mobile 390×844 (feuille) | 5c | Finale | `07_STRENGTH_EDITOR/screenshots/MUS-03-5c-mobile-pourcentage.png` |
| HYR-01 | 06 Éditeur séance Hyrox | Bloc circuit sélectionné · charges du coach | Desktop 1280×1301 | 6a | Finale | `08_HYROX_EDITOR/screenshots/HYR-01-6a-desktop.png` |
| HYR-02 | 06 Éditeur séance Hyrox | Blocs | Mobile 390×844 | 6b | Finale | `08_HYROX_EDITOR/screenshots/HYR-02-6b-mobile-blocs.png` |
| HYR-03 | 06 Éditeur séance Hyrox | Simulation de course · charges officielles | Mobile 390×844 (feuille) | 6c | Finale | `08_HYROX_EDITOR/screenshots/HYR-03-6c-mobile-simulation.png` |
| TAB-01 | 07 Fiche sportif · onglet Programme | Avec programme | Desktop 1280×801 | 7a | Finale | `09_ATHLETE_PROGRAM_TAB/screenshots/TAB-01-7a-desktop.png` |
| TAB-02 | 07 Fiche sportif · onglet Programme | Avec programme | Mobile 390×1098 (page longue) | 7b | Finale | `09_ATHLETE_PROGRAM_TAB/screenshots/TAB-02-7b-mobile.png` |
| TAB-03 | 07 Fiche sportif · onglet Programme | Vide | Desktop 1280×800 | 7c | Finale | `09_ATHLETE_PROGRAM_TAB/screenshots/TAB-03-7c-desktop-vide.png` |
| TAB-04 | 07 Fiche sportif · onglet Programme | Vide | Mobile 390×844 | 7d | Finale | `09_ATHLETE_PROGRAM_TAB/screenshots/TAB-04-7d-mobile-vide.png` |
| AGD-01 | 2c Fiche sportif · Agenda | Dans l’ordre · séance 2 dépliée | Desktop 1280×1173 | 1a (section 2c) | Finale | `10_ATHLETE_AGENDA/screenshots/AGD-01-1a-desktop-dans-l-ordre.png` |
| AGD-02 | 2c Fiche sportif · Agenda | Dans l’ordre · séance dépliée | Mobile 390×1708 (page longue) | 1b (section 2c) | Finale | `10_ATHLETE_AGENDA/screenshots/AGD-02-1b-mobile-dans-l-ordre.png` |
| AGD-03 | 2c Fiche sportif · Agenda | Jours fixes (option) · Musculation + Hyrox | Desktop 1280×1347 | 2a (section 2c) | Finale | `10_ATHLETE_AGENDA/screenshots/AGD-03-2a-desktop-jours-fixes.png` |
| AGD-04 | 2c Fiche sportif · Agenda | Jours fixes (option) | Mobile 390×1963 (page longue) | 2b (section 2c) | Finale | `10_ATHLETE_AGENDA/screenshots/AGD-04-2b-mobile-jours-fixes.png` |
| PUB-01 | 08 Publier | Confirmation + toast | Desktop 1280×820 | 8a | Finale | `11_PUBLISH/screenshots/PUB-01-8a-desktop.png` |
| PUB-02 | 08 Publier | Feuille de confirmation | Mobile 390×844 | 8b | Finale | `11_PUBLISH/screenshots/PUB-02-8b-mobile.png` |
| PDF-01 | 09 PDF 1 · Agenda du programme | Page semaine 2 (page 3/13) | A4 620×877 CSS (capture 2×) | 9a | Finale | `12_PDF_SYSTEM/screenshots/PDF-01-agenda-semaine2.png` |
| PDF-09 | 09 PDF 1 · Agenda du programme | Sommaire (page 1/13) | A4 620×877 (2×) | 9a | Finale | `12_PDF_SYSTEM/screenshots/PDF-09-agenda-sommaire.png` |
| PDF-10 | 09 PDF 1 · Agenda du programme | Semaine 7 · course (page 8/13) | A4 620×877 (2×) | 9a | Finale | `12_PDF_SYSTEM/screenshots/PDF-10-agenda-semaine7-course.png` |
| PDF-08 | 09 PDF 2 · Fiches et repères | Sommaire (page 1/5) | A4 620×877 (2×) | 9b | Finale | `12_PDF_SYSTEM/screenshots/PDF-08-fiches-sommaire.png` |
| PDF-02 | 09 PDF 2 · Fiches et repères | Full Body A (page 2/5) | A4 620×877 (2×) | 9b | Finale | `12_PDF_SYSTEM/screenshots/PDF-02-fiches-full-body-a.png` |
| PDF-05 | 09 PDF 2 · Fiches et repères | Full Body B (page 3/5) | A4 620×877 (2×) | 9b | Finale | `12_PDF_SYSTEM/screenshots/PDF-05-fiches-full-body-b.png` |
| PDF-06 | 09 PDF 2 · Fiches et repères | Workload Hyrox (page 4/5) | A4 620×877 (2×) | 9b | Finale | `12_PDF_SYSTEM/screenshots/PDF-06-fiches-workload-hyrox.png` |
| PDF-07 | 09 PDF 2 · Fiches et repères | Allures (page 5/5) | A4 620×877 (2×) | 9b | Finale | `12_PDF_SYSTEM/screenshots/PDF-07-fiches-allures.png` |
| PDF-03 | 09 PDF sur téléphone | PDF 1 · sommaire dans un lecteur | Mobile 390×844 | 9c | Finale | `12_PDF_SYSTEM/screenshots/PDF-03-9c-telephone-sommaire.png` |
| PDF-04 | 09 PDF sur téléphone | PDF 2 · Workload Hyrox dans un lecteur | Mobile 390×844 | 9d | Finale | `12_PDF_SYSTEM/screenshots/PDF-04-9d-telephone-workload.png` |

**Attention aux identifiants planche** : plusieurs sections réutilisent « 1a, 1b… » (01, 03 et 2c). Utilise toujours l’**ID stable** (PRG-01, EDT-01…) de ce dossier.

## 4. Statut de validation
- Toutes les entrées ci-dessus sont **la dernière version présente sur la planche**. Le client a validé explicitement : la structure des 9 écrans (« Tes 9 écrans me conviennent »), les ajouts du 9 nov. (modèles, phases, façon de viser), 03b Jours fixes, les PDF interactifs 9a-9d.
- **À vérifier avec le client** (non explicitement validés après la dernière passe) : passe de lisibilité typographique du 9 nov. (menus déroulants à la place des rangées de boutons) — considérée comme validée par défaut car demandée par le client.

## 5. Ce qui n’existe PAS dans la planche (ne pas inventer)
| Sujet | Statut | Recommandation |
|---|---|---|
| Éditeur de séance **hybride** (blocs de disciplines différentes dans une même séance) | NON DESSINÉ | Proposition dans `FUNCTIONAL_SPECIFICATIONS.md §7`, à valider avant dev |
| Tablette | NON DESSINÉ | Règles PROPOSED dans `12_RESPONSIVE` |
| Statuts séance manquée / reportée / annulée | NON DESSINÉ | Seuls « faite / prochaine / à faire » existent (07) |
| Placement d’une séance flexible par le sportif dans son calendrier | NON DESSINÉ | Le sportif fait « dans l’ordre, au jour choisi » ; il peut déplacer une séance à jour fixe si autorisé (03b, règle 6) |
| Loading / erreur réseau / erreur de validation | NON DESSINÉ | États PROPOSED dans `02_COMPONENTS/COMPONENT_INVENTORY.md` |
| Modale « Utiliser un modèle » (choix du sportif et des dates) | NON DESSINÉ | Le flux passe par l’assistant 02 étape 4 « Partir d’un modèle » |
| Envoi automatique des PDF chaque semaine | RETIRÉ par le client (9 nov.) | Ne pas développer. Envoi du programme complet uniquement |
| Graphiques de séance (barres, courbes, déroulé) | RETIRÉS par le client | **Interdit** : aucune visualisation graphique de séance |
