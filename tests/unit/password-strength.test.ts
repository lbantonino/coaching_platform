import { describe, expect, it } from "vitest";

import { passwordStrength, STRENGTH_LABELS } from "@/components/ui/password-strength";

// Jauge de robustesse du prompt Claude Design §4 : +1 dès 10 caractères, +1 majuscules et
// minuscules, +1 chiffre, +1 symbole ; plafonnée à 1 sous 6 caractères.
describe("passwordStrength", () => {
  it("vaut 0 pour un mot de passe vide", () => {
    expect(passwordStrength("")).toBe(0);
  });

  it("plafonne à 1 sous 6 caractères, même avec chiffres et symboles", () => {
    expect(passwordStrength("Ab1!")).toBe(1);
  });

  it("additionne longueur, casse, chiffre et symbole", () => {
    expect(passwordStrength("coachingbx")).toBe(1);
    expect(passwordStrength("Coachingbx")).toBe(2);
    expect(passwordStrength("Behybrid2026")).toBe(3);
    expect(passwordStrength("Behybrid-2026")).toBe(4);
  });

  it("compte les lettres accentuées comme des lettres, pas comme des symboles", () => {
    expect(passwordStrength("ÉtéàBruxelles")).toBe(2);
  });

  it("a un libellé pour chaque niveau", () => {
    expect(STRENGTH_LABELS).toEqual(["Trop faible", "Faible", "Moyenne", "Bonne", "Excellente"]);
  });
});
