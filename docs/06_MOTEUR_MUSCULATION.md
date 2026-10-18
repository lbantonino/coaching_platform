# 06 — Moteur Musculation / force / renforcement

## 1. Couverture des séances
Full Body, haut du corps, bas du corps, push/pull/legs, force, hypertrophie, endurance musculaire, core, mobilité, circuit renforcement, supersets, giant sets, dropsets, pyramides, EMOM, tempo contrôlé. Ces étiquettes décrivent la séance ; le logiciel ne crée pas automatiquement une prescription universelle.

## 2. Bibliothèque d'exercices (STR-01)
Structure : `name`, catégorie mouvement, groupe musculaire optionnel, équipement (barbell, dumbbell, kettlebell, machine, câble, poids de corps, sled, autre), variantes, bilatéral/unilatéral, métriques permises (reps, durée, distance, charge, RPE/RIR, tempo, repos), description, média optionnel. Les noms peuvent être français/anglais, recherche synonymes (DB Shoulder Press, presse épaules haltères) et favoris.

Exemples depuis le PDF Full Body A : FRONT PLANK, SIDE PLANK, LEG CURL ASSIS, BULGARIAN SPLIT SQUATS, LAT PULL DOWN, POMPES, TIRAGE BUCHERON UNILATÉRALE - HALTÈRES, DB SHOULDER PRESS. Il y a des notes coach « de plus en plus lourd », « lourd (16–24 kilos) » et un format POMPES « EMOM 6 min — 20 sec pompes / 40 sec repos ».

## 3. Modèle des prescriptions par exercice (`strength_prescription`)
- `set_count` facultatif si liste explicite `sets[]` ; une séquence d'exercice peut avoir un nombre de séries et un tableau variable par série.
- `sets[]` : `order`, `target_reps_min/max` ou `target_duration_sec` ou `distance_m`; `target_load_kg` exact/plage/référence ; `rpe_target`/`rir_target` ; `rest_after_sec` ; `tempo` chaîne contrôlée (p. ex. 3-1-1-0) ; `side` both/left/right/per_side ; `notes`.
- `equipment`, `unilateral`, `warmup_set` booléen, `failure_flag` (ne pas par défaut encourager l'échec).
- `progression_mode`: manuelle par semaine par défaut ; calcul automatique optionnel validé.

**Important — incohérence dans la source** : le PDF Full Body A affiche LEG CURL ASSIS « Séries 3 » avec « Reps 20-15-10-8 » (4 valeurs). Cette donnée doit être conservée comme exemple documentaire tout en déclenchant **une décision coach ou validation d'import** ; ne pas corriger silencieusement en `4 séries` ou `3 valeurs`. Pour saisir ce cas dans l'éditeur, le coach choisira un nombre de séries compatible ou conservera une instruction libre à résoudre avant publication si cela influe la structure.

## 4. Groupement des exercices
- `single_exercise` et `straight_sets` : X séries avec repos.
- `superset` : séquence A/B par tour, repos après exercice/tour selon définition.
- `circuit` : N tours séquence ordonnée.
- `emom` : durée totale/minute(s) et mouvement(s) par intervalle. Exemple source POMPES 6 minutes, 20 s effort / 40 s repos.
- `amrap` : temps limite + mouvements et répétitions.
- `pyramid` : charges et reps évolutives **par série** ; pas de simple champ « 20-15-10-8 » non interprétable.

## 5. UI coach
Table desktop personnalisable : exercice, séries, répétitions, charge, repos, effort, commentaires ; développement de l'exercice pour éditer **chaque série** et les variantes. Mobile : carte par exercice, champs condensés, modifier série à l'intérieur. Action « remplacer exercice » préserve les paramètres compatibles et demande confirmation pour les incompatibles. Actions : ordre, dupliquer, ajouter exercice, regrouper en superset, enregistrer modèle.

## 6. UI sportif
Affichage « 3 × 10 », charge et repos, notes d'exécution du coach ; possibilité V2 d'enregistrer charge/reps réelles par série avec distinction prévu/réalisé. Cocher exercice terminé sans écraser la prescription ; ouvrir une vidéo pédagogique si fournie (ne pas générer à partir de photos arbitraires). Repos chronométré facultatif avec bouton accessible.

## 7. Mesures et conventions
Kg internes numériques décimaux, unités affichées ; poids du corps peut être `bodyweight` sans kg obligatoire. Reps par côté explicites ; temps en secondes ; charge barre/haltère total vs par main à préciser. Séries impossibles (`-2`) interdites. Superset ne doit pas stocker repos comme « SUPERSET » dans un champ de durée : encoder le lien de groupe, garder note si besoin.

## 8. Tests et critères
- [STR-01] Créer, sauvegarder et réutiliser Full Body A sans modifier l'exemplaire original.
- [STR-02] Séries à reps différentes (pyramide) ont des objets distincts et un total vérifiable.
- [STR-03] Créer EMOM pompes 20 s effort / 40 s repos sur 6 min.
- [STR-04] Superset de deux exercices se réordonne correctement et s'imprime lisiblement.
- [STR-05] Enregistrer séance complète depuis mobile ; changer charge d'un sportif ne change pas autre sportif.
- [STR-06] Valider/alerter sur incohérence `3 séries vs 4 rep counts` et ne jamais la corriger silencieusement.
