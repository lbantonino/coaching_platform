"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { addDays } from "@/features/agenda/items";
import { LIST_COLORS, listColorSchema, listNameSchema, nextListColor } from "@/domain/tasks/lists";
import {
  parseTaskForm,
  readTaskForm,
  TASK_TITLE_MAX,
  type TaskFormValues,
} from "@/domain/tasks/task-form";
import { requireOrgAccess } from "@/features/auth/guards";
import { todayIsoInBrussels } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

import { listTaskLists, type TaskList } from "./queries";

// Tâches du coach (D-35, complétées en 4e, D-59) : cocher, créer, modifier, supprimer. Chaque action
// revérifie l'accès à l'organisation ; la RLS (membres seulement) protège en plus.
function revalidateTasks() {
  revalidatePath("/coach");
  revalidatePath("/coach/taches");
  revalidatePath("/coach/notifications");
}

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

  revalidateTasks();
  return { ok: true };
}

// `attempt` reconstruit le formulaire après chaque réponse (React remettrait sinon les menus à leur
// valeur de départ) ; `values` rend la saisie en cas d'erreur.
export type TaskFormState = {
  error: string | null;
  attempt: number;
  values: TaskFormValues | null;
  saved: boolean;
};

// Liste choisie : de la même organisation (la clé étrangère composée le garantit aussi).
async function listInOrg(
  supabase: Awaited<ReturnType<typeof createClient>>,
  orgId: string,
  listId: string | null,
) {
  if (!listId) return true;
  const { data } = await supabase
    .from("coach_task_lists")
    .select("id")
    .eq("id", listId)
    .eq("organization_id", orgId)
    .maybeSingle();
  return Boolean(data);
}

// Sportif choisi : il doit être de la même organisation (la clé étrangère le garantit aussi).
async function athleteInOrg(
  supabase: Awaited<ReturnType<typeof createClient>>,
  orgId: string,
  athleteId: string | null,
) {
  if (!athleteId) return true;
  const { data } = await supabase
    .from("athlete_profiles")
    .select("id")
    .eq("id", athleteId)
    .eq("organization_id", orgId)
    .maybeSingle();
  return Boolean(data);
}

export async function createTask(
  organizationId: string,
  previous: TaskFormState,
  formData: FormData,
): Promise<TaskFormState> {
  const { user, membership } = await requireOrgAccess(organizationId);
  const orgId = membership.organizationId;
  const values = readTaskForm(formData);
  const fail = (error: string): TaskFormState => ({
    error,
    attempt: previous.attempt + 1,
    values,
    saved: false,
  });
  const parsed = parseTaskForm(values);
  if (!parsed.ok) return fail(parsed.error);
  const task = parsed.task;

  const supabase = await createClient();
  if (!(await athleteInOrg(supabase, orgId, task.athleteId))) return fail("Sportif introuvable.");
  if (!(await listInOrg(supabase, orgId, task.listId))) return fail("Liste introuvable.");
  const { error } = await supabase.from("coach_tasks").insert({
    organization_id: orgId,
    title: task.title,
    priority: task.priority,
    due_on: task.dueOn,
    list_id: task.listId,
    athlete_id: task.athleteId,
    notes: task.notes,
    created_by: user.id,
  });
  if (error) return fail("La tâche n'a pas pu être enregistrée. Réessaie.");

  revalidateTasks();
  return { error: null, attempt: previous.attempt + 1, values: null, saved: true };
}

export async function updateTask(
  organizationId: string,
  taskId: string,
  previous: TaskFormState,
  formData: FormData,
): Promise<TaskFormState> {
  const { membership } = await requireOrgAccess(organizationId);
  const orgId = membership.organizationId;
  const values = readTaskForm(formData);
  const fail = (error: string): TaskFormState => ({
    error,
    attempt: previous.attempt + 1,
    values,
    saved: false,
  });
  if (!z.uuid().safeParse(taskId).success) return fail("Tâche introuvable.");
  const parsed = parseTaskForm(values);
  if (!parsed.ok) return fail(parsed.error);
  const task = parsed.task;

  const supabase = await createClient();
  if (!(await athleteInOrg(supabase, orgId, task.athleteId))) return fail("Sportif introuvable.");
  if (!(await listInOrg(supabase, orgId, task.listId))) return fail("Liste introuvable.");
  const { data, error } = await supabase
    .from("coach_tasks")
    .update({
      title: task.title,
      priority: task.priority,
      due_on: task.dueOn,
      list_id: task.listId,
      athlete_id: task.athleteId,
      notes: task.notes,
    })
    .eq("id", taskId)
    .eq("organization_id", orgId)
    .select("id");
  if (error) return fail("La tâche n'a pas pu être enregistrée. Réessaie.");
  if (!data?.length) return fail("Tâche introuvable : elle a peut-être été supprimée.");

  revalidateTasks();
  return { error: null, attempt: previous.attempt + 1, values: null, saved: true };
}

