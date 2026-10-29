import { describe, expect, it } from "vitest";

import { invoiceStatus, monthActivity } from "@/domain/billing/invoices";
import { formatMoney } from "@/domain/billing/money";

const TODAY = "2026-10-23";
const invoice = (issuedOn: string, dueOn: string, paidOn: string | null, amountCents: number) => ({
  issuedOn,
  dueOn,
  paidOn,
  amountCents,
});

describe("statut d'une facture", () => {
  it("est payée dès qu'un paiement est noté, même après l'échéance", () => {
    expect(invoiceStatus(invoice("2026-10-01", "2026-10-10", "2026-10-20", 100), TODAY)).toBe(
      "paid",
    );
  });
  it("passe en retard le lendemain de l'échéance, pas le jour même", () => {
    expect(invoiceStatus(invoice("2026-10-01", TODAY, null, 100), TODAY)).toBe("pending");
    expect(invoiceStatus(invoice("2026-10-01", "2026-10-22", null, 100), TODAY)).toBe("overdue");
  });
});

describe("activité financière du mois", () => {
  it("compte les factures envoyées et les paiements reçus du mois, et tout ce qui reste à payer", () => {
    const activity = monthActivity(
      [
        invoice("2026-10-09", "2026-10-22", null, 15000), // envoyée ce mois-ci, en retard
        invoice("2026-10-11", "2026-10-25", "2026-10-18", 20000), // envoyée et payée ce mois-ci
        invoice("2026-10-15", "2026-10-29", "2026-10-21", 10000),
        invoice("2026-09-20", "2026-10-05", "2026-10-02", 5000), // envoyée en septembre, payée en octobre
        invoice("2026-09-25", "2026-10-30", null, 7000), // envoyée en septembre, pas encore due
      ],
      TODAY,
    );
    expect(activity.sent).toMatchObject({ count: 3, cents: 45000 });
    expect(activity.received).toMatchObject({ count: 3, cents: 35000 });
    expect(activity.pending).toMatchObject({ count: 2, cents: 22000, overdue: 1 });
  });
  it("reste à zéro sans facture", () => {
    expect(monthActivity([], TODAY)).toMatchObject({
      sent: { count: 0, cents: 0 },
      received: { count: 0, cents: 0 },
      pending: { count: 0, cents: 0, overdue: 0 },
    });
  });
});

describe("montants", () => {
  it("s'affichent en euros à la belge", () => {
    expect(formatMoney(45000, "EUR").replace(/\s/g, " ")).toBe("450,00 €");
  });
});
