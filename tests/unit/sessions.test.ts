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
  seriesPosition,
  sessionOccurrences,
} from "@/features/sessions/schemas";
import { coveredByPackage } from "@/domain/billing/payments";
import { datesToCollect, plannedIncome } from "@/features/sessions/prices";

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
  applyVat: false,
  vatRate: "",
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
        all_day: false,
        alerts: [],
        repeats_weekly: true,
        // Récurrence (D-203) : chaque semaine, le jour du début (un mercredi).
        recurrence: { freq: "weekly", interval: 1, weekdays: ["wed"] },
        ends_on: null,
        notes: null,
        price_cents: null,
        price_vat_included: true,
        vat_rate: 0,
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
      error: "Choisis le sportif de la séance, ou « Nouveau sportif » dans la liste.",
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

  it("calcule le montant reçu avec la TVA de la séance (D-163)", () => {
    expect(sessionAmountCents({ priceCents: 6500, priceVatIncluded: true, vatRate: 21 })).toBe(
      6500,
    );
    expect(sessionAmountCents({ priceCents: 6500, priceVatIncluded: false, vatRate: 21 })).toBe(
      7865,
    );
    // Taux libre (D-69) : 8,1 % en Suisse, 0 % sans TVA.
    expect(sessionAmountCents({ priceCents: 10000, priceVatIncluded: false, vatRate: 8.1 })).toBe(
      10810,
    );
    expect(sessionAmountCents({ priceCents: 6500, priceVatIncluded: false, vatRate: 0 })).toBe(
      6500,
    );
    expect(defaultVatIncluded("cash")).toBe(true);
    expect(defaultVatIncluded("transfer")).toBe(false);
  });

  it("garde un prix hors TVA quand la TVA s'applique sans être comprise (facturé par virement)", () => {
    const parsed = parseSessionForm({
      ...base,
      price: "65",
      applyVat: true,
      vatRate: "21",
      vatIncluded: false,
    });
    expect(parsed.ok && parsed.values).toMatchObject({
      price_cents: 6500,
      price_vat_included: false,
      vat_rate: 21,
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

  it("lit la TVA de la séance : décochée = 0 %, cochée = son taux (D-163)", () => {
    const priced = { ...base, price: "65", paymentMethod: "transfer" };
    const none = parseSessionForm({ ...priced, vatRate: "21", vatIncluded: false });
    expect(none.ok && none.values).toMatchObject({ vat_rate: 0, price_vat_included: true });
    const vat = parseSessionForm({ ...priced, applyVat: true, vatRate: "8,1", vatIncluded: false });
    expect(vat.ok && vat.values).toMatchObject({ vat_rate: 8.1, price_vat_included: false });
    expect(parseSessionForm({ ...priced, applyVat: true, vatRate: "abc" })).toEqual({
      ok: false,
      error: "Taux de TVA invalide : un nombre entre 0 et 100 (ex. 21).",
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
      vatRate: 21,
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
      vatRate: 0,
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

// À encaisser (D-90) : mardi 3 novembre 2026, 10:00.
describe("séances à encaisser (D-90)", () => {
  const today = "2026-11-03";
  const base = {
    repeatsWeekly: false,
    endsOn: null,
    priceVatIncluded: true,
    vatRate: 0,
    exceptions: [],
  };
  // Chaque lundi à 07:00, 65 € HTVA (78,65 € à 21 %) ; le 19/10 déplacé au mardi 20 à 09:00.
  const weekly = {
    ...base,
    id: "lundi",
    startsOn: "2026-10-12",
    startTime: "07:00",
    repeatsWeekly: true,
    priceCents: 6500,
    priceVatIncluded: false,
    vatRate: 21,
    exceptions: [{ originalDate: "2026-10-19", newDate: "2026-10-20", newStartTime: "09:00" }],
  };
  const morning = { ...base, id: "matin", startsOn: today, startTime: "08:00", priceCents: 4000 };
  const evening = { ...base, id: "soir", startsOn: today, startTime: "18:00", priceCents: 4000 };
  const free = {
    ...base,
    id: "gratuite",
    startsOn: "2026-11-02",
    startTime: "07:00",
    priceCents: null,
  };
  const paid = new Set(["lundi:2026-10-26"]);

  it("liste les dates commencées et pas payées, la plus récente d'abord", () => {
    const dates = datesToCollect(
      [weekly, morning, evening, free],
      "2026-10-19",
      today,
      "10:00",
      (session, date) => paid.has(`${session.id}:${date}`),
    );
    expect(
      dates.map(({ session, date, originalDate, amountCents }) => [
        session.id,
        date,
        originalDate,
        amountCents,
      ]),
    ).toEqual([
      // Aujourd'hui 08:00 : commencée ; 18:00 : pas encore, donc absente.
      ["matin", today, today, 4000],
      ["lundi", "2026-11-02", "2026-11-02", 7865],
      // Déplacée : à sa nouvelle date, payée sous sa date d'origine.
      ["lundi", "2026-10-20", "2026-10-19", 7865],
    ]);
  });

  it("ne garde pas les dates comprises dans un forfait", () => {
    const dates = datesToCollect(
      [weekly],
      "2026-10-19",
      today,
      "10:00",
      () => false,
      (_session, date) => date >= "2026-10-26",
    );
    expect(dates.map((date) => date.originalDate)).toEqual(["2026-10-19"]);
  });
});

describe("rang d'une date dans sa série (page d'une séance)", () => {
  const weekly = { startsOn: "2026-09-07", repeatsWeekly: true, endsOn: "2027-01-17" };

  it("donne « Séance 9 sur 19 » pour le 2 novembre d'une série du 7 septembre au 17 janvier", () => {
    expect(seriesPosition(weekly, "2026-09-07")).toEqual({ index: 1, total: 19 });
    expect(seriesPosition(weekly, "2026-11-02")).toEqual({ index: 9, total: 19 });
    expect(seriesPosition(weekly, "2027-01-11")).toEqual({ index: 19, total: 19 });
  });

  it("n'a pas de total sans date de fin, ni de rang hors de la série ou pour une séance unique", () => {
    expect(seriesPosition({ ...weekly, endsOn: null }, "2026-11-02")).toEqual({
      index: 9,
      total: null,
    });
    expect(seriesPosition(weekly, "2026-11-03")).toBeNull();
    expect(seriesPosition(weekly, "2027-01-18")).toBeNull();
    expect(
      seriesPosition({ startsOn: "2026-11-02", repeatsWeekly: false, endsOn: null }, "2026-11-02"),
    ).toBeNull();
  });
});
