"use server";

import { revalidatePath } from "next/cache";

import { getAthlete } from "@/features/athletes/queries";
import { requireCoach, requireOrgAccess } from "@/features/auth/guards";
import { createClient } from "@/lib/supabase/server";

import { checkPhoto, PHOTO_MAX_BYTES } from "./validate";

const BUCKET = "profile-photos";

// `attempt` change à chaque réponse : le champ fichier se vide et le message se met à jour.
export type PhotoState = { error: string | null; saved: boolean; attempt: number };

async function readPhoto(formData: FormData) {
  const file = formData.get("photo");
  if (!(file instanceof File) || file.size === 0) return { error: "Choisis une photo." } as const;
  // Refus avant lecture : on ne charge pas en mémoire un fichier déjà trop lourd.
  if (file.size > PHOTO_MAX_BYTES) return { error: "Photo trop lourde : 2 Mo maximum." } as const;
  const bytes = new Uint8Array(await file.arrayBuffer());
  const check = checkPhoto(bytes);
  if (!check.ok) return { error: check.error } as const;
  return { bytes, check } as const;
}

// Photo d'un sportif : déposée dans le dossier de SON organisation, puis l'ancienne est supprimée.
export async function uploadAthletePhoto(
  organizationId: string,
  athleteId: string,
  previous: PhotoState,
  formData: FormData,
): Promise<PhotoState> {
  const { membership } = await requireOrgAccess(organizationId);
  const orgId = membership.organizationId;
  const fail = (error: string) => ({ error, saved: false, attempt: previous.attempt + 1 });
  const athlete = await getAthlete(orgId, athleteId);
  if (!athlete) return fail("Sportif introuvable.");

  const photo = await readPhoto(formData);
  if ("error" in photo) return fail(photo.error ?? "Photo invalide.");

  const supabase = await createClient();
  const path = `org/${orgId}/athlete/${athlete.id}/${crypto.randomUUID()}.${photo.check.ext}`;
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, photo.bytes, { contentType: photo.check.contentType, upsert: false });
  if (uploadError) return fail("La photo n'a pas pu être envoyée. Réessaie.");

  const { error } = await supabase
    .from("athlete_profiles")
    .update({ photo_path: path })
    .eq("id", athlete.id)
    .eq("organization_id", orgId);
  if (error) {
    await supabase.storage.from(BUCKET).remove([path]);
    return fail("La photo n'a pas pu être enregistrée. Réessaie.");
  }
  if (athlete.photoPath) await supabase.storage.from(BUCKET).remove([athlete.photoPath]);

  revalidatePath(`/coach/o/${orgId}`, "layout");
  return { error: null, saved: true, attempt: previous.attempt + 1 };
}

export async function removeAthletePhoto(organizationId: string, athleteId: string) {
  const { membership } = await requireOrgAccess(organizationId);
  const orgId = membership.organizationId;
  const athlete = await getAthlete(orgId, athleteId);
  if (!athlete?.photoPath) return;

  const supabase = await createClient();
  const { error } = await supabase
    .from("athlete_profiles")
    .update({ photo_path: null })
    .eq("id", athlete.id)
    .eq("organization_id", orgId);
  if (!error) await supabase.storage.from(BUCKET).remove([athlete.photoPath]);
  revalidatePath(`/coach/o/${orgId}`, "layout");
}

// Photo du coach connecté : uniquement dans SON dossier (la base refuse tout autre dossier).
export async function uploadCoachPhoto(
  previous: PhotoState,
  formData: FormData,
): Promise<PhotoState> {
  const { user } = await requireCoach();
  const fail = (error: string) => ({ error, saved: false, attempt: previous.attempt + 1 });
  const photo = await readPhoto(formData);
  if ("error" in photo) return fail(photo.error ?? "Photo invalide.");

  const supabase = await createClient();
  const { data: current } = await supabase
    .from("coach_profiles")
    .select("photo_path")
    .eq("user_id", user.id)
    .maybeSingle();
  const path = `user/${user.id}/${crypto.randomUUID()}.${photo.check.ext}`;
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, photo.bytes, { contentType: photo.check.contentType, upsert: false });
  if (uploadError) return fail("La photo n'a pas pu être envoyée. Réessaie.");

  const { error } = await supabase
    .from("coach_profiles")
    .upsert({ user_id: user.id, photo_path: path }, { onConflict: "user_id" });
  if (error) {
    await supabase.storage.from(BUCKET).remove([path]);
    return fail("La photo n'a pas pu être enregistrée. Réessaie.");
  }
  if (current?.photo_path) await supabase.storage.from(BUCKET).remove([current.photo_path]);

  revalidatePath("/coach", "layout");
  return { error: null, saved: true, attempt: previous.attempt + 1 };
}

export async function removeCoachPhoto() {
  const { user } = await requireCoach();
  const supabase = await createClient();
  const { data: current } = await supabase
    .from("coach_profiles")
    .select("photo_path")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!current?.photo_path) return;
  const { error } = await supabase
    .from("coach_profiles")
    .update({ photo_path: null })
    .eq("user_id", user.id);
  if (!error) await supabase.storage.from(BUCKET).remove([current.photo_path]);
  revalidatePath("/coach", "layout");
}
