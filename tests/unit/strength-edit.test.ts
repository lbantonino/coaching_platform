import { describe, expect, it } from "vitest";

import {
  renameExercise,
  addExercise,
  addSet,
  addSuperset,
  exerciseSummary,
  groupMeta,
  newExercise,
  parseQuickFill,
  parseReps,
  parseRest,
  parseSeconds,
  quickFill,
  quickFillText,
  removeExercise,
  setExerciseMeasure,
  setLoadMode,
  strengthSummary,
  ungroup,
} from "@/domain/training/strength-edit";
import { estimatedSessionSeconds } from "@/domain/training/session-duration";
import {
  strengthContentSchema,
  strengthExerciseSchema,
  type StrengthContent,
  type StrengthExercise,
} from "@/domain/training/session-v2";

// « Full Body A » de la maquette 05 (extrait).
const split = (): StrengthExercise => ({
  id: "x1",
  kind: "exercise",
  name: "Bulgarian split squat",
  loadMode: "kg",
  sets: [
    { type: "warmup", repsMin: 12, kg: 8 },
    { type: "normal", repsMin: 8, repsMax: 10, kg: 14, rir: 2 },
    { type: "normal", repsMin: 8, repsMax: 10, kg: 14, rir: 2 },
    { type: "normal", repsMin: 8, repsMax: 10, kg: 14, rir: 2 },
  ],
  restSec: 90,
});

const fullBody = (): StrengthContent => ({
  discipline: "strength",
  items: [
    split(),
    {
      id: "g1",
      kind: "superset",
      rounds: 3,
      restSec: 90,
      exercises: [
        {
          id: "x2",
          kind: "exercise",
          name: "Pompes",
          loadMode: "kg",
          sets: [{ type: "normal", repsMin: 10, rir: 1 }],
        },
        {
          id: "x3",
          kind: "exercise",
          name: "Tirage",
          loadMode: "kg",
          sets: [{ type: "normal", repsMin: 10, kg: 16 }],
        },
      ],
    },
    {
      id: "g2",
      kind: "emom",
      minutes: 6,
      workSec: 20,
      exercises: [
        {
          id: "x4",
          kind: "exercise",
          name: "Pompes",
          loadMode: "kg",
          sets: [{ type: "normal", repsMin: 8 }],
        },
      ],
    },
  ],
});

describe("saisie", () => {
  it("lit la saisie rapide, les répétitions et le repos", () => {
    expect(parseQuickFill("3 séries de 8 à 10")).toEqual({ count: 3, repsMin: 8, repsMax: 10 });
    expect(parseQuickFill("4 x 6")).toEqual({ count: 4, repsMin: 6 });
    expect(parseQuickFill("5×5")).toEqual({ count: 5, repsMin: 5 });
    expect(parseQuickFill("beaucoup")).toBeNull();
    expect(parseReps("8-10")).toEqual({ repsMin: 8, repsMax: 10 });
    expect(parseReps("12")).toEqual({ repsMin: 12 });
    expect(parseReps("10-8")).toBeNull();
    expect(parseRest("90 s")).toBe(90);
    expect(parseRest("1:30")).toBe(90);
    expect(parseRest("2 min")).toBe(120);
  });
  it("« Remplir » garde l'échauffement et la charge", () => {
    const filled = quickFill(split(), { count: 4, repsMin: 6 });
    expect(filled.sets).toHaveLength(5);
    expect(filled.sets[0]?.type).toBe("warmup");
    expect(filled.sets[4]).toEqual({ type: "normal", repsMin: 6, kg: 14, rir: 2 });
  });
});

describe("lecture", () => {
  it("résume comme la maquette", () => {
    expect(exerciseSummary(split())).toBe("3 × 8–10 · 14 kg · RIR 2 · repos 90 s");
    const content = fullBody();
    expect(strengthSummary(content)).toBe("4 exercices · 15 séries · superset et EMOM");
    const [, superset, emom] = content.items;
    if (superset?.kind !== "superset" || emom?.kind !== "emom") throw new Error("groupes attendus");
    expect(groupMeta(superset)).toBe("3 tours · repos 90 s");
    expect(groupMeta(emom)).toBe("6 min · 20 s / 40 s");
    expect(exerciseSummary(superset.exercises[0]!, { inGroup: true })).toBe(
      "10 répétitions · RIR 1",
    );
  });
});

