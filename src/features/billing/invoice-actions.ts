"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import {
  defaultInvoiceLabel,
  totalsFromEntry,
  vatRateFor,
  type AmountMode,
} from "@/domain/billing/invoice-document";
import { vatRateField } from "@/domain/billing/money";
import { PAYMENT_METHODS, parseAmount } from "@/domain/billing/payments";
import { addressSchema, newAthleteSchema } from "@/features/athletes/schemas";
import { requireOrgAccess } from "@/features/auth/guards";
import { listLegalEntities } from "@/features/coach/legal-queries";
import { createClient } from "@/lib/supabase/server";
import { todayIsoInBrussels } from "@/lib/format";

// Factures émises (D-65) : un brouillon naît d'un paiement reçu (ou du bouton « Créer une facture »),
// se modifie, puis s'émet
// (numéro attribué par la base, facture figée) ; un brouillon se supprime, une facture émise jamais.
// Chaque action revérifie l'organisation ; la RLS n'autorise l'écriture que sur les brouillons.

export type InvoiceActionState = { error: string | null; saved: boolean; attempt: number };

const billingPath = "/coach/facturation";
const invoicePath = (id: string) => `${billingPath}/${id}`;
const idSchema = z.uuid();
const amountModeOf = (formData: FormData): AmountMode =>
  formData.get("amountMode") === "incl" ? "incl" : "excl";

// Créer le brouillon d'un paiement de SON organisation : structure par défaut, client et adresse
// repris de la fiche du sportif. Un paiement a déjà sa facture : on l'ouvre. Tous les modes se
// facturent (29/10/2026 : l'app sert à tous les coachs, pas seulement à Gianluca).
export async function createInvoiceFromPayment(
  organizationId: string,
  paymentId: string,
  previous: InvoiceActionState,
): Promise<InvoiceActionState> {
  const { user, membership } = await requireOrgAccess(organizationId);
  const fail = (error: string) => ({ error, saved: false, attempt: previous.attempt + 1 });
  if (!idSchema.safeParse(paymentId).success) return fail("Paiement introuvable.");

  const supabase = await createClient();
  const { data: payment } = await supabase
    .from("athlete_payments")
    .select(
      "id, received_on, amount_cents, vat_rate, method, label, session_date, athlete:athlete_profiles ( id, first_name, last_name, address_line, postal_code, city, country ), invoices:athlete_invoices ( id )",
    )
    .eq("organization_id", membership.organizationId)
    .eq("id", paymentId)
    .maybeSingle();
  if (!payment || !payment.athlete) return fail("Paiement introuvable.");
  const existing = (payment.invoices as { id: string }[])[0];
  if (existing) redirect(invoicePath(existing.id));

  const entity = (await listLegalEntities(membership.organizationId))[0];
  if (!entity) {
    return fail("Ajoute d'abord ta structure légale (Paramètres, Structures légales).");
  }
  const athlete = payment.athlete;
  const today = todayIsoInBrussels();
  const { data: invoice, error } = await supabase
    .from("athlete_invoices")
    .insert({
      organization_id: membership.organizationId,
      athlete_id: athlete.id,
      status: "draft",
      legal_entity_id: entity.id,
      payment_id: payment.id,
      label: defaultInvoiceLabel(payment.label),
      amount_cents: payment.amount_cents,
      vat_rate: vatRateFor(entity.vatStatus, payment.vat_rate),
      issued_on: today,
      due_on: today,
      paid_on: payment.received_on,
      service_on: payment.session_date,
      client_name: [athlete.first_name, athlete.last_name].filter(Boolean).join(" "),
      client_address_line: athlete.address_line,
      client_postal_code: athlete.postal_code,
      client_city: athlete.city,
      client_country: athlete.country,
      created_by: user.id,
    })
    .select("id")
    .single();
  if (error || !invoice) return fail("Le brouillon n'a pas pu être créé. Réessaie.");

  revalidatePath(billingPath, "layout");
  redirect(invoicePath(invoice.id));
}

const draftSchema = z
  .object({
    legalEntityId: z.uuid({ error: "Choisis la structure qui facture." }),
    label: z
      .string()
      .trim()
      .min(1, { error: "Décris la prestation." })
      .max(120, { error: "Description trop longue (120 caractères maximum)." }),
    serviceOn: z.preprocess(
      (value) => (value === "" ? null : value),
      z.iso.date({ error: "Date de la prestation invalide." }).nullable(),
    ),
    vatRate: vatRateField,
    clientName: z
      .string()
      .trim()
      .min(1, { error: "Le nom du client est obligatoire." })
      .max(160, { error: "Nom du client trop long (160 caractères maximum)." }),
  })
  .extend(addressSchema.shape);

