import "server-only";

import webpush from "web-push";

// Envoi d'une notification « push » du web (D-205) avec la bibliothèque web-push (standard Web Push,
// clés VAPID). Les clés viennent de l'environnement : NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY,
// VAPID_SUBJECT (adresse de contact : l'URL de Coory). Sans elles, rien n'est envoyé.
export type PushTarget = { endpoint: string; p256dh: string; auth: string };
export type PushPayload = { title: string; body: string; url: string; tag?: string };
// « gone » : l'appareil s'est désabonné (réponse 404 ou 410), son abonnement est à supprimer.
export type PushResult = "sent" | "gone" | "failed";

function vapid() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;
  return publicKey && privateKey && subject ? { publicKey, privateKey, subject } : null;
}

export const pushConfigured = () => vapid() !== null;

export async function sendPush(target: PushTarget, payload: PushPayload): Promise<PushResult> {
  const keys = vapid();
  if (!keys) return "failed";
  try {
    await webpush.sendNotification(
      { endpoint: target.endpoint, keys: { p256dh: target.p256dh, auth: target.auth } },
      JSON.stringify(payload),
      {
        vapidDetails: keys,
        // Une alerte périmée ne sert à rien : le service la garde une heure au plus.
        TTL: 3600,
        urgency: "high",
        timeout: 10_000,
      },
    );
    return "sent";
  } catch (error) {
    const status = (error as { statusCode?: number }).statusCode;
    return status === 404 || status === 410 ? "gone" : "failed";
  }
}
