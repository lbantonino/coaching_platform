import { Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonClass } from "@/components/ui/button";
import { deleteGoal, makeGoalMain, setGoalStatus } from "@/features/goals/actions";
import { goalCountdown } from "@/features/goals/format";
import { listGoals, type GoalEntry } from "@/features/goals/queries";
import { disciplineStyles } from "@/domain/training/discipline";
import {
  goalDiscipline,
  goalPriorityLabels,
  goalStatusLabels,
  goalTypeLabels,
  hyroxCategoryLabels,
} from "@/features/goals/schemas";
import { formatDate } from "@/lib/format";

import { AddGoalForm } from "./add-goal-form";
import { GoalDisciplineBadge } from "./goal-discipline-badge";

// Titre d'un objectif : le nom de la compétition s'il y en a une, sinon le type d'objectif.
function goalTitle(goal: GoalEntry): string {
  return goal.competitionName ?? goalTypeLabels[goal.type];
}

// Ligne de détails : type (si le titre est un nom de compétition), catégorie Hyrox, lieu, date.
function goalDetails(goal: GoalEntry): string {
  return [
    goal.competitionName ? goalTypeLabels[goal.type] : null,
    goal.hyroxCategory ? `Catégorie ${hyroxCategoryLabels[goal.hyroxCategory]}` : null,
    goal.competitionLocation,
    goal.targetDate ? formatDate(goal.targetDate) : "Sans date",
  ]
    .filter(Boolean)
    .join(" · ");
}

function DeleteGoalButton({
  organizationId,
  athleteId,
  goal,
}: {
  organizationId: string;
  athleteId: string;
  goal: GoalEntry;
}) {
  return (
    <form action={deleteGoal.bind(null, organizationId, athleteId, goal.id)}>
      <button
        type="submit"
        aria-label={`Supprimer : ${goalTitle(goal)}`}
        title="Supprimer (objectif saisi par erreur)"
        className="inline-flex size-8 items-center justify-center rounded-sm text-muted hover:bg-surface-2 hover:text-accent-text"
      >
        <Trash2 aria-hidden size={15} strokeWidth={1.7} />
      </button>
    </form>
  );
}

function GoalCard({
  organizationId,
  athleteId,
  goal,
  today,
}: {
  organizationId: string;
  athleteId: string;
  goal: GoalEntry;
  today: string;
}) {
  const title = goalTitle(goal);
  const countdown = goal.targetDate ? goalCountdown(today, goal.targetDate) : null;
  const discipline = goalDiscipline(goal.type);

  return (
    <article
      className={`flex flex-col gap-3 rounded-[14px] border bg-bg p-4 ${discipline ? disciplineStyles[discipline].frame : "border-line"}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <GoalDisciplineBadge type={goal.type} />
            <Badge tone={goal.priority === "main" ? "live" : "neutral"}>
              {goalPriorityLabels[goal.priority]}
            </Badge>
            {goal.competitionName ? <Badge>Compétition</Badge> : null}
            {countdown?.overdue ? <Badge tone="warn">{countdown.label}</Badge> : null}
          </div>
          <h3 className="text-title font-medium break-words">{title}</h3>
          <p className="text-caption text-muted">{goalDetails(goal)}</p>
        </div>
        {countdown && !countdown.overdue ? (
          <span className="shrink-0 font-mono text-small font-medium tabular">
            {countdown.label}
          </span>
        ) : null}
      </div>
      {goal.description ? <p className="text-small text-muted">{goal.description}</p> : null}
      <div className="flex flex-wrap items-center gap-2">
        <form action={setGoalStatus.bind(null, organizationId, athleteId, goal.id, "achieved")}>
          <button
            type="submit"
            aria-label={`Atteint : ${title}`}
            className={buttonClass({ variant: "outline", size: "sm" })}
          >
            Atteint
          </button>
        </form>
        <form action={setGoalStatus.bind(null, organizationId, athleteId, goal.id, "dropped")}>
          <button
            type="submit"
            aria-label={`Abandonné : ${title}`}
            className={buttonClass({ variant: "ghost", size: "sm" })}
          >
            Abandonné
          </button>
        </form>
        {goal.priority === "secondary" ? (
          <form action={makeGoalMain.bind(null, organizationId, athleteId, goal.id)}>
            <button
              type="submit"
              aria-label={`Rendre principal : ${title}`}
              className={buttonClass({ variant: "ghost", size: "sm" })}
            >
              Rendre principal
            </button>
          </form>
        ) : null}
        <div className="ml-auto">
          <DeleteGoalButton organizationId={organizationId} athleteId={athleteId} goal={goal} />
        </div>
      </div>
    </article>
  );
}

// Section « Objectifs & compétitions » de la fiche (P2-02 partie 2). Serveur : lit les objectifs,
// déjà filtrés par la RLS. Les compteurs (J-45) sont calculés depuis la date du jour à Bruxelles.
export async function GoalsSection({
  organizationId,
  athleteId,
  today,
}: {
  organizationId: string;
  athleteId: string;
  today: string;
}) {
  const { current, past } = await listGoals(organizationId, athleteId);
  const hasMain = current.some((goal) => goal.priority === "main");

  return (
    <section
      aria-labelledby="goals-title"
      className="flex flex-col gap-5 rounded-card border border-line bg-surface p-5 md:p-[22px]"
    >
      <div className="flex flex-col gap-1">
        <h2 id="goals-title" className="text-title font-medium">
          Objectifs &amp; compétitions
        </h2>
        <p className="text-small text-muted">
          Ce que le sportif prépare. Un seul objectif principal à la fois ; un objectif atteint ou
          abandonné reste dans l&apos;historique.
        </p>
      </div>

      {current.length === 0 ? (
        <p
          role="status"
          className="rounded-[14px] border border-dashed border-line-2 p-4 text-muted"
        >
          Aucun objectif en cours. Ajoute ce que le sportif prépare : une course, un Hyrox, de la
          force, une remise en forme…
        </p>
      ) : (
        <ul aria-label="Objectifs en cours" className="flex flex-col gap-3">
          {current.map((goal) => (
            <li key={goal.id}>
              <GoalCard
                organizationId={organizationId}
                athleteId={athleteId}
                goal={goal}
                today={today}
              />
            </li>
          ))}
        </ul>
      )}

      {past.length > 0 ? (
        <details className="rounded-[14px] border border-line">
          <summary className="cursor-pointer px-4 py-3 text-small text-muted hover:text-text">
            Objectifs passés ({past.length})
          </summary>
          <ul aria-label="Objectifs passés" className="flex flex-col border-t border-line">
            {past.map((goal) => (
              <li
                key={goal.id}
                className="flex items-center justify-between gap-3 border-b border-line px-4 py-2.5 text-small last:border-b-0"
              >
                <span className="flex min-w-0 flex-col gap-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <Badge tone={goal.status === "achieved" ? "ok" : "neutral"}>
                      {goalStatusLabels[goal.status]}
                    </Badge>
                    <GoalDisciplineBadge type={goal.type} />
                    {goalTitle(goal)}
                  </span>
                  <span className="text-caption text-muted">{goalDetails(goal)}</span>
                </span>
                <DeleteGoalButton
                  organizationId={organizationId}
                  athleteId={athleteId}
                  goal={goal}
                />
              </li>
            ))}
          </ul>
        </details>
      ) : null}

      <AddGoalForm
        organizationId={organizationId}
        athleteId={athleteId}
        today={today}
        hasMain={hasMain}
      />
    </section>
  );
}
