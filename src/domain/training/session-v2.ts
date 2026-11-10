import { z } from "zod";

import { PACE_MAX_SEC_PER_KM, PACE_MIN_SEC_PER_KM } from "./pace";

// Contenu STRUCTURÉ d'une séance de programme, schéma v2 (D-155, 09/11/2026) : ce qu'écrivent les
// éditeurs de séance Running (04), Musculation (05) et Hyrox (06). Il vit dans le brouillon d'un
// programme, dans un modèle de séance, puis est FIGÉ dans la publication (publication_sessions,
// avec schemaVersion: 2). La v1 (texte, tranche 1) reste lisible : voir program-session.ts.
//
// Chaque discipline a sa propre forme (docs/11 §3 : pas de JSON « fourre-tout ») ; un bloc texte
// (titre + lignes) existe dans toutes, pour les notes libres (CLAUDE.md) et pour reprendre sans perte
// une séance v1. « hybrid » n'accepte QUE des blocs texte : l'éditeur hybride n'est pas dessiné, il
// ne sert qu'aux séances hybrides v1 converties.

const text = (max: number) => z.string().trim().min(1).max(max);
// Éléments d'une séance (étapes, exercices, blocs) : au-delà, la séance ne s'enregistre plus, les
// éditeurs n'en ajoutent donc pas davantage.
export const SESSION_ITEMS_MAX = 40;
// Identifiant local d'un élément (étape, exercice, bloc), unique dans la séance.
export const itemIdSchema = z.string().regex(/^[A-Za-z0-9_-]{1,40}$/);
const seconds = (max: number) => z.number().int().min(1).max(max);
const paceSecPerKm = z.number().int().min(PACE_MIN_SEC_PER_KM).max(PACE_MAX_SEC_PER_KM);

// ---------------------------------------------------------------------------
// Bloc texte : « Échauffement · 10 min » et ses lignes, éventuellement répétées (forme de la v1).
// ---------------------------------------------------------------------------
export const textBlockSchema = z.object({
  id: itemIdSchema,
  kind: z.literal("text"),
  title: text(80),
  badge: text(30).optional(),
  lines: z.array(text(200)).max(20),
  repeat: z
    .object({ times: z.number().int().min(2).max(50), lines: z.array(text(200)).min(1).max(10) })
    .optional(),
});

// ---------------------------------------------------------------------------
// Running (04) : étapes et blocs « Répéter N fois ».
// ---------------------------------------------------------------------------
export const RUN_ROLES = ["warmup", "run", "recovery", "rest", "cooldown"] as const;
export type RunRole = (typeof RUN_ROLES)[number];

// Plage d'allure : « from » est la plus rapide (le plus petit nombre de secondes), comme les repères.
export const paceTargetSchema = z
  .object({
    kind: z.literal("pace"),
    fromSecPerKm: paceSecPerKm,
    toSecPerKm: paceSecPerKm,
    // % de VMA qui a servi au calcul (« Recalculer » le réutilise), si l'allure en vient.
    vmaPercent: z
      .object({ from: z.number().min(40).max(130), to: z.number().min(40).max(130) })
      .optional(),
  })
  .refine((target) => target.fromSecPerKm <= target.toSecPerKm, {
    message: "La première allure doit être la plus rapide.",
  });

// Zone de FC : la zone, et sa plage en bpm (calculée depuis la FC max, ou écrite par le coach).
export const hrTargetSchema = z
  .object({
    kind: z.literal("hr"),
    zone: z.number().int().min(1).max(5),
    bpmFrom: z.number().int().min(30).max(240).optional(),
    bpmTo: z.number().int().min(30).max(240).optional(),
  })
  .refine(
    (target) => (target.bpmFrom === undefined) === (target.bpmTo === undefined),
    "La plage de FC a deux bornes.",
  )
  .refine(
    (target) => target.bpmFrom === undefined || target.bpmFrom <= (target.bpmTo ?? 0),
    "La première borne de FC doit être la plus basse.",
  );

