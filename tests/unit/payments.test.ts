import { describe, expect, it } from "vitest";

import { isBankMethod, parseAmount, paymentTotals, splitVat } from "@/domain/billing/payments";

describe("TVA d'un paiement reçu (D-36)", () => {
  it("déduit le HTVA et la TVA du montant TVA comprise, au centime près", () => {
    expect(splitVat(300000, 21)).toEqual({ exclCents: 247934, vatCents: 52066 });
    expect(splitVat(10000, 6)).toEqual({ exclCents: 9434, vatCents: 566 });
    expect(splitVat(5000, 0)).toEqual({ exclCents: 5000, vatCents: 0 });
  });
});

describe("totaux des paiements", () => {
  it("compte seulement l'argent reçu dans la période", () => {
    const payments = [
      { receivedOn: "2026-10-19", amountCents: 300000, vatRate: 21 }, // lundi
      { receivedOn: "2026-10-25", amountCents: 10000, vatRate: 21 }, // dimanche
      { receivedOn: "2026-10-26", amountCents: 9999, vatRate: 21 }, // semaine suivante
    ];
    expect(paymentTotals(payments, "2026-10-19", "2026-10-25")).toEqual({
      count: 2,
      inclCents: 310000,
      exclCents: 247934 + 8264,
      vatCents: 52066 + 1736,
    });
  });
});

describe("saisie d'un montant", () => {
  it("lit les écritures belges courantes", () => {
    expect(parseAmount("3000")).toBe(300000);
    expect(parseAmount("3 000,50")).toBe(300050);
    expect(parseAmount("3000.5 €")).toBe(300050);
    expect(parseAmount("0")).toBeNull();
    expect(parseAmount("12,345")).toBeNull();
    expect(parseAmount("abc")).toBeNull();
  });
  it("distingue l'argent qui arrive sur le compte bancaire", () => {
    expect(isBankMethod("transfer")).toBe(true);
    expect(isBankMethod("bancontact")).toBe(true);
    expect(isBankMethod("cash")).toBe(false);
  });
});
