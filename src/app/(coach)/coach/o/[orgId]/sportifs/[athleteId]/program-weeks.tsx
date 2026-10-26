import { ChevronRight, Clock, Flag, ListChecks, Users } from "lucide-react";
import Link from "next/link";
import type { CSSProperties } from "react";

import { disciplineIcons } from "@/components/ui/discipline-icon";
import { disciplineLabels, disciplineStyles } from "@/domain/training/discipline";
import { sessionSummary } from "@/domain/training/program-session";
import type { AgendaItem } from "@/features/agenda/items";
import type { AthleteProgram, ProgramSessionCard, ProgramWeek } from "@/features/programs/queries";
import { formatDuration } from "@/features/sessions/schemas";
import { dayShortLabel } from "@/lib/format";

// Onglet « Agenda » quand le sportif a un programme (D-46, maquettes d'Antonino du 26/10) : le
// programme semaine par semaine, comme le tableur du coach. Une ligne par semaine, ses séances
// numérotées SANS jour : le sportif les fait dans l'ordre et aux jours qu'il choisit. Une séance faite
// AVEC le coach (withCoach) l'indique sur sa carte avec son rendez-vous (« Avec le coach · Mar 07:00 ») :
// elle compte dans les séances de la semaine. Sous la semaine : ses compétitions.
// Ordinateur : les séances d'une semaine côte à côte ; téléphone : l'une sous l'autre.

const dayMonth = new Intl.DateTimeFormat("fr-BE", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});
const utc = (day: string) => new Date(`${day}T00:00:00Z`);
const plural = (count: number, word: string) => `${count} ${word}${count > 1 ? "s" : ""}`;

export function weekRange(week: { monday: string; sunday: string }): string {
  return `Semaine du ${dayMonth.format(utc(week.monday))} au ${dayMonth.format(utc(week.sunday))}`;
}

// `coachSlot` : séance faite avec le coach (withCoach) ; son jour et son heure cette semaine
// (« Mar 07:00 »), ou null si le rendez-vous n'a pas lieu cette semaine-là.
function SessionCard({
  session,
  href,
  coachSlot,
}: {
  session: ProgramSessionCard;
  href: string;
  coachSlot: string | null | undefined;
}) {
  const { content } = session;
  const Icon = content.discipline ? disciplineIcons[content.discipline] : ListChecks;
  const styles = content.discipline ? disciplineStyles[content.discipline] : null;
  return (
    <Link
      href={href}
      className={`group flex w-full min-w-0 items-center gap-3 rounded-[14px] border p-3.5 transition-[filter] duration-150 hover:brightness-[.97] lg:flex-col lg:items-stretch lg:gap-2 ${
        styles ? styles.header : "border-line bg-bg"
      }`}
    >
      <span
        aria-hidden
        className={`inline-flex size-10 shrink-0 items-center justify-center rounded-full lg:hidden ${
          styles ? styles.icon : "border border-line-2 bg-chip text-muted"
        }`}
      >
        <Icon size={18} strokeWidth={2} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-1.5 text-[13px] text-muted">
            <Icon
              aria-hidden
              size={14}
              strokeWidth={2}
              className={`max-lg:hidden ${styles?.text ?? ""}`}
            />
            Séance {session.slotIndex}
          </span>
          {content.discipline ? (
            <span
              className={`rounded-pill px-2 py-0.5 text-[12px] font-medium ${styles?.icon ?? ""}`}
            >
              {disciplineLabels[content.discipline]}
            </span>
          ) : null}
        </span>
        <span className={`text-[16px] leading-snug font-semibold ${styles?.text ?? ""}`}>
          {content.title}
        </span>
        {coachSlot !== undefined ? (
          <span className="inline-flex w-fit items-center gap-1.5 rounded-pill bg-surface px-2 py-0.5 text-[12px] font-medium">
            <Users aria-hidden size={12} strokeWidth={2} />
            {coachSlot ? `Avec le coach · ${coachSlot}` : "Avec le coach"}
          </span>
        ) : null}
        <span className="flex flex-col text-[13px] leading-snug text-muted">
          {sessionSummary(content).map((line) => (
            <span key={line} className="truncate">
              {line}
            </span>
          ))}
        </span>
        <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-muted lg:mt-auto lg:pt-1">
          <span className="inline-flex items-center gap-1">
            <Clock aria-hidden size={13} strokeWidth={1.8} />
            {formatDuration(content.durationMinutes)}
          </span>
          <span className="inline-flex items-center gap-1">
            <ListChecks aria-hidden size={13} strokeWidth={1.8} />
            {content.sessionType}
          </span>
        </span>
      </span>
      <ChevronRight
        aria-hidden
        size={18}
        strokeWidth={1.8}
        className="shrink-0 text-muted lg:hidden"
      />
    </Link>
  );
}

