"use client";

import { CheckList, type CheckItem } from "@/components/ui/check-list";

import { useOpenTaskSheet, type EditableTask } from "./task-sheet";

// Liste de tâches à cocher dont chaque titre ouvre la fenêtre « Modifier la tâche » (D-59). Utilisée
// par la page Tâches et la carte Tâches du tableau de bord (pages serveur : la fenêtre s'ouvre ici).
export function TaskList({
  tasks,
  ...props
}: Omit<Parameters<typeof CheckList>[0], "onOpen" | "items"> & {
  tasks: (CheckItem & { edit: EditableTask })[];
}) {
  const openTask = useOpenTaskSheet();
  const byId = new Map(tasks.map((task) => [task.id, task.edit]));
  return (
    <CheckList
      {...props}
      items={tasks}
      onOpen={openTask ? (id) => openTask(byId.get(id)) : undefined}
    />
  );
}
