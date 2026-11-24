import { describe, expect, it } from "vitest";

import {
  describeSchedule,
  parseSessionForm,
  sessionTimeLabel,
  type SessionFormInput,
} from "@/features/sessions/schemas";

// Séance « Jour entier » (D-204, maquette Apple validée le 24/11/2026) : pas d'heure, rangée à 00:00
// pour 60 min en base (en tête de sa journée), « toute la journée » à l'écran.
const base: SessionFormInput = {
  kind: "group",
  title: "Stage Hyrox",
  discipline: "hyrox",
  location: "",
  startsOn: "2026-12-05",
  startTime: "",
  durationMinutes: "",
  allDay: true,
  repeatsWeekly: false,
  endsOn: "",
  athleteId: "",
  athleteIds: [],
  newClient: false,
  newAthleteName: "",
  notes: "",
  price: "",
  applyVat: false,
  vatRate: "",
  vatIncluded: true,
  paymentMethod: "transfer",
};

describe("séance « Jour entier »", () => {
  it("se lit sans heure ni durée, rangée à 00:00 pour 60 min", () => {
    const parsed = parseSessionForm(base);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.values.all_day).toBe(true);
    expect(parsed.values.start_time).toBe("00:00");
    expect(parsed.values.duration_minutes).toBe(60);
  });

  it("ignore l'heure et la durée envoyées avec « Jour entier »", () => {
    const parsed = parseSessionForm({ ...base, startTime: "19:00", durationMinutes: "90" });
    expect(parsed.ok && parsed.values.start_time).toBe("00:00");
    expect(parsed.ok && parsed.values.duration_minutes).toBe(60);
  });

  it("une séance à l'heure demande toujours son heure", () => {
    expect(parseSessionForm({ ...base, allDay: false })).toEqual({
      ok: false,
      error: "Indique l'heure de début, par exemple 19:00.",
    });
    const timed = parseSessionForm({
      ...base,
      allDay: false,
      startTime: "19:00",
      durationMinutes: "90",
    });
    expect(timed.ok && timed.values.all_day).toBe(false);
  });

  it("se décrit « toute la journée », sans durée", () => {
    const stage = {
      startsOn: "2026-12-05",
      repeatsWeekly: false,
      endsOn: null,
      startTime: "00:00",
      durationMinutes: 60,
      allDay: true,
    };
    expect(describeSchedule(stage)).toBe("Le 5 décembre 2026, toute la journée");
    expect(describeSchedule({ ...stage, repeatsWeekly: true })).toBe(
      "Chaque samedi, toute la journée",
    );
  });

  it("son heure s'affiche « Toute la journée »", () => {
    expect(sessionTimeLabel("00:00:00", true)).toBe("Toute la journée");
    expect(sessionTimeLabel("19:00:00", false)).toBe("19:00");
    expect(sessionTimeLabel("19:00")).toBe("19:00");
  });
});
