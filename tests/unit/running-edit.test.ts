import { describe, expect, it } from "vitest";

import {
  addRepeat,
  addStep,
  distanceField,
  duplicateItem,
  durationField,
  estimatedMinutes,
  findStep,
  moveItem,
  parseDistance,
  parseDuration,
  removeStep,
  runningCounts,
  runningSummary,
  setRepeatTimes,
  stepDetail,
} from "@/domain/training/running-edit";
import { runningContentSchema, type RunningContent } from "@/domain/training/session-v2";

// La séance de la maquette 04 : « Endurance rapide », 15 min + 5 × (2 min + 2 min) + 10 min.
const endurance = (): RunningContent => ({
  discipline: "running",
  items: [
    {
      id: "e1",
      kind: "step",
      role: "warmup",
      measure: { type: "time", seconds: 900 },
      target: { kind: "pace", fromSecPerKm: 375, toSecPerKm: 375 },
      note: "allure progressive",
    },
    {
      id: "r1",
      kind: "repeat",
      times: 5,
      steps: [
        {
          id: "e2",
          kind: "step",
          role: "run",
          label: "Course rapide",
          measure: { type: "time", seconds: 120 },
          target: { kind: "pace", fromSecPerKm: 300, toSecPerKm: 310 },
        },
        {
          id: "e3",
          kind: "step",
          role: "recovery",
          measure: { type: "time", seconds: 120 },
          note: "Trot",
        },
      ],
    },
    {
      id: "e4",
      kind: "step",
      role: "cooldown",
      measure: { type: "time", seconds: 600 },
      target: { kind: "pace", fromSecPerKm: 395, toSecPerKm: 395 },
    },
  ],
});

describe("saisie des mesures", () => {
  it("lit une durée en minutes, en mm:ss ou en h:mm:ss ; l'écrit toujours en minutes", () => {
    expect(parseDuration("2:00")).toBe(120);
    expect(parseDuration("45")).toBe(2700);
    expect(parseDuration("1:15:00")).toBe(4500);
    expect(parseDuration("90 s")).toBe(90);
    expect(parseDuration("2:75")).toBeNull();
    expect(parseDuration("abc")).toBeNull();
    expect(durationField(120)).toEqual({ value: "2:00", unit: "min" });
    // Running : toujours en minutes, jamais en heures (règle d'Antonino du 10/11).
    expect(durationField(4500)).toEqual({ value: "75:00", unit: "min" });
  });
  it("lit une distance en mètres ou en kilomètres", () => {
    expect(parseDistance("800")).toBe(800);
    expect(parseDistance("1,5")).toBe(1500);
    expect(parseDistance("10")).toBe(10_000);
    expect(parseDistance("400 m")).toBe(400);
    expect(parseDistance("2 km")).toBe(2000);
    expect(parseDistance("-3")).toBeNull();
    expect(distanceField(1500)).toEqual({ value: "1,5", unit: "km" });
    expect(distanceField(800)).toEqual({ value: "800", unit: "m" });
  });
});

describe("lecture de la séance", () => {
  it("écrit le résumé, les totaux et les détails comme la maquette", () => {
    const content = endurance();
    expect(runningSummary(content)).toBe("15 min + 5 × (2 min + 2 min) + 10 min");
    expect(runningCounts(content)).toEqual({ blocks: 3, steps: 12 });
    expect(estimatedMinutes(content, 30)).toBe(45);
    const steps = content.items;
    expect(steps[0]?.kind === "step" && stepDetail(steps[0])).toBe(
      "6:15 min/km · allure progressive",
    );
    const repeat = steps[1];
    if (repeat?.kind !== "repeat") throw new Error("bloc attendu");
    expect(stepDetail(repeat.steps[0]!)).toBe("5:00 – 5:10 min/km");
    expect(stepDetail(repeat.steps[1]!)).toBe("Trot · sans cible");
  });
});

describe("modifications", () => {
  it("ajoute une étape, un bloc Répéter, et garde un contenu valide", () => {
    const { content: one, id } = addStep(endurance());
    expect(one.items).toHaveLength(4);
    expect(findStep(one, id)?.repeat).toBeNull();
    const { content: two, id: inner } = addStep(one, "r1");
    expect(findStep(two, inner)?.repeat?.id).toBe("r1");
    const { content: three } = addRepeat(two);
    expect(three.items.at(-1)?.kind).toBe("repeat");
    expect(runningContentSchema.safeParse(three).success).toBe(true);
  });
  it("retire une étape ; un bloc vidé disparaît ; la séance garde un élément", () => {
    const content = removeStep(removeStep(endurance(), "e2"), "e3");
    expect(content.items.map((item) => item.id)).toEqual(["e1", "e4"]);
    const single: RunningContent = { discipline: "running", items: [endurance().items[0]!] };
    expect(removeStep(single, "e1")).toEqual(single);
  });
  it("règle le nombre de répétitions entre 2 et 50", () => {
    const repeat = (content: RunningContent) => content.items[1];
    expect(repeat(setRepeatTimes(endurance(), "r1", 1))).toMatchObject({ times: 2 });
    expect(repeat(setRepeatTimes(endurance(), "r1", 80))).toMatchObject({ times: 50 });
  });
  it("déplace et duplique, avec de nouveaux identifiants", () => {
    expect(moveItem(endurance(), 0, 2).items.map((item) => item.id)).toEqual(["r1", "e4", "e1"]);
    const inner = moveItem(endurance(), 1, 0, "r1").items[1];
    expect(inner?.kind === "repeat" && inner.steps.map((step) => step.id)).toEqual(["e3", "e2"]);
    const copy = duplicateItem(endurance(), "r1");
    expect(copy.items).toHaveLength(4);
    const [, first, second] = copy.items;
    expect(second?.id).not.toBe(first?.id);
    expect(runningContentSchema.safeParse(copy).success).toBe(true);
  });
});
