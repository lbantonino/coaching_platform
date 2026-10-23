"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { PAYMENT_METHODS, VAT_RATES, parseEuros } from "@/domain/billing/payments";
import { getAthlete } from "@/features/athletes/queries";
import { requireOrgAccess } from "@/features/auth/guards";
import { createClient } from "@/lib/supabase/server";

// Saisie telle que reçue (chaînes brutes), renvoyée en cas d'erreur ; `attempt` reconstruit le
// formulaire après chaque réponse (React remet sinon les menus à leur valeur de départ).
export type PaymentFormValues = {
  athleteId: string;
  receivedOn: string;
  amount: string;
  vatRate: string;
  method: string;
  label: string;
};
export type PaymentFormState = {
  error: string | null;
  attempt: number;
  values: PaymentFormValues | null;
  saved: boolean;
};

const schema = z.object({
  athleteId: z.uuid({ error: "Choisis le sportif qui a payé." }),
  receivedOn: z.iso
    .date({ error: "Indique la date du paiement." })
    .refine((d) => d >= "2000-01-01", {
      error: "Indique la date du paiement.",
    }),
  vatRate: z.coerce.number().refine((rate) => (VAT_RATES as readonly number[]).includes(rate), {
    error: "Taux de TVA invalide.",
  }),
  method: z.enum(PAYMENT_METHODS, { error: "Choisis le mode de paiement." }),
  label: z.string().trim().max(120, { error: "Libellé trop long (120 caractères maximum)." }),
});

// Paiement reçu d'un sportif de SON organisation (D-36). Aucun argent ne passe par Coory : le coach
// note ce qu'il a reçu, TVA comprise.
export async function createPayment(
  organizationId: string,
  previous: PaymentFormState,
  formData: FormData,
): Promise<PaymentFormState> {
  const { user, membership } = await requireOrgAccess(organizationId);
  const orgId = membership.organizationId;
  const field = (name: string) => String(formData.get(name) ?? "");
  const values: PaymentFormValues = {
    athleteId: field("athleteId"),
    receivedOn: field("receivedOn"),
    amount: field("amount"),
    vatRate: field("vatRate"),
    method: field("method"),
    label: field("label"),
  };
  const fail = (error: string): PaymentFormState => ({
    error,
    attempt: previous.attempt + 1,
    values,
    saved: false,
  });

  const amountCents = parseEuros(values.amount);
  if (amountCents === null) return fail("Indique le montant reçu, par exemple 3000 ou 85,50.");
  const parsed = schema.safeParse(values);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Saisie invalide.");
  const athlete = await getAthlete(orgId, parsed.data.athleteId);
  if (!athlete) return fail("Sportif introuvable dans ton organisation.");

  const supabase = await createClient();
  const { error } = await supabase.from("athlete_payments").insert({
    organization_id: orgId,
    athlete_id: athlete.id,
    received_on: parsed.data.receivedOn,
    amount_cents: amountCents,
    vat_rate: parsed.data.vatRate,
    method: parsed.data.method,
    label: parsed.data.label === "" ? null : parsed.data.label,
    created_by: user.id,
  });
  if (error) return fail("Le paiement n'a pas pu être enregistré. Réessaie.");

  revalidatePath("/coach");
  revalidatePath("/coach/comptabilite");
  return { error: null, attempt: previous.attempt + 1, values: null, saved: true };
}

// Paiement noté par erreur : il se supprime (ce n'est pas une facture légale).
export async function deletePayment(organizationId: string, paymentId: string): Promise<void> {
  const { membership } = await requireOrgAccess(organizationId);
  if (!z.uuid().safeParse(paymentId).success) return;
  const supabase = await createClient();
  await supabase
    .from("athlete_payments")
    .delete()
    .eq("id", paymentId)
    .eq("organization_id", membership.organizationId);
  revalidatePath("/coach");
  revalidatePath("/coach/comptabilite");
}
