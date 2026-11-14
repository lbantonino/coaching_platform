// Vocabulaires de la bibliothèque d'exercices (D-75) : codes stables en anglais, libellés français.
// Repris de resources/exercise-library/curation/vocabulaires.json, la source du catalogue : un code
// ajouté là doit l'être ici aussi.

export const EXERCISE_CATEGORIES = ["strength", "cardio", "hyrox", "mobility"] as const;
export type ExerciseCategory = (typeof EXERCISE_CATEGORIES)[number];

export const exerciseCategoryLabels: Record<ExerciseCategory, string> = {
  strength: "Musculation",
  cardio: "Cardio",
  hyrox: "Hyrox",
  mobility: "Mobilité",
};

export const METRICS = [
  "reps",
  "load_kg",
  "duration_s",
  "distance_m",
  "calories_kcal",
  "pace_s_per_km",
  "pace_s_per_500m",
  "lengths",
  "tempo",
  "incline_pct",
  "speed_kmh",
  "height_cm",
] as const;
export type Metric = (typeof METRICS)[number];

// Ce qui se règle dans une séance, avec l'unité affichée (docs 05 à 07).
export const metricInfo: Record<Metric, { label: string; unit: string }> = {
  reps: {
    label: "Répétitions",
    unit: "rép.",
  },
  load_kg: {
    label: "Charge",
    unit: "kg",
  },
  duration_s: {
    label: "Durée",
    unit: "s",
  },
  distance_m: {
    label: "Distance",
    unit: "m",
  },
  calories_kcal: {
    label: "Calories",
    unit: "kcal",
  },
  pace_s_per_km: {
    label: "Allure",
    unit: "min/km",
  },
  pace_s_per_500m: {
    label: "Allure ergomètre",
    unit: "/500 m",
  },
  lengths: {
    label: "Longueurs",
    unit: "longueurs",
  },
  tempo: {
    label: "Tempo",
    unit: "ex. 3-1-1-0",
  },
  incline_pct: {
    label: "Inclinaison",
    unit: "%",
  },
  speed_kmh: {
    label: "Vitesse",
    unit: "km/h",
  },
  height_cm: {
    label: "Hauteur",
    unit: "cm",
  },
};

export const difficultyLabels: Record<string, string> = {
  beginner: "Débutant",
  intermediate: "Intermédiaire",
  advanced: "Avancé",
};

export type EquipmentGroup =
  "bodyweight" | "free_weights" | "machines" | "cardio" | "bars_and_suspension" | "small_equipment";

// « Poids du corps » : un exercice sans matériel.
export const equipmentGroupLabels: Record<EquipmentGroup, string> = {
  bodyweight: "Poids du corps",
  free_weights: "Poids libres",
  machines: "Machines",
  cardio: "Cardio et traîneau",
  bars_and_suspension: "Barres et suspension",
  small_equipment: "Petit matériel",
};

