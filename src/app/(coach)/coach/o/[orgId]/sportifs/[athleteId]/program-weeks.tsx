import { ChevronLeft, ChevronRight, Flag, ListOrdered, UserRound, Users } from "lucide-react";
import Link from "next/link";
import type { CSSProperties } from "react";

import { disciplineLabels, disciplineStyles } from "@/domain/training/discipline";
import type { AgendaItem } from "@/features/agenda/items";
import type { AthleteProgram, ProgramSessionCard, ProgramWeek } from "@/features/programs/queries";
import { dayShortLabel } from "@/lib/format";

import { WeekPicker } from "./week-picker";

// Onglet « Agenda » quand le sportif a un programme (D-46), d'après la maquette « Sportifs » du
// 03/11/2026 (page 2c). En haut, le programme (durée, dates, rythme) et sa règle : les séances n'ont
// pas de jour, le sportif les fait dans l'ordre, aux jours qu'il choisit ; seules celles faites AVEC
// le coach (withCoach) ont une date, écrite sur leur carte. Puis deux vues : une semaine à la fois
// (‹ › et le menu des semaines ; un bandeau ramène à la semaine actuelle) ou toutes les semaines.
// Ordinateur : les séances d'une semaine côte à côte ; téléphone : l'une sous l'autre. Sous la
// semaine : ses compétitions et les rendez-vous en plus.

export type ProgramView = "semaine" | "toutes";

const dayMonth = new Intl.DateTimeFormat("fr-BE", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});
const weekdayDayMonth = new Intl.DateTimeFormat("fr-BE", {
  weekday: "short",
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});
const utc = (day: string) => new Date(`${day}T00:00:00Z`);
const plural = (count: number, word: string) => `${count} ${word}${count > 1 ? "s" : ""}`;
// « d'Inès », « de Julien ».
const ofName = (name: string) =>
  /^[aeiouyhàâéèêëîïôöûü]/i.test(name) ? `d'${name}` : `de ${name}`;

// Jour d'une compétition : « Sam 12 déc. ».
function competitionDay(day: string): string {
  const text = weekdayDayMonth.format(utc(day)).replace(".", "");
  return text.charAt(0).toUpperCase() + text.slice(1);
}

// Une séance du programme. `coachSlot` : séance faite avec le coach (withCoach) ; son jour et son
// heure cette semaine (« Aujourd'hui · 07:00 »), ou null si le rendez-vous n'a pas lieu cette
// semaine-là. Ordinateur : une carte en colonne (numéro, titre, discipline · type, rendez-vous en
// bas) ; téléphone : une ligne (numéro à gauche). Écrite une fois, placée selon l'écran.
function SessionCard({
  session,
  href,
  coachSlot,
  coachToday,
}: {
  session: ProgramSessionCard;
  href: string;
  coachSlot: string | null | undefined;
  coachToday: boolean;
}) {
  const { content } = session;
  const styles = content.discipline ? disciplineStyles[content.discipline] : null;
  return (
    <Link
      href={href}
      className={`flex w-full min-w-0 items-center gap-3.5 rounded-[14px] p-4 transition-[filter] duration-150 hover:brightness-[.97] active:brightness-[.92] active:duration-0 lg:flex-col lg:items-stretch lg:gap-2 lg:p-3.5 ${
        styles ? styles.tint : "bg-surface-2"
      }`}
    >
      <span
        aria-hidden
        className={`grid size-[30px] shrink-0 place-items-center rounded-full text-[12.5px] font-bold lg:size-[26px] ${
          styles ? styles.number : "bg-chip text-muted"
        }`}
      >
        {session.slotIndex}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5 lg:contents">
        <span className="text-[15px] leading-[1.3] font-semibold [overflow-wrap:anywhere] text-text lg:text-[14.5px]">
          <span className="sr-only">Séance {session.slotIndex} : </span>
          {content.title}
        </span>
        <span className="text-[12.5px] leading-4 text-text-2 lg:leading-[1.4]">
          {content.discipline ? (
            <>
              <span className={`lg:font-semibold ${styles?.text ?? ""} max-lg:text-text-2`}>
                {disciplineLabels[content.discipline]}
              </span>
              {" · "}
            </>
          ) : null}
          {content.sessionType}
        </span>
        {coachSlot !== undefined ? (
          // « Avec le coach · … » sur téléphone, « Coach · … » sur ordinateur (même texte, le début
          // masqué) ; en violet le jour du rendez-vous.
          <span
            className={`flex items-center gap-1.5 pt-[3px] text-[12.5px] leading-4 font-medium lg:mt-auto lg:items-start lg:border-t lg:border-line lg:pt-2 lg:text-[12px] lg:leading-[1.4] ${
              coachToday ? "text-violet-text" : "text-text"
            }`}
          >
            <UserRound aria-hidden size={13} strokeWidth={2} className="shrink-0 lg:mt-px" />
            <span className="min-w-0">
              <span className="lg:hidden">Avec le </span>
              <span className="lg:capitalize">coach</span>
              {coachSlot ? ` · ${coachSlot}` : ""}
            </span>
          </span>
        ) : null}
      </span>
    </Link>
  );
}

