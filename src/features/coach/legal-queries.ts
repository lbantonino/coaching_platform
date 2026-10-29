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
  // Taux habituel (D-69), proposé sur chaque facture ; null si la structure n'est pas assujettie.
  defaultVatRate: number | null;
  addressLine: string | null;
  postalCode: string | null;
  city: string | null;
  country: string;
  iban: string | null;
  bic: string | null;
  // Coordonnées de paiement libres (pays sans IBAN).
  paymentDetails: string | null;
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
    defaultVatRate: row.default_vat_rate,
    addressLine: row.address_line,
    postalCode: row.postal_code,
    city: row.city,
    country: row.country,
    iban: row.iban,
    bic: row.bic,
    paymentDetails: row.payment_details,
    billingEmail: row.billing_email,
    invoicePrefix: row.invoice_prefix,
    legalMentions: row.legal_mentions,
    isDefault: row.is_default,
  }));
}

// Taux de TVA habituel de l'organisation (D-69) : celui de sa structure par défaut, 0 si elle n'en a
// pas ou n'est pas assujettie. Sert au prix des séances et au « Nouveau paiement ».
export async function getDefaultVatRate(organizationId: string): Promise<number> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("organization_legal_entities")
    .select("default_vat_rate")
    .eq("organization_id", organizationId)
    .order("is_default", { ascending: false })
    .order("created_at")
    .limit(1)
    .maybeSingle();
  if (error) throw new Error("Lecture du taux de TVA impossible.");
  return data?.default_vat_rate ?? 0;
}
