import { z } from "zod";

import { isExercisePhotoPath } from "@/domain/exercises/coach-exercise";
import { getCurrentUser } from "@/features/auth/session";
import { createClient } from "@/lib/supabase/server";

// Sert la photo d'un exercice créé par un coach (D-76) depuis le stockage PRIVÉ. Tout se lit avec la
// session de la personne : la RLS de la table et du stockage décide si elle a le droit de la voir.
// L'adresse porte la date de modification (?v=) : la photo peut rester une journée en cache.
export async function GET(
  _request: Request,
  context: RouteContext<"/exercices/images/[exerciseId]">,
) {
  const { exerciseId } = await context.params;
  if (!z.uuid().safeParse(exerciseId).success) return new Response(null, { status: 404 });
  if (!(await getCurrentUser())) return new Response(null, { status: 401 });

  const supabase = await createClient();
  const { data: row } = await supabase
    .from("exercises")
    .select("image_main")
    .eq("id", exerciseId)
    .not("organization_id", "is", null)
    .maybeSingle();
  // Interdit ou absent : même réponse, pour ne rien révéler de l'existence d'un exercice.
  if (!row?.image_main || !isExercisePhotoPath(row.image_main)) {
    return new Response(null, { status: 404 });
  }
  const { data, error } = await supabase.storage.from("exercise-images").download(row.image_main);
  if (error || !data) return new Response(null, { status: 404 });

  const ext = row.image_main.split(".").pop()?.toLowerCase();
  const contentType = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";
  return new Response(data, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "private, max-age=86400",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
