# Journal d'implémentation — source de vérité sur l'état réel du code

**État initial du package V1.1 le 18/10/2026** : spécifications techniques et de produit actualisées ; **aucun code métier, base de données, test ou intégration de l'application n'est créé ni vérifié par ce dossier**. L’utilisateur peut déjà avoir lancé Claude Code sur son Mac : inspecter d’abord son dépôt local pour établir l’état réel. Ne jamais marquer une tâche terminée au motif qu'elle est documentée.

## Statut des phases
| Phase | État | Tests exécutés | Preuve |
|---|---|---|---|
| P0 Bootstrap | **Fait** : P0-01 à P0-06 ; design system Coory rouge + logo + thème clair (22/10) | lint, typecheck, format, build, db:reset, test (Vitest 11/11), test:e2e 27/27, captures | Sessions du 19 et 20/10/2026 ; ADR docs/adr/0001 |
| P1 Auth/organisations | **Fait** : P1-01 à P1-05 (connexion, mot de passe oublié, organisations, RLS, garde-fous coach/sportif/admin, invitation sportif) ; vérification d'e-mail sans objet tant qu'il n'y a pas d'inscription | db:test 54/54, test:e2e 27/27 (x3 stables), check, build | Sessions du 19 et 20/10/2026 |
| P2 CRM | **Fait** pour tout ce qui ne dépend pas des programmes : P2-01 (liste, recherche, archivage) ; P2-02 parties 1 à 4 (identité, contact, profil, objectifs et compétitions, disponibilités et contraintes physiques avec accord, records personnels : OPEN-01 terminé) ; P2-03 (repères datés, calcul des allures, notes) ; P2-04 (fiche à onglets, historique, graphique des repères) ; P2-05 (agenda : séances encadrées + compétitions, D-27). Attendent P4 à P6 : historique des programmes, KPI d'activité du tableau de bord, agenda du sportif. Ouvert : OPEN-18 (séances). Défaut du formulaire « Ajouter une mesure » corrigé le 22/10 (compteur attempt, test Playwright ajouté) | test 125/125, db:test 186/186, test:e2e 88/88 + 4 ignorés (après db:reset) | Sessions du 20 et 22/10/2026 |
| P3 Bibliothèque | **En cours** : P3-01 fait le 30/10 (D-75 : catalogue commun Musculation / Cardio / Hyrox, fiche, favoris ; D-76 : exercices du coach) ; Mobilité visible le 31/10 ; P3-02 à P3-06 à faire | db:test 434/434, test 278/278, test:e2e bibliothèque 8/8 (31/10) ; suite complète du 30/10 : 169 + 13 ignorés (2 échecs liés à la date, hors bibliothèque) | Sessions du 30 et 31/10/2026 |
| P4 Éditeur multi-sports | À faire | Aucun | - |
| P5 Publications/PDF | À faire | Aucun | - |
| P6 Sportif/feedback | À faire | Aucun | - |
| P7 Communication | À faire | Aucun | - |
| P8 SaaS commercial | À faire | Aucun | - |

**Depuis le 23/10/2026 (D-32)**, la construction suit les 7 étapes du prompt Claude Design
(`COORY_PROMPT_CLAUDE_CODE.md`) ; le tableau des phases ci-dessus reste la référence de contenu.

| Étape du prompt | État |
|---|---|
| 1. Jetons + composants | **Fait** le 23/10 (vitrine `/design/composants`, en développement seulement) |
| 2. Coquilles de navigation | **Fait** le 23/10 (coach, sportif, admin, entrée, pages légales) |
| 3. Pages d'entrée | **Fait** le 23/10 (connexion, inscription, vérification, bienvenue, mot de passe, invitation, erreurs, pages légales) |
| 4. Espace coach | **En cours** : 4a partie 1 faite le 23/10 (tableau de bord, agenda interactif, détail de séance, premières pages Séances, Tâches, Messages et Facturation, D-35) ; liste des sportifs faite le 24/10 ; nouveau sportif complet le 28/10 (D-54) ; paramètres complets le 28/10 (D-57), ouverts en fenêtre depuis le menu du compte (D-58) : 4a terminée ; outils terminés le 28/10 (D-59 à D-62 : Tâches, Documents, Notifications, Recherche) ; puis 4b à 4g |
| 5. Espace sportif | À faire |
| 6. Administration | À faire |
| 7. Recette finale | À faire |

## Dernière session
- Date : 2026-10-23
- Objectif : étapes 1 à 3 du prompt Claude Design, puis étape 4a partie 1 (tableau de bord et agenda, retouchés en direct avec Antonino).

### Mobilité visible, consignes Hyrox de Coory, maquettes de la fiche (D-75, suite)
```
Date : 2026-10-31
Fait : curation/bibliotheque.json : Mobilité visible (88 exercices RepDB avec images et consignes ; les
  20 créations Coory de mobilité sans contenu restent masquées) ; curation/contenu-coory.json : les 6
  consignes et les muscles principaux d'Antonino pour sled-pull, burpee-broad-jump et
  sandbag-walking-lunge, mot pour mot (le script refuse une clé qui n'est pas un exercice du kit Coory
  et un code de muscle inconnu ; « Pectoraux » = code de groupe chest) ; catalogue maître régénéré (693
  visibles, 54 masqués, identifiants inchangés) ; 103 images RepDB de mobilité téléchargées ; migration
  20261030100100_catalogue_exercices régénérée sur place (rien n'est déployé). Tests adaptés : 31 et 32
  (693 visibles, 88 en mobilité, + un test des 6 consignes et des muscles), library.spec (exercice masqué =
  sled-pull-seated). Fiche : 5 maquettes TEMPORAIRES (?maquette=1 à 5 ; la 4 = la 3 sans onglets ; la 5 = « scène du
  mouvement » sans cartes, début et fin qui alternent, movement-stage.tsx, BackLink variant icon ; [cle]/maquettes.tsx et
  sheet-tabs.tsx) en attente du choix d'Antonino ; la fiche par défaut est inchangée.
Tests : pgTAP 434/434 ; Vitest 278/278 ; Playwright library + coach-exercises 8/8 ; lint et format OK ;
  captures téléphone et ordinateur, sombre et clair (Sled pull ; Back squat avec images masquées).
Suite : choix de la maquette, puis appliquer la retenue et supprimer les deux autres.
```

### « Créer un exercice » pour le coach (D-76)
```
Date : 2026-10-30 (soir)
Fait : migration 20261030120000_exercices_du_coach (video_url https ; droits par colonne + RLS
  d'organisation sur exercises ; contrainte : ligne d'organisation = source coach, sans clé ni donnée
  RepDB, photo dans org/<org>/ ; bucket privé exercise-images de 5 Mo et ses 3 politiques).
  domain/exercises/coach-exercise.ts (formulaire, lien vidéo, plateforme, chemin de la photo) ;
  groupes musculaires utilisables comme muscles ; checkPhoto(maxBytes) ; features/exercises/
  coach-actions.ts (créer, modifier, supprimer) ; queries : catalogue + exercices de l'organisation,
  fiche par clé ou identifiant ; route /exercices/images/[exerciseId] ; pages /coach/bibliotheque/nouveau
  (?variante=) et /[cle]/modifier ; exercise-form.tsx (photo réduite à 1 200 px dans le navigateur) ;
  fiche : Mon exercice, Modifier, Supprimer, Créer ma variante, Voir la vidéo ; liste : Créer un
  exercice, filtre Mes exercices, Mobilité visible si le coach en a ; lien retour : jamais vers /nouveau.
Tests : lint et format OK ; Vitest 278/278 (coach-exercise 11) ; pgTAP 433/433 (32_exercices_du_coach
  16, 31_bibliotheque adapté) ; Playwright : 169 réussis + 13 ignorés ; library.spec 2 échecs dus à un
  exercice de démonstration laissé par mes captures (base remise à zéro, 8/8 ensuite avec
  coach-exercises.spec) ; athlete-overview 2 échecs liés à la date (30/10) ; captures téléphone et
  ordinateur ; db:reset OK.
Suite : revoir le design de la fiche d'un exercice (demande d'Antonino), puis « Envoyer au sportif ».
```

### Bibliothèque d'exercices (D-75, P3-01)
```
Date : 2026-10-30
Préparation (T0, hors app) : resources/exercise-library (kit d'Antonino + RepDB), scripts/build-master-catalog.mjs,
  décisions dans curation/, livrables dans catalog/ (catalogue maître 747 exercices, doublons, séances types,
  à valider, illustrations, rapport RAPPORT_T0.md). Noms et consignes RepDB traduits ; tags médicaux retirés.
Fait : migration 20261030100000_bibliotheque_exercices (exercises : catalogue commun en lecture seule,
  prête pour les exercices d'organisation ; exercise_favorites par personne ; RLS) et
  20261030100100_catalogue_exercices (générée par scripts/catalog-to-sql.mjs : 605 visibles = Musculation 580,
  Cardio 17, Hyrox 8 ; 142 masqués = mobilité, course, créations sans contenu, 2 variantes de Sled pull). Images :
  scripts/catalog-images.mjs -> public/exercises/<clé>/<pose>.webp (1 089 RepDB, 8 Hyrox d'Antonino
  converties). domain/exercises (vocabulary, library : recherche
  sans accents FR/EN/alias, filtres, ordre des stations, filtres dans l'adresse) ; features/exercises
  (queries, actions : favori) ; /coach/bibliotheque (rubriques, recherche, muscle, matériel, favoris,
  30 par 30, mention RepDB) et /coach/bibliotheque/[cle] (images, muscles et matériel, consignes, mention ; les
  réglages de séance restent en base pour la création de programme) ; components/blocks exercise-image (tuile claire --illustration, remplacement) et
  favorite-button (tuile --illustration = bleu des images RepDB, #daf1fd) ; menu : la fiche allume Bibliothèque ; resources/ exclu de lint et Prettier.
Tests : check OK ; Vitest 267/267 (exercise-library 11) ; pgTAP 417/417 (31_bibliotheque 16) ;
  Playwright 167 réussis + 13 ignorés, 2 échecs hors bibliothèque (athlete-overview attend
  « Sam 31 10:00 », l'app écrit « Demain 10:00 » le 30/10) ; library.spec 4/4 ; captures téléphone et
  ordinateur, sombre et clair ; db:reset OK.
Reste : relecture des traductions par un coach ; consignes des 3 exercices Hyrox Coory visibles ; « Créer un exercice » (image importée, lien vidéo) ; lier les séances aux
  exercices (éditeur, P4).
```

### Dépenses et résultat (D-73) ; en-têtes de page et Facturation côte à côte (D-74)
```
Date : 2026-10-29
Fait : migration 20261029220000_depenses (expense_categories avec couleur, 7 de départ par trigger ;
  coach_expenses TVAC + taux, devise par trigger, répétition mensuelle et fin, clé composée vers la
  catégorie ; RLS membres ; private.next_monthly_date ; change_organization_currency étendu : dépenses
  à venir converties, dépense mensuelle en cours coupée). domain/billing/expenses.ts (expenseDates,
  parseExpenseForm) ; accounting.ts : dépenses, résultat HTVA ou TVAC (ResultBasis) ;
  expense-queries / expense-actions (créer, supprimer, arrêter, catégories) ; isVatSubject ;
  CategoryManager partagé (components/blocks) ; DeleteMoreMenu « stop » ; comptabilite/expense-sheet,
  bar-chart (barres Gagné / Dépensé) ; page Comptabilité en widgets (rangées à hauteur égale, liste
  paiements / dépenses ?liste=). Seed : 3 dépenses de démo inventées.
  D-74 : PageHeader unique (une ligne, PageIcon d'après le menu, titre 26 px, pas de phrase sur
  ordinateur sauf page de détail ; titre caché sur téléphone hors page de détail) ; barre mobile :
  AssistantButton ; Facturation en grille (2 × lg:col-span-6).
Tests : check OK ; Vitest 256/256 ; pgTAP 401/401 (30_depenses 10) ; Playwright 165 réussis +
  13 ignorés (dépense mensuelle : créer, arrêter, supprimer) ; captures téléphone et ordinateur.
Suite : point 5, éditeur de programmes (étude + maquettes), ou modifier une dépense.
```

### Sélection en jaune (D-71) ; Comptabilité : graphique et tableau (D-72)
```
Date : 2026-10-29
Fait : D-71, jetons --selected / --selected-hover (tokens.css, globals.css) ; navItemClass,
  chipActiveClass, segmented (radio et liens), page-tabs, theme-choice, checkboxChipClass, sections
  des Paramètres, menu du compte, pastilles de la fiche sportif : gris -> jaune, sans contour.
  D-72, domain/billing/accounting.ts (periodOf, accountingPeriods, accountingRows, totalRow,
  periodLabel, shareOf) ; jetons --chart-1 à 4 validés (validate_palette.js, sombre et clair, paires
  voisines de l'anneau) ; comptabilite/donut-chart.tsx (anneau SVG, survol et légende au clavier) ;
  page Comptabilité : Semaine / Mois / Année (?vue=), période choisie (?periode=), carte Répartition,
  Tableau de comptabilité (colonne fixe sur téléphone, ligne Total), filtres des paiements gardés.
Tests : check OK ; Vitest 247/247 (accounting 7) ; Playwright 163 réussis + 13 ignorés (tableau et
  graphique) ; captures téléphone et ordinateur, sombre et clair.
Suite : dépenses et résultat (proposé), sinon point 5 éditeur de programmes.
```

### Changement de devise, international étape 2 (D-70)
```
Date : 2026-10-29
Fait : migration 20261029200000_changement_de_devise (table organization_currency_changes, lecture
  par les membres, aucune écriture directe ; fonction change_organization_currency, propriétaire
  seulement, une transaction : séances qui ont encore des dates, brouillons sans paiement, prix par
  défaut convertis au taux saisi ; organisation passée dans la nouvelle devise ; historique).
  money.ts : parseExchangeRate, makeConverter (taux direct, inverse ou en chaîne), describeTotal
  (« ≈ » + détail par devise) ; paymentTotals, monthActivity et plannedIncome acceptent un
  convertisseur et comptent par devise ; currency-queries.ts (historique, getConverter) ; tableau
  de bord, Comptabilité et Facturation : totaux convertis ; Paramètres : « Changer de devise »
  (currency-change-sheet.tsx : devise, taux, aperçu converti / reste, confirmation) et historique.
Tests : check OK ; Vitest 240/240 ; pgTAP 391/391 (29_changement_de_devise : 14 tests) ;
  Playwright 161 réussis + 13 ignorés (coach inscrit en euros qui passe en francs suisses) ;
  captures téléphone (sombre) et ordinateur (clair).
Limites : taux saisi par le coach, aucun service de change en ligne ; une séance passée modifiée
  après le changement garde son prix tel quel si le prix n'est pas retouché.
Suite : point 4, Comptabilité (dépenses, graphique sur 12 mois, résultat).
```

### Coory à l'international, étape 1 (D-69) ; couleur des catégories de documents (D-68)
```
Date : 2026-10-29
Fait : D-68, migration 20261029160000_couleur_des_categories (document_categories.color, palette
  fermée de 9 couleurs, couleurs des 5 catégories de départ) ; icône des documents colorée par
  catégorie (page Documents, fiche sportif), rond de couleur dans les filtres, palette dans « Gérer
  les catégories » (setDocumentCategoryColor) ; nextCategoryColor.
  D-69, migration 20261029180000_international : organizations.country / currency
  (private.is_supported_currency, 20 devises à 2 décimales) ; colonne currency sur paiements,
  factures et séances, posée par trigger (SECURITY INVOKER : la devise de l'organisation pour une
  écriture du coach, celle de la facture dans mark_athlete_invoice_paid) ; vat_rate en numeric(5,2)
  0..100 ; structures : default_vat_rate (obligatoire si assujettie), payment_details, numéros
  libres hors Belgique (contrôle BE seulement si country = BE) ; issue_athlete_invoice fige aussi
  les coordonnées de paiement ; complete_signup à 11 paramètres (pays, devise, TVA facultative,
  1re structure). Code : domain/billing/money.ts (formatMoney, parseAmount, parseVatRate,
  splitVat/addVat en nombres entiers), domain/geo (liste figée des pays en français,
  defaultCurrencyFor, countryFromAcceptLanguage), legal.ts (normalizeVatNumber, formatVatNumber),
  CoachMembership.country / currency, MoneyProvider (devise, pays, taux habituel pour les écrans),
  VatRateInput ; étape « Ta facturation » de /bienvenue (billing-setup-fields.tsx,
  parseBillingSetup) ; Paramètres : carte « Pays et devise » (setOrganizationCountry), structure
  avec pays en tête, taux habituel, n° de TVA, autres coordonnées ; factures, paiements, séances,
  tableau de bord, comptabilité, notifications et PDF dans la devise de chaque montant ;
  « Carte bancaire » hors Belgique ; icône Euro remplacée par Coins.
Tests : check OK ; Vitest 236/236 ; pgTAP 377/377 (nouveaux : 28_international 16 tests,
  27_categories 12) ; Playwright 159 réussis + 13 ignorés (inscription d'un coach suisse en CHF
  à 8,1 %, couleur d'une catégorie) ; captures téléphone et ordinateur, sombre et clair.
Limites : les totaux (tableau de bord, comptabilité) additionnent les montants dans la devise de
  l'organisation : correct tant qu'elle n'a jamais changé (étape 2). Interface en français
  (traduction = dernière étape avant la mise en ligne).
Suite : étape 2, changement de devise (taux saisi, conversion des prix à venir et des brouillons,
  totaux par devise) ; puis Comptabilité (point 4).
```

### Classement des Documents (option D) ; montant hors TVA et aperçu PDF des factures (D-67)
```
Date : 2026-10-29
Fait : migration 20261029140000_categories_de_documents (table document_categories par
  organisation, nom unique sans tenir compte des majuscules, 5 catégories de départ créées par un
  trigger à chaque nouvelle organisation et pour les existantes ; coach_documents.category_id avec
  clé composée, SET NULL à la suppression ; ancienne colonne category retirée) ; règles
  domain/documents (parseCategoryName, guessCategoryId, catégorie facultative) ; actions créer /
  renommer / supprimer une catégorie ; page Documents : catégories du coach en filtres, « Sans
  catégorie », filtre par sportif, « Gérer les catégories », ?sportif= et ?importer ; onglet
  « Documents » de la fiche ; recherche globale adaptée ; chargement de démo adapté.
  Factures : champ montant partagé (amount-field.tsx) « Hors TVA » (défaut) / « TVA comprise » avec
  le calcul en direct, refait côté serveur (totalsFromEntry ; aller-retour HTVA ↔ TVAC vérifié sans
  écart pour 6, 12 et 21 % sur un million de montants) ; « Aperçu PDF » dans une fenêtre (PDF servi
  en ligne avec ?apercu), Télécharger, Imprimer ; téléphone : « Ouvrir le PDF ».
Tests : check ; Vitest 220/220 ; pgTAP 358/358 (27_categories_de_documents : 9 tests ;
  24_documents adapté) ; e2e complet 159/159 + 12 ignorés (documents.spec : gestion des catégories,
  onglet de la fiche ; invoices.spec : montant HTVA, aperçu). Aperçu relu dans le vrai Chrome.
```

### Facturation sans règle légale, espèces à facturer en option (D-66)
```
Date : 2026-10-29
Fait : plus de mention de TVA écrite en dur (vatMention supprimée) : le PDF et la page n'impriment
  que les mentions de la structure, écrites par le coach ; texte des Paramètres › Facturation
  adapté (« à toi de les adapter aux règles de ton pays ») ; OPEN-17 fermé. Préférence
  coach_profiles.invoice_cash (migration 20261029120000_facturer_especes) : interrupteur « Proposer
  aussi les espèces à facturer » (Paramètres › Facturation), lu par « À facturer ».
Tests : check ; Vitest 217/217 ; pgTAP 349/349 ; e2e invoices + settings 16/16 ; suite complète :
  153 passés, 2 échecs sous charge (athletes, references), qui passent relancés seuls (16/16).
```