export const runMeasureSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("time"), seconds: seconds(36_000) }),
  z.object({ type: z.literal("distance"), meters: z.number().int().min(10).max(100_000) }),
  z.object({ type: z.literal("open") }),
]);

export const runStepSchema = z.object({
  id: itemIdSchema,
  kind: z.literal("step"),
  role: z.enum(RUN_ROLES),
  // Nom affiché à la place du rôle : « Course rapide », « Récupération trot ».
  label: text(60).optional(),
  measure: runMeasureSchema,
  target: z.discriminatedUnion("kind", [paceTargetSchema, hrTargetSchema]).optional(),
  note: text(200).optional(),
});

// Conteneur : modifier une étape enfant modifie toutes les répétitions.
export const runRepeatSchema = z.object({
  id: itemIdSchema,
  kind: z.literal("repeat"),
  times: z.number().int().min(2).max(50),
  steps: z.array(runStepSchema).min(1).max(10),
});

export const runningContentSchema = z.object({
  discipline: z.literal("running"),
  items: z
    .array(z.discriminatedUnion("kind", [runStepSchema, runRepeatSchema, textBlockSchema]))
    .min(1)
    .max(40),
});

// ---------------------------------------------------------------------------
// Musculation (05) : exercices de la Bibliothèque, séries, Superset et EMOM.
// ---------------------------------------------------------------------------
export const strengthSetSchema = z
  .object({
    type: z.enum(["warmup", "normal"]),
    // « 8 » ou « 8 à 10 ».
    repsMin: z.number().int().min(1).max(100),
    repsMax: z.number().int().min(1).max(100).optional(),
    // En kg : la charge. En % du max : le %, et les kg calculés au moment du calcul (figés à la
    // publication), absents si le max du sportif n'est pas connu.
    kg: z.number().min(0).max(1000).optional(),
    pct: z.number().min(1).max(150).optional(),
    rir: z.number().int().min(0).max(10).optional(),
  })
  .refine((set) => set.repsMax === undefined || set.repsMax >= set.repsMin, {
    message: "La plage de répétitions va du plus petit au plus grand.",
  });

export const strengthExerciseSchema = z
  .object({
    id: itemIdSchema,
    kind: z.literal("exercise"),
    // Exercice de la Bibliothèque ; son nom est COPIÉ pour que la version publiée reste lisible
    // même si l'exercice change ou disparaît (DB-04).
    exerciseId: z.uuid().optional(),
    name: text(80),
    loadMode: z.enum(["kg", "pct"]),
    sets: z.array(strengthSetSchema).min(1).max(20),
    restSec: z.number().int().min(0).max(1800).optional(),
    tempo: text(20).optional(),
    cue: text(200).optional(),
  })
  .refine(
    (exercise) =>
      exercise.loadMode === "kg"
        ? exercise.sets.every((set) => set.pct === undefined)
        : exercise.sets.every((set) => set.pct !== undefined || set.type === "warmup"),
    "En kg, pas de % ; en % du max, chaque série normale a son %.",
  );

// Superset : exercices reliés, repos en fin de tour.
export const strengthSupersetSchema = z.object({
  id: itemIdSchema,
  kind: z.literal("superset"),
  rounds: z.number().int().min(1).max(20),
  restSec: z.number().int().min(0).max(1800).optional(),
  exercises: z.array(strengthExerciseSchema).min(2).max(6),
});

// EMOM : chaque minute, le travail puis le repos jusqu'à la minute suivante.
export const strengthEmomSchema = z.object({
  id: itemIdSchema,
  kind: z.literal("emom"),
  minutes: z.number().int().min(1).max(60),
  workSec: z.number().int().min(5).max(60).optional(),
  exercises: z.array(strengthExerciseSchema).min(1).max(6),
});

export const strengthContentSchema = z.object({
  discipline: z.literal("strength"),
  warmup: text(300).optional(),
  cooldown: text(300).optional(),
  items: z
    .array(
      z.discriminatedUnion("kind", [
        strengthExerciseSchema,
        strengthSupersetSchema,
        strengthEmomSchema,
        textBlockSchema,
      ]),
    )
    .min(1)
    .max(40),
});

