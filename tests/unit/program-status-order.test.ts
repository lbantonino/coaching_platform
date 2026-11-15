import { describe, expect, it } from "vitest";

import { sortAthletePrograms, type ProgramListStatus } from "@/domain/training/program-status";

// Onglet Programme de la fiche (15/11/2026) : les cartes des programmes du sportif, dans un ordre utile.
describe("onglet Programme : l'ordre des cartes d'un sportif", () => {
  it("en cours, à venir, brouillons, terminés, archivés ; le plus récent d'abord dans chaque groupe", () => {
    const card = (id: string, status: ProgramListStatus, updatedAt: string) => ({
      id,
      status,
      updatedAt,
    });
    const sorted = sortAthletePrograms([
      card("ancien", "finished", "2026-10-01T10:00:00Z"),
      card("archive", "archived", "2026-11-10T10:00:00Z"),
      card("brouillon", "draft", "2026-11-12T10:00:00Z"),
      card("bloc-2", "upcoming", "2026-11-01T10:00:00Z"),
      card("termine-recent", "finished", "2026-11-05T10:00:00Z"),
      card("bloc-1", "current", "2026-09-01T10:00:00Z"),
    ]);
    expect(sorted.map((item) => item.id)).toEqual([
      "bloc-1",
      "bloc-2",
      "brouillon",
      "termine-recent",
      "ancien",
      "archive",
    ]);
  });
});
