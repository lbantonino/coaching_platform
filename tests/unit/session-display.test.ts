import { describe, expect, it } from "vitest";

import { parseProgramSession } from "@/domain/training/program-session";
import {
  parseMinutes,
  parseSegment,
  sessionTimeline,
  stepLine,
  stepMinutes,
} from "@/features/programs/session-display";

// La séance « Endurance rapide » des données de démo (programme d'Inès, semaine 1).
const enduranceRapide = parseProgramSession({
  title: "Endurance rapide",
  discipline: "running",
  sessionType: "Intervalles",
  durationMinutes: 60,
  steps: [
    { title: "Échauffement", badge: "20 min", lines: ["20 min @6:00 min/km, allure progressive"] },
    {
      title: "Bloc principal",
      badge: "5 × 4 min",
      lines: ["5 répétitions de 4 min à 4:55 min/km"],
      repeat: { times: 5, lines: ["4 min @4:55 min/km", "1:45 min de récupération (trot lent)"] },
    },
    { title: "Retour au calme", badge: "5 min", lines: ["5 min @6:35 min/km"] },
  ],
})!;

describe("lecture des lignes d'une séance (page 2d)", () => {
  it("lit les durées écrites", () => {
    expect(parseMinutes("20 min")).toBe(20);
    expect(parseMinutes("1:45 min")).toBe(1.75);
    expect(parseMinutes("1 h")).toBe(60);
    expect(parseMinutes("1 h 20")).toBe(80);
    expect(parseMinutes("5 × 4 min")).toBeNull();
    expect(parseMinutes("3 tours")).toBeNull();
  });

  it("découpe un effort, une distance, une récupération et un exercice", () => {
    expect(parseSegment("4 min @4:55 min/km")).toEqual({
      kind: "effort",
      label: "Effort",
      detail: "4:55 min/km",
      value: "4 min",
      minutes: 4,
    });
    expect(parseSegment("Run 1 km @5:15 min/km")).toMatchObject({
      label: "Run",
      detail: "5:15 min/km",
      value: "1 km",
      minutes: 5.25,
    });
    expect(parseSegment("1:45 min de récupération (trot lent)")).toEqual({
      kind: "recovery",
      label: "Récupération",
      detail: "Trot lent",
      value: "1:45 min",
      minutes: 1.75,
    });
    expect(parseSegment("Goblet squat · 10")).toMatchObject({
      label: "Goblet squat",
      value: "10",
      minutes: null,
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

  it("calcule le déroulé : 20 + 5 × (4 + 1:45) + 5 ≈ 54 min", () => {
    expect(stepMinutes(enduranceRapide.steps[1])).toBe(28.75);
    const timeline = sessionTimeline(enduranceRapide)!;
    expect(timeline.totalMinutes).toBe(53.75);
    expect(timeline.effort).toBe("4:55/km");
    // Légende courte, comme la maquette : « Récup · trot ».
    expect(timeline.recovery).toBe("trot");
    // 5 efforts et 4 récupérations : la dernière, juste avant le retour au calme, n'est pas dessinée.
    expect(timeline.steps[1].bars).toHaveLength(9);
    expect(timeline.steps[1].recovery).toBe("1:45");
    expect(timeline.steps.map((step) => step.role)).toEqual(["warmup", "main", "cooldown"]);
  });

  it("ne dessine pas de déroulé si une durée manque", () => {
    const circuit = parseProgramSession({
      ...enduranceRapide,
      steps: [{ title: "Circuit", badge: "3 tours", lines: [], repeat: undefined }],
    })!;
    expect(sessionTimeline(circuit)).toBeNull();
  });
});