### Factures émises : brouillon, émission numérotée, PDF (D-65)
```
Date : 2026-10-29
Fait : migration 20261029100000_factures_emises (adresse du sportif ; factures brouillon / émise
  liées à une structure légale et à un paiement ; compteur privé par structure et par année ;
  issue_athlete_invoice : numéro sans trou ni doublon sous verrou, copie figée de la structure ;
  mark_athlete_invoice_paid : crée le paiement reçu et le relie ; trigger : une facture numérotée
  ne se modifie ni ne se supprime, seul son paiement peut changer ; RLS : écriture des brouillons
  seulement). Règles pures domain/billing/invoice-document ; requêtes et actions billing/invoice-* ;
  PDF React-PDF (features/billing/invoice-pdf.tsx, route /coach/facturation/[id]/pdf, ADR 0002) ;
  page Facturation : « À facturer » (virements sans facture, titre rouge) et « Factures » (titre
  vert), bouton « Créer une facture » (sportif existant ou nouveau, payée ou à payer) ; page d'une
  facture (brouillon modifiable, émettre, supprimer, aperçu PDF ; émise en lecture seule ; « Marquer
  comme payée ») ; adresse dans l'onglet Profil de la fiche.
Tests : check ; Vitest 217/217 ; pgTAP 349/349 (26_factures_emises : 17 tests ; 16_factures adapté :
  une facture peut être payée avant sa date, seuls les brouillons se suppriment) ; e2e complet
  154/154 + 12 ignorés (invoices.spec : virement → brouillon → émission → PDF, suppression d'un
  brouillon, isolation, création directe nouveau sportif → à payer → payée). PDF relu.
Complément (29/10 soir) : tous les modes de paiement se facturent (espèces comprises, pour les
  autres coachs) ; « À facturer » = virement + Bancontact ; montant modifiable dans un brouillon
  (paiement relié corrigé avec lui). e2e invoices + accounting : 12/12.
Reste : note de crédit, export comptable (BIZ-06), mentions légales à confirmer (OPEN-17).
```

### Vue « Liste » de l'Agenda, fin de la page Séances (D-64)
```
Date : 2026-10-29
Fait : vue ?vue=liste dans la page Agenda (4 semaines à partir du jour choisi, flèches ±4 semaines,
  filtres Toutes / Individuelles / Collectives) ; composant partagé SessionDayList (blocks/
  session-day-list.tsx), utilisé aussi par les Séances à venir du tableau de bord ; « Liste »
  dans le bouton « Vue » (téléphone) et les onglets (ordinateur) ; page /coach/seances supprimée,
  ainsi que son entrée de menu et son module ; « Voir tout » du tableau de bord → vue Liste.
  Aucun changement en base (lecture seule, même garde-fou requireOrgAccess + RLS).
Tests : check, Vitest 213/213 ; e2e complet 145 passés + 12 ignorés + 1 échec attendu (liste des
  vues de agenda.spec, corrigée) ; agenda.spec + sessions.spec relancés : 26/26. Captures
  téléphone et ordinateur, sombre et clair.
```

### Design « Graphite & Or » sur toute l'app (D-63)
```
Date : 2026-10-29
Fait : jetons (src/styles/tokens.css) graphite par défaut + clair, or pour l'action, palette OKLCH
  harmonieuse (run, strength, hyrox, hybrid, ok, warn, alert, female, male), rouge --alert pour
  erreurs et suppressions (bouton « danger »), orange --warn pour retards ; polices Inter Tight,
  Geist Mono, Space Grotesk (logo) ; rayons et titres du design system ; logo, favicon, icônes
  (boucle or) ; menu de gauche repliable (src/lib/sidebar.ts, sidebar-toggle.tsx, préférence
  gardée dans le navigateur) ; en-tête de page en ligne avec icône (PageHeader inline/icon) ;
  tableau de bord : NextSessionCard, cartes du haut à même hauteur, colonne de droite à la
  hauteur du calendrier ; cartes neutres (couleur sur icône, chiffre, titre ; CardTitle) ; grille
  d'agenda 00:00 → 24:00 qui défile dans sa carte, ouverte sur les heures du réglage ; flèche
  retour vers la page précédente avec son titre (back-link.tsx : NavigationMemory + BackLink,
  sessionStorage) ; chiffres clés de Sportifs cliquables ; pages d'erreur ; chevron des select
  (globals.css). Code mort retiré (formatHoursShort, isoWeek, linkClass, Card tone).
  Commits e84dd99 (nettoyage) et 30261b7 (poussé par Antonino).
Tests : check, Vitest 213/213 ; e2e complet 139 passés + 12 ignorés, puis les 7 en échec corrigés
  (agenda-interactive : grille 0-24 ; athlete-overview : onglet de la fiche gardé au retour) et
  relancés : 10 passés + 2 ignorés. Captures téléphone et ordinateur, sombre et clair.
Piège : `npx playwright test` reconstruit l'app et arrête `npm run dev` : relancer le serveur après.
```

### Outils, tranche 4 : recherche globale (D-62)
```
Date : 2026-10-28
Fait : page /coach/recherche (prompt §7) : grand champ, résultats rangés par groupe et filtrés en
  direct (Sportifs, Programmes, Séances, Documents, Tâches ; 6 par groupe), l'adresse garde la
  recherche (?q=), une tâche trouvée s'ouvre dans sa fenêtre ; action searchCoory (accès revérifié,
  lecture seule, RLS) ; règles domain/search (2 lettres minimum, jokers SQL échappés, syntaxe des
  filtres neutralisée) ; la recherche du haut de page (ordinateur, ⌘K) mène à cette page au lieu de
  la liste des sportifs ; champ de recherche en tête du menu hamburger (téléphone). Commit
  35c9b45 (poussé par Antonino).
Tests : Vitest (search), e2e search.spec (téléphone et ordinateur : direct, adresse, aucune fuite
  vers l'organisation B, joker « %% » sans résultat) ; athlete-overview adapté
Étape 4e (Outils) terminée : tâches, documents, notifications, recherche.
```

### Outils, tranche 3 : notifications lues et masquées (D-61)
```
Date : 2026-10-28
Fait : migration 20261028170000 (coach_notification_states : état par coach et par organisation,
  lue / masquée, clé de forme vérifiée, RLS « ses propres lignes ») ; clés stables
  (domain/notifications/keys : une tâche reportée, un nouveau message ou une nouvelle échéance
  redonne une notification non lue) ; la cloche et le menu ne comptent que ce qui n'est ni lu ni
  masqué (un message = un sportif qui a écrit) ; page Notifications : point rouge « Non lue »,
  ouvrir une ligne la marque lue, « ••• » Marquer comme lue / non lue, Masquer (« Annuler » dans le
  message), rouge « Tout marquer comme lu ». Les notifications restent calculées (rien n'est copié).
Tests : Vitest (notification-keys), pgTAP 25_etat_des_notifications (10), e2e
  notification-states.spec (en série, coach B, stable sur deux passages)
```

### Outils, tranche 2 : documents (D-60)
```
Date : 2026-10-28
Demande (Antonino) : les outils de 4e, les voir, les créer, les modifier, les supprimer
Fait : migration 20261028160000 (espace de stockage PRIVÉ coach-documents, 10 Mo, rangé par
  organisation, RLS ; table coach_documents : nom, catégorie Programme / Facture / Contrat / Bilan /
  Autre, sportif facultatif, chemin forcé dans le dossier de l'organisation, PDF / images / Word /
  Excel, droits par colonne) ; règles domain/documents (format lu dans les premiers octets, nom
  proposé, chemin sûr) ; actions uploadDocument, updateDocument, deleteDocument (le fichier part
  avec la fiche, pas d'orphelin si l'enregistrement échoue) ; route /documents/<id> (session de la
  personne, 404 si interdit, aperçu PDF / image, téléchargement avec ?telecharger) ; page
  /coach/documents : chiffres, recherche et filtres en direct, liste, aperçu en grande fenêtre (PDF
  en cadre sur ordinateur, « Ouvrir le PDF » sur téléphone), « ••• » (Aperçu, Télécharger,
  Modifier, Supprimer), import (nom et catégorie proposés d'après le fichier, saisie gardée en cas
  d'erreur) ; limite des actions serveur portée à 11 Mo. Démo : 4 PDF inventés pour le coach A,
  1 pour le coach B (chargés au reset avec les photos).
Tests : Vitest 208 (documents), pgTAP 322 (24_documents : stockage et table), e2e documents.spec
  (faux PDF refusé sans perte, import, recherche, filtres, aperçu, coach A refusé en 404,
  renommage, suppression, fichier plus servi)
Reste : partager un document avec le sportif (avec les publications, P5) ; documents sur la fiche
```

### Outils, tranche 1 : tâches complètes (D-59)
```
Date : 2026-10-28
Demande (Antonino) : les outils de 4e, « qu'on puisse les voir, les créer, les modifier et les
  supprimer »
Fait : migration 20261028150000 (coach_tasks : category « associée à » Programme / Facturation /
  Paiement / Suivi / Agenda, notes 1000 caractères ; droits par colonne) ; règles partagées
  domain/tasks/task-form (Zod) ; actions createTask, updateTask, deleteTask (accès revérifié,
  sportif de la même organisation) ; fenêtre « Nouvelle tâche / Modifier la tâche » montée sur
  toutes les pages coach (TaskSheetProvider) : bouton rouge de la page Tâches, « Créer → Tâche »
  (on reste sur la page), appui sur le titre d'une tâche (page Tâches et carte du tableau de bord) ;
  suppression avec confirmation ; « associée à » en pastille ; téléphone : titre sur deux lignes,
  pastilles et échéance dessous. Démo : catégories et une note sur les tâches du coach A.
Tests : Vitest 202 (task-form), pgTAP 307 (23_taches_completes), e2e tasks.spec (créer, refus sans
  titre sans perte de saisie, modifier, supprimer après confirmation ; Créer → Tâche)
```

### Paramètres en fenêtre, par-dessus la page (D-58)
```
Date : 2026-10-28
Demande (Antonino) : « je n'aime pas la page des paramètres » ; depuis le nom en bas à gauche,
  « Paramètres » doit ouvrir une boîte par-dessus la page, comme Claude.ai ; et « pourquoi Séance et
  Agenda dans Préférences ? »
Fait : une grande fenêtre (PanelDialog, variante wide de Overlay) ouverte par le menu du compte, sur
  toutes les pages coach, sans changer d'adresse : sommaire puis section avec retour sur téléphone
  (feuille qui monte du bas, glissable), menu des sections à gauche sur ordinateur ; titre et croix
  collés en haut pendant le défilement ; défilement remis en haut à chaque section ; « Mon profil »
  ouvre la section Profil ; sur téléphone le menu hamburger se referme derrière. Données lues à
  l'ouverture (loadSettings, action serveur revérifiée) et relues après chaque changement.
  Contenu partagé avec la page /coach/profil (SettingsPanel, sections.ts), qui reste pour un lien
  ou un rechargement. Carte renommée « Valeurs par défaut » avec une phrase d'explication
  (« Quand tu crées une séance », « Heures de l'agenda »). Photo : un seul bouton « Ajouter /
  Changer la photo », envoi dès le choix du fichier (plus de « Choose File » anglais).
Écarté : routes interceptées de Next (@modal) : le routage strict de Next 16 refuse les attrape-tout
  nécessaires (404 sur /login, routes de même spécificité)
Tests : Vitest 197, pgTAP 298, test:e2e 136 + 10 ignorés (nouveau test : fenêtre ouverte depuis le
  menu du compte, téléphone et ordinateur)
```

### Paramètres complets (D-57)
```
Date : 2026-10-28
Demande : une page Paramètres complète et qualitative, inspirée d'autres apps ; deux structures
  légales (choix d'Antonino : l'activité d'indépendant et l'ASBL)
Fait : migration 20261028120000 (préférences du coach : séance par défaut, heures de l'agenda,
  cloche ; private.is_org_owner + renommage de l'organisation par son propriétaire ; table
  organization_legal_entities avec RLS, une seule par défaut) ; cinq sections : Profil (photo,
  identité + téléphone, organisation), Préférences (thème, valeurs par défaut d'une séance, heures de
  l'agenda, interrupteurs de la cloche), Facturation et légal (structures : BCE et IBAN vérifiés par
  leur clé modulo 97, TVA belge déduite, préfixe des factures ; ajouter, modifier, supprimer),
  Sécurité (changer d'e-mail avec lien de confirmation, changer de mot de passe en revérifiant
  l'actuel, déconnecter tous les appareils), Données (export JSON de toute l'organisation, RGPD
  art. 20) ; branché pour de vrai : fenêtre « Nouvelle séance » préremplie, grilles du tableau de
  bord et de l'Agenda (withHours), cloche et page Notifications filtrées (enabledTotal)
Tests : Vitest 197, pgTAP 298 (22_parametres ; 01_isolation renforcé), test:e2e 134 + 10 ignorés
Reste : suppression complète d'un compte (procédure d'effacement à concevoir : sportifs liés,
  photos, admin) ; abonnement Coory en P8
```

### Case « Notes » : blessures et points d'attention, notes libres (D-56)
```
Date : 2026-10-28
Demande : dans la fiche (et la page Nouveau sportif), une case Notes pour les blessures, et des notes
  supplémentaires où Gianluca écrit ce qu'il veut
Décision (Antonino, RGPD) : deux cases. « Blessures et points d'attention » = donnée de santé,
  seulement avec l'accord du sportif ; « Notes libres » = tout le reste, privé entre coachs
Fait : migration 20261028090000 (health_constraints 300 -> 1000 caractères) ; « Contraintes
  physiques » renommé « Blessures et points d'attention » partout côté coach ; onglet Notes de la
  fiche : bloc Blessures (accord, preuve, champ enregistré à part par updateHealthNotes, retrait,
  historique ; déplacé depuis Disponibilités), Notes libres (ancienne « Note privée »), Message au
  sportif ; onglet Disponibilités : plus de donnée de santé (updateAvailability n'y touche plus) ;
  page Nouveau sportif : section Notes (accord intégré au bloc Blessures + Notes libres, créées
  comme note privée du coach), colonne de droite = rappel « Données de santé » + bouton
Tests : Vitest 181, pgTAP 286, test:e2e 129 + 7 ignorés
```

### Audit apple-design : les 10 retouches (D-55)
```
Date : 2026-10-28
Demande : audit du design avec le skill apple-design, puis appliquer les points 1 à 10
Fait : (1) fenêtres (Sheet, ActionMenu, ConfirmDialog) : entrée par le bas au ressort sans rebond
  (courbe linear() calculée, src/lib/motion.ts), glisser vers le bas pour fermer (poignée et
  en-têtes [data-sheet-grab], suivi 1:1, résistance vers le haut, vitesse du doigt reprise, élan
  projeté), sortie par une copie visuelle inerte : la vraie fenêtre se ferme tout de suite et la page
  répond aussitôt ; ordinateur : fondu + léger zoom ; mouvement réduit : fondu ; (2) segment choisi
  en noir/blanc inversé (vues, statut, paiement, thème) : le rouge reste à l'action ; (3) Nouveau
  sportif : barre « Enregistrer » collée en bas sur téléphone ; (4) retour à l'appui : écouteur
  tactile pour :active sur iPhone (PressFeedback), fond qui s'assombrit sur les lignes et cartes ;
  (5) pastilles à cocher et filtres à 44 px ; (6) « Marquer payée » / « Annuler » affichés tout de
  suite (useOptimistic, PaymentRows), et le serveur refuse maintenant une date comprise dans un
  forfait (vérification promise le 26/10 mais absente) ; (7) barre du haut du téléphone translucide
  (.material, transparence réduite et contraste élevé respectés) ; (8) contrôle d'un champ quand on
  le quitte (FieldCheck : e-mail, téléphone, date passée, montant), message différé si on appuie au
  même moment (sinon le bouton bougeait sous le doigt) ; (9) « Annuler » dans le toast après avoir
  coché une tâche ; (10) agenda : l'aperçu reste en place jusqu'à la grille rechargée (plus de
  retour éclair à l'ancienne place)
Tests : check OK (Vitest 180), test:e2e 126 + ux-audit.spec (feuille glissée, contrôle au départ
  d'un champ) + « Annuler » dans agenda.spec
```

### Page « Nouveau sportif » complète, avec la carte « Accord santé » (D-54)
```
Date : 2026-10-28
Demande : la suite prévue de 4a, la page « Nouveau sportif » du prompt Claude Design (§7.2) :
  formulaire complet + carte « Accord santé »
Fait : page /coach/o/[orgId]/sportifs/nouveau en quatre sections (Identité et contact, Profil
  sportif avec type de programme et statut, Objectif principal, Disponibilités) et la carte
  « Accord santé » (accord explicite + preuve, puis le champ « Contraintes physiques ») ; téléphone :
  tout empilé, carte et bouton rouge à la fin ; ordinateur : 8 + 4 colonnes, carte et bouton collés
  en haut. Champs partagés avec les onglets Profil et Disponibilités de la fiche
  (sportifs/athlete-fields.tsx : IdentityFields, ContactFields, SportProfileFields,
  AvailabilityFields, HealthConstraintsField). Règle pure parseNewAthleteForm
  (features/athletes/new-athlete.ts) qui réutilise les schémas de la fiche, des disponibilités, des
  objectifs (parseGoalForm, priorité principale) et de l'accord. createAthlete : la fiche, puis
  l'objectif, puis l'accord par grant_health_consent (journalisé) et les contraintes physiques ;
  arrivée sur la FICHE (avant : la liste) ; une étape secondaire en échec est signalée sur la fiche
  (?creation=incomplete). Pas de migration
Tests : check OK (Vitest 172 : 7 nouveaux), test:e2e 126 (new-athlete.spec : fiche complète
  retrouvée onglet par onglet, accord décoché = aucune contrainte physique ; specs qui créent un
  sportif adaptées : bouton « Enregistrer le sportif », arrivée sur la fiche, sélecteurs limités aux
  éléments visibles car la page quittée reste cachée dans le DOM)
Reste : « Disciplines (multi) » du prompt = ici un seul type de programme (colonne existante)
```

### Liste des sportifs : carte compacte sur téléphone (D-53)
```
Date : 2026-10-28
Demande : sur téléphone, la carte d'un sportif est trop haute
Fait : une seule rangée (case, photo, nom ; statut · type en texte coloré ; objectif en une ligne),
  « ••• » à droite ; « Écrire » et « Inviter » passent dans le menu « ••• » sur téléphone
  (inchangés sur ordinateur). Carte de 165 px à 76 px
Tests : test:e2e 122 + 6 ignorés (téléphone : accès et invitation par le menu « ••• »)
```

### Prix des séances, dates payées, forfaits (D-52)
```
Date : 2026-10-26
Demande : (1) à la création d'une séance, où qu'elle soit créée : son prix, une case TVA, espèces ou
  virement, en lien avec « Encaissé cette semaine » ; démo : toutes les séances de musculation à
  65 €, TVA 21 % ; (2) retour de Gianluca : certains sportifs paient 3 mois d'avance, d'autres
  séance par séance, à rendre cohérent avec l'encaissé de la semaine ; (3) règle de Gianluca :
  facturé (virement) = 65 € hors TVA, espèces = 65 € direct
Décisions (Antonino) : payée = encaissée (jamais l'inverse) ; collective = un prix pour toute la
  séance ; démo : musculation seulement
Fait : migration 20261026160000_prix_des_seances (coach_sessions.price_cents, price_vat_included,
  payment_method espèces/virement ; athlete_payments.session_id + session_date, unique par date,
  sportif facultatif pour une collective, covers_from / covers_to pour un forfait, lien gardé à null
  si la séance est supprimée) ; bloc « Prix » du formulaire de séance (fenêtre et page Modifier) :
  prix, Virement / Espèces, case « TVA comprise dans le prix » qui suit le mode (virement : hors TVA,
  le sportif paie prix + 21 % ; espèces : prix direct), calcul en direct ; page de la séance : carte
  « Prix et paiements » (4 semaines de dates, « Marquer payée » = paiement reçu daté du jour,
  « Annuler », « Forfait » pour une date couverte) ; fenêtre « Nouveau paiement » : case « Forfait
  sur une période » avec Du / Au ; Comptabilité : « Forfait du … au … » sur la ligne ; tableau de
  bord : « X € prévus (N séances) » sur la carte Encaissé, hors dates comprises dans un forfait ;
  règles pures : sessionAmountCents, defaultVatIncluded, plannedIncome, coveredByPackage, addVat ;
  démo : 13 séances de musculation à 65 € (individuelles facturées par virement = 78,65 € ;
  collective « Mobilité & gainage » en espèces), deux dates du lundi déjà payées (157,30 €
  encaissés), forfaits d'Inès (3 mois), Thomas (1 mois) et Chloé (3 mois, reçu la veille)
Tests : check OK (Vitest 165), pgTAP 286 (21_prix_des_seances : 13), test:e2e 122 + 6 ignorés
  (séance collective avec prix, date marquée payée puis annulée, paiement de forfait)
Reste : lien paiement ↔ facture ; traitement TVA des espèces à confirmer avec le comptable (OPEN-17)
```

