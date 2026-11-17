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
  replaceLine,
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
    expect(lineDetail(block.lines[0]!)).toBe("600 m · 5:45 /km");
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

describe("TC-12 : simulation Hyrox « Officielles » pour Open Femme", () => {
  const simulation = () => {
    const { content, id } = insertSimulation(circuit(), "official", "women_open", "female");
    const block = content.items.find((item) => item.id === id) ?? content.items.at(-1);
    if (block?.kind !== "block") throw new Error("bloc attendu");
    return { content, block };
  };
  it("les 8 stations dans l'ordre officiel, un run avant chacune, les charges Open Femme", () => {
    const { block } = simulation();
    expect(block.lines).toHaveLength(16);
    expect(block.lines.every((line, i) => (i % 2 === 0) === (line.kind === "run"))).toBe(true);
    const stations = block.lines.filter((line) => line.kind !== "run");
    expect(
      stations.map((line) =>
        "station" in line ? line.station : line.kind === "erg" ? line.machine : null,
      ),
    ).toEqual([
      "skierg",
      "sled_push",
      "sled_pull",
      "burpee_broad_jumps",
      "rowing",
      "farmers_carry",
      "sandbag_lunges",
      "wall_balls",
    ]);
    const loads = Object.fromEntries(
      stations.flatMap((line) =>
        line.kind === "station" && line.loadKg !== undefined ? [[line.station, line.loadKg]] : [],
      ),
    );
    expect(loads).toEqual({
      sled_push: 102,
      sled_pull: 78,
      farmers_carry: 16,
      sandbag_lunges: 10,
      wall_balls: 4,
    });
  });
  it("corriger une ligne ne change qu'elle, et le temps cible du bloc est recalculé", () => {
    const { content, block } = simulation();
    const sled = block.lines.find(
      (line) => line.kind === "station" && line.station === "sled_push",
    );
    if (sled?.kind !== "station") throw new Error("sled push attendu");
    const before = blockMeta(block);
    const changed = replaceLine(content, {
      ...sled,
      loadKg: 90,
      loadSource: "coach",
      targetSec: 240,
    });
    const after = changed.items.find((item) => item.id === block.id);
    if (after?.kind !== "block") throw new Error("bloc attendu");
    after.lines.forEach((line, i) => {
      if (line.id === sled.id) expect(line).toMatchObject({ loadKg: 90, loadSource: "coach" });
      else expect(line).toEqual(block.lines[i]);
    });
    expect(blockMeta(after)).not.toBe(before);
    expect(hyroxContentSchema.safeParse(changed).success).toBe(true);
  });
});
