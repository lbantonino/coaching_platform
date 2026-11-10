import { describe, expect, it } from "vitest";

import {
  addBlock,
  addLine,
  applyLoads,
  blockLabel,
  blockMeta,
  hyroxCounts,
  hyroxSummary,
  insertSimulation,
  lineDetail,
  lineRight,
  parseClock,
  removeLine,
} from "@/domain/training/hyrox-edit";
import { hyroxContentSchema, type HyroxContent } from "@/domain/training/session-v2";

// « Circuit Hyrox » de la maquette 06.
const circuit = (): HyroxContent => ({
  discipline: "hyrox",
  items: [
    {
      id: "b1",
      kind: "block",
      format: "simple",
      title: "Échauffement",
      loads: "coach",
      lines: [{ id: "l1", kind: "run", meters: 1000, paceSecPerKm: 360 }],
    },
    {
      id: "b2",
      kind: "block",
      format: "circuit",
      rounds: 5,
      restSec: 60,
      loads: "coach",
      lines: [
        { id: "l2", kind: "run", meters: 600, paceSecPerKm: 345 },
        {
          id: "l3",
          kind: "station",
          station: "sled_push",
          meters: 25,
          loadKg: 102,
          loadSource: "coach",
        },
        { id: "l4", kind: "transition", seconds: 30 },
      ],
    },
    {
      id: "b3",
      kind: "block",
      format: "amrap",
      timeCapSec: 1500,
      targetRounds: 4,
      loads: "coach",
      lines: [
        {
          id: "l5",
          kind: "station",
          station: "wall_balls",
          reps: 15,
          loadKg: 6,
          loadSource: "coach",
        },
      ],
    },
  ],
});

describe("lecture", () => {
  it("écrit les lignes et les blocs comme la maquette", () => {
    const content = circuit();
    const [warmup, block, amrap] = content.items;
    if (warmup?.kind !== "block" || block?.kind !== "block" || amrap?.kind !== "block")
      throw new Error("blocs attendus");
    expect(lineDetail(block.lines[0]!)).toBe("600 m · 5:45 min/km");
    expect(lineRight(block.lines[0]!)).toBe("≈ 3:27");
    expect(lineDetail(block.lines[1]!)).toBe("25 m · 102 kg · station");
    expect(lineRight(block.lines[2]!)).toBe("30 s");
    expect(blockLabel(warmup)).toBe("Échauffement");
    expect(blockMeta(warmup)).toBe("Run");
    expect(blockMeta(block)).toBe("tours · repos 1 min");
    expect(blockLabel(amrap)).toBe("AMRAP 25 min");
    expect(blockMeta(amrap)).toBe("cible 4 tours");
    expect(hyroxSummary(content)).toBe("Échauffement · 5 tours · AMRAP 25 min");
    expect(hyroxCounts(content)).toEqual({ blocks: 3, lines: 5 });
  });
  it("lit un temps", () => {
    expect(parseClock("5:05")).toBe(305);
    expect(parseClock("1:18:20")).toBe(4700);
    expect(parseClock("25")).toBe(1500);
    expect(parseClock("5:75")).toBeNull();
  });
});

describe("charges officielles et simulation", () => {
  it("un seul choix remplit toutes les stations du bloc", () => {
    const block = circuit().items[1];
    if (block?.kind !== "block") throw new Error("bloc attendu");
    const official = applyLoads(block, "official", "men_pro", "male");
    expect(official.lines[1]).toMatchObject({ loadSource: "official", loadKg: 202 });
    expect(applyLoads(official, "coach", null, null).lines[1]).toMatchObject({
      loadSource: "coach",
    });
  });
  it("la simulation pose 8 runs et les 8 stations, charges de la division", () => {
    const { content } = insertSimulation(circuit(), "official", "women_open", "female");
    const simulation = content.items.at(-1);
    if (simulation?.kind !== "block") throw new Error("bloc attendu");
    expect(simulation.lines).toHaveLength(16);
    expect(simulation.lines[3]).toMatchObject({ station: "sled_push", meters: 50, loadKg: 102 });
    expect(simulation.lines[15]).toMatchObject({ station: "wall_balls", reps: 100, loadKg: 4 });
    expect(hyroxContentSchema.safeParse(content).success).toBe(true);
  });
});

describe("modifications", () => {
  it("ajoute un bloc et une ligne ; un bloc vidé disparaît", () => {
    const { content, id } = addBlock(circuit());
    const { content: withLine } = addLine(content, id, "transition");
    expect(hyroxContentSchema.safeParse(withLine).success).toBe(true);
    expect(removeLine(circuit(), "l5").items).toHaveLength(2);
  });
});
