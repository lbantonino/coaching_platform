# Recette des écrans « Programmes » (phase 6, 11/11/2026)

Prompt de la phase : « Lance toute la QA (14_QA), corrige les écarts, donne le rapport final : écrans
conformes, tests, écarts restants. » Rien n'est commité.

## 1. Méthode

- **Pixel (14_QA/PIXEL_PERFECT_QA.md)** : les 41 écrans d'application de `SCREEN_INVENTORY.json`
  capturés dans l'état le plus proche de la maquette (Chromium, 1280 px ou 390 px, facteur 1, thème
  clair comme les maquettes), mis côte à côte avec la référence, part de pixels différents mesurée
  (écart de plus de 40 sur un canal ; téléphone : barre d'état de 44 px retirée). Revue visuelle de
  chaque paire, puis correction des vrais écarts et nouvelle capture.
- **Accessibilité (ACCESSIBILITY_QA.md)** : axe-core (WCAG 2 A, AA, 2.1 AA, 2.2 AA) sur chaque écran, en
  clair et en sombre ; cibles tactiles du téléphone mesurées ; contrôles au clavier (menus « ··· »,
  fenêtres, segmentés, onglets, boutons nommés).
- **PDF (PDF_QA.md)** : les deux PDF du programme publié de 12 semaines d'Inès, lus par `pdfinfo`,
  `pdffonts`, `pdftotext`, et chaque lien suivi jusqu'à sa destination.
- **Cas de test (TEST_CASES.md)** : TC-01 à TC-18 (phase 4), suites complètes relancées.

## 2. Ce que disent les pourcentages (à lire avant le tableau)

Le seuil « ≤ 1 % » n'est atteignable sur aucun écran, et ce n'est pas un défaut d'intégration :
- les **données** diffèrent (maquettes : Inès Ben Ali, « Prépa HYROX Gand », coach Julien Mertens ;
  app : la graine et les programmes des tests) ;
- la **date** du serveur ne se fige pas : l'app est au 11/11, les maquettes vers le 3/11 (« En cours »,
  numéros de semaine) ;
- les **couleurs** suivent les jetons de l'app, pas les hex de la maquette (décision C-3) ;
- le rendu des polices varie.

Ce que le chiffre mesure honnêtement : l'ordre de grandeur (2 à 10 % : même mise en page, données
différentes ; au-delà : un état ou un contenu de fenêtre différent). La conformité se juge sur la revue
visuelle de chaque paire, colonne « Verdict ». Pour un vrai « ≤ 1 % », il faudrait une graine de recette
identique aux maquettes et une horloge du serveur figée (proposé, non fait).

## 3. Écrans