// Sous la semaine : ses compétitions, et les séances avec le coach qui ne correspondent à aucune
// séance du programme (rendez-vous en plus). Chaque ligne dit ce qu'elle est, avec son jour.
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
    <ul aria-label="Compétitions et rendez-vous de la semaine" className="flex flex-col gap-2">
      {items.map((item) => (
        <li key={item.key}>
          <Link
            href={item.type === "session" ? `${agendaPath}/seances/${item.sessionId}` : goalsHref}
            className={`flex items-center gap-2 rounded-[12px] px-3 py-2.5 text-[13px] font-medium transition-[filter] duration-150 hover:brightness-[.97] ${
              item.type === "event" ? "bg-violet/7 text-violet-text" : "bg-surface-2 text-text-2"
            }`}
          >
            {item.type === "event" ? (
              <Flag aria-hidden size={14} strokeWidth={2} className="shrink-0" />
            ) : (
              <Users aria-hidden size={14} strokeWidth={2} className="shrink-0" />
            )}
            <span className="min-w-0">
              {item.type === "event"
                ? `Compétition · ${competitionDay(item.date)} · ${item.title}`
                : `Avec le coach, en plus · ${dayShortLabel(item.date, today)} · ${item.time} · ${item.title}`}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function WeekCard({
  week,
  current,
  today,
  basePath,
  coachItems,
  agendaPath,
  last,
}: {
  week: ProgramWeek;
  current: boolean;
  today: string;
  basePath: string;
  coachItems: AgendaItem[];
  agendaPath: string;
  // Dernière semaine de la vue « Toutes » : sur ordinateur, elle descend jusqu'au bas du menu.
  last: boolean;
}) {
  const count = week.sessions.length;
  // Séances du programme faites avec le coach : leur rendez-vous de la semaine (jour et heure).
  const coachSlots = new Map<string, { label: string | null; today: boolean }>();
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
        ? {
            label: `${dayShortLabel(meeting.date, today)} · ${meeting.time}`,
            today: meeting.date === today,
          }
        : { label: null, today: false },
    );
  }
  const withCoach = coachSlots.size;
  const others = coachItems.filter((item) => !linked.has(item.key));
  const range = `${dayMonth.format(utc(week.monday))} – ${dayMonth.format(utc(week.sunday))}`;
  const titleId = `semaine-${week.index}`;
  return (
    <section
      aria-labelledby={titleId}
      className={`flex min-w-0 flex-col gap-3.5 rounded-[20px] bg-surface p-[18px] ${
        current ? "inset-ring-[1.5px] inset-ring-violet/55" : "inset-ring inset-ring-line-soft"
      } ${last ? "lg:flex-1" : ""}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 flex-col gap-0.5">
          <h3 id={titleId} className="text-[15.5px] leading-[1.3] font-semibold whitespace-nowrap">
            Semaine {week.index}
          </h3>
          <p className="text-[12.5px] leading-[1.4] text-muted">
            {range} ·{" "}
            {count === 0
              ? "semaine de repos"
              : withCoach === 0
                ? `${plural(count, "séance")} libre${count > 1 ? "s" : ""}`
                : `${withCoach} avec le coach · ${count - withCoach} libre${count - withCoach > 1 ? "s" : ""}`}
          </p>
        </div>
        {current || week.label ? (
          <span className="flex flex-wrap gap-1.5">
            {current ? (
              <span className="flex h-6 items-center rounded-[12px] bg-violet-soft px-[9px] text-[12px] font-medium whitespace-nowrap text-violet-text">
                Semaine actuelle
              </span>
            ) : null}
            {week.label ? (
              <span className="flex h-6 items-center rounded-[12px] bg-bg px-[9px] text-[12px] font-medium whitespace-nowrap text-text-2">
                {week.label}
              </span>
            ) : null}
          </span>
        ) : null}
      </div>
      {count > 0 ? (
        <ol
          aria-label={`Séances de la semaine ${week.index}`}
          style={{ "--n": count } as CSSProperties}
          className="grid grid-cols-1 gap-2 lg:grid-cols-[repeat(var(--n),minmax(0,1fr))] lg:gap-2.5"
        >
          {week.sessions.map((session) => {
            const slot = coachSlots.get(session.id);
            return (
              <li key={session.id} className="flex min-w-0">
                <SessionCard
                  session={session}
                  href={`${basePath}/programme/${session.id}`}
                  coachSlot={slot ? slot.label : undefined}
                  coachToday={slot?.today ?? false}
                />
              </li>
            );
          })}
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

// ‹ et › : semaine précédente et suivante, grisées aux bornes.
function WeekStep({ href, label, next }: { href: string | null; label: string; next?: boolean }) {
  const Icon = next ? ChevronRight : ChevronLeft;
  const className =
    "grid size-[38px] shrink-0 place-items-center rounded-[11px] bg-surface inset-ring inset-ring-line-2";
  return href ? (
    <Link
      href={href}
      scroll={false}
      aria-label={label}
      className={`${className} text-text transition-colors duration-150 hover:bg-surface-2`}
    >
      <Icon aria-hidden size={16} strokeWidth={2} />
    </Link>
  ) : (
    <span
      role="link"
      aria-disabled="true"
      aria-label={label}
      className={`${className} text-faint/45`}
    >
      <Icon aria-hidden size={16} strokeWidth={2} />
    </span>
  );
}

export function ProgramWeeksSection({
  name,
  sex,
  program,
  today,
  basePath,
  agendaPath,
  coachItemsByMonday,
  view,
  requestedWeek,
}: {
  name: string;
  sex: "female" | "male" | "unspecified" | null;
  program: AthleteProgram;
  today: string;
  basePath: string;
  agendaPath: string;
  coachItemsByMonday: Map<string, AgendaItem[]>;
  view: ProgramView;
  // Semaine demandée dans l'adresse (?semaine=…), sinon la semaine actuelle.
  requestedWeek: number | null;
}) {
  const weeks = program.weeks;
  const first = weeks[0];
  const last = weeks[weeks.length - 1];
  const current = weeks.find((week) => today >= week.monday && today <= week.sunday) ?? null;
  // Semaine affichée : celle demandée, sinon l'actuelle ; avant le début, la première ; après la
  // fin, la dernière.
  const shown =
    weeks.find((week) => week.index === requestedWeek) ??
    current ??
    (today < first.monday ? first : last);
  const counts = [...new Set(weeks.map((week) => week.sessions.length).filter(Boolean))].sort(
    (a, b) => a - b,
  );
  const most = counts[counts.length - 1] ?? 0;
  const pace =
    counts.length === 0
      ? null
      : counts.length === 1
        ? `${plural(counts[0], "séance")} par semaine`
        : `${counts[0]} à ${most} séances par semaine`;
  const pronoun = sex === "female" ? "elle" : sex === "male" ? "il" : null;

  const agendaHref = `${basePath}?onglet=agenda`;
  const weekHref = (index: number) => `${agendaHref}&semaine=${index}`;
  const hrefFor = Object.fromEntries(weeks.map((week) => [week.index, weekHref(week.index)]));
  const previous = weeks.find((week) => week.index === shown.index - 1);
  const next = weeks.find((week) => week.index === shown.index + 1);
  const modes: { key: ProgramView; label: string; href: string }[] = [
    { key: "semaine", label: "Semaine", href: weekHref(shown.index) },
    { key: "toutes", label: "Toutes les semaines", href: `${agendaHref}&vue=toutes` },
  ];

  const shownWeeks = view === "semaine" ? [shown] : weeks;

  return (
    // Ordinateur, vue « Toutes les semaines » : la colonne prend la hauteur restante et la dernière
    // semaine s'étire jusqu'au bas du menu de gauche (demande d'Antonino du 04/11). Vue Semaine : une
    // seule carte, à sa taille naturelle (étirée, elle était presque vide).
    <div className={`flex flex-col gap-3 ${view === "toutes" ? "lg:flex-1" : ""}`}>
      {/* Le programme et sa règle. */}
      <section
        aria-labelledby="program-weeks-title"
        className="flex flex-wrap items-center gap-x-5 gap-y-3 rounded-[20px] bg-surface px-5 py-4 inset-ring inset-ring-line-soft"
      >
        <div className="flex min-w-0 flex-[1_1_260px] flex-col gap-[3px]">
          <h2
            id="program-weeks-title"
            className="text-[15.5px] leading-[19.5px] font-semibold tracking-[-0.01em]"
          >
            {program.title}
          </h2>
          <p className="text-[13px] leading-[16.5px] text-muted">
            {plural(program.weeksCount, "semaine")} · {dayMonth.format(utc(first.monday))} →{" "}
            {dayMonth.format(utc(last.sunday))}
            {pace ? ` · ${pace}` : ""}
          </p>
        </div>
        <p className="flex min-w-0 flex-[1_1_300px] items-start gap-2.5 rounded-[12px] bg-surface-2 px-3.5 py-2.5 text-[13px] leading-[1.5] text-text-2">
          <ListOrdered
            aria-hidden
            size={16}
            strokeWidth={2}
            className="mt-0.5 shrink-0 text-violet-text"
          />
          <span>
            <strong className="font-semibold text-text">Dans l&apos;ordre, au jour choisi.</strong>{" "}
            {`${name} enchaîne les séances${most > 1 ? ` 1 → ${most}` : ""} ${
              pronoun ? `quand ${pronoun} veut` : "à son rythme"
            } ; seules celles avec le coach ont une date.`}
          </span>
        </p>
      </section>

      {/* Une semaine ou toutes ; dans la vue Semaine, ‹ menu ›. */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <nav aria-label="Affichage du programme" className="flex rounded-[12px] bg-track p-1">
          {modes.map((mode) => (
            <Link
              key={mode.key}
              href={mode.href}
              scroll={false}
              aria-current={view === mode.key ? "page" : undefined}
              className={`flex h-8 items-center rounded-[9px] px-[13px] text-[13px] font-medium whitespace-nowrap transition-colors duration-150 ${
                view === mode.key
                  ? "bg-track-active text-text shadow-[0_1px_3px_rgba(22,18,40,0.10)]"
                  : "text-muted hover:text-text"
              }`}
            >
              {mode.label}
            </Link>
          ))}
        </nav>
        {view === "semaine" ? (
          // Le groupe porte la position du menu des semaines (WeekPicker).
          <div className="relative flex items-center gap-1.5">
            <WeekStep
              href={previous ? weekHref(previous.index) : null}
              label="Semaine précédente"
            />
            <WeekPicker
              shown={shown.index}
              current={current?.index ?? null}
              count={weeks.length}
              ofName={ofName(name)}
              hrefFor={hrefFor}
            />
            <WeekStep href={next ? weekHref(next.index) : null} label="Semaine suivante" next />
          </div>
        ) : null}
      </div>

      {view === "semaine" && current && shown.index !== current.index ? (
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 rounded-[12px] bg-violet/7 px-3.5 py-2.5">
          <p className="text-[13px] leading-[1.45] text-text-2">
            Tu consultes la{" "}
            <strong className="font-semibold text-text">semaine {shown.index}</strong>. {name} est
            en semaine {current.index}.
          </p>
          <Link
            href={weekHref(current.index)}
            scroll={false}
            className="flex min-h-8 items-center text-[13px] font-medium whitespace-nowrap text-violet-text hover:underline"
          >
            Revenir à la semaine {current.index}
          </Link>
        </div>
      ) : null}

      {shownWeeks.map((week, index) => (
        <WeekCard
          key={week.index}
          last={view === "toutes" && index === shownWeeks.length - 1}
          week={week}
          current={week.index === current?.index}
          today={today}
          basePath={basePath}
          coachItems={coachItemsByMonday.get(week.monday) ?? []}
          agendaPath={agendaPath}
        />
      ))}
    </div>
  );
}
