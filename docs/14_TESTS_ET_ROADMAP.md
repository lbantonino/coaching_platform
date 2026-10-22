# 14 — Roadmap, backlog de réalisation, tests et mise en production

## 1. Règle de pilotage
**Développer par tranche verticale complète**, pas une couche UI entière avant les données ni un backend sans parcours. Une story inclut schéma/migration + service/domain + route/API + écran(s) concerné(s) + RLS + tests + écrans vides/erreurs. `MVP A` (coach+PDF), puis `MVP B` (sportif+synchro), puis V2/3. Chaque sprint peut être ajusté ; les estimations ci-dessous sont des niveaux de complexité, pas des dates promises.

## 2. Phases et dépendances
| Phase | Résultat démontrable | Dépend de | Niveau |
|---|---|---|---|
| P0 Cadrage / bootstrap | Projet local, tests, conventions, migrations, 2 tenants tests | rien | modéré |
| P1 Auth & organisations | Connexion, membership, RLS, rôles coach/athlete/admin, invitations de base | P0 | élevé (sécurité) |
| P2 CRM | Fiches clients, objectifs, disponibilités, repères, responsive | P1 | modéré |
| P3 Bibliothèque | Exercice, blocs, modèles séance, modèles semaine, copies/version | P2 | élevé |
| P4 Éditeur multi-disciplines | Running, force, Hyrox/hybride, weeks, progression manuelle | P3 | très élevé |
| P5 Publication / PDF | Snapshots, versions, visualisation et PDF private storage | P4 | élevé |
| P6 Espace sportif | Accès publié, lecture mobile, complétion/RPE, retour coach | P5 | élevé |
| P7 Communication / suivi | Messages interne, notifications, enquêtes après N séances | P6 | élevé |
| BIZ Business du coach (D-17) | Forfaits, paiements reçus, tableau de bord, factures PDF, export comptable ; **sans encaissement en ligne** | Étape A : P2 ; étape B : P5 + `OPEN-17` ; placement proposé après P6, à confirmer | modéré |
| P8 Commercialisation SaaS | Onboarding autonome, paiement, plan, équipe, support, DPA | P7 + compliance | très élevé |
| P9 Extensions | intégrations, statistiques avancées, mobile offline réel, IA assistive | après validation usages | variable |

Le scénario démo recruteur devient possible à la fin de P6. Le produit initial « utile au frère » peut être livré à P5.

## 3. Backlog priorisé opérationnel
### P0 — Projet et qualité
- [ ] `P0-01` Dépôt, Next.js TS strict, lint, format, conventions modules, pre-commit facultatif.
- [ ] `P0-02` `.env.example`, instructions locales, config Supabase projet DEV distinct de PROD.
- [ ] `P0-03` Migrations versionnées, seeds anonymisés et script reset DEV.
- [ ] `P0-04` Configurer lint + `typecheck` et formatage léger ; préparer Vitest pour les premiers services métier. **N’ajouter Playwright qu’à l’arrivée d’un premier parcours E2E**, la CI au stade pertinent ; éviter des dépendances non utilisées.
- [ ] `P0-05` Shell UI responsive, page erreur/auth/404, design tokens.
- [ ] `P0-06` Valider le socle unique Next.js/React/TypeScript/Supabase. ADR obligatoire avant d’ajouter backend, ORM, file Redis, paiement, dépendance UI redondante ou moteur PDF ; documenter pourquoi les outils déjà choisis ne suffisent pas.

### P1 — Auth et multi-tenancy
- [ ] `P1-01` Connexion email, session, reset, logout, email vérifié.
- [ ] `P1-02` Organisation et memberships coach, rôle admin plateforme indépendant.
- [ ] `P1-03` RLS et policy tests 2 organisations, 2 sportifs.
- [ ] `P1-04` Guards serveur `requireCoach`, `requireAthlete`, `requirePlatformAdmin`, `requireOrgAccess`.
- [ ] `P1-05` Invitation sportif token expirant/révocable ; création sans compte préalable.

### P2 — CRM et planning
- [ ] `P2-01` Liste client responsive, création/édition, recherche, filtres, statut.
- [ ] `P2-02` Objectifs et dates, nombre de séances par semaine, durées/disponibilités.
- [ ] `P2-03` Repères running/charges datés, notes coach vs notes publiques.
- [ ] `P2-04` Profil client onglets, historique programmes, dashboard KPIs vrais.
- [ ] `P2-05` Agenda de séances/slots, mobilité des dates (première vue simple).

