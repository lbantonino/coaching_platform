import { describe, expect, it } from "vitest";

import { accountingRows, totalRow } from "@/domain/billing/accounting";
import { expenseDates, parseExpenseForm } from "@/domain/billing/expenses";

// Dépenses et résultat (D-73).
const TODAY = "2026-10-29";
const rent = {
  spentOn: "2026-08-31",
  amountCents: 60500,
  vatRate: 21,
  repeatsMonthly: true,
  endsOn: null,
};

describe("dates d'une dépense", () => {
  it("une dépense unique compte une fois, dans la période", () => {
    const once = { ...rent, repeatsMonthly: false };
    expect(expenseDates(once, "2026-08-01", "2026-08-31")).toEqual(["2026-08-31"]);
    expect(expenseDates(once, "2026-09-01", "2026-09-30")).toEqual([]);
  });

  it("une dépense mensuelle compte chaque mois, le 31 ramené au dernier jour", () => {
    expect(expenseDates(rent, "2026-08-01", "2026-11-30")).toEqual([
      "2026-08-31",
      "2026-09-30",
      "2026-10-31",
      "2026-11-30",
    ]);
    expect(expenseDates({ ...rent, spentOn: "2027-01-31" }, "2027-02-01", "2027-02-28")).toEqual([
      "2027-02-28",
    ]);
  });

  it("s'arrête à sa date de fin", () => {
    expect(expenseDates({ ...rent, endsOn: "2026-10-15" }, "2026-01-01", "2026-12-31")).toEqual([
      "2026-08-31",
      "2026-09-30",
    ]);
  });
});

describe("résultat", () => {
  const payments = [
    { receivedOn: "2026-10-05", amountCents: 121000, vatRate: 21, method: "transfer" as const },
  ];

  it("coach soumis à la TVA : résultat HTVA, TVA récupérable", () => {
    const [october] = accountingRows(payments, "mois", TODAY, undefined, [rent], "excl");
    expect(october).toMatchObject({
      inclCents: 121000,
      exclCents: 100000,
      spentInclCents: 60500,
      spentExclCents: 50000,
      spentVatCents: 10500,
      resultCents: 50000,
    });
  });

  it("coach non soumis : résultat TVA comprise", () => {
    const [october] = accountingRows(payments, "mois", TODAY, undefined, [rent], "incl");
    expect(october.resultCents).toBe(121000 - 60500);
  });

  it("le total additionne les dépenses de chaque mois", () => {
    const total = totalRow(accountingRows(payments, "mois", TODAY, undefined, [rent], "excl"));
    expect(total.spentInclCents).toBe(60500 * 3); // août, septembre, octobre
    expect(total.resultCents).toBe(100000 - 50000 * 3);
  });
});

describe("formulaire « Nouvelle dépense »", () => {
  const base = {
    label: "Loyer de la salle",
    categoryId: "",
    amount: "605",
    vatRate: "21",
    spentOn: "2026-10-01",
    repeatsMonthly: true,
    endsOn: "",
  };

  it("lit une dépense mensuelle", () => {
    const parsed = parseExpenseForm(base, true);
    expect(parsed.ok && parsed.expense).toEqual({
      label: "Loyer de la salle",
      categoryId: null,
      amountCents: 60500,
      vatRate: 21,
      spentOn: "2026-10-01",
      repeatsMonthly: true,
      endsOn: null,
    });
  });

  it("un coach non soumis à la TVA ne récupère rien (taux 0)", () => {
    const parsed = parseExpenseForm(base, false);
    expect(parsed.ok && parsed.expense.vatRate).toBe(0);
  });

  it("refuse un montant faux ou une fin avant le début", () => {
    expect(parseExpenseForm({ ...base, amount: "abc" }, true).ok).toBe(false);
    expect(parseExpenseForm({ ...base, endsOn: "2026-09-01" }, true).ok).toBe(false);
    expect(parseExpenseForm({ ...base, label: " " }, true).ok).toBe(false);
  });
});