export const equipmentInfo: Record<string, { label: string; group: EquipmentGroup }> = {
  barbell: {
    label: "Barre",
    group: "free_weights",
  },
  dumbbell: {
    label: "Haltères",
    group: "free_weights",
  },
  kettlebell: {
    label: "Kettlebell",
    group: "free_weights",
  },
  ez_bar: {
    label: "Barre EZ",
    group: "free_weights",
  },
  trap_bar: {
    label: "Barre hexagonale",
    group: "free_weights",
  },
  plates: {
    label: "Disques",
    group: "free_weights",
  },
  sandbag: {
    label: "Sandbag",
    group: "free_weights",
  },
  medicine_ball: {
    label: "Médecine-ball",
    group: "free_weights",
  },
  slam_ball: {
    label: "Slam ball",
    group: "free_weights",
  },
  wall_ball: {
    label: "Wall ball",
    group: "free_weights",
  },
  landmine: {
    label: "Landmine",
    group: "free_weights",
  },
  cable: {
    label: "Poulie",
    group: "machines",
  },
  smith_machine: {
    label: "Smith machine",
    group: "machines",
  },
  leg_press: {
    label: "Presse à cuisses",
    group: "machines",
  },
  hack_squat: {
    label: "Hack squat",
    group: "machines",
  },
  leg_curl: {
    label: "Machine leg curl",
    group: "machines",
  },
  leg_extension: {
    label: "Machine leg extension",
    group: "machines",
  },
  lat_pulldown_machine: {
    label: "Machine de tirage vertical",
    group: "machines",
  },
  seated_row_machine: {
    label: "Machine de rowing assis",
    group: "machines",
  },
  chest_press_machine: {
    label: "Machine développé pectoraux",
    group: "machines",
  },
  chest_fly_machine: {
    label: "Machine écarté",
    group: "machines",
  },
  pec_deck: {
    label: "Pec deck",
    group: "machines",
  },
  shoulder_press_machine: {
    label: "Machine développé épaules",
    group: "machines",
  },
  plate_loaded_lateral_raise_machine: {
    label: "Machine élévations latérales",
    group: "machines",
  },
  reverse_fly_machine: {
    label: "Machine oiseau",
    group: "machines",
  },
  bicep_curl_machine: {
    label: "Machine curl biceps",
    group: "machines",
  },
  preacher_curl_machine: {
    label: "Machine curl pupitre",
    group: "machines",
  },
  tricep_extension_machine: {
    label: "Machine triceps",
    group: "machines",
  },
  dip_machine: {
    label: "Machine dips",
    group: "machines",
  },
  plate_loaded_dip_machine: {
    label: "Machine dips à disques",
    group: "machines",
  },
  assisted_pullup_machine: {
    label: "Machine tractions assistées",
    group: "machines",
  },
  ab_crunch_machine: {
    label: "Machine abdominaux",
    group: "machines",
  },
  back_extension_machine: {
    label: "Banc à lombaires",
    group: "machines",
  },
  hip_abduction_machine: {
    label: "Machine abducteurs",
    group: "machines",
  },
  hip_adduction_machine: {
    label: "Machine adducteurs",
    group: "machines",
  },
  hip_thrust_machine: {
    label: "Machine hip thrust",
    group: "machines",
  },
  standing_calf_raise_machine: {
    label: "Machine mollets debout",
    group: "machines",
  },
  seated_calf_raise_machine: {
    label: "Machine mollets assis",
    group: "machines",
  },
  donkey_calf_raise_machine: {
    label: "Machine mollets donkey",
    group: "machines",
  },
  shrug_machine: {
    label: "Machine shrugs",
    group: "machines",
  },
  glute_ham_developer: {
    label: "GHD",
    group: "machines",
  },
  treadmill: {
    label: "Tapis de course",
    group: "cardio",
  },
  rower: {
    label: "Rameur",
    group: "cardio",
  },
  ski_erg: {
    label: "SkiErg",
    group: "cardio",
  },
  air_bike: {
    label: "Air bike",
    group: "cardio",
  },
  stationary_bike: {
    label: "Vélo d'appartement",
    group: "cardio",
  },
  bicycle: {
    label: "Vélo",
    group: "cardio",
  },
  elliptical: {
    label: "Vélo elliptique",
    group: "cardio",
  },
  stair_climber: {
    label: "Simulateur d'escalier",
    group: "cardio",
  },
  sled: {
    label: "Traîneau",
    group: "cardio",
  },
  rope: {
    label: "Corde de traîneau",
    group: "cardio",
  },
  battle_rope: {
    label: "Battle rope",
    group: "cardio",
  },
  jump_rope: {
    label: "Corde à sauter",
    group: "cardio",
  },
  pull_up_bar: {
    label: "Barre de traction",
    group: "bars_and_suspension",
  },
  dip_station: {
    label: "Barres parallèles",
    group: "bars_and_suspension",
  },
  rings: {
    label: "Anneaux",
    group: "bars_and_suspension",
  },
  suspension_trainer: {
    label: "TRX",
    group: "bars_and_suspension",
  },
  climbing_rope: {
    label: "Corde à grimper",
    group: "bars_and_suspension",
  },
  resistance_band: {
    label: "Élastique",
    group: "small_equipment",
  },
  mini_band: {
    label: "Mini-bande",
    group: "small_equipment",
  },
  bench: {
    label: "Banc",
    group: "small_equipment",
  },
  plyo_box: {
    label: "Box",
    group: "small_equipment",
  },
  step: {
    label: "Marche ou step",
    group: "small_equipment",
  },
  bosu_ball: {
    label: "Bosu",
    group: "small_equipment",
  },
  stability_ball: {
    label: "Ballon de stabilité",
    group: "small_equipment",
  },
  ab_wheel: {
    label: "Roue abdominale",
    group: "small_equipment",
  },
  wrist_roller: {
    label: "Wrist roller",
    group: "small_equipment",
  },
  foam_roller: {
    label: "Rouleau de massage",
    group: "small_equipment",
  },
  mat: {
    label: "Tapis de sol",
    group: "small_equipment",
  },
  wall: {
    label: "Mur",
    group: "small_equipment",
  },
  partner: {
    label: "Partenaire",
    group: "small_equipment",
  },
};

