import { describe, expect, it } from "vitest";

import { onboardingSchema, signupSchema } from "@/features/auth/signup-schemas";

const base = {
  kind: "coach",
  firstName: " Léa ",
  lastName: "Martin",
  email: "lea@example.test",
  phone: "",
  organizationName: "",
  password: "un-mot-de-passe-solide",
  confirmation: "un-mot-de-passe-solide",
  terms: "on",
};

describe("signupSchema", () => {
  it("accepte une inscription complète et nettoie les champs facultatifs", () => {
    const result = signupSchema.safeParse(base);
    expect(result.success && result.data).toMatchObject({
      firstName: "Léa",
      phone: null,
      organizationName: null,
    });
  });

  it("normalise un téléphone belge saisi avec des barres ou des points", () => {
    const result = signupSchema.safeParse({ ...base, phone: "0470/12.34.56" });
    expect(result.success && result.data.phone).toBe("0470 12 34 56");
    expect(signupSchema.safeParse({ ...base, phone: "appelle-moi" }).success).toBe(false);
  });

  it("refuse des mots de passe différents, trop courts, ou des conditions non acceptées", () => {
    const mismatch = signupSchema.safeParse({ ...base, confirmation: "autre-mot-de-passe" });
    expect(mismatch.success).toBe(false);
    expect(mismatch.error?.issues[0]?.message).toBe("Les deux mots de passe ne correspondent pas.");
    expect(
      signupSchema.safeParse({ ...base, password: "court", confirmation: "court" }).success,
    ).toBe(false);
    const noTerms = signupSchema.safeParse({ ...base, terms: undefined });
    expect(noTerms.error?.issues[0]?.message).toBe(
      "Accepte les conditions d'utilisation et la politique de confidentialité.",
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
