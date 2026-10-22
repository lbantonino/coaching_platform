import "server-only";

import type { HyroxCategory } from "@/features/goals/schemas";
import { createClient } from "@/lib/supabase/server";

import { bestRecords, type RecordEvent } from "./schemas";

export type RecordEntry = {
  id: string;
  event: RecordEvent;
  hyroxCategory: HyroxCategory | null;
  timeSeconds: number;
  achievedOn: string;
  raceName: string | null;
  createdAt: string;
};

export type AthleteRecords = {
  // Meilleur temps par épreuve (et catégorie Hyrox), calculé à la lecture.
  best: RecordEntry[];
  // Toutes les performances, de la plus récente à la plus ancienne.
  history: RecordEntry[];
};

// Records d'un sportif, dans une organisation dont l'accès a DÉJÀ été vérifié (requireOrgAccess).
export async function listRecords(
  organizationId: string,
  athleteId: string,
): Promise<AthleteRecords> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("athlete_personal_records")
    .select("id, event, hyrox_category, time_seconds, achieved_on, race_name, created_at")
    .eq("organization_id", organizationId)
    .eq("athlete_id", athleteId)
    .order("achieved_on", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw new Error("Lecture des records impossible.");

  const history: RecordEntry[] = (data ?? []).map((row) => ({
    id: row.id,
    // Les contraintes CHECK en base garantissent ces listes fermées.
    event: row.event as RecordEvent,
    hyroxCategory: row.hyrox_category as HyroxCategory | null,
    timeSeconds: row.time_seconds,
    achievedOn: row.achieved_on,
    raceName: row.race_name,
    createdAt: row.created_at,
  }));

  return { best: bestRecords(history), history };
}
