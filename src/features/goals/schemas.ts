import { z } from "zod";

import type { Discipline } from "@/domain/training/discipline";
import { parseDuration } from "@/domain/training/vma";

// Objectifs et compétitions (P2-02 partie 2). Listes alignées sur les contraintes CHECK de
// supabase/migrations/*_objectifs_sportifs.sql : ajouter une valeur = migration + libellé ici.
export const GOAL_TYPES = [
  "run_5k",
  "run_10k",
  "run_half",
  "run_marathon",
  "run_other",
  "hyrox",
  "strength",
  "body_composition",
  "fitness",
  "personal",
] as const;
export type GoalType = (typeof GOAL_TYPES)[number];
export const goalTypeLabels: Record<GoalType, string> = {
  run_5k: "Course 5 km",
  run_10k: "Course 10 km",
  run_half: "Semi-marathon",
  run_marathon: "Marathon",
  run_other: "Autre course (trail, 20 km…)",
  hyrox: "Hyrox",
  strength: "Force",
  body_composition: "Composition corporelle",
  fitness: "Remise en forme / santé",
  personal: "Objectif personnel",
};

// Discipline d'un objectif, pour sa couleur (D-23). La remise en forme se fait en salle : elle suit la
// musculation (D-18). Un objectif personnel n'a pas de discipline (pas de couleur).
export function goalDiscipline(type: GoalType): Discipline | null {
  if (type.startsWith("run_")) return "running";
  if (type === "hyrox") return "hyrox";
  if (type === "strength" || type === "body_composition" || type === "fitness") return "strength";
  return null;
}

// Regroupement pour la liste déroulante du formulaire.
export const goalTypeGroups: { label: string; types: GoalType[] }[] = [
  { label: "Course à pied", types: ["run_5k", "run_10k", "run_half", "run_marathon", "run_other"] },
  { label: "Hyrox", types: ["hyrox"] },
  { label: "Musculation et forme", types: ["strength", "body_composition", "fitness"] },
  { label: "Autre", types: ["personal"] },
];

export const HYROX_CATEGORIES = ["open", "pro", "doubles", "relay"] as const;
export type HyroxCategory = (typeof HYROX_CATEGORIES)[number];
export const hyroxCategoryLabels: Record<HyroxCategory, string> = {
  open: "Open",
  pro: "Pro",
  doubles: "Doubles",
  relay: "Relay",
};

export const GOAL_PRIORITIES = ["main", "secondary"] as const;
export type GoalPriority = (typeof GOAL_PRIORITIES)[number];
export const goalPriorityLabels: Record<GoalPriority, string> = {
  main: "Principal",
  secondary: "Secondaire",
};

export const GOAL_STATUSES = ["active", "achieved", "dropped"] as const;
export type GoalStatus = (typeof GOAL_STATUSES)[number];
export const goalStatusLabels: Record<GoalStatus, string> = {
  active: "En cours",
  achieved: "Atteint",
  dropped: "Abandonné",
};

// Saisie brute du formulaire (chaînes), renvoyée telle quelle en cas d'erreur.
export type GoalFormInput = {
  goalType: string;
  priority: string;
  targetDate: string;
  // Temps visé saisi « 1:15:00 » ou « 45:00 » (facultatif).
  targetTime: string;
  isCompetition: boolean;
  competitionName: string;
  competitionLocation: string;
  hyroxCategory: string;
  description: string;
};

export type GoalValues = {
  goal_type: GoalType;
  priority: GoalPriority;
  target_date: string | null;
  target_time_seconds: number | null;
  competition_name: string | null;
  competition_location: string | null;
  hyrox_category: HyroxCategory | null;
  description: string | null;
};

const blankToNull = (value: string) => (value.trim() === "" ? null : value.trim());

const baseSchema = z.object({
  goalType: z.enum(GOAL_TYPES, { error: "Choisis le type d'objectif." }),
  priority: z.enum(GOAL_PRIORITIES, { error: "Priorité invalide." }),
  description: z
    .string()
    .max(500, { error: "La description est trop longue (500 caractères maximum)." }),
  competitionName: z
    .string()
    .max(120, { error: "Le nom de la compétition est trop long (120 caractères maximum)." }),
  competitionLocation: z
    .string()
    .max(120, { error: "Le lieu est trop long (120 caractères maximum)." }),
});

// Valide un nouvel objectif. `today` (AAAA-MM-JJ, Bruxelles) sert à refuser une date déjà passée :
// on crée un objectif à venir ; une erreur de frappe sur l'année est ainsi repérée tout de suite.
export function parseGoalForm(
  input: GoalFormInput,
  today: string,
): { ok: true; values: GoalValues } | { ok: false; error: string } {
  const parsed = baseSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Saisie invalide." };
  const { goalType, priority } = parsed.data;

  const targetDate = blankToNull(input.targetDate);
  if (targetDate !== null) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(targetDate) || Number.isNaN(Date.parse(targetDate))) {
      return { ok: false, error: "Date invalide." };
    }
    if (targetDate < today) return { ok: false, error: "La date de l'objectif est déjà passée." };
  }

  // Temps visé : « 1:15:00 » ou « 45:00 » ; entre 1 minute et 24 heures (comme la base).
  let targetTimeSeconds: number | null = null;
  if (input.targetTime.trim() !== "") {
    targetTimeSeconds = parseDuration(input.targetTime);
    if (targetTimeSeconds === null || targetTimeSeconds < 60 || targetTimeSeconds > 86_400)
      return { ok: false, error: "Temps visé invalide : écris-le comme 1:15:00 ou 45:00." };
  }

  let competitionName: string | null = null;
  let competitionLocation: string | null = null;
  let hyroxCategory: HyroxCategory | null = null;
  if (input.isCompetition) {
    competitionName = blankToNull(input.competitionName);
    if (competitionName === null) return { ok: false, error: "Indique le nom de la compétition." };
    if (targetDate === null) return { ok: false, error: "Une compétition a besoin d'une date." };
    competitionLocation = blankToNull(input.competitionLocation);
    // La catégorie n'a de sens que pour un Hyrox ; elle reste facultative (pas toujours décidée).
    if (goalType === "hyrox" && input.hyroxCategory !== "") {
      const category = z.enum(HYROX_CATEGORIES).safeParse(input.hyroxCategory);
      if (!category.success) return { ok: false, error: "Catégorie Hyrox invalide." };
      hyroxCategory = category.data;
    }
  }

  return {
    ok: true,
    values: {
      goal_type: goalType,
      priority,
      target_date: targetDate,
      target_time_seconds: targetTimeSeconds,
      competition_name: competitionName,
      competition_location: competitionLocation,
      hyrox_category: hyroxCategory,
      description: blankToNull(input.description),
    },
  };
}
