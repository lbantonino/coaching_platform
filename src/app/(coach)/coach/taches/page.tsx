import type { Metadata } from "next";
import { Suspense } from "react";

import { PageBody, PageHeader, PageLoading, pageMainClass } from "@/components/layout/page-header";
import { requireCoach } from "@/features/auth/guards";
import {
  createTaskList,
  deleteTaskList,
  quickAddTask,
  setTaskDone,
  updateTaskList,
} from "@/features/tasks/actions";
import { editableTask } from "@/features/tasks/editable";
import { listTaskLists, listTasks } from "@/features/tasks/queries";
import { todayIsoInBrussels } from "@/lib/format";

import { QuickAddButton, TasksView, type TasksViewTask } from "./tasks-view";

export const metadata: Metadata = {
  title: "Tâches",
};

// Page Tâches, kit « Coory Pages », page 01 (D-129 ; avant : D-35, D-59, D-84). Les vraies tâches du
// coach, rangées dans des vues « intelligentes » (Aujourd'hui, À venir, Toutes, Terminées) et dans
// SES listes (décision 8 : nouvelle table, aucune au départ ; décision 9 : renommer, recolorer,
// supprimer). « + Nouvelle tâche » et le bouton flottant ouvrent l'ajout rapide (titre seul,
// décision 10) ; la fenêtre complète reste pour « Créer → Tâche » et en touchant une tâche.
// La vue est dans l'adresse (?vue=aujourdhui | avenir | toutes | terminees | <id d'une liste>) ;
// « ?onglet= » (anciens liens) est accepté. Sur téléphone, sans vue : l'accueil des listes.
export default function TasksPage({ searchParams }: PageProps<"/coach/taches">) {
  return (
    <main className={pageMainClass}>
      <Suspense fallback={<PageLoading />}>
        {searchParams.then((query) => {
          const raw = query.vue ?? query.onglet;
          return <Tasks view={typeof raw === "string" ? raw : null} />;
        })}
      </Suspense>
    </main>
  );
}

async function Tasks({ view }: { view: string | null }) {
  // Garde-fou serveur : connecté ET membre actif d'une organisation, sinon redirection.
  const { memberships } = await requireCoach();
  const organizationId = memberships[0].organizationId;
  const today = todayIsoInBrussels();
  const [{ open, done }, lists] = await Promise.all([
    listTasks(organizationId),
    listTaskLists(organizationId),
  ]);
  const tasks: TasksViewTask[] = [...open, ...done].map((task) => ({
    id: task.id,
    title: task.title,
    high: task.priority === "high",
    dueOn: task.dueOn,
    done: task.done,
    athleteName: task.athleteName,
    list: task.list,
    edit: editableTask(task),
  }));

  return (
    <>
      <PageHeader title="Tâches" actions={<QuickAddButton />} />
      <PageBody grow>
        <TasksView
          key={view ?? ""}
          view={view}
          today={today}
          tasks={tasks}
          lists={lists}
          actions={{
            setDone: setTaskDone.bind(null, organizationId),
            quickAdd: quickAddTask.bind(null, organizationId),
            createList: createTaskList.bind(null, organizationId),
            updateList: updateTaskList.bind(null, organizationId),
            deleteList: deleteTaskList.bind(null, organizationId),
          }}
        />
      </PageBody>
    </>
  );
}