describe("charge en % du max", () => {
  it("passe en % depuis les kg et le max, calcule les kg, revient en kg", () => {
    const pct = setLoadMode(split(), "pct", 20);
    expect(pct.sets.map((set) => set.pct)).toEqual([40, 70, 70, 70]);
    expect(pct.sets[1]?.kg).toBe(14);
    expect(strengthContentSchema.safeParse({ ...fullBody(), items: [pct] }).success).toBe(true);
    const back = setLoadMode(pct, "kg", 20);
    expect(back.sets.every((set) => set.pct === undefined)).toBe(true);
    expect(back.sets[1]?.kg).toBe(14);
    const unknown = setLoadMode(split(), "pct", null);
    expect(unknown.sets[1]).toMatchObject({ pct: 70 });
    expect(unknown.sets[1]?.kg).toBeUndefined();
  });
});

describe("modifications", () => {
  it("un superset réduit à un exercice redevient un exercice seul", () => {
    const content = removeExercise(fullBody(), "x3");
    expect(content.items.map((item) => item.kind)).toEqual(["exercise", "exercise", "emom"]);
    expect(strengthContentSchema.safeParse(content).success).toBe(true);
  });
  it("crée un superset, le défait, ajoute une série", () => {
    const created = addSuperset(fullBody(), [{ name: "Squat" }, { name: "Fentes" }]);
    expect(created?.content.items.at(-1)).toMatchObject({ kind: "superset", rounds: 3 });
    expect(addSuperset(fullBody(), [{ name: "Squat" }])).toBeNull();
    expect(ungroup(fullBody(), "g1").items).toHaveLength(4);
    expect(addSet(split()).sets).toHaveLength(5);
    expect(strengthContentSchema.safeParse(created?.content).success).toBe(true);
  });
});

describe("ajouts (phase 4)", () => {
  it("un exercice ajouté suit la façon de viser du programme (BR-12)", () => {
    const pct = addExercise(fullBody(), { name: "Hip thrust" }, undefined, "pct");
    const added = pct.content.items.find((item) => item.id === pct.id);
    expect(added?.kind === "exercise" ? added.sets.map((set) => set.pct) : []).toEqual([
      70, 70, 70,
    ]);
    expect(strengthContentSchema.safeParse(pct.content).success).toBe(true);
    const superset = addSuperset(fullBody(), [{ name: "Fentes" }, { name: "Gainage" }], "pct");
    const group = superset?.content.items.at(-1);
    expect(group?.kind === "superset" ? group.exercises.map((x) => x.loadMode) : []).toEqual([
      "pct",
      "pct",
    ]);
  });
  it("au-delà de 40 éléments, rien ne s'ajoute (la séance resterait non enregistrable)", () => {
    const full: StrengthContent = {
      discipline: "strength",
      items: Array.from({ length: 40 }, (_, i) => ({ ...split(), id: `x${i + 10}` })),
    };
    expect(addExercise(full, { name: "Un de trop" }).content.items).toHaveLength(40);
    expect(addSuperset(full, [{ name: "A" }, { name: "B" }])).toBeNull();
  });
});

