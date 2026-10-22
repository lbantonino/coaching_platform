import { describe, expect, it } from "vitest";

import {
  dayLabel,
  groupByDay,
  monthGrid,
  monthLabel,
  parseMonth,
  shiftMonth,
  shortMonth,
} from "@/features/agenda/calendar";

describe("parseMonth", () => {
  it("lit le mois de l'URL, sinon le mois d'aujourd'hui", () => {
    expect(parseMonth("2027-03", "2026-10-22")).toBe("2027-03");
    expect(parseMonth(undefined, "2026-10-22")).toBe("2026-10");
    expect(parseMonth("2026-13", "2026-10-22")).toBe("2026-10");
    expect(parseMonth("n'importe quoi", "2026-10-22")).toBe("2026-10");
  });
});

describe("shiftMonth et monthLabel", () => {
  it("passe d'une année à l'autre et écrit le mois en français", () => {
    expect(shiftMonth("2026-12", 1)).toBe("2027-01");
    expect(shiftMonth("2027-01", -1)).toBe("2026-12");
    expect(monthLabel("2026-10")).toBe("octobre 2026");
    expect(dayLabel("2026-12-12")).toBe("samedi 12 décembre");
    expect(shortMonth("2026-12-12")).toBe("déc.");
  });
});

describe("monthGrid", () => {
  it("commence un lundi et couvre tout le mois", () => {
    // Octobre 2026 commence un jeudi et finit un samedi.
    const weeks = monthGrid("2026-10");
    expect(weeks).toHaveLength(5);
    expect(weeks[0][0]).toEqual({ iso: "2026-09-28", day: 28, inMonth: false });
    expect(weeks[0][3]).toEqual({ iso: "2026-10-01", day: 1, inMonth: true });
    expect(weeks[4][5]).toEqual({ iso: "2026-10-31", day: 31, inMonth: true });
    expect(weeks.every((week) => week.length === 7)).toBe(true);
  });

  it("ne crée pas de semaine vide quand le mois finit un dimanche", () => {
    // Février 2027 : du lundi 1er au dimanche 28, exactement quatre semaines.
    const weeks = monthGrid("2027-02");
    expect(weeks).toHaveLength(4);
    expect(weeks[3][6].iso).toBe("2027-02-28");
  });

  it("ne décale pas les jours au changement d'heure (fin octobre)", () => {
    const days = monthGrid("2026-10")
      .flat()
      .map((d) => d.iso);
    expect(days).toContain("2026-10-25");
    expect(days).toContain("2026-10-26");
    expect(new Set(days).size).toBe(days.length);
  });
});

describe("groupByDay", () => {
  it("regroupe et trie par date", () => {
    const groups = groupByDay([
      { id: "b", date: "2026-12-20" },
      { id: "a", date: "2026-12-12" },
      { id: "c", date: "2026-12-20" },
    ]);
    expect([...groups.keys()]).toEqual(["2026-12-12", "2026-12-20"]);
    expect(groups.get("2026-12-20")?.map((item) => item.id)).toEqual(["b", "c"]);
  });
});
