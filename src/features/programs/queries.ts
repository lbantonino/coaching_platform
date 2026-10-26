import "server-only";

import { z } from "zod";

import { parseProgramSession, type ProgramSessionContent } from "@/domain/training/program-session";
import { addDays } from "@/features/agenda/items";
import { createClient } from "@/lib/supabase/server";

// Programme publié d'un sportif (D-46, tranche 1) : ce que le sportif suit, lu depuis la publication
// ACTIVE (version figée), jamais depuis un brouillon. Une séance n'a pas de jour : une semaine (lundi →
// dimanche, calculée depuis la date de début) et un numéro de séance.

export type ProgramSessionCard = {
  id: string;
  weekIndex: number;
  slotIndex: number;
  content: ProgramSessionContent;
};

export type ProgramWeek = {
  index: number;
  // Phase de la semaine (« Préparation », « Allègement »…), si le coach l'a nommée.
  label: string | null;
  monday: string;
  sunday: string;
  sessions: ProgramSessionCard[];
};

export type AthleteProgram = {
  id: string;
  title: string;
  goal: string | null;
  startDate: string;
  weeksCount: number;
  publicationNumber: number;
  publishedAt: string;
  weeks: ProgramWeek[];
};

const snapshotSchema = z.object({
  weeks: z
    .array(z.object({ index: z.number().int(), label: z.string().nullable().optional() }))
    .optional(),
});

// Programme publié du sportif, dans une organisation DÉJÀ vérifiée (requireOrgAccess) ; null s'il n'y
// en a pas. Les séances illisibles (contenu mal formé) sont écartées plutôt qu'affichées de travers.
export async function getAthleteProgram(
  organizationId: string,
  athleteId: string,
): Promise<AthleteProgram | null> {
  const supabase = await createClient();
  const { data: program, error } = await supabase
    .from("programs")
    .select(
      "id, title, goal, start_date, weeks_count, active_publication_id, program_publications!programs_active_publication_fkey ( id, number, published_at, snapshot_json )",
    )
    .eq("organization_id", organizationId)
    .eq("athlete_id", athleteId)
    .eq("status", "published")
    .maybeSingle();
  if (error) throw new Error("Lecture du programme impossible.");
  const publication = program?.program_publications;
  if (!program || !publication) return null;

  const { data: rows, error: sessionsError } = await supabase
    .from("publication_sessions")
    .select("id, week_index, slot_index, session_json")
    .eq("organization_id", organizationId)
    .eq("publication_id", publication.id)
    .order("week_index")
    .order("slot_index");
  if (sessionsError) throw new Error("Lecture des séances du programme impossible.");

  const labels = new Map(
    (snapshotSchema.safeParse(publication.snapshot_json).data?.weeks ?? []).map((week) => [
      week.index,
      week.label ?? null,
    ]),
  );
  const weeks: ProgramWeek[] = Array.from({ length: program.weeks_count }, (_, i) => {
    const monday = addDays(program.start_date, 7 * i);
    return {
      index: i + 1,
      label: labels.get(i + 1) ?? null,
      monday,
      sunday: addDays(monday, 6),
      sessions: [],
    };
  });
  for (const row of rows ?? []) {
    const content = parseProgramSession(row.session_json);
    const week = weeks[row.week_index - 1];
    if (content && week) {
      week.sessions.push({
        id: row.id,
        weekIndex: row.week_index,
        slotIndex: row.slot_index,
        content,
      });
    }
  }

  return {
    id: program.id,
    title: program.title,
    goal: program.goal,
    startDate: program.start_date,
    weeksCount: program.weeks_count,
    publicationNumber: publication.number,
    publishedAt: publication.published_at,
    weeks,
  };
}

// Une séance du programme publié du sportif (page de détail) ; null si elle n'en fait pas partie.
export async function getProgramSession(
  organizationId: string,
  athleteId: string,
  sessionId: string,
): Promise<{ program: AthleteProgram; week: ProgramWeek; session: ProgramSessionCard } | null> {
  if (!z.uuid().safeParse(sessionId).success) return null;
  const program = await getAthleteProgram(organizationId, athleteId);
  if (!program) return null;
  for (const week of program.weeks) {
    const session = week.sessions.find((candidate) => candidate.id === sessionId);
    if (session) return { program, week, session };
  }
  return null;
}
