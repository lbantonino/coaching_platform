import { describe, expect, it } from "vitest";

import { parseProgramSession } from "@/domain/training/program-session";

const enduranceRapide = {
  title: "Endurance rapide",
  discipline: "running",
  sessionType: "Intervalles",
  durationMinutes: 60,
  objective: "Améliorer l'endurance à allure rapide",
  steps: [
    {
      title: "Échauffement",
      badge: "20 min",
      short: "20 min échauffement",
      lines: ["20 min @6:00"],
    },
    {
      title: "Bloc principal",
      badge: "4 × 5 min",
      short: "4 × 5 min @4:55 min/km",
      repeat: { times: 4, lines: ["5 min @4:55 min/km", "2 min de récupération (trot lent)"] },
    },
    { title: "Retour au calme", badge: "5 min", short: "5 min retour au calme" },
  ],
};

describe("parseProgramSession (contenu figé d'une séance de programme)", () => {
  it("lit une séance de course complète, lignes vides par défaut", () => {
    const session = parseProgramSession(enduranceRapide);
    expect(session?.title).toBe("Endurance rapide");
    expect(session?.steps[1].repeat?.times).toBe(4);
    expect(session?.steps[2].lines).toEqual([]);
  });

  it("écarte un contenu mal formé plutôt que de l'afficher de travers", () => {
    expect(parseProgramSession({ ...enduranceRapide, steps: [] })).toBeNull();
    expect(parseProgramSession({ ...enduranceRapide, discipline: "yoga" })).toBeNull();
    expect(parseProgramSession({ ...enduranceRapide, durationMinutes: 0 })).toBeNull();
    expect(parseProgramSession("Endurance rapide")).toBeNull();
  });
});