### P3 — Catalogue/templates
- [ ] `P3-01` Catalogue exercices, métriques permises, alias, recherche, favoris.
- [ ] `P3-02` Constructeur blocs typés et validation schéma versionnée.
- [ ] `P3-03` Modèles séances Running/Force/Hyrox/Hybride, édition et copie.
- [ ] `P3-04` Modèles semaines N slots, répartition et sélection.
- [ ] `P3-05` Versionnement modèle et test absence propagation aux copies.
- [ ] `P3-06` Saisie manuelle validée de 3 modèles exemples des PDF sources (anonymisés).

### P4 — Éditeur/programmes
- [ ] `P4-01` Wizard client+durée+slots+template en brouillon.
- [ ] `P4-02` Editeur desktop triple panneau ; sauvegarde et conflit révision.
- [ ] `P4-03` Éditeur mobile coach complet pour séances/blocs/exercices.
- [ ] `P4-04` Running : segments, cadence facultative, pace/FC, intervalles, récupération.
- [ ] `P4-05` Musculation : séries/rép/charges/EMOM/superset, notes.
- [ ] `P4-06` Hyrox : stations, distance/allure erg, AMRAP, Time Cap, répétitions.
- [ ] `P4-07` Hybride : mélanger librement étapes et formats dans même séance.
- [ ] `P4-08` Dupliquer semaine/slots, progression **manuelle**, validation, aperçu.
- [ ] `P4-09` Réordonner, déplacer, supprimer, bibliothèque -> personnalisation sans mutation source.

### P5 — PDF/publication
- [ ] `P5-01` Snapshot publication atomique, numéro version et immutabilité.
- [ ] `P5-02` Validation métier, avertissements, historique publié/brouillon.
- [ ] `P5-03` Renderer PDF A4 couverture/semaine/détails avec tests visuels.
- [ ] `P5-04` Stockage privé, download coach, inclusion de version/checksum.
- [ ] `P5-05` Préparation/envoi mail selon provider dispo ; zéro faux « envoyé ».

### P6 — Sportif et retour
- [ ] `P6-01` Connexion/invitation sportif et garde routes/API.
- [ ] `P6-02` Dashboard, semaine, séance mobile/desktop, rendu blocs.
- [ ] `P6-03` Mode suivi simple, statuts done/partial/skipped et RPE/commentaire.
- [ ] `P6-04` Feedback persisté+historique, visible coach, anti-double soumission.
- [ ] `P6-05` Republication avec historiques et PDF vN cohérents.
- [ ] `P6-06` Tests E2E parcours complet de 3 minutes ; mobile coach/sportif.

### BIZ — Business du coach (D-17 ; placement proposé après P6, à confirmer)
Étape A, suivi :
- [ ] `BIZ-01` Offres du coach : carnet de N séances, abonnement mensuel, programme en ligne ; prix saisis par le coach ; archivage sans suppression.
- [ ] `BIZ-02` Forfait attribué à un client : dates, séances incluses / consommées / restantes, échéance ; visible sur la fiche (visibilité par le sportif à décider).
- [ ] `BIZ-03` Paiements reçus saisis par le coach (espèces, virement, Bancontact sur place) ; statuts payé / en attente / en retard ; relance préparée, jamais de faux « envoyé ».
- [ ] `BIZ-04` Tableau de bord business calculé uniquement sur les données saisies : encaissé du mois, impayés, forfaits qui expirent, clients actifs.

Étape B, factures (après P5 et `OPEN-17`) :
- [ ] `BIZ-05` Factures et reçus PDF : numérotation continue sans trou ni doublon, mentions légales, TVA ou franchise ; une facture émise ne se modifie jamais (correction par avoir).
- [ ] `BIZ-06` Export comptable (CSV) ; factures électroniques Peppol pour les clients entreprises si le comptable le confirme.

**Hors périmètre (décision du 22/10/2026)** : tout encaissement en ligne d'un client au profit du coach (carte, Bancontact, prélèvement). Le paiement en ligne de P8 concerne uniquement l'abonnement du coach à Coory. Tests attendus : isolation entre organisations (RLS), numérotation des factures robuste aux envois simultanés, tableau de bord égal à la somme des paiements saisis.

### P7 — Communication et suivi (après validation)
- [ ] `P7-01` Messages internes sécurisés et vues mobiles.
- [ ] `P7-02` Notifications préférences et relances non intrusives.
- [ ] `P7-03` Règle « après N séances terminées », cooldown, idempotence.
- [ ] `P7-04` E-mail réel avec file et audit ; WhatsApp officiel seulement après opt-in+fournisseur.
- [ ] `P7-05` Stats provenant de réels saisis ; pas de métriques sportives inférées sans données.

