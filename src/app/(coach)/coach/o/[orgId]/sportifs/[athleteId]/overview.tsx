import {
  CalendarDays,
  ChartNoAxesColumn,
  Clock,
  Dumbbell,
  FileText,
  Flag,
  Gauge,
  HeartPulse,
  Mail,
  History,
  MapPin,
  NotebookPen,
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
import { SexMark } from "@/components/ui/sex-mark";
import type { ActivityEvent } from "@/features/activity/build";
import type { AgendaItem } from "@/features/agenda/items";
import type { AthleteDetail } from "@/features/athletes/queries";
import {
  athleteLevelLabels,
  sexLabels,
  trainingPlaceLabels,
  WEEK_DAYS,
  weekDayLabels,
} from "@/features/athletes/schemas";
import { goalCountdown } from "@/features/goals/format";
import type { GoalEntry } from "@/features/goals/queries";
import type { AthleteNotes } from "@/features/notes/queries";
import { disciplineStyles } from "@/domain/training/discipline";
import {
  goalDiscipline,
  goalPriorityLabels,
  goalTypeLabels,
  hyroxCategoryLabels,
} from "@/features/goals/schemas";
import { formatRaceTime } from "@/features/records/schemas";
import type { ReferenceEntry } from "@/features/references/queries";
import { dayShortLabel, formatDate, formatDateTime } from "@/lib/format";

import { ActivityTimeline } from "./activity-timeline";
import { GoalDisciplineBadge } from "./goal-discipline-badge";
import { ReferenceTile } from "./reference-tile";

// Vue d'ensemble de la fiche (P2-04) : tout en LECTURE. « Modifier » ouvre l'onglet qui contient le formulaire.
// Pas de doublon avec les chiffres clés du haut (séances, durée, canal) : ils sont déjà visibles sur toute la fiche.

function OverviewCard({
  id,
  title,
  icon: Icon,
  editHref,
  actionLabel = "Modifier",
  children,
}: {
  id: string;
  title: string;
  icon: LucideIcon;
  editHref: string;
  actionLabel?: string;
  children: ReactNode;
}) {
  return (
    <section
      aria-labelledby={id}
      className="flex flex-col gap-4 rounded-card border border-line bg-surface p-5 md:p-[22px]"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 id={id} className="flex items-center gap-2.5 text-title font-medium">
          <Icon aria-hidden size={17} strokeWidth={1.7} className="text-accent-text" />
          {title}
        </h2>
        <Link
          href={editHref}
          scroll={false}
          aria-label={`${actionLabel} : ${title}`}
          className={buttonClass({ variant: "outline", size: "sm" })}
        >
          {actionLabel === "Modifier" ? <Pencil aria-hidden size={13} strokeWidth={1.7} /> : null}
          {actionLabel}
        </Link>
      </div>
      {children}
    </section>
  );
}

const missing = <span className="text-faint">Non renseigné</span>;

// Une information de la fiche. Téléphone (demande d'Antonino du 26/10, comme le prototype) : une
// ligne par information, séparée par un filet, libellé gris au-dessus, valeur lisible en dessous.
// Ordinateur : libellé à gauche (avec son icône), valeur à droite.
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
    <div className="flex flex-col gap-1 border-t border-line py-3 first:border-t-0 first:pt-0 last:pb-0 sm:flex-row sm:gap-4 sm:border-t-0 sm:py-0">
      <dt className="flex shrink-0 items-center gap-2 text-[13px] text-muted sm:w-48 sm:text-small">
        <Icon aria-hidden size={15} strokeWidth={1.7} className="max-sm:hidden" />
        {label}
      </dt>
      <dd className="min-w-0 text-[15px] leading-snug break-words sm:text-small">{children}</dd>
    </div>
  );
}

