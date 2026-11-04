import { describe, expect, it } from "vitest";

import type { ReferenceEntry } from "@/features/references/queries";
import { buildReferenceSeries, niceTicks, referenceTone } from "@/features/references/series";

let counter = 0;
function entry(values: Partial<ReferenceEntry> & Pick<ReferenceEntry, "kind" | "measuredOn">) {
  counter += 1;
  return {
    id: `id-${counter}`,
    paceMin: null,
    paceMax: null,
    bpm: null,
    exercise: null,
    loadKg: null,
    reps: null,
    source: "test",
    note: null,
    ...values,
  } satisfies ReferenceEntry;
}

describe("buildReferenceSeries", () => {
  // Historique tel que le renvoie listReferences : du plus récent au plus ancien.
  const history: ReferenceEntry[] = [
    entry({
      kind: "strength_load",
      exercise: "Squat",
      loadKg: 110,
      reps: 1,
      measuredOn: "2026-09-27",
    }),
    entry({ kind: "pace_vma", paceMin: 248, paceMax: 248, measuredOn: "2026-10-06" }),
    entry({ kind: "pace_5k", paceMin: 261, paceMax: 261, measuredOn: "2026-10-06" }),
    entry({ kind: "pace_vma", paceMin: 257, paceMax: 257, measuredOn: "2026-07-10" }),
    entry({
      kind: "strength_load",
      exercise: "squat ",
      loadKg: 100,
      reps: 3,
      measuredOn: "2026-06-20",
    }),
    entry({ kind: "pace_5k", paceMin: 270, paceMax: 270, measuredOn: "2026-06-15" }),
    entry({ kind: "pace_vma", paceMin: 265, paceMax: 265, measuredOn: "2026-04-14" }),
  ];
  const series = buildReferenceSeries(history);

  it("fait une série par repère (par exercice pour les charges), dans l'ordre des types", () => {
    expect(series.map((s) => s.key)).toEqual(["pace_vma", "pace_5k", "strength_load:squat"]);
    expect(series[2].title).toBe("Squat");
  });

  it("range les points du plus ancien au plus récent, avec la VMA en km/h", () => {
    const vma = series[0];
    expect(vma.unit).toBe("km/h");
    expect(vma.inverted).toBe(false);
    expect(vma.points.map((p) => p.value)).toEqual([13.6, 14, 14.5]);
    expect(vma.points[0].dateLabel).toBe("14 avril 2026");
    expect(vma.points[2].day - vma.points[1].day).toBe(88);
  });

  it("inverse aussi l'axe de la FC de repos (plus basse = mieux), pas celui de la FC max", () => {
    const hr = buildReferenceSeries([
      entry({ kind: "hr_rest", bpm: 52, measuredOn: "2026-10-30" }),
      entry({ kind: "hr_max", bpm: 189, measuredOn: "2026-09-01" }),
      entry({ kind: "hr_rest", bpm: 58, measuredOn: "2026-05-05" }),
    ]);
    const rest = hr.find((item) => item.kind === "hr_rest")!;
    expect(rest.inverted).toBe(true);
    expect(rest.progress).toBe("6 bpm de moins depuis le 5 mai 2026");
    expect(hr.find((item) => item.kind === "hr_max")!.inverted).toBe(false);
  });

  it("inverse l'axe des allures et décrit le progrès en mots", () => {
    const fiveK = series[1];
    expect(fiveK.inverted).toBe(true);
    expect(fiveK.progress).toBe("9 s/km plus rapide depuis le 15 juin 2026");
    expect(series[0].progress).toBe("0,9 km/h de plus depuis le 14 avril 2026");
    expect(series[2].progress).toBe("10 kg de plus depuis le 20 juin 2026");
  });

  it("ne garde que la mesure la plus récente quand deux tombent le même jour", () => {
    const sameDay = buildReferenceSeries([
      entry({ kind: "hr_max", bpm: 192, measuredOn: "2026-10-06" }),
      entry({ kind: "hr_max", bpm: 188, measuredOn: "2026-10-06" }),
    ]);
    expect(sameDay[0].points.map((p) => p.value)).toEqual([192]);
    expect(sameDay[0].progress).toBeNull();
  });

  it("utilise le milieu d'une plage d'allure et garde la plage pour l'affichage", () => {
    const [race] = buildReferenceSeries([
      entry({ kind: "pace_race", paceMin: 290, paceMax: 305, measuredOn: "2026-10-01" }),
    ]);
    expect(race.tone).toBe("hyrox");
    expect(race.points[0].value).toBe(297.5);
    expect(race.points[0].valueLabel).toBe("4:50–5:05 min/km");
  });
});

describe("niceTicks", () => {
  it("couvre les valeurs avec des pas ronds", () => {
    expect(niceTicks(13.6, 14.5, "km/h")).toEqual([13.5, 13.75, 14, 14.25, 14.5]);
    expect(niceTicks(100, 110, "kg")).toEqual([100, 102.5, 105, 107.5, 110]);
  });

  it("gradue une allure en secondes rondes", () => {
    expect(niceTicks(261, 270, "min/km")).toEqual([260, 265, 270]);
  });

  it("ouvre une marge quand toutes les valeurs sont égales", () => {
    const ticks = niceTicks(192, 192, "bpm");
    expect(ticks[0]).toBeLessThan(192);
    expect(ticks[ticks.length - 1]).toBeGreaterThan(192);
  });
});

describe("referenceTone", () => {
  it("donne sa couleur à chaque famille de repères", () => {
    expect(referenceTone("pace_easy")).toBe("run");
    expect(referenceTone("pace_race")).toBe("hyrox");
    expect(referenceTone("hr_rest")).toBe("heart");
    expect(referenceTone("strength_load")).toBe("strength");
  });
});
