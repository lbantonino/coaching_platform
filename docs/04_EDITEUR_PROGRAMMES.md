# 04 — Constructeur modulaire de programmes multi-semaines

## 1. Objectif et modèle conceptuel
Permettre de composer rapidement des programmes Running, Musculation, Hyrox et Hybrides sans repartir de zéro. **Hiérarchie métier :** exercice (mouvement) -> étape/segment (paramètres) -> bloc (séquence et répétition) -> séance -> slot dans une semaine -> semaine -> programme personnalisé -> publication immutable.

Exemple : Programme 8 semaines, quatre slots/semaine, objectif Hyrox ; slots = Sortie longue, Endurance, Race Pace, Circuit. Le coach choisit jours et durées, importe les modèles et ajuste les contenus pour ce sportif. Ces quatre séances ne sont pas un standard obligatoire ni une prescription pour tous les sportifs.

## 2. Wizard de création (PRG-01)
**Étape 1** Client existant ou nouveau. **Étape 2** Objectifs, discipline dominante, notes. **Étape 3** Date début, nombre de semaines (1..52 configurable), séances/semaine (1..14, interface optimisée 2..6), jours optionnels. **Étape 4** Mode : vierge, modèle de semaine, programme précédent de ce client, modèle de macrocycle. **Étape 5** Aperçu structure, création en brouillon.

Créer les 8 semaines et les slots sans imposer immédiatement chaque contenu ; un slot peut être `unassigned` et ne peut pas être publié tant qu'il manque un type/contenu sauf si explicitement « repos/libre ».

## 3. Desktop — triple panneau
- **Gauche** : liste semaines 1..N, regroupées par bloc/phase, indicateurs brouillon/publié, actions sélectionner/dupliquer/renommer.
- **Centre** : grille verticale de séances dans semaine, affichage slot/date, type, durée estimée, statut, actions bibliothèque/dupliquer/déplacer, ajout séance et repos.
- **Droite** : inspecteur séance/bloc/étape, champs dépendants du type, bibliothèque contextuelle, erreurs, aperçu sportif.
- Bandeau haut : nom client, objectif, période, statut, sauvegarde, mode aperçu, publication et PDF.
- Interactions : clavier et contrôles explicites en fallback au drag-and-drop ; Annuler/Rétablir si rendu sûr.

## 4. Mobile coach — édition complète
- Vue pile : programme -> semaine -> séance -> blocs -> paramètres ; navigation breadcrumbs, bouton +, sauvegarde visible, bottom sheet de sélection.
- Recherche par exercice/type avec résultats rapidement filtrables et possibilité de créer un exercice personnalisé.
- Réordonner par boutons monter/descendre même sans drag ; duplications une semaine/plusieurs semaines ; édition de séries/charges/allures sur téléphone.
- Champ numérique avec clavier adapté, bouton unités, grands contrôles ; affichage clair des modifications non enregistrées ; pas de colonnes horizontales impossibles.

## 5. Composant `WorkoutSession` indépendant de la discipline
Chaque séance possède : nom, `discipline_tags[]`, objectif/description, durée estimée facultative, `blocks[]` ordonnés, consignes coach privées et consignes athlète visibles, matériel éventuel, statut validation, bibliothèque/source et `snapshot` personnalisé. Une séance mixte peut contenir successivement échauffement running, musculation, SkiErg, transition, run, retour au calme.

### Types de blocs recommandés
- `simple`: étape unique/continuité (run 35 min à zone 2, mobilité 10 min).
- `repeat`: répéter une **séquence ordonnée** N fois (fractionné, tour Hyrox, circuit).
- `strength_sets`: sets pour un exercice, charge/reps/recovery en variant si nécessaire.
- `superset`: sous-séquence de 2+ exercices alternés ; nombre tours et repos en fin.
- `interval`: alternance effort/récupération ; support durée OU distance par étape.
- `amrap`: durée limite et séquence d'exercices à compléter autant de fois que souhaité.
- `emom`: intervalle chronométré et tâches assignées (éventuellement multi-minutes).
- `for_time`: réaliser une séquence, limite temps optionnelle.
- `time_cap`: temps max appliqué à un bloc, distinct du temps réalisé.
- `notes`: instructions libres sans métrique, et `rest/transition` avec type et durée.

Un bloc `repeat` peut contenir `interval`, `movement`, `rest`, mais l'imbrication doit être bornée (proposition <= 4 niveaux, à tester) et validée contre des cycles / récursions infinies.