### Tableau de bord recentré sur les tâches et l'encaissé ; vue du jour en grille (D-51)
```
Date : 2026-10-26
Demande : (1) vue « Aujourd'hui » de la page Agenda comme celle du tableau de bord ; (2) tableau de
  bord : ne garder en haut que les tâches et l'encaissé de la semaine (le plus important pour
  Gianluca), coachings du jour et total d'heures en petites lignes sous le calendrier, comme la page
  Agenda, téléphone et ordinateur ; (3) chiffres de la page Agenda plus petits et colorés ;
  (4) « Séances à venir » : distinguer aujourd'hui et demain
Fait : page Agenda, vue du jour = WeekTimeGrid single (56 px / heure, nom du sportif et détail
  visibles), libellé court « Lun 26 » sur téléphone ; StatTiles (src/components/ui/stat-tiles.tsx),
  tuiles colorées partagées par la page Agenda (4 tuiles) et le tableau de bord (2 tuiles sous le
  calendrier : coachings aujourd'hui + terminés / à venir, heures de la semaine + séances) ;
  KpiGrid du tableau de bord à 2 cartes (Tâches, Encaissé) ; KpiCard garde son nom complet
  (aria-label) quand le libellé court remplace le long sur téléphone ; « Séances à venir » groupées
  par jour, barre verticale et titre (aujourd'hui rouge, demain ambre, ensuite gris)
Tests : check OK (Vitest 158), test:e2e 120 + 6 ignorés (vue du jour : le bloc porte le nom du
  sportif, plus « Avec … »)
Retouche du soir (26/10) : sur téléphone, la grille du tableau de bord ne s'adapte plus à la
  hauteur de l'écran (« beaucoup trop petite en hauteur ») : mêmes réglages que la page Agenda,
  44 px par heure, 56 px en vue du jour, heure et nom sur deux lignes, détail quand le bloc est
  assez haut ; `fit` ne garde que ses effets ordinateur (48 px, en-tête bas, blocs de 45 min sur une
  ligne, défilement dans la carte). test:e2e 122 + 6 ignorés
Reste : lier la carte Encaissé à la future comptabilité des forfaits (attente du retour de Gianluca)
```

### Agendas façon Google Agenda, page de séance en couleurs, sportifs sur téléphone (D-50)
```
Date : 2026-10-26
Demande : (1) page Agenda : le calendrier d'abord, les 4 cartes en petit ; plus de titre « Semaine du
  … » (Agenda et tableau de bord), à la Google Agenda ; (2) onglet Agenda d'un sportif sur
  ordinateur : cartes minimalistes (pictogramme, titre, type, heure du coach) ; (3) page d'une
  séance en couleurs comme Garmin Connect ; (4) tableau de bord : de l'air sur téléphone, agenda
  sous les widgets avec un fond de couleur sans carte ; 4 cartes plus basses ; agenda plus grand sur
  ordinateur ; (5) liste des sportifs sur téléphone : pastilles non cliquables, toute la carte ouvre
  la fiche
Fait : AgendaToolbar (flèches, période « Octobre 2026 » / « Oct. – nov. » sur téléphone, vue ;
  titre « Semaine du … » gardé pour les lecteurs d'écran) sur les deux pages ; page Agenda :
  calendrier en premier, chiffres de la semaine en pastilles dessous ; tableau de bord : KpiCard
  compact (chiffre et pastille sur une ligne), KpiListCard plus basse, agenda 48 px / heure sans
  défilement interne, bande de couleur d'un bord à l'autre sur téléphone, sections espacées
  (PageBody grille : gap-6 sur téléphone) ; SessionCard minimaliste partout (ordinateur : empilée
  dans sa colonne) ; page de séance : chiffres teintés (durée ambre, type couleur de la discipline,
  objectif vert), étapes colorées (échauffement ambre, bloc principal discipline, retour au calme
  vert d'eau, récupérations grises) ; liste des sportifs (téléphone) : pastilles = repères, lien
  étendu sur la carte, case / message / Inviter / « ••• » au-dessus
Tests : check OK (Vitest 158), test:e2e 120 + 6 ignorés (pastilles via « ••• » et appui sur la
  carte au téléphone ; « Agenda → » seulement sur ordinateur ; cartes comptées par la liste)
```

### Téléphone : agendas pleine largeur, cartes de programme compactes ; un programme par sportif (D-49)
```
Date : 2026-10-26
Demande : (1) cartes du « Programme hebdomadaire » plus étroites sur téléphone pour voir toute la
  semaine sans défiler, et un programme pour CHAQUE sportif selon ses séances par semaine ;
  (2) sur téléphone, plus de carte autour du calendrier (tableau de bord, Agenda), grille sur toute
  la largeur ; (3) page Agenda : bouton « Vue » sous les 4 cartes, comme au tableau de bord
Fait : (1) SessionCard : sur téléphone une ligne (pastille, « n · titre », rendez-vous ou durée et
  type) ; ordinateur inchangé ; semaine d'Inès sur téléphone : 419 px ; programmes générés pour les
  15 autres sportifs actifs (N séances / semaine, 12 semaines, rendez-vous avec le coach reliés par
  withCoach, le reste à faire seul selon la discipline) ; Julien (en pause) sans programme ;
  rendez-vous de la démo prolongés jusqu'au 17/01/2027 (fin des programmes) ; tâche de Lucas :
  « Préparer le bloc 2 du programme de Lucas » ; (2) section de l'agenda sans carte sur téléphone,
  grille -mx-4 bord à bord (semaine, 3 jours, mois) ; (3) ViewMenu déplacé sous les KPI
Vérifié : séances voulues = séances de la semaine 1 du programme pour les 16 sportifs actifs ;
  largeur de page 390 px (pas de débordement). Tests : check OK, db:test 273, test:e2e 120 + 6
  ignorés (agenda en trois vues désormais testé sur Julien, sans programme)
```

### Audit de cohérence du jeu de démo (D-48)
```
Date : 2026-10-26
Demande : toutes les données doivent être cohérentes entre elles (ex. Inès : 5 séances voulues
  mais 5 séances de programme + 8 rendez-vous avec le coach, dont un le mercredi, jour sans
  entraînement ; étiquettes incompréhensibles sous la semaine)
Audit : AUCUN sportif cohérent (Inès 8 séances avec le coach pour 5 voulues, Lucas 9 pour 4,
  Sophie 6 pour 2, Nadia 6 pour 4, Thomas 7 pour 4 + test VMA un jour indisponible)
Règle : N séances voulues par semaine = N au total, sur SES jours ; une séance avec le coach
  (individuelle ou collective) compte dans les N, elle ne s'y ajoute pas
Fait : semaine type régénérée par un script qui VÉRIFIE (aucun chevauchement pour le coach, jours
  respectés, jamais plus de rendez-vous que de séances voulues) : 22 individuelles + 6 collectives,
  30 h 15 par semaine ; 10 sportifs de démo INVENTÉS ajoutés (clientèle d'un coach à 30 h), avec
  jours, séances voulues, type de programme et objectif ; Manon : 2 séances (lun, mer) ; test VMA de
  Thomas au dimanche ; Sophie « à partir de 17 h » ; séances de Lucas renommées « Coaching
  hybride » ; programme d'Inès relié à ses rendez-vous (withCoach : séance 1 = coaching du mardi
  7 h, séance 4 = circuit du samedi) ; carte « Avec le coach · Mar 07:00 », en-tête « 5 séances : 2
  avec le coach, 3 à placer librement », sous la semaine seulement les compétitions, nommées
Vérifié : requête d'audit (16 sportifs actifs : rendez-vous ≤ séances voulues, jours respectés),
  factures, paiements, tâches et messages liés à des sportifs actifs, messages seulement de comptes
  activés. Tests : db:test 273, check OK (Vitest 158), test:e2e 120 + 6 ignorés
```

### Agenda sur téléphone : bouton « Vue » et semaine entière (D-47)
```
Date : 2026-10-26
Demande : sur téléphone, comme Google Agenda, pouvoir voir les 7 jours de la semaine dans l'écran
  (colonnes étroites), avec un bouton « Vue » qui incite à changer de vue (tableau de bord et Agenda)
Fait : ViewMenu (téléphone) : Aujourd'hui, 3 jours, Semaine, Mois, choix en cours coché ; adresse
  ?jours=7 pour la semaine entière ; WeekTimeGrid fullWeek : 7 colonnes flex, gouttière réduite,
  séance = heure de début + titre en petit ; ordinateur inchangé (onglets)
Tests : check OK (Vitest 158), test:e2e 120 + 6 ignorés (aide chooseAgendaView ; semaine entière
  sur téléphone)
Puis : vue « 3 jours » sur téléphone, la 3e colonne était coupée (largeur fixe de 104 px) : chaque
  colonne mesure maintenant (largeur de l'agenda − 3rem) ÷ 3 (unités cqw, agenda déclaré @container) ;
  mesuré à 375, 390 et 430 px : 3 colonnes entières, aucune coupée, tableau de bord et Agenda
```

### Démo : une semaine réaliste de 30 h pour Gianluca ; programmes en cours au tableau de bord
```
Date : 2026-10-26
Demande : voir au tableau de bord et dans l'Agenda ce que Gianluca a vraiment par semaine (≈ 30 h)
Fait : seed : 21 séances individuelles hebdomadaires d'une heure (7 h, 8 h 15, 12 h 15, soir) et
  4 collectives (small group Hyrox lundi et jeudi, mobilité vendredi, run club samedi), en plus de
  la piste, du circuit et du coaching force : 29 séances, 30 h affichées ; elles s'arrêtent le
  20/12/2026 (les tests utilisent des semaines de 2027) ; carte « Programmes en cours » branchée sur
  les programmes publiés (listActivePrograms, semaine n / N et barre de progression)
Tests : test:e2e 120 + 6 ignorés (carte Programmes en cours : Inès, « Sem. n/12 »)
```

### Programmes, tranche 1 : l'affichage du programme d'un sportif (D-46)
```
Date : 2026-10-26
Demande (maquettes d'Antonino : tableur de Gianluca, « Programme hebdomadaire », page de séance) :
  une ligne par semaine, N séances numérotées SANS jour (le sportif les place quand il veut), cartes
  par discipline, détail d'une séance (étapes, « Répéter n fois », conseils) ; 5 séances / semaine
  comme Inès l'a demandé, 12 semaines pour la démo
Fait : migration 20261026120000_programmes (programs, program_publications figées,
  publication_sessions : week_index + slot_index, planned_date vide ; lecture seule pour les coachs,
  aucune écriture depuis le navigateur avant l'éditeur) ; domaine program-session.ts (contenu
  structuré validé par Zod, résumé des cartes) ; features/programs/queries.ts (publication ACTIVE) ;
  onglet Agenda = ProgramWeeksSection (semaine en cours encadrée, phase, séances avec le coach et
  compétitions de la semaine) ou, sans programme, l'agenda en trois vues ; onglet Programme = résumé
  (période, durée, séances, version publiée) ; page /sportifs/[id]/programme/[séance] ; seed : programme
  INVENTÉ de 12 semaines × 5 séances pour Inès, publié en version 1
Non fait (tranches suivantes) : éditeur et publication (tranche 2, après étude Garmin / RoxFit /
  muscu et maquettes) ; « Je l'ai faite », ressenti, commentaire côté sportif (tranche 3) ; bloc
  « Suivi automatique avec l'IA » (OPEN-16)
Tests : db:test 273 (20_programmes), check OK (Vitest 158 : contenu de séance), test:e2e 120 + 6
  ignorés (programme d'Inès : 12 semaines, 5 séances, détail ; agenda en trois vues pour Thomas)
```

### Agenda du coach : sans compétitions, filtres et individuelles / collectives (D-45)
```
Date : 2026-10-26
Demande : plus de compétitions dans le planning du coach (tableau de bord, page Agenda) : elles
  deviennent des rappels (notifications) ; page Agenda : vues Aujourd'hui, Semaine, Mois ; filtres
  Toutes, Individuelles, Collectives (dans cet ordre) sur la page Agenda ET le calendrier du
  tableau de bord ; distinguer une séance individuelle d'une collective sur les deux calendriers
Fait : notifications : section « Compétitions dans les 7 jours » (objectifs en cours avec un nom
  de compétition, J-n, lien vers les objectifs du sportif), comptée dans la cloche ; AgendaEvent
  gagne isCompetition ; page Agenda : listAgendaEvents retiré, filtre Compétitions retiré, onglets
  Aujourd'hui / Semaine / Mois (la vue Jour reste accessible depuis un jour du mois) ; tableau de
  bord : FilterChips ?type=individuelles|collectives (l'agenda seulement, pas les chiffres clés),
  --grid-chrome téléphone 340 → 392 px ; calendriers : collective = contour pointillé + icône
  « groupe » (semaine, jour), point creux / icône (mois), pastille Individuelle / Collective dans les
  listes du jour, légende sous la grille
Tests : check OK (Vitest 155), test:e2e 120 + 6 ignorés (agenda sans compétition, vues et filtres,
  filtre du tableau de bord, rappel J-3 dans les notifications ; glisser-déposer visé à 11:00, loin
  du bord haut de la zone visible)
```

### Agenda du sportif en trois vues (D-44)
```
Date : 2026-10-26
Demande : l'onglet Agenda de la fiche comme un vrai agenda, en trois vues (Aujourd'hui, Semaine,
  Mois), seulement pour ce sportif ; l'agenda du coach (tableau de bord, page Agenda) ne change pas ;
  PAS d'heures pour les séances de programme (faites quand le sportif veut dans la journée) :
  seules les séances encadrées (ex. BeHybrid 19 h à Mérode) et les compétitions ont une heure / date
Fait : AthleteAgendaSection réécrit : ?vue=jour|semaine|mois&date= (Semaine par défaut), flèches
  précédent / suivant ; Semaine = une colonne par jour avec des cartes teintées de la discipline
  (heure si séance encadrée, « Journée » pour une compétition, type), sans grille horaire, 3 jours
  visibles sur téléphone (défilement aimanté, scroll-padding) et 7 sur ordinateur ; Mois = grille
  avec pastilles de couleur et drapeau, toucher un jour ouvre ce jour ; Aujourd'hui = liste du jour
Tests : check OK (Vitest 155), test:e2e 118 + 6 ignorés (semaine fixée, mois → jour de Hyrox Gent)
```

### Fiche sportif : « + Créer », onglets Programme et Agenda (D-43)
```
Date : 2026-10-26
Demande : un bouton rouge « + Créer » sur la fiche (Programme, Séance) au lieu de « Créer un
  programme » ; deux onglets Programme et Agenda ; ordre des onglets validé : Vue d'ensemble,
  Programme, Agenda, Objectifs, Profil, Disponibilités, Repères, Notes, Historique
Fait : FicheCreateMenu (Programme → /coach/programmes ; Séance → fenêtre « Nouvelle séance »
  pré-remplie : individuelle, ce sportif, discipline de son type de programme, date du jour ;
  NewSessionSheet accepte athleteId et discipline) ; onglet Agenda (AthleteAgendaSection : 8
  semaines rangées par semaine, séances encadrées + compétitions, « Avec le coach » / « Collective »
  / « Compétition ») ; onglet Programme (état vide honnête + « Créer un programme ») ; ligne
  AgendaItemRow partagée avec la carte « Prochaines séances », dont le bouton « Agenda » ouvre
  désormais l'onglet Agenda de la fiche
Tests : check OK (Vitest 155), test:e2e 118 + 6 ignorés (test de la fiche : menu Créer, séance
  pré-remplie, onglets Programme et Agenda)
```

### Fiche sportif, point 1 de l'audit du 26/10 (D-42)
```
Date : 2026-10-26
Demande (audit du tableau de bord et des sportifs) : bouton « Créer un programme » sur la fiche,
  voir ce que le sportif a à faire, en-tête cohérent avec la liste, temps visé des objectifs
Fait : en-tête : rouge « Créer un programme » (→ /coach/programmes tant que le module n'existe pas ;
  plus tard l'assistant pré-rempli avec ce sportif), « Inviter dans son espace » sur ordinateur,
  menu « ••• » (AthleteFicheMenu : statut, type, objectif, fiche, écrire / inviter, flèche Retour),
  étiquettes « Compte activé / Sans compte » retirées ; vue d'ensemble : carte « Prochaines séances »
  en premier (4 séances encadrées sur 30 jours via buildAgendaItems filtré sur le sportif + sa
  prochaine compétition toujours visible ; « Aujourd'hui » surligné) ; grille limitée à la largeur
  de l'écran (grid-cols-1 : la carte débordait sur téléphone) ; objectifs : migration
  20261026100000 (target_time_seconds, 1 min à 24 h), champ « Temps visé » (1:15:00 ou 45:00) à
  l'ajout et à la modification, affiché sur les cartes ; seed : Thomas 1:44:30, Inès 1:15:00
Tests : check OK (Vitest 155 : temps visé), db:test 265, test:e2e 118 + 6 ignorés (nouveau test de
  la fiche : bouton, menu, prochaines séances, temps visé)
```

### Téléphone : filtres compacts, vue d'ensemble lisible, objectifs modifiables (D-41)
```
Date : 2026-10-26
Demande : (1) liste des sportifs sur téléphone : plus de rangées de pastilles qui passent à la
  ligne, seulement le choix en cours avec un symbole pour le changer ; (2) vue d'ensemble de la
  fiche sur téléphone trop serrée ; (3) pouvoir MODIFIER un objectif au lieu de le supprimer
Fait : (1) CompactFilter (téléphone et tablette) : « Statut · Tous (8) ⌄ » et « Programme · Tous ⌄ »
  ouvrent la liste des choix (icône, nombre, choix en cours coché) ; ordinateur inchangé ;
  (2) Row de la vue d'ensemble : une information par ligne, filets, libellé gris au-dessus, valeur
  en 15 px (prototype « kv ») ; ordinateur inchangé ; (3) migration 20261026090000 (droit de
  modifier les champs de saisie d'un objectif, jamais son rattachement), action updateGoal (mêmes
  règles que l'ajout ; une date déjà passée reste acceptée si elle ne change pas ; objectif en
  cours seulement), bouton « Modifier » sur chaque objectif en cours → fenêtre pré-remplie
  (GoalFields partagé avec l'ajout) ; corrigé aussi : next.config allowedDevOrigins 192.168.*.*
  (œil du mot de passe et tout le JavaScript bloqués sur le vrai téléphone en développement)
Tests : db:test 265 (07_objectifs mis à jour), check OK (Vitest 153), test:e2e 116 + 6 ignorés
  (nouveau : modifier un objectif ; filtres via l'aide chooseAthleteFilter, téléphone et ordinateur)
```

### Liste des sportifs : menu « ••• » complet et jeu de démo cohérent
```
Date : 2026-10-24
Demande : (1) Inès et Nadia, qui écrivent dans les Messages, doivent avoir un compte activé dans la
  démo (icône message, pas « Inviter »), comme Thomas ; (2) le menu « ••• » regroupe toutes les
  actions de la ligne
Fait : seed : comptes de démo ines.benali@ et nadia.elamrani@example.test (mot de passe de démo),
  invitations acceptées, messages signés par leur compte ; l'invitation en attente passe à Lucas ;
  « ••• » : Changer le statut, Changer le type de programme (ouvrent leur choix), Modifier
  l'objectif, Modifier la fiche, puis Écrire un message (compte activé) ou Inviter dans son espace
  ; flèche « Retour » dans Statut et Type quand ils sont ouverts depuis « ••• » (ActionMenu onBack)
Tests : check OK (Vitest 153), db:test 264, test:e2e 116 + 6 ignorés (menu « ••• » vérifié)
```

