import { z } from "zod";

import { DISCIPLINES } from "./discipline";
import {
  MAX_SESSIONS_PER_DAY,
  MAX_SESSIONS_PER_WEEK,
  sessionDraftSchema,
  WEEKDAYS,
  type SessionDraft,
} from "./session-v2";

// Le PLAN d'un programme (D-155, 09/11/2026) : phases, semaines et séances. C'est le cœur commun du
// brouillon d'un programme (program_drafts.draft_json) et d'un modèle de programme
// (program_templates.content_json). Un modèle n'a ni sportif ni dates : « Semaine 1 à N » (BR-11).
// Les dates des semaines ne sont jamais stockées : elles se calculent depuis la date de début.

const text = (max: number) => z.string().trim().min(1).max(max);
const weekIndex = z.number().int().min(1).max(52);

// Divisions HYROX précises (règlement 26/27) : l'objectif du sportif ne dit que « open, pro, doubles,
// relay » ; l'assistant (étape 2) demande la division exacte, pré-remplie quand c'est possible.
// « relay » : chacun prend les charges Open de son sexe.
export const HYROX_DIVISIONS = [
  "women_open",
  "men_open",
  "women_pro",
  "men_pro",
  "doubles_women",
  "doubles_men",
  "doubles_mixed",
  "doubles_women_pro",
  "doubles_men_pro",
  "relay",
] as const;
export type HyroxDivision = (typeof HYROX_DIVISIONS)[number];

// Façon de viser par défaut du programme (D-153, BR-12), modifiable séance par séance.
export const aimDefaultsSchema = z.object({
  running: z.enum(["pace", "hr"]),
  strength: z.enum(["kg", "pct"]),
});

// Phase nommée (« Base », « Spécifique », « Affûtage ») sur une plage de semaines.
export const phaseSchema = z
  .object({
    id: z.string().regex(/^[A-Za-z0-9_-]{1,40}$/),
    name: text(40),
    weekFrom: weekIndex,
    weekTo: weekIndex,
  })
  .refine((phase) => phase.weekFrom <= phase.weekTo, "Une phase va d'une semaine à une suivante.");

export const weekSchema = z.object({
  index: weekIndex,
  // Semaine allégée (étiquette « allégée » dans l'éditeur).
  light: z.boolean(),
  // « Dans l'ordre, sans jour » (le sportif choisit) ou « Jours fixes » (03b).
  scheduling: z.enum(["ordered", "fixed"]),
  sessions: z.array(sessionDraftSchema).max(MAX_SESSIONS_PER_WEEK),
});

const planShape = {
  schemaVersion: z.literal(2),
  title: text(120),
  // Discipline principale du programme (les séances ont chacune la leur).
  discipline: z.enum(DISCIPLINES),
  aimDefaults: aimDefaultsSchema,
  // Jusqu'à 14 séances par semaine (D-164 : « 8+ » dans l'assistant, plusieurs séances par jour).
  sessionsPerWeek: z.number().int().min(1).max(MAX_SESSIONS_PER_WEEK),
  phases: z.array(phaseSchema).max(12),
  weeks: z.array(weekSchema).min(1).max(52),
};

export type PlanIssue = { path: (string | number)[]; message: string };

