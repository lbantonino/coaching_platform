import "server-only";

import { listConsentEvents } from "@/features/consents/queries";
import type { GoalStatus, GoalType, HyroxCategory } from "@/features/goals/schemas";
import type { NoteVisibility } from "@/features/notes/schemas";
import type { RecordEvent } from "@/features/records/schemas";
import type { ReferenceKind } from "@/features/references/schemas";
import { createClient } from "@/lib/supabase/server";

import { buildActivity, type ActivityEvent } from "./build";

// Historique d'un sportif, pour une organisation DÉJÀ vérifiée (requireOrgAccess).
// Six lectures en parallèle, chacune filtrée par la RLS, puis une seule frise triée.
export async function listAthleteActivity(
  organizationId: string,
  athlete: { id: string; createdAt: string },
): Promise<ActivityEvent[]> {
  const supabase = await createClient();
  const scope = { organization_id: organizationId, athlete_id: athlete.id };
  const [goals, references, records, consents, invites, notes] = await Promise.all([
    supabase
      .from("athlete_goals")
      .select("id, goal_type, competition_name, status, created_at, updated_at")
      .match(scope),
    supabase
      .from("athlete_reference_metrics")
      .select(
        "id, kind, pace_min_sec_per_km, pace_max_sec_per_km, bpm, exercise_label, load_kg, reps, measured_on, created_at",
      )
      .match(scope),
    supabase
      .from("athlete_personal_records")
      .select("id, event, hyrox_category, time_seconds, achieved_on, race_name, created_at")
      .match(scope),
    listConsentEvents(organizationId, athlete.id),
    supabase.from("athlete_invites").select("id, created_at, accepted_at, revoked_at").match(scope),
    supabase.from("athlete_notes").select("visibility, updated_at").match(scope),
  ]);
  if (goals.error || references.error || records.error || invites.error || notes.error) {
    throw new Error("Lecture de l'historique impossible.");
  }

  return buildActivity({
    profile: { id: athlete.id, createdAt: athlete.createdAt },
    goals: (goals.data ?? []).map((row) => ({
      id: row.id,
      // Les contraintes CHECK en base garantissent ces listes fermées.
      type: row.goal_type as GoalType,
      competitionName: row.competition_name,
      status: row.status as GoalStatus,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    })),
    references: (references.data ?? []).map((row) => ({
      id: row.id,
      kind: row.kind as ReferenceKind,
      paceMin: row.pace_min_sec_per_km,
      paceMax: row.pace_max_sec_per_km,
      bpm: row.bpm,
      exercise: row.exercise_label,
      loadKg: row.load_kg === null ? null : Number(row.load_kg),
      reps: row.reps,
      measuredOn: row.measured_on,
      createdAt: row.created_at,
    })),
    records: (records.data ?? []).map((row) => ({
      id: row.id,
      event: row.event as RecordEvent,
      hyroxCategory: row.hyrox_category as HyroxCategory | null,
      timeSeconds: row.time_seconds,
      achievedOn: row.achieved_on,
      raceName: row.race_name,
      createdAt: row.created_at,
    })),
    consents,
    invites: (invites.data ?? []).map((row) => ({
      id: row.id,
      createdAt: row.created_at,
      acceptedAt: row.accepted_at,
      revokedAt: row.revoked_at,
    })),
    notes: (notes.data ?? []).map((row) => ({
      visibility: row.visibility as NoteVisibility,
      updatedAt: row.updated_at,
    })),
  });
}
