import "server-only";

import { currencyOf, type Currency } from "@/domain/billing/money";
import type { PaymentLike, PaymentMethod } from "@/domain/billing/payments";
import { createClient } from "@/lib/supabase/server";

export type AthletePayment = PaymentLike & {
  id: string;
  athleteId: string;
  athleteName: string;
  method: PaymentMethod;
  // Devise du montant reçu (D-69).
  currency: Currency;
  label: string | null;
  // Forfait (D-52) : période couverte ; sinon null.
  coversFrom: string | null;
  coversTo: string | null;
};

type Row = {
  id: string;
  received_on: string;
  amount_cents: number;
  vat_rate: number;
  currency: string;
  method: string;
  label: string | null;
  covers_from: string | null;
  covers_to: string | null;
  athlete: { id: string; first_name: string; display_name: string | null } | null;
};

// Paiements reçus d'une organisation DÉJÀ vérifiée (requireOrgAccess), du plus récent au plus ancien,
// depuis `from` (AAAA-MM-JJ) s'il est donné. Bornés : la page n'est pas un grand livre complet.
export async function listPayments(
  organizationId: string,
  from?: string,
  // Filtres appliqués par la base AVANT la limite de 500 (lecture de l'assistant, mineur n°7 du lot 4).
  filters: { to?: string; athleteId?: string } = {},
): Promise<AthletePayment[]> {
  return (await readPayments(organizationId, from, filters, false)).payments;
}

// Lecture de l'assistant : avec le nombre total de paiements de la période (revue du 20/11, n°8 : le
// total ne s'arrête pas aux 500 lignes lues).
export async function listPaymentsWithTotal(
  organizationId: string,
  from: string | undefined,
  filters: { to?: string; athleteId?: string },
): Promise<{ payments: AthletePayment[]; total: number }> {
  return readPayments(organizationId, from, filters, true);
}

async function readPayments(
  organizationId: string,
  from: string | undefined,
  filters: { to?: string; athleteId?: string },
  withCount: boolean,
): Promise<{ payments: AthletePayment[]; total: number }> {
  const supabase = await createClient();
  let query = supabase
    .from("athlete_payments")
    .select(
      "id, received_on, amount_cents, vat_rate, currency, method, label, covers_from, covers_to, athlete:athlete_profiles ( id, first_name, display_name )",
      withCount ? { count: "exact" } : undefined,
    )
    .eq("organization_id", organizationId)
    .order("received_on", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(500);
  if (from) query = query.gte("received_on", from);
  if (filters.to) query = query.lte("received_on", filters.to);
  if (filters.athleteId) query = query.eq("athlete_id", filters.athleteId);
  const { data, error, count } = await query;
  if (error) throw new Error("Lecture des paiements impossible.");
  const payments = ((data ?? []) as unknown as Row[]).map((row) => ({
    id: row.id,
    receivedOn: row.received_on,
    amountCents: row.amount_cents,
    vatRate: row.vat_rate,
    currency: currencyOf(row.currency),
    // La contrainte CHECK en base garantit cette liste fermée.
    method: row.method as PaymentMethod,
    label: row.label,
    coversFrom: row.covers_from,
    coversTo: row.covers_to,
    // Séance collective payée en une fois (D-52) : pas de sportif, son libellé (titre et date) la nomme.
    athleteId: row.athlete?.id ?? "",
    athleteName: row.athlete
      ? (row.athlete.display_name ?? row.athlete.first_name)
      : (row.label ?? "Séance collective"),
  }));
  return { payments, total: count ?? payments.length };
}

// Forfaits en cours (D-52) : par sportif, les périodes couvertes par un forfait, pour marquer ses
// dates de séance « comprises dans le forfait ».
export type PackageCover = { athleteId: string; coversFrom: string; coversTo: string };

export async function listPackageCovers(organizationId: string): Promise<PackageCover[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("athlete_payments")
    .select("athlete_id, covers_from, covers_to")
    .eq("organization_id", organizationId)
    .not("covers_from", "is", null);
  if (error) throw new Error("Lecture des forfaits impossible.");
  return (data ?? []).flatMap((row) =>
    row.athlete_id && row.covers_from && row.covers_to
      ? [{ athleteId: row.athlete_id, coversFrom: row.covers_from, coversTo: row.covers_to }]
      : [],
  );
}
