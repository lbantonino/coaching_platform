import { describe, expect, it } from "vitest";

import {
  defaultVatIncluded,
  describePeriod,
  describeSchedule,
  formatDuration,
  sessionAmountCents,
  occurrencesBetween,
  parseSessionForm,
  type SessionFormInput,
  sessionOccurrences,
} from "@/features/sessions/schemas";
import { coveredByPackage } from "@/domain/billing/payments";
import { plannedIncome } from "@/features/sessions/prices";

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
  newAthleteName: "",
  notes: "",
  price: "",
  vatIncluded: true,
  paymentMethod: "transfer",
};

describe("parseSessionForm", () => {
  it("lit une séance collective hebdomadaire et dédoublonne les inscrits", () => {
    expect(parseSessionForm(base)).toEqual({
      ok: true,
      athleteIds: [ATHLETE, OTHER],
      newAthlete: null,
      values: {
        kind: "group",
        title: "Piste du mercredi",
        discipline: "running",
        location: "Stade",
        athlete_id: null,
        starts_on: "2026-09-02",
        start_time: "19:00",
        duration_minutes: 90,
        repeats_weekly: true,
        ends_on: null,
        notes: null,
        price_cents: null,
        price_vat_included: true,
        payment_method: null,
      },
    });
  });

  it("prépare la fiche minimale d'un nouveau sportif à partir de son nom (D-35)", () => {
    expect(
      parseSessionForm({
        ...base,
        kind: "individual",
        newClient: true,
        newAthleteName: "  John   Martin Dupont ",
        athleteId: ATHLETE,
      }),
    ).toMatchObject({
      ok: true,
      newAthlete: { firstName: "John", lastName: "Martin Dupont" },
      values: { athlete_id: null },
    });
    expect(
      parseSessionForm({ ...base, kind: "individual", newClient: true, newAthleteName: "John" }),
    ).toMatchObject({ ok: true, newAthlete: { firstName: "John", lastName: null } });
    expect(
      parseSessionForm({ ...base, kind: "individual", newClient: true, newAthleteName: " " }),
    ).toEqual({ ok: false, error: "Écris le nom du nouveau sportif." });
    // Une séance collective n'a jamais de « nouveau sportif ».
    expect(parseSessionForm({ ...base, newClient: true, newAthleteName: "John" })).toMatchObject({
      ok: true,
      newAthlete: null,
    });
  });

  it("exige le sportif d'une séance individuelle et ignore la liste d'inscrits", () => {
    expect(parseSessionForm({ ...base, kind: "individual" })).toEqual({
      ok: false,
      error: "Choisis le sportif de la séance, ou coche « Nouveau sportif ».",
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

describe("prix d'une séance (D-52)", () => {
  it("lit le prix TVA comprise et le mode de paiement", () => {
    const parsed = parseSessionForm({ ...base, price: " 65,50 ", paymentMethod: "cash" });
    expect(parsed.ok && parsed.values).toMatchObject({
      price_cents: 6550,
      price_vat_included: true,
      payment_method: "cash",
    });
  });

  it("calcule le montant reçu : prix direct, ou prix HTVA plus 21 %", () => {
    expect(sessionAmountCents({ priceCents: 6500, priceVatIncluded: true })).toBe(6500);
    expect(sessionAmountCents({ priceCents: 6500, priceVatIncluded: false })).toBe(7865);
    expect(defaultVatIncluded("cash")).toBe(true);
    expect(defaultVatIncluded("transfer")).toBe(false);
  });

  it("garde un prix hors TVA quand la case est décochée (facturé par virement)", () => {
    const parsed = parseSessionForm({ ...base, price: "65", vatIncluded: false });
    expect(parsed.ok && parsed.values).toMatchObject({
      price_cents: 6500,
      price_vat_included: false,
      payment_method: "transfer",
    });
  });

  it("refuse un prix illisible ou un mode inconnu", () => {
    expect(parseSessionForm({ ...base, price: "abc" })).toEqual({
      ok: false,
      error: "Prix invalide : écris par exemple 65 ou 65,50.",
    });
    expect(parseSessionForm({ ...base, price: "65", paymentMethod: "bitcoin" })).toEqual({
      ok: false,
      error: "Choisis espèces ou virement.",
    });
  });

  it("additionne les dates de la période qui ont un prix, déplacements compris", () => {
    const weekly = {
      startsOn: "2026-09-07",
      startTime: "07:00",
      repeatsWeekly: true,
      endsOn: null,
      priceCents: 6500,
      priceVatIncluded: false,
      // La date du lundi 2 novembre a lieu le dimanche 1er : elle reste dans la semaine du 26/10.
      exceptions: [{ originalDate: "2026-11-02", newDate: "2026-11-01", newStartTime: "09:00" }],
    };
    const once = {
      ...weekly,
      startsOn: "2026-10-28",
      repeatsWeekly: false,
      priceVatIncluded: true,
      exceptions: [],
    };
    const free = { ...weekly, priceCents: null, exceptions: [] };
    // Deux dates facturées (78,65 €) et une en espèces (65 €).
    expect(plannedIncome([weekly, once, free], "2026-10-26", "2026-11-01")).toEqual({
      count: 3,
      inclCents: 22230,
    });
  });
});

describe("forfaits (D-52)", () => {
  const covers = [{ athleteId: ATHLETE, coversFrom: "2026-10-25", coversTo: "2027-01-22" }];

  it("dit si une date d'un sportif est comprise dans son forfait", () => {
    expect(coveredByPackage(covers, ATHLETE, "2026-10-26")).toBe(true);
    expect(coveredByPackage(covers, ATHLETE, "2027-01-22")).toBe(true);
    expect(coveredByPackage(covers, ATHLETE, "2026-10-24")).toBe(false);
    expect(coveredByPackage(covers, OTHER, "2026-10-26")).toBe(false);
    expect(coveredByPackage(covers, null, "2026-10-26")).toBe(false);
  });

  it("ne compte pas, dans le prévu, les dates comprises dans un forfait", () => {
    const session = {
      startsOn: "2026-09-07",
      startTime: "07:00",
      repeatsWeekly: true,
      endsOn: null,
      priceCents: 6500,
      priceVatIncluded: true,
      athleteId: ATHLETE,
    };
    const other = { ...session, athleteId: OTHER };
    expect(
      plannedIncome([session, other], "2026-10-26", "2026-11-01", (s, date) =>
        coveredByPackage(covers, s.athleteId, date),
      ),
    ).toEqual({ count: 1, inclCents: 6500 });
  });
});