// Cohérence d'un plan, au-delà de la forme de chaque champ.
export function planIssues(plan: { phases: Phase[]; weeks: Week[] }): PlanIssue[] {
  const issues: PlanIssue[] = [];
  plan.weeks.forEach((week, i) => {
    if (week.index !== i + 1) {
      issues.push({ path: ["weeks", i, "index"], message: "Les semaines se suivent : 1, 2, 3…" });
    }
    week.sessions.forEach((session, j) => {
      if (week.scheduling === "ordered" && session.fixedDay !== undefined) {
        issues.push({
          path: ["weeks", i, "sessions", j, "fixedDay"],
          message: "Une semaine « dans l'ordre » n'a pas de jour fixe.",
        });
      }
      if (session.fixedTime !== undefined && session.fixedDay === undefined) {
        issues.push({
          path: ["weeks", i, "sessions", j, "fixedTime"],
          message: "Une heure va avec un jour.",
        });
      }
      if (session.moment !== undefined && session.fixedDay === undefined && !session.withCoach) {
        issues.push({
          path: ["weeks", i, "sessions", j, "moment"],
          message: "Un moment de la journée va avec un jour.",
        });
      }
    });
    // Quatre séances au plus le même jour (D-164).
    if (week.scheduling === "fixed") {
      const perDay = new Map<string, number>();
      week.sessions.forEach((session, j) => {
        const day = session.withCoach
          ? WEEKDAYS[(new Date(`${session.withCoach.date}T00:00:00Z`).getUTCDay() + 6) % 7]
          : session.fixedDay;
        if (!day) return;
        const count = (perDay.get(day) ?? 0) + 1;
        perDay.set(day, count);
        if (count === MAX_SESSIONS_PER_DAY + 1) {
          issues.push({
            path: ["weeks", i, "sessions", j, "fixedDay"],
            message: `${MAX_SESSIONS_PER_DAY} séances au plus le même jour.`,
          });
        }
      });
    }
  });

  const keys = new Set<string>();
  plan.weeks.forEach((week, i) =>
    week.sessions.forEach((session, j) => {
      if (keys.has(session.key)) {
        issues.push({ path: ["weeks", i, "sessions", j, "key"], message: "Séance en double." });
      }
      keys.add(session.key);
    }),
  );

  // Phases facultatives : dans le programme, sans se chevaucher (une semaine dans une seule phase)
  // et contiguës (BR-17, [P] accepté le 09/11/2026).
  const sorted = [...plan.phases].sort((a, b) => a.weekFrom - b.weekFrom);
  sorted.forEach((phase, i) => {
    if (phase.weekTo > plan.weeks.length) {
      issues.push({
        path: ["phases"],
        message: `La phase « ${phase.name} » dépasse le programme.`,
      });
    }
    const previous = sorted[i - 1];
    if (previous && phase.weekFrom !== previous.weekTo + 1) {
      issues.push({
        path: ["phases"],
        message:
          phase.weekFrom <= previous.weekTo
            ? `Les phases « ${previous.name} » et « ${phase.name} » se chevauchent.`
            : `Il y a un trou entre « ${previous.name} » et « ${phase.name} ».`,
      });
    }
  });
  return issues;
}

// Le contenu d'un modèle de programme.
export const programPlanSchema = z.object(planShape).superRefine((plan, ctx) => {
  for (const issue of planIssues(plan)) ctx.addIssue({ code: "custom", ...issue });
});

// Objectif de course (étape 2 de l'assistant).
export const programGoalSchema = z.object({
  raceName: text(120).optional(),
  raceDate: z.iso.date().optional(),
  hyroxDivision: z.enum(HYROX_DIVISIONS).optional(),
  note: text(300).optional(),
});

// Le brouillon d'un programme : le plan, plus ce qui est propre au sportif.
export const programDraftSchema = z
  .object({
    ...planShape,
    // Un lundi (C-9) : les semaines se lisent du lundi au dimanche.
    startDate: z.iso
      .date()
      .refine(
        (date) => new Date(`${date}T00:00:00Z`).getUTCDay() === 1,
        "Un programme commence un lundi.",
      ),
    goal: programGoalSchema.optional(),
  })
  .superRefine((draft, ctx) => {
    for (const issue of planIssues(draft)) ctx.addIssue({ code: "custom", ...issue });
  });

export type AimDefaults = z.infer<typeof aimDefaultsSchema>;
export type Phase = z.infer<typeof phaseSchema>;
export type Week = z.infer<typeof weekSchema>;
export type ProgramPlan = z.infer<typeof programPlanSchema>;
export type ProgramGoal = z.infer<typeof programGoalSchema>;
export type ProgramDraft = z.infer<typeof programDraftSchema>;

// Toutes les séances d'un plan, avec leur semaine.
export function planSessions(plan: { weeks: Week[] }): { week: Week; session: SessionDraft }[] {
  return plan.weeks.flatMap((week) => week.sessions.map((session) => ({ week, session })));
}

// Phase d'une semaine, s'il y en a une.
export function phaseOfWeek(phases: Phase[], index: number): Phase | null {
  return phases.find((phase) => phase.weekFrom <= index && index <= phase.weekTo) ?? null;
}

// Le plan d'un brouillon, pour l'enregistrer comme modèle (sans dates, sans objectif, sans rendez-vous
// du coach : un modèle ne connaît ni le sportif ni son agenda).
export function planFromDraft(draft: ProgramDraft): ProgramPlan {
  return {
    schemaVersion: 2,
    title: draft.title,
    discipline: draft.discipline,
    aimDefaults: draft.aimDefaults,
    sessionsPerWeek: draft.sessionsPerWeek,
    phases: draft.phases,
    weeks: draft.weeks.map((week) => ({
      ...week,
      sessions: week.sessions.map((session) => ({ ...session, withCoach: undefined })),
    })),
  };
}
