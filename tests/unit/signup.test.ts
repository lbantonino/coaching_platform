import { describe, expect, it } from "vitest";

import { onboardingSchema, signupSchema } from "@/features/auth/signup-schemas";

const base = {
  kind: "coach",
  firstName: " Léa ",
  lastName: "Martin",
  email: "lea@example.test",
  password: "un-mot-de-passe-solide",
  accessCode: " coory-dev-2026 ",
  terms: "on",
};

// Inscription de la maquette du 06/11/2026 (D-139, D-140) : plus de téléphone, d'entreprise ni de
// confirmation du mot de passe ; un code d'accès (vérifié ensuite par Supabase).
describe("signupSchema", () => {
  it("accepte une inscription complète, nettoie le prénom et normalise le code d'accès", () => {
    const result = signupSchema.safeParse(base);
    expect(result.success && result.data).toMatchObject({
      firstName: "Léa",
      accessCode: "COORY-DEV-2026",
    });
  });

  it("exige le code d'accès", () => {
    const missing = signupSchema.safeParse({ ...base, accessCode: "   " });
    expect(missing.error?.issues[0]?.message).toBe("Indique ton code d'accès.");
  });

  it("refuse un mot de passe trop court ou des conditions non acceptées", () => {
    expect(signupSchema.safeParse({ ...base, password: "court" }).success).toBe(false);
    const noTerms = signupSchema.safeParse({ ...base, terms: undefined });
    expect(noTerms.error?.issues[0]?.message).toBe(
      "Tu dois accepter les conditions pour continuer.",
    );
  });

  it("exige le type de compte, le prénom et le nom", () => {
    expect(signupSchema.safeParse({ ...base, kind: "admin" }).success).toBe(false);
    expect(signupSchema.safeParse({ ...base, lastName: "  " }).error?.issues[0]?.message).toBe(
      "Indique ton nom.",
    );
  });
});

describe("onboardingSchema", () => {
  it("demande les mêmes informations sans e-mail ni mot de passe", () => {
    const result = onboardingSchema.safeParse({
      kind: "athlete",
      firstName: "Sam",
      lastName: "Lefort",
      phone: "+32 470 12 34 56",
      organizationName: "",
      terms: "on",
    });
    expect(result.success && result.data).toMatchObject({
      kind: "athlete",
      phone: "+32 470 12 34 56",
    });
  });
});
