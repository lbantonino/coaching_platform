import { describe, expect, it } from "vitest";

import { parseSegment, stepLine, stepRole } from "@/features/programs/session-display";

describe("lecture des lignes d'une séance (page 2d)", () => {
  it("découpe un effort, une distance, une récupération et un exercice", () => {
    expect(parseSegment("4 min @4:55 min/km")).toEqual({
      kind: "effort",
      label: "Effort",
      detail: "4:55 min/km",
      value: "4 min",
    });
    expect(parseSegment("Run 1 km @5:15 min/km")).toMatchObject({
      label: "Run",
      detail: "5:15 min/km",
      value: "1 km",
    });
    expect(parseSegment("1:45 min de récupération (trot lent)")).toEqual({
      kind: "recovery",
      label: "Récupération",
      detail: "Trot lent",
      value: "1:45 min",
    });
    expect(parseSegment("Goblet squat · 10")).toMatchObject({
      label: "Goblet squat",
      value: "10",
    });
    // Une ligne non comprise reste telle quelle.
    expect(parseSegment("Retour en marchant")).toMatchObject({
      kind: "recovery",
      label: "Retour en marchant",
      value: null,
    });
  });

  it("retire la durée déjà écrite à droite de l'étape", () => {
    expect(stepLine("20 min @6:00 min/km, allure progressive", "20 min")).toBe(
      "À 6:00 min/km, allure progressive",
    );
    expect(stepLine("Étirements doux, respiration", "5 min")).toBe("Étirements doux, respiration");
  });

  it("reconnaît l'échauffement et le retour au calme", () => {
    const step = (title: string) => ({ title, lines: [] });
    expect(stepRole(step("Échauffement"))).toBe("warmup");
    expect(stepRole(step("Retour au calme"))).toBe("cooldown");
    expect(stepRole(step("Bloc principal"))).toBe("main");
  });
});
