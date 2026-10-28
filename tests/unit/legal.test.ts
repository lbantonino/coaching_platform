import { describe, expect, it } from "vitest";

import {
  formatEnterpriseNumber,
  formatIban,
  normalizeBic,
  normalizeEnterpriseNumber,
  normalizeIban,
  vatNumberFor,
} from "@/domain/billing/legal";

// Structures légales (D-57) : numéros belges vérifiés par leur clé de contrôle, pas seulement leur forme.
describe("numéro d'entreprise (BCE)", () => {
  it("accepte un numéro valide, quelle que soit la saisie", () => {
    // 01234567 modulo 97 = 48 ; 97 - 48 = 49.
    expect(normalizeEnterpriseNumber("0123.456.749")).toBe("0123456749");
    expect(normalizeEnterpriseNumber("BE 0123 456 749")).toBe("0123456749");
    expect(normalizeEnterpriseNumber("123456749")).toBe("0123456749");
  });

  it("refuse une clé de contrôle fausse ou un format impossible", () => {
    expect(normalizeEnterpriseNumber("0123.456.748")).toBeNull();
    expect(normalizeEnterpriseNumber("2123456749")).toBeNull();
    expect(normalizeEnterpriseNumber("abc")).toBeNull();
  });

  it("met en forme et donne le numéro de TVA", () => {
    expect(formatEnterpriseNumber("0123456749")).toBe("0123.456.749");
    expect(vatNumberFor("0123456749")).toBe("BE0123456749");
  });
});

describe("IBAN et BIC", () => {
  it("vérifie la clé de contrôle de l'IBAN", () => {
    expect(normalizeIban("be68 5390 0754 7034")).toBe("BE68539007547034");
    expect(normalizeIban("BE68 5390 0754 7035")).toBeNull();
    expect(normalizeIban("BE68 5390 0754 703")).toBeNull();
    expect(normalizeIban("FR14 2004 1010 0505 0001 3M02 606")).toBe("FR1420041010050500013M02606");
  });

  it("met l'IBAN en forme par groupes de 4", () => {
    expect(formatIban("BE68539007547034")).toBe("BE68 5390 0754 7034");
  });

  it("accepte un BIC de 8 ou 11 caractères", () => {
    expect(normalizeBic("gebabebb")).toBe("GEBABEBB");
    expect(normalizeBic("GKCCBEBBXXX")).toBe("GKCCBEBBXXX");
    expect(normalizeBic("GEB")).toBeNull();
  });
});
