import { describe, expect, it } from "vitest";

import { newAthleteSchema } from "@/features/athletes/schemas";
import { loginSchema, newPasswordSchema, PASSWORD_MIN_LENGTH } from "@/features/auth/schemas";

describe("newAthleteSchema (fiche sportif)", () => {
  const base = { firstName: "Camille", lastName: "", email: "", phone: "" };

  it("accepte un prénom seul et transforme les champs vides en null", () => {
    const result = newAthleteSchema.parse({
      firstName: "  Camille  ",
      lastName: " ",
      email: "",
      phone: " ",
    });
    expect(result).toEqual({
      firstName: "Camille",
      lastName: null,
      email: null,
      phone: null,
      sex: null,
    });
  });

  it("garde le nom de famille, sans espaces autour", () => {
    expect(newAthleteSchema.parse({ ...base, lastName: "  De Smet " }).lastName).toBe("De Smet");
  });

  it("refuse un prénom vide", () => {
    const result = newAthleteSchema.safeParse({ ...base, firstName: "   " });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe("Le prénom est obligatoire.");
  });

  it("refuse un prénom ou un nom de plus de 80 caractères", () => {
    expect(newAthleteSchema.safeParse({ ...base, firstName: "x".repeat(81) }).success).toBe(false);
    expect(newAthleteSchema.safeParse({ ...base, lastName: "x".repeat(81) }).success).toBe(false);
  });

  it("refuse un e-mail invalide mais accepte un e-mail valide", () => {
    expect(newAthleteSchema.safeParse({ ...base, email: "pas-un-email" }).success).toBe(false);
    expect(newAthleteSchema.safeParse({ ...base, email: "a@example.test" }).success).toBe(true);
  });

  it("accepte le sexe de la liste (ou non renseigné) et refuse le reste", () => {
    expect(newAthleteSchema.parse({ ...base, sex: "female" }).sex).toBe("female");
    expect(newAthleteSchema.parse({ ...base, sex: "" }).sex).toBeNull();
    expect(newAthleteSchema.safeParse({ ...base, sex: "robot" }).success).toBe(false);
  });

  it("accepte un téléphone international et refuse des lettres", () => {
    expect(newAthleteSchema.safeParse({ ...base, phone: "+32 470 12 34 56" }).success).toBe(true);
    expect(newAthleteSchema.safeParse({ ...base, phone: "appelle-moi" }).success).toBe(false);
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

describe("messages du prototype Claude Design (§7.1)", () => {
  it("distingue une adresse vide d'une adresse mal formée", () => {
    expect(loginSchema.safeParse({ email: "", password: "x" }).error?.issues[0]?.message).toBe(
      "Indique ton adresse e-mail.",
    );
    expect(loginSchema.safeParse({ email: "coach", password: "x" }).error?.issues[0]?.message).toBe(
      "Cette adresse e-mail ne semble pas valide.",
    );
    expect(
      loginSchema.safeParse({ email: "coach@example.test", password: "" }).error?.issues[0]
        ?.message,
    ).toBe("Indique ton mot de passe.");
  });

  it("demande un mot de passe, puis au moins 10 caractères", () => {
    const empty = newPasswordSchema.safeParse({ password: "", confirmation: "" });
    expect(empty.error?.issues[0]?.message).toBe("Choisis un mot de passe.");
    const short = newPasswordSchema.safeParse({ password: "court", confirmation: "court" });
    expect(short.error?.issues[0]?.message).toBe("Au moins 10 caractères, s'il te plaît.");
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
