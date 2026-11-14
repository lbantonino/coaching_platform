// Briques des modèles Coory générés (D-177, 14/11/2026) : étapes de course, exercices et séries.
// Les modèles eux-mêmes sont dans modeles.ts ; le test tests/unit/modeles-coory.test.ts les valide
// avec les schémas de l'app et réécrit leur partie de supabase/content/modeles_coory.sql.
import { paceRangeFromVma } from "@/domain/training/aims";
import { withEstimatedDuration } from "@/domain/training/session-duration";
import type {
  RunRepeat,
  RunStep,
  SessionContent,
  SessionDraft,
  StrengthContent,
  StrengthExercise,
  StrengthSet,
} from "@/domain/training/session-v2";

type StrengthSuperset = Extract<StrengthContent["items"][number], { kind: "superset" }>;

// ---------------------------------------------------------------------------
// Course : allures en % de VMA, recalculées pour chaque sportif au moment d'« Utiliser ce modèle »
// (program-upgrade.ts, adaptSession). Sans VMA connue, l'allure affichée est celle d'un sportif à
// 15,8 km/h, comme les modèles de course existants (240 s/km à 95 %).
// ---------------------------------------------------------------------------
export const REFERENCE_VMA_KMH = 15.8;

type Target = NonNullable<RunStep["target"]>;

export const vma = (low: number, high = low): Target => ({
  kind: "pace",
  ...paceRangeFromVma(REFERENCE_VMA_KMH, low, high),
  vmaPercent: { from: Math.min(low, high), to: Math.max(low, high) },
});
export const zone = (value: 1 | 2 | 3 | 4 | 5): Target => ({ kind: "hr", zone: value });

const minutes = (value: number) => ({ type: "time" as const, seconds: Math.round(value * 60) });
const meters = (value: number) => ({ type: "distance" as const, meters: value });

type StepExtras = { label?: string; note?: string };

export const warmup = (min: number): RunStep => ({
  id: "e1",
  kind: "step",
  role: "warmup",
  measure: minutes(min),
  target: zone(2),
});
export const cooldown = (min: number): RunStep => ({
  id: "c1",
  kind: "step",
  role: "cooldown",
  measure: minutes(min),
});
// Course à une durée, en zone de FC ou à une allure.
export const runFor = (
  id: string,
  min: number,
  target: Target,
  extras: StepExtras = {},
): RunStep => ({
  id,
  kind: "step",
  role: "run",
  ...(extras.label ? { label: extras.label } : {}),
  measure: minutes(min),
  target,
  ...(extras.note ? { note: extras.note } : {}),
});
// « N × (effort + récupération) » : effort en minutes (nombre) ou en mètres ({ m }).
export function repeat(
  id: string,
  times: number,
  effort: number | { m: number },
  target: Target,
  recoveryMin: number,
  label?: string,
): RunRepeat {
  return {
    id,
    kind: "repeat",
    times,
    steps: [
      {
        id: `${id}a`,
        kind: "step",
        role: "run",
        ...(label ? { label } : {}),
        measure: typeof effort === "number" ? minutes(effort) : meters(effort.m),
        target,
      },
      { id: `${id}b`, kind: "step", role: "recovery", measure: minutes(recoveryMin) },
    ],
  };
}
// Récupération entre deux blocs (« 3 min de trot »).
export const recovery = (id: string, min: number): RunStep => ({
  id,
  kind: "step",
  role: "recovery",
  measure: minutes(min),
});
// Lignes droites : 20 s vite et relâché, 40 s de trot.
export const strides = (id: string, times: number): RunRepeat =>
  repeat(id, times, 20 / 60, vma(100), 40 / 60, "Ligne droite");

