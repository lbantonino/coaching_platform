import "server-only";

import { todayIsoInBrussels } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

import { parseNewAthleteForm, type NewAthleteFormInput } from "./new-athlete";

// Création d'un sportif (fiche, objectif principal, accord santé et note du coach), partagée par le
// formulaire « Nouveau sportif » (createAthlete, qui redirige ensuite vers la fiche) et par l'Assistant
// IA (carte « Nouvelle fiche sportif », lot 1 des actions). L'appelant a déjà vérifié l'accès à
// l'organisation (requireOrgAccess) : `orgId` vient de la session, jamais du navigateur.
// `incomplete` : la fiche est créée mais un élément secondaire (note, objectif, accord) n'a pas pu
// l'être.
export async function insertAthlete(
  orgId: string,
  userId: string,
  values: NewAthleteFormInput,
): Promise<{ ok: true; id: string; incomplete: boolean } | { ok: false; error: string }> {
  const parsed = parseNewAthleteForm(values, todayIsoInBrussels());
  if (!parsed.ok) return { ok: false, error: parsed.error };
  const { profile, goal, consent, coachNote } = parsed.values;

  const supabase = await createClient();
  const { data: athlete, error } = await supabase
    .from("athlete_profiles")
    .insert({ ...profile, organization_id: orgId, created_by: userId })
    .select("id")
    .single();
  if (error || !athlete) {
    return {
      ok: false,
      error:
        error?.code === "23505"
          ? "Un sportif de ton organisation utilise déjà cette adresse e-mail."
          : "Le sportif n'a pas pu être enregistré. Réessaie.",
    };
  }

  let incomplete = false;
  if (coachNote) {
    const { error: noteError } = await supabase.from("athlete_notes").insert({
      organization_id: orgId,
      athlete_id: athlete.id,
      visibility: "coach",
      body: coachNote,
      created_by: userId,
      updated_by: userId,
    });
    incomplete ||= Boolean(noteError);
  }
  if (goal) {
    const { error: goalError } = await supabase.from("athlete_goals").insert({
      ...goal,
      organization_id: orgId,
      athlete_id: athlete.id,
      created_by: userId,
    });
    incomplete ||= Boolean(goalError);
  }
  if (consent) {
    const { error: consentError } = await supabase.rpc("grant_health_consent", {
      p_athlete_id: athlete.id,
      p_coach_proof: consent.proof,
    });
    incomplete ||= Boolean(consentError);
    if (!consentError && consent.healthConstraints !== null) {
      const { error: healthError } = await supabase
        .from("athlete_profiles")
        .update({ health_constraints: consent.healthConstraints })
        .eq("id", athlete.id)
        .eq("organization_id", orgId);
      incomplete ||= Boolean(healthError);
    }
  }

  return { ok: true, id: athlete.id, incomplete };
}
