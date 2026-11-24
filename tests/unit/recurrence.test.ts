import { describe, expect, it } from "vitest";

import {
  describeRule,
  occursOnRule,
  presetOf,
  presetRule,
  recurrenceRuleSchema,
  ruleDates,
  type RecurrenceRule,
} from "@/domain/sessions/recurrence";

// Récurrence des séances comme le Calendrier d'Apple (demande d'Antonino du 24/11/2026) : chaque jour,
// chaque semaine, toutes les 2 semaines, chaque mois, chaque année, personnalisé. La date de début est
// toujours la première séance ; semaines du lundi au dimanche.
const TUESDAY = "2026-11-24";

describe("les choix du menu Récurrence", () => {
  it("chaque choix devient une règle calée sur la date de début", () => {
    expect(presetRule("daily", TUESDAY)).toEqual({ freq: "daily", interval: 1 });
    expect(presetRule("weekly", TUESDAY)).toEqual({
      freq: "weekly",
      interval: 1,
      weekdays: ["tue"],
    });
    expect(presetRule("biweekly", TUESDAY)).toEqual({
      freq: "weekly",
      interval: 2,
      weekdays: ["tue"],
    });
    expect(presetRule("monthly", TUESDAY)).toEqual({
      freq: "monthly",
      interval: 1,
      monthDays: [24],
    });
    expect(presetRule("yearly", TUESDAY)).toEqual({ freq: "yearly", interval: 1, months: [11] });
  });

  it("une règle se relit comme son choix du menu, sinon « Personnalisé »", () => {
    for (const preset of ["daily", "weekly", "biweekly", "monthly", "yearly"] as const) {
      expect(presetOf(presetRule(preset, TUESDAY), TUESDAY)).toBe(preset);
    }
    expect(presetOf({ freq: "weekly", interval: 1, weekdays: ["tue", "thu"] }, TUESDAY)).toBe(
      "custom",
    );
    expect(presetOf(null, TUESDAY)).toBe("never");
  });

  it("une règle relue de la base (clés dans un autre ordre, jours mélangés) se reconnaît aussi", () => {
    expect(presetOf({ months: [11], interval: 1, freq: "yearly" }, TUESDAY)).toBe("yearly");
    expect(presetOf({ weekdays: ["thu", "tue"], freq: "weekly", interval: 1 }, TUESDAY)).toBe(
      "custom",
    );
  });
});

