import "server-only";

import { randomUUID } from "node:crypto";

import type { CoachExerciseValues } from "@/domain/exercises/coach-exercise";
import { createClient } from "@/lib/supabase/server";

// Création d'un exercice du coach (D-76), partagée par le formulaire « Créer un exercice »
// (createCoachExercise, qui redirige ensuite vers la page de l'exercice) et par l'Assistant IA (carte
// « Nouvel exercice », lot 2, D-181). L'appelant a déjà vérifié l'accès à l'organisation
// (requireOrgAccess) et validé le formulaire (parseCoachExerciseForm) : `orgId` vient de la session.
const BUCKET = "exercise-images";

export type ExercisePhoto = { bytes: Uint8Array; contentType: string; ext: string };

export async function insertCoachExercise(
  orgId: string,
  userId: string,
  values: CoachExerciseValues,
  {
    photo = null,
    variantOf = null,
  }: { photo?: ExercisePhoto | null; variantOf?: string | null } = {},
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const supabase = await createClient();
  const id = randomUUID();
  const imagePath = photo ? `org/${orgId}/${randomUUID()}.${photo.ext}` : null;
  if (photo && imagePath) {
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(imagePath, photo.bytes, { contentType: photo.contentType });
    if (error) return { ok: false, error: "La photo n'a pas pu être enregistrée. Réessaie." };
  }
  const { error } = await supabase.from("exercises").insert({
    id,
    organization_id: orgId,
    name_fr: values.nameFr,
    category: values.category,
    equipment: values.equipment,
    primary_muscles: values.primaryMuscles,
    bodyweight: values.bodyweight,
    instructions_fr: values.instructions,
    image_main: imagePath,
    image_source: imagePath ? "coach" : null,
    video_url: values.videoUrl,
    variant_of: variantOf,
    source: "coach",
    created_by: userId,
  });
  if (error) {
    if (imagePath) await supabase.storage.from(BUCKET).remove([imagePath]);
    return { ok: false, error: "L'exercice n'a pas pu être enregistré. Réessaie." };
  }
  return { ok: true, id };
}