### 4a : liste des sportifs d'après la maquette d'Antonino (D-40)
```
Date : 2026-10-24
Demande : maquette en tableau (Sportif, Statut, Type de programme, Objectif, Actions) ; statut et
  type de programme modifiables directement sur leur pastille ; filtres Statut et Type au-dessus ;
  cases à cocher avec actions groupées ; « Prochaine séance » remplacée par « Objectif » ; lignes
  neutres ; compte activé = icône message sans « Inviter », sinon seulement « Inviter »
Fait : migration 20261024120000_type_de_programme (athlete_profiles.program_type, facultatif,
  indépendant des objectifs, droit de modification au seul coach) ; seed (Lucas en Hybride, Manon
  sans type) ; actions setAthletesStatus / setAthletesProgramType (un ou plusieurs sportifs, Zod,
  organisation revérifiée) ; tableau triable (?tri=, ?ordre=) sur ordinateur, cartes sur téléphone ;
  pastilles qui ouvrent le choix (choix en cours coché) ; barre « N sélectionnés · Statut · Type » ;
  filtres en carte (Statut avec nombres, Type avec pictogrammes), « Tous » par défaut ;
  menu « ••• » = statut
Tests : db:test 264 (19_type_de_programme), check OK (Vitest 153), test:e2e 116 + 6 ignorés
  (nouveau : pastilles + actions groupées ; filtre par type ; archivage adapté au filtre « Tous »)
```

### 4a : liste des sportifs (prototype + retouches d'Antonino)
```
Date : 2026-10-24
Demande : liste des sportifs du prototype ; à la place des libellés d'accès : compte activé =
  petite icône message à côté du sexe (ouvre sa conversation) et ligne vert très doux ;
  invitation envoyée = petite icône ; sans compte = rien, juste « Inviter », ligne grise
Fait : en-tête « N sportifs · N actifs » + bouton « Nouveau sportif » ; 4 KPI (actifs avec
  +N ce mois-ci, en pause, compétitions à venir, fiches à compléter) ; recherche ; filtres
  statut et discipline (?statut=, ?discipline=) ; ligne : avatar couleur de discipline, nom,
  sexe, icônes d'accès et de fiche à compléter, niveau · objectif, badge discipline, statut si
  pas actif, prochaine compétition, « Inviter », menu « ••• » (Modifier, Inviter)
Tests : check OK (Vitest 153), test:e2e 112 + 6 ignorés, + test « accès par icône et filtre
  discipline » (2/2) ; liens « Ajouter un sportif » des tests renommés « Nouveau sportif »
```

### Menu du compte (maquette d'Antonino)
```
Date : 2026-10-24
Demande : remplacer la carte + roue dentée par la carte de la maquette (photo avec pastille verte,
  nom, « Coach », flèche) qui ouvre au survol / au clic : Mon profil, Paramètres, Changer de compte,
  Thème (Clair / Sombre / Système), Se déconnecter
Fait : AccountMenu (barre latérale et menu hamburger ; position fixe pour déborder de la barre sur
  ordinateur, 280 px) ; rôle affiché « Coach » / « Sportif(ve) » (organisation dans Paramètres >
  Compte) ; Paramètres → section Thème de la page ; « Changer de compte » = déconnexion puis
  connexion (pas encore de comptes multiples) ; SettingsMenu et UserCard supprimés
Tests : check OK (Vitest 153), test:e2e 112 + 6 ignorés (menu du compte, thème depuis le menu)
```

### Retouches du menu de gauche
```
Date : 2026-10-24
Demande : carte de la personne et roue dentée à la même taille (ordinateur et téléphone) ; « Messages »
  juste sous « Assistant IA »
Fait : carte de 44 px (photo et nom, rôle et organisation en infobulle et dans Paramètres > Compte) ;
  ordre : Assistant IA, Messages, Tâches, Documents, Notifications (menu de gauche et hamburger)
Tests : check OK (Vitest 153), test:e2e 112 + 6 ignorés
```

### Développement : rester connecté avec coach-a@example.test
```
Date : 2026-10-24
Demande : ne plus devoir se reconnecter sans cesse pendant le développement
Causes : (1) « Se déconnecter » fermait TOUTES les sessions du compte (signOut global) : les tests qui
  se déconnectent en coach A déconnectaient aussi Antonino ; (2) `db:reset` efface les sessions
Fait : déconnexion limitée à l'appareil (scope local, comportement habituel ; une « déconnexion de
  tous les appareils » sera un choix à part) ; scripts/dev-keep.mjs, lancé par `npm run db:reset`
  avant et après le reset : garde les sessions du coach A actives depuis moins de 14 jours et son
  profil (nom, entreprise, photo), dans supabase/.temp (jamais commité), base locale uniquement
Vérifié : connexion, suite e2e complète (avec ses déconnexions), db:reset : la page reste connectée
  (« Bonjour Gianluca »). Tests : check OK (Vitest 153), test:e2e 112 + 6 ignorés
```

### D-38 : menu de gauche, roue dentée et thème dans les Paramètres
```
Date : 2026-10-24
Demande : menu de gauche avec « Assistant IA » au-dessus de Tâches et « Notifications » au-dessus de
  Messages (cloche et étoile gardées en haut) ; plus de bouton thème ni de « Se déconnecter » en bas :
  une roue dentée à la place du thème, avec un petit menu au survol (Paramètres, Thème, Compte, Se
  déconnecter) ; le thème se choisit dans les Paramètres : Clair, Sombre ou Système
Fait : lib/theme (préférence « system », suivie en direct par le script du <head>) ; ThemeChoice ;
  SettingsMenu (survol à la souris, toucher sur téléphone, Échap / clic ailleurs) dans la barre
  latérale et le menu hamburger, à côté de la carte de la personne ; « Paramètres » retiré de la
  liste ; Paramètres : sections Thème et Compte (e-mail, organisation, changer le mot de passe, se
  déconnecter) ; le bouton clair / sombre reste sur les pages d'accès (connexion…)
Tests : check OK (Vitest 153), test:e2e 112 + 6 ignorés (nouveaux : ordre du menu et roue dentée,
  thème Clair / Sombre / Système) ; aides de déconnexion passées par la roue dentée
```

### Retouche mobile du tableau de bord (mobile first)
```
Date : 2026-10-24
Demande : sur téléphone, 4 petites cartes deux par deux (Tâches et « encaissés » ne prennent plus
  toute la largeur), pour atteindre l'agenda plus vite ; la carte Tâches comme le petit widget
  Rappels de l'iPhone (« Tâches » + nombre, 2 ou 3 intitulés en petit avec leur rond) ; sous
  l'agenda : Séances à venir, puis Programmes en cours, puis Activité financière
Fait : KpiListCard (téléphone : libellé court en couleur + nombre, liste sans précisions ;
  ordinateur inchangé) ; CheckList : intitulé 13 px seul sur téléphone ; option « wide » retirée ;
  ordre des cartes du bas changé aussi sur ordinateur ; photos dans « Fiches à compléter »
Tests : check OK (Vitest 153), test:e2e 109 + 5 ignorés ; db:reset puis profil restauré
```

### D-37 : vraie page Notifications, en sections
```
Date : 2026-10-24
Constat : la pastille de la cloche (messages non lus) menait à une page Notifications vide
Demande : une vraie page, rangée par sections, avant de reprendre 4a
Fait : features/notifications (countNotifications pour les pastilles, getNotifications pour la
  page) ; /coach/notifications : Messages non lus, Tâches du jour ou en retard, Factures en retard,
  Fiches à compléter (même règle que completeness), chaque ligne vers l'endroit où on s'en occupe,
  « Rien à signaler » par section vide ; la cloche compte le total (« Notifications, 6 à voir »), la
  pastille de « Messages » seulement les messages ; rien n'est stocké, une ligne disparaît d'elle-même
Reste : retours de séance des sportifs (P6), invitations acceptées
Tests : check OK (Vitest 153), test:e2e 109 + 5 ignorés (nouveau : cloche → sections → fiche de
  Manon) ; db:reset puis profil d'Antonino restauré
```

### D-36 : paiements reçus, CA de la semaine, Comptabilité ; messages non lus en pastille
```
Date : 2026-10-24
Demande (retour de Gianluca, via Antonino) : savoir combien il gagne par semaine ; montants avec et
  sans TVA ; savoir s'il est payé en espèces ou par virement ; une page Comptabilité assez complète ;
  la carte « messages non lus » remplacée, les non lus en pastille rouge sur Messages et la cloche
Réponses : CA = argent REÇU (un forfait de 3 000 € compte le jour du paiement) ; séance annulée d'un
  forfait = reportée (pour les forfaits, prochaine tranche) ; Gianluca est assujetti à la TVA
Fait :
  - migration 20261024090000 : athlete_payments (sportif, date, montant TVAC en centimes, taux 0 /
    6 / 12 / 21, mode espèces / virement / Bancontact / autre, libellé) ; RLS coachs seulement,
    sportif non modifiable ; tests pgTAP 18 ; seed : 3 paiements (200 € virement, 100 € espèces,
    1 500 € Bancontact) + 1 pour l'organisation B
  - domain/billing/payments : HTVA et TVA déduits du TVAC (au centime, total exact), totaux d'une
    période, saisie « 3 000,50 », compte bancaire = virement ou Bancontact
  - fenêtre « Nouveau paiement » (NewPaymentSheet, dans la coquille coach comme « Nouvelle
    séance ») : Créer → Paiement reçu et bouton de la Comptabilité ; HTVA affiché en direct ; 21 %
    par défaut ; saisie gardée après une erreur
  - tableau de bord : carte « encaissés cette semaine » (TVAC, HTVA, nombre de paiements) à la
    place de Messages ; « paiements reçus » de l'Activité financière lus dans les paiements
  - /coach/comptabilite : semaine, mois, TVA du mois, compte bancaire ; liste filtrable (Tous /
    Compte bancaire / Espèces et autres) ; suppression d'un paiement noté par erreur
  - pastille rouge chiffrée (CountBadge) sur « Messages » dans le menu et sur la cloche (ordinateur
    et téléphone), nombre lu dans la coquille ; carte et liste « Répondre » retirées
Écarts assumés : taux de 21 % par défaut à confirmer par le comptable (OPEN-17) ; pas encore de lien
  paiement ↔ facture ni de forfait (séances comprises, restantes, reportées) : tranche suivante ;
  la Comptabilité n'est pas une comptabilité légale (la page le dit)
Tests : check OK (Vitest 153), db:test 259/259, test:e2e 107 + 5 ignorés (nouveaux : paiement en
  espèces jusqu'à la Comptabilité, filtre, suppression, erreur de montant ; pastille de la cloche) ;
  db:reset puis profil d'Antonino restauré
```

### D-35 (retouche) : un nouveau sportif a tout de suite sa fiche, signalée « à compléter »
```
Date : 2026-10-23
Demande : dans « Nouvelle séance », taper le nom du nouveau sportif (ex. John) crée déjà sa fiche,
  la plus minimale possible, dans Sportifs ; une icône y signale qu'elle doit être complétée
Fait :
  - migration 20261023180000 : retour à la règle de D-27 (une séance individuelle a toujours son
    sportif, qui ne change pas) ; prospect_name, son contrôle et son déclencheur retirés ; une
    séance individuelle encore sans sportif reçoit sa fiche minimale (rien n'est perdu)
  - createSession : avec « Nouveau sportif », fiche minimale d'abord (premier mot = prénom, le
    reste = nom de famille), puis la séance rattachée ; si la séance échoue, le message le dit
    (une fiche ne se supprime pas, on archive) ; toast « Fiche de John ajoutée à tes sportifs, à
    compléter » ; le nom est obligatoire quand la case est cochée
  - features/athletes/completeness : fiche à compléter = sans nom de famille, ou sans e-mail ni
    téléphone ; calculé, jamais stocké (le repère disparaît seul) ; icône dans la liste des
    sportifs (infobulle : ce qui manque) et pastille « Fiche à compléter » en tête de la fiche,
    vers l'onglet Profil ; Manon (seed, prénom seul) l'a aussi
  - tests e2e : champs Prénom / Nom de famille cherchés par leur rôle (l'icône et la page
    précédente gardée cachée par Next créaient des doublons pour getByLabel)
Tests : check OK (Vitest 149), db:test 248/248, test:e2e 103 + 5 ignorés ; db:reset puis profil
  d'Antonino restauré
```

### D-35, étape 4a partie 1 : tableau de bord, agenda interactif, Séances, Tâches, Messages, Facturation
```
Date : 2026-10-23
Demandes d'Antonino (une à une, au fil de ses essais) :
  - agenda du tableau de bord sur toute la largeur et à la hauteur de l'écran ; cartes du haut :
    coachings du jour, heures de la semaine, Tâches (au lieu de « programmes à livrer »), Messages
    (au lieu de « paiements en attente ») ; sous l'agenda : Programmes en cours, Séances à venir,
    puis une carte « Activité financière » (factures envoyées, paiements reçus, en attente)
  - Tâches façon widget Rappels de l'iPhone (rond à cocher) ; une tâche cochée quitte la carte et
    reste dans la page Tâches (« Terminées ») ; Messages : bouton Répondre qui ouvre la conversation
  - « invente 2 tâches et 3 messages » : choix « vraies tables + démo » (pas de fausses données)
  - agenda cliquable (créneau vide = nouvelle séance pré-remplie) et glisser-déposer au doigt ou à
    la souris ; séance hebdomadaire : demander « seulement cette date » ou « toute la série » ;
    téléphone : appui long ; ordinateur : 40 px par heure, l'agenda défile dans sa carte
  - fenêtre « Nouvelle séance » partout (Créer, Agenda, Séances), plus de page à part ; type
    Individuelle d'abord ; disciplines Musculation, Hyrox, Running, Hybride ; sportif facultatif
    (« Nouveau sportif, pas encore créé ») ; page Séances = toutes les séances à venir
Fait (base) : 5 migrations, chacune avec RLS et tests pgTAP (14 à 17, 11 complété) :
  - coach_tasks (done_at, « qui a coché » posé par un déclencheur, jamais par le navigateur)
  - athlete_messages (fil = un sportif ; coach : lire, marquer lu, répondre ; read_at et
    created_at non inscriptibles ; aucun accès sportif pour l'instant, P7)
  - athlete_invoices (suivi D-17 étape A, lecture seule ; montants en centimes ; statut calculé)
  - coach_session_exceptions (dates déplacées, contrôle « vraie date de la série ») + fonction
    move_session_series (série décalée de -3 à +3 jours avec ses dates déplacées, une transaction)
  - coach_sessions : séance individuelle sans sportif (prospect_name facultatif), rattachement
    une seule fois, puis le sportif ne change plus (déclencheur)
  - seed : 2 tâches, 3 messages non lus + 1 réponse, 3 factures (450 €, 300 € reçus, 150 € en
    retard), dates relatives au reset ; tout est inventé
Fait (app) :
  - domaine : billing/invoices (statut, activité du mois, euros), tasks/buckets (onglets) ;
    sessions/schemas.sessionOccurrences (dates déplacées comprises), utilisé par la grille, la
    liste du jour, les séances à venir, la fiche de séance et les chiffres du tableau de bord
  - composants : KpiListCard, CheckList (useOptimistic, toast, retrait de la carte), ReplyList,
    NewSessionSheet + NewSessionButton (dans la coquille coach, sportifs lus à l'ouverture),
    SlotLayer (créneau au survol, demi-heure), GridInteractions (DraggableBlock, DropPreview,
    menu « seulement cette date / toute la série », défilement près des bords), SessionForm
    déplacé dans components/blocks (mode « rester sur la page », nouveau client)
  - pages : tableau de bord retouché ; /coach/seances, /coach/taches, /coach/messages
    (?sportif= ouvre le fil, MarkThreadRead après affichage), /coach/facturation ; page
    « Nouvelle séance » supprimée ; fiche de séance : dates déplacées et nouveau client
  - grille : téléphone inchangé (mesures identiques) ; ordinateur 40 px/h, zone qui défile à la
    hauteur de l'écran (mesurée au navigateur), en-tête des jours collé, ouverture vers l'heure
    actuelle ; noms des cases du mois avec leurs séances (lecteurs d'écran, tests)
Écarts assumés : la page Séances réservée par le prompt aux séances des programmes et aux retours
  (P6) liste pour l'instant les séances encadrées (onglet à ajouter en P6) ; un fil s'ouvre sans
  « Nouveau message » ni recherche ; le sportif ne lit pas encore les réponses (la page le dit,
  aucun e-mail ni WhatsApp n'est envoyé) ; modifier le jour d'une série par « Modifier » laisse
  ses dates déplacées sans effet (ignorées) ; glisser-déposer sans alternative au clavier autre
  que « Modifier » ; sur un écran de 768 à 800 px de haut, la carte agenda dépasse de 65 à 97 px
  (au moins 380 px de grille gardés, accepté par Antonino) ; iPhone SE : 84 px de défilement
Tests : check OK (Vitest 147), db:test 251/251, test:e2e 103 + 5 ignorés (nouveaux : tâches et
  messages du tableau de bord, Répondre, créneau → fenêtre, glisser souris et appui long au doigt
  par événements tactiles, série « seulement cette date » / « toute la série », nouveau client,
  page Séances) ; db:reset puis profil d'Antonino restauré
```
- Décisions produit du 22/10 (documentation seulement, **aucun code**) : D-17 Business du coach (étapes A suivi et B factures, **sans encaissement en ligne**, placement proposé après P6 à confirmer, backlog BIZ-01 à BIZ-06), D-18 musculation seule confirmée, OPEN-17 (règles de facturation, vérification par un comptable), comparatif Athleex corrigé dans `docs/16`.

### Retouches après l'étape 3 (demandes d'Antonino)
```
Date : 2026-10-23
Demande : page d'invitation du coach centrée au milieu de l'écran sur ordinateur (téléphone
  inchangé) ; pastilles Conditions / Confidentialité / Mentions légales sur une ligne au téléphone
Fait : invitation : contenu dans une colonne de 600 px centrée en largeur et en hauteur, recherche,
  assistant et cloche gardés en haut à droite (PageHeader tools={false}) ; enveloppes en classes
  lg: seulement, téléphone identique au pixel près ; pastilles légales : 12 px et marges réduites
  sous 1024 px, elles tiennent sur une ligne à 390, 375 et 360 px, ordinateur inchangé
Constat : le serveur de dev d'Antonino servait l'ancien cadre des pages d'accès (pages collées aux
  bords) ; relancé avec son cache vidé (rm -rf .next/dev), toutes les pages contrôlées ensuite
Tests : check OK (Vitest 132), test:e2e 90 + 4 ignorés ; db:reset puis profil d'Antonino restauré
```