// Modifier un brouillon : structure, description, montant, date de la prestation, TVA, client et
// adresse. Un brouillon relié à un paiement reçu le garde d'accord : montant et TVA du paiement sont
// corrigés en même temps (demande d'Antonino du 29/10 : le montant d'un brouillon se modifie).
export async function updateInvoiceDraft(
  organizationId: string,
  invoiceId: string,
  previous: InvoiceActionState,
  formData: FormData,
): Promise<InvoiceActionState> {
  const { membership } = await requireOrgAccess(organizationId);
  const fail = (error: string) => ({ error, saved: false, attempt: previous.attempt + 1 });
  if (!idSchema.safeParse(invoiceId).success) return fail("Facture introuvable.");
  const parsed = draftSchema.safeParse({
    legalEntityId: formData.get("legalEntityId"),
    label: formData.get("label") ?? "",
    serviceOn: formData.get("serviceOn") ?? "",
    vatRate: formData.get("vatRate") ?? "0",
    clientName: formData.get("clientName") ?? "",
    addressLine: formData.get("addressLine") ?? "",
    postalCode: formData.get("postalCode") ?? "",
    city: formData.get("city") ?? "",
    country: formData.get("country") ?? "BE",
  });
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Formulaire invalide.");
  const entered = parseAmount(String(formData.get("amount") ?? ""));
  if (entered === null) return fail("Indique le montant (ex. : 65).");

  const entity = (await listLegalEntities(membership.organizationId)).find(
    (item) => item.id === parsed.data.legalEntityId,
  );
  if (!entity) return fail("Choisis la structure qui facture.");
  const vatRate = vatRateFor(entity.vatStatus, parsed.data.vatRate);
  // Montant saisi hors TVA (la TVA s'ajoute) ou TVA comprise ; la facture garde le total TVAC.
  const amountCents = totalsFromEntry(entered, amountModeOf(formData), vatRate).inclCents;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("athlete_invoices")
    .update({
      legal_entity_id: entity.id,
      label: parsed.data.label,
      amount_cents: amountCents,
      service_on: parsed.data.serviceOn,
      vat_rate: vatRate,
      client_name: parsed.data.clientName,
      client_address_line: parsed.data.addressLine,
      client_postal_code: parsed.data.postalCode,
      client_city: parsed.data.city,
      client_country: parsed.data.country,
    })
    .eq("organization_id", membership.organizationId)
    .eq("id", invoiceId)
    .eq("status", "draft")
    .select("id, payment_id");
  if (error || !data?.length) {
    return fail("Le brouillon n'a pas pu être enregistré (une facture émise ne se modifie plus).");
  }
  const paymentId = data[0].payment_id;
  if (paymentId) {
    const { error: paymentError } = await supabase
      .from("athlete_payments")
      .update({ amount_cents: amountCents, vat_rate: vatRate })
      .eq("organization_id", membership.organizationId)
      .eq("id", paymentId);
    if (paymentError) {
      return fail("Brouillon enregistré, mais le paiement relié n'a pas pu être corrigé.");
    }
    revalidatePath("/coach/comptabilite");
  }
  revalidatePath(billingPath, "layout");
  return { error: null, saved: true, attempt: previous.attempt + 1 };
}

// Émettre : la base attribue le numéro suivant de la structure, fixe la date du jour et fige tout.
export async function issueInvoice(
  organizationId: string,
  invoiceId: string,
  previous: InvoiceActionState,
): Promise<InvoiceActionState> {
  await requireOrgAccess(organizationId);
  const fail = (error: string) => ({ error, saved: false, attempt: previous.attempt + 1 });
  if (!idSchema.safeParse(invoiceId).success) return fail("Facture introuvable.");
  const supabase = await createClient();
  const { error } = await supabase.rpc("issue_athlete_invoice", { p_invoice_id: invoiceId });
  if (error) {
    // Messages écrits pour le coach dans issue_athlete_invoice (P0001) ; le reste reste générique.
    return fail(error.code === "P0001" ? error.message : "La facture n'a pas pu être émise.");
  }
  revalidatePath(billingPath, "layout");
  return { error: null, saved: true, attempt: previous.attempt + 1 };
}

// Supprimer un brouillon (jamais une facture émise : la RLS et la base le refusent).
export async function deleteInvoiceDraft(
  organizationId: string,
  invoiceId: string,
  previous: InvoiceActionState,
): Promise<InvoiceActionState> {
  const { membership } = await requireOrgAccess(organizationId);
  const fail = (error: string) => ({ error, saved: false, attempt: previous.attempt + 1 });
  if (!idSchema.safeParse(invoiceId).success) return fail("Facture introuvable.");
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("athlete_invoices")
    .delete()
    .eq("organization_id", membership.organizationId)
    .eq("id", invoiceId)
    .eq("status", "draft")
    .select("id");
  if (error || !data?.length) return fail("Seul un brouillon se supprime.");
  revalidatePath(billingPath, "layout");
  redirect(billingPath);
}

