"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getAthlete } from "@/features/athletes/queries";
import { requireOrgAccess } from "@/features/auth/guards";
import { todayIsoInBrussels } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

import { parseReferenceForm, type ReferenceFormInput } from "./schemas";
import { parseTestForm } from "./test-form";

// `values` : saisie renvoyée en cas d'erreur, car React 19 vide le formulaire après chaque envoi.
// `attempt` change à CHAQUE réponse : le formulaire est reconstruit, menu « Type de repère » compris.
export type AddReferenceState = {
  error: string | null;
  saved: number;
  attempt: number;
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
  if (!athlete)
    return {
      error: "Sportif introuvable.",
      saved: previous.saved,
      attempt: previous.attempt + 1,
      values: null,
    };

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
  if (!parsed.ok)
    return {
      error: parsed.error,
      saved: previous.saved,
      attempt: previous.attempt + 1,
      values: input,
    };

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
      attempt: previous.attempt + 1,
      values: input,
    };

  revalidatePath(`/coach/o/${membership.organizationId}/sportifs/${athlete.id}`);
  // `saved` s'incrémente : le formulaire s'en sert pour se vider après chaque ajout réussi.
  return { error: null, saved: previous.saved + 1, attempt: previous.attempt + 1, values: null };
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

export type TestReferenceState = { error: string | null; saved: number };

// Enregistre les allures calculées depuis un test (Cooper ou 5 km), après validation du coach.
// Le serveur REFAIT le calcul depuis le résultat brut : il ne fait jamais confiance aux chiffres du navigateur.
export async function addReferencesFromTest(
  organizationId: string,
  athleteId: string,
  previous: TestReferenceState,
  formData: FormData,
): Promise<TestReferenceState> {
  const { user, membership } = await requireOrgAccess(organizationId);
  const athlete = await getAthlete(membership.organizationId, athleteId);
  if (!athlete) return { error: "Sportif introuvable.", saved: previous.saved };

  const parsed = parseTestForm(
    {
      test: String(formData.get("test") ?? ""),
      distance: String(formData.get("distance") ?? ""),
      time: String(formData.get("time") ?? ""),
      measuredOn: String(formData.get("measuredOn") ?? ""),
      zones: formData.getAll("zones").map(String),
    },
    todayIsoInBrussels(),
  );
  if (!parsed.ok) return { error: parsed.error, saved: previous.saved };

  const supabase = await createClient();
  const { error } = await supabase.from("athlete_reference_metrics").insert(
    parsed.rows.map((row) => ({
      ...row,
      organization_id: membership.organizationId,
      athlete_id: athlete.id,
      created_by: user.id,
    })),
  );
  if (error)
    return {
      error: "Les allures n'ont pas pu être enregistrées. Réessaie.",
      saved: previous.saved,
    };

  revalidatePath(`/coach/o/${membership.organizationId}/sportifs/${athlete.id}`);
  return { error: null, saved: previous.saved + 1 };
}