export async function deleteTask(organizationId: string, taskId: string): Promise<{ ok: boolean }> {
  const { membership } = await requireOrgAccess(organizationId);
  if (!z.uuid().safeParse(taskId).success) return { ok: false };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("coach_tasks")
    .delete()
    .eq("id", taskId)
    .eq("organization_id", membership.organizationId)
    .select("id");
  if (error || !data?.length) return { ok: false };
  revalidateTasks();
  return { ok: true };
}

// --- Ajout rapide et listes (kit « Coory Pages », page 01, D-129) ---------------------------------

// Vue de la page Tâches où l'on ajoute : une vue « intelligente » ou une liste du coach.
const quickViewSchema = z.union([
  z.enum(["toutes", "aujourdhui", "avenir"]),
  z.object({ listId: z.uuid() }),
]);

// Ajout rapide (décision 10) : le titre seul, dans la vue en cours. Aujourd'hui -> échéance
// aujourd'hui ; À venir -> demain ; une liste -> dans cette liste ; Toutes -> sans échéance.
export async function quickAddTask(
  organizationId: string,
  title: string,
  view: unknown,
): Promise<{ ok: boolean; error?: string }> {
  const { user, membership } = await requireOrgAccess(organizationId);
  const orgId = membership.organizationId;
  const parsedTitle = z.string().trim().min(1).max(TASK_TITLE_MAX).safeParse(title);
  const parsedView = quickViewSchema.safeParse(view);
  if (!parsedTitle.success) return { ok: false, error: "Donne un titre à la tâche." };
  if (!parsedView.success) return { ok: false };
  const where = parsedView.data;
  const today = todayIsoInBrussels();
  const supabase = await createClient();
  const listId = typeof where === "object" ? where.listId : null;
  if (!(await listInOrg(supabase, orgId, listId)))
    return { ok: false, error: "Liste introuvable." };
  const { error } = await supabase.from("coach_tasks").insert({
    organization_id: orgId,
    title: parsedTitle.data,
    priority: "normal",
    due_on: where === "aujourdhui" ? today : where === "avenir" ? addDays(today, 1) : null,
    list_id: listId,
    created_by: user.id,
  });
  if (error) return { ok: false, error: "La tâche n'a pas pu être ajoutée. Réessaie." };
  revalidateTasks();
  return { ok: true };
}

type ListResult = { ok: boolean; error?: string; id?: string };

// Nouvelle liste : la couleur suivante de la palette, à la fin.
export async function createTaskList(organizationId: string, name: string): Promise<ListResult> {
  const { membership } = await requireOrgAccess(organizationId);
  const orgId = membership.organizationId;
  const parsed = listNameSchema.safeParse(name);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const supabase = await createClient();
  const { data: existing, error: readError } = await supabase
    .from("coach_task_lists")
    .select("color, position")
    .eq("organization_id", orgId);
  if (readError) return { ok: false, error: "La liste n'a pas pu être créée. Réessaie." };
  const rows = existing ?? [];
  const { data, error } = await supabase
    .from("coach_task_lists")
    .insert({
      organization_id: orgId,
      name: parsed.data,
      color: nextListColor(rows.map((row) => row.color)),
      position: rows.reduce((max, row) => Math.max(max, row.position + 1), 0),
    })
    .select("id")
    .single();
  if (error || !data) return { ok: false, error: "La liste n'a pas pu être créée. Réessaie." };
  revalidateTasks();
  return { ok: true, id: data.id };
}

// Renommer et / ou recolorer une liste (décision 9).
export async function updateTaskList(
  organizationId: string,
  listId: string,
  change: { name?: string; color?: string },
): Promise<ListResult> {
  const { membership } = await requireOrgAccess(organizationId);
  if (!z.uuid().safeParse(listId).success) return { ok: false };
  const patch: { name?: string; color?: (typeof LIST_COLORS)[number] } = {};
  if (change.name !== undefined) {
    const parsed = listNameSchema.safeParse(change.name);
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
    patch.name = parsed.data;
  }
  if (change.color !== undefined) {
    const parsed = listColorSchema.safeParse(change.color);
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
    patch.color = parsed.data;
  }
  if (Object.keys(patch).length === 0) return { ok: false };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("coach_task_lists")
    .update(patch)
    .eq("id", listId)
    .eq("organization_id", membership.organizationId)
    .select("id");
  if (error || !data?.length) return { ok: false, error: "La liste n'a pas pu être modifiée." };
  revalidateTasks();
  return { ok: true };
}

// Supprimer une liste : ses tâches restent, « sans liste » (décision 9 ; la base s'en charge).
export async function deleteTaskList(organizationId: string, listId: string): Promise<ListResult> {
  const { membership } = await requireOrgAccess(organizationId);
  if (!z.uuid().safeParse(listId).success) return { ok: false };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("coach_task_lists")
    .delete()
    .eq("id", listId)
    .eq("organization_id", membership.organizationId)
    .select("id");
  if (error || !data?.length) return { ok: false, error: "La liste n'a pas pu être supprimée." };
  revalidateTasks();
  return { ok: true };
}

// Listes proposées par la fenêtre « Tâche » (« Associée à »), lues à son ouverture.
export async function loadTaskLists(organizationId: string): Promise<TaskList[]> {
  const { membership } = await requireOrgAccess(organizationId);
  return listTaskLists(membership.organizationId);
}
