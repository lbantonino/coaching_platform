import { ChevronRight, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { deleteGoal, makeGoalMain, setGoalStatus } from "@/features/goals/actions";
import { listGoals, type GoalEntry } from "@/features/goals/queries";
import { disciplineLabels, disciplineStyles } from "@/domain/training/discipline";
import {
  goalDiscipline,
  goalPriorityLabels,
  goalStatusLabels,
  goalTypeLabels,
  hyroxCategoryLabels,
} from "@/features/goals/schemas";
import { formatRaceTime } from "@/features/records/schemas";
import { daysBetween, formatDate } from "@/lib/format";

import { AddGoalForm } from "./add-goal-form";
import { EditGoalButton } from "./edit-goal-button";

// Titre d'un objectif : le nom de la compétition s'il y en a une, sinon le type d'objectif.
function goalTitle(goal: GoalEntry): string {
  return goal.competitionName ?? goalTypeLabels[goal.type];
}

// Ligne de détails : type (si le titre est un nom de compétition et que la discipline, écrite devant,
// ne le dit pas déjà), catégorie Hyrox, lieu, date.
function goalDetails(goal: GoalEntry): string {
  const discipline = goalDiscipline(goal.type);
  const typeLabel = goalTypeLabels[goal.type];
  return [
    goal.competitionName && (!discipline || disciplineLabels[discipline] !== typeLabel)
      ? typeLabel
      : null,
    goal.hyroxCategory ? `Catégorie ${hyroxCategoryLabels[goal.hyroxCategory]}` : null,
    goal.competitionLocation,
    goal.targetDate ? formatDate(goal.targetDate) : "Sans date",
    goal.targetTimeSeconds ? `Temps visé ${formatRaceTime(goal.targetTimeSeconds)}` : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

// Discipline de l'objectif écrite en tête des détails : son point de couleur et son nom (rien pour un
// objectif personnel). Choix d'Antonino du 03/11 : plus de pastilles dans les cartes.
function DisciplineLabel({ goal }: { goal: GoalEntry }) {
  const discipline = goalDiscipline(goal.type);
  return discipline ? (
    <span className="inline-flex items-center gap-1.5 font-medium text-text-2">
      <span
        aria-hidden
        className={`size-[7px] shrink-0 rounded-full ${disciplineStyles[discipline].dot}`}
      />
      {disciplineLabels[discipline]}
    </span>
  ) : null;
}

// Compte à rebours en grand, à droite du titre (choix d'Antonino du 03/11) : « 137 / jours »,
// « Aujourd'hui », ou « Date passée » (en ambre) pour un objectif en cours dont la date est dépassée.
function Countdown({ today, targetDate }: { today: string; targetDate: string }) {
  const days = daysBetween(today, targetDate);
  if (days < 0) {
    return (
      <span className="shrink-0 pt-0.5 text-[13px] font-semibold whitespace-nowrap text-warn">
        Date passée
      </span>
    );
  }
  if (days === 0) {
    return (
      <span className="shrink-0 pt-0.5 text-[13px] font-semibold whitespace-nowrap text-violet-text">
        Aujourd&apos;hui
      </span>
    );
  }
  return (
    <span
      aria-label={`Dans ${days} jour${days > 1 ? "s" : ""}`}
      className="flex shrink-0 flex-col items-end"
    >
      <span
        aria-hidden
        className="text-[28px] leading-[30px] font-semibold tracking-[-0.03em] text-violet-text tabular-nums"
      >
        {days}
      </span>
      <span aria-hidden className="text-[12px] leading-4 font-medium text-muted">
        jour{days > 1 ? "s" : ""}
      </span>
    </span>
  );
}

function DeleteGoalButton({
  organizationId,
  athleteId,
  goal,
  className = "text-faint",
}: {
  organizationId: string;
  athleteId: string;
  goal: GoalEntry;
  className?: string;
}) {
  return (
    <form action={deleteGoal.bind(null, organizationId, athleteId, goal.id)}>
      <button
        type="submit"
        aria-label={`Supprimer : ${goalTitle(goal)}`}
        title="Supprimer (objectif saisi par erreur)"
        className={`grid size-[38px] place-items-center rounded-[10px] transition-colors duration-150 hover:bg-surface-2 hover:text-alert ${className}`}
      >
        <Trash2 aria-hidden size={15} strokeWidth={1.8} />
      </button>
    </form>
  );
}

// Boutons de la carte : 38 px, rayon 10 ; « Modifier » et « Atteint » encadrés (fond blanc sur la
// carte jaune), « Abandonné » et « Rendre principal » en texte.
const outlinedAction =
  "flex h-[38px] items-center gap-[7px] rounded-[10px] px-3.5 text-[13.5px] font-medium whitespace-nowrap text-text inset-ring inset-ring-line-2 transition-colors duration-150 hover:bg-surface-2";
const textAction =
  "flex h-[38px] items-center rounded-[10px] px-2.5 text-[13.5px] font-medium whitespace-nowrap transition-colors duration-150 hover:bg-surface-2/60";

function GoalCard({
  organizationId,
  athleteId,
  goal,
  today,
  hasMain,
}: {
  organizationId: string;
  athleteId: string;
  goal: GoalEntry;
  today: string;
  hasMain: boolean;
}) {
  const title = goalTitle(goal);
  const main = goal.priority === "main";
  const outlined = `${outlinedAction} ${main ? "bg-surface" : ""}`;

  return (
    // L'objectif principal est la seule carte jaune (maquette « Sportifs », page 2f).
    <article
      className={`flex flex-col gap-2.5 rounded-2xl p-[18px] ${
        main ? "bg-goal-main inset-ring inset-ring-goal-main-line" : "inset-ring inset-ring-line"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1.5">
          <p
            className={`text-[11.5px] leading-[14.5px] font-semibold tracking-[0.08em] uppercase ${
              main ? "text-violet-text" : "text-faint"
            }`}
          >
            Objectif {goalPriorityLabels[goal.priority]}
            {goal.competitionName ? " · Compétition" : ""}
          </p>
          <h3 className="text-[18px] leading-[22.5px] font-semibold tracking-[-0.015em] break-words">
            {title}
          </h3>
          <p className={`text-[13px] leading-[1.5] ${main ? "text-goal-main-text" : "text-muted"}`}>
            <DisciplineLabel goal={goal} />
            {goalDiscipline(goal.type) ? " · " : ""}
            {goalDetails(goal)}
          </p>
        </div>
        {goal.targetDate ? <Countdown today={today} targetDate={goal.targetDate} /> : null}
      </div>
      {goal.description ? (
        <p className="text-[14px] leading-[1.5] text-text-2">{goal.description}</p>
      ) : null}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <EditGoalButton
          organizationId={organizationId}
          athleteId={athleteId}
          goal={goal}
          title={title}
          today={today}
          otherMain={hasMain && goal.priority !== "main"}
          className={outlined}
        />
        <form action={setGoalStatus.bind(null, organizationId, athleteId, goal.id, "achieved")}>
          <button type="submit" aria-label={`Atteint : ${title}`} className={outlined}>
            Atteint
          </button>
        </form>
        <form action={setGoalStatus.bind(null, organizationId, athleteId, goal.id, "dropped")}>
          <button
            type="submit"
            aria-label={`Abandonné : ${title}`}
            className={`${textAction} text-text-2`}
          >
            Abandonné
          </button>
        </form>
        {goal.priority === "secondary" ? (
          <form action={makeGoalMain.bind(null, organizationId, athleteId, goal.id)}>
            <button
              type="submit"
              aria-label={`Rendre principal : ${title}`}
              className={`${textAction} text-violet-text`}
            >
              Rendre principal
            </button>
          </form>
        ) : null}
        <span aria-hidden className="flex-1" />
        <DeleteGoalButton
          organizationId={organizationId}
          athleteId={athleteId}
          goal={goal}
          className={main ? "text-goal-main-icon" : "text-faint"}
        />
      </div>
    </article>
  );
}

// Onglet « Objectifs » de la fiche (P2-02 partie 2), d'après la maquette « Sportifs » du 03/11/2026
// (page 2f) : la carte des objectifs (principal en jaune, secondaires, objectifs passés repliés),
// puis la carte « Ajouter un objectif ». Serveur : lit les objectifs, déjà filtrés par la RLS. Les
// compteurs (J-45) sont calculés depuis la date du jour à Bruxelles.
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
    <div className="flex flex-col gap-4">
      <section
        aria-labelledby="goals-title"
        className="flex min-w-0 flex-col gap-4 rounded-[20px] bg-surface p-[22px] inset-ring inset-ring-line-soft"
      >
        <div className="flex flex-col gap-1">
          <h2
            id="goals-title"
            className="text-[17px] leading-[21.5px] font-semibold tracking-[-0.01em]"
          >
            Objectifs et compétitions
          </h2>
          <p className="text-[13.5px] leading-[1.5] text-pretty text-muted">
            Ce que le sportif prépare. Un seul objectif principal à la fois ; un objectif atteint ou
            abandonné reste dans l&apos;historique.
          </p>
        </div>

        {current.length === 0 ? (
          <p
            role="status"
            className="rounded-2xl border border-dashed border-line-2 p-[18px] text-[14px] leading-[1.5] text-muted"
          >
            Aucun objectif en cours. Ajoute ce que le sportif prépare : une course, un Hyrox, de la
            force, une remise en forme…
          </p>
        ) : (
          <ul aria-label="Objectifs en cours" className="flex flex-col gap-4">
            {current.map((goal) => (
              <li key={goal.id}>
                <GoalCard
                  organizationId={organizationId}
                  athleteId={athleteId}
                  goal={goal}
                  today={today}
                  hasMain={hasMain}
                />
              </li>
            ))}
          </ul>
        )}

        {past.length > 0 ? (
          <details className="group rounded-[12px] inset-ring inset-ring-line">
            <summary className="flex h-[46px] cursor-pointer list-none items-center gap-2.5 rounded-[12px] px-3.5 text-[13.5px] font-medium text-text-2 transition-colors duration-150 hover:text-text [&::-webkit-details-marker]:hidden">
              <ChevronRight
                aria-hidden
                size={15}
                strokeWidth={2}
                className="shrink-0 text-muted transition-transform duration-200 group-open:rotate-90"
              />
              Objectifs passés ({past.length})
            </summary>
            <ul aria-label="Objectifs passés" className="flex flex-col border-t border-line">
              {past.map((goal) => (
                <li
                  key={goal.id}
                  className="flex items-center justify-between gap-3 border-b border-line py-2.5 pr-2 pl-3.5 last:border-b-0"
                >
                  <span className="flex min-w-0 flex-col gap-1">
                    <span className="flex flex-wrap items-center gap-1.5 text-[14px] font-medium">
                      <Badge tone={goal.status === "achieved" ? "ok" : "neutral"}>
                        {goalStatusLabels[goal.status]}
                      </Badge>
                      {goalTitle(goal)}
                    </span>
                    <span className="text-[12.5px] leading-[1.45] text-muted">
                      <DisciplineLabel goal={goal} />
                      {goalDiscipline(goal.type) ? " · " : ""}
                      {goalDetails(goal)}
                    </span>
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
      </section>

      <AddGoalForm
        organizationId={organizationId}
        athleteId={athleteId}
        today={today}
        hasMain={hasMain}
      />
    </div>
  );
}