// ---------------------------------------------------------------------------
// Créer une facture directement (bouton « Créer une facture », demande d'Antonino du 29/10/2026) :
// pour un sportif existant ou un NOUVEAU sportif (sa fiche est créée pour de vrai : nom, adresse,
// contact), avec montant, TVA, description et date ; « Déjà payée » note aussi le paiement reçu
// (Comptabilité), « À payer » met une échéance. Le résultat est un brouillon, à relire puis émettre.
// ---------------------------------------------------------------------------
export type NewInvoiceValues = {
  legalEntityId: string;
  athleteId: string;
  newAthlete: boolean;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  addressLine: string;
  postalCode: string;
  city: string;
  country: string;
  label: string;
  amount: string;
  // Montant saisi hors TVA (« excl », par défaut) ou TVA comprise (« incl »).
  amountMode: AmountMode;
  vatRate: string;
  serviceOn: string;
  paid: boolean;
  receivedOn: string;
  method: string;
  dueOn: string;
};
export type NewInvoiceState = {
  error: string | null;
  attempt: number;
  values: NewInvoiceValues | null;
};

const newInvoiceSchema = z.object({
  legalEntityId: z.uuid({ error: "Choisis la structure qui facture." }),
  label: z
    .string()
    .trim()
    .min(1, { error: "Décris la prestation." })
    .max(120, { error: "Description trop longue (120 caractères maximum)." }),
  vatRate: vatRateField,
  serviceOn: z.preprocess(
    (value) => (value === "" ? null : value),
    z.iso.date({ error: "Date de la prestation invalide." }).nullable(),
  ),
});

