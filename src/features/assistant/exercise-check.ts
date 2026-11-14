import "server-only";

import type { createClient } from "@/lib/supabase/server";

// Exercices cités dans des séances écrites par l'assistant (champ `exerciseId`, à toute profondeur :
// exercice, superset, EMOM…) : chacun doit être visible par l'organisation dans la Bibliothèque
// (catalogue Coory ou exercice du coach, filtrés par RLS). Vérifié à la proposition ET au « Valider »
// (la carte vient du navigateur : aucune confiance).
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

export async function hasUnknownExercise(supabase: Supabase, value: unknown): Promise<boolean> {
  const ids = [...exerciseIds(value)];
  if (ids.length === 0) return false;
  const { data } = await supabase.from("exercises").select("id").in("id", ids);
  return (data ?? []).length !== ids.length;
}

export const UNKNOWN_EXERCISE =
  "Exercice introuvable : prends les id donnés par chercher_exercices.";
