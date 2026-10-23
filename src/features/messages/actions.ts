"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getAthlete } from "@/features/athletes/queries";
import { requireOrgAccess } from "@/features/auth/guards";
import { createClient } from "@/lib/supabase/server";

import { messageBodySchema } from "./schemas";

// Ouverture d'un fil : ses messages REÇUS passent en lu (la RLS refuse aussi les messages du coach).
export async function markThreadRead(organizationId: string, athleteId: string): Promise<void> {
  const { membership } = await requireOrgAccess(organizationId);
  if (!z.uuid().safeParse(athleteId).success) return;

  const supabase = await createClient();
  const { data } = await supabase
    .from("athlete_messages")
    .update({ read_at: new Date().toISOString() })
    .eq("organization_id", membership.organizationId)
    .eq("athlete_id", athleteId)
    .eq("sender", "athlete")
    .is("read_at", null)
    .select("id");
  if (data?.length) {
    revalidatePath("/coach");
    revalidatePath("/coach/messages");
  }
}

// `attempt` change à CHAQUE réponse : le champ est vidé après un envoi réussi, gardé après une erreur.
export type SendMessageState = { error: string | null; attempt: number; body: string };

// Réponse du coach dans le fil d'un sportif de SON organisation. Le message est seulement enregistré :
// aucun e-mail ni WhatsApp n'est envoyé (intégrations ultérieures).
export async function sendMessage(
  organizationId: string,
  athleteId: string,
  previous: SendMessageState,
  formData: FormData,
): Promise<SendMessageState> {
  const { user, membership } = await requireOrgAccess(organizationId);
  const attempt = previous.attempt + 1;
  const rawBody = String(formData.get("body") ?? "");
  const fail = (error: string): SendMessageState => ({ error, attempt, body: rawBody });

  const athlete = await getAthlete(membership.organizationId, athleteId);
  if (!athlete) return fail("Sportif introuvable.");
  if (athlete.status === "archived")
    return fail("Ce sportif est archivé : restaure sa fiche pour lui écrire.");

  const parsed = messageBodySchema.safeParse(rawBody);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Message invalide.");

  const supabase = await createClient();
  const { error } = await supabase.from("athlete_messages").insert({
    organization_id: membership.organizationId,
    athlete_id: athlete.id,
    sender: "coach",
    body: parsed.data,
    created_by: user.id,
  });
  if (error) return fail("Le message n'a pas pu être enregistré. Réessaie.");

  revalidatePath("/coach/messages");
  return { error: null, attempt, body: "" };
}
