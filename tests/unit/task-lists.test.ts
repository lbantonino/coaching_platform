import { describe, expect, it } from "vitest";

import { LIST_COLORS, listNameSchema, nextListColor } from "@/domain/tasks/lists";

// Listes de tâches (kit « Coory Pages », 01, D-129).
describe("listes de tâches", () => {
  it("donne à une nouvelle liste la première couleur libre de la palette", () => {
    expect(nextListColor([])).toBe("indigo");
    expect(nextListColor(["indigo", "amber"])).toBe("teal");
    expect(nextListColor(["amber"])).toBe("indigo");
  });

  it("recommence la palette quand toutes les couleurs sont prises", () => {
    expect(nextListColor([...LIST_COLORS])).toBe("indigo");
    expect(nextListColor([...LIST_COLORS, "indigo"])).toBe("amber");
  });

  it("refuse un nom vide ou trop long, garde un nom nettoyé", () => {
    expect(listNameSchema.safeParse("   ").success).toBe(false);
    expect(listNameSchema.safeParse("a".repeat(41)).success).toBe(false);
    expect(listNameSchema.parse("  Bilans  ")).toBe("Bilans");
  });
});
