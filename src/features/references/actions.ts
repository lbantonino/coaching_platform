"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getAthlete } from "@/features/athletes/queries";
import { requireOrgAccess } from "@/features/auth/guards";
import { todayIsoInBrussels } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

import { parseReferenceForm, type ReferenceFormInput } from "./schemas";

// `values` : saisie renvoyée en cas d'erreur, car React 19 vide le formulaire après chaque envoi.
export type AddReferenceState = {
  error: string | null;
  saved: number;
  values: ReferenceFormInput | null;
};

export async function addReference(
  organizationId: string,
  athleteId: string,
  previous: AddReferenceState,
  formData: FormData,
): Promise<AddReferenceState> {
  const { user, membership } = await requireOrgAccess(organizationId);
  const athlete = await getAthlete(membership.organizationId, athleteId);
  if (!athlete) return { error: "Sportif introuvable.", saved: previous.saved, values: null };

  const field = (name: string) => String(formData.get(name) ?? "");
  const input: ReferenceFormInput = {
    kind: field("kind"),
    pace: field("pace"),
    bpm: field("bpm"),
    exercise: field("exercise"),
    loadKg: field("loadKg"),
    reps: field("reps"),
    source: field("source"),
    measuredOn: field("measuredOn"),
    note: field("note"),
  };
  const parsed = parseReferenceForm(input, todayIsoInBrussels());
  if (!parsed.ok) return { error: parsed.error, saved: previous.saved, values: input };

  const supabase = await createClient();
  const { error } = await supabase.from("athlete_reference_metrics").insert({
    ...parsed.values,
    organization_id: membership.organizationId,
    athlete_id: athlete.id,
    created_by: user.id,
  });
  if (error)
    return {
      error: "Le repère n'a pas pu être enregistré. Réessaie.",
      saved: previous.saved,
      values: input,
    };

  revalidatePath(`/coach/o/${membership.organizationId}/sportifs/${athlete.id}`);
  // `saved` s'incrémente : le formulaire s'en sert pour se vider après chaque ajout réussi.
  return { error: null, saved: previous.saved + 1, values: null };
}

// Suppression d'une mesure erronée (l'historique ne se modifie pas : on supprime puis on ressaisit).
export async function deleteReference(
  organizationId: string,
  athleteId: string,
  referenceId: string,
) {
  const { membership } = await requireOrgAccess(organizationId);
  if (!z.uuid().safeParse(referenceId).success) return;

  const supabase = await createClient();
  await supabase
    .from("athlete_reference_metrics")
    .delete()
    .eq("id", referenceId)
    .eq("athlete_id", athleteId)
    .eq("organization_id", membership.organizationId);

  revalidatePath(`/coach/o/${membership.organizationId}/sportifs/${athleteId}`);
}
