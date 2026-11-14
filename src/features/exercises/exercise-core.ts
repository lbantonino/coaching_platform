import "server-only";

import { randomUUID } from "node:crypto";

import { revalidatePath } from "next/cache";

import {
  EXERCISE_PHOTO_MAX_BYTES,
  isExercisePhotoPath,
  parseCoachExerciseForm,
  readCoachExerciseForm,
  type CoachExerciseInput,
} from "@/domain/exercises/coach-exercise";
import { isDemoAccount } from "@/features/demo/queries";
import { DEMO_NO_FILES } from "@/features/demo/rules";
import { checkPhoto } from "@/features/photos/validate";
import { createClient } from "@/lib/supabase/server";

// Cœur de « Modifier l'exercice » (exercices du coach, D-76), SANS redirection : l'action du
// formulaire l'appelle puis redirige ; l'Assistant IA (lot 5, D-184) l'appelle depuis
// executeAssistantAction après requireOrgAccess. Jamais dans un fichier « use server ».

const BUCKET = "exercise-images";

type Photo = { bytes: Uint8Array; contentType: string; ext: string };

// On ne croit ni le nom ni le type annoncé du fichier : on lit ses premiers octets.
export async function readPhoto(
  formData: FormData,
): Promise<{ photo: Photo | null } | { error: string }> {
  const file = formData.get("photo");
  if (!(file instanceof File) || file.size === 0) return { photo: null };
  // Compte de démonstration partagé (OPEN-24) : l'exercice oui, sa photo non.
  if (await isDemoAccount()) return { error: DEMO_NO_FILES };
  const bytes = new Uint8Array(await file.arrayBuffer());
  const check = checkPhoto(bytes, EXERCISE_PHOTO_MAX_BYTES);
  if (!check.ok) return { error: check.error };
  return { photo: { bytes, contentType: check.contentType, ext: check.ext } };
}

export async function saveCoachExercise(
  orgId: string,
  exerciseId: string,
  formData: FormData,
): Promise<{ ok: true } | { ok: false; error: string; values: CoachExerciseInput }> {
  const input = readCoachExerciseForm(formData);
  const fail = (error: string) => ({ ok: false as const, error, values: input });
  const parsed = parseCoachExerciseForm(input);
  if (!parsed.ok) return fail(parsed.error);
  const read = await readPhoto(formData);
  if ("error" in read) return fail(read.error);

  const supabase = await createClient();
  const { data: current } = await supabase
    .from("exercises")
    .select("id, image_main")
    .eq("id", exerciseId)
    .eq("organization_id", orgId)
    .maybeSingle();
  if (!current) return fail("Exercice introuvable.");

  // Nouvelle photo : remplace l'ancienne ; « Retirer la photo » : plus de photo.
  const newPath = read.photo ? `org/${orgId}/${randomUUID()}.${read.photo.ext}` : null;
  if (read.photo && newPath) {
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(newPath, read.photo.bytes, { contentType: read.photo.contentType });
    if (error) return fail("La photo n'a pas pu être enregistrée. Réessaie.");
  }
  const imagePath = newPath ?? (formData.get("removePhoto") === "on" ? null : current.image_main);
  const values = parsed.values;
  const { data: updated, error } = await supabase
    .from("exercises")
    .update({
      name_fr: values.nameFr,
      category: values.category,
      equipment: values.equipment,
      primary_muscles: values.primaryMuscles,
      bodyweight: values.bodyweight,
      instructions_fr: values.instructions,
      image_main: imagePath,
      image_source: imagePath ? "coach" : null,
      video_url: values.videoUrl,
    })
    .eq("id", exerciseId)
    .eq("organization_id", orgId)
    .select("id");
  if (error || !updated?.length) {
    if (newPath) await supabase.storage.from(BUCKET).remove([newPath]);
    return fail("L'exercice n'a pas pu être enregistré. Réessaie.");
  }
  if (
    current.image_main &&
    current.image_main !== imagePath &&
    isExercisePhotoPath(current.image_main)
  ) {
    await supabase.storage.from(BUCKET).remove([current.image_main]);
  }

  revalidatePath("/coach/bibliotheque", "layout");
  return { ok: true };
}
