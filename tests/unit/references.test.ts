import { describe, expect, it } from "vitest";

import { formatDate } from "@/lib/format";
import {
  formatReferenceDetail,
  formatReferenceValue,
  splitReferenceValue,
} from "@/features/references/format";
import { parseReferenceForm, type ReferenceFormInput } from "@/features/references/schemas";

const TODAY = "2026-10-20";
const empty: ReferenceFormInput = {
  kind: "",
  pace: "",
  bpm: "",
  exercise: "",
  loadKg: "",
  reps: "",
  source: "test",
  measuredOn: "2026-10-15",
  note: "",
};

describe("parseReferenceForm", () => {
  it("enregistre une allure en plage et ignore les champs des autres types", () => {
    const result = parseReferenceForm(
      { ...empty, kind: "pace_easy", pace: "6:40–7:15", bpm: "180" },
      TODAY,
    );
    expect(result).toEqual({
      ok: true,
      values: expect.objectContaining({
        kind: "pace_easy",
        pace_min_sec_per_km: 400,
        pace_max_sec_per_km: 435,
        bpm: null,
        coach_note: null,
      }),
    });
  });

  it("refuse une allure ambiguë avec le message du domaine", () => {
    const result = parseReferenceForm({ ...empty, kind: "pace_5k", pace: "4:5" }, TODAY);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("4:05 ou 4:50");
  });

  it("valide la fréquence cardiaque", () => {
    expect(parseReferenceForm({ ...empty, kind: "hr_max", bpm: "192" }, TODAY).ok).toBe(true);
    expect(parseReferenceForm({ ...empty, kind: "hr_max", bpm: "300" }, TODAY).ok).toBe(false);
    expect(parseReferenceForm({ ...empty, kind: "hr_rest", bpm: "52.5" }, TODAY).ok).toBe(false);
  });

  it("valide une charge, accepte la virgule décimale et des répétitions facultatives", () => {
    const result = parseReferenceForm(
      { ...empty, kind: "strength_load", exercise: " Squat ", loadKg: "102,5", reps: "" },
      TODAY,
    );
    expect(result).toEqual({
      ok: true,
      values: expect.objectContaining({ exercise_label: "Squat", load_kg: 102.5, reps: null }),
    });
    expect(
      parseReferenceForm({ ...empty, kind: "strength_load", exercise: "", loadKg: "100" }, TODAY)
        .ok,
    ).toBe(false);
  });

  it("refuse une date future, une date absente, une source ou un type inconnus", () => {
    expect(
      parseReferenceForm({ ...empty, kind: "hr_max", bpm: "190", measuredOn: "2026-10-21" }, TODAY)
        .ok,
    ).toBe(false);
    expect(
      parseReferenceForm({ ...empty, kind: "hr_max", bpm: "190", measuredOn: "" }, TODAY).ok,
    ).toBe(false);
    expect(
      parseReferenceForm({ ...empty, kind: "hr_max", bpm: "190", source: "devine" }, TODAY).ok,
    ).toBe(false);
    expect(parseReferenceForm({ ...empty, kind: "vo2max", bpm: "190" }, TODAY).ok).toBe(false);
  });
});

describe("affichage des repères", () => {
  const base = {
    paceMin: null,
    paceMax: null,
    bpm: null,
    exercise: null,
    loadKg: null,
    reps: null,
  };

  it("affiche une allure, sa plage et la vitesse dérivée", () => {
    expect(formatReferenceValue({ ...base, kind: "pace_5k", paceMin: 295, paceMax: 295 })).toBe(
      "4:55 min/km",
    );
    expect(formatReferenceValue({ ...base, kind: "pace_easy", paceMin: 400, paceMax: 435 })).toBe(
      "6:40–7:15 min/km",
    );
    expect(formatReferenceDetail({ ...base, kind: "pace_5k", paceMin: 300, paceMax: 300 })).toBe(
      "≈ 12 km/h",
    );
  });

  it("affiche une FC et une charge", () => {
    expect(formatReferenceValue({ ...base, kind: "hr_max", bpm: 192 })).toBe("192 bpm");
    expect(
      formatReferenceValue({
        ...base,
        kind: "strength_load",
        exercise: "Squat",
        loadKg: 102.5,
        reps: 5,
      }),
    ).toBe("102,5 kg × 5");
  });

  // Vue d'ensemble de la fiche (maquette du 03/11/2026) : grand chiffre et unité séparés.
  it("sépare la valeur de son unité", () => {
    expect(splitReferenceValue({ ...base, kind: "pace_race", paceMin: 290, paceMax: 305 })).toEqual(
      {
        value: "4:50–5:05",
        unit: "min/km",
      },
    );
    expect(
      splitReferenceValue({
        ...base,
        kind: "strength_load",
        exercise: "Wall ball",
        loadKg: 6,
        reps: 25,
      }),
    ).toEqual({ value: "6 kg × 25", unit: "reps" });
    expect(splitReferenceValue({ ...base, kind: "hr_rest", bpm: 52 })).toEqual({
      value: "52",
      unit: "bpm",
    });
    expect(splitReferenceValue({ ...base, kind: "strength_load", loadKg: 80 })).toEqual({
      value: "80 kg",
      unit: "",
    });
  });

  it("formate une date SQL sans décalage de fuseau", () => {
    expect(formatDate("2026-10-15")).toBe("15 octobre 2026");
  });
});
