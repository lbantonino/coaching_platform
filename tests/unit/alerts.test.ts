import { describe, expect, it } from "vitest";

import {
  alertLabel,
  alertMoment,
  alertOptions,
  alertText,
  parseAlerts,
} from "@/domain/sessions/alerts";
import { dueAlerts, type AlertSession } from "@/features/alerts/due";

// Alertes des séances (D-205, phase C) : choix d'Apple, rangés en minutes AVANT le début ; heure de
// Bruxelles (changement d'heure compris) ; une alerte est due dans les 15 min qui suivent son heure.
const BXL = "Europe/Brussels";

describe("choix d'alerte", () => {
  it("propose les choix d'Apple, à l'heure ou pour une journée entière", () => {
    expect(alertOptions(false)).toEqual([0, 5, 10, 15, 30, 60, 120, 1440, 2880]);
    expect(alertOptions(true)).toEqual([-540, 900, 2340, 9540]);
    expect(alertLabel(0, false)).toBe("À l'heure de la séance");
    expect(alertLabel(15, false)).toBe("15 min avant");
    expect(alertLabel(60, false)).toBe("1 h avant");
    expect(alertLabel(2880, false)).toBe("2 jours avant");
    expect(alertLabel(-540, true)).toBe("Le jour même (09:00)");
    expect(alertLabel(9540, true)).toBe("1 semaine avant (09:00)");
  });

  it("lit deux alertes au plus, différentes et permises", () => {
    expect(parseAlerts("", false)).toEqual([]);
    expect(parseAlerts("1440,15", false)).toEqual([1440, 15]);
    expect(parseAlerts("15,15", false)).toBeNull();
    expect(parseAlerts("5,15,30", false)).toBeNull();
    expect(parseAlerts("-540", false)).toBeNull();
    expect(parseAlerts("-540,900", true)).toEqual([-540, 900]);
    expect(parseAlerts("abc", false)).toBeNull();
  });
});

describe("heure d'une alerte", () => {
  it("suit l'heure de Bruxelles, été comme hiver", () => {
    expect(alertMoment("2026-07-01", "19:00", 15, BXL).toISOString()).toBe(
      "2026-07-01T16:45:00.000Z",
    );
    expect(alertMoment("2026-12-02", "19:00", 0, BXL).toISOString()).toBe(
      "2026-12-02T18:00:00.000Z",
    );
  });

  it("garde l'heure locale au changement d'heure (25 octobre 2026)", () => {
    // Séance le lundi 26 à 09:00 (heure d'hiver) ; alerte la veille, le dimanche 25 à 09:00 (hiver).
    expect(alertMoment("2026-10-26", "09:00", 1440, BXL).toISOString()).toBe(
      "2026-10-25T08:00:00.000Z",
    );
    // Séance le dimanche 25 à 09:00 ; alerte 1 jour avant : samedi 24 à 09:00 (encore l'heure d'été).
    expect(alertMoment("2026-10-25", "09:00", 1440, BXL).toISOString()).toBe(
      "2026-10-24T07:00:00.000Z",
    );
  });

  it("place une alerte « Jour entier » à 09:00", () => {
    expect(alertMoment("2026-12-05", "00:00", -540, BXL).toISOString()).toBe(
      "2026-12-05T08:00:00.000Z",
    );
    expect(alertMoment("2026-12-05", "00:00", 900, BXL).toISOString()).toBe(
      "2026-12-04T08:00:00.000Z",
    );
  });
});

describe("texte de l'alerte", () => {
  it("dit quoi, quand et où, sans donnée de santé", () => {
    expect(
      alertText({
        title: "Coaching force",
        athleteName: "Sarah Vermeulen",
        location: "Salle Aspria",
        startTime: "18:00",
        allDay: false,
        offset: 15,
      }),
    ).toEqual({
      title: "Coaching force avec Sarah V.",
      body: "Dans 15 min · 18:00 · Salle Aspria",
    });
    expect(
      alertText({
        title: "Sarah Vermeulen",
        athleteName: "Sarah Vermeulen",
        location: null,
        startTime: "07:30",
        allDay: false,
        offset: 1440,
      }),
    ).toEqual({ title: "Sarah Vermeulen", body: "Demain · 07:30" });
    expect(
      alertText({
        title: "Stage Hyrox",
        athleteName: null,
        location: "Gand",
        startTime: "00:00",
        allDay: true,
        offset: -540,
      }),
    ).toEqual({ title: "Stage Hyrox", body: "Aujourd'hui, toute la journée · Gand" });
  });
});

describe("alertes dues", () => {
  const piste: AlertSession = {
    id: "piste",
    startsOn: "2026-11-25",
    repeatsWeekly: true,
    endsOn: null,
    startTime: "19:00",
    alerts: [15, 1440],
  };

  it("part à son heure, et seulement dans les 15 min qui suivent", () => {
    const at = (iso: string) => dueAlerts([piste], new Date(iso), BXL);
    // Mercredi 2 décembre, 18:45 à Bruxelles (17:45Z) : l'alerte « 15 min avant ».
    expect(at("2026-12-02T17:45:00Z")).toEqual([
      { sessionId: "piste", date: "2026-12-02", originalDate: "2026-12-02", offset: 15 },
    ]);
    expect(at("2026-12-02T17:44:00Z")).toEqual([]);
    expect(at("2026-12-02T17:59:00Z")).toHaveLength(1);
    expect(at("2026-12-02T18:01:00Z")).toEqual([]);
    // La veille à 19:00 : « 1 jour avant ».
    expect(at("2026-12-01T18:00:00Z")).toEqual([
      { sessionId: "piste", date: "2026-12-02", originalDate: "2026-12-02", offset: 1440 },
    ]);
  });

  it("suit une date déplacée de la série", () => {
    const moved: AlertSession = {
      ...piste,
      exceptions: [{ originalDate: "2026-12-02", newDate: "2026-12-03", newStartTime: "18:00" }],
    };
    expect(dueAlerts([moved], new Date("2026-12-02T17:45:00Z"), BXL)).toEqual([]);
    expect(dueAlerts([moved], new Date("2026-12-03T16:45:00Z"), BXL)).toEqual([
      { sessionId: "piste", date: "2026-12-03", originalDate: "2026-12-02", offset: 15 },
    ]);
  });

  it("ignore une séance sans alerte", () => {
    expect(dueAlerts([{ ...piste, alerts: [] }], new Date("2026-12-02T17:45:00Z"), BXL)).toEqual(
      [],
    );
  });
});
