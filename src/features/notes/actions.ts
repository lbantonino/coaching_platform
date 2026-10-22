"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getAthlete } from "@/features/athletes/queries";
import { requireOrgAccess } from "@/features/auth/guards";
import { createClient } from "@/lib/supabase/server";

import { noteBodySchema, noteVisibilitySchema, type NoteVisibility } from "./schemas";

// `body` : saisie renvoyée en cas d'erreur ; `attempt` reconstruit le formulaire après chaque réponse.
export type SaveNoteState = {
  error: string | null;
  saved: boolean;
  attempt: number;
  body: string | null;
};

// Enregistre (crée, met à jour ou supprime si vide) la note privée ou la note visible par le sportif.
export async function saveNote(
  organizationId: string,
  athleteId: string,
  visibility: NoteVisibility,
  previous: SaveNoteState,
  formData: FormData,
): Promise<SaveNoteState> {
  const { user, membership } = await requireOrgAccess(organizationId);
  const attempt = previous.attempt + 1;
  const rawBody = String(formData.get("body") ?? "");
  const fail = (error: string): SaveNoteState => ({ error, saved: false, attempt, body: rawBody });

  if (!z.uuid().safeParse(athleteId).success || !noteVisibilitySchema.safeParse(visibility).success)
    return fail("Note introuvable.");
  const athlete = await getAthlete(membership.organizationId, athleteId);
  if (!athlete) return fail("Sportif introuvable.");

  const parsed = noteBodySchema.safeParse(rawBody);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Saisie invalide.");
  const body = parsed.data;

  const supabase = await createClient();
  const scope = { organization_id: membership.organizationId, athlete_id: athlete.id, visibility };
  const { data: existing, error: readError } = await supabase
    .from("athlete_notes")
    .select("id")
    .match(scope)
    .maybeSingle();
  if (readError) return fail("La note n'a pas pu être enregistrée. Réessaie.");

  let error;
  if (body === "") {
    // Note vidée : on la supprime (pas de note vide en base).
    if (existing) ({ error } = await supabase.from("athlete_notes").delete().eq("id", existing.id));
  } else if (existing) {
    ({ error } = await supabase
      .from("athlete_notes")
      .update({ body, updated_by: user.id })
      .eq("id", existing.id));
  } else {
    ({ error } = await supabase
      .from("athlete_notes")
      .insert({ ...scope, body, created_by: user.id, updated_by: user.id }));
  }
  if (error) return fail("La note n'a pas pu être enregistrée. Réessaie.");

  revalidatePath(`/coach/o/${membership.organizationId}/sportifs/${athlete.id}`);
  return { error: null, saved: true, attempt, body: null };
}
