import "server-only";

import type { ProgramDraft } from "@/domain/training/program-plan";
import {
  validateForPublish,
  type AimContext,
  type PublishIssue,
} from "@/domain/training/program-publication";
import { createClient } from "@/lib/supabase/server";

import {
  aimContext,
  listCoachSessionSlots,
  loadAthleteContext,
  loadDraft,
  type LoadedDraft,
} from "./drafts";

type Supabase = Awaited<ReturnType<typeof createClient>>;

// Les vérifications avant de publier (08), les mêmes partout : l'action « Publier » de l'éditeur et
// le bandeau « Modifications non publiées » de la fiche d'un sportif. Le contexte du sportif (FC max,
// max par exercice, division Hyrox, jours disponibles), ses autres programmes publiés (C-8 : pas de
// chevauchement) et les séances encadrées de l'organisation. null : sportif introuvable.
export async function checkPublication(
  supabase: Supabase,
  organizationId: string,
  programId: string,
  loaded: LoadedDraft & { draft: ProgramDraft },
): Promise<{ issues: PublishIssue[]; context: AimContext } | null> {
  const athlete = await loadAthleteContext(supabase, organizationId, loaded.program.athleteId);
  if (!athlete) return null;
  const [others, coachSessions] = await Promise.all([
    supabase
      .from("programs")
      .select("title, start_date, weeks_count")
      .eq("organization_id", organizationId)
      .eq("athlete_id", loaded.program.athleteId)
      .eq("status", "published")
      .neq("id", programId),
    listCoachSessionSlots(supabase, organizationId),
  ]);
  if (others.error) throw new Error("La vérification n'a pas abouti.");
  const context = aimContext(athlete, loaded.draft);
  const issues = validateForPublish(loaded.draft, {
    ...context,
    otherPublished: (others.data ?? []).map((row) => ({
      title: row.title,
      startDate: row.start_date,
      weeksCount: row.weeks_count,
    })),
    availableDays: athlete.availableDays,
    coachSessionIds: new Set(coachSessions.map((session) => session.id)),
  });
  return { issues, context };
}

// Fiche du sportif (demande d'Antonino du 10/11) : le brouillon a des modifications que le sportif ne
// voit pas encore. Ce qu'il faut au bandeau « Publier la version n + 1 » et à sa fenêtre de
// confirmation (la même que l'éditeur) ; null s'il n'y a rien à publier.
export type PendingPublication = {
  programId: string;
  revision: number;
  currentVersion: number;
  weeks: number;
  sessions: number;
  issues: PublishIssue[];
};

export async function pendingPublication(
  organizationId: string,
  programId: string,
): Promise<PendingPublication | null> {
  const supabase = await createClient();
  const loaded = await loadDraft(supabase, organizationId, programId);
  if (
    !loaded?.draft ||
    !loaded.activePublication ||
    !loaded.hasUnpublishedChanges ||
    loaded.program.status === "archived"
  ) {
    return null;
  }
  const draft = loaded.draft;
  const checked = await checkPublication(supabase, organizationId, programId, { ...loaded, draft });
  if (!checked) return null;
  return {
    programId,
    revision: loaded.revision,
    currentVersion: loaded.activePublication.number,
    weeks: draft.weeks.length,
    sessions: draft.weeks.reduce((sum, week) => sum + week.sessions.length, 0),
    issues: checked.issues,
  };
}
