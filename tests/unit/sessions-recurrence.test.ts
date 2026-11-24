import { describe, expect, it } from "vitest";

import {
  describeSchedule,
  occurrencesBetween,
  parseSessionForm,
  type SessionFormInput,
} from "@/features/sessions/schemas";

// Récurrence comme Apple dans les séances encadrées (D-203, 24/11/2026) : le calcul des dates, le texte
// affiché et le formulaire, qui garde une règle personnalisée.
const base: SessionFormInput = {
  kind: "group",
  title: "Duo",
  discipline: "",
  location: "",
  startsOn: "2026-11-24",
  startTime: "18:00",
  durationMinutes: "60",
  repeatsWeekly: true,
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
const biweekly = { freq: "weekly", interval: 2, weekdays: ["tue", "thu"] } as const;

describe("une séance avec sa règle", () => {
  it("ses dates suivent la règle", () => {
    const session = {
      startsOn: "2026-11-24",
      repeatsWeekly: true,
      endsOn: null,
      recurrence: { ...biweekly, weekdays: [...biweekly.weekdays] },
    };
    expect(occurrencesBetween(session, "2026-11-20", "2026-12-11")).toEqual([
      "2026-11-24",
      "2026-11-26",
      "2026-12-08",
      "2026-12-10",
    ]);
  });

  it("une ancienne série sans règle reste « chaque semaine, le jour du début »", () => {
    const session = { startsOn: "2026-11-25", repeatsWeekly: true, endsOn: null };
    expect(occurrencesBetween(session, "2026-11-25", "2026-12-09")).toEqual([
      "2026-11-25",
      "2026-12-02",
      "2026-12-09",
    ]);
  });

  it("le texte : « Chaque mercredi » pour une série simple, la règle sinon", () => {
    const simple = {
      startsOn: "2026-11-25",
      repeatsWeekly: true,
      endsOn: null,
      startTime: "19:00",
      durationMinutes: 90,
    };
    expect(describeSchedule(simple)).toBe("Chaque mercredi à 19:00 · 1 h 30");
    expect(
      describeSchedule({
        ...simple,
        startsOn: "2026-11-24",
        startTime: "18:00",
        durationMinutes: 60,
        recurrence: { ...biweekly, weekdays: [...biweekly.weekdays] },
      }),
    ).toBe("Toutes les 2 semaines le mardi et le jeudi à 18:00 · 1 h");
  });
});

describe("le formulaire d'une séance qui se répète", () => {
  it("sans règle envoyée : chaque semaine, le jour du début (comme avant)", () => {
    const parsed = parseSessionForm(base);
    expect(parsed.ok && parsed.values.recurrence).toEqual({
      freq: "weekly",
      interval: 1,
      weekdays: ["tue"],
    });
  });

  it("une règle envoyée est gardée (forme canonique)", () => {
    const parsed = parseSessionForm({
      ...base,
      recurrence: JSON.stringify({ weekdays: ["thu", "tue"], interval: 2, freq: "weekly" }),
    });
    expect(parsed.ok && parsed.values.recurrence).toEqual({
      freq: "weekly",
      interval: 2,
      weekdays: ["tue", "thu"],
    });
  });

  it("une règle fausse est refusée ; sans répétition, pas de règle", () => {
    expect(
      parseSessionForm({ ...base, recurrence: '{"freq":"weekly","interval":1,"weekdays":[]}' }),
    ).toEqual({ ok: false, error: "Récurrence invalide : choisis au moins un jour." });
    const once = parseSessionForm({
      ...base,
      repeatsWeekly: false,
      recurrence: JSON.stringify(biweekly),
    });
    expect(once.ok && once.values.recurrence).toBeNull();
  });
});

describe("l'Assistant IA et une série mensuelle", () => {
  it("« toute la série » est refusée : elle se déplace date par date", async () => {
    const { checkAgainstSession } = await import("@/features/assistant/form-data");
    const monthly = {
      startsOn: "2026-11-30",
      repeatsWeekly: true,
      endsOn: null,
      recurrence: {
        freq: "monthly" as const,
        interval: 1,
        setPos: -1 as const,
        setWeekday: "mon" as const,
      },
      startTime: "10:00",
      durationMinutes: 60,
      priceCents: null,
    };
    const move = (scope: "single" | "series") =>
      checkAgainstSession(
        {
          kind: "deplacer_seance",
          params: {
            sessionId: "cb000000-0000-4000-8000-000000000001",
            originalDate: "2026-12-28",
            newDate: "2026-12-29",
            newTime: "10:00",
            scope,
          },
        } as never,
        monthly,
      );
    expect(move("series")).toEqual({
      ok: false,
      error:
        "Cette série se déplace date par date : propose seulement cette date (scope « single »).",
    });
    expect(move("single").ok).toBe(true);
  });
});

describe("modifier une séance ne détruit jamais sa règle", () => {
  it("l'Assistant IA change le lieu d'une série « toutes les 2 semaines » : la règle reste", async () => {
    const { mergeSessionChanges, sessionInputFormData } =
      await import("@/features/assistant/form-data");
    const { sessionFormInitial } = await import("@/features/sessions/schemas");
    const session = {
      id: "cb000000-0000-4000-8000-000000000001",
      kind: "group",
      title: "Duo",
      discipline: null,
      location: "Salle",
      startsOn: "2026-11-24",
      startTime: "18:00",
      allDay: false,
      alerts: [],
      durationMinutes: 60,
      repeatsWeekly: true,
      recurrence: { freq: "weekly", interval: 2, weekdays: ["tue", "thu"] },
      endsOn: null,
      notes: null,
      athletes: [],
      exceptions: [],
      priceCents: null,
      priceVatIncluded: true,
      vatRate: 0,
      currency: "EUR",
      paymentMethod: null,
    } as never;
    const merged = mergeSessionChanges(sessionFormInitial(session, []), { location: "Parc" });
    const form = sessionInputFormData(merged);
    const parsed = parseSessionForm({
      ...merged,
      recurrence: String(form.get("recurrence") ?? ""),
    });
    expect(form.get("location")).toBe("Parc");
    expect(parsed.ok && parsed.values.recurrence).toEqual({
      freq: "weekly",
      interval: 2,
      weekdays: ["tue", "thu"],
    });
  });
});
