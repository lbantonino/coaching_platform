import { describe, expect, it } from "vitest";

import { parseTestForm } from "@/features/references/test-form";

const TODAY = "2026-10-20";
const all = ["pace_easy", "pace_marathon", "pace_half", "pace_threshold", "pace_10k", "pace_5k"];

describe("parseTestForm", () => {
  it("Cooper 3000 m : enregistre la VMA et les zones cochées, source « test », note explicative", () => {
    const result = parseTestForm(
      {
        test: "cooper",
        distance: "3000",
        time: "",
        measuredOn: "2026-10-18",
        zones: ["pace_easy", "pace_5k"],
      },
      TODAY,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.vmaKmh).toBe(15);
    expect(result.rows.map((r) => r.kind)).toEqual(["pace_vma", "pace_easy", "pace_5k"]);
    expect(result.rows[0]).toMatchObject({
      pace_min_sec_per_km: 240,
      source: "test",
      measured_on: "2026-10-18",
    });
    expect(result.rows[1]).toMatchObject({ pace_min_sec_per_km: 320, pace_max_sec_per_km: 369 });
    expect(result.rows[1].coach_note).toContain("Test de Cooper : 3000 m en 12 min");
    expect(result.rows[1].coach_note).toContain("65–75 % VMA");
  });

  it("5 km en 22:30 : VMA estimée et toutes les zones", () => {
    const result = parseTestForm(
      { test: "5k", distance: "", time: "22:30", measuredOn: TODAY, zones: all },
      TODAY,
    );
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.rows).toHaveLength(7);
  });

  it("refuse un test inconnu, une zone inconnue, une date future ou un résultat invalide", () => {
    const base = {
      test: "cooper",
      distance: "3000",
      time: "",
      measuredOn: TODAY,
      zones: [] as string[],
    };
    expect(parseTestForm({ ...base, test: "vo2" }, TODAY).ok).toBe(false);
    expect(parseTestForm({ ...base, zones: ["pace_race"] }, TODAY).ok).toBe(false);
    expect(parseTestForm({ ...base, measuredOn: "2026-10-21" }, TODAY).ok).toBe(false);
    expect(parseTestForm({ ...base, distance: "9000" }, TODAY).ok).toBe(false);
    expect(parseTestForm({ ...base, test: "5k", time: "22:3" }, TODAY).ok).toBe(false);
  });

  it("aucune zone cochée : seule la VMA est enregistrée", () => {
    const result = parseTestForm(
      { test: "cooper", distance: "2800", time: "", measuredOn: TODAY, zones: [] },
      TODAY,
    );
    expect(result.ok && result.rows.map((r) => r.kind)).toEqual(["pace_vma"]);
  });
});
