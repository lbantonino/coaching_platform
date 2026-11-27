import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

import { removeStored } from "./attachments-store";

// Fichiers joints à l'Assistant IA (D-213) : effacés 24 h après leur dépôt, même si le coach ne revient
// pas (page Confidentialité). Lancé par le passage planifié de chaque minute (route /api/alertes,
// D-205), avec la clé de service. Aussi les fichiers du stockage sans ligne (dépôt interrompu, retrait
// pendant l'envoi), listés par la base après 24 h. Borné : 200 lignes et 500 orphelins par passage.
export async function purgeAssistantFiles(now: Date): Promise<number> {
  const admin = createAdminClient();
  const cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1_000).toISOString();
  const { data } = await admin
    .from("assistant_files")
    .select("id, storage_path, anthropic_file_id, prepared_at")
    .lt("created_at", cutoff)
    .limit(200);
  const rows = data ?? [];
  if (rows.length > 0) await removeStored(rows);
  const { data: orphans } = await admin.rpc("assistant_files_orphans");
  if (orphans && orphans.length > 0) await admin.storage.from("assistant-files").remove(orphans);
  return rows.length + (orphans?.length ?? 0);
}