// ---------------------------------------------------------------------------
// Hyrox (06) : blocs (format, tours, repos, temps cible, limite) et leurs lignes.
// Course en min/km, ergomètres en min/500 m : jamais mélangés (BR-16).
// ---------------------------------------------------------------------------
// Les 8 stations, dans l'ordre officiel (règlement HYROX 26/27).
export const HYROX_STATIONS = [
  "skierg",
  "sled_push",
  "sled_pull",
  "burpee_broad_jumps",
  "rowing",
  "farmers_carry",
  "sandbag_lunges",
  "wall_balls",
] as const;
export type HyroxStation = (typeof HYROX_STATIONS)[number];

const pacePer500m = z.number().int().min(60).max(300);

export const hyroxLineSchema = z.discriminatedUnion("kind", [
  z.object({
    id: itemIdSchema,
    kind: z.literal("run"),
    meters: z.number().int().min(10).max(42_195),
    paceSecPerKm: paceSecPerKm.optional(),
    targetSec: seconds(36_000).optional(),
  }),
  z.object({
    id: itemIdSchema,
    kind: z.literal("station"),
    station: z.enum(HYROX_STATIONS),
    meters: z.number().int().min(1).max(5000).optional(),
    reps: z.number().int().min(1).max(500).optional(),
    // Charge (par main pour le farmers carry). « official » = celle de la division du sportif, posée
    // au calcul ; « coach » = écrite par le coach, ou corrigée sur cette ligne.
    loadSource: z.enum(["coach", "official"]),
    loadKg: z.number().min(0).max(500).optional(),
    // SkiErg et rameur seulement.
    pacePer500m: pacePer500m.optional(),
    targetSec: seconds(36_000).optional(),
    note: text(120).optional(),
  }),
  z.object({
    id: itemIdSchema,
    kind: z.literal("erg"),
    machine: z.enum(["skierg", "rowing", "bike"]),
    meters: z.number().int().min(1).max(42_195).optional(),
    seconds: seconds(36_000).optional(),
    pacePer500m: pacePer500m.optional(),
    targetSec: seconds(36_000).optional(),
  }),
  z.object({ id: itemIdSchema, kind: z.literal("transition"), seconds: seconds(600) }),
  // Un autre mouvement (« 12 burpees », « Kettlebell swings 20 × 16 kg »).
  z.object({
    id: itemIdSchema,
    kind: z.literal("exercise"),
    exerciseId: z.uuid().optional(),
    name: text(80),
    reps: z.number().int().min(1).max(500).optional(),
    meters: z.number().int().min(1).max(5000).optional(),
    loadKg: z.number().min(0).max(500).optional(),
  }),
]);

export const HYROX_BLOCK_FORMATS = [
  "simple",
  "circuit",
  "for_time",
  "amrap",
  "emom",
  "intervals",
  "simulation",
] as const;
export type HyroxBlockFormat = (typeof HYROX_BLOCK_FORMATS)[number];

export const hyroxBlockSchema = z.object({
  id: itemIdSchema,
  kind: z.literal("block"),
  format: z.enum(HYROX_BLOCK_FORMATS),
  // « Échauffement », « Simulation de course »… ; sinon, le nom du format.
  title: text(60).optional(),
  rounds: z.number().int().min(1).max(50).optional(),
  restSec: z.number().int().min(0).max(1800).optional(),
  targetSec: seconds(36_000).optional(),
  timeCapSec: seconds(36_000).optional(),
  // AMRAP : nombre de tours visé.
  targetRounds: z.number().int().min(1).max(100).optional(),
  // Choix du bloc : charges du coach, ou officielles de la division du sportif (BR-15).
  loads: z.enum(["coach", "official"]),
  lines: z.array(hyroxLineSchema).min(1).max(40),
});

export const hyroxContentSchema = z.object({
  discipline: z.literal("hyrox"),
  items: z
    .array(z.discriminatedUnion("kind", [hyroxBlockSchema, textBlockSchema]))
    .min(1)
    .max(20),
});

