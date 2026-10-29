import { describe, expect, it } from "vitest";

import {
  addressLines,
  defaultInvoiceLabel,
  invoiceFileName,
  invoiceTotals,
  vatMention,
  vatRateFor,
} from "@/domain/billing/invoice-document";

describe("Document d'une facture émise (D-65)", () => {
  it("déduit HTVA et TVA du montant reçu, total exact", () => {
    expect(invoiceTotals(7865, 21)).toEqual({ exclCents: 6500, vatCents: 1365, inclCents: 7865 });
    expect(invoiceTotals(5000, 0)).toEqual({ exclCents: 5000, vatCents: 0, inclCents: 5000 });
  });

  it("une structure non assujettie ne facture pas de TVA", () => {
    expect(vatRateFor("subject", 21)).toBe(21);
    expect(vatRateFor("franchise", 21)).toBe(0);
    expect(vatRateFor("not_subject", 6)).toBe(0);
    expect(vatMention("subject")).toBeNull();
    expect(vatMention("franchise")).toMatch(/franchise/);
    expect(vatMention("not_subject")).toMatch(/non assujettie/);
  });

  it("écrit l'adresse sur deux lignes, le pays seulement hors Belgique", () => {
    expect(
      addressLines({
        addressLine: "Rue de l'Exemple 1",
        postalCode: "1000",
        city: "Bruxelles",
        country: "BE",
      }),
    ).toEqual(["Rue de l'Exemple 1", "1000 Bruxelles"]);
    expect(
      addressLines({ addressLine: null, postalCode: null, city: "Lille", country: "FR" }),
    ).toEqual(["Lille", "FR"]);
    expect(
      addressLines({ addressLine: null, postalCode: null, city: null, country: null }),
    ).toEqual([]);
  });

  it("nomme le fichier et propose un libellé", () => {
    expect(invoiceFileName("FAC-2026-0001")).toBe("facture-FAC-2026-0001.pdf");
    expect(invoiceFileName(null)).toBe("brouillon-facture.pdf");
    expect(defaultInvoiceLabel("Forfait 3 mois")).toBe("Forfait 3 mois");
    expect(defaultInvoiceLabel("  ")).toBe("Coaching sportif");
    expect(defaultInvoiceLabel(null)).toBe("Coaching sportif");
  });
});
