import { describe, expect, it } from "vitest";

import { initials } from "@/components/ui/avatar";
import { athleteListFilterSchema, athleteUpdateSchema } from "@/features/athletes/schemas";

describe("athleteUpdateSchema", () => {
  const base = { displayName: "Camille Test", email: "", phone: "" };

  it("accepte les trois statuts et refuse les autres", () => {
    for (const status of ["active", "paused", "archived"]) {
      expect(athleteUpdateSchema.safeParse({ ...base, status }).success).toBe(true);
    }
    expect(athleteUpdateSchema.safeParse({ ...base, status: "deleted" }).success).toBe(false);
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