// ---------------------------------------------------------------------------
// Musculation : exercices du catalogue commun (identifiants fixes de la migration
// 20261030100100, noms tels qu'affichés dans la Bibliothèque).
// ---------------------------------------------------------------------------
export const EX = {
  backSquat: { id: "23bb6605-e34b-5e09-a775-823e52f1ef10", name: "Back squat" },
  benchPress: { id: "922f5540-60d1-5443-bc49-55c3f5964cf3", name: "Développé couché barre" },
  deadlift: { id: "24c44764-91f1-53d1-ad99-45398754a2f7", name: "Soulevé de terre barre" },
  ohp: { id: "82832fb6-48a3-56a2-ae74-fe6dc99165e8", name: "Développé militaire" },
  barbellRow: { id: "6763692a-f6af-52e0-b5ce-c39fd5d8d208", name: "Rowing barre buste penché" },
  pullUp: { id: "697cc21a-fced-58b5-bc1b-aff830ac525c", name: "Tractions pronation" },
  latPulldown: { id: "bbbbc5e4-5f2c-5142-ac06-bc101cd46244", name: "Tirage vertical" },
  cableRow: { id: "93fe68d7-ddec-5dea-ab59-51f946062028", name: "Tirage horizontal à la poulie" },
  rdl: { id: "346bba7e-0695-5ced-8786-bebce6b5c95a", name: "Soulevé de terre roumain" },
  hipThrust: { id: "a9b33b2a-9149-5824-ae97-045cd8161b94", name: "Hip thrust barre" },
  bulgarian: { id: "dbcfd370-ed95-5183-ae56-660e1d55b897", name: "Squat bulgare haltères" },
  reverseLunge: { id: "7278482e-423a-5dfe-8b23-597412cf829a", name: "Fentes arrière haltères" },
  gobletSquat: { id: "90d201e1-5bf0-5e09-a057-68df0fd1d970", name: "Goblet squat" },
  legPress: { id: "e9844c81-7922-5862-b902-f3daa687154f", name: "Presse à cuisses" },
  legCurl: { id: "8eb07f14-d0b3-5e88-9f86-ff829ec282b6", name: "Leg curl allongé" },
  seatedLegCurl: { id: "737d52e0-4f6b-5653-990b-48e988e5ac5f", name: "Leg curl assis" },
  legExtension: { id: "7d6d981a-51d6-53af-8db2-6fdb8d646e11", name: "Leg extension" },
  calfRaise: { id: "479a2880-3055-5739-b1b5-3322f2ac536e", name: "Extension des mollets debout" },
  dbBench: { id: "7fd4b0ad-e4bf-5807-909f-c08767752361", name: "Développé couché haltères" },
  inclineDb: { id: "d3530154-c5bb-5ea7-a3fc-2747ab52fcdb", name: "Développé incliné haltères" },
  dbShoulder: { id: "54f45553-cf09-5cf9-ae0e-a7e6ba3d84ad", name: "Développé épaules haltères" },
  lateralRaise: {
    id: "a0435b79-0ff9-5e70-9c60-9e6109893c3d",
    name: "Élévations latérales haltères",
  },
  facePull: { id: "38e22fb9-0c51-59d2-9982-2f5854d96a9e", name: "Face pull" },
  hammerCurl: { id: "82223a24-703c-5011-bb2f-afc38fd25149", name: "Curl marteau haltères" },
  barbellCurl: { id: "d9b220b8-c43e-5325-8624-8568baaf649d", name: "Curl barre" },
  pushdown: {
    id: "bd8ea083-acf7-5187-82dc-c9b615d0f61c",
    name: "Extension triceps à la poulie barre droite",
  },
  dips: { id: "0656db4f-0eca-5a73-9eb2-5dbbd6e5fa2c", name: "Dips pectoraux" },
  plank: { id: "e1a8499d-6da3-5324-82e4-03562dbec1f8", name: "Planche" },
  sidePlank: { id: "ca8c0be9-2fce-5e69-920d-49f4468502a6", name: "Planche latérale" },
  deadBug: { id: "e49ec3d5-fc1f-58b9-9f8a-6d20f2081412", name: "Dead bug" },
  legRaise: { id: "7645e1be-5424-563a-b522-886b38114f23", name: "Relevé de jambes suspendu" },
  kbSwing: { id: "1fc8f0a4-9996-58e5-9cdb-a3c954f80d47", name: "Kettlebell swing" },
} as const;
export type ExerciseRef = (typeof EX)[keyof typeof EX];

type Reps = number | [number, number];
const reps = (value: Reps) =>
  typeof value === "number" ? { repsMin: value } : { repsMin: value[0], repsMax: value[1] };

// Séries en kg (charge choisie par le coach) : N séries de R répétitions, RIR facultatif.
export const kgSets = (count: number, value: Reps, rir?: number): StrengthSet[] =>
  Array.from({ length: count }, () => ({
    type: "normal" as const,
    ...reps(value),
    ...(rir !== undefined ? { rir } : {}),
  }));
// Séries tenues (planche, gainage) : N séries de S secondes (ou d'une plage).
export const heldSets = (count: number, value: number | [number, number]): StrengthSet[] =>
  Array.from({ length: count }, () => ({
    type: "normal" as const,
    ...(typeof value === "number"
      ? { seconds: value }
      : { seconds: value[0], secondsMax: value[1] }),
  }));
// Séries en % du max : deux séries d'échauffement (40 % puis 60 %), puis N séries de R à P %.
export const pctSets = (count: number, value: number, pct: number): StrengthSet[] => [
  { type: "warmup", repsMin: 5, pct: 40 },
  { type: "warmup", repsMin: 3, pct: 60 },
  ...Array.from({ length: count }, () => ({ type: "normal" as const, repsMin: value, pct })),
];

type ExerciseExtras = { restSec?: number; cue?: string; tempo?: string };

export const exercise = (
  id: string,
  ref: ExerciseRef,
  loadMode: "kg" | "pct",
  sets: StrengthSet[],
  extras: ExerciseExtras = {},
): StrengthExercise => ({
  id,
  kind: "exercise",
  exerciseId: ref.id,
  name: ref.name,
  loadMode,
  sets,
  ...(extras.restSec !== undefined ? { restSec: extras.restSec } : {}),
  ...(extras.tempo ? { tempo: extras.tempo } : {}),
  ...(extras.cue ? { cue: extras.cue } : {}),
});

// Superset : une série de chaque exercice par tour, repos en fin de tour.
export const superset = (
  id: string,
  rounds: number,
  restSec: number,
  exercises: StrengthExercise[],
): StrengthSuperset => ({ id, kind: "superset", rounds, restSec, exercises });

// ---------------------------------------------------------------------------
// Séance : la durée est celle qu'estime l'app d'après le contenu (comme dans l'éditeur).
// ---------------------------------------------------------------------------
export type SessionText = {
  title: string;
  sessionType: string;
  objective?: string;
  coachTip?: string;
};

export function session(key: string, text: SessionText, content: SessionContent): SessionDraft {
  return withEstimatedDuration({
    title: text.title,
    sessionType: text.sessionType,
    durationMinutes: 30,
    ...(text.objective ? { objective: text.objective } : {}),
    ...(text.coachTip ? { coachTip: text.coachTip } : {}),
    content,
    key,
    athleteCanMove: false,
  });
}
