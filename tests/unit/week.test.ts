import { describe, expect, it } from "vitest";

import {
  formatHours,
  formatHoursShort,
  isoWeek,
  lastSessionFor,
  layoutWeek,
  mondayOf,
  withHours,
  weekCounts,
  type WeekSession,
} from "@/features/agenda/week";

const NADIA = { id: "n", name: "Nadia El Amrani" };
const THOMAS = { id: "t", name: "Thomas Peeters" };
const base = { repeatsWeekly: true, endsOn: null, discipline: null } as const;

const piste: WeekSession = {
  ...base,
  id: "piste",
  kind: "group",
  title: "Piste du mercredi",
  discipline: "running",
  startsOn: "2026-09-02",
  startTime: "19:00",
  durationMinutes: 90,
  athletes: [NADIA, THOMAS],
};
const force: WeekSession = {
  ...base,
  id: "force",
  kind: "individual",
  title: "Coaching force",
  discipline: "strength",
  startsOn: "2026-10-21",
  repeatsWeekly: false,
  startTime: "18:30",
  durationMinutes: 60,
  athletes: [NADIA],
};

describe("semaine affichée", () => {
  it("part du lundi", () => {
    expect(mondayOf("2026-10-22")).toBe("2026-10-19");
    expect(mondayOf("2026-10-19")).toBe("2026-10-19");
    expect(mondayOf("2026-10-25")).toBe("2026-10-19");
  });
});

describe("layoutWeek", () => {
  it("place les séances par jour, compte les heures et met côte à côte celles qui se chevauchent", () => {
    const week = layoutWeek([piste, force], "2026-10-19");
    const wednesday = week.days[2];
    expect(wednesday.date).toBe("2026-10-21");
    expect(wednesday.blocks.map((b) => [b.title, b.label, b.lane, b.lanes])).toEqual([
      ["Nadia El Amrani", "18:30 - 19:30", 0, 2],
      ["Piste du mercredi", "19:00 - 20:30", 1, 2],
    ]);
    expect(wednesday.blocks[1].subtitle).toBe("2 inscrits");
    expect(wednesday.minutes).toBe(150);
    expect(week.totalMinutes).toBe(150);
    // Toute la journée est visible par défaut : 06:00 - 22:00 (prompt Claude Design §6).
    expect([week.firstHour, week.lastHour]).toEqual([6, 22]);
  });
});

describe("plage horaire, heures courtes et numéro de semaine", () => {
  it("élargit la grille pour ne couper aucune séance", () => {
    const late = { ...piste, id: "late", startTime: "21:30", durationMinutes: 75 };
    expect(layoutWeek([late], "2026-10-19").lastHour).toBe(23);
  });

  it("écrit les heures d'un jour en décimal", () => {
    expect(formatHoursShort(150)).toBe("2,5 h");
    expect(formatHoursShort(225)).toBe("3,75 h");
    expect(formatHoursShort(0)).toBe("");
  });

  it("donne le numéro de semaine ISO", () => {
    expect(isoWeek("2026-10-23")).toBe(43);
    expect(isoWeek("2026-01-01")).toBe(1);
    expect(isoWeek("2027-01-01")).toBe(53);
  });
});

describe("résumés", () => {
  it("compte les séances par jour et met les durées en mots", () => {
    expect(weekCounts([piste, force], "2026-10-19")).toEqual([0, 0, 2, 0, 0, 0, 0]);
    expect(formatHours(150)).toBe("2 h 30");
    expect(formatHours(45)).toBe("45 min");
  });

  it("trouve la dernière séance d'un sportif", () => {
    expect(lastSessionFor("n", [piste, force], "2026-10-22", "09:00")).toEqual({
      date: "2026-10-21",
      time: "19:00",
    });
    expect(lastSessionFor("x", [piste], "2026-10-22", "09:00")).toBeNull();
  });
});

describe("layoutDays et parseDay", () => {
  it("met en page une seule journée et lit la date de l'adresse", async () => {
    const { layoutDays, parseDay } = await import("@/features/agenda/week");
    const day = layoutDays([piste, force], ["2026-10-21"]);
    expect(day.days).toHaveLength(1);
    expect(day.days[0].blocks.map((b) => b.title)).toEqual([
      "Nadia El Amrani",
      "Piste du mercredi",
    ]);
    expect(parseDay("2026-12-24", "2026-10-23")).toBe("2026-12-24");
    expect(parseDay("n'importe quoi", "2026-10-23")).toBe("2026-10-23");
  });
});

describe("heures affichées (Paramètres, D-57)", () => {
  it("garde la plage choisie, élargie par une séance hors plage", () => {
    // Piste du mercredi : 19:00 – 20:30.
    const layout = layoutWeek([piste], "2026-09-28");
    expect(withHours(layout, 7, 21)).toMatchObject({ firstHour: 7, lastHour: 21 });
    expect(withHours(layout, 8, 18)).toMatchObject({ firstHour: 8, lastHour: 21 });
    expect(withHours(layoutWeek([], "2026-09-28"), 9, 20)).toMatchObject({
      firstHour: 9,
      lastHour: 20,
    });
  });
});
