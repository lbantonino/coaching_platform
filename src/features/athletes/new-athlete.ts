import { z } from "zod";

import { DISCIPLINES, type Discipline } from "@/domain/training/discipline";
import { coachProofSchema, type CoachProof } from "@/features/consents/schemas";
import { parseGoalForm, type GoalValues } from "@/features/goals/schemas";

import type { AthleteFormValues, AvailabilityFormValues } from "./actions";
import { athleteUpdateSchema, availabilitySchema } from "./schemas";

// Page « Nouveau sportif » (D-54, prompt Claude Design §7.2) : la fiche complète en une fois.
// Règle PURE, testée par Vitest : elle réutilise les règles déjà en place pour la fiche (identité,
// profil, statut), les disponibilités, l'objectif principal et l'accord santé, pour qu'un sportif
// créé ici soit exactement celui qu'on aurait obtenu en remplissant ses onglets un par un.
export type NewAthleteFormInput = AthleteFormValues &
  AvailabilityFormValues & {
    programType: string;
    // Objectif principal (facultatif) : type, date, compétition.
    goalType: string;
    goalDate: string;
    competitionName: string;
    // Accord santé, noté par le coach, et comment il l'a obtenu.
    healthConsent: boolean;
    consentProof: string;
  };

export type NewAthleteValues = {
  profile: {
    first_name: string;
    last_name: string | null;
    sex: "female" | "male" | "unspecified" | null;
    email: string | null;
    phone: string | null;
    status: "active" | "paused" | "archived";
    preferred_contact: "email" | "phone" | "sms" | "whatsapp" | null;
    level: "beginner" | "intermediate" | "advanced" | "competitor" | null;
    experience: string | null;
    training_places: ("gym" | "outdoor" | "track" | "home" | "box")[];
    equipment: string | null;
    program_type: Discipline | null;
    sessions_per_week: number | null;
    max_session_minutes: number | null;
    available_days: ("mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun")[];
    schedule_constraints: string | null;
  };
  goal: GoalValues | null;
  // Accord santé : sa preuve, et les contraintes physiques notées avec lui.
  consent: { proof: CoachProof; healthConstraints: string | null } | null;
};

const programTypeSchema = z.preprocess(
  (value) => (value === "" || value === undefined ? null : value),
  z.enum(DISCIPLINES, { error: "Type de programme invalide." }).nullable(),
);

export function parseNewAthleteForm(
  input: NewAthleteFormInput,
  today: string,
): { ok: true; values: NewAthleteValues } | { ok: false; error: string } {
  const profile = athleteUpdateSchema.safeParse(input);
  if (!profile.success) {
    return { ok: false, error: profile.error.issues[0]?.message ?? "Formulaire invalide." };
  }
  const programType = programTypeSchema.safeParse(input.programType);
  if (!programType.success) {
    return { ok: false, error: programType.error.issues[0]?.message ?? "Formulaire invalide." };
  }
  const availability = availabilitySchema.safeParse(input);
  if (!availability.success) {
    return { ok: false, error: availability.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  // Objectif principal : facultatif, mais une date ou une compétition sans type ne veut rien dire.
  let goal: GoalValues | null = null;
  const competitionName = input.competitionName.trim();
  if (input.goalType === "") {
    if (input.goalDate.trim() !== "" || competitionName !== "") {
      return { ok: false, error: "Choisis le type de l'objectif principal." };
    }
  } else {
    const parsedGoal = parseGoalForm(
      {
        goalType: input.goalType,
        priority: "main",
        targetDate: input.goalDate,
        targetTime: "",
        // Un nom de compétition fait de l'objectif une compétition (qui a alors besoin d'une date).
        isCompetition: competitionName !== "",
        competitionName,
        competitionLocation: "",
        hyroxCategory: "",
        description: "",
      },
      today,
    );
    if (!parsedGoal.ok) return parsedGoal;
    goal = parsedGoal.values;
  }

  // Données de santé : seulement avec l'accord explicite du sportif, et sa preuve.
  let consent: NewAthleteValues["consent"] = null;
  const healthConstraints = availability.data.healthConstraints;
  if (input.healthConsent) {
    const proof = coachProofSchema.safeParse(input.consentProof);
    if (!proof.success) {
      return { ok: false, error: proof.error.issues[0]?.message ?? "Saisie invalide." };
    }
    consent = { proof: proof.data, healthConstraints };
  } else if (healthConstraints !== null) {
    return {
      ok: false,
      error: "L'accord du sportif est nécessaire pour noter des contraintes physiques.",
    };
  }

  const p = profile.data;
  const a = availability.data;
  return {
    ok: true,
    values: {
      profile: {
        first_name: p.firstName,
        last_name: p.lastName,
        sex: p.sex,
        email: p.email,
        phone: p.phone,
        status: p.status,
        preferred_contact: p.preferredContact,
        level: p.level,
        experience: p.experience,
        training_places: p.trainingPlaces,
        equipment: p.equipment,
        program_type: programType.data,
        sessions_per_week: a.sessionsPerWeek,
        max_session_minutes: a.maxSessionMinutes,
        available_days: a.availableDays,
        schedule_constraints: a.scheduleConstraints,
      },
      goal,
      consent,
    },
  };
}