### D-34, étape 3 du prompt Claude Design : pages d'entrée
```
Date : 2026-10-23
Demande : étape 3 (§7.1) ; inscription au prototype en gardant la confirmation du mot de passe
Fait :
  - components/layout/entry-ui (titre, pastille d'icône, bandeau d'erreur, carte d'information,
    lien retour, boutons pleine largeur), account-kind-cards (cartes radio Coach / Sportif),
    form-styles.entryInputClass (52 px), Checkbox multiline, Spinner à la couleur du texte
  - messages du prototype dans les schémas (« Indique ton adresse e-mail. », « Cette adresse
    e-mail ne semble pas valide. », « Choisis un mot de passe. », « Au moins 10 caractères… »,
    « Tu dois accepter les conditions pour continuer. ») ; actions login, inscription, mot de
    passe et invitation : une erreur par champ (field-errors.ts) + bandeau pour le reste
  - connexion (carte de marque mobile de D-33 gardée), inscription, /verifier-email (cookie
    httpOnly signup-cookie.ts, resendConfirmation), bienvenue (welcome-ready : coach / sportif ;
    onboarding-form pour Google / Facebook / Apple), mot de passe oublié, nouveau mot de passe,
    invitation (carte de l'organisation, adresse verrouillée), lien invalide, accès refusé
    (compte connecté, retour à son espace, changer de compte), pages légales (LegalDocument :
    retour, pastilles, sommaire, sections 01 à 0N)
  - boutons Google / Facebook / Apple restylés (toujours cachés sans clés) ; auth-fields supprimé
Écarts assumés : carte d'invitation au nom de l'organisation (le nom du coach n'est pas transmis
  par la fonction d'invitation) ; case « 18 ans » de l'invitation sans mention des conditions
  (leur acceptation n'est pas enregistrée pour les sportifs invités, à décider) ; après un
  nouveau mot de passe, arrivée directe dans l'espace (session déjà ouverte) ; adresse de contact
  des pages légales laissée « [à compléter] »
Tests : check OK (Vitest 132, messages du prototype testés), test:e2e 90 + 4 ignorés (nouveau :
  renvoi de l'e-mail) ; parcours réels coach et sportif vérifiés en production locale ;
  db:reset puis profil d'Antonino restauré
```

### D-33 : thème clair par défaut, carte de marque sur la connexion (téléphone)
```
Date : 2026-10-23
Demande : « l'étape ne me convient pas sur mobile » : ajouter la carte de marque avec
  l'illustration sur la page de connexion, formulaire centré, TÉLÉPHONE uniquement, inscription
  à ne pas toucher ; puis « mettre le mode clair par défaut »
Fait :
  - tokens.css : `:root, [data-theme="light"]` = clair, `[data-theme="dark"]` = sombre, placé après
    (il l'emporte quand il est choisi) ; themeInitScript applique « dark » s'il est retenu ;
    ThemeToggle (serveur : clair) ; barre du navigateur blanche (themeColor, colorScheme light)
  - connexion : carte lg:hidden (BrandPitch partagé avec le panneau de l'ordinateur, boucle ∞ en
    filigrane), formulaire en my-auto ; la coquille donne toute la hauteur à une page marquée
    data-mobile-fill (sélecteur :has), les autres pages ne changent pas
Vérification : captures avant / après comparées au pixel en thème sombre : inscription,
  mot de passe oublié, lien invalide et connexion sur ordinateur identiques (seule l'icône du
  bouton de thème diffère pendant le chargement) ; connexion sur téléphone : carte + formulaire
  centré (390 × 844), carte puis formulaire avec un léger défilement sur iPhone SE (375 × 667)
Tests : check OK (Vitest 130), test:e2e 88 + 4 ignorés (test du thème inversé : clair par
  défaut, sombre au choix) ; db:reset puis profil d'Antonino restauré
```

### D-32, étape 2 du prompt Claude Design : coquilles de navigation
```
Date : 2026-10-23
Demande : étape 2 du prompt (§5) : entrée, coach et admin, sportif
Fait :
  - components/layout : AppShell (barre latérale 252 px collante ≥ 1024 px : logo, menu
    PRINCIPAL / PLUS, carte de la personne, déconnexion, thème), MobileTopBar (logo, titre centré
    lu dans l'adresse, cloche, hamburger plein écran pour coach et admin), AthleteTabBar (5 onglets
    du sportif), PageHeader (retour, H1 28 / 34, phrase, outils ordinateur : recherche ⌘K,
    Assistant IA, cloche, puis actions ; pleine largeur sur téléphone), PageBody, PageLoading,
    navigation.ts (menus des 3 espaces, parent allumé pour les sous-pages), modules.ts
  - modules pas encore construits (D-32) : /coach/<module>, /app/<module>, /admin/<module>, page
    du module avec état vide honnête, sans badge ; /coach/bientot supprimé ; profil du sportif
    porte la déconnexion sur téléphone
  - en-têtes des pages existantes passés sur PageHeader (tableau de bord, sportifs, nouveau
    sportif, fiche, invitation, agenda, séances, paramètres, espace sportif, admin) ; fils
    d'Ariane remplacés par le lien retour ; emoji retiré du tableau de bord
  - EntryShell (layout des groupes (entree) et (auth)) : panneau de marque 44 % du prototype,
    sur-titre INVITATION / ESPACE COACH / ESPACE SPORTIF / PLATEFORME DE COACHING, pied
    Conditions · Confidentialité · Mentions légales ; LegalShell (groupe (legal), 720 px) ;
    page /mentions-legales provisoire
  - getAthleteLinks renvoie aussi le nom, le sexe et la photo de la fiche (carte du menu)
Écarts assumés : pas de pastilles de compteur (Tâches 2, Messages 3) ni de point rouge sur la
  cloche tant qu'aucune donnée réelle ne les alimente ; recherche du coach = sportifs (vraie liste)
  en attendant la recherche globale ; contenus des pages (formulaires, cartes) : étapes 3 à 5
Tests : check OK (Vitest 130), build OK, test:e2e 88 + 4 ignorés (aides et 6 tests adaptés :
  seuil 1024 px, déconnexion du sportif, lien retour, titre « Administration », recherche,
  page vide du module) ; db:reset puis profil d'Antonino restauré ; captures 390 et 1440
```

### D-32, étape 1 du prompt Claude Design : jetons et composants
```
Date : 2026-10-23
Demande : suivre COORY_PROMPT_CLAUDE_CODE.md étape par étape (option a : vraies fonctionnalités) ;
  étape 1 = jetons + composants, au pixel près des prototypes (docs/design/prototypes/)
Fait :
  - jetons : couleurs existantes gardées (règle 2), ajout --panel, --accent-line, --ok-line ; rayons
    control 12 / wide 14 / kpi 18 / card 20 / sheet 22 ; échelle page 28-34, entry 32-40, block 18,
    corps 15 ; teintes 10 % (cartes chiffrées) et 12 % (blocs d'agenda) ; mouvement (ease-coory,
    pulsation des squelettes, rotation du spinner, prefers-reduced-motion)
  - composants mis à jour : Button (44 / 54 px, rayon 12-14), IconButton 44, champs 50 px en 16 px,
    zone de texte (textareaClass), pastilles 40 px (chip.ts), Badge 12 px + point de discipline +
    statusTone, Avatar (xs à xl, pastille ♀ / ♂), Segmented (option choisie en rouge), PageTabs
    (soulignés sur ordinateur, pastilles sur téléphone)
  - composants créés : Field + FieldError (icône circle-alert), PasswordInput + PasswordGauge
    (4 segments, score du prompt, test unitaire), Checkbox, Toggle, KpiCard + KpiGrid, Card,
    MicroLabel, Stepper, Sheet / ActionMenu / ConfirmDialog (<dialog> natif : focus piégé, Échap,
    fond), ToastProvider + useToast, EmptyState, ErrorState, SkeletonLines, Spinner, navItemClass
  - ConfirmSubmitButton passe par la fenêtre de confirmation (plus de window.confirm) : titre,
    texte, bouton d'action ; 3 usages et 4 tests e2e adaptés
  - vitrine /design/composants (introuvable en production) pour comparer avec Coory Composants
  - prototypes ignorés par ESLint et Prettier (code exporté de Claude Design)
Écarts assumés : œil barré quand le mot de passe est caché (demande d'Antonino) ; libellé « Afficher
  les caractères saisis » (sinon getByLabel « Mot de passe » trouve deux éléments) ; thème clair
  aux gris chauds du projet et filets plus marqués (contraste D-22) au lieu des valeurs du prompt ;
  zone du toast en aria-live sans role="status" (sinon confondue avec les statuts des formulaires)
Tests : check OK (Vitest 130), test:e2e 88 + 4 ignorés ; db:reset puis profil d'Antonino restauré ;
  captures de la vitrine 390 et 1440, sombre et clair, feuille, menu, confirmation, toast
```

### D-31 : pages Connexion et Inscription d'après COORY_AUTH_PAGES.md, plus de page d'accueil
```
Date : 2026-10-23
Demande : recoder /login et /inscription selon COORY_AUTH_PAGES.md ; supprimer la page d'accueil
  « Programmer, publier et suivre tes sportifs… Se connecter »
Fait : / redirige vers /login ; groupe (entree) avec AuthShell (panneau de marque, accroche, boucle ∞
  en filigrane via CooryWatermark, pied de page) et auth-fields (champs, AFFICHER / MASQUER partagé,
  jauge de mot de passe, case des conditions, bouton principal) ; sur-titre ESPACE COACH / ESPACE
  SPORTIF basculé en CSS (:has) ; erreurs affichées sous le champ concerné (l'action renvoie le nom du
  champ, validation inchangée) ; bouton d'inscription inactif tant que la case n'est pas cochée
Écarts assumés : choix coach / sportif en boutons radio (plus juste que aria-pressed) ; bouton de
  bascule nommé « Afficher les caractères saisis »
Tests : e2e mis à jour (libellés, radio, bouton inactif) ; check OK, test:e2e 88 + 4 ignorés ; db:reset
  puis profil d'Antonino restauré ; captures 1440, 768, 390, sombre et clair
```

### D-30 : inscription libre (coach et sportif), connexions sociales préparées
```
Date : 2026-10-23
Demande : page d'inscription (nom, prénom, e-mail, téléphone facultatif, mot de passe, confirmation)
  et connexion Google, Facebook, Apple. Choix : coachs ET sportifs ; connexions préparées, boutons
  cachés sans clés ; case d'acceptation + pages légales provisoires
Fait :
  - migration 20261023074320_inscription_libre.sql : table account_signups (type, identité,
    téléphone, version et date d'acceptation des conditions), coach_profiles.phone, fonction
    complete_signup (SECURITY DEFINER : e-mail confirmé obligatoire, une seule fois ; coach =
    organisation + propriétaire + profil ; sportif = compte en attente de rattachement)
  - config.toml : enable_signup = true, enable_confirmations = true, e-mail de confirmation en
    français (supabase/templates/confirmation.html), sections Google et Facebook désactivées
  - features/auth : signup-schemas (pur), signup-actions (inscription sans révéler les adresses déjà
    inscrites, OAuth, finalisation), providers (AUTH_PROVIDERS), getHomePath (compte sans rôle →
    /bienvenue), requireAthleteAccount (sportif en attente)
  - pages /inscription, /bienvenue (pré-remplie, aussi pour Google / Facebook / Apple), /conditions,
    /confidentialite (provisoires), lien depuis /login, espace sportif « Ton compte est prêt »,
    /auth/confirm accepte /bienvenue et /espace, proxy (/bienvenue protégée)
  - docs/AUTH_FOURNISSEURS.md (création des clés), README, .env.example (AUTH_PROVIDERS)
Correctif en route : le test « Paramètres » modifiait le profil du coach A utilisé par Antonino
  (prénom et entreprise écrasés) ; il tourne maintenant sur le coach B, profil d'Antonino rétabli
Tests : pgTAP 13_inscription (12) ; Vitest signup (5) ; e2e signup.spec.ts (coach et sportif
  jusqu'à leur espace avec le vrai e-mail Mailpit, erreurs, absence de boutons sociaux, pages
  légales) ; check OK, Vitest 125, db:test 186, test:e2e 88 + 4 ignorés ; db:reset puis profil
  d'Antonino restauré
Limite : connexions sociales « intégration préparée, non testée en réel » (pas de clés)
```

### Correctifs de l'audit du 23/10 (contraste du thème clair, code mort, roadmap)
```
Date : 2026-10-23
Demande : après l'audit, corriger le contraste du thème clair, le code mort et les cases de la roadmap
Contraste (thème clair, mesuré au script sur fond, panneau, survol, pastille, cartes teintées, menu
  actif) : plus de défauts que les deux connus. Corrigés : gris (--muted #5d5d64, --faint #62626a),
  rouge (--accent #d91f34 : texte blanc du bouton 4,47 → 5:1 ; --accent-text #bb1529), badges de
  statut (--ok #166534, --warn #8a4b06), --amber #924207, --green #166534 ; tout ≥ 4,5:1. Logo inchangé
Code mort (recherche des exports jamais utilisés) : supprimés components/ui/card.tsx (Card,
  StatCard), types NewAthleteInput, AthleteUpdateInput, AvailabilityInput, LoginInput, fonctions
  parseWeek, busyHours, nextSessionFor (et leurs tests) ; plus aucun export inutilisé
Roadmap : P0-01 à P2-05 cochés, avec ce qui reste pour P0-02, P1-01, P2-04, P2-05
Tests : check OK (typage, lint, format), Vitest 120/120, test:e2e design.spec.ts OK ; captures en clair
```

### D-29 : couleurs des maquettes (thème sombre bleu nuit)
```
Date : 2026-10-23
Demande : « ajuster les couleurs par rapport à la maquette »
Méthode : couleurs mesurées au pixel (PIL) sur tableau-de-bord.png et agenda.png ; contrastes WCAG
  calculés avant d'appliquer (script) : textes ≥ 4,5:1 partout, texte des blocs d'agenda ≥ 6:1
Fait : tokens.css (sombre : --page #070b12, --bg #0b1019, --surface #121821, --surface-2 #1a2331,
  --chip #243044, --bar #2b3648, --text #f1f4f8, --muted #9ba6b5, --faint #97a2b2 ; jetons --tint-card,
  --tint-nav, --tint-block par thème) ; cartes chiffrées, menu actif, blocs d'agenda (barre de 3 px à
  gauche) ; themeColor #0B1019 ; COORY_DESIGN_SYSTEM.md ; maquettes déposées par Antonino ajoutées au dépôt
Tests : check OK, test:e2e design.spec.ts OK ; captures sombre et clair
```

### D-28 : tableau de bord d'après la maquette, photos de profil, menu complet, téléphone
```
Date : 2026-10-22 et 23
Demande : tableau de bord identique à la maquette (vraies données + « Bientôt » pour le reste), photos
  libres de droits ET vraie fonctionnalité photo de profil, menus futurs visibles « Bientôt » ;
  Tâches / Messages / Documents / Paramètres en bas du menu ; profil coach avec prénom, nom,
  entreprise ; téléphone : hamburger, agenda 3 colonnes défilantes, vues Semaine / Mois / Aujourd'hui
  sans quitter la page, en-tête centré ; maquettes des autres pages mises de côté
Fait :
  - migration 20261022214122_photos_de_profil.sql : espace de stockage privé profile-photos (2 Mo,
    JPEG/PNG/WebP), règles d'accès par organisation (dossier org/) et par compte (dossier user/),
    athlete_profiles.photo_path, table coach_profiles (prénom, nom, entreprise, photo)
  - features/photos (validate pur : signature des octets, chemins autorisés ; actions envoi/retrait),
    route /photos/[...path] (sert l'image avec la session, 404 sinon), Avatar avec photo,
    PhotoForm (fiche > Profil, Paramètres), limite des actions serveur à 3 Mo
  - features/coach (profil, action) ; page Paramètres ; carte du coach ; cloche « bientôt »
  - menu : modules « Bientôt » (coming-soon.ts, pages /coach/bientot/[module]), second groupe en bas,
    hamburger téléphone (dialog natif), barre d'onglets du bas supprimée
  - tableau de bord : « Bonjour {prénom} », période + « Créer », 4 cartes (2 réelles), agenda
    (features/agenda/week.ts pur : semaine, journée, mois, chevauchements, dernière séance),
    tâches / revenus / programmes / factures en « Bientôt », sportifs récents
  - seed : 12 photos de démo (supabase/seed-photos, CREDITS.md, scripts/seed-photos.mjs lancé par
    npm run db:reset), profils des coachs de démo
  - docs/design/MAQUETTES.md + maquettes du tableau de bord et de la fiche sportif
Bugs trouvés en route : barre d'onglets du bas couverte par la liste de la semaine (clics perdus,
  corrigé puis barre remplacée par le hamburger) ; menu « Créer » ambigu pour les tests (nommé)
Tests : pgTAP 12_photos (12) ; Vitest photos (3), week (5) ; e2e photos.spec.ts, vues de l'agenda,
  menu « Créer », hamburger ; aides goToCoachSection / logoutCoach ; check OK, Vitest 120,
  db:test OK, test:e2e 80 + 4 ignorés ; db:reset final ; captures ordinateur et téléphone
```

### Revue d'Antonino, retouche 1 : tableau de bord
```
Date : 2026-10-22
Demande : retirer « Ton organisation » (doublon du menu Sportifs) et mettre à la place une semaine
  des coachings individuels du coach
Fait : coaching-week.tsx (semaine en cours, lundi -> dimanche, séances individuelles seulement, dates
  calculées ; sept colonnes sur ordinateur, liste sur téléphone ; lien « Voir l'agenda ») ; le nom de
  l'organisation reste sur la carte « Sportifs actifs » ; tests e2e : accès à la liste par le menu
  « Sportifs », nouveau test du bloc
Tests : check OK, test:e2e 71/71 + 3 ignorés, db:reset final ; captures sombre, clair, téléphone
```

### P2-05b : séances encadrées du coach (D-27)
```
Date : 2026-10-22
Demande d'Antonino : l'agenda, ce sont d'abord les séances que le coach encadre en présentiel (ex.
  chaque mercredi 19 h sur piste) ; l'agenda du sportif avec ses séances de programme viendra avec
  P4 à P6. Choix : collectives + individuelles, liste d'inscrits, compétitions gardées comme calque
Fait : migration 20261022201934_seances_encadrees.sql (coach_sessions : type, titre, discipline, lieu,
  sportif si individuelle, début, heure locale, durée, répétition hebdomadaire, fin facultative ;
  coach_session_athletes : inscrits ; RLS coachs de l'organisation ; type et sportif non modifiables) ;
  features/sessions (schemas pur : lecture du formulaire, occurrencesBetween, describeSchedule ;
  queries avec relations nommées ; actions create/update/delete avec contrôle des sportifs côté
  serveur) ; features/agenda/items.ts (fusion pure séances + compétitions, filtres) ; pages
  « Nouvelle séance », détail, « Modifier » ; agenda : bouton « Nouvelle séance », « 7 prochains
  jours », séances avec heure dans la grille du mois et la liste téléphone, filtre « Hybride » ;
  seed : 2 collectives (mercredi piste, samedi Hyrox), 1 coaching individuel hebdomadaire, 1 test
  ponctuel, 1 séance en organisation B
Tests : pgTAP 11_seances (14), Vitest sessions (9) + agenda-items (3), test:e2e sessions.spec.ts
  (collective : 4 mercredis en janvier 2027, filtre, modification, suppression ; individuelle :
  erreur puis saisie conservée ; isolation org B) ; check OK ; db:reset final ; captures sombre,
  clair, téléphone
Limites : présence réelle et annulation d'une seule date reportées (OPEN-18) ; séances visibles du
  sportif avec son espace (P6)
```

### P2-05a : agenda du coach, calque des compétitions (D-27)
```
Date : 2026-10-22
Choix d'Antonino : l'agenda montre d'abord ce qui est daté et réel (les séances n'existent pas encore) ;
  puis, précisé ensuite (D-27) : l'agenda est surtout celui des séances encadrées du coach, les
  compétitions y restent comme calque
Fait : page /coach/o/[orgId]/agenda (entrée « Agenda » dans la navigation, ordinateur et téléphone) ;
  « Prochaines échéances » (J-n) ; mois en grille sur ordinateur, liste par jour sur téléphone ; filtres
  dans l'adresse (?mois=, ?discipline=, ?sportif=) sans JavaScript ; lien vers l'onglet Objectifs de la
  fiche ; features/agenda/calendar.ts (pur : mois, grille du lundi au dimanche en UTC, regroupement par
  jour, libellés) ; queries.ts (objectifs datés en cours ou atteints, sportifs non archivés) ; seed :
  deux échéances de décembre, records d'Inès et de Lucas rendus cohérents avec leurs fiches
Tests : Vitest +6, test:e2e agenda.spec.ts (mois fixés dans l'adresse, filtres, isolation org B)
```

