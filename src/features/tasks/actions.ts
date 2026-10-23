"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireOrgAccess } from "@/features/auth/guards";
import { createClient } from "@/lib/supabase/server";

// Coche ou décoche une tâche. « Qui a coché » est posé par la base (jamais par le navigateur).
export async function setTaskDone(
  organizationId: string,
  taskId: string,
  done: boolean,
): Promise<{ ok: boolean }> {
  const { membership } = await requireOrgAccess(organizationId);
  if (!z.uuid().safeParse(taskId).success || typeof done !== "boolean") return { ok: false };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("coach_tasks")
    .update({ done_at: done ? new Date().toISOString() : null })
    .eq("id", taskId)
    .eq("organization_id", membership.organizationId)
    .select("id");
  // Aucune ligne : tâche d'une autre organisation ou supprimée entre-temps.
  if (error || !data?.length) return { ok: false };

  revalidatePath("/coach");
  revalidatePath("/coach/taches");
  return { ok: true };
}
