import { describe, expect, it } from "vitest";

import { decimalClock, maskPace } from "@/domain/training/clock-input";
import { parseClock } from "@/domain/training/hyrox-edit";
import { parseDuration } from "@/domain/training/running-edit";

// Saisie au téléphone : le pavé numérique d'iOS n'a pas de « : » (demande d'Antonino du 10/11).
describe("saisie des allures et des durées au téléphone", () => {
  it("allure : le « : » se pose tout seul pendant la frappe", () => {
    expect(["4", "45", "455"].map(maskPace)).toEqual(["4", "45", "4:55"]);
    expect(maskPace("1045")).toBe("10:45");
    expect(maskPace("210")).toBe("2:10");
    expect(maskPace("4,55")).toBe("4:55");
    expect(maskPace("4.55")).toBe("4:55");
    // Un « : » déjà là reste : on peut effacer et corriger.
    expect(maskPace("4:5")).toBe("4:5");
    expect(maskPace("")).toBe("");
  });

  it("durée au pavé décimal : la virgule sert de « : », un nombre seul reste des minutes", () => {
    expect(decimalClock("2,30")).toBe("2:30");
    expect(decimalClock("1,5")).toBe("1:30");
    expect(decimalClock("45")).toBe("45");
    expect(parseDuration("2,30")).toBe(150);
    expect(parseDuration("1,5")).toBe(90);
    expect(parseDuration("45")).toBe(2700);
    expect(parseClock("5,05")).toBe(305);
    expect(parseClock("90")).toBe(5400);
  });
});
