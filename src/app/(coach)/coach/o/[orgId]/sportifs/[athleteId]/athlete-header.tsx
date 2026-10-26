import {
  ChartNoAxesColumn,
  Clock,
  Flag,
  MessageCircle,
  Plus,
  Target,
  UserPen,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { buttonClass } from "@/components/ui/button";
import { SexMark } from "@/components/ui/sex-mark";
import { completionLabel, missingProfileInfo } from "@/features/athletes/completeness";
import type { AthleteDetail } from "@/features/athletes/queries";
import {
  athleteLevelLabels,
  athleteStatusLabels,
  contactChannelLabels,
} from "@/features/athletes/schemas";
import type { GoalEntry } from "@/features/goals/queries";
import { disciplineStyles } from "@/domain/training/discipline";
import { goalDiscipline, goalTypeLabels } from "@/features/goals/schemas";
import { daysBetween, formatDate, formatDay } from "@/lib/format";

import { AthleteFicheMenu } from "./athlete-fiche-menu";

const statusTone = { active: "ok", paused: "warn", archived: "neutral" } as const;

// En-tête de la fiche (prompt Claude Design §7.2) : retour vers la liste, nom et repère ♀ / ♂,
// statut, niveau ; rouge « Créer un programme » (cœur de Coory : on crée un programme depuis le
// sportif ; tant que le module n'existe pas, le bouton ouvre la page Programmes), « Inviter dans son
// espace » sur ordinateur, et « ••• » avec les mêmes actions que la liste (demande du 26/10).
// L'accès à son espace n'est plus écrit en toutes lettres (comme dans la liste, D-39).
export function AthleteHeader({
  athlete,
  organizationId,
  listPath,
  invitePath,
}: {
  athlete: AthleteDetail;
  organizationId: string;
  listPath: string;
  invitePath: string;
}) {
  const missing = missingProfileInfo(athlete);
  return (
    <PageHeader
      back={{ href: listPath, label: "Sportifs" }}
      title={athlete.displayName}
      titleAside={<SexMark sex={athlete.sex} />}
      subtitle={
        <span className="flex flex-wrap items-center gap-2">
          <Badge tone={statusTone[athlete.status]}>{athleteStatusLabels[athlete.status]}</Badge>
          {/* Fiche créée d'un simple nom (D-35) : la pastille mène à l'onglet Profil. */}
          {missing.length > 0 ? (
            <Link
              href={`${listPath}/${athlete.id}?onglet=profil`}
              scroll={false}
              title={completionLabel(missing)}
              className="inline-flex items-center gap-1.5 rounded-pill bg-warn-soft px-2.5 py-1 text-[12px] leading-[1.3] font-medium whitespace-nowrap text-warn transition-[filter] duration-150 hover:brightness-95"
            >
              <UserPen aria-hidden size={13} strokeWidth={2} />
              Fiche à compléter
            </Link>
          ) : null}
          {athlete.level ? (
            <Badge>Niveau {athleteLevelLabels[athlete.level].toLowerCase()}</Badge>
          ) : null}
          <span className="text-[13px] text-muted">Ajouté le {formatDay(athlete.createdAt)}</span>
        </span>
      }
      actions={
        // Un seul conteneur : sur téléphone, le bouton rouge prend la place et « ••• » garde sa taille.
        <div className="flex items-center gap-2">
          {athlete.hasAccount || athlete.status === "archived" ? null : (
            <Link
              href={invitePath}
              className={buttonClass({ variant: "outline", className: "max-lg:hidden" })}
            >
              Inviter dans son espace
            </Link>
          )}
          <Link href="/coach/programmes" className={buttonClass({ className: "max-lg:flex-1" })}>
            <Plus aria-hidden size={16} strokeWidth={2} />
            Créer un programme
          </Link>
          <AthleteFicheMenu
            organizationId={organizationId}
            athlete={{
              id: athlete.id,
              name: athlete.displayName,
              status: athlete.status,
              programType: athlete.programType,
              hasAccount: athlete.hasAccount,
            }}
            basePath={`${listPath}/${athlete.id}`}
          />
        </div>
      }
    />
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
      className="-mx-4 flex snap-x scroll-px-4 gap-3 overflow-x-auto px-4 pb-1 md:mx-0 md:grid md:grid-cols-3 md:overflow-visible md:px-0 md:pb-0 xl:grid-cols-5"
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
