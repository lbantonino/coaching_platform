"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireCoach } from "@/features/auth/guards";
import { createClient } from "@/lib/supabase/server";

// Favoris de la bibliothèque (D-75) : propres à chaque personne. L'action revérifie l'identité ; la RLS
// n'accepte qu'un favori pour soi, sur un exercice qu'on a le droit de voir.
export async function setExerciseFavorite(
  exerciseId: string,
  favorite: boolean,
): Promise<{ ok: boolean }> {
  const { user } = await requireCoach();
  if (!z.uuid().safeParse(exerciseId).success || typeof favorite !== "boolean")
    return { ok: false };

  const supabase = await createClient();
  const { error } = favorite
    ? await supabase
        .from("exercise_favorites")
        .upsert(
          { user_id: user.id, exercise_id: exerciseId },
          { onConflict: "user_id,exercise_id", ignoreDuplicates: true },
        )
    : await supabase
        .from("exercise_favorites")
        .delete()
        .eq("user_id", user.id)
        .eq("exercise_id", exerciseId);
  if (error) return { ok: false };

  revalidatePath("/coach/bibliotheque", "layout");
  return { ok: true };
}
