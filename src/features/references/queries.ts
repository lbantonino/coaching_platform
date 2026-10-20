import "server-only";

import { createClient } from "@/lib/supabase/server";

import { referenceKindLabels, type ReferenceKind, type ReferenceSource } from "./schemas";

export type ReferenceEntry = {
  id: string;
  kind: ReferenceKind;
  paceMin: number | null;
  paceMax: number | null;
  bpm: number | null;
  exercise: string | null;
  loadKg: number | null;
  reps: number | null;
  source: ReferenceSource;
  measuredOn: string;
  note: string | null;
};

export type AthleteReferences = {
  // Valeur actuelle de chaque repère = mesure la plus récente (par exercice pour les charges).
  current: ReferenceEntry[];
  history: ReferenceEntry[];
};

// Repères d'un sportif, dans une organisation dont l'accès a DÉJÀ été vérifié (requireOrgAccess).
export async function listReferences(
  organizationId: string,
  athleteId: string,
): Promise<AthleteReferences> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("athlete_reference_metrics")
    .select(
      "id, kind, pace_min_sec_per_km, pace_max_sec_per_km, bpm, exercise_label, load_kg, reps, source, measured_on, coach_note",
    )
    .eq("organization_id", organizationId)
    .eq("athlete_id", athleteId)
    .order("measured_on", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw new Error("Lecture des repères impossible.");

  const history: ReferenceEntry[] = (data ?? []).map((row) => ({
    id: row.id,
    // Les contraintes CHECK en base garantissent ces valeurs.
    kind: row.kind as ReferenceKind,
    paceMin: row.pace_min_sec_per_km,
    paceMax: row.pace_max_sec_per_km,
    bpm: row.bpm,
    exercise: row.exercise_label,
    loadKg: row.load_kg === null ? null : Number(row.load_kg),
    reps: row.reps,
    source: row.source as ReferenceSource,
    measuredOn: row.measured_on,
    note: row.coach_note,
  }));

  const seen = new Set<string>();
  const current = history.filter((entry) => {
    const key =
      entry.kind === "strength_load"
        ? `${entry.kind}:${entry.exercise?.toLowerCase()}`
        : entry.kind;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Ordre d'affichage fixe : allures (de l'endurance au race pace), puis FC, puis charges.
  const order = Object.keys(referenceKindLabels);
  current.sort((a, b) => order.indexOf(a.kind) - order.indexOf(b.kind));

  return { current, history };
}
