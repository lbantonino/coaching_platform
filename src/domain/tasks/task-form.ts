import { z } from "zod";

// Formulaire d'une tâche (4e, D-59) : création et modification, les mêmes règles que la base
// (migration 20261028150000). Prompt Claude Design §7 `/coach/taches` : tâche, « associée à »,
// priorité Haute / Normale, échéance ; plus le sportif concerné et une note, facultatifs.
// « Associée à » : une des listes du coach (kit « Coory Pages », 01, D-129, décision 8), à la place
// des 5 catégories fixes (la colonne `category` reste en base, inutilisée).

export const TASK_TITLE_MAX = 140;
export const TASK_NOTES_MAX = 1000;

// Saisie brute (chaînes), renvoyée telle quelle en cas d'erreur pour ne rien perdre.
export type TaskFormValues = {
  title: string;
  priority: string;
  dueOn: string;
  listId: string;
  athleteId: string;
  notes: string;
};

export type TaskInput = {
  title: string;
  priority: "high" | "normal";
  dueOn: string | null;
  listId: string | null;
  athleteId: string | null;
  notes: string | null;
};

const empty = (value: string) => value.trim() === "";

const schema = z.object({
  title: z
    .string()
    .trim()
    .min(1, { error: "Donne un titre à la tâche." })
    .max(TASK_TITLE_MAX, { error: `Titre trop long (${TASK_TITLE_MAX} caractères maximum).` }),
  priority: z.enum(["high", "normal"], { error: "Choisis la priorité." }),
  dueOn: z.union([
    z.literal(""),
    z.iso
      .date({ error: "Date d'échéance invalide." })
      .refine((day) => day >= "2000-01-01", { error: "Date d'échéance invalide." }),
  ]),
  listId: z.union([z.literal(""), z.uuid({ error: "Liste invalide." })]),
  athleteId: z.union([z.literal(""), z.uuid({ error: "Sportif invalide." })]),
  notes: z
    .string()
    .max(TASK_NOTES_MAX, { error: `Note trop longue (${TASK_NOTES_MAX} caractères maximum).` }),
});

export function readTaskForm(formData: FormData): TaskFormValues {
  const field = (name: string) => String(formData.get(name) ?? "");
  return {
    title: field("title"),
    priority: field("priority") || "normal",
    dueOn: field("dueOn"),
    listId: field("listId"),
    athleteId: field("athleteId"),
    notes: field("notes"),
  };
}

export function parseTaskForm(
  values: TaskFormValues,
): { ok: true; task: TaskInput } | { ok: false; error: string } {
  const result = schema.safeParse(values);
  if (!result.success) return { ok: false, error: result.error.issues[0].message };
  const data = result.data;
  const notes = data.notes.trim();
  return {
    ok: true,
    task: {
      title: data.title,
      priority: data.priority,
      dueOn: empty(data.dueOn) ? null : data.dueOn,
      listId: data.listId === "" ? null : data.listId,
      athleteId: data.athleteId === "" ? null : data.athleteId,
      notes: notes === "" ? null : notes,
    },
  };
}
