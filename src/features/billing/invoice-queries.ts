import "server-only";

import type { VatStatus } from "@/domain/billing/legal";
import { listLegalEntities, type LegalEntity } from "@/features/coach/legal-queries";
import { createClient } from "@/lib/supabase/server";

// Factures émises (D-65) : une facture complète (brouillon ou émise) et les paiements sur le compte
// encore sans facture. Organisation DÉJÀ vérifiée par l'appelant (requireCoach / requireOrgAccess) ;
// la RLS limite de toute façon la lecture à SON organisation.

// Ce qui s'imprime pour la structure qui facture : la copie figée d'une facture émise, ou la
// structure telle qu'elle est aujourd'hui pour un brouillon.
export type InvoiceSeller = {
  name: string;
  enterpriseNumber: string | null;
  vatStatus: VatStatus;
  vatNumber: string | null;
  addressLine: string | null;
  postalCode: string | null;
  city: string | null;
  country: string | null;
  iban: string | null;
  bic: string | null;
  email: string | null;
  legalMentions: string | null;
};

export type InvoiceDetail = {
  id: string;
  status: "draft" | "issued";
  number: string | null;
  label: string;
  amountCents: number;
  vatRate: number;
  issuedOn: string;
  dueOn: string;
  paidOn: string | null;
  serviceOn: string | null;
  athleteId: string;
  paymentId: string | null;
  legalEntityId: string | null;
  client: {
    name: string;
    addressLine: string | null;
    postalCode: string | null;
    city: string | null;
    country: string | null;
  };
  seller: InvoiceSeller | null;
};

const sellerFromEntity = (entity: LegalEntity): InvoiceSeller => ({
  name: entity.name,
  enterpriseNumber: entity.enterpriseNumber,
  vatStatus: entity.vatStatus,
  vatNumber: entity.vatNumber,
  addressLine: entity.addressLine,
  postalCode: entity.postalCode,
  city: entity.city,
  country: entity.country,
  iban: entity.iban,
  bic: entity.bic,
  email: entity.billingEmail,
  legalMentions: entity.legalMentions,
});

export async function getInvoice(
  organizationId: string,
  invoiceId: string,
): Promise<InvoiceDetail | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("athlete_invoices")
    .select(
      "id, status, number, label, amount_cents, vat_rate, issued_on, due_on, paid_on, service_on, athlete_id, payment_id, legal_entity_id, client_name, client_address_line, client_postal_code, client_city, client_country, seller",
    )
    .eq("organization_id", organizationId)
    .eq("id", invoiceId)
    .maybeSingle();
  if (error) throw new Error("Lecture de la facture impossible.");
  if (!data) return null;
  const status = data.status === "draft" ? "draft" : "issued";
  let seller: InvoiceSeller | null = null;
  if (status === "issued" && data.seller) {
    // Copie écrite par issue_athlete_invoice, avec ces clés.
    seller = data.seller as unknown as InvoiceSeller;
  } else if (data.legal_entity_id) {
    const entity = (await listLegalEntities(organizationId)).find(
      (item) => item.id === data.legal_entity_id,
    );
    seller = entity ? sellerFromEntity(entity) : null;
  }
  return {
    id: data.id,
    status,
    number: data.number,
    label: data.label,
    amountCents: data.amount_cents,
    vatRate: data.vat_rate ?? 21,
    issuedOn: data.issued_on,
    dueOn: data.due_on,
    paidOn: data.paid_on,
    serviceOn: data.service_on,
    athleteId: data.athlete_id,
    paymentId: data.payment_id,
    legalEntityId: data.legal_entity_id,
    client: {
      name: data.client_name ?? "",
      addressLine: data.client_address_line,
      postalCode: data.client_postal_code,
      city: data.client_city,
      country: data.client_country,
    },
    seller,
  };
}

export type InvoiceablePayment = {
  id: string;
  receivedOn: string;
  amountCents: number;
  label: string | null;
  method: "transfer" | "bancontact";
  athleteName: string;
};

type PaymentRow = {
  id: string;
  received_on: string;
  amount_cents: number;
  label: string | null;
  method: string;
  athlete: { first_name: string; last_name: string | null; display_name: string | null } | null;
  invoices: { id: string }[];
};

// « À facturer » : les paiements reçus SUR LE COMPTE (virement, Bancontact) des 12 derniers mois,
// d'un sportif connu, sans facture (brouillon compris). Les espèces n'y sont pas (règle de Gianluca,
// qui ne les facture pas) ; un autre coach les facture avec « Créer une facture ».
export async function listInvoiceablePayments(
  organizationId: string,
  since: string,
): Promise<InvoiceablePayment[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("athlete_payments")
    .select(
      "id, received_on, amount_cents, label, method, athlete:athlete_profiles ( first_name, last_name, display_name ), invoices:athlete_invoices ( id )",
    )
    .eq("organization_id", organizationId)
    .in("method", ["transfer", "bancontact"])
    .not("athlete_id", "is", null)
    .gte("received_on", since)
    .order("received_on", { ascending: false })
    .limit(200);
  if (error) throw new Error("Lecture des paiements impossible.");
  return ((data ?? []) as unknown as PaymentRow[])
    .filter((row) => row.invoices.length === 0)
    .map((row) => ({
      id: row.id,
      receivedOn: row.received_on,
      amountCents: row.amount_cents,
      label: row.label,
      method: row.method === "bancontact" ? "bancontact" : "transfer",
      athleteName: row.athlete
        ? (row.athlete.display_name ??
          [row.athlete.first_name, row.athlete.last_name].filter(Boolean).join(" "))
        : "Sportif",
    }));
}
