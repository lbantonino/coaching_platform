import "server-only";

import { todayIsoInBrussels } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

import { getAssistantModel } from "./model";
import { ASSISTANT_MONTHLY_LIMIT, brusselsMonthStart, type AssistantAccess } from "./rules";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

// Demandes encore possibles ce mois-ci pour le coach connecté (la RLS ne montre que les siennes).
export async function remainingThisMonth(client?: SupabaseServerClient): Promise<number> {
  const supabase = client ?? (await createClient());
  const { count } = await supabase
    .from("assistant_usage")
    .select("id", { count: "exact", head: true })
    .gte("created_at", brusselsMonthStart(todayIsoInBrussels()));
  return Math.max(0, ASSISTANT_MONTHLY_LIMIT - (count ?? 0));
}

// Ce que l'interface de l'assistant affiche (D-168, D-171) : verrouillé sans abonnement Coory ni
// adresse autorisée, « pas branché » sans modèle sur le serveur, prêt sinon. La base revérifie tout à
// chaque demande.
export async function getAssistantAccess(organizationId: string): Promise<AssistantAccess> {
  const supabase = await createClient();
  // Organisation abonnée, ou adresse du coach autorisée par l'administrateur (D-171).
  const { data: allowed } = await supabase.rpc("assistant_access_allowed", {
    p_organization_id: organizationId,
  });
  if (allowed !== true) return { status: "locked" };
  // Pas de modèle (ni clé Anthropic, ni modèle simulé des tests) : « pas branché ».
  if (!getAssistantModel()) return { status: "unconfigured" };
  return { status: "ready", remaining: await remainingThisMonth(supabase) };
}
