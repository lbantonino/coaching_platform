import { ChevronRight, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { deleteGoal } from "@/features/goals/actions";
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
import { GoalMenu } from "./goal-menu";

// Titre d'un objectif : le nom de la compétition s'il y en a une, sinon le type d'objectif.
function goalTitle(goal: GoalEntry): string {
  return goal.competitionName ?? goalTypeLabels[goal.type];
}

// Précisions d'un objectif : type (si le titre est un nom de compétition et que la discipline ne le
// dit pas déjà), catégorie Hyrox, lieu, temps visé.
function goalExtras(goal: GoalEntry): string[] {
  const discipline = goalDiscipline(goal.type);
  const typeLabel = goalTypeLabels[goal.type];
  return [
    goal.competitionName && (!discipline || disciplineLabels[discipline] !== typeLabel)
      ? typeLabel
      : null,
    goal.hyroxCategory ? `Catégorie ${hyroxCategoryLabels[goal.hyroxCategory]}` : null,
    goal.competitionLocation,
    goal.targetTimeSeconds ? `Temps visé ${formatRaceTime(goal.targetTimeSeconds)}` : null,
  ].filter((part): part is string => Boolean(part));
}

// Ligne de détails d'un objectif passé : précisions et date.
function goalDetails(goal: GoalEntry): string {
  return [...goalExtras(goal), goal.targetDate ? formatDate(goal.targetDate) : "Sans date"].join(
    " · ",
  );
}

// Discipline de l'objectif : son point de couleur et son nom (rien pour un objectif personnel).
function DisciplineLabel({ goal }: { goal: GoalEntry }) {
  const discipline = goalDiscipline(goal.type);
  return discipline ? (
    // La discipline : le mot dans sa couleur (16/11/2026 : plus de pastilles).
    <span className={`font-semibold ${disciplineStyles[discipline].text}`}>
      {disciplineLabels[discipline]}
    </span>
  ) : null;
}

// Compte à rebours en petit, après la discipline (choix d'Antonino du 03/11 au soir : plus de
// gros chiffre) : « dans 137 jours », « aujourd'hui », ou « date passée » (en ambre) pour un objectif
// en cours dont la date est dépassée.
function Countdown({ today, targetDate }: { today: string; targetDate: string }) {
  const days = daysBetween(today, targetDate);
  if (days < 0) return <span className="font-medium text-warn">date passée</span>;
  if (days === 0) return <span className="font-medium text-violet-text">aujourd&apos;hui</span>;
  return (
    <span className="font-medium whitespace-nowrap text-violet-text">
      dans {days} jour{days > 1 ? "s" : ""}
    </span>
  );
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
        className="grid size-[38px] place-items-center rounded-[10px] text-faint transition-colors duration-150 hover:bg-surface-2 hover:text-alert"
      >
        <Trash2 aria-hidden size={15} strokeWidth={1.8} />
      </button>
    </form>
  );
}

// Carte d'un objectif en cours, allégée (choix d'Antonino du 03/11 au soir, « Essentiel + menu ») :
// le titre, puis la discipline et le compte à rebours, puis la date et les précisions en gris ; toutes
// les actions dans le menu « ··· ». La carte jaune signale l'objectif principal (et le mot, pour les
// lecteurs d'écran). La description se lit dans « Modifier ».
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
  const details = [
    goal.targetDate ? formatDate(goal.targetDate) : null,
    ...goalExtras(goal),
  ].filter((part): part is string => Boolean(part));
  const discipline = goalDiscipline(goal.type);

  return (
    <article
      className={`flex items-start gap-3 rounded-2xl p-[18px] ${
        main ? "bg-goal-main inset-ring inset-ring-goal-main-line" : "inset-ring inset-ring-line"
      }`}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <h3 className="text-[16.5px] leading-[1.3] font-semibold tracking-[-0.01em] break-words">
          <span className="sr-only">{goalPriorityLabels[goal.priority]} : </span>
          {title}
        </h3>
        {/* Discipline et compte à rebours (ligne courte : elle tient sur un téléphone), puis la date
            et les précisions en gris. */}
        <p className="text-[13.5px] leading-[1.5] text-text-2">
          <DisciplineLabel goal={goal} />
          {discipline ? " · " : ""}
          {goal.targetDate ? <Countdown today={today} targetDate={goal.targetDate} /> : "sans date"}
        </p>
        {details.length > 0 ? (
          <p className={`text-[13px] leading-[1.5] ${main ? "text-goal-main-text" : "text-muted"}`}>
            {details.join(" · ")}
          </p>
        ) : null}
      </div>
      <GoalMenu
        organizationId={organizationId}
        athleteId={athleteId}
        goal={goal}
        title={title}
        // Kit (boîte 09) : « 20 mars 2027 · Catégorie Pro », sur une ligne ; le lieu et le temps
        // visé restent sur la carte.
        subtitle={
          [
            goal.targetDate ? formatDate(goal.targetDate) : null,
            goal.hyroxCategory ? `Catégorie ${hyroxCategoryLabels[goal.hyroxCategory]}` : null,
          ]
            .filter(Boolean)
            .join(" · ") || undefined
        }
        today={today}
        otherMain={hasMain && goal.priority !== "main"}
      />
    </article>
  );
}

// Onglet « Objectifs » de la fiche (P2-02 partie 2), d'après la maquette « Sportifs » du 03/11/2026
// (page 2f) : la carte des objectifs (principal en jaune, secondaires, objectifs passés repliés),
// puis la carte « Ajouter un objectif ». Serveur : lit les objectifs, déjà filtrés par la RLS. Les
// comptes à rebours sont calculés depuis la date du jour à Bruxelles.
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
