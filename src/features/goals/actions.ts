"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getAthlete } from "@/features/athletes/queries";
import { requireOrgAccess } from "@/features/auth/guards";
import type { SupabaseServerClient } from "@/features/auth/session";
import { todayIsoInBrussels } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

import { parseGoalForm, type GoalFormInput } from "./schemas";

// `values` : saisie renvoyée en cas d'erreur, car React 19 vide le formulaire après chaque envoi.
// `attempt` augmente à chaque réponse : le formulaire est alors reconstruit avec la saisie renvoyée.
// (Après un envoi, React remet le formulaire à ses valeurs de départ ; les listes déroulantes et les
// cases cochées n'en suivraient pas les mises à jour sans cette reconstruction.)
export type AddGoalState = {
  error: string | null;
  saved: number;
  attempt: number;
  values: GoalFormInput | null;
};

// Un seul objectif principal en cours : avant d'en désigner un nouveau, l'ancien passe en secondaire.
// (L'index unique en base le garantit de toute façon, même si deux demandes arrivaient en même temps.)
async function demoteCurrentMain(
  supabase: SupabaseServerClient,
  organizationId: string,
  athleteId: string,
) {
  return supabase
    .from("athlete_goals")
    .update({ priority: "secondary" })
    .eq("organization_id", organizationId)
    .eq("athlete_id", athleteId)
    .eq("status", "active")
    .eq("priority", "main");
}

export async function addGoal(
  organizationId: string,
  athleteId: string,
  previous: AddGoalState,
  formData: FormData,
): Promise<AddGoalState> {
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
  const input: GoalFormInput = {
    goalType: field("goalType"),
    priority: field("priority"),
    targetDate: field("targetDate"),
    isCompetition: formData.get("isCompetition") === "on",
    competitionName: field("competitionName"),
    competitionLocation: field("competitionLocation"),
    hyroxCategory: field("hyroxCategory"),
    description: field("description"),
  };
  const parsed = parseGoalForm(input, todayIsoInBrussels());
  if (!parsed.ok)
    return {
      error: parsed.error,
      saved: previous.saved,
      attempt: previous.attempt + 1,
      values: input,
    };

  const supabase = await createClient();
  if (parsed.values.priority === "main") {
    const { error } = await demoteCurrentMain(supabase, membership.organizationId, athlete.id);
    if (error)
      return {
        error: "L'objectif n'a pas pu être enregistré. Réessaie.",
        saved: previous.saved,
        attempt: previous.attempt + 1,
        values: input,
      };
  }
  const { error } = await supabase.from("athlete_goals").insert({
    ...parsed.values,
    organization_id: membership.organizationId,
    athlete_id: athlete.id,
    created_by: user.id,
  });
  if (error)
    return {
      error: "L'objectif n'a pas pu être enregistré. Réessaie.",
      saved: previous.saved,
      attempt: previous.attempt + 1,
      values: input,
    };

  revalidatePath(`/coach/o/${membership.organizationId}/sportifs/${athlete.id}`);
  return { error: null, saved: previous.saved + 1, attempt: previous.attempt + 1, values: null };
}

const goalIdSchema = z.uuid();
const closingStatusSchema = z.enum(["achieved", "dropped"]);

// Clôture d'un objectif : atteint ou abandonné. Il reste visible dans l'historique.
export async function setGoalStatus(
  organizationId: string,
  athleteId: string,
  goalId: string,
  status: "achieved" | "dropped",
) {
  const { membership } = await requireOrgAccess(organizationId);
  if (!goalIdSchema.safeParse(goalId).success || !closingStatusSchema.safeParse(status).success)
    return;

  const supabase = await createClient();
  await supabase
    .from("athlete_goals")
    .update({ status })
    .eq("id", goalId)
    .eq("athlete_id", athleteId)
    .eq("organization_id", membership.organizationId)
    .eq("status", "active");

  revalidatePath(`/coach/o/${membership.organizationId}/sportifs/${athleteId}`);
}

// Fait d'un objectif en cours le nouvel objectif principal (l'ancien principal devient secondaire).
export async function makeGoalMain(organizationId: string, athleteId: string, goalId: string) {
  const { membership } = await requireOrgAccess(organizationId);
  if (!goalIdSchema.safeParse(goalId).success) return;

  const supabase = await createClient();
  const { error } = await demoteCurrentMain(supabase, membership.organizationId, athleteId);
  if (!error) {
    await supabase
      .from("athlete_goals")
      .update({ priority: "main" })
      .eq("id", goalId)
      .eq("athlete_id", athleteId)
      .eq("organization_id", membership.organizationId)
      .eq("status", "active");
  }

  revalidatePath(`/coach/o/${membership.organizationId}/sportifs/${athleteId}`);
}

// Suppression d'un objectif saisi par erreur (pour corriger : supprimer puis recréer).
export async function deleteGoal(organizationId: string, athleteId: string, goalId: string) {
  const { membership } = await requireOrgAccess(organizationId);
  if (!goalIdSchema.safeParse(goalId).success) return;

  const supabase = await createClient();
  await supabase
    .from("athlete_goals")
    .delete()
    .eq("id", goalId)
    .eq("athlete_id", athleteId)
    .eq("organization_id", membership.organizationId);

  revalidatePath(`/coach/o/${membership.organizationId}/sportifs/${athleteId}`);
}
