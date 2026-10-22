import {
  CalendarDays,
  ChartNoAxesColumn,
  Clock,
  Dumbbell,
  FileText,
  Gauge,
  HeartPulse,
  Mail,
  MapPin,
  MessageCircle,
  Pencil,
  Phone,
  Target,
  User,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { buttonClass } from "@/components/ui/button";
import type { AthleteDetail } from "@/features/athletes/queries";
import {
  athleteLevelLabels,
  contactChannelLabels,
  trainingPlaceLabels,
  WEEK_DAYS,
  weekDayLabels,
} from "@/features/athletes/schemas";
import { goalCountdown } from "@/features/goals/format";
import type { GoalEntry } from "@/features/goals/queries";
import { goalPriorityLabels, goalTypeLabels, hyroxCategoryLabels } from "@/features/goals/schemas";
import { formatReferenceDetail, formatReferenceValue } from "@/features/references/format";
import type { ReferenceEntry } from "@/features/references/queries";
import { referenceKindLabels, referenceSourceLabels } from "@/features/references/schemas";
import { formatDate } from "@/lib/format";

// Vue d'ensemble de la fiche (P2-04) : tout en LECTURE. « Modifier » ouvre l'onglet qui contient le formulaire.

function OverviewCard({
  id,
  title,
  icon: Icon,
  editHref,
  children,
}: {
  id: string;
  title: string;
  icon: LucideIcon;
  editHref: string;
  children: ReactNode;
}) {
  return (
    <section
      aria-labelledby={id}
      className="flex flex-col gap-4 rounded-card border border-line bg-surface p-5 md:p-[22px]"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 id={id} className="flex items-center gap-2.5 text-title font-medium">
          <Icon aria-hidden size={17} strokeWidth={1.7} className="text-muted" />
          {title}
        </h2>
        <Link
          href={editHref}
          scroll={false}
          aria-label={`Modifier : ${title}`}
          className={buttonClass({ variant: "outline", size: "sm" })}
        >
          <Pencil aria-hidden size={13} strokeWidth={1.7} />
          Modifier
        </Link>
      </div>
      {children}
    </section>
  );
}

const missing = <span className="text-muted">Non renseigné</span>;

function Row({
  icon: Icon,
  label,
  children,
}: {
  icon: LucideIcon;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-4">
      <dt className="flex shrink-0 items-center gap-2 text-muted sm:w-48">
        <Icon aria-hidden size={15} strokeWidth={1.7} />
        {label}
      </dt>
      <dd className="min-w-0 break-words">{children}</dd>
    </div>
  );
}

function ProfileCard({ athlete, editHref }: { athlete: AthleteDetail; editHref: string }) {
  return (
    <OverviewCard id="overview-profile" title="Profil du sportif" icon={User} editHref={editHref}>
      <dl className="flex flex-col gap-3 text-small">
        <Row icon={User} label="Nom complet">
          {athlete.displayName}
        </Row>
        <Row icon={Mail} label="Adresse e-mail">
          {athlete.email ?? missing}
        </Row>
        <Row icon={Phone} label="Téléphone">
          {athlete.phone ? <span className="font-mono">{athlete.phone}</span> : missing}
        </Row>
        <Row icon={MessageCircle} label="Canal préféré">
          {athlete.preferredContact ? contactChannelLabels[athlete.preferredContact] : missing}
        </Row>
      </dl>
      <dl className="flex flex-col gap-3 border-t border-line pt-4 text-small">
        <Row icon={Gauge} label="Niveau">
          {athlete.level ? <Badge tone="ok">{athleteLevelLabels[athlete.level]}</Badge> : missing}
        </Row>
        <Row icon={FileText} label="Expérience">
          {athlete.experience ?? missing}
        </Row>
        <Row icon={MapPin} label="Lieux d'entraînement">
          {athlete.trainingPlaces.length > 0
            ? athlete.trainingPlaces.map((place) => trainingPlaceLabels[place]).join(", ")
            : missing}
        </Row>
        <Row icon={Dumbbell} label="Matériel disponible">
          {athlete.equipment ?? missing}
        </Row>
      </dl>
    </OverviewCard>
  );
}

function GoalCard({
  goals,
  today,
  editHref,
}: {
  goals: GoalEntry[];
  today: string;
  editHref: string;
}) {
  // Objectif affiché : le principal, sinon le premier objectif en cours.
  const goal = goals.find((entry) => entry.priority === "main") ?? goals[0];
  const others = goals.length - (goal ? 1 : 0);
  const countdown = goal?.targetDate ? goalCountdown(today, goal.targetDate) : null;

  return (
    <OverviewCard id="overview-goal" title="Objectif actuel" icon={Target} editHref={editHref}>
      {goal ? (
        <div className="flex flex-col gap-3 rounded-[14px] border border-line bg-bg p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 flex-col gap-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={goal.priority === "main" ? "live" : "neutral"}>
                  {goalPriorityLabels[goal.priority]}
                </Badge>
                {goal.competitionName ? <Badge>Compétition</Badge> : null}
                {countdown?.overdue ? <Badge tone="warn">{countdown.label}</Badge> : null}
              </div>
              <h3 className="font-display text-h3 font-medium break-words">
                {goal.competitionName ?? goalTypeLabels[goal.type]}
              </h3>
              <p className="flex items-center gap-2 text-small text-muted">
                <CalendarDays aria-hidden size={15} strokeWidth={1.7} />
                {goal.targetDate ? formatDate(goal.targetDate) : "Sans date"}
              </p>
              <p className="text-small text-muted">
                {[
                  goal.competitionName ? goalTypeLabels[goal.type] : null,
                  goal.hyroxCategory
                    ? `Catégorie ${hyroxCategoryLabels[goal.hyroxCategory]}`
                    : null,
                  goal.competitionLocation,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </div>
            {countdown && !countdown.overdue ? (
              <span className="shrink-0 rounded-md border border-line px-3 py-2 font-mono text-small font-medium tabular">
                {countdown.label}
              </span>
            ) : null}
          </div>
          {goal.description ? <p className="text-small">{goal.description}</p> : null}
        </div>
      ) : (
        <p className="text-small text-muted">
          Aucun objectif en cours.{" "}
          <Link href={editHref} scroll={false} className="text-text underline underline-offset-4">
            Ajouter un objectif
          </Link>
        </p>
      )}
      {others > 0 ? (
        <Link
          href={editHref}
          scroll={false}
          className="w-fit text-small text-muted underline underline-offset-4 hover:text-text"
        >
          {others === 1 ? "1 autre objectif en cours" : `${others} autres objectifs en cours`}
        </Link>
      ) : null}
    </OverviewCard>
  );
}

function AvailabilityCard({ athlete, editHref }: { athlete: AthleteDetail; editHref: string }) {
  return (
    <OverviewCard
      id="overview-availability"
      title="Disponibilités & contraintes"
      icon={Clock}
      editHref={editHref}
    >
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1 rounded-[14px] border border-line bg-bg p-4">
          <span className="text-caption text-muted">Séances par semaine</span>
          <span className="font-display text-h3 font-medium">{athlete.sessionsPerWeek ?? "–"}</span>
        </div>
        <div className="flex flex-col gap-1 rounded-[14px] border border-line bg-bg p-4">
          <span className="text-caption text-muted">Durée maximale d&apos;une séance</span>
          <span className="font-display text-h3 font-medium">
            {athlete.maxSessionMinutes ? `${athlete.maxSessionMinutes} min` : "–"}
          </span>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-small font-medium">Jours disponibles</span>
        <ul aria-label="Jours disponibles" className="flex flex-wrap gap-2">
          {WEEK_DAYS.map((day) => {
            const available = athlete.availableDays.includes(day);
            return (
              <li
                key={day}
                className={`rounded-pill border px-3 py-1 text-caption ${
                  available ? "border-inv bg-inv text-on-inv" : "border-line text-faint"
                }`}
              >
                {weekDayLabels[day]}
                <span className="sr-only">{available ? " : disponible" : " : indisponible"}</span>
              </li>
            );
          })}
        </ul>
      </div>
      <dl className="flex flex-col gap-3 text-small">
        <Row icon={CalendarDays} label="Contraintes d'organisation">
          {athlete.scheduleConstraints ?? missing}
        </Row>
        <Row icon={HeartPulse} label="Contraintes physiques">
          {athlete.healthConsentAt === null ? (
            <span className="text-muted">Pas d&apos;accord du sportif : rien n&apos;est noté.</span>
          ) : (
            (athlete.healthConstraints ?? <span className="text-muted">Rien de noté.</span>)
          )}
        </Row>
      </dl>
    </OverviewCard>
  );
}

function ReferencesCard({
  references,
  editHref,
}: {
  references: ReferenceEntry[];
  editHref: string;
}) {
  // Quatre repères au plus dans la vue d'ensemble ; tous sont dans l'onglet Repères.
  const shown = references.slice(0, 4);
  return (
    <OverviewCard
      id="overview-references"
      title="Repères & mesures"
      icon={ChartNoAxesColumn}
      editHref={editHref}
    >
      {shown.length === 0 ? (
        <p className="text-small text-muted">Aucun repère pour l&apos;instant.</p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {shown.map((entry) => {
            const detail = formatReferenceDetail(entry);
            return (
              <li
                key={entry.id}
                className="flex flex-col gap-1 rounded-[14px] border border-line bg-bg p-4"
              >
                <span className="text-caption text-muted">{referenceKindLabels[entry.kind]}</span>
                <span className="font-mono text-title font-medium tabular">
                  {formatReferenceValue(entry)}
                </span>
                <span className="text-caption text-muted">
                  {detail ? `${detail} · ` : ""}
                  {referenceSourceLabels[entry.source]} · {formatDate(entry.measuredOn)}
                </span>
              </li>
            );
          })}
        </ul>
      )}
      {references.length > shown.length ? (
        <Link
          href={editHref}
          scroll={false}
          className="w-fit text-small text-muted underline underline-offset-4 hover:text-text"
        >
          Voir les {references.length} repères
        </Link>
      ) : null}
    </OverviewCard>
  );
}

export function AthleteOverview({
  athlete,
  goals,
  references,
  today,
  basePath,
}: {
  athlete: AthleteDetail;
  goals: GoalEntry[];
  references: ReferenceEntry[];
  today: string;
  basePath: string;
}) {
  return (
    <div className="grid gap-[14px] lg:grid-cols-2">
      <ProfileCard athlete={athlete} editHref={`${basePath}?onglet=profil`} />
      <GoalCard goals={goals} today={today} editHref={`${basePath}?onglet=objectifs`} />
      <AvailabilityCard athlete={athlete} editHref={`${basePath}?onglet=disponibilites`} />
      <ReferencesCard references={references} editHref={`${basePath}?onglet=reperes`} />
    </div>
  );
}
