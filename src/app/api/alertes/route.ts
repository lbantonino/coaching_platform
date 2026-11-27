import { createHash, timingSafeEqual } from "node:crypto";

import { sendDueAlerts } from "@/features/alerts/send-due";
import { purgeAssistantFiles } from "@/features/assistant/attachments-purge";
import { createAdminClient } from "@/lib/supabase/admin";

// Route appelée chaque minute par la tâche planifiée de Supabase (pg_cron + pg_net, D-205) : envoie les
// alertes des séances dues. Protégée par un secret partagé : la tâche envoie « Bearer <alertes_secret>
// du Vault ». Il est accepté s'il correspond à ALERTES_SECRET (variable du serveur, facultative) ou, à
// défaut, au secret du Vault lui-même (fonction alertes_secret_ok, serveur seul) : une seule copie
// suffit, sans décalage possible entre deux valeurs collées à la main. Sinon : 401, rien n'est lu.
const digest = (text: string) => createHash("sha256").update(text).digest();

async function authorized(request: Request): Promise<boolean> {
  const given = request.headers.get("authorization") ?? "";
  if (!given.startsWith("Bearer ") || given.length > 300) return false;
  const secret = process.env.ALERTES_SECRET?.trim();
  if (secret && secret.length >= 16 && timingSafeEqual(digest(given), digest(`Bearer ${secret}`))) {
    return true;
  }
  const { data } = await createAdminClient().rpc("alertes_secret_ok", { p_given: given });
  return data === true;
}

export async function POST(request: Request) {
  if (!(await authorized(request))) {
    return Response.json({ error: "Non autorisé." }, { status: 401 });
  }
  const now = new Date();
  const report = await sendDueAlerts(now);
  // Le même passage efface les fichiers joints à l'Assistant IA de plus de 24 h (D-213).
  const fichiers = await purgeAssistantFiles(now).catch(() => 0);
  return Response.json({ ...report, fichiers });
}