// Séance hybride : uniquement des blocs texte (séances v1 converties ; éditeur non dessiné).
export const hybridContentSchema = z.object({
  discipline: z.literal("hybrid"),
  items: z.array(textBlockSchema).min(1).max(40),
});

export const sessionContentSchema = z.discriminatedUnion("discipline", [
  runningContentSchema,
  strengthContentSchema,
  hyroxContentSchema,
  hybridContentSchema,
]);

// ---------------------------------------------------------------------------
// L'enveloppe d'une séance : ce qui est commun aux trois éditeurs.
// ---------------------------------------------------------------------------
export const WEEKDAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
export type Weekday = (typeof WEEKDAYS)[number];

const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);

export const sessionBodySchema = z.object({
  title: text(80),
  // « Fractionné », « Circuit », « Force »…
  sessionType: text(40),
  // Durée estimée (« Durée ≈ 45 min ») : calculée par l'éditeur quand c'est possible, modifiable.
  durationMinutes: z.number().int().min(5).max(600),
  objective: text(200).optional(),
  coachTip: text(1000).optional(),
  content: sessionContentSchema,
});

export const sessionDraftSchema = sessionBodySchema.extend({
  // Identifiant stable de la séance dans le programme : devient source_session_key à la publication.
  key: z.string().regex(/^[A-Za-z0-9_-]{1,80}$/),
  // Jours fixes (03b) : un jour, et une heure facultative.
  fixedDay: z.enum(WEEKDAYS).optional(),
  fixedTime: hhmm.optional(),
  // C-14 : enregistré maintenant, utilisé avec l'espace sportif (le sportif déplace dans la semaine).
  athleteCanMove: z.boolean(),
  // Séance faite AVEC le coach : le rendez-vous de son agenda verrouille le jour (BR-06).
  withCoach: z
    .object({ coachSessionId: z.uuid(), date: z.iso.date(), time: hhmm.optional() })
    .optional(),
  // Modèle de séance copié (BR-10 : la copie ne change jamais le modèle).
  sourceTemplate: z.object({ id: z.uuid(), version: z.number().int().min(1) }).optional(),
  // Durée corrigée à la main par le coach : elle n'est plus recalculée d'après le contenu (décision
  // d'Antonino du 10/11/2026, phase 4).
  durationManual: z.boolean().optional(),
});

// Une séance figée dans une publication (publication_sessions.session_json).
export const publishedSessionSchema = sessionBodySchema.extend({
  schemaVersion: z.literal(2),
  fixedDay: z.enum(WEEKDAYS).optional(),
  fixedTime: hhmm.optional(),
  athleteCanMove: z.boolean(),
  withCoach: z
    .object({ coachSessionId: z.uuid(), date: z.iso.date(), time: hhmm.optional() })
    .optional(),
});

export type TextBlock = z.infer<typeof textBlockSchema>;
export type RunStep = z.infer<typeof runStepSchema>;
export type RunRepeat = z.infer<typeof runRepeatSchema>;
export type RunMeasure = z.infer<typeof runMeasureSchema>;
export type RunningContent = z.infer<typeof runningContentSchema>;
export type StrengthSet = z.infer<typeof strengthSetSchema>;
export type StrengthExercise = z.infer<typeof strengthExerciseSchema>;
export type StrengthContent = z.infer<typeof strengthContentSchema>;
export type HyroxLine = z.infer<typeof hyroxLineSchema>;
export type HyroxBlock = z.infer<typeof hyroxBlockSchema>;
export type HyroxContent = z.infer<typeof hyroxContentSchema>;
export type SessionContent = z.infer<typeof sessionContentSchema>;
export type SessionDiscipline = SessionContent["discipline"];
export type SessionBody = z.infer<typeof sessionBodySchema>;
export type SessionDraft = z.infer<typeof sessionDraftSchema>;
export type PublishedSession = z.infer<typeof publishedSessionSchema>;
