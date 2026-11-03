import type { Metadata } from "next";
import { Suspense } from "react";

import { TaskList } from "@/components/blocks/task-list";
import { NewTaskButton } from "@/components/blocks/task-sheet";
import { PageBody, PageHeader, PageLoading, pageMainClass } from "@/components/layout/page-header";
import { PageTabs } from "@/components/ui/page-tabs";
import { inTab, type TaskTab } from "@/domain/tasks/buckets";
import { requireCoach } from "@/features/auth/guards";
import { setTaskDone } from "@/features/tasks/actions";
import { editableTask } from "@/features/tasks/editable";
import { listTasks } from "@/features/tasks/queries";
import { dueLabel, todayIsoInBrussels } from "@/lib/format";

export const metadata: Metadata = {
  title: "Tâches",
};

// Page Tâches (prompt Claude Design §7 `/coach/taches`, D-35) avec les VRAIES tâches : onglets Toutes /
// Aujourd'hui / À venir / Terminées, rond pour cocher. Simplifiée le 02/11 (demande d'Antonino) : plus
// de cartes de chiffres ni d'étiquette de catégorie ; seule l'étiquette « Haute » signale l'urgence ;
// la liste est posée sur le fond de la page, sans carte ni titre (l'onglet suffit), avec son nombre. Dans un onglet filtré, la tâche
// cochée (ou rouverte) change d'onglet et quitte la liste ; dans « Toutes », elle reste, barrée.
// 4e (D-59) : « + Nouvelle tâche », « associée à », et un appui sur le titre ouvre la tâche pour la
// modifier ou la supprimer.
const tabs: { key: TaskTab; label: string; empty: string }[] = [
  { key: "toutes", label: "Toutes", empty: "Aucune tâche pour l'instant." },
  { key: "aujourdhui", label: "Aujourd'hui", empty: "Rien à faire aujourd'hui." },
  { key: "avenir", label: "À venir", empty: "Rien à venir." },
  { key: "terminees", label: "Terminées", empty: "Aucune tâche terminée." },
];

export default function TasksPage({ searchParams }: PageProps<"/coach/taches">) {
  return (
    <main className={pageMainClass}>
      <Suspense fallback={<PageLoading />}>
        {searchParams.then((query) => {
          const tab = tabs.find((item) => item.key === query.onglet) ?? tabs[0];
          return <Tasks tab={tab.key} />;
        })}
      </Suspense>
    </main>
  );
}

async function Tasks({ tab }: { tab: TaskTab }) {
  // Garde-fou serveur : connecté ET membre actif d'une organisation, sinon redirection.
  const { memberships } = await requireCoach();
  const organizationId = memberships[0].organizationId;
  const today = todayIsoInBrussels();
  const { open, done } = await listTasks(organizationId);

  const shown = [...open, ...done].filter((task) => inTab(task, tab, today));
  const current = tabs.find((item) => item.key === tab) ?? tabs[0];

  return (
    <>
      <PageHeader
        title="Tâches"
        subtitle="Toutes les actions liées à ton activité."
        actions={<NewTaskButton />}
      />
      <PageBody>
        <PageTabs
          label="Onglets des tâches"
          items={tabs.map((item) => ({
            href: item.key === "toutes" ? "/coach/taches" : `/coach/taches?onglet=${item.key}`,
            label: item.label,
            active: item.key === tab,
          }))}
        />
        {/* Sur le fond de la page, sans carte (02/11) : l'onglet dit déjà quelles tâches on voit ; au-dessus
            de la liste, leur nombre, séparé d'elle par le filet de la première tâche. */}
        <section aria-label={tab === "toutes" ? "Toutes les tâches" : current.label}>
          <p className="pb-3 text-[13px] text-muted tabular">
            {shown.length} tâche{shown.length > 1 ? "s" : ""}
          </p>
          <TaskList
            // Une liste par onglet : l'état « affiché tout de suite » repart de zéro à chaque onglet.
            key={tab}
            variant="page"
            removeOnToggle={tab !== "toutes"}
            tasks={shown.map((task) => ({
              id: task.id,
              title: task.title,
              sub: task.athleteName ?? undefined,
              subHref: task.athleteId
                ? `/coach/o/${organizationId}/sportifs/${task.athleteId}`
                : undefined,
              meta: dueLabel(task.dueOn, today) ?? undefined,
              urgent: task.priority === "high",
              checked: task.done,
              label: `Tâche faite : ${task.title}`,
              edit: editableTask(task),
            }))}
            action={setTaskDone.bind(null, organizationId)}
            empty={current.empty}
            toasts={{ checked: "Tâche terminée.", unchecked: "Tâche rouverte." }}
          />
        </section>
      </PageBody>
    </>
  );
}
