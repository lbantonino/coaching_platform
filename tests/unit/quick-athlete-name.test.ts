import { describe, expect, it } from "vitest";

import { quickAthleteName } from "@/features/athletes/quick-name";

// Nouveau sportif tapé dans « Créer un programme » (règle d'Antonino du 24/11/2026) : un seul mot est le
// prénom (traits d'union compris) ; avec deux mots ou plus, le premier est le prénom, la suite le nom.
describe("nom d'un nouveau sportif tapé dans la liste", () => {
  it("un seul mot, même avec un trait d'union : le prénom, sans nom de famille", () => {
    expect(quickAthleteName("Jean-Baptiste")).toEqual({
      ok: true,
      firstName: "Jean-Baptiste",
      lastName: "",
    });
  });

  it("deux mots ou plus : le premier est le prénom, la suite le nom", () => {
    expect(quickAthleteName("Antonino Lobianco")).toEqual({
      ok: true,
      firstName: "Antonino",
      lastName: "Lobianco",
    });
    expect(quickAthleteName("  Antonino   Lo   Bianco ")).toEqual({
      ok: true,
      firstName: "Antonino",
      lastName: "Lo Bianco",
    });
  });

  it("vide ou trop long : refusé, avec la raison", () => {
    expect(quickAthleteName("   ")).toEqual({ ok: false, error: "Écris le prénom du sportif." });
    expect(quickAthleteName("a".repeat(81))).toEqual({
      ok: false,
      error: "Le prénom est trop long (80 caractères maximum).",
    });
    expect(quickAthleteName(`Antonino ${"b".repeat(81)}`)).toEqual({
      ok: false,
      error: "Le nom est trop long (80 caractères maximum).",
    });
  });
});
