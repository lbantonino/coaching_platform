import { createHash, timingSafeEqual } from "node:crypto";

import { sendDueAlerts } from "@/features/alerts/send-due";

// Route appelée chaque minute par la tâche planifiée de Supabase (pg_cron + pg_net, D-205) : envoie les
// alertes des séances dues. Protégée par un secret partagé (ALERTES_SECRET, le même dans le Vault de
// Supabase sous le nom alertes_secret), comparé en temps constant. Sans secret configuré : fermée.
const digest = (text: string) => createHash("sha256").update(text).digest();

function authorized(request: Request): boolean {
  const secret = process.env.ALERTES_SECRET;
  if (!secret || secret.length < 16) return false;
  const given = request.headers.get("authorization") ?? "";
  return timingSafeEqual(digest(given), digest(`Bearer ${secret}`));
}

export async function POST(request: Request) {
  if (!authorized(request)) {
    return Response.json({ error: "Non autorisé." }, { status: 401 });
  }
  const report = await sendDueAlerts(new Date());
  return Response.json(report);
}
