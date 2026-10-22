import { describe, expect, it } from "vitest";

import {
  busyHours,
  formatHours,
  lastSessionFor,
  layoutWeek,
  mondayOf,
  nextSessionFor,
  parseWeek,
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
  it("part du lundi, depuis l'adresse ou aujourd'hui", () => {
    expect(mondayOf("2026-10-22")).toBe("2026-10-19");
    expect(mondayOf("2026-10-19")).toBe("2026-10-19");
    expect(mondayOf("2026-10-25")).toBe("2026-10-19");
    expect(parseWeek("2026-11-04", "2026-10-22")).toBe("2026-11-02");
    expect(parseWeek("pas une date", "2026-10-22")).toBe("2026-10-19");
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
    // 20:30 dépasse 20:00 : la grille va jusqu'à 21:00.
    expect([week.firstHour, week.lastHour]).toEqual([8, 21]);
  });
});

describe("résumés", () => {
  it("compte les séances par jour et les heures occupées", () => {
    expect(weekCounts([piste, force], "2026-10-19")).toEqual([0, 0, 2, 0, 0, 0, 0]);
    expect([...busyHours([piste, force], "2026-10-21")].sort()).toEqual([18, 19, 20]);
    expect(formatHours(150)).toBe("2 h 30");
    expect(formatHours(45)).toBe("45 min");
  });

  it("trouve la prochaine et la dernière séance d'un sportif", () => {
    expect(nextSessionFor("t", [piste, force], "2026-10-21", "20:00")).toEqual({
      date: "2026-10-28",
      time: "19:00",
    });
    expect(nextSessionFor("n", [piste, force], "2026-10-21", "08:00")).toEqual({
      date: "2026-10-21",
      time: "18:30",
    });
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
