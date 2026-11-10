import "server-only";

import type { PdfProgramInput } from "@/domain/training/pdf-agenda";
import type { CurrentUser } from "@/features/auth/session";
import { getCoachProfile } from "@/features/coach/profile";
import { todayIsoInBrussels } from "@/lib/format";

import { getPublishedProgram } from "../queries";

// Données des PDF d'un programme (phase 5) : la VERSION PUBLIÉE (jamais le brouillon), le nom du
// sportif et celui du coach qui a créé le programme (sinon le coach connecté), comme la signature des
// conseils sur la page d'une séance. null : programme inconnu, d'une autre organisation ou jamais
// publié (même réponse, rien n'est révélé).
export async function loadProgramPdfInput(
  organizationId: string,
  programId: string,
  user: CurrentUser,
): Promise<PdfProgramInput | null> {
  const found = await getPublishedProgram(organizationId, programId);
  if (!found) return null;
  const { program, athleteName } = found;
  const coach = await getCoachProfile(
    program.createdBy ? { id: program.createdBy, email: null } : user,
  );
  return {
    title: program.title,
    athleteName,
    coachName: coach.displayName,
    version: program.publicationNumber,
    startDate: program.startDate,
    weeksCount: program.weeksCount,
    sessionsPerWeek: program.sessionsPerWeek,
    race: program.race ? { name: program.race.name, date: program.race.date } : null,
    today: todayIsoInBrussels(),
    weeks: program.weeks.map((week) => ({
      index: week.index,
      label: week.label,
      light: week.light,
      monday: week.monday,
      sunday: week.sunday,
      // v1 (sans mode enregistré) : jours fixés si au moins une séance a son jour.
      fixed: week.fixed || week.sessions.some((session) => session.day !== null),
      sessions: week.sessions.map((session) => ({
        content: session.content,
        headline: session.headline,
        day: session.day,
        time: session.time,
        coachDate: session.coachDate,
        published: session.published,
      })),
    })),
  };
}
