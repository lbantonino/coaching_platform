import "server-only";

import type { LegalForm, VatStatus } from "@/domain/billing/legal";
import { createClient } from "@/lib/supabase/server";

export type LegalEntity = {
  id: string;
  name: string;
  legalForm: LegalForm;
  enterpriseNumber: string | null;
  vatStatus: VatStatus;
  vatNumber: string | null;
  addressLine: string | null;
  postalCode: string | null;
  city: string | null;
  country: string;
  iban: string | null;
  bic: string | null;
  billingEmail: string | null;
  invoicePrefix: string;
  legalMentions: string | null;
  isDefault: boolean;
};

// Structures légales d'une organisation DÉJÀ vérifiée (requireOrgAccess) : la par défaut d'abord.
export async function listLegalEntities(organizationId: string): Promise<LegalEntity[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("organization_legal_entities")
    .select("*")
    .eq("organization_id", organizationId)
    .order("is_default", { ascending: false })
    .order("created_at");
  if (error) throw new Error("Lecture des structures impossible.");
  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    // Les contraintes CHECK en base garantissent ces listes fermées.
    legalForm: row.legal_form as LegalForm,
    enterpriseNumber: row.enterprise_number,
    vatStatus: row.vat_status as VatStatus,
    vatNumber: row.vat_number,
    addressLine: row.address_line,
    postalCode: row.postal_code,
    city: row.city,
    country: row.country,
    iban: row.iban,
    bic: row.bic,
    billingEmail: row.billing_email,
    invoicePrefix: row.invoice_prefix,
    legalMentions: row.legal_mentions,
    isDefault: row.is_default,
  }));
}