### P2-02d : records personnels (D-26, fin d'OPEN-01)
```
Date : 2026-10-22
Choix d'Antonino : historique de performances datées + meilleur temps calculé ; liste fermée
  (5 km, 10 km, semi, marathon, Hyrox avec catégorie)
Fait : migration 20261022195844_records_personnels.sql (table athlete_personal_records, catégorie
  obligatoire pour Hyrox et interdite sinon, RLS coachs de l'organisation, pas de mise à jour) ;
  features/records (schemas pur : temps mm:ss ou h:mm:ss, bornes de vraisemblance par épreuve,
  allure moyenne, bestRecords ; queries ; actions add/delete) ; section « Records personnels » dans
  l'onglet Repères (tuiles bleu course / orange Hyrox, badge « Record », historique avec suppression) ;
  événement « Performance ajoutée » dans l'historique de la fiche ; seed : performances de démo
Incident : après une erreur, React 19 remettait le menu « Épreuve » sur « 5 km » alors que l'écran
  montrait encore Hyrox : un Hyrox a été enregistré comme 5 km en test. Corrigé en reconstruisant le
  formulaire après CHAQUE réponse (compteur attempt). Même défaut REPRODUIT sur « Ajouter une mesure »
  des repères (Allure 5 km en erreur, puis renvoi : enregistrée en Endurance) : non corrigé, signalé à
  Antonino, puis CORRIGÉ avec son accord (même compteur attempt ; Playwright vérifie que le type reste
  « Allure 5 km » après l'erreur)
Tests : pgTAP 10_records (13), Vitest records (8) + activité (1), test:e2e records.spec.ts ; sélecteur du
  calculateur de test limité à son groupe (le texte « 5 km » existe désormais deux fois)
```

### P2-04c : graphique d'évolution des repères (étape 3 sur 3, D-21)
```
Date : 2026-10-22
Objectif : voir la progression d'un repère dans l'onglet Repères (section « Évolution »)
Choix : SVG dessiné à la main, sans bibliothèque (stack V1.1 : pas d'outil sans besoin démontré) ; une
  courbe à la fois, choisie par pastilles (jamais deux unités sur un même axe) ; position horizontale
  proportionnelle au temps ; allures sur axe inversé (le progrès monte), VMA en km/h ; ligne verticale +
  bulle au survol, au doigt et au clavier (flèches), annonce aux lecteurs d'écran, tableau des valeurs
Fait : features/references/series.ts (module pur : séries par repère / par exercice, une mesure par jour,
  graduations rondes, progrès en mots, referenceTone partagé avec les tuiles), reference-chart.tsx
  (composant navigateur, n'importe que des types), section « Évolution » dans references-section.tsx ;
  seed : mesures anciennes pour Thomas (VMA), Inès (race pace), Nadia (squat, soulevé de terre)
Tests : Vitest 85/85 (+9 séries/graduations), db:test 135/135, test:e2e 57/57 + 3 ignorés (nouveau parcours :
  une mesure = explication, deux = courbe + progrès, clavier, tableau) ; check OK ; db:reset final ;
  captures sombre, clair, téléphone
Limite : pas de filtre de période (inutile avec quelques mesures par an) ; à revoir si les données
  viennent un jour d'une montre (OPEN-16)
```

### D-25 : sexe du sportif et app plus colorée
```
Date : 2026-10-22
Demande d'Antonino : cercles autour des icônes des chiffres clés, chacun sa couleur ; objectif encadré en entier
  (plus de liseré gauche) ; repères et mesures en couleur ; plus de couleurs dans le tableau de bord ;
  distinguer femmes et hommes. Choix sur question : champ Sexe + symbole ♀/♂
Fait : migration 20261022192309_sexe_sportif.sql (colonne sex facultative, CHECK female/male/unspecified,
  droit de modification) ; Zod (SEXES, sexLabels), actions création/modification, sélecteur dans les deux
  formulaires ; SexMark (♀ rose / ♂ bleu ciel, annoncé « Femme » / « Homme ») dans la liste, l'en-tête et la carte
  Profil ; liste : avatar et badge de la discipline de l'objectif principal ; KeyFigure (pastille cerclée + valeur
  colorée) ; cadre complet de discipline sur les objectifs ; ReferenceTile partagé (vue d'ensemble + onglet
  Repères) ; StatCard(icon, tone) sur le tableau de bord ; jetons --female/--male (+ -soft) ; seed : sexe des
  sportifs de démo (Manon non renseignée)
Contrastes (script WCAG) : tuiles de repères OK dans les deux thèmes ; cartes teintées du tableau de bord
  ramenées de 7 % à 5 % de teinte pour garder le texte gris ≥ 4,5:1 en clair
Tests : check OK, Vitest 76/76, db:test 135/135 (+2 sur le sexe), test:e2e 55/55 + 3 ignorés (parcours fiche :
  sexe choisi, retrouvé après rechargement, ♀ visible) ; db:reset final ; captures sombre, clair, téléphone
```

### D-24 : graphite plus clair et touches de couleur sur la fiche
```
Date : 2026-10-22
Demande d'Antonino : « sur la fiche du sportif, tout est trop sombre, il n'y a pas de couleurs »
Méthode : 4 aperçus (actuel ; couleurs sur graphite ; couleurs + sombre plus clair ; couleurs en clair), CSS injecté
  seulement dans le navigateur de capture ; choix : couleurs + sombre plus clair
Contrastes (script WCAG) : 31 paires OK ; initiales colorées dans l'avatar teinté refusées (3,7 à 4,2:1) →
  initiales en couleur texte sur avatar teinté
Fait : tokens (graphite clair, --accent-text #ff6b79, --blue/--amber/--green + -soft), disciplineStyles
  (domain/training/discipline.ts), Avatar(colorClass), AthleteHeader(discipline), KeyFigure (pastille d'icône,
  valeur rouge), icônes de cartes rouges, liseré de discipline (vue d'ensemble + onglet Objectifs),
  themeColor #1C1C21, COORY_DESIGN_SYSTEM.md
Tests : Vitest 75/75, check OK, test:e2e 55/55 + 3 ignorés, db:reset final ; captures sombre, clair, téléphone
```

### D-23 : fond graphite et couleurs par discipline
```
Date : 2026-10-22
Demande d'Antonino : « le dark est vraiment trop dark », « pourrait-on mettre des couleurs ? »
Méthode : 4 aperçus de la fiche d'Inès (actuel, graphite, bleu nuit, icônes colorées) produits en injectant les
  couleurs dans le navigateur de capture, sans toucher au code ; contrastes mesurés ; choix : graphite + couleurs
  par discipline
Fait : tokens.css (sombre graphite, --accent-text #ff5c6c, --logo-loop, --run/--strength/--hyrox/--hybrid + -soft
  dans les deux thèmes), globals.css, logo (--logo-loop), themeColor #16161A, domain/training/discipline.ts,
  goalDiscipline (fitness = musculation), tons de Badge, pastille de discipline sur les objectifs (liste, passés,
  vue d'ensemble) ; COORY_DESIGN_SYSTEM.md mis à jour
Tests : Vitest 75/75, check OK, test:e2e 55/55 + 3 ignorés, db:reset final ; captures sombre et clair
Reste connu : thème clair, rouge sur pastille 3,9:1 et texte discret 2,6:1 (antérieur, non traité)
```

### Correctif D-22 : contraste du thème sombre
```
Date : 2026-10-22
Demande d'Antonino : « dans le thème sombre, on ne lit pas très bien, le contraste est trop faible »
Mesure (formule WCAG, script jetable) AVANT : faint 2,49:1 sur carte, muted 4,39:1 sur pastille neutre, rouge sur
  pastille « Principal » 4,48:1, bordure de carte 1,19:1, contour de champ 1,39:1
Correctif (src/styles/tokens.css + COORY_DESIGN_SYSTEM.md, thème sombre seulement) : muted #a3a3aa (7,3:1),
  faint #828289 (4,8:1), line .14 (1,5:1), line-2 .36 (3,3:1), accent-soft .11 (rouge sur pastille 4,6:1)
Non modifié : rouge #FF3347 (le logo l'utilise), thème clair. Captures avant / après comparées.
Tests : check OK, test:e2e verts, db:reset final
```

### Story P2-04b : notes du coach et historique (étape 2 sur 3, fin de P2-03)
```
Date : 2026-10-22
Story : P2-03 (notes coach vs notes visibles du sportif) + P2-04 étape 2 (historique) ; sources : docs/03 §2, D-21
Base : supabase/migrations/20261022184531_notes_coach.sql, table athlete_notes (visibility coach | athlete,
  une note de chaque sorte par sportif, texte 1–2000) ; table À PART (pas des colonnes de la fiche, que le
  sportif peut lire) ; RLS : coachs de l'organisation pour tout, le sportif lit SEULEMENT la note « athlete »
  de sa fiche ; modification limitée à body / updated_by
Code : features/notes (schemas, queries getAthleteNotes / getOwnCoachMessages, action saveNote : crée, met à jour,
  ou supprime si vide), features/activity (build.ts PUR : frise depuis création, objectifs créés / atteints /
  abandonnés, mesures, accords, invitations, activation du compte, notes ; queries.ts : 5 lectures en
  parallèle) ; fiche : onglets Notes et Historique, cartes « Notes du coach » et « Historique récent » (5 derniers,
  « Voir tout ») ; espace sportif : carte « Message de ton coach »
Rappel sous la note privée : pas de données de santé dans une note libre (champ dédié avec accord)
Seed : note privée d'Inès, message visible de Thomas ; dates réalistes des mesures et objectifs pour l'historique
Tests : Vitest 74/74 (5 nouveaux) ; pgTAP 133/133 (09_notes : 14 nouveaux, dont « le sportif ne lit jamais la note
  privée ») ; Playwright 55/55 + 3 ignorés (notes.spec : 2 tests x 2 profils) ; un test SQL restreint à son propre
  sportif (il voyait la note de démo de Thomas) ; db:reset final
Limites : note unique de chaque sorte (pas d'historique des versions) ; « Lien d'invitation créé » et non « envoyé »
  (le coach copie le lien lui-même)
Suite : étape 3 (graphique d'évolution des repères), puis records personnels et P2-05 (agenda)
```

### Story P2-04a : fiche sportif à onglets et vue d'ensemble (étape 1 sur 3)
```
Date : 2026-10-22
Story : P2-04 (profil client à onglets) ; source : maquette fournie par Antonino ; décision D-21
Choix d'Antonino : design system plutôt que copie exacte ; ne pas afficher ce qui n'existe pas ; 3 étapes
Fait :
  - en-tête en aplat : avatar, nom (Space Grotesk), statut, niveau, compte, date d'ajout, « Inviter »
  - 5 chiffres clés calculés : objectif principal, séances / semaine (souhaitées), durée max, prochaine
    compétition (« Dans N jours »), canal préféré
  - onglets (composant PageTabs du design system) dans l'adresse : ?onglet=profil|objectifs|disponibilites|
    reperes, valeur inconnue = vue d'ensemble ; fil d'Ariane « Sportifs › Nom »
  - vue d'ensemble en LECTURE : Profil du sportif, Objectif actuel (+ autres en cours), Disponibilités &
    contraintes (jours en pastilles, contraintes physiques seulement si accord), Repères & mesures (4 au plus) ;
    « Modifier » ouvre l'onglet qui contient le formulaire existant
  - barre du haut (ordinateur) : recherche de sportif tous statuts, raccourci ⌘K / Ctrl+K ; pas de cloche (P7)
Non affiché (D-21) : Créer un programme, menus Programmes / Séances / Bibliothèque, cloche, phases, photo ;
  pas encore fait : menu « ⋮ », barre latérale repliable, onglet Historique et notes (étape 2), graphique (étape 3)
Fichiers : components/ui/page-tabs.tsx, lib/format formatDay, (coach)/coach-search.tsx, layout (barre du haut),
  [athleteId]/page.tsx (onglets), athlete-header.tsx, overview.tsx
Tests : Playwright 51/51 + 3 ignorés (nouveau athlete-overview.spec : vue d'ensemble, « Modifier », recherche ;
  tests existants : ouverture de l'onglet voulu via tests/e2e/helpers.ts openAthleteTab) ; check OK ; db:reset final
Retouches validées par Antonino (22/10) : (1) plus de doublons entre chiffres clés et vue d'ensemble (tuiles
  séances / durée et ligne « canal » retirées des cartes) ; (2) sur téléphone, chiffres clés en bandeau qui
  défile horizontalement (cartes de 44 %, aimantation alignée sur la marge), onglets visibles sans défiler.
  Note roadmap : chiffres clés PROVISOIRES, à remplacer en P6 par des indicateurs de suivi.
```

### Story P2-02c : disponibilités, contraintes et accord pour les données de santé
```
Date : 2026-10-22
Story : P2-02 partie 3 ; sources : OPEN-01 tranché (D-14), docs/03 §2, RGPD art. 9 ; décision D-20 (Antonino :
  « les deux, dès maintenant » : accord par le sportif dans son espace OU noté par le coach)
Base : supabase/migrations/20261022170925_disponibilites_consentement.sql
  - athlete_profiles : sessions_per_week (1–14), available_days (lun → dim), max_session_minutes (10–300),
    schedule_constraints (≤ 500), health_constraints (≤ 300) et health_consent_at ;
    CHECK : health_constraints exige un accord en cours ; health_consent_at n'est modifiable par personne
  - athlete_consents : journal en ajout seul (accord / retrait, source sportif ou coach, preuve du coach),
    aucune écriture directe ; lecture par les coachs de l'organisation et par le sportif concerné
  - fonctions SECURITY DEFINER grant_health_consent / withdraw_health_consent : vérifient l'appelant (sportif lié
    ou coach membre), écrivent journal + fiche dans la même transaction ; le retrait efface la contrainte notée
Code : features/athletes (availabilitySchema, updateAvailability), features/consents (preuves, libellés du journal,
  erreurs, lecture, actions coach et sportif), components/ui/confirm-submit-button (confirmation avant
  effacement), form-styles checkboxChipClass (pastilles partagées) ; fiche : carte « Disponibilités & contraintes »
  (formulaire, accord, historique) ; espace sportif : carte « Tes contraintes physiques » (J'accepte / Retirer)
Seed : disponibilités de 6 sportifs ; Inès : accord noté par le coach (formulaire signé) + contrainte ;
  Thomas : sans accord (à donner depuis son espace)
Tests : Vitest 69/69 (6 nouveaux) ; pgTAP 119/119 (08 : 21 nouveaux) ; Playwright 48/48 + 2 ignorés (parcours
  coach x2 profils ; parcours sportif sur ordinateur seulement, compte de démo partagé) ; 6 anciens tests
  précisés (bouton « Enregistrer » exact, d'autres boutons « Enregistrer … » existant désormais) ; db:reset final
Limites / points à valider :
  - Le texte d'information présenté au sportif et la liste des preuves sont à faire relire (Gianluca, juriste)
  - Pas encore de politique de conservation/suppression globale (OPEN-04) ni d'export des données (P8)
  - Le parcours sportif n'est testé que sur ordinateur (compte de démo unique)
Suite : records personnels (fin d'OPEN-01) ou notes coach / notes visibles du sportif (fin de P2-03)
```

### Story P2-02b : objectifs et compétitions
```
Date : 2026-10-22
Story : P2-02 partie 2 ; sources : OPEN-01 tranché (D-14), docs/03 §2, D-18
Base : supabase/migrations/20261022164902_objectifs_sportifs.sql, table athlete_goals
  - type (10 valeurs : 5 km, 10 km, semi, marathon, autre course, Hyrox, force, composition corporelle,
    remise en forme, personnel), description, date cible, priorité (main / secondary), statut
    (active / achieved / dropped), compétition (nom, lieu), catégorie Hyrox (open, pro, doubles, relay)
  - contraintes : compétition => date ; lieu => compétition ; catégorie => objectif Hyrox ;
    index unique : un seul objectif principal EN COURS par sportif ; fiche de la même organisation (FK)
  - RLS coachs de l'organisation ; modification limitée à priority et status (corriger = supprimer et recréer)
Code : features/goals (schemas + parseGoalForm, queries listGoals, actions addGoal / setGoalStatus /
  makeGoalMain / deleteGoal, format goalCountdown), lib/format daysBetween ; fiche : carte
  « Objectifs & compétitions » (compte à rebours J-n, Atteint, Abandonné, Rendre principal, Supprimer,
  objectifs passés) et formulaire d'ajout (champs de compétition et catégorie Hyrox affichés au besoin)
Un nouvel objectif principal fait passer l'ancien en secondaire (et l'index unique le garantit en base).
Défaut corrigé (trouvé par le nouveau test) : après un envoi refusé, React remettait listes déroulantes et
  cases à cocher à leur valeur de départ ; les formulaires (objectifs ET fiche) sont maintenant reconstruits
  après chaque réponse avec la saisie renvoyée (compteur `attempt`). Test de régression ajouté (references.spec).
Seed : 11 objectifs de démo (dont un Hyrox atteint pour Inès, un trail abandonné pour Kevin)
Tests : Vitest 63/63 (9 nouveaux) ; pgTAP 98/98 (07_objectifs : 16 nouveaux) ; Playwright 45/45 + 1 ignoré
  (goals.spec x2 profils) ; db:reset final pour retirer les fiches de test
Limites / points à valider :
  - Types d'objectif, priorités (principal / secondaire) et catégories Hyrox : à faire relire par Gianluca
  - Pas de modification d'un objectif existant (supprimer puis recréer) ; pas de confirmation avant suppression
  - Le sportif ne voit pas encore ses objectifs (P6)
Suite : P2-02 partie 3 (disponibilités, contraintes, blessures avec consentement)
```

### Story P2-02a : fiche enrichie, partie 1 (identité, contact, profil sportif)
```
Date : 2026-10-22
Story : P2-02 partie 1 ; source : OPEN-01 tranché (docs/14), D-14
Base : supabase/migrations/20261022113433_fiche_identite_profil.sql
  - first_name (obligatoire, 1–80) et last_name (facultatif, 1–80) ; reprise des fiches existantes coupées au
    premier espace ; display_name devient une colonne CALCULÉE (prénom + nom), lecture seule
  - preferred_contact (email, phone, sms, whatsapp), level (beginner, intermediate, advanced, competitor),
    experience (≤ 500), training_places text[] (gym, outdoor, track, home, box ; jamais nul), equipment (≤ 500)
  - droits de modification accordés sur les nouvelles colonnes ; display_name ne s'écrit jamais
  - reprise vérifiée sur la base locale AVANT reset : 128 fiches, noms complets identiques avant/après (diff vide)
Code : features/athletes (schemas : listes fermées + libellés, optionalChoice ; queries ; actions create/update),
  invitations/queries, formulaire de création (prénom + nom), formulaire de fiche en trois parties
  (Identité, Contact, Profil sportif : listes déroulantes, pastilles à cocher pour les lieux, zones de texte)
Tests : Vitest 54/54 (7 nouveaux) ; pgTAP 82/82 (06_fiche_identite : 14 nouveaux ; 03, 04, 05 adaptés à first_name) ;
  Playwright 43/43 + 1 ignoré (nouveau test profil sportif x2 profils ; helper tests/e2e/helpers.ts
  fillAthleteName) ; db:reset puis toute la suite à nouveau verte
Correctif visuel : une pastille cochée survolée perdait son contraste (survol limité aux pastilles non cochées)
Limites / points à valider :
  - Les listes (canaux, niveaux, lieux) sont une proposition : à faire relire par Gianluca
  - Prénom composé sans trait d'union mal coupé à la reprise (« Marie Claire Durand ») : correction manuelle
  - Le matériel est un texte libre ; une liste structurée viendra si l'éditeur (P4) en a besoin
  - Le sportif ne voit ni ne modifie encore ces informations depuis son espace
Suite : P2-02 partie 2 (objectifs et compétitions)
Données de démo (demande d'Antonino, 22/10) : supabase/seed.sql contient désormais 8 sportifs INVENTÉS dans
  l'Organisation Démo A (Sophie Lambert, Thomas Peeters, Inès Benali, Lucas Janssens, Nadia El Amrani,
  Julien Dubois en pause, Manon prénom seul, Kevin Mertens archivé) et 2 dans la B ; 16 repères datés ;
  compte sportif thomas.peeters@example.test (invitation acceptée) ; invitation en attente pour Inès.
  Fiches de test effacées par db:reset. db:test 82/82, check OK, test:e2e 43/43 + 1 ignoré avec ces données,
  puis db:reset pour retirer les fiches temporaires créées par les tests.
```

