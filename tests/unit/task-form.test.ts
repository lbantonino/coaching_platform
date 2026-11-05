import { describe, expect, it } from "vitest";

import { parseTaskForm, type TaskFormValues } from "@/domain/tasks/task-form";

const base: TaskFormValues = {
  title: "Relancer Sophie",
  priority: "normal",
  dueOn: "",
  listId: "",
  athleteId: "",
  notes: "",
};

describe("formulaire d'une tâche", () => {
  it("garde le titre seul et met le reste à null", () => {
    expect(parseTaskForm({ ...base, title: "  Relancer Sophie  " })).toEqual({
      ok: true,
      task: {
        title: "Relancer Sophie",
        priority: "normal",
        dueOn: null,
        listId: null,
        athleteId: null,
        notes: null,
      },
    });
  });

  it("lit l'échéance, la liste (« associée à »), le sportif et la note", () => {
    const parsed = parseTaskForm({
      ...base,
      priority: "high",
      dueOn: "2026-10-30",
      listId: "71000000-0000-4000-8000-0000000000a2",
      athleteId: "da000000-0000-4000-8000-000000000001",
      notes: "  Facture d'octobre  ",
    });
    expect(parsed).toEqual({
      ok: true,
      task: {
        title: "Relancer Sophie",
        priority: "high",
        dueOn: "2026-10-30",
        listId: "71000000-0000-4000-8000-0000000000a2",
        athleteId: "da000000-0000-4000-8000-000000000001",
        notes: "Facture d'octobre",
      },
    });
  });

  it("refuse un titre vide ou trop long", () => {
    expect(parseTaskForm({ ...base, title: "   " })).toEqual({
      ok: false,
      error: "Donne un titre à la tâche.",
    });
    expect(parseTaskForm({ ...base, title: "a".repeat(141) }).ok).toBe(false);
  });

  it("refuse une liste, une priorité, une date ou un sportif inventés", () => {
    expect(parseTaskForm({ ...base, listId: "courses" }).ok).toBe(false);
    expect(parseTaskForm({ ...base, priority: "urgent" }).ok).toBe(false);
    expect(parseTaskForm({ ...base, dueOn: "30/10/2026" }).ok).toBe(false);
    expect(parseTaskForm({ ...base, athleteId: "pas-un-uuid" }).ok).toBe(false);
  });

  it("refuse une note de plus de 1000 caractères", () => {
    expect(parseTaskForm({ ...base, notes: "a".repeat(1001) })).toEqual({
      ok: false,
      error: "Note trop longue (1000 caractères maximum).",
    });
  });
});
