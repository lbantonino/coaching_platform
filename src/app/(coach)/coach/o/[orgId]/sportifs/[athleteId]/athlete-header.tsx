import {
  ChartNoAxesColumn,
  Clock,
  Flag,
  MessageCircle,
  Target,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { buttonClass } from "@/components/ui/button";
import { SexMark } from "@/components/ui/sex-mark";
import type { AthleteDetail } from "@/features/athletes/queries";
import {
  athleteLevelLabels,
  athleteStatusLabels,
  contactChannelLabels,
} from "@/features/athletes/schemas";
import type { GoalEntry } from "@/features/goals/queries";
import { disciplineStyles, type Discipline } from "@/domain/training/discipline";
import { goalDiscipline, goalTypeLabels } from "@/features/goals/schemas";
import { daysBetween, formatDate, formatDay } from "@/lib/format";

const statusTone = { active: "ok", paused: "warn", archived: "neutral" } as const;

// En-tête de la fiche : identité, statuts et action « Inviter ». Aplat sans dégradé, teinté par la
// discipline de l'objectif principal (D-24) : orange pour un Hyrox, bleu pour la course…
export function AthleteHeader({
  athlete,
  invitePath,
  discipline,
}: {
  athlete: AthleteDetail;
  invitePath: string;
  discipline: Discipline | null;
}) {
  const tint = discipline ? disciplineStyles[discipline] : null;
  return (
    <header
      className={`flex flex-col gap-5 rounded-card border p-5 md:flex-row md:items-center md:justify-between md:p-[22px] ${
        tint ? tint.header : "border-line bg-surface"
      }`}
    >
      <div className="flex min-w-0 items-center gap-4 md:gap-5">
        <Avatar
          name={athlete.displayName}
          size="lg"
          colorClass={tint?.avatar}
          photoPath={athlete.photoPath}
        />
        <div className="flex min-w-0 flex-col gap-2">
          <div className="flex items-center gap-3">
            <h1 className="font-display text-h2 font-medium break-words md:text-h1">
              {athlete.displayName}
            </h1>
            <SexMark sex={athlete.sex} />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={statusTone[athlete.status]}>{athleteStatusLabels[athlete.status]}</Badge>
            {athlete.level ? (
              <Badge>Niveau {athleteLevelLabels[athlete.level].toLowerCase()}</Badge>
            ) : null}
            <Badge tone={athlete.hasAccount ? "ok" : "neutral"}>
              {athlete.hasAccount ? "Compte activé" : "Sans compte"}
            </Badge>
            <span className="text-caption text-muted">
              Ajouté le {formatDay(athlete.createdAt)}
            </span>
          </div>
        </div>
      </div>
      {athlete.hasAccount || athlete.status === "archived" ? null : (
        <Link href={invitePath} className={buttonClass({ variant: "inverse", size: "md" })}>
          Inviter dans son espace
        </Link>
      )}
    </header>
  );
}

// Couleur de chaque chiffre clé (D-24, D-25) : icône dans un cercle bordé, et valeur dans la même couleur.
const figureColors = {
  neutral: { icon: "border border-line-2 bg-chip text-muted", text: "" },
  red: {
    icon: "border border-accent/50 bg-accent-soft text-accent-text",
    text: "text-accent-text",
  },
  blue: { icon: "border border-blue/50 bg-blue-soft text-blue", text: "text-blue" },
  amber: { icon: "border border-amber/50 bg-amber-soft text-amber", text: "text-amber" },
  green: { icon: "border border-green/50 bg-green-soft text-green", text: "text-green" },
} as const;

function KeyFigure({
  icon: Icon,
  color,
  label,
  value,
  filled,
  detail,
  href,
}: {
  icon: LucideIcon;
  color: { icon: string; text: string };
  label: string;
  value: ReactNode;
  // La valeur prend la couleur seulement si elle est renseignée (pas « Non renseigné »).
  filled: boolean;
  detail?: ReactNode;
  href?: string;
}) {
  const content = (
    <>
      <span className={`inline-flex size-9 items-center justify-center rounded-full ${color.icon}`}>
        <Icon aria-hidden size={16} strokeWidth={1.7} />
      </span>
      <span className="text-caption text-muted">{label}</span>
      <span
        className={`font-display text-[20px] leading-tight font-medium break-words ${filled ? color.text : ""}`}
      >
        {value}
      </span>
      {detail ? <span className="text-caption text-muted">{detail}</span> : null}
    </>
  );
  // Sur téléphone : cartes de largeur fixe dans un bandeau qui défile (on voit dépasser la suivante).
  const box = `flex w-[44%] min-w-36 shrink-0 snap-start flex-col gap-1.5 rounded-card border border-line bg-surface p-4 md:w-auto md:min-w-0`;
  return href ? (
    <Link href={href} scroll={false} className={`${box} transition-colors hover:bg-surface-2`}>
      {content}
    </Link>
  ) : (
    <div className={box}>{content}</div>
  );
}

function countdownText(days: number): string {
  if (days === 0) return "Aujourd'hui";
  if (days === 1) return "Demain";
  return `Dans ${days} jours`;
}

// Chiffres clés, tous calculés depuis la fiche et les objectifs (aucune valeur inventée).
// PROVISOIRES : en P6, ils deviendront des indicateurs de suivi (séances faites, dernier RPE, régularité).
export function KeyFigures({
  athlete,
  goals,
  today,
  basePath,
}: {
  athlete: AthleteDetail;
  goals: GoalEntry[];
  today: string;
  basePath: string;
}) {
  const main = goals.find((goal) => goal.priority === "main");
  const mainDiscipline = main ? goalDiscipline(main.type) : null;
  // Prochaine compétition : la plus proche parmi les objectifs en cours qui en sont une.
  const nextCompetition = goals
    .filter((goal) => goal.competitionName && goal.targetDate && goal.targetDate >= today)
    .sort((a, b) => (a.targetDate ?? "").localeCompare(b.targetDate ?? ""))[0];
  const goalsHref = `${basePath}?onglet=objectifs`;
  const empty = <span className="text-muted">Non renseigné</span>;

  return (
    <section
      aria-label="Chiffres clés"
      className="-mx-5 flex snap-x scroll-px-5 gap-3 overflow-x-auto px-5 pb-1 md:mx-0 md:grid md:grid-cols-3 md:overflow-visible md:px-0 md:pb-0 xl:grid-cols-5"
    >
      <KeyFigure
        icon={Target}
        color={mainDiscipline ? disciplineStyles[mainDiscipline] : figureColors.neutral}
        filled={Boolean(main)}
        label="Objectif principal"
        value={
          main ? (
            (main.competitionName ?? goalTypeLabels[main.type])
          ) : (
            <span className="text-muted">Aucun</span>
          )
        }
        detail={main ? (main.targetDate ? formatDate(main.targetDate) : "Sans date") : null}
        href={goalsHref}
      />
      <KeyFigure
        icon={ChartNoAxesColumn}
        color={figureColors.blue}
        filled={athlete.sessionsPerWeek !== null}
        label="Séances / semaine"
        value={athlete.sessionsPerWeek ?? empty}
        detail={athlete.sessionsPerWeek ? "souhaitées" : null}
      />
      <KeyFigure
        icon={Clock}
        color={figureColors.amber}
        filled={athlete.maxSessionMinutes !== null}
        label="Durée max / séance"
        value={athlete.maxSessionMinutes ? `${athlete.maxSessionMinutes} min` : empty}
      />
      <KeyFigure
        icon={Flag}
        color={figureColors.red}
        filled={Boolean(nextCompetition)}
        label="Prochaine compétition"
        value={
          nextCompetition?.targetDate ? (
            countdownText(daysBetween(today, nextCompetition.targetDate))
          ) : (
            <span className="text-muted">Aucune</span>
          )
        }
        detail={nextCompetition?.competitionName}
        href={goalsHref}
      />
      <KeyFigure
        icon={MessageCircle}
        color={figureColors.green}
        filled={athlete.preferredContact !== null}
        label="Canal préféré"
        value={athlete.preferredContact ? contactChannelLabels[athlete.preferredContact] : empty}
      />
    </section>
  );
}
