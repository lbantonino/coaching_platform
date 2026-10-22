import "server-only";

import { createClient } from "@/lib/supabase/server";

import type { NoteVisibility } from "./schemas";

export type CoachNote = { body: string; updatedAt: string };
export type AthleteNotes = Record<NoteVisibility, CoachNote | null>;

// Les deux notes d'un sportif, pour une organisation DÉJÀ vérifiée (requireOrgAccess).
export async function getAthleteNotes(
  organizationId: string,
  athleteId: string,
): Promise<AthleteNotes> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("athlete_notes")
    .select("visibility, body, updated_at")
    .eq("organization_id", organizationId)
    .eq("athlete_id", athleteId);

  if (error) throw new Error("Lecture des notes impossible.");

  const notes: AthleteNotes = { coach: null, athlete: null };
  for (const row of data ?? []) {
    notes[row.visibility as NoteVisibility] = { body: row.body, updatedAt: row.updated_at };
  }
  return notes;
}

// Espace sportif : la note qui lui est destinée, pour chacune de ses fiches. La RLS ne lui laisse
// lire QUE les notes « athlete » de SA fiche : jamais la note privée du coach.
export async function getOwnCoachMessages(): Promise<Map<string, CoachNote>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("athlete_notes")
    .select("athlete_id, body, updated_at")
    .eq("visibility", "athlete");

  if (error) throw new Error("Lecture du message du coach impossible.");

  return new Map(
    (data ?? []).map((row) => [row.athlete_id, { body: row.body, updatedAt: row.updated_at }]),
  );
}
