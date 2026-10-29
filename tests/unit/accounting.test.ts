import { describe, expect, it } from "vitest";

import {
  accountingPeriods,
  accountingRows,
  periodLabel,
  periodOf,
  shareOf,
  totalRow,
} from "@/domain/billing/accounting";
import { makeConverter } from "@/domain/billing/money";

// Tableau de comptabilité (D-72) : par semaine, mois ou année, et par mode de paiement.
const TODAY = "2026-10-29"; // un jeudi

describe("périodes", () => {
  it("trouve la semaine (lundi-dimanche), le mois et l'année d'une date", () => {
    expect(periodOf(TODAY, "semaine")).toEqual({
      key: "2026-10-26",
      from: "2026-10-26",
      to: "2026-11-01",
    });
    expect(periodOf("2026-02-10", "mois")).toEqual({
      key: "2026-02",
      from: "2026-02-01",
      to: "2026-02-28",
    });
    expect(periodOf(TODAY, "annee")).toEqual({ key: "2026", from: "2026-01-01", to: "2026-12-31" });
  });

  it("liste 12 semaines ou 12 mois, et les années depuis le premier paiement", () => {
    const months = accountingPeriods("mois", TODAY, null);
    expect(months).toHaveLength(12);
    expect(months[0].key).toBe("2026-10");
    expect(months[11].key).toBe("2025-11");
    expect(accountingPeriods("semaine", TODAY, null)[1].key).toBe("2026-10-19");
    expect(accountingPeriods("annee", TODAY, "2024-03-01").map((p) => p.key)).toEqual([
      "2026",
      "2025",
      "2024",
    ]);
  });

  it("nomme chaque période", () => {
    expect(periodLabel("2026-10", "mois")).toBe("Octobre 2026");
    expect(periodLabel("2026-10-26", "semaine")).toBe("Semaine du 26 oct.");
    expect(periodLabel("2026", "annee")).toBe("2026");
  });
});

describe("tableau par mode de paiement", () => {
  const payments = [
    { receivedOn: "2026-10-05", amountCents: 12100, vatRate: 21, method: "transfer" as const },
    { receivedOn: "2026-10-20", amountCents: 6500, vatRate: 0, method: "cash" as const },
    { receivedOn: "2026-10-28", amountCents: 7865, vatRate: 21, method: "bancontact" as const },
    { receivedOn: "2026-09-12", amountCents: 3000, vatRate: 0, method: "cash" as const },
  ];

  it("range chaque paiement dans sa période et son mode, avec HTVA et TVA", () => {
    const [october, september] = accountingRows(payments, "mois", TODAY);
    expect(october.byMethod).toEqual({ transfer: 12100, cash: 6500, bancontact: 7865, other: 0 });
    expect(october).toMatchObject({ count: 3, inclCents: 26465, exclCents: 10000 + 6500 + 6500 });
    expect(october.vatCents).toBe(2100 + 1365);
    expect(september.byMethod.cash).toBe(3000);
  });

  it("additionne les lignes dans le total", () => {
    const total = totalRow(accountingRows(payments, "mois", TODAY));
    expect(total.inclCents).toBe(29465);
    expect(total.byMethod.cash).toBe(9500);
    expect(total.count).toBe(4);
  });

  it("convertit les montants d'avant un changement de devise", () => {
    const rows = accountingRows(
      [{ ...payments[0], currency: "EUR" as const }],
      "annee",
      TODAY,
      makeConverter("CHF", [{ from: "EUR", to: "CHF", rate: 0.94 }]),
    );
    expect(rows[0].inclCents).toBe(11374);
    expect(rows[0].byCurrency).toEqual({ EUR: 12100 });
  });

  it("calcule la part de chaque mode", () => {
    expect(shareOf(6500, 26465)).toBe(25);
    expect(shareOf(0, 0)).toBe(0);
  });
});
