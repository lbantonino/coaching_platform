"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { parseTaskForm, readTaskForm, type TaskFormValues } from "@/domain/tasks/task-form";
import { requireOrgAccess } from "@/features/auth/guards";
import { createClient } from "@/lib/supabase/server";

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
  const { error } = await supabase.from("coach_tasks").insert({
    organization_id: orgId,
    title: task.title,
    priority: task.priority,
    due_on: task.dueOn,
    category: task.category,
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
  const { data, error } = await supabase
    .from("coach_tasks")
    .update({
      title: task.title,
      priority: task.priority,
      due_on: task.dueOn,
      category: task.category,
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