| Écran | Écart mesuré | Verdict |
|---|---|---|
| PRG-01 liste (ordinateur) | 7,4 % | Conforme. Filtres qui passent dessous plutôt que tronqués (onglet Archivés de la phase 4). |
| PRG-02 liste (téléphone) | 10,5 % | Conforme (icône de page et icône « Filtres » de la coquille de l'app). |
| PRG-03 vide | 2,4 % | Conforme. |
| PRG-04 sans résultat | 5,7 % | Conforme (texte générique, sans répéter le mot cherché). |
| PRG-05 modèles (ordinateur) | 5,8 % | Écart mineur : cartes de modèle 12 px plus hautes. |
| PRG-06 modèles (téléphone) | 8,1 % | Conforme (« Utiliser » et bouton + : décision phase 4). |
| WIZ-01 assistant, étape 3 | 5,5 % | Écart : date de début en champ natif ; phases sans cases proportionnelles ni « Le faire plus tard ». |
| WIZ-02 étape 1 (téléphone) | 13,7 % | Écart mineur : liste des sportifs dans un cadre qui défile. |
| WIZ-03 étape 2 (téléphone) | 14,5 % | Corrigé : « Musculation » tient sur sa carte. |
| WIZ-04 étape 3 (téléphone) | 15,8 % | Comme WIZ-01. |
| WIZ-05 étape 4 (téléphone) | 21,8 % | Écart mineur : aperçu un peu plus haut. |
| EDT-01 éditeur, menu ouvert | 7,4 % | Écart décidé : le sélecteur « Dans l'ordre / Jours fixes » sur la ligne de la semaine (demande du 10/11) fait passer la pastille de phase dessous. Colonne des semaines refaite le 11/11 (section 5). |
| EDT-02 modèle Coory | 5,8 % | Écart décidé : pas d'Aperçu, de PDF ni de « ··· » sur un modèle Coory (rien à prévisualiser, seule action : le dupliquer). |
| EDT-03 semaines (téléphone) | 10 % | Écart décidé : filtre de semaine (demande du 10/11). |
| EDT-04 semaine (téléphone) | 16,3 % | Conforme (sélecteur d'organisation visible sur téléphone). |
| EDT-05 séance (téléphone) | 14,2 % | Écart mineur : sous-titre « type · durée » au lieu du résumé écrit. |
| FIX-01 proposition des jours | 14,5 % | Corrigé : jours « Mar 17 » au lieu de « Mercr… ». Reste : la raison du jour proposé (« dispo le soir ») n'est pas écrite. |
| FIX-02 jours fixes (ordinateur) | 10,1 % | Écart : en-tête de semaine chargé, cartes à jour fixe sur deux lignes. |
| FIX-03 jours fixes (téléphone) | 9,2 % | Écart mineur : le pavé du jour de la carte choisie reste clair. |
| FIX-04 proposition (téléphone) | 37,7 % | Conforme (fenêtre différente par son contenu ; elle s'ouvre bien). |
| FIX-05 choisir le jour (téléphone) | 23,1 % | Corrigé : la date sous chaque jour, « Valider » toujours visible. |
| RUN-01 éditeur Running | 7,8 % | Corrigé : segment choisi encadré d'encre, un seul chevron par liste. |
| RUN-02 étapes (téléphone) | 10,4 % | Conforme (carte « Réglages de la séance », décision 3b). |
| RUN-03 zone de FC (téléphone) | 28 % | Corrigé (segmenté). |
| MUS-01 éditeur Musculation | 7,1 % | Corrigé (segmenté, durée en minutes). |
| MUS-02 exercices (téléphone) | 11 % | Conforme. |
| MUS-03 % du max (téléphone) | 18,8 % | Corrigé (segmenté). |
| HYR-01 éditeur Hyrox | 6 % | Conforme. Écarts mineurs : ordre des boutons de l'en-tête, « 1000 m » sans espace des milliers. |
| HYR-02 blocs (téléphone) | 11 % | Écart mineur : la poignée des blocs raccourcit « tours · repos… ». |
| HYR-03 simulation (téléphone) | 24 % | Corrigé : « ton sportif » au lieu de « de le sportif », segmenté. |
| TAB-01 onglet Programme | 8,5 % | Conforme (détail de la séance à droite : décision du 10/11). |
| TAB-02 onglet Programme (téléphone) | 10 % | Conforme. |
| TAB-03 sans programme | 5,8 % | Conforme. |
| TAB-04 sans programme (téléphone) | 16,1 % | Corrigé : « : » insécable, boutons de 50 px. |
| AGD-01 agenda, séance dépliée | 7,2 % | Conforme. |
| AGD-02 agenda (téléphone) | 11,1 % | Corrigé : bascule et navigation pleine largeur. Écart : cartes en colonne (règles des cartes validées le 10/11), carte du programme au-dessus. |
| AGD-03 jours fixes | 6,3 % | Conforme. |
| AGD-04 jours fixes (téléphone) | 10,2 % | Comme AGD-02. |
| PUB-01 publier | 11,3 % | Corrigé : avertissements regroupés par genre. |
| PUB-02 publier (téléphone) | 34,8 % | Corrigé : boutons de 48 px (ils s'écrasaient à 22 px). |
| PDF-01 à PDF-10 | (voir § 6) | Conformes à la structure ; données différentes. |

## 4. Accessibilité

- axe-core : **0 violation** sur les 41 écrans en clair après corrections, et sur 6 écrans contrôlés en
  sombre. Corrigés : gris discret sur la lavande et la piste des onglets (4,2 à 4,5:1, passé au gris
  « muted ») ; couleurs de discipline en texte sur leur fond teinté en sombre (passées aux jetons
  `--run-text`, `--strength-text`) ; « ··· » des blocs teintés.
- Cibles tactiles : compteurs ± (Running, Hyrox) et flèches de semaine de l'agenda portés à 44 px de
  haut (`tap-44`) ; les boutons « Déplier » de 36 px couvrent en réalité toute la carte.
- Clavier : menus « ··· » (aria-haspopup, Entrée, ↑ ↓, Échap, focus rendu au bouton), fenêtres
  (`<dialog>` modal natif : fond inerte, Tab ne sort jamais vers la page, Échap), segmentés (boutons
  radio natifs groupés dans un `fieldset` nommé : modèle HTML standard, flèches natives), onglets
  (navigation nommée, page active marquée), aucun bouton icône sans nom : **tout passe**.
- Restent : PDF non balisé (React-PDF ne le permet pas ; langue fr-FR bien déclarée).

## 5. Corrigé pendant la recette

- Liste déroulante à **deux chevrons superposés** (`SelectField`, `DlgSelect`, champs de la bienvenue :
  leur chevron plus celui de la règle globale du 29/10) : les listes qui dessinent le leur en sont
  exclues (`data-chevron="own"`).
- Fenêtre **Publier** sur téléphone : boutons qui s'écrasaient ; avertissements regroupés
  (« 24 étapes en zone de FC sans plage en bpm »).
- **Segment choisi** des formulaires des éditeurs : anneau d'encre de 1,5 px comme la maquette.
- **Choix du jour** : la date sous chaque jour ; « Valider / Annuler » collés en bas de la feuille.
- **Durées des séances en minutes** partout (« ≈ 60 min », plus « 1 h ») : règle du Running étendue.
- **« ton sportif »** quand il n'y a pas de sportif (modèle) : plus de « de le sportif ».
- **Tableau de bord** : « Programmes en cours » montre d'abord les programmes en cours, puis à venir
  (les « à venir » passaient devant et pouvaient cacher tous les programmes en cours).
- Agenda du téléphone : bascule « Semaine / Toutes les semaines » et navigation pleine largeur.
- Assistant : « Musculation » entière sur téléphone ; filtres de la liste qui passent à la ligne.
- **Demande d'Antonino du 11/11** : menu « ··· » d'une phase **coupé** par la colonne des semaines
  (il s'ouvre maintenant dans la couche supérieure du navigateur, posé sur son bouton, au-dessus s'il
  manque de place) ; **colonne des semaines aérée** (une section par phase séparée par un filet, nom
  de la phase en clair avec sa plage à part, « S4 » pour une semaine seule, lignes de 44 px, date en
  gris lisible, colonne de 212 px).
- Test SQL des modèles qui ne passait que sur une base vide (il comptait les modèles de démonstration).

## 6. PDF

| Contrôle | Agenda | Fiches et repères |
|---|---|---|
| Pages | 13 (sommaire + 12 semaines) ✓ | 10 (sommaire + fiches, « (suite) » compris) ✓ |
| Format | A4 portrait 595 × 842 pt ✓ | ✓ |
| Polices | Plus Jakarta Sans intégrée (5 graisses) ✓ ; Helvetica référencée par le moteur mais aucun texte n'y est écrit | idem |
| Texte sélectionnable | ✓ | ✓ |
| Métadonnées | titre, auteur (le coach), Coory, langue fr-FR ✓ | ✓ |
| Liens | sommaire → 12 semaines ; ‹ / sommaire / › sur chaque page, ‹ vers le sommaire en semaine 1, pas de › en semaine 12 ✓ | sommaire → fiches ; ‹ / sommaire / › ✓ |
| Signets | 13 ✓ | 10 ✓ |
| Liens externes, jetons | aucun ✓ | aucun ✓ |
| Visuel | structure conforme (en-tête, navigation, cartes, pied « Page 3 sur 13 ») | conforme ; écart mineur : l'en-tête de chaque semaine d'une fiche affiche la durée au lieu du nom de la séance |

Lecteurs (`12_PDF_SYSTEM/compatibility-tests/COMPATIBILITY_MATRIX.md`) : **à tester par Antonino**
sur Aperçu, Acrobat, Chrome, iPhone (Fichiers) et Android (liens internes et signets sont du PDF
standard).

## 7. Tests

- Unitaires : 411 / 411. Base de données : 510 / 510. Lint, types, format : propres.
- Parcours (suite complète, 228) : 194 réussis, 22 ignorés, 12 échecs. Les 12 sont la comptabilité et le
  paiement des séances : ils attendent un coach soumis à la TVA (21 %, valeur de la graine), et
  l'Organisation Démo A est à 0 % dans la base de développement. Ce n'est pas lié aux programmes ; à
  décider par Antonino (remettre 21 %, ou rendre ces tests indépendants de ce réglage).
- TC-01 à TC-18 couverts (TC-09 « à faire » : il attend l'espace sportif).

## 8. Écarts restants (à décider ou plus tard)

1. Date de début de l'assistant en champ natif (format de la date selon le navigateur) au lieu d'un
   champ « lun. 26 oct. 2026 » ; phases de l'assistant sans cases proportionnelles.
2. Cartes de l'agenda sur téléphone en colonne (la maquette les met en ligne : numéro à gauche,
   chevron à droite) : les règles des cartes ont été validées le 10/11, à rouvrir seulement si tu veux.
3. En-tête de semaine de l'éditeur chargé depuis que le sélecteur est sur la même ligne (demande du
   10/11) : la pastille de phase passe dessous à 1280 px.
4. Raison du jour proposé dans la proposition des jours fixes ; cartes à jour fixe sur deux lignes.
5. Petits écarts : cartes de modèle un peu hautes, espace des milliers (« 1 000 m »), ordre des
   boutons de l'en-tête des éditeurs de séance, poignée des blocs Hyrox sur téléphone.
6. Ce qui attend l'espace sportif : TC-09, l'aperçu côté sportif, « x faites sur N ».
7. Pour un diff « ≤ 1 % » réel : graine de recette identique aux maquettes et horloge figée.