### P8 — SaaS multi-coachs commercial (en architecture dès P1)
- [ ] `P8-01` Onboarding organisation self-service, coachs additionnels et affectation.
- [ ] `P8-02` Portail admin audit/support minimal et sécurisation forte.
- [ ] `P8-03` Définir une **offre commerciale validée** (limites de sportifs et sièges, essais, essai expiré, annulation, TVA/factures, CGV) sans inventer de tarifs avant l'étude de marché.
- [ ] `P8-03a` Choisir le prestataire de paiement (Stripe candidat, non obligatoire), implémenter checkout hébergé et portail abonné pour l'**organisation**.
- [ ] `P8-03b` Ajouter uniquement à cette phase schéma subscriptions/plans/entitlements/webhook_events ; migrations SQL et tests RLS.
- [ ] `P8-03c` Vérifier signatures webhook et idempotence, gérer événements en doublon/hors ordre, statut de paiement via fournisseur uniquement ; réconciliation documentée.
- [ ] `P8-03d` Contrôler quotas/entitlements **côté serveur** à chaque action facturable/limitée ; UI informative, pas seule protection.
- [ ] `P8-03e` Tester essai/expiration, activation, upgrade/downgrade, paiement rejeté, annulation, réactivation et accès aux documents existants.
- [ ] `P8-04` RGPD/DPA, export/suppression, sauvegardes, monitoring, support.
- [ ] `P8-05` Charge tests, quotas, politique fichiers, mise en production multi-tenants.

## 4. Matrice de tests minimale
| Cible | Unitaires | Intégration | E2E |
|---|---|---|---|
| Running | parsing allure, répétitions, volume estimé | sérialisation versionnée | éditeur course -> PDF -> sportif |
| Musculation | sets variables, unités, superset | templates/copies | Full Body mobile coach -> client |
| Hyrox | types stations, pace erg, circuits imbriqués | save/restore snapshot | circuit 8 étapes sur mobile |
| Multi-tenant | fonctions autorisation | **RLS cross-org** | coach A pas accès coach B |
| Publication | checks, hash/diff | transaction et atomicité | brouillon vs publié/PDF |
| Sportif | RPE statut transitions | droits feedback | valider et voir chez coach |
| Email/WhatsApp | triggering/cooldown/idempotence | fournisseur mock puis sandbox | jamais auto-envoi non consenti |

**Fixture d'acceptation de référence :** Sportif fictif « Camille Test », programme « Prépa Hybride 8 semaines », 4 slots/semaine : Running Sortie longue / Running Endurance / Hyrox Race Pace / Hyrox Circuit ; personnaliser une semaine et publier. Fixture parallèle : programme « Hybride 3 séances », 2 Musculation + 1 Running **sans Hyrox**.

## 5. Definition of Done générale
- Fonctionnel sur desktop et mobile concernés ; aucun bouton inerte présenté comme final.
- Types TS et validation Zod, protections serveur/RLS vérifiées ; migration et seed.
- Tests automatiques pertinents passent, `lint`, `typecheck`, `build` documentés.
- État loading/empty/error, erreurs de réseau et accès refusé.
- Docs contrat données/API et journal de suivi mis à jour.
- Test manuel de la fonctionnalité avec 1 cas vrai (sans données personnelles en repo) et validation métier coach quand nécessaire.

