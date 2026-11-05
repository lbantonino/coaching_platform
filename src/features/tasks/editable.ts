import type { EditableTask } from "@/components/blocks/task-sheet";

import type { CoachTask } from "./queries";

// Ce que la fenêtre « Modifier la tâche » reçoit d'une tâche lue en base (D-59).
export function editableTask(task: CoachTask): EditableTask {
  return {
    id: task.id,
    title: task.title,
    priority: task.priority,
    dueOn: task.dueOn,
    listId: task.list?.id ?? null,
    athleteId: task.athleteId,
    notes: task.notes,
  };
}
