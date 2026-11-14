import "server-only";

import type { ListColor } from "@/domain/tasks/lists";
import { createClient } from "@/lib/supabase/server";

export type TaskPriority = "high" | "normal";

// Liste du coach (kit « Coory Pages », 01, D-129).
export type TaskList = { id: string; name: string; color: ListColor };

export type CoachTask = {
  id: string;
  title: string;
  priority: TaskPriority;
  dueOn: string | null;
  list: TaskList | null;
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
  notes: string | null;
  done_at: string | null;
  athlete: { id: string; first_name: string; display_name: string | null } | null;
  list: { id: string; name: string; color: string } | null;
};

const SELECT =
  "id, title, priority, due_on, notes, done_at, athlete:athlete_profiles ( id, first_name, display_name ), list:coach_task_lists ( id, name, color )";

const toTask = (row: Row): CoachTask => ({
  id: row.id,
  title: row.title,
  // La contrainte CHECK en base garantit cette liste fermée.
  priority: row.priority as TaskPriority,
  dueOn: row.due_on,
  // Couleur : liste fermée garantie par la contrainte CHECK en base.
  list: row.list ? { ...row.list, color: row.list.color as ListColor } : null,
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

// Une tâche de l'organisation, ou null (Assistant IA, lot 4 : la carte et le « Valider » repartent
// de la tâche actuelle).
export async function getTask(organizationId: string, taskId: string): Promise<CoachTask | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("coach_tasks")
    .select(SELECT)
    .eq("organization_id", organizationId)
    .eq("id", taskId)
    .maybeSingle();
  if (error) throw new Error("Lecture de la tâche impossible.");
  return data ? toTask(data as unknown as Row) : null;
}

// Listes du coach, dans leur ordre (puis de création). Aucune au départ (décision 8).
export async function listTaskLists(organizationId: string): Promise<TaskList[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("coach_task_lists")
    .select("id, name, color")
    .eq("organization_id", organizationId)
    .order("position")
    .order("created_at");
  if (error) throw new Error("Lecture des listes impossible.");
  return (data ?? []).map((row) => ({ ...row, color: row.color as ListColor }));
}
