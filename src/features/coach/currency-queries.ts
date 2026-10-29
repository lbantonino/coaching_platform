import "server-only";

import { currencyOf, makeConverter, type CurrencyChange } from "@/domain/billing/money";
import type { CoachMembership } from "@/features/auth/session";
import { createClient } from "@/lib/supabase/server";

// Changements de devise d'une organisation DÉJÀ vérifiée (D-70), du plus ancien au plus récent.
export async function listCurrencyChanges(
  organizationId: string,
): Promise<(CurrencyChange & { changedOn: string })[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("organization_currency_changes")
    .select("from_currency, to_currency, rate, changed_on")
    .eq("organization_id", organizationId)
    .order("created_at");
  if (error) throw new Error("Lecture des changements de devise impossible.");
  return (data ?? []).map((row) => ({
    from: currencyOf(row.from_currency),
    to: currencyOf(row.to_currency),
    rate: row.rate,
    changedOn: row.changed_on,
  }));
}

// Convertisseur vers la devise de l'organisation, pour les totaux qui mélangent deux devises.
export async function getConverter(membership: CoachMembership) {
  return makeConverter(membership.currency, await listCurrencyChanges(membership.organizationId));
}
