import { describe, expect, it } from "vitest";

import { formatPace } from "@/domain/training/pace";
import {
  paceAtPercent,
  parseDuration,
  proposePaces,
  vmaFrom5k,
  vmaFromCooper,
} from "@/domain/training/vma";

describe("vmaFromCooper (VMA ≈ distance / 200)", () => {
  it("3000 m en 12 min donne 15 km/h", () => {
    expect(vmaFromCooper(3000)).toEqual({ ok: true, vmaKmh: 15 });
    expect(vmaFromCooper(2650)).toEqual({ ok: true, vmaKmh: 13.3 });
  });

  it("refuse les distances impossibles ou non entières", () => {
    for (const bad of [500, 6000, 2800.5, Number.NaN]) {
      expect(vmaFromCooper(bad).ok).toBe(false);
    }
  });
});

describe("vmaFrom5k (VMA ≈ vitesse 5 km / 95 %)", () => {
  it("5 km en 20:00 (15 km/h) donne une VMA de 15,8 km/h", () => {
    expect(vmaFrom5k(20 * 60)).toEqual({ ok: true, vmaKmh: 15.8 });
  });

  it("l'allure 5 km proposée retombe sur l'allure réellement courue (cohérence)", () => {
    const result = vmaFrom5k(22 * 60 + 30);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const fiveK = proposePaces(result.vmaKmh).find((p) => p.kind === "pace_5k");
    // 22:30 / 5 = 4:30/km ; arrondi de la VMA au dixième -> écart d'une seconde au plus.
    expect(Math.abs((fiveK?.minSecPerKm ?? 0) - 270)).toBeLessThanOrEqual(1);
  });

  it("refuse un temps hors limites", () => {
    expect(vmaFrom5k(10 * 60).ok).toBe(false);
    expect(vmaFrom5k(75 * 60).ok).toBe(false);
  });
});

describe("parseDuration", () => {
  it("lit mm:ss et h:mm:ss", () => {
    expect(parseDuration("22:30")).toBe(1350);
    expect(parseDuration(" 1:02:30 ")).toBe(3750);
  });

  it("refuse les formats ambigus ou invalides", () => {
    for (const bad of ["22:3", "22", "abc", "1:75:00", ""]) {
      expect(parseDuration(bad)).toBeNull();
    }
  });
});

describe("proposePaces (table par défaut)", () => {
  it("calcule les allures d'une VMA de 15 km/h", () => {
    const paces = Object.fromEntries(
      proposePaces(15).map((p) => [
        p.kind,
        p.minSecPerKm === p.maxSecPerKm
          ? formatPace(p.minSecPerKm)
          : `${formatPace(p.minSecPerKm)}–${formatPace(p.maxSecPerKm)}`,
      ]),
    );
    expect(paces).toEqual({
      pace_easy: "5:20–6:09", // 75 % = 11,25 km/h ; 65 % = 9,75 km/h
      pace_marathon: "5:00", // 80 % = 12 km/h
      pace_half: "4:42", // 85 %
      pace_threshold: "4:42", // 85 %
      pace_10k: "4:27", // 90 %
      pace_5k: "4:13", // 95 %
    });
  });

  it("paceAtPercent : 100 % de 15 km/h = 4:00/km", () => {
    expect(paceAtPercent(15, 100)).toBe(240);
  });
});
