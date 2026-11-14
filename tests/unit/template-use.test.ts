import { describe, expect, it } from "vitest";

import { createProgramInputSchema } from "@/features/programs/schemas";
import { mondayOf, templateUseInput } from "@/features/programs/template-use";
import type { WizardAthlete, WizardTemplate } from "@/features/programs/wizard";

// « Utiliser ce modèle » en direct (demande d'Antonino du 14/11/2026, D-178) : depuis la page d'un
// modèle, on choisit le sportif et le programme se crée avec TOUT ce que dit le modèle (discipline,
// durée, rythme, phases) ; seuls la façon de viser et la catégorie Hyrox viennent du sportif.
const athlete: WizardAthlete = {
  id: "ab000000-0000-4000-8000-000000000001",
  name: "Lucas Janssens",
  firstName: "Lucas",
  photoPath: null,
  programType: "hybrid",
  sessionsPerWeek: 7,
  hasVma: true,
  hasHrMax: true,
  hasLinkedMaxes: false,
  defaultDivision: "men_open",
  programs: [],
};
const tenK: WizardTemplate = {
  id: "7a000000-0000-4000-8000-000000000002",
  title: "Préparation 10 km",
  source: "coory",
  discipline: "running",
  weeksCount: 8,
  sessionsPerWeek: 4,
  detail: "8 sem. · 4 séances / sem.",
};

describe("Utiliser un modèle en direct", () => {
  it("la discipline, la durée et le rythme viennent du modèle, pas du sportif", () => {
    const input = templateUseInput({
      template: tenK,
      athlete,
      title: "Préparation 10 km",
      startDate: "2026-11-16",
    });
    expect(input).toMatchObject({
      athleteId: athlete.id,
      title: "Préparation 10 km",
      discipline: "running",
      weeksCount: 8,
      sessionsPerWeek: 4,
      // Les phases du modèle sont reprises par le serveur quand on n'en donne pas.
      phases: [],
      scheduling: "ordered",
      start: { kind: "template", templateId: tenK.id },
      startDate: "2026-11-16",
    });
    expect(input.goal).toBeUndefined();
    expect(createProgramInputSchema.safeParse(input).success).toBe(true);
  });

  it("la façon de viser suit les repères du sportif (VMA connue : allure)", () => {
    const input = templateUseInput({
      template: tenK,
      athlete,
      title: "x",
      startDate: "2026-11-16",
    });
    expect(input.aimDefaults).toEqual({ running: "pace", strength: "kg" });
  });

  it("un modèle Hyrox reprend la catégorie du sportif (charges officielles)", () => {
    const input = templateUseInput({
      template: { ...tenK, discipline: "hyrox", weeksCount: 12 },
      athlete,
      title: "Préparation Hyrox",
      startDate: "2026-11-16",
    });
    expect(input.goal).toEqual({ hyroxDivision: "men_open" });
    expect(createProgramInputSchema.safeParse(input).success).toBe(true);
  });

  it("un modèle hybride donne un programme hybride", () => {
    const input = templateUseInput({
      template: { ...tenK, discipline: "hybrid", sessionsPerWeek: 5 },
      athlete,
      title: "  Hybride  ",
      startDate: "2026-11-16",
    });
    expect(input).toMatchObject({ discipline: "hybrid", sessionsPerWeek: 5, title: "Hybride" });
  });

  it("une date choisie revient au lundi de sa semaine (les semaines vont du lundi au dimanche)", () => {
    expect(mondayOf("2026-11-19")).toBe("2026-11-16");
    expect(mondayOf("2026-11-16")).toBe("2026-11-16");
    expect(mondayOf("2026-11-22")).toBe("2026-11-16");
  });
});
