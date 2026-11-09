import { z } from "zod";

import { DISCIPLINES } from "./discipline";
import { publishedSessionSchema, type PublishedSession, type SessionDraft } from "./session-v2";
import { sessionSteps } from "./session-view";

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
  // Séance faite AVEC le coach (demande d'Antonino du 26/10) : elle correspond à une séance encadrée
  // de son agenda (ex. coaching du mardi 7 h, circuit collectif du samedi) et compte dans les séances
  // de la semaine du sportif, au lieu de s'y ajouter.
  withCoach: z.object({ sessionId: z.uuid() }).optional(),
});

export type ProgramSessionContent = z.infer<typeof programSessionSchema>;
export type ProgramSessionStep = z.infer<typeof stepSchema>;

// Tranche 2 (D-155, 09/11/2026) : les séances publiées depuis l'éditeur sont au schéma v2, STRUCTURÉ
// (session-v2.ts). Les écrans lisent toujours cette forme v1 « à afficher » : une séance v2 y est
// traduite en lignes (session-view.ts). Les publications v1 déjà figées ne sont jamais réécrites.
export function sessionToDisplay(session: PublishedSession): ProgramSessionContent {
  return {
    title: session.title,
    discipline: session.content.discipline,
    sessionType: session.sessionType,
    durationMinutes: session.durationMinutes,
    ...(session.objective ? { objective: session.objective } : {}),
    ...(session.coachTip ? { coachTips: session.coachTip } : {}),
    steps: sessionSteps(session),
    ...(session.withCoach ? { withCoach: { sessionId: session.withCoach.coachSessionId } } : {}),
  };
}

// Contenu d'une séance publiée, v1 ou v2 ; null s'il est mal formé (écarté plutôt qu'affiché de travers).
export function parseProgramSession(value: unknown): ProgramSessionContent | null {
  if (typeof value === "object" && value !== null && "schemaVersion" in value) {
    const parsed = publishedSessionSchema.safeParse(value);
    if (!parsed.success) return null;
    const display = programSessionSchema.safeParse(sessionToDisplay(parsed.data));
    return display.success ? display.data : null;
  }
  const parsed = programSessionSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

// Une séance v1 reprise SANS PERTE au schéma v2 : chaque étape devient un bloc texte (titre, pastille,
// lignes, répétition). Sert à créer le brouillon d'un programme publié avant l'éditeur. Une séance
// sans discipline (cas théorique) devient « hybrid », la seule forme qui n'accepte que du texte.
export function upgradeV1Session(
  session: ProgramSessionContent,
  key: string,
  withCoach?: { coachSessionId: string; date: string; time?: string },
): SessionDraft {
  const items = session.steps.map((step, i) => ({
    id: `t${i + 1}`,
    kind: "text" as const,
    title: step.title,
    ...(step.badge ? { badge: step.badge } : {}),
    lines: step.lines,
    ...(step.repeat ? { repeat: step.repeat } : {}),
  }));
  return {
    key,
    title: session.title,
    sessionType: session.sessionType,
    durationMinutes: session.durationMinutes,
    ...(session.objective ? { objective: session.objective } : {}),
    ...(session.coachTips ? { coachTip: session.coachTips } : {}),
    content: { discipline: session.discipline ?? "hybrid", items },
    athleteCanMove: false,
    ...(withCoach ? { withCoach } : {}),
  };
}