// Sous la semaine : ses compétitions, et une séance avec le coach qui ne correspond à aucune séance
// du programme (rendez-vous en plus). Chaque ligne dit ce qu'elle est, avec son jour.
function WeekCoachItems({
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
  if (items.length === 0) return null;
  return (
    <ul aria-label="Compétitions et rendez-vous de la semaine" className="flex flex-wrap gap-2">
      {items.map((item) => (
        <li key={item.key}>
          <Link
            href={item.type === "session" ? `${agendaPath}/seances/${item.sessionId}` : goalsHref}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-pill border border-line bg-surface px-3 text-[13px] transition-colors duration-150 hover:bg-surface-2"
          >
            {item.type === "event" ? (
              <Flag aria-hidden size={13} strokeWidth={2} className="text-accent-text" />
            ) : (
              <Users aria-hidden size={13} strokeWidth={2} className="text-muted" />
            )}
            <span className="text-muted">
              {item.type === "event" ? "Compétition" : "Avec le coach, en plus"}
            </span>
            <span className="font-mono text-[12px] text-muted tabular">
              {dayShortLabel(item.date, today)}
              {item.type === "session" ? ` ${item.time}` : ""}
            </span>
            <span className="font-medium">{item.title}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function WeekCard({
  week,
  today,
  basePath,
  coachItems,
  agendaPath,
}: {
  week: ProgramWeek;
  today: string;
  basePath: string;
  coachItems: AgendaItem[];
  agendaPath: string;
}) {
  const current = today >= week.monday && today <= week.sunday;
  const count = week.sessions.length;
  // Séances du programme faites avec le coach : leur rendez-vous de la semaine (jour et heure).
  const coachSlots = new Map<string, string | null>();
  const linked = new Set<string>();
  for (const session of week.sessions) {
    const coachSessionId = session.content.withCoach?.sessionId;
    if (!coachSessionId) continue;
    const meeting = coachItems.find(
      (item) => item.type === "session" && item.sessionId === coachSessionId,
    );
    if (meeting) linked.add(meeting.key);
    coachSlots.set(
      session.id,
      meeting && meeting.type === "session"
        ? `${dayShortLabel(meeting.date, today)} ${meeting.time}`
        : null,
    );
  }
  const withCoach = coachSlots.size;
  const others = coachItems.filter((item) => !linked.has(item.key));
  return (
    <section
      aria-label={weekRange(week)}
      className={`flex flex-col gap-3 rounded-card border bg-surface p-4 ${
        current ? "border-accent" : "border-line"
      }`}
    >
      <header className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
        <div className="flex min-w-0 flex-col gap-0.5">
          <h3 className="text-[16px] font-semibold">{weekRange(week)}</h3>
          <p className="text-[13px] text-muted">
            {count === 0
              ? "Semaine de repos"
              : withCoach === 0
                ? `${plural(count, "séance")} à répartir librement sur la semaine`
                : `${plural(count, "séance")} : ${withCoach} avec le coach, ${count - withCoach} à placer librement`}
          </p>
        </div>
        <span className="flex flex-wrap items-center gap-1.5">
          {current ? (
            <span className="rounded-pill bg-accent-soft px-2.5 py-1 text-[12px] font-medium text-accent-text">
              Cette semaine
            </span>
          ) : null}
          <span className="rounded-pill bg-chip px-2.5 py-1 text-[12px] font-medium text-muted">
            Semaine {week.index}
            {week.label ? ` · ${week.label}` : ""}
          </span>
        </span>
      </header>
      {count > 0 ? (
        <ol
          aria-label={`Séances, ${weekRange(week).toLowerCase()}`}
          style={{ "--n": count } as CSSProperties}
          className="grid grid-cols-1 gap-2.5 lg:grid-cols-[repeat(var(--n),minmax(0,1fr))]"
        >
          {week.sessions.map((session) => (
            <li key={session.id} className="flex min-w-0">
              <SessionCard
                session={session}
                href={`${basePath}/programme/${session.id}`}
                coachSlot={coachSlots.has(session.id) ? coachSlots.get(session.id) : undefined}
              />
            </li>
          ))}
        </ol>
      ) : null}
      <WeekCoachItems
        items={others}
        today={today}
        agendaPath={agendaPath}
        goalsHref={`${basePath}?onglet=objectifs`}
      />
    </section>
  );
}

export function ProgramWeeksSection({
  name,
  program,
  today,
  basePath,
  agendaPath,
  coachItemsByMonday,
}: {
  name: string;
  program: AthleteProgram;
  today: string;
  basePath: string;
  agendaPath: string;
  coachItemsByMonday: Map<string, AgendaItem[]>;
}) {
  return (
    <section aria-labelledby="program-weeks-title" className="flex flex-col gap-3.5">
      <div className="flex flex-col gap-1">
        <h2 id="program-weeks-title" className="text-title font-medium">
          Programme hebdomadaire
        </h2>
        <p className="text-small text-muted">
          {program.title} · {plural(program.weeksCount, "semaine")}. Les séances n&apos;ont pas de
          jour : {name} les fait dans l&apos;ordre et aux jours de son choix.
        </p>
      </div>
      {program.weeks.map((week) => (
        <WeekCard
          key={week.index}
          week={week}
          today={today}
          basePath={basePath}
          coachItems={coachItemsByMonday.get(week.monday) ?? []}
          agendaPath={agendaPath}
        />
      ))}
    </section>
  );
}
