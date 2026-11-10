import { describe, expect, it } from "vitest";

import {
  addSet,
  addSuperset,
  exerciseSummary,
  groupMeta,
  parseQuickFill,
  parseReps,
  parseRest,
  quickFill,
  removeExercise,
  setLoadMode,
  strengthSummary,
  ungroup,
} from "@/domain/training/strength-edit";
import {
  strengthContentSchema,
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
