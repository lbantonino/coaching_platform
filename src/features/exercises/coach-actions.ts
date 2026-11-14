"use server";

import { randomUUID } from "node:crypto";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import {
  EXERCISE_PHOTO_MAX_BYTES,
  isExercisePhotoPath,
  parseCoachExerciseForm,
  readCoachExerciseForm,
  type CoachExerciseInput,
} from "@/domain/exercises/coach-exercise";
import { requireOrgAccess } from "@/features/auth/guards";
import { checkPhoto } from "@/features/photos/validate";
import { isDemoAccount } from "@/features/demo/queries";
import { DEMO_NO_FILES } from "@/features/demo/rules";
import { createClient } from "@/lib/supabase/server";

import { insertCoachExercise } from "./create-exercise";

// Exercices du coach (D-76) : créer, modifier, supprimer. Chaque action revérifie l'accès à
// l'organisation et valide le formulaire ; la RLS n'autorise l'écriture que sur les exercices de
// SON organisation (le catalogue commun reste en lecture seule). La photo va dans le stockage privé.
export type CoachExerciseFormState = {
  error: string | null;
  // Reconstruit le formulaire après chaque réponse ; `values` rend la saisie en cas d'erreur.
  attempt: number;
  values: CoachExerciseInput | null;
};

const BUCKET = "exercise-images";

type Photo = { bytes: Uint8Array; contentType: string; ext: string };

// On ne croit ni le nom ni le type annoncé du fichier : on lit ses premiers octets.
async function readPhoto(formData: FormData): Promise<{ photo: Photo | null } | { error: string }> {
  const file = formData.get("photo");
  if (!(file instanceof File) || file.size === 0) return { photo: null };
  // Compte de démonstration partagé (OPEN-24) : l'exercice oui, sa photo non.
  if (await isDemoAccount()) return { error: DEMO_NO_FILES };
  const bytes = new Uint8Array(await file.arrayBuffer());
  const check = checkPhoto(bytes, EXERCISE_PHOTO_MAX_BYTES);
  if (!check.ok) return { error: check.error };
  return { photo: { bytes, contentType: check.contentType, ext: check.ext } };
}

function revalidateLibrary() {
  revalidatePath("/coach/bibliotheque", "layout");
}

export async function createCoachExercise(
  organizationId: string,
  previous: CoachExerciseFormState,
  formData: FormData,
): Promise<CoachExerciseFormState> {
  const { user, membership } = await requireOrgAccess(organizationId);
  const input = readCoachExerciseForm(formData);
  const fail = (error: string) => ({ error, attempt: previous.attempt + 1, values: input });
  const parsed = parseCoachExerciseForm(input);
  if (!parsed.ok) return fail(parsed.error);
  const read = await readPhoto(formData);
  if ("error" in read) return fail(read.error);

  const supabase = await createClient();
  // « Créer ma variante » : l'exercice d'origine doit être visible (catalogue ou organisation).
  const variantRaw = formData.get("variantOf");
  let variantOf: string | null = null;
  if (typeof variantRaw === "string" && variantRaw) {
    const { data } = z.uuid().safeParse(variantRaw).success
      ? await supabase.from("exercises").select("id").eq("id", variantRaw).maybeSingle()
      : { data: null };
    if (!data) return fail("L'exercice d'origine est introuvable.");
    variantOf = data.id;
  }

  // Le MÊME enregistrement que la carte « Nouvel exercice » de l'Assistant IA (lot 2, D-181).
  const created = await insertCoachExercise(membership.organizationId, user.id, parsed.values, {
    photo: read.photo,
    variantOf,
  });
  if (!created.ok) return fail(created.error);

  revalidateLibrary();
  redirect(`/coach/bibliotheque/${created.id}`);
}

export async function updateCoachExercise(
  organizationId: string,
  exerciseId: string,
  previous: CoachExerciseFormState,
  formData: FormData,
): Promise<CoachExerciseFormState> {
  const { membership } = await requireOrgAccess(organizationId);
  const input = readCoachExerciseForm(formData);
  const fail = (error: string) => ({ error, attempt: previous.attempt + 1, values: input });
  if (!z.uuid().safeParse(exerciseId).success) return fail("Exercice introuvable.");
  const parsed = parseCoachExerciseForm(input);
  if (!parsed.ok) return fail(parsed.error);
  const read = await readPhoto(formData);
  if ("error" in read) return fail(read.error);

  const orgId = membership.organizationId;
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

  revalidateLibrary();
  redirect(`/coach/bibliotheque/${exerciseId}`);
}

export async function deleteCoachExercise(
  organizationId: string,
  exerciseId: string,
): Promise<{ ok: boolean }> {
  const { membership } = await requireOrgAccess(organizationId);
  if (!z.uuid().safeParse(exerciseId).success) return { ok: false };
  const supabase = await createClient();
  const { data: deleted, error } = await supabase
    .from("exercises")
    .delete()
    .eq("id", exerciseId)
    .eq("organization_id", membership.organizationId)
    .select("image_main");
  if (error || !deleted?.length) return { ok: false };
  const photo = deleted[0].image_main;
  if (photo && isExercisePhotoPath(photo)) await supabase.storage.from(BUCKET).remove([photo]);

  revalidateLibrary();
  return { ok: true };
}
