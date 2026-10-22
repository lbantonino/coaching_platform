import { describe, expect, it } from "vitest";

import { initials } from "@/components/ui/avatar";
import { athleteListFilterSchema, athleteUpdateSchema } from "@/features/athletes/schemas";

describe("athleteUpdateSchema", () => {
  const base = {
    firstName: "Camille",
    lastName: "Test",
    sex: "",
    email: "",
    phone: "",
    status: "active",
    preferredContact: "",
    level: "",
    experience: "",
    trainingPlaces: [],
    equipment: "",
  };

  it("accepte les trois statuts et refuse les autres", () => {
    for (const status of ["active", "paused", "archived"]) {
      expect(athleteUpdateSchema.safeParse({ ...base, status }).success).toBe(true);
    }
    expect(athleteUpdateSchema.safeParse({ ...base, status: "deleted" }).success).toBe(false);
  });

  it("transforme les choix non précisés en null", () => {
    const result = athleteUpdateSchema.parse(base);
    expect(result.preferredContact).toBeNull();
    expect(result.level).toBeNull();
    expect(result.experience).toBeNull();
    expect(result.equipment).toBeNull();
    expect(result.trainingPlaces).toEqual([]);
  });

  it("accepte le profil sportif complet", () => {
    const result = athleteUpdateSchema.parse({
      ...base,
      preferredContact: "whatsapp",
      level: "intermediate",
      experience: " Course depuis 3 ans ",
      trainingPlaces: ["gym", "outdoor"],
      equipment: "Haltères 20 kg",
    });
    expect(result).toMatchObject({
      preferredContact: "whatsapp",
      level: "intermediate",
      experience: "Course depuis 3 ans",
      trainingPlaces: ["gym", "outdoor"],
      equipment: "Haltères 20 kg",
    });
  });

  it("refuse une valeur hors des listes (formulaire bricolé)", () => {
    expect(athleteUpdateSchema.safeParse({ ...base, preferredContact: "pigeon" }).success).toBe(
      false,
    );
    expect(athleteUpdateSchema.safeParse({ ...base, level: "légende" }).success).toBe(false);
    expect(
      athleteUpdateSchema.safeParse({ ...base, trainingPlaces: ["gym", "lune"] }).success,
    ).toBe(false);
  });

  it("ne compte qu'une fois un lieu coché deux fois", () => {
    expect(
      athleteUpdateSchema.parse({ ...base, trainingPlaces: ["gym", "gym"] }).trainingPlaces,
    ).toEqual(["gym"]);
  });

  it("limite l'expérience et le matériel à 500 caractères", () => {
    expect(athleteUpdateSchema.safeParse({ ...base, experience: "x".repeat(501) }).success).toBe(
      false,
    );
    expect(athleteUpdateSchema.safeParse({ ...base, equipment: "x".repeat(501) }).success).toBe(
      false,
    );
  });
});

describe("athleteListFilterSchema (valeurs venant de l'URL)", () => {
  it("met le texte de recherche en minuscules et sans espaces autour", () => {
    expect(athleteListFilterSchema.parse({ status: "all", q: "  CaMille " })).toEqual({
      status: "all",
      q: "camille",
    });
  });

  it("retombe sur des valeurs sûres si l'URL est fantaisiste", () => {
    expect(athleteListFilterSchema.parse({ status: "n'importe-quoi", q: 42 })).toEqual({
      status: "active",
      q: "",
    });
    expect(athleteListFilterSchema.parse({ status: "active", q: "x".repeat(200) }).q).toBe("");
  });
});

describe("initials (avatar)", () => {
  it("prend la première et la dernière initiale", () => {
    expect(initials("Camille Moreau")).toBe("CM");
    expect(initials("Jean Pierre Dupont")).toBe("JD");
    expect(initials("  camille  ")).toBe("CA");
    expect(initials("")).toBe("?");
  });
});
