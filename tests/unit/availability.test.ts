import { describe, expect, it } from "vitest";

import { availabilitySchema } from "@/features/athletes/schemas";
import { consentErrorMessage, consentEventLabel } from "@/features/consents/schemas";

const base = {
  sessionsPerWeek: "",
  maxSessionMinutes: "",
  availableDays: [] as string[],
  scheduleConstraints: "",
  healthConstraints: "",
};

describe("availabilitySchema (disponibilités)", () => {
  it("transforme les champs vides en null", () => {
    expect(availabilitySchema.parse(base)).toEqual({
      sessionsPerWeek: null,
      maxSessionMinutes: null,
      availableDays: [],
      scheduleConstraints: null,
      healthConstraints: null,
    });
  });

  it("lit les nombres et remet les jours dans l'ordre de la semaine, sans doublon", () => {
    const result = availabilitySchema.parse({
      ...base,
      sessionsPerWeek: "3",
      maxSessionMinutes: " 60 ",
      availableDays: ["sat", "mon", "wed", "mon"],
    });
    expect(result).toMatchObject({
      sessionsPerWeek: 3,
      maxSessionMinutes: 60,
      availableDays: ["mon", "wed", "sat"],
    });
  });

  it("refuse les valeurs hors limites ou non entières", () => {
    expect(availabilitySchema.safeParse({ ...base, sessionsPerWeek: "0" }).success).toBe(false);
    expect(availabilitySchema.safeParse({ ...base, sessionsPerWeek: "2.5" }).success).toBe(false);
    expect(availabilitySchema.safeParse({ ...base, sessionsPerWeek: "trois" }).success).toBe(false);
    expect(availabilitySchema.safeParse({ ...base, maxSessionMinutes: "5" }).success).toBe(false);
    expect(availabilitySchema.safeParse({ ...base, maxSessionMinutes: "400" }).success).toBe(false);
    expect(availabilitySchema.safeParse({ ...base, availableDays: ["funday"] }).success).toBe(
      false,
    );
  });

  it("limite les contraintes physiques à 300 caractères (texte court, sans dossier médical)", () => {
    expect(
      availabilitySchema.safeParse({ ...base, healthConstraints: "x".repeat(301) }).success,
    ).toBe(false);
    expect(
      availabilitySchema.parse({ ...base, healthConstraints: "  Genou droit sensible  " })
        .healthConstraints,
    ).toBe("Genou droit sensible");
  });
});

describe("journal des accords", () => {
  it("dit qui a donné ou retiré l'accord, et comment", () => {
    expect(consentEventLabel("granted", "athlete", null)).toBe(
      "Accord donné par le sportif depuis son espace",
    );
    expect(consentEventLabel("granted", "coach", "signed_form")).toBe(
      "Accord donné, noté par le coach (formulaire signé)",
    );
    expect(consentEventLabel("withdrawn", "coach", null)).toBe("Accord retiré, noté par le coach");
  });

  it("traduit les codes d'erreur des fonctions SQL", () => {
    expect(consentErrorMessage("preuve_invalide")).toBe(
      "Indique comment le sportif a donné son accord.",
    );
    expect(consentErrorMessage("acces_refuse")).toBe("Action non autorisée.");
    expect(consentErrorMessage(undefined)).toMatch(/Réessaie/);
  });
});
