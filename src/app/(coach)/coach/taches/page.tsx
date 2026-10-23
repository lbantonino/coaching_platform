import { CalendarClock, CircleCheck, ListChecks, TriangleAlert } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";

import { PageBody, PageHeader, PageLoading, pageMainClass } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { CheckList } from "@/components/ui/check-list";
import { KpiCard, KpiGrid } from "@/components/ui/kpi-card";
import { PageTabs } from "@/components/ui/page-tabs";
import { inTab, type TaskTab } from "@/domain/tasks/buckets";
import { mondayOf } from "@/features/agenda/week";
import { requireCoach } from "@/features/auth/guards";
import { setTaskDone } from "@/features/tasks/actions";
import { listTasks } from "@/features/tasks/queries";
import { brusselsDayOf, dueLabel, todayIsoInBrussels } from "@/lib/format";

export const metadata: Metadata = {
  title: "Tâches",
};

// Page Tâches (prompt Claude Design §7 `/coach/taches`, D-35) avec les VRAIES tâches : chiffres,
// onglets Toutes / Aujourd'hui / À venir / Terminées, rond pour cocher. Dans un onglet filtré, la tâche
// cochée (ou rouverte) change d'onglet et quitte la liste ; dans « Toutes », elle reste, barrée.
// Pas encore de création ni de « associée à » : ils viendront avec 4e.
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

  const forToday = open.filter((task) => inTab(task, "aujourdhui", today));
  const urgent = open.filter((task) => task.priority === "high");
  const late = open.filter((task) => task.dueOn !== null && task.dueOn < today);
  const monday = mondayOf(today);
  const doneThisWeek = done.filter((task) => task.doneAt && brusselsDayOf(task.doneAt) >= monday);
  const shown = [...open, ...done].filter((task) => inTab(task, tab, today));
  const current = tabs.find((item) => item.key === tab) ?? tabs[0];

  return (
    <>
      <PageHeader title="Tâches" subtitle="Toutes les actions liées à ton activité." />
      <PageBody>
        <KpiGrid label="Chiffres des tâches">
          <KpiCard
            color="run"
            icon={ListChecks}
            value={String(open.length)}
            label="à faire"
            detail={`${forToday.length} pour aujourd'hui`}
          />
          <KpiCard
            color="accent"
            icon={TriangleAlert}
            value={String(urgent.length)}
            label={urgent.length > 1 ? "urgentes" : "urgente"}
            detail="Priorité haute"
          />
          <KpiCard
            color="amber"
            icon={CalendarClock}
            value={String(late.length)}
            label="en retard"
            detail="Échéance dépassée"
          />
          <KpiCard
            color="ok"
            icon={CircleCheck}
            value={String(doneThisWeek.length)}
            label={doneThisWeek.length > 1 ? "terminées" : "terminée"}
            detail="Cette semaine"
          />
        </KpiGrid>
        <PageTabs
          label="Onglets des tâches"
          items={tabs.map((item) => ({
            href: item.key === "toutes" ? "/coach/taches" : `/coach/taches?onglet=${item.key}`,
            label: item.label,
            active: item.key === tab,
          }))}
        />
        <Card
          id="tasks-title"
          title={tab === "toutes" ? "Toutes les tâches" : current.label}
          subtitle={`${shown.length} tâche${shown.length > 1 ? "s" : ""}`}
        >
          <CheckList
            // Une liste par onglet : l'état « affiché tout de suite » repart de zéro à chaque onglet.
            key={tab}
            variant="page"
            removeOnToggle={tab !== "toutes"}
            items={shown.map((task) => ({
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
            }))}
            action={setTaskDone.bind(null, organizationId)}
            empty={current.empty}
            toasts={{ checked: "Tâche terminée.", unchecked: "Tâche rouverte." }}
          />
        </Card>
      </PageBody>
    </>
  );
}
