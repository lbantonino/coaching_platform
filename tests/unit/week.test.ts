import { describe, expect, it } from "vitest";

import { layoutDays, mondayOf, withHours, type WeekSession } from "@/features/agenda/week";

// Les 7 jours d'une semaine (AAAA-MM-JJ), du lundi au dimanche.
const weekOf = (monday: string) =>
  Array.from({ length: 7 }, (_, i) =>
    new Date(Date.parse(`${monday}T00:00:00Z`) + i * 86_400_000).toISOString().slice(0, 10),
  );

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

describe("layoutDays sur une semaine", () => {
  it("place les séances par jour, compte les heures et met côte à côte celles qui se chevauchent", () => {
    const week = layoutDays([piste, force], weekOf("2026-10-19"));
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
    expect(layoutDays([late], weekOf("2026-10-19")).lastHour).toBe(23);
  });
});

describe("layoutDays et parseDay", () => {
  it("met en page une seule journée et lit la date de l'adresse", async () => {
    const { parseDay } = await import("@/features/agenda/week");
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
    const layout = layoutDays([piste], weekOf("2026-09-28"));
    expect(withHours(layout, 7, 21)).toMatchObject({ firstHour: 7, lastHour: 21 });
    expect(withHours(layout, 8, 18)).toMatchObject({ firstHour: 8, lastHour: 21 });
    expect(withHours(layoutDays([], weekOf("2026-09-28")), 9, 20)).toMatchObject({
      firstHour: 9,
      lastHour: 20,
    });
  });
});

// Séance « Jour entier » (D-204) : à part, dans la rangée du haut de la grille ; elle ne compte pas
// dans les heures de coaching ni dans la plage horaire affichée.
describe("séance « Jour entier »", () => {
  const stage: WeekSession = {
    ...base,
    id: "stage",
    kind: "group",
    title: "Stage Hyrox",
    discipline: "hyrox",
    startsOn: "2026-10-24",
    repeatsWeekly: false,
    startTime: "00:00",
    durationMinutes: 60,
    allDay: true,
    athletes: [THOMAS],
  };

  it("est en tête de sa journée, sans heure, et ne compte pas dans les heures", () => {
    const layout = layoutDays([stage, force], weekOf("2026-10-19"));
    const saturday = layout.days[5];
    expect(saturday.blocks.map((block) => [block.title, block.allDay, block.label])).toEqual([
      ["Stage Hyrox", true, "Toute la journée"],
    ]);
    expect(saturday.minutes).toBe(0);
    expect(layout.totalMinutes).toBe(60);
    expect(layout.firstHour).toBe(6);
  });

  it("ne change pas les heures choisies dans les Paramètres", () => {
    const layout = withHours(layoutDays([stage, force], weekOf("2026-10-19")), 7, 21);
    expect([layout.firstHour, layout.lastHour]).toEqual([7, 21]);
  });
});
