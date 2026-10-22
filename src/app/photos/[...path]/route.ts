import type { NextRequest } from "next/server";

import { getCurrentUser } from "@/features/auth/session";
import { isPhotoPath } from "@/features/photos/validate";
import { createClient } from "@/lib/supabase/server";

// Sert une photo de profil (D-28) depuis l'espace de stockage PRIVÉ. Le téléchargement se fait avec la
// session de l'utilisateur : les règles RLS du stockage décident s'il a le droit de la voir.
// Pas d'adresse signée vers Supabase : l'image passe par l'app, donc elle s'affiche aussi sur téléphone.
export async function GET(_request: NextRequest, context: RouteContext<"/photos/[...path]">) {
  const { path } = await context.params;
  const objectPath = path.join("/");
  if (!isPhotoPath(objectPath)) return new Response(null, { status: 404 });
  if (!(await getCurrentUser())) return new Response(null, { status: 401 });

  const supabase = await createClient();
  const { data, error } = await supabase.storage.from("profile-photos").download(objectPath);
  // Interdit ou absent : même réponse, pour ne rien révéler de l'existence d'un fichier.
  if (error || !data) return new Response(null, { status: 404 });

  return new Response(data, {
    headers: {
      "Content-Type": data.type || "application/octet-stream",
      // Chaque envoi crée un nouveau nom de fichier : l'image ne change jamais, cache privé possible.
      "Cache-Control": "private, max-age=86400, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
