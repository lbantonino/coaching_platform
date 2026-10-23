import { describe, expect, it } from "vitest";

import {
  describePeriod,
  describeSchedule,
  formatDuration,
  occurrencesBetween,
  parseSessionForm,
  type SessionFormInput,
  sessionOccurrences,
} from "@/features/sessions/schemas";

const ATHLETE = "da000000-0000-4000-8000-000000000002";
const OTHER = "da000000-0000-4000-8000-000000000003";
const base: SessionFormInput = {
  kind: "group",
  title: "  Piste du mercredi ",
  discipline: "running",
  location: "Stade",
  startsOn: "2026-09-02",
  startTime: "19:00",
  durationMinutes: "90",
  repeatsWeekly: true,
  endsOn: "",
  athleteId: "",
  athleteIds: [ATHLETE, OTHER, ATHLETE],
  newClient: false,
  prospectName: "",
  notes: "",
};

describe("parseSessionForm", () => {
  it("lit une séance collective hebdomadaire et dédoublonne les inscrits", () => {
    expect(parseSessionForm(base)).toEqual({
      ok: true,
      athleteIds: [ATHLETE, OTHER],
      values: {
        kind: "group",
        title: "Piste du mercredi",
        discipline: "running",
        location: "Stade",
        athlete_id: null,
        prospect_name: null,
        starts_on: "2026-09-02",
        start_time: "19:00",
        duration_minutes: 90,
        repeats_weekly: true,
        ends_on: null,
        notes: null,
      },
    });
  });

  it("accepte un nouveau client sans fiche sportif, nommé ou non (D-35)", () => {
    expect(
      parseSessionForm({
        ...base,
        kind: "individual",
        newClient: true,
        prospectName: "  Marc ",
        athleteId: ATHLETE,
      }),
    ).toMatchObject({ ok: true, values: { athlete_id: null, prospect_name: "Marc" } });
    expect(
      parseSessionForm({ ...base, kind: "individual", newClient: true, prospectName: " " }),
    ).toMatchObject({ ok: true, values: { athlete_id: null, prospect_name: null } });
    // Une séance collective n'a jamais de « nouveau client ».
    expect(parseSessionForm({ ...base, newClient: true, prospectName: "Marc" })).toMatchObject({
      ok: true,
      values: { prospect_name: null },
    });
  });

  it("exige le sportif d'une séance individuelle et ignore la liste d'inscrits", () => {
    expect(parseSessionForm({ ...base, kind: "individual" })).toEqual({
      ok: false,
      error: "Choisis le sportif de la séance, ou coche « Nouveau sportif, pas encore créé ».",
    });
    expect(parseSessionForm({ ...base, kind: "individual", athleteId: ATHLETE })).toMatchObject({
      ok: true,
      athleteIds: [],
      values: { athlete_id: ATHLETE },
    });
  });

  it("ignore la date de fin d'une séance unique et refuse une fin avant le début", () => {
    expect(parseSessionForm({ ...base, repeatsWeekly: false, endsOn: "2026-12-31" })).toMatchObject(
      { ok: true, values: { repeats_weekly: false, ends_on: null } },
    );
    expect(parseSessionForm({ ...base, endsOn: "2026-08-01" })).toEqual({
      ok: false,
      error: "La date de fin ne peut pas précéder la première séance.",
    });
  });

  it("refuse une heure ou une durée invalides", () => {
    expect(parseSessionForm({ ...base, startTime: "25:00" })).toMatchObject({ ok: false });
    expect(parseSessionForm({ ...base, durationMinutes: "10" })).toEqual({
      ok: false,
      error: "Durée invalide : entre 15 et 480 minutes.",
    });
    expect(parseSessionForm({ ...base, title: "   " })).toMatchObject({ ok: false });
  });
});

