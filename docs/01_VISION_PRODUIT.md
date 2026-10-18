# 01 — Vision produit, périmètre et catalogue de fonctionnalités

## 1. Problème réel
Un coach sportif prépare des programmes multi-semaines dans Google Sheets avec une mise en page déjà définie, mais remplace manuellement exercices, dates, jours, allures, séries, charges et temps de repos ; il exporte des PDF lisibles mais perfectibles. Son outil actuel découpe aussi planning principal, Full Body et Workload Hyrox en documents séparés. **Le besoin n'est pas d'inventer la programmation sportive** : il faut rendre réutilisables des blocs et modèles, puis les adapter rapidement aux objectifs, à la disponibilité et au niveau de chaque sportif.

## 2. Proposition de valeur
- **Coach** : passer de la copie manuelle dans des cases à un constructeur modulaire, gagner du temps, garder un historique et publier le même programme en PDF et en web.
- **Sportif** : ouvrir sur téléphone sa séance du jour, voir des consignes sans fouiller dans des PDFs, valider ce qu'il a fait et transmettre du feedback.
- **Administrateur** : piloter une plateforme SaaS isolant correctement les comptes des coachs sans accéder par défaut au contenu privé de leurs sportifs.

## 3. Public et disciplines
Cible 1 : coach spécialiste Running/Musculation/Hyrox/hybride avec 1 à plusieurs dizaines de sportifs, qui personnalise fortement. Cible 2 (après validation) : équipes de coachs et indépendants de spécialités diverses. Le logiciel n'est pas réservé à la marque BeHybrid ni aux épreuves Hyrox.

**Disciplines natives :** Running, Musculation, Hyrox, Hybride (tout mélange) ; réutiliser une seule architecture de séances et de blocs. Prévoir extensibilité par `exercise_type` et `unit_kind` sans multiplier les entités incompatibles.

## 4. Catalogue fonctionnel complet (objectif produit final)
### Espace coach
- [CRM-01] Tableau de bord : clients actifs, programmes en cours, séances attendues, retours à traiter, brouillons récents.
- [CRM-02] Liste clients : recherche, filtres sport/objectif/actif, ajout, modification, archivage.
- [CRM-03] Fiche client : objectifs, échéances/course, allures de référence, FC/zones renseignées par coach, équipement, disponibilités/jour/durée, contraintes/notes, historique.
- [CRM-04] Invitations à l'espace sportif, activation/désactivation, relations coach-client multi-tenant.
- [CRM-05] Calendrier des séances, édition date et ordre, filtre client, aperçu charge. Synchronisation Google/Apple future et optionnelle.
- [LIB-01] Catalogue d'exercices de base, filtres par discipline/matériel/mouvement, création d'exercice personnalisé par coach, duplication, favoris, visibilité privé/partagé (à arbitrer).
- [LIB-02] Bibliothèque de blocs : échauffement, fractionné, séries muscu, superset, EMOM, AMRAP, circuit, transitions, récupération.
- [LIB-03] Modèles de séances configurables (Running, Force, Hyrox, mixte) : enregistrer/dupliquer/archiver/versionner.
- [LIB-04] Modèles de semaines avec slots d'entraînement indépendants des jours exacts, et modèles de macrocycles.
- [PRG-01] Wizard de création de programme : client, objectif, durée, semaine de départ, nombre de séances, répartition, modèle ou libre.
- [PRG-02] Éditeur semaines/séances/blocs/exercices, déplacer/dupliquer/supprimer, undo/redo lorsque possible, autosave contrôlé.
- [PRG-03] Paramètres par client : allures, intensités, charges, reps, séries, récupération, variantes d'exercice, temps disponible.
- [PRG-04] Progression : copier semaines, modifications ciblées, suggestions configurables avec validation humaine, semaines de décharge.
- [PRG-05] Statuts brouillon, prêt à publier, publié/remplacé, archivé ; historique et comparaison des versions.
- [DOC-01] PDF d'un programme complet, plage de semaines ou séance ; identité coach, impression lisible, aperçus ; envoi email manuel assisté.
- [ATH-01] Vue agrégée des séances réalisées, RPE/ressenti, réalisé vs prévu, notes coach et alertes simples.
- [MSG-01] Centre de messages, brouillons/email, rappels, future intégration WhatsApp et questionnaires après 3 séances.
- [QA-01] Import/export contrôlé CSV clients et sauvegarde de données, audit des changements.

