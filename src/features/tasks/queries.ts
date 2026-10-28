import "server-only";

import type { TaskCategory } from "@/domain/tasks/task-form";
import { createClient } from "@/lib/supabase/server";

export type TaskPriority = "high" | "normal";

export type CoachTask = {
  id: string;
  title: string;
  priority: TaskPriority;
  dueOn: string | null;
  category: TaskCategory | null;
  notes: string | null;
  athleteId: string | null;
  athleteName: string | null;
  done: boolean;
  doneAt: string | null;
};

type Row = {
  id: string;
  title: string;
  priority: string;
  due_on: string | null;
  category: string | null;
  notes: string | null;
  done_at: string | null;
  athlete: { id: string; first_name: string; display_name: string | null } | null;
};

const SELECT =
  "id, title, priority, due_on, category, notes, done_at, athlete:athlete_profiles ( id, first_name, display_name )";

const toTask = (row: Row): CoachTask => ({
  id: row.id,
  title: row.title,
  // La contrainte CHECK en base garantit cette liste fermée.
  priority: row.priority as TaskPriority,
  dueOn: row.due_on,
  // Listes fermées garanties par les contraintes CHECK en base.
  category: row.category as TaskCategory | null,
  notes: row.notes,
  athleteId: row.athlete?.id ?? null,
  athleteName: row.athlete ? (row.athlete.display_name ?? row.athlete.first_name) : null,
  done: row.done_at !== null,
  doneAt: row.done_at,
});

type Client = Awaited<ReturnType<typeof createClient>>;

// Tâches à faire, urgentes d'abord, puis par échéance (sans échéance en dernier), puis les plus anciennes.
const openTasks = (supabase: Client, organizationId: string) =>
  supabase
    .from("coach_tasks")
    .select(SELECT, { count: "exact" })
    .eq("organization_id", organizationId)
    .is("done_at", null)
    // « high » avant « normal » dans l'ordre alphabétique.
    .order("priority")
    .order("due_on", { nullsFirst: false })
    .order("created_at");

// Carte Tâches du tableau de bord, pour une organisation DÉJÀ vérifiée (requireOrgAccess) : le nombre
// de tâches à faire et les `limit` premières. Une tâche cochée quitte la carte (elle reste dans la page
// Tâches, onglet Terminées).
export async function getDashboardTasks(
  organizationId: string,
  limit = 3,
): Promise<{ openCount: number; items: CoachTask[] }> {
  const supabase = await createClient();
  const { data, count, error } = await openTasks(supabase, organizationId).limit(limit);
  if (error) throw new Error("Lecture des tâches impossible.");
  return { openCount: count ?? 0, items: ((data ?? []) as unknown as Row[]).map(toTask) };
}

// Page Tâches : les tâches à faire (dans l'ordre ci-dessus), puis les terminées, les plus récentes
// d'abord. Bornées : la page n'est pas un historique complet.
export async function listTasks(
  organizationId: string,
): Promise<{ open: CoachTask[]; done: CoachTask[] }> {
  const supabase = await createClient();
  const [open, done] = await Promise.all([
    openTasks(supabase, organizationId).limit(200),
    supabase
      .from("coach_tasks")
      .select(SELECT)
      .eq("organization_id", organizationId)
      .not("done_at", "is", null)
      .order("done_at", { ascending: false })
      .limit(100),
  ]);
  if (open.error || done.error) throw new Error("Lecture des tâches impossible.");
  return {
    open: ((open.data ?? []) as unknown as Row[]).map(toTask),
    done: ((done.data ?? []) as unknown as Row[]).map(toTask),
  };
}
