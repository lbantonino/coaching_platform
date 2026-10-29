import "server-only";

import type { InvoiceLike } from "@/domain/billing/invoices";
import { createClient } from "@/lib/supabase/server";

export type AthleteInvoice = InvoiceLike & {
  id: string;
  label: string;
  athleteId: string;
  athleteName: string;
  // Factures émises (D-65) : brouillon ou émise ; numéro attribué à l'émission (null pour un
  // brouillon et pour les factures de simple suivi d'avant D-65).
  status: "draft" | "issued";
  number: string | null;
};

type Row = {
  id: string;
  label: string;
  amount_cents: number;
  issued_on: string;
  due_on: string;
  paid_on: string | null;
  status: string;
  number: string | null;
  athlete: { id: string; first_name: string; display_name: string | null } | null;
};

const SELECT =
  "id, label, amount_cents, issued_on, due_on, paid_on, status, number, athlete:athlete_profiles ( id, first_name, display_name )";

const toInvoice = (row: Row): AthleteInvoice => ({
  id: row.id,
  label: row.label,
  amountCents: row.amount_cents,
  issuedOn: row.issued_on,
  dueOn: row.due_on,
  paidOn: row.paid_on,
  status: row.status === "draft" ? "draft" : "issued",
  number: row.number,
  // La clé étrangère garantit le sportif ; le repli ne sert qu'au typage.
  athleteId: row.athlete?.id ?? "",
  athleteName: row.athlete ? (row.athlete.display_name ?? row.athlete.first_name) : "Sportif",
});

// Factures utiles à l'activité du mois, pour une organisation DÉJÀ vérifiée (requireOrgAccess) :
// envoyées ou payées depuis le 1er du mois, et toutes celles pas encore payées. Un brouillon n'est
// pas envoyé : il ne compte pas.
export async function listMonthInvoices(
  organizationId: string,
  today: string,
): Promise<AthleteInvoice[]> {
  const monthStart = `${today.slice(0, 7)}-01`;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("athlete_invoices")
    .select(SELECT)
    .eq("organization_id", organizationId)
    .eq("status", "issued")
    .or(`paid_on.is.null,issued_on.gte.${monthStart},paid_on.gte.${monthStart}`);
  if (error) throw new Error("Lecture des factures impossible.");
  return ((data ?? []) as unknown as Row[]).map(toInvoice);
}

// Page Facturation : les factures de l'organisation (brouillons compris), les plus récentes d'abord.
export async function listInvoices(organizationId: string): Promise<AthleteInvoice[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("athlete_invoices")
    .select(SELECT)
    .eq("organization_id", organizationId)
    .order("issued_on", { ascending: false })
    .limit(200);
  if (error) throw new Error("Lecture des factures impossible.");
  return ((data ?? []) as unknown as Row[]).map(toInvoice);
}
