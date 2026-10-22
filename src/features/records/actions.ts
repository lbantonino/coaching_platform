"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getAthlete } from "@/features/athletes/queries";
import { requireOrgAccess } from "@/features/auth/guards";
import { todayIsoInBrussels } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

import { parseRecordForm, type RecordFormInput } from "./schemas";

// `values` : saisie renvoyée en cas d'erreur, car React 19 vide le formulaire après chaque envoi.
// `attempt` change à CHAQUE réponse : le formulaire est reconstruit, menus déroulants compris.
export type AddRecordState = {
  error: string | null;
  saved: number;
  attempt: number;
  values: RecordFormInput | null;
};

export async function addRecord(
  organizationId: string,
  athleteId: string,
  previous: AddRecordState,
  formData: FormData,
): Promise<AddRecordState> {
  const { user, membership } = await requireOrgAccess(organizationId);
  const athlete = await getAthlete(membership.organizationId, athleteId);
  if (!athlete)
    return {
      error: "Sportif introuvable.",
      saved: previous.saved,
      attempt: previous.attempt + 1,
      values: null,
    };

  const field = (name: string) => String(formData.get(name) ?? "");
  const input: RecordFormInput = {
    event: field("event"),
    hyroxCategory: field("hyroxCategory"),
    time: field("time"),
    achievedOn: field("achievedOn"),
    raceName: field("raceName"),
  };
  const parsed = parseRecordForm(input, todayIsoInBrussels());
  if (!parsed.ok)
    return {
      error: parsed.error,
      saved: previous.saved,
      attempt: previous.attempt + 1,
      values: input,
    };

  const supabase = await createClient();
  const { error } = await supabase.from("athlete_personal_records").insert({
    ...parsed.values,
    organization_id: membership.organizationId,
    athlete_id: athlete.id,
    created_by: user.id,
  });
  if (error)
    return {
      error: "La performance n'a pas pu être enregistrée. Réessaie.",
      saved: previous.saved,
      attempt: previous.attempt + 1,
      values: input,
    };

  revalidatePath(`/coach/o/${membership.organizationId}/sportifs/${athlete.id}`);
  return { error: null, saved: previous.saved + 1, attempt: previous.attempt + 1, values: null };
}

// Suppression d'une performance erronée (l'historique ne se modifie pas : on supprime puis on ressaisit).
export async function deleteRecord(organizationId: string, athleteId: string, recordId: string) {
  const { membership } = await requireOrgAccess(organizationId);
  if (!z.uuid().safeParse(recordId).success) return;

  const supabase = await createClient();
  await supabase
    .from("athlete_personal_records")
    .delete()
    .eq("id", recordId)
    .eq("athlete_id", athleteId)
    .eq("organization_id", membership.organizationId);

  revalidatePath(`/coach/o/${membership.organizationId}/sportifs/${athleteId}`);
}
