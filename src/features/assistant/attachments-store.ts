import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

import { ANTHROPIC_FILE_SECONDS } from "./attachment-rules";
import { getAnthropicFiles } from "./model";

// Effacer des fichiers joints à l'Assistant IA (D-213), avec la clé de service : leur copie chez
// Anthropic (si elle n'a pas déjà expiré), le fichier du stockage, puis la ligne. La ligne n'est
// effacée QUE si le stockage a bien répondu (sinon le fichier resterait sans ligne, jamais purgé).
// Les lignes passées ici ont déjà été lues pour CE coach (ou par la purge du serveur).
export async function removeStored(
  rows: {
    id: string;
    storage_path: string;
    anthropic_file_id?: string | null;
    prepared_at?: string | null;
  }[],
): Promise<boolean> {
  if (rows.length === 0) return true;
  const admin = createAdminClient();
  const files = getAnthropicFiles();
  const expiredBefore = Date.now() - ANTHROPIC_FILE_SECONDS * 1_000;
  for (const row of rows) {
    const live = row.prepared_at ? Date.parse(row.prepared_at) > expiredBefore : true;
    if (row.anthropic_file_id && files && live) void files.remove(row.anthropic_file_id);
  }
  const { error } = await admin.storage
    .from("assistant-files")
    .remove(rows.map((row) => row.storage_path));
  if (error) return false;
  const { error: rowsError } = await admin
    .from("assistant_files")
    .delete()
    .in(
      "id",
      rows.map((row) => row.id),
    );
  return !rowsError;
}
