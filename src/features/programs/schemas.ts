import { z } from "zod";

import { aimDefaultsSchema, programGoalSchema } from "@/domain/training/program-plan";

// Entrées des actions des programmes (validées côté serveur, CLAUDE.md : Zod à chaque frontière).

const text = (max: number) => z.string().trim().min(1).max(max);

// Réponses de l'assistant « Créer un programme » (02, 4 étapes).
export const createProgramInputSchema = z
  .object({
    // Étape 1
    athleteId: z.uuid(),
    title: text(120),
    // Étape 2 : Running, Musculation ou Hyrox (l'éditeur hybride n'est pas dessiné).
    discipline: z.enum(["running", "strength", "hyrox"]),
    goal: programGoalSchema.optional(),
    aimDefaults: aimDefaultsSchema,
    // Étape 3
    startDate: z.iso.date(),
    weeksCount: z.number().int().min(1).max(52),
    sessionsPerWeek: z.number().int().min(1).max(7),
    phases: z
      .array(
        z.object({
          name: text(40),
          weekFrom: z.number().int().min(1),
          weekTo: z.number().int().min(1),
        }),
      )
      .max(12),
    scheduling: z.enum(["ordered", "fixed"]),
    // Étape 4 : point de départ.
    start: z.discriminatedUnion("kind", [
      z.object({ kind: z.literal("blank") }),
      z.object({ kind: z.literal("copy"), programId: z.uuid() }),
      z.object({ kind: z.literal("template"), templateId: z.uuid() }),
    ]),
  })
  .refine((input) => input.phases.every((phase) => phase.weekTo <= input.weeksCount), {
    message: "Une phase dépasse le nombre de semaines.",
    path: ["phases"],
  });

export type CreateProgramInput = z.input<typeof createProgramInputSchema>;

export const templateKindSchema = z.enum(["program", "session"]);
export type TemplateKind = z.infer<typeof templateKindSchema>;
