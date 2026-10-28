import type { NextRequest } from "next/server";
import { z } from "zod";

import { isDocumentPath } from "@/domain/documents/documents";
import { getCurrentUser } from "@/features/auth/session";
import { createClient } from "@/lib/supabase/server";

// Sert un document du coach (4e, D-60) depuis l'espace de stockage PRIVÉ. Tout se lit avec la session
// de la personne : la RLS de la table et du stockage décide si elle a le droit de le voir.
// PDF et images s'ouvrent dans le navigateur (aperçu) ; Word et Excel se téléchargent ; ?telecharger
// force le téléchargement.
export async function GET(request: NextRequest, context: RouteContext<"/documents/[documentId]">) {
  const { documentId } = await context.params;
  if (!z.uuid().safeParse(documentId).success) return new Response(null, { status: 404 });
  if (!(await getCurrentUser())) return new Response(null, { status: 401 });

  const supabase = await createClient();
  const { data: row } = await supabase
    .from("coach_documents")
    .select("name, storage_path, mime_type")
    .eq("id", documentId)
    .maybeSingle();
  // Interdit ou absent : même réponse, pour ne rien révéler de l'existence d'un document.
  if (!row || !isDocumentPath(row.storage_path)) return new Response(null, { status: 404 });
  const { data, error } = await supabase.storage.from("coach-documents").download(row.storage_path);
  if (error || !data) return new Response(null, { status: 404 });

  const ext = row.storage_path.split(".").pop();
  const viewable = row.mime_type === "application/pdf" || row.mime_type.startsWith("image/");
  const download = request.nextUrl.searchParams.has("telecharger") || !viewable;
  const fileName = `${row.name}.${ext}`;
  // Nom en ASCII pour les vieux navigateurs, et en UTF-8 (RFC 5987) pour les accents.
  const ascii = fileName
    .normalize("NFD")
    .replace(/[^\x20-\x7e]/g, "")
    .replace(/["\\]/g, "");
  return new Response(data, {
    headers: {
      "Content-Type": row.mime_type,
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(fileName)}`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
