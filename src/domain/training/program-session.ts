import { z } from "zod";

import { DISCIPLINES } from "./discipline";

// Contenu d'une séance de programme (D-46) : un objet STRUCTURÉ, pas un grand champ de texte libre
// (CLAUDE.md). Il est figé dans la publication (publication_sessions.session_json) et relu ici à
// chaque affichage : une donnée mal formée est écartée plutôt qu'affichée de travers.
// Tranche 1 : la forme qu'il faut pour AFFICHER une séance (étapes, répétitions, conseils). L'éditeur
// propre à chaque discipline (tranche 2) l'enrichira (allures et charges calculées, stations Hyrox…)
// en augmentant schema_version.

const text = (max: number) => z.string().trim().min(1).max(max);

// Une étape : « Échauffement · 20 min », avec ses lignes, et éventuellement un bloc répété
// (« Répéter 4 fois : 5 min @4:55 min/km, 2 min de récupération »).
const stepSchema = z.object({
  title: text(80),
  // Pastille à droite du titre : « 20 min », « 4 × 5 min ».
  badge: text(30).optional(),
  // Version courte pour le résumé des cartes : « 20 min échauffement ».
  short: text(80).optional(),
  lines: z.array(text(200)).max(20).default([]),
  repeat: z
    .object({ times: z.number().int().min(2).max(50), lines: z.array(text(200)).min(1).max(10) })
    .optional(),
});

export const programSessionSchema = z.object({
  title: text(80),
  discipline: z.enum(DISCIPLINES).nullable(),
  // Nature de la séance : « Intervalles », « Circuit », « Endurance », « Force »…
  sessionType: text(40),
  durationMinutes: z.number().int().min(5).max(600),
  objective: text(200).optional(),
  coachTips: text(1000).optional(),
  steps: z.array(stepSchema).min(1).max(30),
});

export type ProgramSessionContent = z.infer<typeof programSessionSchema>;
export type ProgramSessionStep = z.infer<typeof stepSchema>;

export function parseProgramSession(value: unknown): ProgramSessionContent | null {
  const parsed = programSessionSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

// Résumé d'une carte (3 lignes au plus) : la version courte de chaque étape, sinon son titre.
export function sessionSummary(session: ProgramSessionContent, max = 3): string[] {
  return session.steps.slice(0, max).map((step) => step.short ?? step.title);
}