### Story P0-05b : design system Coory rouge, logo aux anneaux, thème clair
```
Date : 2026-10-22
Story : P0-05 (suite) ; source : COORY_DESIGN_SYSTEM.md et COORY_LOGO.md (fournis par Antonino, à la racine)
Décision : l'accent orange #FF5A1F (PDF « Athlix ») est remplacé par le rouge signal #FF3347 ; D-16 dans 00_INDEX
Fichiers créés :
  COORY_DESIGN_SYSTEM.md, COORY_LOGO.md (spécifications, recopiées telles quelles)
  src/styles/tokens.css (jetons sombre + [data-theme="light"], valeurs exactes du §3)
  src/components/ui/coory-logo.tsx (<CooryLogo variant tone size>, useId pour les clipPath)
  src/components/ui/theme-toggle.tsx (bouton soleil/lune, useSyncExternalStore, localStorage)
  src/lib/theme.ts (clé de stockage + script anti-flash exécuté dans <head>)
  src/app/icon.svg (favicon : symbole blanc sur rouge, coins 23 %), src/app/apple-icon.png (180 px, carré plein)
  public/logo/coory-symbol-{dark,red,light}.svg (SVG du §4, pour e-mails et exports futurs)
  tests/e2e/design.spec.ts (logo annoncé « Coory », favicon, thème clair retenu après rechargement)
Fichiers supprimés : src/components/ui/logo.tsx (ancien carré « C »), src/app/favicon.ico (icône Next par défaut)
Fichiers modifiés :
  globals.css (import des jetons, @theme inline : accent-text, accent-soft, on-accent, inv, on-inv, *-soft ;
    rayons sm 7 / md 10 / card 16 / pill 20 ; text-micro 11 px ; fond de page = --bg)
  composants ui : button (variante secondary -> inverse, rayons 8/10/14, appui scale .98, iconButtonClass),
    badge (tons ok/live/warn/danger/neutral, 11 px ; danger = rouge plein texte blanc), card/StatCard (rayon 16,
    héro tout en blanc), form-styles (champs 44 px mobile / 38 px ordinateur ; erreurs en accent-text),
    filter-chips (sélection inversée), segmented (classes partagées), avatar (fond chip, 34/64 px)
  layout racine (script de thème, themeColor #0B0B0C, suppressHydrationWarning), cadres coach/accès/sportif/admin
    (nouveau logo + bouton de thème), navigation (barre 232 px, onglet actif en accent-text)
  écrans : un seul bouton rouge par vue (calculateur et « Ajouter la mesure » en inversé), cartes rayon 16,
    marges 20 px mobile / 32 × 22 px ordinateur, brand.ts sans « initial »
Commandes : npm run check ; npm run test:e2e ; captures sombre/clair × ordinateur/téléphone (script Playwright jetable)
Résultats : lint OK, typecheck OK, format OK, Vitest 47/47, test:e2e 41/41 + 1 ignoré (dont 4 nouveaux)
Limites / points à valider :
  - Texte blanc sur #FF3347 = contraste 3,6:1 : conforme pour les grands chiffres et les boutons (texte gras), pas
    pour les petits textes de la carte héro (13 et 12 px). Choix du design system, à rediscuter si besoin.
  - Pas encore de manifeste PWA ni d'icônes 192/512/1024 : à faire quand l'app deviendra installable.
  - E-mails Supabase non personnalisés (logo à ajouter quand on traduira les modèles).
  - Le thème est mémorisé par navigateur, pas par compte.
Suite : P2-02 fiche enrichie (identité et contact d'abord).
Correction demandée par Antonino (22/10) : dans l'app (barre latérale coach 32 px, en-têtes mobile, sportif et
  admin 28 px), le logo est le SYMBOLE seul (les deux anneaux), plus grand ; le mot « coory » reste sur l'accueil,
  la connexion et les autres pages d'accès. check OK, test:e2e 41/41 + 1 ignoré, captures sombre/clair vérifiées.
Ajustement final d'Antonino (22/10) : sur ORDINATEUR, le mot « coory » en 40 px (au lieu de 20) dans la barre
  latérale coach et l'en-tête sportif/admin ; sur TÉLÉPHONE (< 768 px), les deux anneaux en 28 px. 40 px dépasse les
  17–20 px conseillés par COORY_LOGO.md : choix assumé. check OK, test:e2e 41/41 + 1 ignoré, captures vérifiées.
```

### Story P0-05c : logo « C∞ry » (boucle infinie) et police Space Grotesk
```
Date : 2026-10-22
Source : nouvelles versions de COORY_LOGO.md et COORY_DESIGN_SYSTEM.md fournies par Antonino (décision D-19)
Fichiers modifiés : COORY_LOGO.md, COORY_DESIGN_SYSTEM.md (§2, §4, §10), src/components/ui/coory-logo.tsx
  (variantes wordmark / symbol / icon, tons theme / dark / red / light, plus de clipPath ni d'useId),
  src/app/layout.tsx (Space_Grotesk via next/font), globals.css (font-display), 19 titres H1/H2 et la valeur
  des StatCard en font-display, commentaires des cadres coach / sportif / admin
Icônes : src/app/icon.svg (boucle blanche sur rouge), src/app/favicon.ico (16 + 32 px, nouveau),
  src/app/apple-icon.png (180 px, boucle rouge sur graphite, carré plein) ; public/logo : coory-loop.svg,
  coory-loop-current.svg, coory-icon-dark.svg, coory-icon-red.svg (les trois coory-symbol-* supprimés)
Tailles conservées : mot 40 px sur ordinateur, boucle 28 px de haut sur téléphone, mot 24–26 px sur les pages d'accès
Résultats : check OK (Vitest 47/47), test:e2e 41/41 + 1 ignoré ; captures sombre / clair, ordinateur / téléphone
Limites : icônes PWA 192 / 512 / 1024 non générées tant qu'il n'y a pas de manifeste ; e-mails sans logo.
```

## Session du 20/10/2026
- Objectif : finir P1, dans l'ordre choisi par Antonino : P1-04 guards -> Playwright -> mot de passe oublié -> P1-05 invitation.

### Story P2-03b : calcul des allures depuis un test de Cooper ou de 5 km (OPEN-13 tranché)
```
Date : 2026-10-20
Story : P2-03 (partie b) ; amorce de DIF-04 (allures par sportif)
Décisions d'Antonino (20/10) : test de Cooper ou de 5 km ; table de % de VMA par défaut, modifiable par coach plus tard ;
  le calcul propose, le coach valide ; pas de VO2max. Décisions consignées : docs/14 (OPEN-01, OPEN-13), 00_INDEX (D-14, D-15)
Fichiers créés/modifiés :
  supabase/migrations/20261020140212_repere_vma.sql (type « pace_vma » ajouté à la contrainte)
  src/domain/training/vma.ts (vmaFromCooper = distance/200, vmaFrom5k = vitesse/95 %, parseDuration, proposePaces,
    DEFAULT_PACE_ZONES : endurance 65–75 %, marathon 80, semi et seuil 85, 10 km 90, 5 km 95)
  src/features/references/test-form.ts (lecture pure, recalcul complet côté serveur), actions.ts (addReferencesFromTest),
    schemas.ts et format.ts (VMA affichée en km/h)
  src/app/(coach)/coach/o/[orgId]/sportifs/[athleteId]/test-calculator.tsx (aperçu en direct, zones à décocher,
    formulaire remis à zéro après enregistrement), references-section.tsx
  src/app/globals.css : focus global rangé dans @layer base (un seul contour orange sur les champs, vérifié au navigateur)
  tests/unit/{vma,test-form}.test.ts (13) ; supabase/tests/database/05 (+1) ; tests/e2e/references.spec.ts (+1 x 2 profils)
Commandes exécutées et résultats :
  npm run check -> exit 0 (Vitest 47/47) ; db:test 68/68 ; test:e2e 37 passés + 1 ignoré, 3 exécutions stables
  Capture téléphone du calculateur ; mesure des styles de focus au clavier (champ : bordure #FF5A1F sans contour ;
  lien : contour orange)
Bugs/limites :
  - Pourcentages dans une constante : réglage par coach à faire (story « réglages des zones »)
  - Tempo et race pace Hyrox restent manuels ; pas d'ajustement selon le niveau
  - Approximation Cooper (distance/200) et ratio 5 km/VMA (95 %) à faire relire par Gianluca
Prochaine story : P2-02 (fiche enrichie : prénom/nom, objectifs et compétitions, disponibilités, contraintes,
  blessures avec consentement, niveau, matériel, records, canal de contact)
```

### Story P2-03a : repères datés (allures running, FC, charges de référence)
```
Date : 2026-10-20
Story : P2-03 (partie a) : repères datés ; préalable aux allures calculées par sportif (DIF-04)
Objectif et fichiers specs lus : docs/03 §2 (repères running, muscu/Hyrox), docs/05 §4, §7, §8 (RUN-01), docs/11 §2
Fichiers créés/modifiés :
  supabase/migrations/20261020133811_reperes_sportifs.sql (athlete_reference_metrics : 11 types, plage d'allure en s/km,
    bpm, charge + exercice + répétitions, source, date ; cohérence type/valeurs en CHECK ; FK composite fiche+organisation ;
    RLS membres : lecture, ajout, suppression ; AUCUNE mise à jour = historique immuable)
  supabase/tests/database/05_reperes.test.sql (12 tests)
  src/domain/training/pace.ts (premier module de domaine : parsePace, parsePaceRange, formatPace, paceToSpeedKmh ;
    « 4:5 » refusé avec explication au lieu d'être deviné)
  src/features/references/{schemas,queries,actions,format}.ts ; src/lib/format.ts (formatDate, todayIsoInBrussels)
  src/app/(coach)/coach/o/[orgId]/sportifs/[athleteId]/{references-section,add-reference-form}.tsx, page.tsx
  tests/unit/{pace,references}.test.ts (19 tests) ; tests/e2e/references.spec.ts (2 scénarios x 2 profils)
Correctif transversal : React 19 vide un formulaire d'action après CHAQUE envoi, même en erreur. Les actions de fiche
  et de repères renvoient désormais la saisie, réaffichée en cas d'erreur (vérifié par un test E2E).
Commandes exécutées et résultats :
  npm run check -> exit 0 (Vitest 34/34) ; npm run db:test -> 67/67 ; npm run test:e2e -> 35 passés + 1 ignoré, 3 exécutions
  Captures ordinateur/téléphone ; cartes « actuelles » triées par type (allures, FC, charges)
Bugs/limites :
  - Les formules d'allures et zones (OPEN-13) ne sont PAS implémentées : on stocke les repères, on ne calcule rien
  - Le sportif ne voit pas encore ses repères (P6) ; exercice en texte libre en attendant le catalogue (P3)
  - Notes coach / notes visibles sportif (reste de P2-03) : à faire
Prochaine story : P2-03b (notes coach vs notes visibles sportif) ou P2-02 (objectifs et disponibilités, OPEN-01)
```

### Story P2-01b : fiche sportif, modification, archivage, recherche et filtres
```
Date : 2026-10-20
Story : P2-01 (suite) : CRM-02 (recherche, filtres, statut, archivage) et CRM-03 partiel (fiche)
Objectif et fichiers specs lus : docs/03 §1 et §6, docs/10 (design), design system Coory
Fichiers créés/modifiés :
  src/features/athletes/schemas.ts (athleteUpdateSchema, athleteListFilterSchema) ; queries.ts (listAthletes avec
    filtre statut + recherche, getAthlete) ; actions.ts (updateAthlete : e-mail verrouillé si compte activé)
  src/components/ui/{filter-chips,segmented,avatar}.tsx (composants du design system)
  src/app/(coach)/coach/o/[orgId]/sportifs/page.tsx (recherche GET, pastilles ?statut=actifs|en-pause|archives|tous)
  src/app/(coach)/coach/o/[orgId]/sportifs/[athleteId]/{page,athlete-edit-form}.tsx (fiche, 404 si autre organisation)
  tests/unit/athletes.test.ts (4) ; supabase/tests/database/03 (+1 test positif : un coach modifie/archive son sportif)
  tests/e2e/athlete-profile.spec.ts (2 scénarios x 2 profils) ; invitation.spec.ts (e-mail verrouillé sur la fiche)
Commandes exécutées et résultats :
  npm run check -> exit 0 (Vitest 15/15) ; npm run db:test -> 55/55 ; npm run test:e2e -> 31 passés + 1 ignoré, 3 exécutions
  Captures ordinateur et téléphone de la liste filtrée et de la fiche ; nom tronqué sur téléphone corrigé (retour à la ligne)
Points de sécurité vérifiés : fiche d'un sportif de l'organisation B ouverte par le coach A via l'URL -> 404 sans fuite ;
  filtres d'URL validés par Zod (valeurs fantaisistes -> valeurs sûres) ; recherche sans construction de requête SQL
Incidents de test (corrigés) : sélecteurs ambigus (lien du nom et lien « Inviter [nom] ») ; deux tests parallèles ont
  créé un sportif à la même milliseconde (suffixe rendu aléatoire dans tous les tests)
Bugs/limites :
  - Recherche filtrée côté serveur en mémoire (quelques dizaines de sportifs) : pagination et recherche en base à prévoir
  - Champs de fiche minimaux en attente d'OPEN-01 (objectifs, disponibilités : P2-02)
Prochaine story : P2-03 (repères datés : tests, allures, charges ; préalable à DIF-04)
```

### Stories P0-04 et P0-06 : Vitest et ADR du socle
```
Date : 2026-10-20
P0-04 : vitest 5.0.5 (vitest.config.mts : alias @ et neutralisation de server-only), script test, check inclut test
  tests/unit/schemas.test.ts (validations fiche sportif, connexion, mot de passe) ;
  tests/unit/invitation-token.test.ts (format, unicité sur 1000 tirages, empreinte SHA-256 identique à pgTAP)
  Résultat : 11/11 en 0,3 s ; npm run check exit 0
P0-06 : docs/adr/0001-socle-technique.md (choix, alternatives écartées, conséquences, règle des futures ADR)
Prochaine story : P2-01b (fiche sportif : modifier, archiver, rechercher, filtrer)
```

### Story P0-05 : design system Athlix, navigation, pages d'erreur
```
Date : 2026-10-20
Story : P0-05 (shell UI responsive, pages erreur/404, design tokens)
Source : Design-system-Athlix.pdf fourni par Antonino (valeurs relevées sur le PDF rendu en haute définition ;
  couleurs de statut et filets mesurées au pixel). Nom de travail : « Athlix », centralisé dans src/config/brand.ts.
  Recherche : « Athleex » est déjà un logiciel concurrent pour coachs (Product Hunt, août 2026) ; « Athlix » est utilisé
  par d'autres produits : vérification BOIP/EUIPO et nom de domaine à faire avant toute mise en ligne.
Dépendance ajoutée (justification) : lucide-react 1.60.0 (icônes imposées par le design system, navigation)
Fichiers créés/modifiés :
  src/app/globals.css (tokens : neutres, texte, filets, accent, statuts, rayons, échelle typographique ; sombre seul)
  src/app/layout.tsx (titre « %s · Athlix », Geist + Geist Mono, couleur de thème)
  src/config/brand.ts ; src/components/ui/{button.ts,badge,card,logo,simple-shell,logout-button}.tsx, form-styles.ts
  src/app/(coach)/{layout,coach-nav}.tsx (barre latérale ordinateur, onglets en bas téléphone, liens réels seulement)
  src/app/(auth)/layout.tsx ; acces-refuse, lien-invalide, invitation déplacés dans (auth) (URL inchangées)
  src/app/(athlete)/layout.tsx, src/app/(admin)/layout.tsx, src/app/not-found.tsx, src/app/error.tsx
  Toutes les pages reprises (classes zinc provisoires -> tokens) ; tableau de bord coach avec chiffres RÉELS
  (sportifs actifs, comptes activés, invitations en attente), liste des sportifs avec badges de statut
  tests/e2e/auth.spec.ts et password-reset.spec.ts : sélecteur du nom d'organisation ciblé sur le lien
Commandes exécutées et résultats :
  npm run check -> exit 0 ; npm run build -> OK ; npm run test:e2e -> 27 passés + 1 ignoré, 2 exécutions
  Captures Playwright ordinateur (1440 px) et téléphone (Pixel 7) : accueil, connexion, tableau de bord, sportifs,
  ajout, 404 ; 3 ajustements mobiles faits après relecture (grille 2 colonnes, bouton compact, formulaire en haut)
Bugs/limites :
  - Thème clair du design system non fait (sombre uniquement)
  - Navigation : une seule organisation gérée (la première) ; choix d'organisation à prévoir si besoin
  - Exception de l'outil de contrôle design pour la police Geist (imposée par le design system), en local
  - Composants « graphiques » du design system (courbes, calendrier, éditeur) non faits : ils arriveront avec leurs écrans
Prochaine story : P0-04 (Vitest) et P0-06 (ADR du socle), puis P2-01 suite
```

### Story P1-05 : invitation sportif par lien à copier
```
Date : 2026-10-20
Story : P1-05 (+ requireAthlete de P1-04, + page /app minimale)
Décisions d'Antonino : lien à copier (pas d'envoi auto avant P7), validité 7 jours, case obligatoire « J'ai 18 ans
  ou plus » (OPEN-11 : mineurs bloqués), page /app honnête
Objectif et fichiers specs lus : docs/02 §1, §5, §7 ; docs/11 §2 (jamais de jeton en clair) ; docs/12 §2
Fichiers créés/modifiés :
  supabase/migrations/20261020081355_invitations_sportifs.sql : athlete_invites (hash SHA-256, FK composite
    fiche+organisation, une seule invitation en attente par fiche, 7 jours max, révocation seule côté client),
    private.is_linked_athlete, policies sportif (sa fiche, son organisation), get_invitation (lecture par
    empreinte), accept_invitation (atomique : validité, expiration, âge, e-mail identique, fiche non déjà liée)
  supabase/tests/database/04_invitations.test.sql (20 tests)
  src/lib/supabase/admin.ts (clé secrète, server-only, une seule procédure), src/lib/format.ts
  src/features/invitations/{token,queries,actions}.ts ; src/features/auth/{guards,session}.ts (requireAthlete,
    getAthleteLinks, aiguillage /app) ; src/proxy.ts (/app protégé)
  src/app/(coach)/coach/o/[orgId]/sportifs/[athleteId]/inviter/{page,invite-form}.tsx,
  src/app/invitation/[token]/{page,accept-form}.tsx, src/app/(athlete)/app/page.tsx, liste des sportifs (Inviter)
  tests/e2e/invitation.spec.ts (3 scénarios x 2 profils)
Commandes exécutées et résultats :
  npm run db:test -> 54/54 PASS ; npm run check -> exit 0 ; npm run build -> OK
  npm run test:e2e -> 27 passés + 1 ignoré volontairement, 3 exécutions stables
  Clé secrète recherchée dans .next/static : 0 occurrence
Scénarios E2E : coach crée la fiche, génère le lien, « Copier » vérifié dans le presse-papiers ; sportif dans un autre
  navigateur : case 18 ans obligatoire, création d'accès, arrivée /app, refus /coach, lien à usage unique,
  reconnexion -> /app ; coach voit « compte activé » ; lien révoqué inutilisable ; lien inventé refusé
Points de sécurité vérifiés : jeton jamais stocké en clair, lien non réaffichable, invitation limitée à la même
  organisation, acceptation atomique, sportif isolé (sa fiche et son organisation seulement), AUTH-01
Bugs/limites :
  - Fiche sans e-mail : invitation impossible tant que la modification de fiche n'existe pas (P2-01 suite)
  - Sportif ayant déjà un compte : doit se connecter puis rouvrir le lien (pas de redirection automatique après login)
  - Pas de limitation du nombre d'essais sur la page d'invitation (jeton de 256 bits, risque faible) : à revoir avant prod
  - Défaut de test corrigé : fiche B ciblée avait déjà une invitation (le mauvais refus était testé)
Décisions OPEN/ADR : clé secrète utilisée pour une procédure de confiance unique (création du compte invité)
Prochaine story : P2-01 suite (modifier une fiche, recherche, filtres, archivage) ou P0-05 (shell UI / design)
```

