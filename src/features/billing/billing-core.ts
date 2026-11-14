import "server-only";

import { revalidatePath } from "next/cache";

import { todayIsoInBrussels } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

// Cœurs des boutons « Supprimer » et « Arrêter » de la Comptabilité : les actions les appellent ;
// l'Assistant IA (lot 4, D-183) aussi, depuis executeAssistantAction, après requireOrgAccess. `ok` :
// une ligne de l'organisation a bien changé. Jamais dans un fichier « use server ».

const refresh = () => {
  revalidatePath("/coach");
  revalidatePath("/coach/comptabilite");
};

// Un paiement noté par erreur : il disparaît des chiffres (une date de séance payée redevient à
// encaisser).
export async function removePayment(orgId: string, paymentId: string): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("athlete_payments")
    .delete()
    .eq("id", paymentId)
    .eq("organization_id", orgId)
    .select("id");
  refresh();
  return { ok: !error && (data ?? []).length > 0 };
}

// Une dépense, mensuelle comprise : elle disparaît de TOUS les mois.
export async function removeExpense(orgId: string, expenseId: string): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("coach_expenses")
    .delete()
    .eq("id", expenseId)
    .eq("organization_id", orgId)
    .select("id");
  refresh();
  return { ok: !error && (data ?? []).length > 0 };
}

// Dépense mensuelle : « Arrêter » la fait finir aujourd'hui, le passé reste. « Aujourd'hui » est la
// date du serveur (Bruxelles), jamais une date envoyée par le navigateur.
export async function endExpense(orgId: string, expenseId: string): Promise<{ ok: boolean }> {
  const today = todayIsoInBrussels();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("coach_expenses")
    .update({ ends_on: today })
    .eq("id", expenseId)
    .eq("organization_id", orgId)
    .eq("repeats_monthly", true)
    .lte("spent_on", today)
    .select("id");
  refresh();
  return { ok: !error && (data ?? []).length > 0 };
}
