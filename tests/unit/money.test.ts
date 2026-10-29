import { describe, expect, it } from "vitest";

import { totalsFromEntry } from "@/domain/billing/invoice-document";
import { formatVatNumber, normalizeVatNumber } from "@/domain/billing/legal";
import {
  addVat,
  currencyLabel,
  formatMoney,
  formatVatRate,
  parseAmount,
  parseVatRate,
  splitVat,
} from "@/domain/billing/money";
import { paymentMethodLabel } from "@/domain/billing/payments";
import {
  countryFromAcceptLanguage,
  countryName,
  defaultCurrencyFor,
  isCountryCode,
} from "@/domain/geo/countries";
import { parseBillingSetup } from "@/features/auth/signup-schemas";

// Coory à l'international (D-69) : devise, taux de TVA libre, pays.
const plain = (text: string) => text.replace(/[\s  ]/g, " ");

describe("montants dans la devise de l'organisation", () => {
  it("affiche un montant dans sa devise, à la française", () => {
    expect(plain(formatMoney(45000, "EUR"))).toBe("450,00 €");
    expect(plain(formatMoney(123450, "CHF"))).toBe("1 234,50 CHF");
    expect(currencyLabel("CHF")).toBe("Franc suisse (CHF)");
  });

  it("lit un montant saisi, avec ou sans symbole", () => {
    expect(parseAmount("65")).toBe(6500);
    expect(parseAmount("3 000,50")).toBe(300050);
    expect(parseAmount("65 €")).toBe(6500);
    expect(parseAmount("CHF 65.5")).toBe(6550);
    expect(parseAmount("abc")).toBeNull();
    expect(parseAmount("0")).toBeNull();
  });
});

describe("taux de TVA libre", () => {
  it("accepte 0 à 100 %, 2 décimales au plus, virgule ou point", () => {
    expect(parseVatRate("21")).toBe(21);
    expect(parseVatRate("8,1")).toBe(8.1);
    expect(parseVatRate(" 5.5 % ")).toBe(5.5);
    expect(parseVatRate("0")).toBe(0);
    expect(parseVatRate("100")).toBe(100);
    expect(parseVatRate("101")).toBeNull();
    expect(parseVatRate("7,125")).toBeNull();
    expect(parseVatRate("")).toBeNull();
    expect(formatVatRate(8.1)).toBe("8,1 %");
    expect(formatVatRate(21)).toBe("21 %");
  });

  it("calcule HTVA et TVA au centime, sans écart d'arrondi", () => {
    expect(addVat(6500, 21)).toBe(7865);
    expect(addVat(10000, 8.1)).toBe(10810);
    expect(addVat(10000, 5.5)).toBe(10550);
    expect(splitVat(10810, 8.1)).toEqual({ exclCents: 10000, vatCents: 810 });
    expect(totalsFromEntry(6500, "excl", 20)).toEqual({
      exclCents: 6500,
      vatCents: 1300,
      inclCents: 7800,
    });
  });

  it("retrouve exactement le HTVA saisi, quel que soit le taux", () => {
    for (const rate of [5.5, 7.7, 8.1, 10, 16, 19, 20, 25.5]) {
      for (let cents = 1; cents <= 20_000; cents += 7) {
        expect(splitVat(addVat(cents, rate), rate).exclCents).toBe(cents);
      }
    }
  });
});

describe("pays", () => {
  it("connaît les pays et propose leur devise", () => {
    expect(isCountryCode("CH")).toBe(true);
    expect(isCountryCode("XX")).toBe(false);
    expect(countryName("CH")).toBe("Suisse");
    expect(defaultCurrencyFor("FR")).toBe("EUR");
    expect(defaultCurrencyFor("CH")).toBe("CHF");
    expect(defaultCurrencyFor("CA")).toBe("CAD");
    expect(defaultCurrencyFor("JP")).toBe("EUR");
  });

  it("devine le pays d'après la langue du navigateur", () => {
    expect(countryFromAcceptLanguage("fr-CH,fr;q=0.9,en;q=0.8")).toBe("CH");
    expect(countryFromAcceptLanguage("fr,en;q=0.8")).toBe("BE");
    expect(countryFromAcceptLanguage(null)).toBe("BE");
  });

  it("nomme Bancontact selon le pays", () => {
    expect(paymentMethodLabel("bancontact", "BE")).toBe("Bancontact");
    expect(paymentMethodLabel("bancontact", "FR")).toBe("Carte bancaire");
    expect(paymentMethodLabel("transfer", "FR")).toBe("Virement");
  });

  it("vérifie le numéro de TVA belge, laisse libre celui des autres pays", () => {
    expect(normalizeVatNumber("BE 0123.456.749", "BE")).toBe("BE0123456749");
    expect(normalizeVatNumber("BE 0123.456.748", "BE")).toBeNull();
    expect(normalizeVatNumber("fr40303265045", "FR")).toBe("FR40303265045");
    expect(formatVatNumber("BE0123456749")).toBe("BE0123.456.749");
    expect(formatVatNumber("FR40303265045")).toBe("FR40303265045");
  });
});

describe("inscription : étape « Ta facturation »", () => {
  const base = { country: "FR", currency: "EUR", vatChoice: "", vatRate: "", vatNumber: "" };

  it("sans choix de TVA, rien n'est créé (« plus tard »)", () => {
    expect(parseBillingSetup(base)).toEqual({
      ok: true,
      setup: { country: "FR", currency: "EUR", vatStatus: null, vatRate: null, vatNumber: null },
    });
  });

  it("un coach soumis à la TVA donne son taux et son numéro", () => {
    const parsed = parseBillingSetup({
      ...base,
      vatChoice: "subject",
      vatRate: "20",
      vatNumber: "FR40303265045",
    });
    expect(parsed.ok && parsed.setup).toMatchObject({
      vatStatus: "subject",
      vatRate: 20,
      vatNumber: "FR40303265045",
    });
    expect(parseBillingSetup({ ...base, vatChoice: "subject", vatNumber: "FR1" }).ok).toBe(false);
    expect(parseBillingSetup({ ...base, vatChoice: "subject", vatRate: "20" }).ok).toBe(false);
  });

  it("refuse un pays ou une devise inconnus", () => {
    expect(parseBillingSetup({ ...base, country: "XX" }).ok).toBe(false);
    expect(parseBillingSetup({ ...base, currency: "JPY" }).ok).toBe(false);
  });
});
