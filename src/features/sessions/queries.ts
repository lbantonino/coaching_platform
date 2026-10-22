import "server-only";

import type { Discipline } from "@/domain/training/discipline";
import { createClient } from "@/lib/supabase/server";

import type { SessionKind } from "./schemas";

export type SessionAthlete = { id: string; name: string };

export type CoachSession = {
  id: string;
  kind: SessionKind;
  title: string;
  discipline: Discipline | null;
  location: string | null;
  startsOn: string;
  // « 19:00 » (la base renvoie « 19:00:00 »).
  startTime: string;
  durationMinutes: number;
  repeatsWeekly: boolean;
  endsOn: string | null;
  notes: string | null;
  // Séance individuelle : son sportif. Séance collective : ses inscrits.
  athletes: SessionAthlete[];
};

// Le sportif direct (séance individuelle) et les inscrits (collective) passent par deux relations
// différentes vers athlete_profiles : on nomme chacune pour lever l'ambiguïté.
const SELECT = `id, kind, title, discipline, location, starts_on, start_time, duration_minutes,
  repeats_weekly, ends_on, notes,
  individual:athlete_profiles!coach_sessions_athlete_id_organization_id_fkey ( id, first_name, display_name ),
  enrolled:coach_session_athletes ( athlete:athlete_profiles!coach_session_athletes_athlete_id_organization_id_fkey ( id, first_name, display_name ) )`;

type Profile = { id: string; first_name: string; display_name: string | null } | null;
type Row = {
  id: string;
  kind: string;
  title: string;
  discipline: string | null;
  location: string | null;
  starts_on: string;
  start_time: string;
  duration_minutes: number;
  repeats_weekly: boolean;
  ends_on: string | null;
  notes: string | null;
  individual: Profile;
  enrolled: { athlete: Profile }[];
};

// display_name est calculé par la base : jamais vide, le repli ne sert qu'au typage.
const toAthlete = (profile: NonNullable<Profile>): SessionAthlete => ({
  id: profile.id,
  name: profile.display_name ?? profile.first_name,
});

function toSession(row: Row): CoachSession {
  const athletes = row.individual
    ? [toAthlete(row.individual)]
    : row.enrolled
        .flatMap(({ athlete }) => (athlete ? [toAthlete(athlete)] : []))
        .sort((a, b) => a.name.localeCompare(b.name, "fr"));
  return {
    id: row.id,
    // Les contraintes CHECK en base garantissent ces listes fermées.
    kind: row.kind as SessionKind,
    title: row.title,
    discipline: row.discipline as Discipline | null,
    location: row.location,
    startsOn: row.starts_on,
    startTime: row.start_time.slice(0, 5),
    durationMinutes: row.duration_minutes,
    repeatsWeekly: row.repeats_weekly,
    endsOn: row.ends_on,
    notes: row.notes,
    athletes,
  };
}

// Séances de l'organisation (DÉJÀ vérifiée par requireOrgAccess), filtrées par la RLS.
export async function listSessions(organizationId: string): Promise<CoachSession[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("coach_sessions")
    .select(SELECT)
    .eq("organization_id", organizationId)
    .order("start_time");
  if (error) throw new Error("Lecture des séances impossible.");
  return ((data ?? []) as unknown as Row[]).map(toSession);
}

export async function getSession(
  organizationId: string,
  sessionId: string,
): Promise<CoachSession | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("coach_sessions")
    .select(SELECT)
    .eq("organization_id", organizationId)
    .eq("id", sessionId)
    .maybeSingle();
  if (error) throw new Error("Lecture de la séance impossible.");
  return data ? toSession(data as unknown as Row) : null;
}
