import "server-only";

import { WEEKDAYS, type Weekday } from "@/domain/training/session-v2";
import { aimFor } from "@/features/programs/template-use";
import type { createClient } from "@/lib/supabase/server";

import { isUsableExercise } from "./program";

// Exercices cités dans des séances écrites par l'assistant (champ `exerciseId`, à toute profondeur :
// exercice, superset, EMOM…) : chacun doit être visible par l'organisation dans la Bibliothèque
// (catalogue Coory ou exercice de CETTE organisation, actif et non archivé : relecture du lot 3a,
// n°6). Vérifié à la proposition ET au « Valider » (la carte vient du navigateur : aucune confiance).
type Supabase = Awaited<ReturnType<typeof createClient>>;

function exerciseIds(value: unknown, found = new Set<string>()): Set<string> {
  if (Array.isArray(value)) value.forEach((item) => exerciseIds(item, found));
  else if (value && typeof value === "object") {
    for (const [key, inner] of Object.entries(value)) {
      if (key === "exerciseId" && typeof inner === "string") found.add(inner);
      else exerciseIds(inner, found);
    }
  }
  return found;
}

export async function hasUnknownExercise(
  supabase: Supabase,
  organizationId: string,
  value: unknown,
): Promise<boolean> {
  const ids = [...exerciseIds(value)];
  if (ids.length === 0) return false;
  const { data } = await supabase
    .from("exercises")
    .select("id, organization_id, visibility, archived_at")
    .in("id", ids);
  return (data ?? []).filter((row) => isUsableExercise(row, organizationId)).length !== ids.length;
}

// Ce que l'assistant de création lit d'un sportif pour un programme (relecture du lot 3a, n°7 et
// n°9) : ses jours disponibles (jours proposés en jours fixes) et la façon de viser par défaut (FC
// sans VMA, % avec des charges maximales liées à un exercice), comme aimFor dans l'assistant.
export async function athletePlanFacts(
  supabase: Supabase,
  organizationId: string,
  athleteId: string | null,
): Promise<{ availableDays: Weekday[]; aim: ReturnType<typeof aimFor> }> {
  if (!athleteId) return { availableDays: [], aim: aimFor(undefined) };
  const [profile, metrics] = await Promise.all([
    supabase
      .from("athlete_profiles")
      .select("available_days")
      .eq("organization_id", organizationId)
      .eq("id", athleteId)
      .maybeSingle(),
    supabase
      .from("athlete_reference_metrics")
      .select("kind, exercise_id")
      .eq("organization_id", organizationId)
      .eq("athlete_id", athleteId),
  ]);
  const rows = metrics.data ?? [];
  const availableDays = (profile.data?.available_days ?? []).filter((day): day is Weekday =>
    (WEEKDAYS as readonly string[]).includes(day),
  );
  const aim = aimFor({
    hasVma: rows.some((row) => row.kind === "pace_vma"),
    hasLinkedMaxes: rows.some((row) => row.kind === "strength_load" && row.exercise_id !== null),
  } as Parameters<typeof aimFor>[0]);
  return { availableDays, aim };
}

export const UNKNOWN_EXERCISE =
  "Exercice introuvable : prends les id donnés par chercher_exercices.";