describe("les dates d'une série", () => {
  it("tous les 3 jours", () => {
    expect(
      ruleDates(TUESDAY, null, { freq: "daily", interval: 3 }, "2026-11-24", "2026-12-03"),
    ).toEqual(["2026-11-24", "2026-11-27", "2026-11-30", "2026-12-03"]);
  });

  it("toutes les 2 semaines le mardi et le jeudi : la semaine du début compte", () => {
    const rule: RecurrenceRule = { freq: "weekly", interval: 2, weekdays: ["tue", "thu"] };
    expect(ruleDates(TUESDAY, null, rule, "2026-11-20", "2026-12-11")).toEqual([
      "2026-11-24",
      "2026-11-26",
      "2026-12-08",
      "2026-12-10",
    ]);
  });

  it("le début est toujours la première séance, même hors de la règle", () => {
    const rule: RecurrenceRule = { freq: "weekly", interval: 1, weekdays: ["tue"] };
    expect(ruleDates("2026-11-23", null, rule, "2026-11-23", "2026-12-01")).toEqual([
      "2026-11-23",
      "2026-11-24",
      "2026-12-01",
    ]);
  });

  it("chaque mois le 31 : rien les mois qui n'en ont pas", () => {
    const rule: RecurrenceRule = { freq: "monthly", interval: 1, monthDays: [31] };
    expect(ruleDates("2026-10-31", null, rule, "2026-10-01", "2027-03-31")).toEqual([
      "2026-10-31",
      "2026-12-31",
      "2027-01-31",
      "2027-03-31",
    ]);
  });

  it("chaque mois le dernier lundi, et tous les 2 mois le 2e mardi", () => {
    expect(
      ruleDates(
        "2026-11-30",
        null,
        { freq: "monthly", interval: 1, setPos: -1, setWeekday: "mon" },
        "2026-11-01",
        "2027-01-31",
      ),
    ).toEqual(["2026-11-30", "2026-12-28", "2027-01-25"]);
    expect(
      ruleDates(
        "2026-11-10",
        null,
        { freq: "monthly", interval: 2, setPos: 2, setWeekday: "tue" },
        "2026-11-01",
        "2027-03-31",
      ),
    ).toEqual(["2026-11-10", "2027-01-12", "2027-03-09"]);
  });

  it("chaque année le 29 février : seulement les années bissextiles", () => {
    const rule: RecurrenceRule = { freq: "yearly", interval: 1, months: [2] };
    expect(ruleDates("2028-02-29", null, rule, "2028-01-01", "2033-12-31")).toEqual([
      "2028-02-29",
      "2032-02-29",
    ]);
  });

  it("la date de fin arrête la série", () => {
    expect(
      ruleDates(TUESDAY, "2026-11-26", { freq: "daily", interval: 1 }, TUESDAY, "2026-12-31"),
    ).toEqual(["2026-11-24", "2026-11-25", "2026-11-26"]);
  });

  it("une date appartient à la série ou non", () => {
    const rule: RecurrenceRule = { freq: "weekly", interval: 2, weekdays: ["tue"] };
    expect(occursOnRule(TUESDAY, null, rule, "2026-12-08")).toBe(true);
    expect(occursOnRule(TUESDAY, null, rule, "2026-12-01")).toBe(false);
    expect(occursOnRule(TUESDAY, null, rule, "2026-11-17")).toBe(false);
    expect(occursOnRule(TUESDAY, "2026-12-01", rule, "2026-12-08")).toBe(false);
  });
});

describe("la phrase qui résume la règle", () => {
  it("comme sous la carte de la maquette", () => {
    expect(describeRule({ freq: "daily", interval: 1 }, TUESDAY, null)).toBe("Chaque jour");
    expect(describeRule({ freq: "daily", interval: 3 }, TUESDAY, null)).toBe("Tous les 3 jours");
    expect(describeRule(presetRule("weekly", TUESDAY), TUESDAY, null)).toBe(
      "Chaque semaine le mardi",
    );
    expect(
      describeRule({ freq: "weekly", interval: 2, weekdays: ["tue", "thu"] }, TUESDAY, null),
    ).toBe("Toutes les 2 semaines le mardi et le jeudi");
    expect(describeRule(presetRule("monthly", TUESDAY), TUESDAY, null)).toBe("Chaque mois le 24");
    expect(
      describeRule({ freq: "monthly", interval: 2, setPos: -1, setWeekday: "mon" }, TUESDAY, null),
    ).toBe("Tous les 2 mois le dernier lundi");
    expect(describeRule(presetRule("yearly", TUESDAY), TUESDAY, "2028-11-24")).toBe(
      "Chaque année le 24 novembre, jusqu'au 24 novembre 2028",
    );
  });
});

describe("une règle valide", () => {
  it("refuse une semaine sans jour, un intervalle nul, deux façons de choisir le jour du mois", () => {
    expect(
      recurrenceRuleSchema.safeParse({ freq: "weekly", interval: 1, weekdays: [] }).success,
    ).toBe(false);
    expect(recurrenceRuleSchema.safeParse({ freq: "daily", interval: 0 }).success).toBe(false);
    expect(
      recurrenceRuleSchema.safeParse({
        freq: "monthly",
        interval: 1,
        monthDays: [3],
        setPos: 1,
        setWeekday: "mon",
      }).success,
    ).toBe(false);
    expect(recurrenceRuleSchema.safeParse(presetRule("biweekly", TUESDAY)).success).toBe(true);
  });
});
