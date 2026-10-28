import { describe, expect, it } from "vitest";

import { parseNewAthleteForm, type NewAthleteFormInput } from "@/features/athletes/new-athlete";

// Page « Nouveau sportif » (D-54) : toute la fiche en une fois, avec les règles de la fiche.
const TODAY = "2026-10-28";
const base: NewAthleteFormInput = {
  firstName: " Camille ",
  lastName: "",
  sex: "",
  email: "",
  phone: "",
  status: "active",
  preferredContact: "",
  level: "",
  experience: "",
  trainingPlaces: [],
  equipment: "",
  programType: "",
  sessionsPerWeek: "",
  maxSessionMinutes: "",
  availableDays: [],
  scheduleConstraints: "",
  healthConstraints: "",
  goalType: "",
  goalDate: "",
  competitionName: "",
  healthConsent: false,
  consentProof: "",
};

describe("parseNewAthleteForm", () => {
  it("accepte une fiche avec le seul prénom, sans objectif ni accord", () => {
    const parsed = parseNewAthleteForm(base, TODAY);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.values.profile).toMatchObject({
      first_name: "Camille",
      last_name: null,
      status: "active",
      program_type: null,
      training_places: [],
      available_days: [],
    });
    expect(parsed.values.goal).toBeNull();
    expect(parsed.values.consent).toBeNull();
  });

  it("refuse une fiche sans prénom", () => {
    expect(parseNewAthleteForm({ ...base, firstName: "  " }, TODAY)).toEqual({
      ok: false,
      error: "Le prénom est obligatoire.",
    });
  });

  it("lit le profil, les disponibilités et le type de programme", () => {
    const parsed = parseNewAthleteForm(
      {
        ...base,
        level: "intermediate",
        programType: "hyrox",
        trainingPlaces: ["box", "gym", "box"],
        sessionsPerWeek: "4",
        maxSessionMinutes: "75",
        availableDays: ["sat", "mon", "wed"],
        scheduleConstraints: " Pas le jeudi ",
      },
      TODAY,
    );
    expect(parsed.ok && parsed.values.profile).toMatchObject({
      level: "intermediate",
      program_type: "hyrox",
      training_places: ["box", "gym"],
      sessions_per_week: 4,
      max_session_minutes: 75,
      available_days: ["mon", "wed", "sat"],
      schedule_constraints: "Pas le jeudi",
    });
  });

  it("refuse un type de programme inconnu", () => {
    expect(parseNewAthleteForm({ ...base, programType: "yoga" }, TODAY)).toEqual({
      ok: false,
      error: "Type de programme invalide.",
    });
  });

  it("fait de l'objectif principal une compétition quand il a un nom, avec sa date", () => {
    const parsed = parseNewAthleteForm(
      { ...base, goalType: "hyrox", goalDate: "2027-03-20", competitionName: " Hyrox Bruxelles " },
      TODAY,
    );
    expect(parsed.ok && parsed.values.goal).toMatchObject({
      goal_type: "hyrox",
      priority: "main",
      target_date: "2027-03-20",
      competition_name: "Hyrox Bruxelles",
    });
    expect(
      parseNewAthleteForm({ ...base, goalType: "hyrox", competitionName: "Hyrox Gent" }, TODAY),
    ).toEqual({ ok: false, error: "Une compétition a besoin d'une date." });
  });

  it("refuse une date ou une compétition sans type d'objectif, et une date passée", () => {
    expect(parseNewAthleteForm({ ...base, goalDate: "2027-03-20" }, TODAY)).toEqual({
      ok: false,
      error: "Choisis le type de l'objectif principal.",
    });
    expect(
      parseNewAthleteForm({ ...base, goalType: "fitness", goalDate: "2026-10-01" }, TODAY),
    ).toEqual({ ok: false, error: "La date de l'objectif est déjà passée." });
  });

  it("n'accepte des contraintes physiques qu'avec l'accord du sportif et sa preuve", () => {
    expect(parseNewAthleteForm({ ...base, healthConstraints: "Genou sensible" }, TODAY)).toEqual({
      ok: false,
      error: "L'accord du sportif est nécessaire pour noter des contraintes physiques.",
    });
    expect(parseNewAthleteForm({ ...base, healthConsent: true }, TODAY)).toEqual({
      ok: false,
      error: "Indique comment le sportif a donné son accord.",
    });
    const parsed = parseNewAthleteForm(
      { ...base, healthConsent: true, consentProof: "oral", healthConstraints: " Genou sensible " },
      TODAY,
    );
    expect(parsed.ok && parsed.values.consent).toEqual({
      proof: "oral",
      healthConstraints: "Genou sensible",
    });
  });
});
