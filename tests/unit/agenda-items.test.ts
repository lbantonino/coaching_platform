import { describe, expect, it } from "vitest";

import {
  addDays,
  buildAgendaItems,
  monthBounds,
  type AgendaEventSource,
  type AgendaSessionSource,
} from "@/features/agenda/items";

const THOMAS = { id: "t", name: "Thomas Peeters" };
const INES = { id: "i", name: "Inès Benali" };

const piste: AgendaSessionSource = {
  id: "s1",
  kind: "group",
  title: "Piste du mercredi",
  discipline: "running",
  location: "Stade",
  startsOn: "2026-09-02",
  repeatsWeekly: true,
  endsOn: null,
  startTime: "19:00",
  durationMinutes: 90,
  athletes: [THOMAS, INES],
};
const force: AgendaSessionSource = {
  id: "s2",
  kind: "individual",
  title: "Coaching force",
  discipline: "strength",
  location: null,
  startsOn: "2026-12-16",
  repeatsWeekly: false,
  endsOn: null,
  startTime: "07:30",
  durationMinutes: 60,
  athletes: [INES],
};
const hyrox: AgendaEventSource = {
  id: "g1",
  date: "2026-12-16",
  athleteId: "i",
  athleteName: "Inès Benali",
  title: "Hyrox Gent",
  detail: "Hyrox · Open",
  discipline: "hyrox",
  achieved: false,
};

describe("buildAgendaItems", () => {
  it("place les séances calculées et les compétitions, journée entière d'abord puis par heure", () => {
    const items = buildAgendaItems([piste, force], [hyrox], "2026-12-14", "2026-12-20", {
      discipline: null,
      athleteId: null,
    });
    expect(items.map((item) => [item.date, item.time, item.title])).toEqual([
      ["2026-12-16", null, "Hyrox Gent"],
      ["2026-12-16", "07:30", "Coaching force"],
      ["2026-12-16", "19:00", "Piste du mercredi"],
    ]);
    expect(items[1].detail).toBe("Avec Inès Benali · 1 h");
    expect(items[2].detail).toBe("Stade · 2 inscrits · 1 h 30");
  });

  it("filtre par discipline et par sportif (inscrit, sportif individuel ou compétition)", () => {
    const run = buildAgendaItems([piste, force], [hyrox], "2026-12-14", "2026-12-20", {
      discipline: "running",
      athleteId: null,
    });
    expect(run.map((item) => item.title)).toEqual(["Piste du mercredi"]);
    const thomas = buildAgendaItems([piste, force], [hyrox], "2026-12-14", "2026-12-20", {
      discipline: null,
      athleteId: "t",
    });
    expect(thomas.map((item) => item.title)).toEqual(["Piste du mercredi"]);
  });
});

describe("bornes de dates", () => {
  it("donne le premier et le dernier jour d'un mois, et ajoute des jours", () => {
    expect(monthBounds("2027-02")).toEqual({ from: "2027-02-01", to: "2027-02-28" });
    expect(monthBounds("2026-12")).toEqual({ from: "2026-12-01", to: "2026-12-31" });
    expect(addDays("2026-12-28", 6)).toBe("2027-01-03");
  });
});
