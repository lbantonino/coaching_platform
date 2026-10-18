# 08 — Bibliothèque, réutilisation, personnalisation et progression

## 1. Niveaux de réutilisation
`Exercise` = notion générale, `ExerciseVariant` = matériel/exécution, `BlockTemplate` = séquence avec paramètres, `SessionTemplate` = séance structurée, `WeekTemplate` = slots 1..N pointant vers des modèles de séance, `ProgramTemplate` = répartition multi-semaines facultative, `ProgramInstance` = copie entièrement personnalisable à un sportif.

Les modèles contiennent : `organization_id`, auteur, titre, description, type, tags, version, visibilité (organisation / privé selon permissions), statut, paramètres par défaut, date création/mise à jour. Catalogue global de base en lecture seule + modèles privés par organisation ; aucun partage automatique d'exercices personnalisés à d'autres coachs.

## 2. Catalogue et filtres (LIB-01)
- Recherche nom/synonyme ; catégories Running/Musculation/Hyrox/Cardio/Mobilité ; matériel ; muscles ; objectif ; durée approximative.
- Favoris du coach, modèles récemment employés, dupliquer, exporter/importer JSON sécurisé, archiver, renommer ; pas d'effacement de snapshots historiques.
- Un exercice de référence globale est distinct d'une variante créée pour un coach.
- Normaliser noms/alias, mais ne pas modifier silencieusement les consignes enregistrées dans les publications.

## 3. Modèles paramétrables
Un template peut contenir des valeurs fixes et des paramètres déclarés : `duration`, `pace_zone`, `target_pace`, `weight`, `rep_count`, `rest_sec`, `sets`, `distance`. Un slot dans une semaine peut surcharger ces valeurs. Paramètres non disponibles : mise en évidence « à compléter » ; aucune valeur 0 trompeuse.

**Exemple** : modèle « Endurance facile » = bloc RUN en durée et intensité zone 2 ; application à Client A : 45 min, zone perso ; Client B : 35 min, cible FC. Les documents source montrent allures individualisées mais ne définissent pas de règles par défaut pour d'autres sportifs.

## 4. Versionnage et snapshots (LIB-02 / PRG-05)
- Modèle version `v1`, `v2`, chacune datée avec changelog. Les copies restent attachées à version originale mais incluent payload indépendant.
- Une copie utilisée dans un programme ne se met pas à jour toute seule quand `v2` apparaît. Un coach peut « comparer/mettre à jour depuis v2 » en prévisualisant diff ; décision explicite.
- Un programme client possède des `revision` brouillons et `publication_number` (1,2,...). Les publications sont immuables ; aucune édition directe de `snapshot` historique.
- Les PDF stockés indiquent `publication_id`, hash/empreinte optionnel, `generated_at`, période et version de maquette.
- Conserver historique de suppressions/archivages logiques ; ne pas laisser des clés étrangères casser des versions publiées.

## 5. Duplication et opérations en masse (PRG-04)
**Dupliquer séance** : choisir destination (même semaine, autre semaine, autre client **si coach autorisé**, nouvelle bibliothèque), copie complète + nouvelle identité d'occurrence.

**Dupliquer semaine** : destination semaine(s), choix remplacer les slots/ajouter/remplacer seulement vides, résumé de conflit, validation et possibilité retour arrière via revision. Une semaine source déjà dupliquée ne crée pas de lien live de propagation.

**Appliquer une modification aux semaines** : sélection du paramètre et intervalle semaines, prévisualisation `valeur actuelle -> cible`, ignorer exceptions ou écraser avec confirmation ; trace de l'opération.

**Progression** : sur une dimension précise (durée, répétitions, distance, repos, charge, cible allure), pas « augmenter tout de 10 % » globalement. Bloquer unités incompatibles ; alertes sur dépassements absurdes, mais laisser coach décider selon règles.

## 6. Phases et cycles
Macrocycle optionnel : phases `base | développement | spécifique | affûtage | récupération | libre`, nom personnalisable, semaines associées. Un programme peut avoir une échéance course liée aux objectifs et un plan d'allègement décidés par coach. Les PDF de décembre 2026 montrent changement de distribution autour de Hyrox Gent ; cela constitue un exemple, pas un algorithme.

## 7. Import depuis documents existants
Au début, **pas d'import automatique des PDFs en source de vérité** : saisir manuellement un petit catalogue validé depuis les neuf documents. Préparer plus tard un outil d'import avec extraction, prévisualisation, détection d'ambiguïtés et validation humaine, notamment la discordance « LEG CURL 3 séries / 4 valeurs reps ».

## 8. Bonnes pratiques UX
Bouton « Utiliser ce modèle » explicite, vignette simple, durée approximative si calculable, badges Running/Force/Hyrox. Afficher « Source : modèle X v2 ; modifié pour ce client » et action comparer. Templates d'exemple dans seeds de démonstration sans données identifiantes. Eviter 200 résultats non filtrés sur mobile.

## 9. Tests
- [LIB-01] Un coach B ne voit pas les modèles privés coach A.
- [LIB-02] Editer template v2 n'altère pas 10 copies issues de v1.
- [LIB-03] Dupliquer semaine vers trois semaines crée des IDs d'occurrences distincts.
- [LIB-04] Modifier série ou allure dans programme C ne change pas catalogue ni D.
- [LIB-05] « Remplacer seulement slots vides » ne supprime aucun slot non vide.
- [LIB-06] Historique publié/archivé est consultable même si template origine a été archivé.
