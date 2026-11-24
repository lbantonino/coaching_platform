"use server";

import { headers } from "next/headers";
import { z } from "zod";

import { requireCoach } from "@/features/auth/guards";
import { createClient } from "@/lib/supabase/server";

import { pushConfigured, sendPush } from "./push";

// Abonnement d'un appareil aux alertes des séances (D-205). Chaque coach gère SES appareils (RLS :
// push_subscriptions, chacun les siens). L'adresse donnée par le navigateur doit être celle d'un
// service push connu (Chrome, Firefox, Safari / Apple, Edge) : Coory n'envoie rien ailleurs.
const PUSH_HOSTS = [
  /^fcm\.googleapis\.com$/,
  /^android\.googleapis\.com$/,
  /^updates\.push\.services\.mozilla\.com$/,
  /(^|\.)push\.apple\.com$/,
  /(^|\.)notify\.windows\.com$/,
];

function knownPushService(endpoint: string): boolean {
  try {
    const url = new URL(endpoint);
    return url.protocol === "https:" && PUSH_HOSTS.some((host) => host.test(url.hostname));
  } catch {
    return false;
  }
}

const subscriptionSchema = z.object({
  endpoint: z.string().max(2048).refine(knownPushService),
  keys: z.object({
    p256dh: z.string().min(20).max(200),
    auth: z.string().min(8).max(100),
  }),
});

export type PushActionResult = { ok: boolean; error?: string };

export async function savePushSubscription(input: unknown): Promise<PushActionResult> {
  const { user } = await requireCoach();
  if (!pushConfigured()) return { ok: false, error: "Les alertes ne sont pas encore configurées." };
  const parsed = subscriptionSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: "Cet appareil ne peut pas recevoir les alertes." };
  const { endpoint, keys } = parsed.data;
  const userAgent = (await headers()).get("user-agent")?.slice(0, 300) ?? null;
  const supabase = await createClient();
  // Même appareil réabonné : l'ancienne ligne part, la nouvelle (clés à jour) la remplace.
  await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint);
  const { error } = await supabase.from("push_subscriptions").insert({
    user_id: user.id,
    endpoint,
    p256dh: keys.p256dh,
    auth: keys.auth,
    user_agent: userAgent,
  });
  return error
    ? { ok: false, error: "L'appareil n'a pas pu être enregistré. Réessaie." }
    : { ok: true };
}

export async function deletePushSubscription(endpoint: string): Promise<PushActionResult> {
  await requireCoach();
  if (typeof endpoint !== "string" || endpoint.length > 2048) return { ok: false };
  const supabase = await createClient();
  const { error } = await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint);
  return { ok: !error };
}

// « Envoyer une alerte d'essai » : seulement vers un appareil du coach connecté.
export async function sendTestAlert(endpoint: string): Promise<PushActionResult> {
  await requireCoach();
  if (typeof endpoint !== "string" || endpoint.length > 2048) return { ok: false };
  const supabase = await createClient();
  const { data } = await supabase
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("endpoint", endpoint)
    .maybeSingle();
  if (!data) return { ok: false, error: "Cet appareil n'est plus abonné. Réactive les alertes." };
  const result = await sendPush(data, {
    title: "Coory",
    body: "Les alertes des séances arrivent bien sur cet appareil.",
    url: "/coach",
    tag: "essai",
  });
  if (result === "gone") {
    await supabase.from("push_subscriptions").delete().eq("id", data.id);
    return { ok: false, error: "Cet appareil n'est plus abonné. Réactive les alertes." };
  }
  return result === "sent"
    ? { ok: true }
    : { ok: false, error: "L'alerte d'essai n'est pas partie. Réessaie dans un instant." };
}
