# 07 — Hyrox et programmes Hybrides (mélange libre)

## 1. Positionnement moteur
Hyrox est une **discipline supportée** et non le seul type de programme. Hybride = liberté totale de combiner course, renforcement, musculation, ergomètres et stations dans une séance, une semaine ou un cycle. Un programme 2 runs + 1 force doit être possible sans aucune station Hyrox ; idem 3 forces + 1 run, ou préparation Hyrox 2 runs + 2 circuits.

## 2. Bibliothèque d'étapes Hyrox (HYB-01)
Primitives : RUN (distance/temps et allure min/km), SkiErg (distance, rythme `sec/500m`), RowErg (distance, rythme `sec/500m`), Sled Push/Pull (distance, longueur, charge), Burpee Broad Jumps (distance ou répétitions), Farmers Carry (distance et masse par main ou totale), Sandbag Lunges (distance, charge), Wall Balls (reps, charge, hauteur cible si besoin), autres exercices personnalisés. Le catalogue doit être extensible ; ne pas coder en dur seulement les 8 stations standard.

Valeurs relevées dans les PDF, uniquement à titre de tests : `600 m RUN @5:45/km + 25 m Sled Push`, `100 m Farmer Carry @24 kg`, `25 WB @6 kg`, `300m SKI @2:30/500m`, `12,5 m Sled Push @175 kg`, inclinaison tapis 2 %, `AMRAP 25 min`, `TIME CAP 60 min`. Elles ne sont ni normes compétitives ni valeurs par défaut universelles.

## 3. Modes de séances
- `hyrox_circuit`: séquence ordonnée de stations et RUN, répétée N fois si défini.
- `race_pace`: séquence de blocs de course à allure cible et stations/récupérations.
- `simulation`: un parcours de stations et running avec paramètres individuels et éventuellement chronomètre final.
- `amrap`: séquence à réaliser dans une durée déterminée, résultat = tours/partiels si saisi.
- `for_time`: séquence définie, résultat = temps ; `time_cap` facultatif.
- `emom`: mouvements par minute ou cycles, avec durée.
- `interval`: phases effort/récup, incluant course et équipement.
- `strength_cardio`: séquence libre mêlant force, cardio et pause.
- `custom`: n'importe quelle combinaison sans sélection de format prédéfini.

## 4. Grammaire des blocs (commune au running/musculation)
Chaque `workout_block` contient un `kind` et une liste `items[]` ordonnés. Un item a type `movement | sub_block | rest | instruction`. Movement référence un `exercise_id` ou snapshot personnalisé et un `target` typé : temps, distance, reps, charge, allure running, allure ergomètre, vitesse tapis, incline, RPE, cadence. Sub_block permet de répéter une séquence sans recopier des lignes. Les blocs imbriqués sont bornés et sérialisables, et leur durée estimée peut être inconnue.

**Exemple structurel** : échauffement RUN 1 000 m ; puis 5 tours de `RUN 2 min @5:45/km -> SKI 2 min @2:30/500m -> ROW 2 min @2:15/500m -> REST 1 min`; puis AMRAP 25 min `12 BBJ -> 40 SB Lunges -> 15 Wall Balls @6 kg`. Ce type de montage est lisible dans Workload Hyrox_page 1.pdf. Ne pas « aplatir » en un seul grand texte ; conserver le regroupement et le nombre de tours.

## 5. Données spécifiques et précautions
- Distances en m ; poids en kg avec métadonnées (`per_hand`, `total`, `sled_loaded` si défini).
- Erg : allure en sec/500m, pas min/km ; Sled : longueurs (nombre) ET distance m si connue. Si piste inconnue, laisser `lengths` sans calculer m.
- `wall_ball_reps` et `load_kg` sont champs séparés ; `equipment_setup_notes` pour catégorie équipement.
- Pour RUN tapis, vitesse en km/h et inclinaison % ; ne pas confondre pace et speed. Exemples PDF comprennent des instructions « Tapis de course » et incline 2 %.
- `competition_division` (open/pro/doubles, etc.) facultative et paramétrable ; le logiciel n'impose pas de charges associées (règles sportives externes évolutives et à vérifier si utilisées).
- Chargement effectif et efforts ressentis = réponses du sportif distinctes de prescription.

## 6. Éditeur hybride (HYB-02)
L'éditeur propose un catalogue de **types de blocs** et non trois écrans incompatibles. Exemple de séance : 10 min échauffement course -> 4 x (800 m RUN + 20 Wall Balls + 90 s récupération) -> 3 séries Split Squat -> 5 min cooldown. Tags multi-disciplines auto-dérivés des éléments, ajustables. Drag-and-drop desktop avec contrôles accessibles ; pile mobile éditable avec ordre, recherche, ajout et modification.

## 7. Modèles de semaine (HYB-03)
- `Hyrox 4 séances dominante course` : Sortie longue, Endurance, Race Pace, Circuit.
- `Hybride 3 séances` : 2 runs + 1 musculation OU 2 muscu + 1 run ; choix coach et contraintes client.
- `Hybride 4 séances` : 2 muscu + 2 runs.
- `Running pur 4 séances` : endurance, fractionné, tempo, sortie longue.
- `Force 3 séances` : Full Body A/B/C.
Il s'agit de **compositions d'interface illustratives** et non de recommandations cliniques ni d'obligations.

## 8. Gestion de progression
Modèles de circuits identiques ou différents selon semaine, volume de stations et allures variables, possibilité d'insérer semaines allégées et course-objectif. Les PDF montrent une course « Hyrox Gent » dans le planning de décembre ; support `event_day` dans calendrier, sans imposer d'effort ce jour-là. Les répétitions/charges/séquences doivent rester historisées par programme client.

## 9. Critères de recette
- [HYB-01] Un circuit 5 tours RUN/SKI/ROW/repos s'enregistre comme hiérarchie, pas un paragraphe.
- [HYB-02] Une séance hybride mêle Run + dumbbell + RowErg + récupération, export correct.
- [HYB-03] Construire deux programmes distincts 2 running + 1 muscu / 2 muscu + 1 running sans Hyrox.
- [HYB-04] Sled Push en longueurs sans distance précisée est représenté sans valeur inventée.
- [HYB-05] Une allure SkiErg `2:30/500m` et RUN `5:45/km` conservent leurs unités partout.
- [HYB-06] « Time Cap 60 min » est une contrainte de temps, pas automatiquement une durée réellement courue.
