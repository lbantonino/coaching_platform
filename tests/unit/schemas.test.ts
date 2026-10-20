import { describe, expect, it } from "vitest";

import { newAthleteSchema } from "@/features/athletes/schemas";
import { loginSchema, newPasswordSchema, PASSWORD_MIN_LENGTH } from "@/features/auth/schemas";

describe("newAthleteSchema (fiche sportif)", () => {
  it("accepte un nom seul et transforme les champs vides en null", () => {
    const result = newAthleteSchema.parse({
      displayName: "  Camille Test  ",
      email: "",
      phone: " ",
    });
    expect(result).toEqual({ displayName: "Camille Test", email: null, phone: null });
  });

  it("refuse un nom vide", () => {
    const result = newAthleteSchema.safeParse({ displayName: "   ", email: "", phone: "" });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe("Le nom est obligatoire.");
  });

  it("refuse un e-mail invalide mais accepte un e-mail valide", () => {
    expect(
      newAthleteSchema.safeParse({ displayName: "A", email: "pas-un-email", phone: "" }).success,
    ).toBe(false);
    expect(
      newAthleteSchema.safeParse({ displayName: "A", email: "a@example.test", phone: "" }).success,
    ).toBe(true);
  });

  it("accepte un téléphone international et refuse des lettres", () => {
    expect(
      newAthleteSchema.safeParse({ displayName: "A", email: "", phone: "+32 470 12 34 56" })
        .success,
    ).toBe(true);
    expect(
      newAthleteSchema.safeParse({ displayName: "A", email: "", phone: "appelle-moi" }).success,
    ).toBe(false);
  });
});

describe("loginSchema", () => {
  it("exige un e-mail valide et un mot de passe non vide", () => {
    expect(loginSchema.safeParse({ email: "coach@example.test", password: "x" }).success).toBe(
      true,
    );
    expect(loginSchema.safeParse({ email: "coach", password: "x" }).success).toBe(false);
    expect(loginSchema.safeParse({ email: "coach@example.test", password: "" }).success).toBe(
      false,
    );
  });
});

describe("newPasswordSchema", () => {
  it(`exige au moins ${PASSWORD_MIN_LENGTH} caractères`, () => {
    const short = "a".repeat(PASSWORD_MIN_LENGTH - 1);
    expect(newPasswordSchema.safeParse({ password: short, confirmation: short }).success).toBe(
      false,
    );
    const ok = "a".repeat(PASSWORD_MIN_LENGTH);
    expect(newPasswordSchema.safeParse({ password: ok, confirmation: ok }).success).toBe(true);
  });

  it("refuse deux mots de passe différents, avec l'erreur sur la confirmation", () => {
    const result = newPasswordSchema.safeParse({
      password: "motdepasse-1",
      confirmation: "motdepasse-2",
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(["confirmation"]);
  });
});
