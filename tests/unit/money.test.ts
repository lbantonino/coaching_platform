import { describe, expect, it } from "vitest";

import {
  addVat,
  currencyLabel,
  describeTotal,
  makeConverter,
  parseExchangeRate,
  formatMoney,
  formatVatRate,
  parseAmount,
  parseVatRate,
  standardVatRate,
  splitVat,
} from "@/domain/billing/money";
import { paymentMethodLabel, paymentTotals } from "@/domain/billing/payments";
import {
  countryFromAcceptLanguage,
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
  });

  it("propose le taux normal du pays quand on coche « Appliquer la TVA » (D-163)", () => {
    expect(standardVatRate("BE")).toBe(21);
    expect(standardVatRate("CH")).toBe(8.1);
    expect(standardVatRate("XX")).toBeNull();
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
});

describe("inscription : étape « Pays et devise » (D-163)", () => {
  const base = { country: "FR", currency: "EUR" };

  it("garde le pays et la devise, sans question sur la TVA", () => {
    expect(parseBillingSetup(base)).toEqual({
      ok: true,
      setup: { country: "FR", currency: "EUR" },
    });
  });

  it("refuse un pays ou une devise inconnus", () => {
    expect(parseBillingSetup({ ...base, country: "XX" }).ok).toBe(false);
    expect(parseBillingSetup({ ...base, currency: "JPY" }).ok).toBe(false);
  });
});

describe("changement de devise (D-70)", () => {
  const changes = [{ from: "EUR" as const, to: "CHF" as const, rate: 0.94 }];

  it("lit un taux de change", () => {
    expect(parseExchangeRate("0,94")).toBe(0.94);
    expect(parseExchangeRate("1.082512")).toBe(1.082512);
    expect(parseExchangeRate("0")).toBeNull();
    expect(parseExchangeRate("0,1234567")).toBeNull();
    expect(parseExchangeRate("")).toBeNull();
  });

  it("convertit avec le taux saisi, dans les deux sens et en chaîne", () => {
    const toChf = makeConverter("CHF", changes);
    expect(toChf(10_000, "EUR")).toBe(9400);
    expect(toChf(10_000, "CHF")).toBe(10_000);
    expect(makeConverter("EUR", changes)(9400, "CHF")).toBe(10_000);
    const toGbp = makeConverter("GBP", [...changes, { from: "CHF", to: "GBP", rate: 0.9 }]);
    expect(toGbp(10_000, "EUR")).toBe(8460);
  });

  it("additionne un mois mélangé : total ≈ converti, détail par devise", () => {
    const payments = [
      { receivedOn: "2026-10-05", amountCents: 12100, vatRate: 21, currency: "EUR" as const },
      { receivedOn: "2026-10-20", amountCents: 10810, vatRate: 8.1, currency: "CHF" as const },
    ];
    const totals = paymentTotals(
      payments,
      "2026-10-01",
      "2026-10-31",
      makeConverter("CHF", changes),
    );
    expect(totals.inclCents).toBe(11374 + 10810);
    expect(totals.byCurrency).toEqual({ EUR: 12100, CHF: 10810 });
    const shown = describeTotal(totals.inclCents, totals.byCurrency, "CHF");
    expect(shown.approximate).toBe(true);
    expect(plain(shown.value)).toBe("≈ 221,84 CHF");
    expect(plain(shown.detail ?? "")).toBe("121,00 € + 108,10 CHF");
  });

  it("un total dans une seule devise reste exact", () => {
    const shown = describeTotal(10810, { CHF: 10810 }, "CHF");
    expect(shown).toMatchObject({ approximate: false, detail: null });
    expect(plain(shown.value)).toBe("108,10 CHF");
  });
});
