import { describe, expect, it } from "vitest";

import {
  formatPace,
  formatPaceRange,
  paceToSpeedKmh,
  parsePace,
  parsePaceRange,
} from "@/domain/training/pace";

describe("parsePace / formatPace (RUN-01)", () => {
  it("fait l'aller-retour 4:55 min/km <-> 295 s/km", () => {
    expect(parsePace("4:55")).toEqual({ ok: true, secPerKm: 295 });
    expect(formatPace(295)).toBe("4:55");
  });

  it("accepte l'unité écrite et les espaces", () => {
    expect(parsePace(" 5:00 min/km ")).toEqual({ ok: true, secPerKm: 300 });
    expect(parsePace("6:15/km")).toEqual({ ok: true, secPerKm: 375 });
  });

  // Règle du 16/11 (recette du 19/11) : une allure s'écrit « 15:00 /km », aussi dans un message.
  it("écrit les bornes d'une allure hors limites comme une allure (« /km »)", () => {
    const result = parsePace("1:30");
    expect(result).toEqual({
      ok: false,
      error: "Allure hors limites : elle doit être comprise entre 2:00 et 15:00 /km.",
    });
  });

  it("refuse une saisie ambiguë au lieu de deviner", () => {
    const result = parsePace("4:5");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("4:05 ou 4:50");
  });

  it("refuse les formats invalides et les allures hors limites", () => {
    for (const bad of ["", "455", "4:60", "abc", "-4:30"]) {
      expect(parsePace(bad).ok).toBe(false);
    }
    expect(parsePace("1:30").ok).toBe(false);
    expect(parsePace("16:00").ok).toBe(false);
  });

  it("formate avec les secondes sur deux chiffres", () => {
    expect(formatPace(245)).toBe("4:05");
    expect(formatPace(600)).toBe("10:00");
  });
});

describe("parsePaceRange", () => {
  it("lit la plage des PDF de référence 6:40–7:15", () => {
    expect(parsePaceRange("6:40–7:15")).toEqual({ ok: true, minSecPerKm: 400, maxSecPerKm: 435 });
    expect(parsePaceRange("6:40 - 7:15")).toEqual({ ok: true, minSecPerKm: 400, maxSecPerKm: 435 });
  });

  it("remet une plage inversée dans l'ordre", () => {
    expect(parsePaceRange("7:15-6:40")).toEqual({ ok: true, minSecPerKm: 400, maxSecPerKm: 435 });
  });

  it("accepte une allure seule comme plage de largeur nulle", () => {
    expect(parsePaceRange("5:00")).toEqual({ ok: true, minSecPerKm: 300, maxSecPerKm: 300 });
  });

  it("propage l'erreur d'une borne invalide", () => {
    expect(parsePaceRange("6:40-7:5").ok).toBe(false);
    expect(parsePaceRange("5:00-6:00-7:00").ok).toBe(false);
  });

  it("formate une plage ou une valeur seule", () => {
    expect(formatPaceRange(400, 435)).toBe("6:40–7:15");
    expect(formatPaceRange(300, 300)).toBe("5:00");
  });
});

describe("paceToSpeedKmh", () => {
  it("applique vitesse = 3600 / allure, au dixième", () => {
    expect(paceToSpeedKmh(300)).toBe(12);
    expect(paceToSpeedKmh(295)).toBe(12.2);
  });
});
