"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import {
  isExercisePhotoPath,
  parseCoachExerciseForm,
  readCoachExerciseForm,
  type CoachExerciseInput,
} from "@/domain/exercises/coach-exercise";
import { requireOrgAccess } from "@/features/auth/guards";
import { createClient } from "@/lib/supabase/server";

import { insertCoachExercise } from "./create-exercise";
import { readPhoto, saveCoachExercise } from "./exercise-core";

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
  if (!z.uuid().safeParse(exerciseId).success) {
    return {
      error: "Exercice introuvable.",
      attempt: previous.attempt + 1,
      values: readCoachExerciseForm(formData),
    };
  }
  // Le cœur partagé avec l'Assistant IA (lot 5) : exercise-core.ts.
  const saved = await saveCoachExercise(membership.organizationId, exerciseId, formData);
  if (!saved.ok) return { error: saved.error, attempt: previous.attempt + 1, values: saved.values };
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
