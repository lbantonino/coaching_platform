import { describe, expect, it } from "vitest";

import { checkField } from "@/lib/field-checks";

// Contrôle d'un champ quand on le quitte (audit apple-design, 28/10) : mêmes règles que le serveur.
describe("checkField", () => {
  const today = "2026-10-28";

  it("ne signale jamais un champ vide (l'obligatoire se vérifie à l'envoi)", () => {
    for (const rule of ["email", "phone", "future-date", "amount"] as const) {
      expect(checkField(rule, "  ", today)).toBeNull();
    }
  });

  it("vérifie l'e-mail et le téléphone", () => {
    expect(checkField("email", "camille@example.test", today)).toBeNull();
    expect(checkField("email", "camille@", today)).toBe("Adresse e-mail invalide.");
    expect(checkField("phone", "+32 470 12 34 56", today)).toBeNull();
    expect(checkField("phone", "appelle-moi", today)).toMatch(/^Numéro de téléphone invalide/);
  });

  it("refuse une date passée et un montant illisible", () => {
    expect(checkField("future-date", "2026-10-28", today)).toBeNull();
    expect(checkField("future-date", "2026-10-27", today)).toBe("Cette date est déjà passée.");
    expect(checkField("amount", "65,50", today)).toBeNull();
    expect(checkField("amount", "abc", today)).toMatch(/^Montant invalide/);
  });
});