### Story P2-01a : fiche sportif minimale, liste et ajout (préalable à l'invitation P1-05)
```
Date : 2026-10-20
Story : P2-01 (partie a), décidée avec Antonino avant P1-05 : on invite toujours un sportif qui a déjà une fiche
Objectif et fichiers specs lus : docs/03 §1 et §6, docs/11 §2, docs/02 §1
Fichiers créés/modifiés :
  supabase/migrations/20261020080822_fiches_sportifs.sql (athlete_profiles, e-mail unique par organisation
    insensible à la casse, RLS membres, update limité par colonnes, pas de delete)
  supabase/tests/database/03_isolation_sportifs.test.sql (13 tests)
  src/features/athletes/{schemas,queries,actions}.ts
  src/app/(coach)/coach/o/[orgId]/sportifs/page.tsx, .../nouveau/{page,new-athlete-form}.tsx, coach/page.tsx (liens)
  tests/e2e/athletes.spec.ts ; tests/e2e/password-reset.spec.ts (attente de fin de déconnexion)
  src/lib/supabase/database.types.ts (régénéré)
Commandes exécutées et résultats :
  npm run db:test -> 34/34 PASS ; npm run check -> exit 0 ; npm run test:e2e -> 21 passés + 1 ignoré, 3 exécutions stables
Points de sécurité/tenant vérifiés : SEC-01 sur les sportifs (lecture, création, modification, ciblage par ID),
  IDOR par URL /coach/o/[ID de B]/sportifs -> /acces-refuse, created_by et athlete_user_id non falsifiables,
  organization_id non modifiable, pas de suppression
Bugs/limites :
  - Champs minimaux (nom, e-mail, téléphone, statut) : fiche complète en attente d'OPEN-01
  - Pas encore de modification, recherche, filtres ni archivage depuis l'interface
  - Le test E2E ajoute un sportif à chaque exécution dans la base locale (nettoyé par npm run db:reset)
  - Défaut de test corrigé : course entre déconnexion et navigation (test « mot de passe oublié »)
Décisions OPEN/ADR : choix Antonino du 20/10 pour P1-05 : lien à copier, 7 jours, case « 18 ans ou plus », page /app honnête
Prochaine story : P1-05 invitation sportif
```

### Story P1-01b : mot de passe oublié et durcissement de la config Auth locale
```
Date : 2026-10-20
Story : P1-01 (partie b) : réinitialisation du mot de passe par e-mail
Fichiers créés/modifiés :
  supabase/config.toml : [auth] enable_signup=false (FAILLE CORRIGÉE : l'inscription libre était ouverte via l'API
    malgré l'absence de page) ; minimum_password_length 6 -> 10 ; site_url/additional_redirect_urls localhost:3000 et
    :3100 ; rate limit e-mail local 2 -> 30/h
  src/features/auth/password-actions.ts (requestPasswordReset : réponse identique compte existant ou non ;
    updatePassword : session de récupération requise, Zod, redirection selon rôle)
  src/features/auth/schemas.ts (newPasswordSchema, PASSWORD_MIN_LENGTH)
  src/app/auth/confirm/route.ts (échange du code PKCE, liste fermée de destinations : pas d'open redirect)
  src/app/(auth)/mot-de-passe-oublie/*, src/app/(auth)/nouveau-mot-de-passe/*, src/app/lien-invalide/page.tsx
  src/components/ui/form-styles.ts, src/app/(auth)/login/login-form.tsx (lien « Mot de passe oublié ? »)
  supabase/seed.sql (coach-reset@example.test, dédié au test E2E) ; tests/e2e/password-reset.spec.ts
Commandes exécutées et résultats :
  curl /auth/v1/signup -> signup_disabled ; curl /token coach A -> 200
  npm run test:e2e -> 17 passés + 1 ignoré volontairement (parcours e-mail sur le seul profil ordinateur), 2 exécutions
  consécutives stables ; check exit 0 ; db:test PASS
Incidents rencontrés (transparence) :
  - Ma 1re correction mettait aussi [auth.email] enable_signup=false, ce qui COUPE toute connexion par e-mail :
    détecté par les tests Playwright, corrigé (seul [auth] enable_signup doit être à false)
  - 2 défauts de test (course de navigation, fragment #error ajouté par Supabase), pas de défaut applicatif
Points de sécurité vérifiés : pas d'énumération des comptes, lien à usage unique, lien falsifié refusé,
  destination de redirection en liste fermée, mot de passe >= 10 caractères côté Zod ET côté Supabase
Bugs/limites : la vérification d'e-mail à l'inscription est sans objet (pas d'inscription avant P8) ;
  l'e-mail utilise le gabarit Supabase par défaut (en anglais) : à traduire avant la mise en ligne
Prochaine story : P1-05 invitation sportif (décisions à prendre avec Antonino)
```

### Story Playwright : premiers tests de parcours (P0-04 / P6-06 anticipé sur le parcours connexion)
```
Date : 2026-10-20
Story : installer Playwright au premier parcours réel (connexion), conformément à P0-04
Dépendance ajoutée (justification) : @playwright/test 1.64.1 + Chromium headless uniquement (~99 Mo, cache utilisateur
  hors dépôt) ; profils « ordinateur » (Desktop Chrome) et « telephone » (Pixel 7)
Fichiers créés/modifiés : playwright.config.ts, tests/e2e/auth.spec.ts, package.json (test:e2e), .gitignore,
  .prettierignore, eslint.config.mjs (rapports ignorés), README.md
  Correctif applicatif : src/features/auth/{actions,guards,session}.ts, src/app/espace/route.ts
Commandes exécutées et résultats :
  1er passage : 8 échecs / 10. Analyse : (a) sélecteur de test trop large (Next ajoute un role=alert d'annonce de
  route) ; (b) VRAI DÉFAUT : après connexion, l'adresse restait /espace alors que la bonne page s'affichait
  (double redirection non reflétée par le routeur client).
  Correctif : l'action login calcule la destination avec la session qu'elle vient d'ouvrir et redirige directement.
  2e passage : npm run test:e2e -> 10/10 PASS (5 scénarios x 2 profils, 9,5 s) ; check exit 0 ; db:test PASS
Scénarios : visiteur -> /login ; coach A connexion, voit Démo A et pas Démo B, déconnexion, /coach refermé ;
  mauvais mot de passe -> erreur générique ; coach A refusé sur /admin ; admin -> /admin et refusé sur /coach
Bugs/limites : Supabase doit tourner avant les tests (pas de démarrage automatique) ; pas encore de CI
Prochaine story : mot de passe oublié (P1-01b)
```

### Story P1-04 : garde-fous serveur de rôle
```
Date : 2026-10-20
Story : P1-04 (requireCoach, requireOrgAccess, requirePlatformAdmin ; requireAthlete reporté)
Objectif et fichiers specs lus : docs/02 §2, §6, §8 (AUTH-01, ADM-01), docs/12 §2
Fichiers créés/modifiés :
  supabase/migrations/20261020072933_admin_plateforme_verification.sql (public.current_user_is_platform_admin,
    security definer, ne répond que pour l'appelant, interdit à anon)
  supabase/tests/database/02_admin_plateforme.test.sql (5 tests), supabase/seed.sql (admin@example.test)
  src/features/auth/guards.ts (requireCoach, requireOrgAccess avec validation UUID, requirePlatformAdmin, getHomePath)
  src/app/(admin)/admin/page.tsx, src/app/acces-refuse/page.tsx, src/app/espace/route.ts (aiguillage après connexion)
  src/components/ui/logout-button.tsx, src/app/(coach)/coach/page.tsx, src/features/auth/actions.ts, src/proxy.ts
Commandes exécutées et résultats :
  npm run db:reset ; npm run db:test -> 21/21 PASS ; npm run check -> exit 0 ; npm run build -> OK
  next start + curl : coach A /coach OK, /admin refusé (aucun contenu admin dans la réponse) ; admin /admin OK,
  /coach refusé (aucune donnée coach) ; /espace -> /coach (coach), /admin (admin), /login (anonyme) ; 0 erreur serveur
Points de sécurité/tenant vérifiés : refus identique pour « interdit » et « inexistant » (pas de fuite d'existence),
  rôle admin lu côté serveur via fonction SQL, jamais via user_metadata ; admin sans accès aux organisations
Bugs/limites :
  - requireOrgAccess n'est encore utilisé par aucune page : il sera testé dès la première action métier (P2)
  - requireAthlete reporté : la table des sportifs n'existe pas encore (P1-05/P2)
  - Le refus intervenant dans un Suspense, la redirection est faite côté navigateur (pas de code 307/403 HTTP)
Décisions OPEN/ADR : forbidden() de Next 16 écarté car expérimental (authInterrupts) ; page /acces-refuse à la place
Prochaine story : Playwright (parcours connexion coach + refus croisés)
```

## Session du 19/10/2026 (après-midi)
- Date : 2026-10-19 (après-midi)
- Objectif : P1-02 / P1-03, organisations, membres et isolation RLS entre deux tenants.
- Décisions validées par Antonino : **pas de page d'inscription publique avant P8** (P8-01) ; les comptes coachs sont créés par l'administrateur ; on commence par le socle de sécurité avant la page de connexion.

### Story P1-01a : connexion, session, déconnexion, espace coach protégé
```
Date : 2026-10-19
Story : P1-01 (partie a) : connexion e-mail/mot de passe, session, déconnexion, page /coach protégée
Objectif et fichiers specs lus : docs/02 §1-2 et §8 (AUTH-01, SEC-01), docs/12 §2 et §10 (SSR/auth), doc Next 16
  embarquée (proxy, authentication-with-cache-components), guide Supabase SSR Next.js
Dépendances ajoutées (justification) : @supabase/supabase-js + @supabase/ssr (session par cookies), zod (validation
  serveur du formulaire), server-only (empêche l'import de code serveur côté navigateur)
Fichiers créés/modifiés :
  src/proxy.ts (rafraîchit la session via getClaims, redirection optimiste /coach <-> /login, en-têtes anti-cache)
  src/lib/env.ts (validation Zod des variables publiques), src/lib/supabase/server.ts (client typé, connection())
  src/lib/supabase/database.types.ts (généré par npm run db:types)
  src/features/auth/{schemas,session,actions}.ts (Zod, getCurrentUser/requireUser/getCoachMemberships, login/logout)
  src/app/(auth)/login/{page,login-form}.tsx, src/app/(coach)/coach/page.tsx, src/app/page.tsx (lien connexion)
  package.json (script db:types), README.md ; .env.local local créé (ignoré par Git)
Migrations / endpoints / vues ajoutées : aucune migration ; Server Actions login/logout ; pas de Route Handler
Commandes exécutées et résultats :
  npm run check -> exit 0 ; npm run build -> OK (/coach en Partial Prerender, /login statique, Proxy actif)
  next start + curl : /coach sans session -> 307 /login ; /login -> 200 ; coach A voit Démo A et pas Démo B ;
  coach B voit Démo B et pas Démo A ; coach connecté sur /login -> 307 /coach ; cookie falsifié -> 307 /login ;
  /coach connecté servi en Cache-Control private, no-store ; 0 erreur serveur
Tests automatiques et manuels : pas de test automatisé de l'interface (Playwright pas encore installé) ;
  test manuel navigateur par Antonino le 19/10/2026 : connexion coach-a, affichage Démo A, déconnexion,
  mauvais mot de passe -> message d'erreur : OK
Points de sécurité/tenant vérifiés : vérification serveur indépendante du proxy (requireUser), getClaims et non
  getSession, message d'erreur générique, isolation A/B visible dans l'interface, pas de cache des pages authentifiées
Bugs/limites :
  - Erreur Next « Date.now() pendant le prérendu » trouvée puis corrigée par connection() dans le client serveur
  - Reste de P1-01 : mot de passe oublié/reset et vérification e-mail (Mailpit local)
  - Pas de contrôle de rôle coach vs sportif : guards requireCoach/requireAthlete = P1-04
Décisions OPEN/ADR : aucune
Prochaine story : P1-01b (reset mot de passe) ou P1-04 (guards de rôle) ; installer Playwright pour le parcours connexion
```

### Story P1-02 / P1-03 : organisations, membres, admins plateforme et RLS
```
Date : 2026-10-19
Story : P1-02 (organisation + memberships, admin plateforme indépendant) et P1-03 (RLS + tests 2 organisations)
Objectif et fichiers specs lus : docs/02 §1-2 et §6, docs/11 §2, docs/12 §2-3
Fichiers créés/modifiés :
  supabase/migrations/20261019151645_organisations_et_membres.sql
  supabase/seed.sql (2 organisations démo + 2 comptes coachs fictifs @example.test)
  supabase/tests/database/01_isolation_organisations.test.sql (pgTAP)
  package.json (script db:test), README.md
Migrations / endpoints / vues ajoutées :
  tables organizations, organization_members (owner|coach, active|disabled, un seul owner par org), platform_admins
  schéma private + fonction private.is_org_member (security definer, search_path verrouillé)
  RLS : lecture de sa propre organisation et de ses membres uniquement ; aucune écriture client ;
        platform_admins sans policy ; anon sans aucun privilège
Commandes exécutées et résultats :
  npm run db:reset -> 2 migrations + seed appliqués
  npm run db:test -> 16/16 tests PASS
  Contre-épreuve : policy remplacée par using(true) -> tests FAIL (la fuite est détectée) ; reset -> PASS
  Connexion API Auth avec coach-a@example.test / mot de passe démo -> jeton obtenu
Tests automatiques et manuels : 16 tests pgTAP (isolation A/B dans les deux sens, ciblage par ID, membres,
  membre désactivé, admin plateforme sans accès implicite, anon refusé, écritures refusées, owner unique)
Points de sécurité/tenant vérifiés : SEC-01 et DB-01 pour organisations/membres ; ADM-01 (admin sans accès implicite)
Bugs/limites :
  - Pas encore d'interface : connexion (P1-01) et garde-fous serveur requireCoach/... (P1-04) à venir
  - Pas encore de script de création d'un vrai compte coach (prévu avec P1-01/P1-04)
  - owner_user_id de docs/11 remplacé par le membre de rôle 'owner' (un seul par organisation, contrainte en base)
Décisions OPEN/ADR : inscription publique repoussée à P8 (conforme à P8-01)
Prochaine story : P1-01 (connexion, session, déconnexion, page /coach protégée) puis P1-04
```

## Session du matin (P0)
- Date : 2026-10-19
- Objectif : cadrage technique et amorçage P0 (`P0-01` à `P0-03` uniquement).
- Décisions validées par Antonino : Node 24 LTS ; Supabase DEV en local (CLI + Docker) ; un commit par story, **sans** co-auteur.
- Réalisé : socle Next.js, environnements, outillage migrations/seed/reset (détail ci-dessous). **Aucune table métier, aucune auth, aucune RLS** : c'est P1.
- Prochaine tâche recommandée : décider du contenu de P0-04/P0-05 ou passer à P1 (voir « Points à valider »).

### Story P0-01 : socle Next.js TypeScript strict, lint, format, conventions
```
Date : 2026-10-19
Story : P0-01
Objectif et fichiers specs lus : CLAUDE.md, 00_INDEX.md, docs/01, 11, 12, 14
Fichiers créés/modifiés : package.json, package-lock.json, tsconfig.json, eslint.config.mjs, next.config.ts,
  .gitignore, .nvmrc, .prettierrc.json, .prettierignore, src/app/{layout.tsx,page.tsx,globals.css,favicon.ico},
  README.md, AGENTS.md (écrit automatiquement par `next dev`, pointe vers la doc Next embarquée)
Migrations / endpoints / vues ajoutées : page d'accueil neutre « / » (aucune fonctionnalité simulée)
Commandes exécutées et résultats :
  create-next-app 16.4.2 généré dans un dossier temporaire puis fichiers techniques copiés (aucun fichier existant écrasé)
  npm run lint -> exit 0 ; npm run typecheck -> OK ; npm run format:check -> OK ; npm run build -> OK (/ statique)
  next dev -> page servie en 200, lang="fr", contenu attendu
Tests automatiques et manuels : pas encore de test unitaire (aucune règle métier) ; contrôles qualité ci-dessus
Points de sécurité/tenant vérifiés : sans objet à ce stade
Bugs/limites :
  - Next 16.4 active par défaut `cacheComponents` : conservé, à surveiller en P1 (lecture des cookies d'auth)
  - npm audit : 5 alertes « high » sur `braces`, uniquement via la chaîne ESLint (outil de dev, pas en production) ;
    le seul correctif proposé rétrograde eslint-config-next en v14, non appliqué
  - Typographie (Geist/Arial par défaut) non traitée : relève de P0-05
Décisions OPEN/ADR : aucune
Prochaine story : P0-02
```

### Story P0-02 : `.env.example` et séparation des environnements
```
Date : 2026-10-19
Story : P0-02
Fichiers créés/modifiés : .env.example, .gitignore (exception !.env.example), README.md
Commandes exécutées et résultats :
  git check-ignore .env.local .env .env.production -> ignorés ; .env.example -> versionnable
  .env.example ne contient aucune valeur ; npm run check -> exit 0
Points de sécurité vérifiés : clé secrète Supabase documentée « serveur uniquement », jamais NEXT_PUBLIC_
Bugs/limites : projets cloud STAGING/PROD non créés (volontaire, pas nécessaire avant le déploiement)
Prochaine story : P0-03
```

### Story P0-03 : migrations versionnées, seed démo, reset DEV
```
Date : 2026-10-19
Story : P0-03
Fichiers créés/modifiés : supabase/config.toml (project_id = coaching-platform), supabase/.gitignore,
  supabase/migrations/20261019101418_socle_utilitaires.sql (fonction trigger public.set_updated_at),
  supabase/seed.sql (en-tête DÉMO, vide en P0), package.json (supabase CLI 2.121.0 en devDependency,
  scripts db:start/stop/status/reset/new), README.md
Commandes exécutées et résultats :
  npm run db:start -> Supabase local démarré (Postgres 17), migration et seed appliqués
  npm run db:reset (2 fois de suite) -> exit 0 à chaque fois, 1 migration appliquée
  Test SQL dans une transaction annulée : trigger set_updated_at met bien à jour updated_at
Points de sécurité/tenant vérifiés : fonction avec search_path = '' ; aucune donnée personnelle dans le seed
Bugs/limites :
  - Les 2 organisations de test sont reportées en P1 avec leurs tables et leur RLS (choix expliqué à Antonino)
  - Les clés locales Supabase sont les clés de développement par défaut, non commitées
Prochaine story : P0-04 (Vitest) / P0-05 (shell UI) ou P1-01
```

### Points à valider
- **Configuration Auth de production** (à reprendre à la création des projets STAGING/PROD) : inscription désactivée
  (`enable_signup=false` dans [auth], PAS dans [auth.email]), mot de passe >= 10, URLs de redirection limitées au
  domaine réel, gabarits d'e-mails en français, SMTP réel.
- `~/.npmrc` d'Antonino contient `prefix=~/.npm-global`, incompatible avec `nvm use`. Les commandes de cette session
  ont utilisé directement le binaire Node 24 de nvm. À régler par Antonino (voir compte rendu de session).

## Session précédente
- Date : 2026-10-18
- Objectif : livrer spécifications complètes prêtes à être utilisées avec Claude Code.
- Réalisé (pack) : cahier des charges V1.1, stack simplifiée, trajet SaaS, plans ; **aucun code applicatif généré dans cette archive**.
- Questions ouvertes : voir `docs/14_TESTS_ET_ROADMAP.md` (`OPEN-*`).
- Prochaine tâche recommandée : `P0-01` dépôt TypeScript, architecture dossiers et commandes de qualité.

## Format de compte rendu après chaque story
```
Date :
Story :
Objectif et fichiers specs lus :
Fichiers créés/modifiés :
Migrations / endpoints / vues ajoutées :
Commandes exécutées et résultats :
Tests automatiques et manuels :
Points de sécurité/tenant vérifiés :
Bugs/limites :
Décisions OPEN/ADR :
Prochaine story :
```
