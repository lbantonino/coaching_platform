import { z } from "zod";

import { parsePaceRange } from "@/domain/training/pace";

// Types de repères (alignés sur la contrainte CHECK de *_reperes_sportifs.sql).
export const referenceKindLabels = {
  pace_vma: "VMA",
  pace_easy: "Endurance (zone 2)",
  pace_tempo: "Tempo",
  pace_threshold: "Seuil",
  pace_5k: "Allure 5 km",
  pace_10k: "Allure 10 km",
  pace_half: "Allure semi-marathon",
  pace_marathon: "Allure marathon",
  pace_race: "Race pace (Hyrox)",
  hr_max: "FC max",
  hr_rest: "FC repos",
  strength_load: "Charge de référence",
} as const;

export type ReferenceKind = keyof typeof referenceKindLabels;
export type ReferenceGroup = "pace" | "hr" | "strength";

export const referenceSourceLabels = {
  test: "Test",
  observed: "Constaté",
  coach_estimate: "Estimation coach",
} as const;

export type ReferenceSource = keyof typeof referenceSourceLabels;

export function referenceGroup(kind: ReferenceKind): ReferenceGroup {
  if (kind.startsWith("pace_")) return "pace";
  if (kind.startsWith("hr_")) return "hr";
  return "strength";
}

const kindSchema = z.enum(Object.keys(referenceKindLabels) as [ReferenceKind, ...ReferenceKind[]], {
  error: "Choisis un type de repère.",
});
const sourceSchema = z.enum(
  Object.keys(referenceSourceLabels) as [ReferenceSource, ...ReferenceSource[]],
  {
    error: "Choisis la source du repère.",
  },
);

export type ReferenceFormInput = {
  kind: string;
  pace: string;
  bpm: string;
  exercise: string;
  loadKg: string;
  reps: string;
  source: string;
  measuredOn: string;
  note: string;
};

// Valeurs prêtes à enregistrer (noms de colonnes de la base).
export type ReferenceValues = {
  kind: ReferenceKind;
  pace_min_sec_per_km: number | null;
  pace_max_sec_per_km: number | null;
  bpm: number | null;
  exercise_label: string | null;
  load_kg: number | null;
  reps: number | null;
  source: ReferenceSource;
  measured_on: string;
  coach_note: string | null;
};

export type ReferenceParseResult =
  { ok: true; values: ReferenceValues } | { ok: false; error: string };

// Lecture PURE du formulaire « Ajouter un repère » : seules les valeurs du type choisi sont retenues.
// `today` (AAAA-MM-JJ) est passé en paramètre pour que la règle « pas de date future » soit testable.
export function parseReferenceForm(input: ReferenceFormInput, today: string): ReferenceParseResult {
  const kind = kindSchema.safeParse(input.kind);
  if (!kind.success) return { ok: false, error: "Choisis un type de repère." };
  const source = sourceSchema.safeParse(input.source);
  if (!source.success) return { ok: false, error: "Choisis la source du repère." };

  const measuredOn = input.measuredOn.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(measuredOn) || Number.isNaN(Date.parse(measuredOn))) {
    return { ok: false, error: "Indique la date de la mesure." };
  }
  if (measuredOn > today)
    return { ok: false, error: "La date de la mesure ne peut pas être dans le futur." };
  if (measuredOn < "2000-01-01") return { ok: false, error: "Date de mesure invalide." };

  const note = input.note.trim();
  if (note.length > 500) return { ok: false, error: "Note trop longue (500 caractères maximum)." };

  const values: ReferenceValues = {
    kind: kind.data,
    pace_min_sec_per_km: null,
    pace_max_sec_per_km: null,
    bpm: null,
    exercise_label: null,
    load_kg: null,
    reps: null,
    source: source.data,
    measured_on: measuredOn,
    coach_note: note === "" ? null : note,
  };

  const group = referenceGroup(kind.data);
  if (group === "pace") {
    const pace = parsePaceRange(input.pace);
    if (!pace.ok) return { ok: false, error: pace.error };
    values.pace_min_sec_per_km = pace.minSecPerKm;
    values.pace_max_sec_per_km = pace.maxSecPerKm;
  } else if (group === "hr") {
    const bpm = Number(input.bpm.trim());
    if (!Number.isInteger(bpm) || bpm < 30 || bpm > 240) {
      return {
        ok: false,
        error: "Fréquence cardiaque invalide : un nombre entier entre 30 et 240 bpm.",
      };
    }
    values.bpm = bpm;
  } else {
    const exercise = input.exercise.trim();
    if (exercise.length < 1 || exercise.length > 80) {
      return { ok: false, error: "Indique l'exercice (80 caractères maximum)." };
    }
    const loadKg = Number(input.loadKg.trim().replace(",", "."));
    if (!Number.isFinite(loadKg) || loadKg <= 0 || loadKg > 1000) {
      return { ok: false, error: "Charge invalide : un nombre de kg entre 0 et 1000." };
    }
    const repsText = input.reps.trim();
    const reps = repsText === "" ? null : Number(repsText);
    if (reps !== null && (!Number.isInteger(reps) || reps < 1 || reps > 100)) {
      return { ok: false, error: "Répétitions invalides : un nombre entier entre 1 et 100." };
    }
    values.exercise_label = exercise;
    values.load_kg = Math.round(loadKg * 100) / 100;
    values.reps = reps;
  }

  return { ok: true, values };
}