// Toutes les clés de matériel (« Nouvel exercice » de l'Assistant IA, relecture du lot 2) : Claude reçoit
// la liste complète, au lieu de deviner parmi quelques exemples.
export const EQUIPMENT_KEYS = Object.keys(equipmentInfo) as [string, ...string[]];

export type MuscleGroup =
  | "chest"
  | "back"
  | "shoulders"
  | "biceps"
  | "triceps"
  | "forearms"
  | "abs"
  | "lower_back"
  | "glutes"
  | "hips"
  | "quads"
  | "hamstrings"
  | "calves";

export const muscleGroupLabels: Record<MuscleGroup, string> = {
  chest: "Pectoraux",
  back: "Dos",
  shoulders: "Épaules",
  biceps: "Biceps",
  triceps: "Triceps",
  forearms: "Avant-bras",
  abs: "Abdominaux",
  lower_back: "Lombaires",
  glutes: "Fessiers",
  hips: "Hanches et adducteurs",
  quads: "Quadriceps",
  hamstrings: "Ischio-jambiers",
  calves: "Mollets",
};

const anatomicalMuscles: Record<string, { label: string; group: MuscleGroup }> = {
  pectoralis_major: {
    label: "Grand pectoral",
    group: "chest",
  },
  serratus_anterior: {
    label: "Dentelé antérieur",
    group: "chest",
  },
  latissimus_dorsi: {
    label: "Grand dorsal",
    group: "back",
  },
  rhomboids: {
    label: "Rhomboïdes",
    group: "back",
  },
  trapezius: {
    label: "Trapèzes",
    group: "back",
  },
  anterior_deltoid: {
    label: "Deltoïde antérieur",
    group: "shoulders",
  },
  lateral_deltoid: {
    label: "Deltoïde latéral",
    group: "shoulders",
  },
  posterior_deltoid: {
    label: "Deltoïde postérieur",
    group: "shoulders",
  },
  supraspinatus: {
    label: "Supra-épineux",
    group: "shoulders",
  },
  infraspinatus_teres_minor: {
    label: "Infra-épineux et petit rond",
    group: "shoulders",
  },
  biceps_brachii: {
    label: "Biceps",
    group: "biceps",
  },
  brachialis: {
    label: "Brachial",
    group: "biceps",
  },
  brachioradialis: {
    label: "Brachio-radial",
    group: "forearms",
  },
  triceps_brachii: {
    label: "Triceps",
    group: "triceps",
  },
  forearms: {
    label: "Avant-bras",
    group: "forearms",
  },
  forearm_flexors: {
    label: "Fléchisseurs de l'avant-bras",
    group: "forearms",
  },
  forearm_extensors: {
    label: "Extenseurs de l'avant-bras",
    group: "forearms",
  },
  rectus_abdominis: {
    label: "Grand droit de l'abdomen",
    group: "abs",
  },
  transverse_abdominis: {
    label: "Transverse de l'abdomen",
    group: "abs",
  },
  obliques: {
    label: "Obliques",
    group: "abs",
  },
  erector_spinae: {
    label: "Érecteurs du rachis",
    group: "lower_back",
  },
  quadratus_lumborum: {
    label: "Carré des lombes",
    group: "lower_back",
  },
  gluteus_maximus: {
    label: "Grand fessier",
    group: "glutes",
  },
  gluteus_medius: {
    label: "Moyen fessier",
    group: "glutes",
  },
  abductors: {
    label: "Abducteurs",
    group: "hips",
  },
  adductors: {
    label: "Adducteurs",
    group: "hips",
  },
  hip_flexors: {
    label: "Fléchisseurs de hanche",
    group: "hips",
  },
  quadriceps: {
    label: "Quadriceps",
    group: "quads",
  },
  hamstrings: {
    label: "Ischio-jambiers",
    group: "hamstrings",
  },
  gastrocnemius: {
    label: "Gastrocnémiens",
    group: "calves",
  },
  soleus: {
    label: "Soléaire",
    group: "calves",
  },
  tibialis_anterior: {
    label: "Tibial antérieur",
    group: "calves",
  },
};

// Muscles d'un exercice : noms anatomiques (catalogue), et aussi les GROUPES eux-mêmes. Un coach qui
// crée son exercice choisit des groupes (« Fessiers »), plus simple qu'une liste anatomique (D-76).
export const muscleInfo: Record<string, { label: string; group: MuscleGroup }> = {
  ...Object.fromEntries(
    (Object.keys(muscleGroupLabels) as MuscleGroup[]).map((group) => [
      group,
      { label: muscleGroupLabels[group], group },
    ]),
  ),
  ...anatomicalMuscles,
};
