import "server-only";

import type { PaymentLike, PaymentMethod } from "@/domain/billing/payments";
import { createClient } from "@/lib/supabase/server";

export type AthletePayment = PaymentLike & {
  id: string;
  athleteId: string;
  athleteName: string;
  method: PaymentMethod;
  label: string | null;
};

type Row = {
  id: string;
  received_on: string;
  amount_cents: number;
  vat_rate: number;
  method: string;
  label: string | null;
  athlete: { id: string; first_name: string; display_name: string | null } | null;
};

// Paiements reçus d'une organisation DÉJÀ vérifiée (requireOrgAccess), du plus récent au plus ancien,
// depuis `from` (AAAA-MM-JJ) s'il est donné. Bornés : la page n'est pas un grand livre complet.
export async function listPayments(
  organizationId: string,
  from?: string,
): Promise<AthletePayment[]> {
  const supabase = await createClient();
  let query = supabase
    .from("athlete_payments")
    .select(
      "id, received_on, amount_cents, vat_rate, method, label, athlete:athlete_profiles ( id, first_name, display_name )",
    )
    .eq("organization_id", organizationId)
    .order("received_on", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(500);
  if (from) query = query.gte("received_on", from);
  const { data, error } = await query;
  if (error) throw new Error("Lecture des paiements impossible.");
  return ((data ?? []) as unknown as Row[]).map((row) => ({
    id: row.id,
    receivedOn: row.received_on,
    amountCents: row.amount_cents,
    vatRate: row.vat_rate,
    // La contrainte CHECK en base garantit cette liste fermée.
    method: row.method as PaymentMethod,
    label: row.label,
    // La clé étrangère garantit le sportif ; le repli ne sert qu'au typage.
    athleteId: row.athlete?.id ?? "",
    athleteName: row.athlete ? (row.athlete.display_name ?? row.athlete.first_name) : "Sportif",
  }));
}
