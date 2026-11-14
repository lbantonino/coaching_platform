import { describe, expect, it } from "vitest";

import { compareTemplateCards } from "@/domain/training/template-order";

// Ordre de l'onglet Modèles (D-177) : les modèles Coory sont posés en même temps (même date), leur
// ordre est donc fixé : course du 5 km au marathon puis seuil et vitesse, musculation, Hyrox, hybride.
const coory = (n: number) => ({
  id: `7a000000-0000-4000-8000-${String(n).padStart(12, "0")}`,
  source: "coory" as const,
  kind: "program" as const,
  updatedAt: "2026-11-14T10:00:00Z",
});

describe("ordre des modèles", () => {
  it("les modèles de programme Coory suivent l'ordre de la liste validée", () => {
    const cards = [1, 2, 3, 4, 105, 106, 107, 108, 109, 110, 111].map(coory);
    expect([...cards].sort(compareTemplateCards).map((card) => Number(card.id.slice(-3)))).toEqual([
      105, 2, 3, 4, 106, 107, 108, 109, 1, 110, 111,
    ]);
  });

  it("Coory d'abord, programmes avant séances, puis les plus récents", () => {
    const mine = (id: string, kind: "program" | "session", updatedAt: string) => ({
      id,
      source: "mine" as const,
      kind,
      updatedAt,
    });
    const cards = [
      mine("a", "session", "2026-11-14T12:00:00Z"),
      mine("b", "program", "2026-11-13T12:00:00Z"),
      mine("c", "program", "2026-11-14T12:00:00Z"),
      { ...coory(99), kind: "session" as const },
      coory(105),
    ];
    expect([...cards].sort(compareTemplateCards).map((card) => card.id.slice(-3))).toEqual([
      "105",
      "099",
      "c",
      "b",
      "a",
    ]);
  });
});