## 6. Actions de l'éditeur
**Séance** : ajout bibliothèque/libre, renommer, modifier, réordonner, dupliquer vers slot, enregistrer comme modèle, supprimer avec confirmation, comparer à la source. **Bloc** : ajouter, remplacer, dupliquer, déplacer, envelopper en répétition, dissocier, modifier type, notes. **Exercice** : sélectionner, créer, changer variante, champs paramétriques et règles d'unités. **Semaine** : dupliquer vers semaines choisies, copier certains slots, réordonner/affecter dates, décharge manuelle, notes. **Programme** : sauvegarder brouillon, aperçu sportif, validation, publier, versionner, archiver, exporter.

## 7. Personnalisation et copies : invariant critique
Quand le coach choisit un modèle, le logiciel enregistre `{template_id, template_version, copied_snapshot}`. La personnalisation change **uniquement** ce snapshot. Changer la version du modèle originel n'altère pas les programmes ni les publications existantes.

Dans l'UI, actions séparées : `Modifier cette occurrence`, `Copier vers autres semaines`, `Enregistrer comme nouveau modèle` et, depuis la bibliothèque uniquement, `Modifier modèle source` (nouvelle version). Les modèles supprimés restent référencés logiquement par les copies/snapshots antérieurs.

## 8. Progression multi-semaines (PRG-04)
Mode MVP : duplication identique puis édition manuelle ciblée de paramètres. Mode V2 : proposition explicite de transformation `duration + N`, `distance + N`, `reps + N`, `load + N`, `pace_delta_sec_per_km`, `volume_percent`, appliquée à un **ensemble choisi de blocs/semaine(s)**, récapitulatif avant validation.

**Ne jamais** appliquer mécaniquement 10 %/semaine, calculer une intensité médicale ou déclarer la progression sûre. Les PDF originaux montrent une évolution de blocs running en janvier 2027 (2 min x5, 3 min x5, 4 min x6, 4 min x7 dans le segment concerné), mais la présence d'un motif ne prouve pas une règle générale.

### Gestion conflits
- Si 2 onglets éditent le même brouillon, contrôle optimiste via `revision` ; proposer recharger, garder copie ou résoudre.
- Auto-save débounced facultatif, queue visible et serveur faisant foi ; pas d'écrasement silencieux.
- Aperçu de progression affiche `avant / après` et impact sur estimations ; métadonnées d'auteur et date.

## 9. Publication et cohérence des versions
`draft` est mutable. « Publier » valide : client, droits, semaines, slots non vides, blocs cohérents, unités, durée, notes visibles et conflits critiques ; la publication crée `program_publications` + `publication_sessions` ou un `snapshot_json` complet et immuable avec numéro de version. Sportif et PDF lisent la publication active. Les feedbacks sont rattachés à `publication_session_id` pour rester interprétables après republication.

Si coach modifie programme publié : nouveau brouillon basé sur publication, puis republie v2, l'ancienne version demeure consultable en historique. Réponses à ancienne version restent attachées. Un sportif en cours de séance doit voir clairement si une nouvelle version a été publiée, et terminer sans perte ou basculer selon règle à valider.

## 10. Validations détaillées
- Nombres valides, `reps >= 0`, charge >= 0, durée > 0 si requise, temps et unités possibles, pace strictement > 0.
- Pas de durée min/km affichée comme vitesse km/h sans conversion contrôlée ; affichage d'une unité selon type.
- Couverture d'une semaine : slots manquants permis en brouillon mais avertissement ; exception jours repos.
- Pas d'exercice sans nom et domaine ; support exercices atypiques `other` documentés.
- Verrouiller suppression d'une séance publiée (création de nouvelle version) ; gérer IDs temporaires frontend.

## 11. Critères de recette et cas QA
- [PRG-01] Générer 8 semaines de 4 séances depuis modèle en < 2 minutes d'interaction normale (objectif UX, à mesurer).
- [PRG-02] Modifier Sled Pull semaine 3 pour sportif A n'altère ni semaine 4, ni sportif B, ni bibliothèque.
- [PRG-03] Une séance Hybride accepte dans l'ordre Run / SkiErg / charge / Run.
- [PRG-04] Dupliquer semaine 1 vers semaines 2–8 conserve le contenu complet et permet variations indépendantes.
- [PRG-05] Publication immuable : le sportif et PDF v1 restent identiques jusqu'à publier v2.
- [PRG-06] En mobile portrait, modifier et enregistrer un circuit avec 8 mouvements, un bloc AMRAP et des récupérations.