## 6. Décisions bloquantes / risques et suivi
- `OPEN-01` **Tranché le 20/10/2026** (Antonino, retour coach) : fiche = prénom et nom séparés, téléphone, e-mail, objectifs et/ou compétitions (type, date, priorité ; compétition : nom, date, lieu, catégorie Hyrox), disponibilités (séances/semaine, jours, durée max), contraintes d'organisation, **contraintes physiques / blessures en champ minimal** (texte court sans diagnostic, visible du coach, enregistré seulement avec consentement explicite du sportif, tracé et daté : donnée de santé, RGPD art. 9), niveau et expérience, matériel et lieu d'entraînement, records personnels (5 km, 10 km, semi, marathon, Hyrox), canal de contact préféré. Pas de date de naissance, taille ni poids sans finalité claire. **Réalisé** : partie 1 le 22/10/2026 (prénom / nom, canal préféré, niveau, expérience, lieux, matériel : `P2-02a`) partie 2 (objectifs et compétitions, priorité, catégorie Hyrox : `P2-02b`) et partie 3 (disponibilités, contraintes d'organisation, contraintes physiques avec accord du sportif ou noté par le coach : `P2-02c`, D-20), toutes le même jour, voir `SUIVI_IMPLEMENTATION.md` ; restent les records personnels.
- `OPEN-02` Programmes multiples et conflits d'agenda.
- `OPEN-03` Permission coach collaborateur et modèle d'équipe.
- `OPEN-04` Conservation/effacement et données sensibles, conditions juridiques SaaS.
- `OPEN-05` Consentement/messagerie/WhatsApp provider, coûts et modèles.
- `OPEN-06` Charte graphique/PDF, anonymisation source et propriété marque.
- `OPEN-07` Liste exacte des exercices et formats validés par coach.
- `OPEN-08` Propositions de progression (interdit d'appliquer sans validation).
- `OPEN-09` Abonnements, paiement, TVA/règles commerciales.
- `OPEN-10` Connecteurs Garmin/Strava/calendriers si voulus.
- `OPEN-11` Mineurs : non supportés tant que exigences légales non cadrées.
- `OPEN-12` Gestion coach assigné quand sportif suit plusieurs structures.
- `OPEN-13` **Tranché le 20/10/2026** : allures issues d'un **test de Cooper** (VMA ≈ distance en 12 min ÷ 200) **ou d'un test de 5 km** (allure 5 km mesurée, VMA estimée = vitesse 5 km ÷ 95 %). Allures = % de VMA, **table par défaut modifiable par chaque coach**, à faire relire par Gianluca : endurance 65–75 %, marathon 80 %, seuil et semi 85 %, 10 km 90 %, 5 km 95 %. Tempo et race pace Hyrox restent saisis à la main. Le calcul **propose**, le coach **valide** avant enregistrement ; pas de VO2max affichée.
- `OPEN-14` Définition d'un groupe (club, salle) et droits associés (avant `DIF-05`).
- `OPEN-15` Conditions actuelles des API Strava et Garmin (avant `DIF-09` étape 2).
- `OPEN-16` Fournisseur d'IA, coûts, hébergement des données et consentement (avant `DIF-08`).
- `OPEN-17` Règles de facturation du coach (D-17 étape B) : mentions obligatoires, TVA ou régime de franchise, numérotation, conservation, Peppol pour les clients entreprises. **En cours de vérification par un comptable** (Antonino, 22/10/2026).

**Différenciateurs `DIF-01` à `DIF-10`** (décision du 20/10/2026) : voir `docs/16_POSITIONNEMENT.md` §4–5 pour leur phase d'insertion. Ils ne modifient pas l'ordre P2 → P6.

## 7. Risques à surveiller
Éditeur imbriqué trop compliqué sur mobile ; versionnage mal isolé ; fuite cross-tenant ; rendu PDF qui perd blocs ; expérience trop large au démarrage ; métriques sportives non fiables ; intégrations payantes/envoi non autorisé ; dérive Claude Code vers une « jolie démo » non branchée à la base ; cas complexes (LEG CURL série/reps ambiguës) importés incorrectement.

## 8. Cadence de travail Claude Code
1. L'utilisateur donne `P3-02`, Claude lit seulement les specs nécessaires.
2. Claude propose plan, préconditions et tests ; l'utilisateur approuve.
3. Claude code la story, exécute checks, montre captures/tests si possible.
4. L'utilisateur vérifie sur navigateur avec coach réel ou fixtures.
5. Claude met à jour `SUIVI_IMPLEMENTATION.md`, marque fait si réellement vérifié, passe story suivante.

## 9. Politique V1.1 : construire le minimum qui marche, conserver la trajectoire SaaS

- **Phase P0** : uniquement socle Next.js/TypeScript/Tailwind + Supabase prévu ; `lint`, `typecheck`, `.env.example`, repo, structure modulaire, décisions. Ne **pas** installer les composants du catalogue entier, Stripe, mail, queue ou outils IA.
- **P1** : organisation, membres, Auth et RLS vérifiées sur **deux coachs indépendants**. C'est le seul surcoût SaaS à accepter dès le départ.
- **P2 à P5** : cas d'usage coach utile au frère (CRM, modèles, éditeur, PDF). Chaque story ajoute seulement la bibliothèque technique directement nécessaire.
- **P6** : application sportif fonctionnelle ; démarrer les tests E2E sur les flux complétés.
- **P7** : communication/notifications uniquement avec consentements et mécanismes d'envoi sûrs ; file/worker à décider à ce stade selon les contraintes d'exécution.
- **P8** : paiement, contrats, plans, limites et équipes supplémentaires. **Aucune dépendance Stripe imposée au MVP.**

### Recette de la simplification technique
- [ ] Une seule application Next.js, TypeScript de bout en bout et SQL migrations ; aucun backend Express/NestJS supplémentaire.
- [ ] Supabase = unique service de base/auth/stockage ; pas de seconde base ou ORM à la création du projet.
- [ ] Pas de duplication systématique Server Actions **et** REST pour la même opération métier.
- [ ] Tests cross-tenant et d'accès aux publications toujours conservés, même si on simplifie la stack.
- [ ] Documentation indique clairement « prévu » vs « implémenté ». Le journal `SUIVI_IMPLEMENTATION.md` ne change de statut qu'après tests réellement exécutés.
