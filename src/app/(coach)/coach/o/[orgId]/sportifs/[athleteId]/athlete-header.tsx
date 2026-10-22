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
import type { AthleteDetail } from "@/features/athletes/queries";
import {
  athleteLevelLabels,
  athleteStatusLabels,
  contactChannelLabels,
} from "@/features/athletes/schemas";
import type { GoalEntry } from "@/features/goals/queries";
import { goalTypeLabels } from "@/features/goals/schemas";
import { daysBetween, formatDate, formatDay } from "@/lib/format";

const statusTone = { active: "ok", paused: "warn", archived: "neutral" } as const;

// En-tête de la fiche : identité, statuts et action « Inviter ». Aplat, sans dégradé (design system).
export function AthleteHeader({
  athlete,
  invitePath,
}: {
  athlete: AthleteDetail;
  invitePath: string;
}) {
  return (
    <header className="flex flex-col gap-5 rounded-card border border-line bg-surface p-5 md:flex-row md:items-center md:justify-between md:p-[22px]">
      <div className="flex min-w-0 items-center gap-4 md:gap-5">
        <Avatar name={athlete.displayName} size="lg" />
        <div className="flex min-w-0 flex-col gap-2">
          <h1 className="font-display text-h2 font-medium break-words md:text-h1">
            {athlete.displayName}
          </h1>
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

function KeyFigure({
  icon: Icon,
  label,
  value,
  detail,
  href,
  className = "",
}: {
  icon: LucideIcon;
  label: string;
  value: ReactNode;
  detail?: ReactNode;
  href?: string;
  className?: string;
}) {
  const content = (
    <>
      <Icon aria-hidden size={17} strokeWidth={1.7} className="text-muted" />
      <span className="text-caption text-muted">{label}</span>
      <span className="font-display text-[20px] leading-tight font-medium break-words">
        {value}
      </span>
      {detail ? <span className="text-caption text-muted">{detail}</span> : null}
    </>
  );
  const box = `flex flex-col gap-1.5 rounded-card border border-line bg-surface p-4 ${className}`;
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
  // Prochaine compétition : la plus proche parmi les objectifs en cours qui en sont une.
  const nextCompetition = goals
    .filter((goal) => goal.competitionName && goal.targetDate && goal.targetDate >= today)
    .sort((a, b) => (a.targetDate ?? "").localeCompare(b.targetDate ?? ""))[0];
  const goalsHref = `${basePath}?onglet=objectifs`;
  const empty = <span className="text-muted">Non renseigné</span>;

  return (
    <section
      aria-label="Chiffres clés"
      className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5"
    >
      <KeyFigure
        icon={Target}
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
        className="col-span-2 md:col-span-1"
      />
      <KeyFigure
        icon={ChartNoAxesColumn}
        label="Séances / semaine"
        value={athlete.sessionsPerWeek ?? empty}
        detail={athlete.sessionsPerWeek ? "souhaitées" : null}
      />
      <KeyFigure
        icon={Clock}
        label="Durée max / séance"
        value={athlete.maxSessionMinutes ? `${athlete.maxSessionMinutes} min` : empty}
      />
      <KeyFigure
        icon={Flag}
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
        label="Canal préféré"
        value={athlete.preferredContact ? contactChannelLabels[athlete.preferredContact] : empty}
      />
    </section>
  );
}