### Espace sportif
- [ATH-02] Connexion, profil, programme courant et historique des versions publiées.
- [ATH-03] Dashboard « Aujourd'hui », semaine et calendrier, prochaines séances, repos et objectifs.
- [ATH-04] Lecture détaillée d'une séance : échauffement, blocs répétitifs, consignes, vidéo/illustration facultative, unités claires.
- [ATH-05] Mode séance mobile : suivre blocs, éventuellement cocher exercices, enregistrer réel vs prévu (temps, charge, reps, distance), pause/reprise.
- [ATH-06] Marquer fait, partiel, non fait, reporté ; date réelle ; RPE 1–10, difficulté et commentaire ; corrections traçables.
- [ATH-07] Progression, régularité, volume réellement saisi et statistiques honnêtes (ne pas créer de VO2max fictive).
- [ATH-08] Messagerie et réponses aux questionnaires (V2), PDF consultable, notifications selon consentement.
- [ATH-09] Mobile PWA installable, accessible pendant l'entraînement ; mode hors ligne avec vraie synchronisation seulement en V3.

### Administration plateforme
- [ADM-01] Organisations/coachs, état et invitation, suspension contrôlée.
- [ADM-02] Abonnements/facturation (V3), limites de plan, suivi quotas et coûts intégrations.
- [ADM-03] Statut opérationnel, métriques agrégées non sensibles, erreurs, support avec accès explicite et audité.
- [ADM-04] Journal d'audit, outils de conformité, demandes de suppression/export.

### Transverse
- [AUTH-01] Authentification sécurisée, reset, vérification email, sessions, expiration/révocation.
- [SEC-01] Séparation de données par organisation + tests anti-IDOR ; RLS, validation, politiques Storage.
- [SEC-02] Consentement, confidentialité et contrôles RGPD applicables en Belgique/UE ; conservation/minimisation.
- [OPS-01] Observabilité, sauvegardes, migrations, surveillance erreurs, tests CI, accessibilité et performance.
- [OPS-02] Adaptation desktop/tablette/smartphone des 2 espaces ; édition coach mobile complète.

## 5. Livraisons progressives
**MVP A — utilité immédiate pour Gianluca** : AUTH-01, CRM-02/03, LIB-01/02/03, PRG-01/02/03/04 en mode duplication manuelle, DOC-01, responsive coach. Interface sportif non obligatoire pour le gain de temps initial.

**MVP B — démo de bout en bout** : publication immuable, espace sportif desktop/mobile, validation + RPE, retour synchronisé coach, PDF cohérent.

**V2** : bibliothèque enrichie, messagerie interne, enquêtes configurées après N séances, notifications, statistiques de charge ; import/export avancé.

**V3/SaaS commercial** : onboarding self-service multi-coachs, abonnement, équipes, automatisation WhatsApp, connecteurs calendrier, offline réel, stockage média et analytics avancés.

## 6. Exclusions et garde-fous
- Pas d'application native iOS/Android au départ ; une PWA responsive n'est pas une application iOS native.
- Pas d'IA coach autonome ni de progression automatique publiée sans validation ; aucune prescription médicale.
- Pas de synchronisation Garmin/Strava, paiement ou WhatsApp réel avant intégration explicitement approuvée.
- Pas de fausses statistiques ou d'objectifs « universels » imposés par le logiciel ; le coach décide.
- Les programmes présents dans les PDF sont des **exemples individuels** : ils ne deviennent pas des recommandations génériques.

## 7. Indicateurs de réussite mesurables
- Temps pour produire un programme 8 semaines : établir une référence Google Sheets puis comparer après 3 cas tests.
- Nombre de manipulations pour dupliquer et modifier une semaine ; absence de ressaisie des mêmes exercices.
- Export fidèle : toutes les séances et paramètres d'une version publiée figurent dans le PDF sans coupure.
- Réussite mobile : créer et modifier une séance coach sur téléphone ; lire une séance client au bord de la piste ou en salle.
- Sécurité : aucune fuite de client entre deux organisations ; lien de téléchargement contrôlé ; tests de permissions.

## 8. Acceptance globale / Definition of Done
Le parcours de démo décrit dans `15_DEMO_RECRUTEURS.md` est exécutable sur deux rôles, sur navigateur desktop et smartphone, avec persistance et sans données écrites en dur. Une nouvelle organisation ne voit jamais les sportifs d'une autre. Le PDF reflète la dernière **publication** et non un brouillon. Les tests automatiques essentiels passent et une procédure de déploiement/reprise est écrite.