// Prochaines séances (demande d'Antonino du 26/10) : ce que le sportif a avec le coach dans les
// 30 jours (séances individuelles et collectives où il est inscrit) et ses compétitions à venir.
// « Aujourd'hui » ressort. Les séances de ses programmes s'y ajouteront avec l'espace sportif (P6).
function UpcomingCard({
  items,
  today,
  agendaPath,
  goalsHref,
}: {
  items: AgendaItem[];
  today: string;
  agendaPath: string;
  goalsHref: string;
}) {
  return (
    <OverviewCard
      id="overview-upcoming"
      title="Prochaines séances"
      icon={CalendarDays}
      editHref={agendaPath}
      actionLabel="Agenda"
    >
      {items.length === 0 ? (
        <p className="text-small text-muted">
          Rien de prévu avec ce sportif dans les 30 prochains jours.
        </p>
      ) : (
        <ul aria-label="Prochaines séances du sportif" className="flex flex-col">
          {items.map((item) => {
            const isToday = item.date === today;
            return (
              <li key={item.key} className="border-t border-line first:border-t-0">
                <Link
                  href={
                    item.type === "session" ? `${agendaPath}/seances/${item.sessionId}` : goalsHref
                  }
                  scroll={item.type === "session"}
                  className={`-mx-2 flex min-h-[52px] items-center gap-3 rounded-[10px] px-2 py-2.5 transition-colors duration-150 hover:bg-surface-2 ${
                    isToday ? "bg-accent-soft" : ""
                  }`}
                >
                  <span className="flex w-[92px] shrink-0 flex-col font-mono text-[12px] leading-tight tabular">
                    <span className={isToday ? "font-medium text-accent-text" : "text-muted"}>
                      {dayShortLabel(item.date, today)}
                    </span>
                    <span className="text-[14px] font-medium">
                      {item.type === "session" ? item.time : "Journée"}
                    </span>
                  </span>
                  <span className="flex min-w-0 flex-col">
                    <span className="flex min-w-0 items-center gap-1.5 font-medium">
                      {item.type === "event" ? (
                        <Flag
                          aria-hidden
                          size={14}
                          strokeWidth={2}
                          className="shrink-0 text-accent-text"
                        />
                      ) : null}
                      <span className="truncate">{item.title}</span>
                    </span>
                    <span className="truncate text-[13px] text-muted">
                      {item.type === "event"
                        ? `Compétition · ${item.detail}`
                        : item.individual
                          ? item.detail
                          : `Collective · ${item.detail}`}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </OverviewCard>
  );
}

function ProfileCard({ athlete, editHref }: { athlete: AthleteDetail; editHref: string }) {
  return (
    <OverviewCard id="overview-profile" title="Profil du sportif" icon={User} editHref={editHref}>
      <dl className="flex flex-col text-small sm:gap-3">
        <Row icon={User} label="Nom complet">
          {athlete.displayName}
        </Row>
        <Row icon={User} label="Sexe">
          {athlete.sex ? (
            <span className="inline-flex items-center gap-2">
              <SexMark sex={athlete.sex} size="sm" />
              {sexLabels[athlete.sex]}
            </span>
          ) : (
            missing
          )}
        </Row>
        <Row icon={Mail} label="Adresse e-mail">
          {athlete.email ?? missing}
        </Row>
        <Row icon={Phone} label="Téléphone">
          {athlete.phone ? <span className="font-mono">{athlete.phone}</span> : missing}
        </Row>
      </dl>
      <dl className="flex flex-col border-t border-line pt-4 text-small sm:gap-3">
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
  // Cadre à la couleur de la discipline de l'objectif (D-24, D-25).
  const discipline = goal ? goalDiscipline(goal.type) : null;

  return (
    <OverviewCard id="overview-goal" title="Objectif actuel" icon={Target} editHref={editHref}>
      {goal ? (
        <div
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
                  goal.targetTimeSeconds
                    ? `Temps visé ${formatRaceTime(goal.targetTimeSeconds)}`
                    : null,
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
      <dl className="flex flex-col text-small sm:gap-3">
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
          {shown.map((entry) => (
            <ReferenceTile key={entry.id} entry={entry} size="compact" />
          ))}
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

function NotesCard({ notes, editHref }: { notes: AthleteNotes; editHref: string }) {
  return (
    <OverviewCard id="overview-notes" title="Notes du coach" icon={NotebookPen} editHref={editHref}>
      {notes.coach ? (
        <div className="flex flex-col gap-1.5 rounded-[14px] border border-line bg-bg p-4">
          <p className="text-small whitespace-pre-line">{notes.coach.body}</p>
          <p className="text-caption text-faint">
            Note privée · mise à jour le {formatDateTime(notes.coach.updatedAt)}
          </p>
        </div>
      ) : (
        <p className="text-small text-muted">Aucune note privée.</p>
      )}
      {notes.athlete ? (
        <div className="flex flex-col gap-1.5 rounded-[14px] border border-line bg-bg p-4">
          <Badge tone="live">Visible par le sportif</Badge>
          <p className="text-small whitespace-pre-line">{notes.athlete.body}</p>
          <p className="text-caption text-faint">
            Mis à jour le {formatDateTime(notes.athlete.updatedAt)}
          </p>
        </div>
      ) : null}
    </OverviewCard>
  );
}

// Les 5 derniers événements ; l'onglet Historique montre tout.
function ActivityCard({ events, allHref }: { events: ActivityEvent[]; allHref: string }) {
  return (
    <OverviewCard
      id="overview-activity"
      title="Historique récent"
      icon={History}
      editHref={allHref}
      actionLabel="Voir tout"
    >
      <ActivityTimeline events={events.slice(0, 5)} label="Derniers événements" />
    </OverviewCard>
  );
}

export function AthleteOverview({
  athlete,
  goals,
  references,
  notes,
  activity,
  upcoming,
  agendaPath,
  today,
  basePath,
}: {
  athlete: AthleteDetail;
  goals: GoalEntry[];
  references: ReferenceEntry[];
  notes: AthleteNotes;
  activity: ActivityEvent[];
  upcoming: AgendaItem[];
  agendaPath: string;
  today: string;
  basePath: string;
}) {
  // Ordre de la maquette : à gauche Profil, Disponibilités, Notes ; à droite Objectif, Repères, Historique.
  return (
    <div className="grid grid-cols-1 gap-[14px] lg:grid-cols-2">
      {/* En premier : ce que le sportif a à faire aujourd'hui et dans les prochains jours. */}
      <UpcomingCard
        items={upcoming}
        today={today}
        agendaPath={agendaPath}
        goalsHref={`${basePath}?onglet=objectifs`}
      />
      <ProfileCard athlete={athlete} editHref={`${basePath}?onglet=profil`} />
      <GoalCard goals={goals} today={today} editHref={`${basePath}?onglet=objectifs`} />
      <AvailabilityCard athlete={athlete} editHref={`${basePath}?onglet=disponibilites`} />
      <ReferencesCard references={references} editHref={`${basePath}?onglet=reperes`} />
      <NotesCard notes={notes} editHref={`${basePath}?onglet=notes`} />
      <ActivityCard events={activity} allHref={`${basePath}?onglet=historique`} />
    </div>
  );
}
