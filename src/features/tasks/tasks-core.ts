import "server-only";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

// « Vider les tâches terminées » validé depuis l'Assistant IA (lot 4, relecture n°2) : seulement les
// tâches comptées sur la carte, encore terminées, de l'organisation ; une tâche cochée après la
// proposition reste. Appelé après requireOrgAccess ; jamais dans un fichier « use server ».
export async function removeDoneTasks(
  orgId: string,
  taskIds: readonly string[],
): Promise<{ ok: boolean; count: number }> {
  if (taskIds.length === 0) return { ok: true, count: 0 };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("coach_tasks")
    .delete()
    .eq("organization_id", orgId)
    .in("id", [...taskIds])
    .not("done_at", "is", null)
    .select("id");
  revalidatePath("/coach");
  revalidatePath("/coach/taches");
  revalidatePath("/coach/notifications");
  return { ok: !error, count: data?.length ?? 0 };
}
