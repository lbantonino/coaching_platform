"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAthlete, requireOrgAccess } from "@/features/auth/guards";
import { createClient } from "@/lib/supabase/server";

import { coachProofSchema, consentErrorMessage } from "./schemas";

// Toutes ces actions passent par les fonctions SQL grant_health_consent / withdraw_health_consent :
// elles revérifient qui appelle (sportif lié ou coach de l'organisation) et journalisent chaque accord.

export type CoachConsentState = { error: string | null; attempt: number };

// Le coach note l'accord explicite que le sportif lui a donné (et comment il l'a obtenu).
export async function grantHealthConsentByCoach(
  organizationId: string,
  athleteId: string,
  previous: CoachConsentState,
  formData: FormData,
): Promise<CoachConsentState> {
  const { membership } = await requireOrgAccess(organizationId);
  const attempt = previous.attempt + 1;
  if (!z.uuid().safeParse(athleteId).success) return { error: "Sportif introuvable.", attempt };

  if (formData.get("confirmed") !== "on") {
    return {
      error: "Coche la case pour confirmer que le sportif t'a donné son accord explicite.",
      attempt,
    };
  }
  const proof = coachProofSchema.safeParse(formData.get("proof"));
  if (!proof.success)
    return { error: proof.error.issues[0]?.message ?? "Saisie invalide.", attempt };

  const supabase = await createClient();
  const { error } = await supabase.rpc("grant_health_consent", {
    p_athlete_id: athleteId,
    p_coach_proof: proof.data,
  });
  if (error) return { error: consentErrorMessage(error.message), attempt };

  revalidatePath(`/coach/o/${membership.organizationId}/sportifs/${athleteId}`);
  return { error: null, attempt };
}

// Le coach note que le sportif a retiré son accord : les contraintes physiques sont effacées.
export async function withdrawHealthConsentByCoach(organizationId: string, athleteId: string) {
  const { membership } = await requireOrgAccess(organizationId);
  if (!z.uuid().safeParse(athleteId).success) return;

  const supabase = await createClient();
  await supabase.rpc("withdraw_health_consent", { p_athlete_id: athleteId });
  revalidatePath(`/coach/o/${membership.organizationId}/sportifs/${athleteId}`);
}

// Le sportif, depuis son espace, donne ou retire son accord pour SA fiche.
async function requireOwnProfile(athleteId: string) {
  const { links } = await requireAthlete();
  return links.some((link) => link.athleteId === athleteId);
}

export async function grantHealthConsentByAthlete(athleteId: string) {
  if (!(await requireOwnProfile(athleteId))) return;
  const supabase = await createClient();
  await supabase.rpc("grant_health_consent", { p_athlete_id: athleteId });
  revalidatePath("/app");
}

export async function withdrawHealthConsentByAthlete(athleteId: string) {
  if (!(await requireOwnProfile(athleteId))) return;
  const supabase = await createClient();
  await supabase.rpc("withdraw_health_consent", { p_athlete_id: athleteId });
  revalidatePath("/app");
}