describe("occurrencesBetween", () => {
  const weekly = { startsOn: "2026-09-02", repeatsWeekly: true, endsOn: null };

  it("donne chaque mercredi d'octobre 2026 pour une séance commencée en septembre", () => {
    expect(occurrencesBetween(weekly, "2026-10-01", "2026-10-31")).toEqual([
      "2026-10-07",
      "2026-10-14",
      "2026-10-21",
      "2026-10-28",
    ]);
  });

  it("s'arrête à la date de fin et ne commence pas avant le début", () => {
    expect(
      occurrencesBetween({ ...weekly, endsOn: "2026-10-14" }, "2026-10-01", "2026-10-31"),
    ).toEqual(["2026-10-07", "2026-10-14"]);
    expect(occurrencesBetween(weekly, "2026-08-01", "2026-09-10")).toEqual([
      "2026-09-02",
      "2026-09-09",
    ]);
  });

  it("garde le même jour de la semaine après le passage à l'heure d'hiver", () => {
    // Nuit du 24 au 25 octobre 2026 : changement d'heure en Belgique.
    expect(occurrencesBetween(weekly, "2026-10-26", "2026-11-08")).toEqual([
      "2026-10-28",
      "2026-11-04",
    ]);
  });

  it("place une séance unique seulement si elle tombe dans la période", () => {
    const once = { startsOn: "2026-10-28", repeatsWeekly: false, endsOn: null };
    expect(occurrencesBetween(once, "2026-10-01", "2026-10-31")).toEqual(["2026-10-28"]);
    expect(occurrencesBetween(once, "2026-11-01", "2026-11-30")).toEqual([]);
  });
});

describe("descriptions", () => {
  it("décrit le rythme, la durée et la période en français", () => {
    expect(formatDuration(90)).toBe("1 h 30");
    expect(formatDuration(60)).toBe("1 h");
    expect(formatDuration(45)).toBe("45 min");
    expect(
      describeSchedule({
        startsOn: "2026-09-02",
        repeatsWeekly: true,
        endsOn: null,
        startTime: "19:00:00",
        durationMinutes: 90,
      }),
    ).toBe("Chaque mercredi à 19:00 · 1 h 30");
    expect(
      describeSchedule({
        startsOn: "2026-10-28",
        repeatsWeekly: false,
        endsOn: null,
        startTime: "08:00",
        durationMinutes: 60,
      }),
    ).toBe("Le 28 octobre 2026 à 08:00 · 1 h");
    expect(
      describePeriod({ startsOn: "2026-09-02", repeatsWeekly: true, endsOn: "2026-12-16" }),
    ).toBe("Depuis le 2 septembre 2026, jusqu'au 16 décembre 2026");
  });
});

describe("dates déplacées d'une séance hebdomadaire (glisser-déposer, D-35)", () => {
  // Chaque mercredi à 19:00 depuis le 7 octobre 2026.
  const piste = {
    startsOn: "2026-10-07",
    repeatsWeekly: true,
    endsOn: null,
    startTime: "19:00",
    exceptions: [{ originalDate: "2026-10-21", newDate: "2026-10-22", newStartTime: "18:00" }],
  };

  it("quitte sa place et apparaît à sa nouvelle date, à sa nouvelle heure", () => {
    expect(sessionOccurrences(piste, "2026-10-19", "2026-10-25")).toEqual([
      { date: "2026-10-22", startTime: "18:00", originalDate: "2026-10-21", moved: true },
    ]);
  });
  it("apparaît dans une autre semaine que la sienne", () => {
    const later = {
      ...piste,
      exceptions: [{ originalDate: "2026-10-21", newDate: "2026-10-30", newStartTime: "10:00" }],
    };
    expect(sessionOccurrences(later, "2026-10-26", "2026-11-01").map((o) => o.date)).toEqual([
      "2026-10-28",
      "2026-10-30",
    ]);
    expect(sessionOccurrences(later, "2026-10-19", "2026-10-25")).toEqual([]);
  });
  it("ignore un déplacement devenu orphelin (la série a changé de jour depuis)", () => {
    const orphan = {
      ...piste,
      exceptions: [{ originalDate: "2026-10-20", newDate: "2026-10-22", newStartTime: "18:00" }],
    };
    expect(sessionOccurrences(orphan, "2026-10-19", "2026-10-25")).toEqual([
      { date: "2026-10-21", startTime: "19:00", originalDate: "2026-10-21", moved: false },
    ]);
  });
});