export async function createInvoice(
  organizationId: string,
  previous: NewInvoiceState,
  formData: FormData,
): Promise<NewInvoiceState> {
  const { user, membership } = await requireOrgAccess(organizationId);
  const text = (name: string) => String(formData.get(name) ?? "");
  const values: NewInvoiceValues = {
    legalEntityId: text("legalEntityId"),
    athleteId: text("athleteId"),
    newAthlete: formData.get("newAthlete") === "on",
    firstName: text("firstName"),
    lastName: text("lastName"),
    email: text("email"),
    phone: text("phone"),
    addressLine: text("addressLine"),
    postalCode: text("postalCode"),
    city: text("city"),
    country: text("country") || "BE",
    label: text("label"),
    amount: text("amount"),
    amountMode: amountModeOf(formData),
    vatRate: text("vatRate") || "0",
    serviceOn: text("serviceOn"),
    paid: text("paid") !== "no",
    receivedOn: text("receivedOn"),
    method: text("method") || "transfer",
    dueOn: text("dueOn"),
  };
  const fail = (error: string): NewInvoiceState => ({
    error,
    attempt: previous.attempt + 1,
    values,
  });

  const parsed = newInvoiceSchema.safeParse(values);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Formulaire invalide.");
  const entered = parseAmount(values.amount);
  if (entered === null) return fail("Indique le montant (ex. : 65).");
  const today = todayIsoInBrussels();
  if (values.paid) {
    if (!z.iso.date().safeParse(values.receivedOn).success || values.receivedOn > today) {
      return fail("Indique la date du paiement (pas dans le futur).");
    }
    if (!(PAYMENT_METHODS as readonly string[]).includes(values.method)) {
      return fail("Choisis le mode de paiement.");
    }
  } else if (!z.iso.date().safeParse(values.dueOn).success || values.dueOn < today) {
    return fail("Indique l'échéance (aujourd'hui ou plus tard).");
  }

  const entity = (await listLegalEntities(membership.organizationId)).find(
    (item) => item.id === parsed.data.legalEntityId,
  );
  if (!entity) return fail("Choisis la structure qui facture.");
  const vatRate = vatRateFor(entity.vatStatus, parsed.data.vatRate);

  const supabase = await createClient();
  // Le client : un sportif de SON organisation, ou une nouvelle fiche.
  let athlete: {
    id: string;
    name: string;
    addressLine: string | null;
    postalCode: string | null;
    city: string | null;
    country: string;
  };
  if (values.newAthlete) {
    const identity = newAthleteSchema
      .pick({ firstName: true, lastName: true, email: true, phone: true })
      .safeParse(values);
    const address = addressSchema.safeParse(values);
    if (!identity.success) return fail(identity.error.issues[0]?.message ?? "Sportif invalide.");
    if (!address.success) return fail(address.error.issues[0]?.message ?? "Adresse invalide.");
    const { data, error } = await supabase
      .from("athlete_profiles")
      .insert({
        organization_id: membership.organizationId,
        first_name: identity.data.firstName,
        last_name: identity.data.lastName,
        email: identity.data.email,
        phone: identity.data.phone,
        address_line: address.data.addressLine,
        postal_code: address.data.postalCode,
        city: address.data.city,
        country: address.data.country,
        created_by: user.id,
      })
      .select("id, first_name, last_name, address_line, postal_code, city, country")
      .single();
    if (error || !data) {
      return fail(
        error?.code === "23505"
          ? "Un sportif de ton organisation utilise déjà cette adresse e-mail."
          : "Le nouveau sportif n'a pas pu être créé. Réessaie.",
      );
    }
    revalidatePath(`/coach/o/${membership.organizationId}/sportifs`, "layout");
    athlete = {
      id: data.id,
      name: [data.first_name, data.last_name].filter(Boolean).join(" "),
      addressLine: data.address_line,
      postalCode: data.postal_code,
      city: data.city,
      country: data.country,
    };
  } else {
    if (!idSchema.safeParse(values.athleteId).success) return fail("Choisis le sportif.");
    const { data } = await supabase
      .from("athlete_profiles")
      .select("id, first_name, last_name, address_line, postal_code, city, country")
      .eq("organization_id", membership.organizationId)
      .eq("id", values.athleteId)
      .maybeSingle();
    if (!data) return fail("Sportif introuvable dans ton organisation.");
    athlete = {
      id: data.id,
      name: [data.first_name, data.last_name].filter(Boolean).join(" "),
      addressLine: data.address_line,
      postalCode: data.postal_code,
      city: data.city,
      country: data.country,
    };
  }

  const { data: invoice, error } = await supabase
    .from("athlete_invoices")
    .insert({
      organization_id: membership.organizationId,
      athlete_id: athlete.id,
      status: "draft",
      legal_entity_id: entity.id,
      label: parsed.data.label,
      amount_cents: totalsFromEntry(entered, values.amountMode, vatRate).inclCents,
      vat_rate: vatRate,
      issued_on: today,
      due_on: values.paid ? today : values.dueOn,
      service_on: parsed.data.serviceOn,
      client_name: athlete.name,
      client_address_line: athlete.addressLine,
      client_postal_code: athlete.postalCode,
      client_city: athlete.city,
      client_country: athlete.country,
      created_by: user.id,
    })
    .select("id")
    .single();
  if (error || !invoice) return fail("La facture n'a pas pu être créée. Réessaie.");

  // Déjà payée : le vrai paiement reçu est noté et relié (Comptabilité, « encaissé »).
  if (values.paid) {
    const { error: paidError } = await supabase.rpc("mark_athlete_invoice_paid", {
      p_invoice_id: invoice.id,
      p_received_on: values.receivedOn,
      p_method: values.method,
    });
    if (paidError) {
      revalidatePath(billingPath, "layout");
      redirect(`${invoicePath(invoice.id)}?paiement=echec`);
    }
  }
  revalidatePath(billingPath, "layout");
  revalidatePath("/coach/comptabilite");
  redirect(invoicePath(invoice.id));
}

// Marquer payée une facture « à payer » (brouillon ou émise) : crée le paiement reçu et le relie.
export async function markInvoicePaid(
  organizationId: string,
  invoiceId: string,
  previous: InvoiceActionState,
  formData: FormData,
): Promise<InvoiceActionState> {
  await requireOrgAccess(organizationId);
  const fail = (error: string) => ({ error, saved: false, attempt: previous.attempt + 1 });
  if (!idSchema.safeParse(invoiceId).success) return fail("Facture introuvable.");
  const receivedOn = String(formData.get("receivedOn") ?? "");
  const method = String(formData.get("method") ?? "");
  if (!z.iso.date().safeParse(receivedOn).success || receivedOn > todayIsoInBrussels()) {
    return fail("Indique la date du paiement (pas dans le futur).");
  }
  if (!(PAYMENT_METHODS as readonly string[]).includes(method)) {
    return fail("Choisis le mode de paiement.");
  }
  const supabase = await createClient();
  const { error } = await supabase.rpc("mark_athlete_invoice_paid", {
    p_invoice_id: invoiceId,
    p_received_on: receivedOn,
    p_method: method,
  });
  if (error) {
    return fail(error.code === "P0001" ? error.message : "Le paiement n'a pas pu être noté.");
  }
  revalidatePath(billingPath, "layout");
  revalidatePath("/coach/comptabilite");
  return { error: null, saved: true, attempt: previous.attempt + 1 };
}
