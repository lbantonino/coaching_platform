import { describe, expect, it } from "vitest";

import {
  DEFAULT_HR_ZONES,
  hrZoneRange,
  kgFromPercent,
  oneRepMax,
  paceRangeFromVma,
  roundToHalfKg,
} from "@/domain/training/aims";

describe("paceRangeFromVma (allure depuis un % de VMA)", () => {
  it("donne l'allure de la maquette : 16 km/h à 95 % ≈ 3:57 min/km", () => {
    expect(paceRangeFromVma(16, 95, 95)).toEqual({ fromSecPerKm: 237, toSecPerKm: 237 });
  });
  it("met l'allure la plus rapide en premier, quel que soit l'ordre des %", () => {
    const range = paceRangeFromVma(16, 80, 90);
    expect(range.fromSecPerKm).toBeLessThan(range.toSecPerKm);
    expect(paceRangeFromVma(16, 90, 80)).toEqual(range);
  });
});

describe("hrZoneRange (zones de FC, table par défaut OPEN-21)", () => {
  it("retombe sur les exemples des maquettes pour une FC max de 192", () => {
    expect(hrZoneRange(192, 4)).toEqual({ bpmFrom: 161, bpmTo: 175 });
    expect(hrZoneRange(192, 2)).toEqual({ bpmFrom: 129, bpmTo: 142 });
  });
  it("a cinq zones contiguës, de 57 à 100 %", () => {
    expect(DEFAULT_HR_ZONES.map((zone) => zone.zone)).toEqual([1, 2, 3, 4, 5]);
    DEFAULT_HR_ZONES.slice(1).forEach((zone, i) => {
      expect(zone.fromPercent).toBe((DEFAULT_HR_ZONES[i]?.toPercent ?? 0) + 1);
    });
    expect(DEFAULT_HR_ZONES[4]?.toPercent).toBe(100);
  });
  it("refuse une zone inconnue ou une FC max absurde", () => {
    expect(hrZoneRange(192, 6)).toBeNull();
    expect(hrZoneRange(0, 2)).toBeNull();
  });
});

describe("oneRepMax (max d'un exercice, OPEN-22 : Epley)", () => {
  it("un repère à 1 répétition (ou sans nombre) est le max lui-même", () => {
    expect(oneRepMax(100, 1)).toEqual({ kg: 100, estimated: false, fromKg: 100, fromReps: 1 });
    expect(oneRepMax(100, null)?.estimated).toBe(false);
  });
  it("estime le max d'un repère à plusieurs répétitions : 80 kg × 5 ≈ 93,3 kg", () => {
    expect(oneRepMax(80, 5)).toEqual({ kg: 93.3, estimated: true, fromKg: 80, fromReps: 5 });
  });
  it("refuse une charge ou un nombre de répétitions absurde", () => {
    expect(oneRepMax(0, 5)).toBeNull();
    expect(oneRepMax(80, 0)).toBeNull();
  });
});

describe("kgFromPercent (kg depuis un % du max, arrondi au 0,5 kg)", () => {
  it("calcule l'exemple du brief : 70 % de 80 kg = 56 kg", () => {
    expect(kgFromPercent(80, 70)).toBe(56);
  });
  it("arrondit au 0,5 kg le plus proche", () => {
    expect(kgFromPercent(93.3, 70)).toBe(65.5);
    expect(roundToHalfKg(14.2)).toBe(14);
    expect(roundToHalfKg(14.3)).toBe(14.5);
  });
});