// Exercices tenus (D-166, demande d'Antonino du 13/11) : planche, gainage, équilibre se comptent en
// secondes.
describe("séries en secondes", () => {
  const plank = (): StrengthExercise => ({
    id: "x9",
    kind: "exercise",
    name: "Planche",
    loadMode: "kg",
    sets: [
      { type: "normal", seconds: 30 },
      { type: "normal", seconds: 30 },
      { type: "normal", seconds: 30 },
    ],
    restSec: 60,
  });

  it("lit « 3 séries de 30 s », « 3 x 30-45 s », et « 3 x 45 » pour un exercice tenu", () => {
    expect(parseQuickFill("3 séries de 30 s")).toEqual({ count: 3, seconds: 30 });
    expect(parseQuickFill("3 x 30-45 s")).toEqual({ count: 3, seconds: 30, secondsMax: 45 });
    expect(parseQuickFill("3 x 45", true)).toEqual({ count: 3, seconds: 45 });
    expect(parseQuickFill("3 x 10")).toEqual({ count: 3, repsMin: 10 });
    expect(parseQuickFill("3 x 2 s")).toBeNull();
  });

  it("lit une durée de série : « 45 s », « 30 à 45 »", () => {
    expect(parseSeconds("45 s")).toEqual({ seconds: 45 });
    expect(parseSeconds("30 à 45")).toEqual({ seconds: 30, secondsMax: 45 });
    expect(parseSeconds("2")).toBeNull();
    expect(parseSeconds("abc")).toBeNull();
  });

  it("résume « 3 × 30 s » et calcule la durée avec le temps tenu", () => {
    expect(exerciseSummary(plank())).toBe("3 × 30 s · repos 60 s");
    expect(quickFillText(plank())).toBe("3 séries de 30 s");
    const content: StrengthContent = { discipline: "strength", items: [plank()] };
    // 3 × 30 s de travail et 2 repos de 60 s : au moins 210 s, au plus quelques minutes.
    const seconds = estimatedSessionSeconds(content) ?? 0;
    expect(seconds).toBeGreaterThanOrEqual(210);
    expect(seconds).toBeLessThanOrEqual(360);
  });

  it("passe un exercice des répétitions aux secondes, et retour", () => {
    const timed = setExerciseMeasure(split(), true);
    expect(timed.sets.every((set) => set.seconds === 30 && set.repsMin === undefined)).toBe(true);
    // Pas de RIR pour un temps tenu.
    expect(timed.sets.every((set) => set.rir === undefined)).toBe(true);
    expect(timed.loadMode).toBe("kg");
    expect(strengthExerciseSchema.safeParse(timed).success).toBe(true);
    const back = setExerciseMeasure(timed, false);
    expect(back.sets.every((set) => set.repsMin === 10 && set.seconds === undefined)).toBe(true);
    expect(quickFill(plank(), { count: 4, seconds: 45 }).sets).toHaveLength(4);
    // « 3 séries de 30 s » sur un exercice en répétitions : les secondes, sans le RIR d'avant.
    const filled = quickFill(split(), { count: 3, seconds: 30 });
    expect(filled.sets.every((set) => set.seconds === 30 && set.rir === undefined)).toBe(true);
    expect(strengthExerciseSchema.safeParse(filled).success).toBe(true);
  });

  it("propose 3 × 30 s pour un exercice tenu de la Bibliothèque", () => {
    const exercise = newExercise(
      { discipline: "strength", items: [] },
      { exerciseId: "f04352aa-2058-573f-a105-76a1fbf32543", name: "Planche", timed: true },
      new Set(),
      "pct",
    );
    expect(exercise.loadMode).toBe("kg");
    expect(exercise.sets).toEqual([
      { type: "normal", seconds: 30 },
      { type: "normal", seconds: 30 },
      { type: "normal", seconds: 30 },
    ]);
  });

  it("refuse une série à la fois en répétitions et en secondes, ou un exercice mélangé", () => {
    expect(
      strengthExerciseSchema.safeParse({
        ...plank(),
        sets: [{ type: "normal", seconds: 30, repsMin: 10 }],
      }).success,
    ).toBe(false);
    expect(
      strengthExerciseSchema.safeParse({
        ...plank(),
        sets: [
          { type: "normal", seconds: 30 },
          { type: "normal", repsMin: 10 },
        ],
      }).success,
    ).toBe(false);
  });
});

// Renommer un exercice (demande d'Antonino du 14/11/2026, D-179) : le nom affiché change, l'exercice
// reste relié à la Bibliothèque (photo, consignes, max du sportif) ; jamais de nom vide.
describe("renameExercise", () => {
  const exercise = {
    id: "x1",
    kind: "exercise" as const,
    exerciseId: "23bb6605-e34b-5e09-a775-823e52f1ef10",
    name: "Back squat",
    loadMode: "kg" as const,
    sets: [{ type: "normal" as const, repsMin: 5 }],
  };
  it("donne le nom écrit, sans espaces autour, et garde le lien à la Bibliothèque", () => {
    expect(renameExercise(exercise, " Squat arrière ")).toEqual({
      ...exercise,
      name: "Squat arrière",
    });
  });
  it("un nom vide ne remplace rien", () => {
    expect(renameExercise(exercise, "   ")).toBe(exercise);
  });
  it("coupe un nom trop long (80 caractères au plus)", () => {
    expect(renameExercise(exercise, "y".repeat(90)).name).toHaveLength(80);
  });
});
