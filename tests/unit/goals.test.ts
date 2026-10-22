import { describe, expect, it } from "vitest";

import { goalCountdown } from "@/features/goals/format";
import { goalDiscipline, parseGoalForm, type GoalFormInput } from "@/features/goals/schemas";
import { daysBetween } from "@/lib/format";

const TODAY = "2026-10-22";
const base: GoalFormInput = {
  goalType: "run_half",
  priority: "main",
  targetDate: "",
  isCompetition: false,
  competitionName: "",
  competitionLocation: "",
  hyroxCategory: "",
  description: "",
};

describe("parseGoalForm (objectifs et compétitions)", () => {
  it("accepte un objectif simple, sans date ni compétition", () => {
    const result = parseGoalForm(
      { ...base, goalType: "fitness", description: "  Tenir 45 min  " },
      TODAY,
    );
    expect(result).toEqual({
      ok: true,
      values: {
        goal_type: "fitness",
        priority: "main",
        target_date: null,
        competition_name: null,
        competition_location: null,
        hyrox_category: null,
        description: "Tenir 45 min",
      },
    });
  });

  it("exige un type d'objectif de la liste", () => {
    expect(parseGoalForm({ ...base, goalType: "" }, TODAY)).toEqual({
      ok: false,
      error: "Choisis le type d'objectif.",
    });
    expect(parseGoalForm({ ...base, goalType: "parachute" }, TODAY).ok).toBe(false);
  });

  it("refuse une date déjà passée mais accepte aujourd'hui", () => {
    expect(parseGoalForm({ ...base, targetDate: "2026-10-21" }, TODAY)).toEqual({
      ok: false,
      error: "La date de l'objectif est déjà passée.",
    });
    expect(parseGoalForm({ ...base, targetDate: TODAY }, TODAY).ok).toBe(true);
  });

  it("une compétition exige un nom et une date", () => {
    const competition = { ...base, isCompetition: true, targetDate: "2027-04-11" };
    expect(parseGoalForm({ ...competition, competitionName: " " }, TODAY)).toEqual({
      ok: false,
      error: "Indique le nom de la compétition.",
    });
    expect(
      parseGoalForm(
        { ...competition, competitionName: "Semi de printemps", targetDate: "" },
        TODAY,
      ),
    ).toEqual({ ok: false, error: "Une compétition a besoin d'une date." });
  });

  it("garde la catégorie Hyrox seulement pour un Hyrox", () => {
    const hyrox = parseGoalForm(
      {
        ...base,
        goalType: "hyrox",
        isCompetition: true,
        targetDate: "2027-03-20",
        competitionName: "Hyrox Bruxelles",
        competitionLocation: "Bruxelles",
        hyroxCategory: "pro",
      },
      TODAY,
    );
    expect(hyrox.ok && hyrox.values).toMatchObject({
      competition_name: "Hyrox Bruxelles",
      competition_location: "Bruxelles",
      hyrox_category: "pro",
    });

    const tenK = parseGoalForm(
      {
        ...base,
        goalType: "run_10k",
        isCompetition: true,
        targetDate: "2027-03-20",
        competitionName: "10 km",
        hyroxCategory: "pro",
      },
      TODAY,
    );
    expect(tenK.ok && tenK.values.hyrox_category).toBeNull();
  });

  it("ignore les champs de compétition quand la case n'est pas cochée", () => {
    const result = parseGoalForm(
      { ...base, competitionName: "Oublié", competitionLocation: "Gand" },
      TODAY,
    );
    expect(result.ok && result.values).toMatchObject({
      competition_name: null,
      competition_location: null,
    });
  });

  it("refuse une catégorie Hyrox inconnue", () => {
    expect(
      parseGoalForm(
        {
          ...base,
          goalType: "hyrox",
          isCompetition: true,
          targetDate: "2027-03-20",
          competitionName: "Hyrox",
          hyroxCategory: "elite",
        },
        TODAY,
      ),
    ).toEqual({ ok: false, error: "Catégorie Hyrox invalide." });
  });
});

describe("compte à rebours", () => {
  it("compte les jours entre deux dates, sans décalage à l'heure d'été", () => {
    expect(daysBetween("2026-10-22", "2026-10-22")).toBe(0);
    expect(daysBetween("2026-10-22", "2026-12-06")).toBe(45);
    // Passage à l'heure d'hiver le 25/10/2026 : toujours un nombre entier de jours.
    expect(daysBetween("2026-10-24", "2026-10-26")).toBe(2);
    expect(daysBetween("2026-10-22", "2026-10-20")).toBe(-2);
  });

  it("affiche J-n, aujourd'hui ou date passée", () => {
    expect(goalCountdown(TODAY, "2026-12-06")).toEqual({ label: "J-45", overdue: false });
    expect(goalCountdown(TODAY, TODAY)).toEqual({ label: "Aujourd'hui", overdue: false });
    expect(goalCountdown(TODAY, "2026-10-01")).toEqual({ label: "Date passée", overdue: true });
  });
});

describe("goalDiscipline (couleur d'un objectif)", () => {
  it("rattache chaque type d'objectif à sa discipline", () => {
    expect(goalDiscipline("run_half")).toBe("running");
    expect(goalDiscipline("run_other")).toBe("running");
    expect(goalDiscipline("hyrox")).toBe("hyrox");
    expect(goalDiscipline("strength")).toBe("strength");
    // La remise en forme se fait en salle : elle suit la musculation (D-18).
    expect(goalDiscipline("fitness")).toBe("strength");
    expect(goalDiscipline("personal")).toBeNull();
  });
});
