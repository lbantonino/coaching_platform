import { ChevronLeft, ChevronRight, Flag, ListOrdered, Users } from "lucide-react";
import Link from "next/link";

import { ProgramPdfMenu } from "@/components/programs/program-pdf-menu";
import { cardLines } from "@/domain/training/card-lines";
import { sessionCards, viewStepCards } from "@/domain/training/session-cards";
import { defaultWeekIndex } from "@/domain/training/program-status";
import { sessionMomentLabels } from "@/domain/training/session-v2";
import type { AgendaItem } from "@/features/agenda/items";
import { draftSessionKeys } from "@/features/programs/drafts";
import { sessionEditHref } from "@/features/programs/edit-href";
import type { AthleteProgram, ProgramWeek } from "@/features/programs/queries";
import { createClient } from "@/lib/supabase/server";
import { dayShortLabel } from "@/lib/format";

import { WeekPicker } from "./week-picker";
import { OpenSessionProvider, WeekSessionCards, type WeekSessionView } from "./week-session-cards";

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

// « Mardi 3 » : le jour d'une séance en jours fixes (ou de son rendez-vous avec le coach).
const longWeekday = new Intl.DateTimeFormat("fr-BE", {
  weekday: "long",
  day: "numeric",
  timeZone: "UTC",
});
function fullDay(day: string): string {
  const text = longWeekday.format(utc(day));
  return text.charAt(0).toUpperCase() + text.slice(1);
}
// « Mer 18 » : sur une carte étroite (7 séances dans la semaine).
const shortWeekday = new Intl.DateTimeFormat("fr-BE", {
  weekday: "short",
  day: "numeric",
  timeZone: "UTC",
});
function shortDay(day: string): string {
  const text = shortWeekday.format(utc(day)).replace(".", "");
  return text.charAt(0).toUpperCase() + text.slice(1);
}
const WEEKDAY_OFFSET = { mon: 0, tue: 1, wed: 2, thu: 3, fri: 4, sat: 5, sun: 6 } as const;
function dayOfWeek(monday: string, day: keyof typeof WEEKDAY_OFFSET): string {
  const date = utc(monday);
  date.setUTCDate(date.getUTCDate() + WEEKDAY_OFFSET[day]);
  return date.toISOString().slice(0, 10);
}

// Jour d'une compétition : « Sam 12 déc. ».
function competitionDay(day: string): string {
  const text = weekdayDayMonth.format(utc(day)).replace(".", "");
  return text.charAt(0).toUpperCase() + text.slice(1);
}

// Sous la semaine : ses compétitions, et les séances avec le coach qui ne correspondent à aucune
// séance du programme (rendez-vous en plus). Chaque ligne dit ce qu'elle est, avec son jour.
function WeekCoachItems({
  items,
  today,
  agendaPath,
  goalsHref,
  returnTo,
}: {
  items: AgendaItem[];
  today: string;
  agendaPath: string;
  goalsHref: string;
  returnTo: string;
}) {
  if (items.length === 0) return null;
  return (
    <ul aria-label="Compétitions et rendez-vous de la semaine" className="flex flex-col gap-2">
      {items.map((item) => (
        <li key={item.key}>
          <Link
            // La date touchée s'ouvre (B6), et le retour ramène à la fiche (B15).
            href={
              item.type === "session"
                ? `${agendaPath}/seances/${item.sessionId}?date=${item.date}&retour=${encodeURIComponent(returnTo)}`
                : goalsHref
            }
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
                : `Avec le coach, en plus · ${dayShortLabel(item.date, today)} · ${item.time || "Journée"} · ${item.title}`}
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
  editHref,
  pdfBase,
  coachItems,
  agendaPath,
  last,
  name,
}: {
  name: string;
  week: ProgramWeek;
  current: boolean;
  today: string;
  basePath: string;
  // « Modifier la séance » d'une séance de cette semaine (edit-href.ts).
  editHref: (weekIndex: number, key: string) => string;
  pdfBase: string;
  coachItems: AgendaItem[];
  agendaPath: string;
  // Dernière semaine de la vue « Toutes » : sur ordinateur, elle descend jusqu'au bas du menu.
  last: boolean;
}) {
  const count = week.sessions.length;
  const returnTo = `${basePath}?onglet=agenda&semaine=${week.index}`;
  // Séances du programme faites avec le coach : leur rendez-vous RÉEL de la semaine, lu dans l'agenda
  // (revue MVP du 13/11, B4 : la date figée à la publication pouvait ne plus être la bonne), ou ce
  // qui lui est arrivé (supprimé, pas cette semaine). La ligne ouvre la séance de l'agenda à cette
  // date (B18).
  const coachSlots = new Map<string, NonNullable<WeekSessionView["coach"]>>();
  const linked = new Set<string>();
  for (const session of week.sessions) {
    if (!session.coach) continue;
    const sessionPath = `${agendaPath}/seances/${session.coach.sessionId}`;
    const back = `retour=${encodeURIComponent(returnTo)}`;
    if (session.coach.status === "ok" && session.coachDate) {
      linked.add(`${session.coach.sessionId}:${session.coachDate}`);
      coachSlots.set(session.id, {
        label: `${dayShortLabel(session.coachDate, today)}${session.time ? ` · ${session.time}` : ""}${
          session.coach.moved ? " · déplacée" : ""
        }`,
        today: session.coachDate === today,
        href: `${sessionPath}?date=${session.coachDate}&${back}`,
      });
    } else {
      coachSlots.set(session.id, {
        label:
          session.coach.status === "deleted"
            ? "Rendez-vous supprimé"
            : "Pas de rendez-vous cette semaine",
        today: false,
        href: session.coach.status === "deleted" ? null : `${sessionPath}?${back}`,
      });
    }
  }
  const withCoach = coachSlots.size;
  const others = coachItems.filter(
    (item) => item.type !== "session" || !linked.has(`${item.sessionId}:${item.date}`),
  );
  // B13 : en jours fixes, les séances ne sont pas « libres ».
  const rest = week.fixed ? "aux jours fixés" : "libre";
  const restOf = (n: number) => (week.fixed ? rest : `${rest}${n > 1 ? "s" : ""}`);
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
                ? `${plural(count, "séance")} ${restOf(count)}`
                : `${withCoach} avec le coach · ${count - withCoach} ${restOf(count - withCoach)}`}
          </p>
        </div>
        {current || week.label ? (
          <span className="flex flex-wrap gap-1.5">
            {current ? (
              <span className="flex h-6 items-center rounded-[6px] bg-violet-soft px-[9px] text-[12px] font-medium whitespace-nowrap text-violet-text">
                Semaine actuelle
              </span>
            ) : null}
            {week.label ? (
              <span className="flex h-6 items-center rounded-[6px] bg-bg px-[9px] text-[12px] font-medium whitespace-nowrap text-text-2">
                {week.label}
              </span>
            ) : null}
          </span>
        ) : null}
      </div>
      {count > 0 ? (
        <WeekSessionCards
          weekIndex={week.index}
          pdfBase={pdfBase}
          sessions={week.sessions.map((session) => {
            const slot = coachSlots.get(session.id) ?? null;
            const date =
              session.coachDate ?? (session.day ? dayOfWeek(week.monday, session.day) : null);
            const dayLabel = date ? fullDay(date) : null;
            // B9 : le moment (plusieurs séances le même jour) et l'heure fixée, sous le jour ; l'heure
            // d'un rendez-vous du coach est sur sa ligne.
            const when = [
              session.moment ? sessionMomentLabels[session.moment] : null,
              slot ? null : session.time,
            ]
              .filter(Boolean)
              .join(" · ");
            return {
              id: session.id,
              slot: session.slotIndex,
              editHref: editHref(week.index, session.key),
              content: session.content,
              lines: cardLines(session.content),
              // La même vue en cartes que la page du programme (D-187).
              cards: session.published
                ? sessionCards(session.published.content)
                : viewStepCards(session.content.steps),
              dayLabel,
              dayShort: date ? shortDay(date) : null,
              when: when || null,
              coach: slot,
              context: [
                `Semaine ${week.index}`,
                range,
                slot
                  ? `avec le coach, ${slot.label}`
                  : dayLabel
                    ? `le ${dayLabel.toLowerCase()}${when ? `, ${when.toLowerCase()}` : ""}`
                    : `au jour choisi par ${name}`,
              ].join(" · "),
            };
          })}
        />
      ) : null}
      <WeekCoachItems
        items={others}
        today={today}
        agendaPath={agendaPath}
        goalsHref={`${basePath}?onglet=objectifs`}
        returnTo={returnTo}
      />
    </section>
  );
}

// ‹ et › : semaine précédente et suivante, grisées aux bornes.
function WeekStep({ href, label, next }: { href: string | null; label: string; next?: boolean }) {
  const Icon = next ? ChevronRight : ChevronLeft;
  const className =
    "tap-44 grid size-[38px] shrink-0 place-items-center rounded-[11px] bg-surface inset-ring inset-ring-line-2 max-lg:size-[42px]";
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

export async function ProgramWeeksSection({
  organizationId,
  name,
  sex,
  program,
  today,
  basePath,
  editorHref,
  pdfBase,
  agendaPath,
  coachItemsByMonday,
  view,
  requestedWeek,
}: {
  organizationId: string;
  name: string;
  sex: "female" | "male" | "unspecified" | null;
  program: AthleteProgram;
  today: string;
  basePath: string;
  // L'éditeur du programme (« …/programmes/[id] ») : « Modifier la séance ».
  editorHref: string;
  // Adresse des PDF du programme publié (« …/programmes/[id]/pdf »).
  pdfBase: string;
  agendaPath: string;
  coachItemsByMonday: Map<string, AgendaItem[]>;
  view: ProgramView;
  // Semaine demandée dans l'adresse (?semaine=…), sinon la semaine actuelle.
  requestedWeek: number | null;
}) {
  const weeks = program.weeks;
  const draftKeys = new Set(
    await draftSessionKeys(await createClient(), organizationId, program.id),
  );
  const editHref = (weekIndex: number, key: string) =>
    sessionEditHref(
      editorHref,
      draftKeys,
      weekIndex,
      key,
      `${basePath}?onglet=agenda&semaine=${weekIndex}`,
    );
  const first = weeks[0];
  const last = weeks[weeks.length - 1];
  const current = weeks.find((week) => today >= week.monday && today <= week.sunday) ?? null;
  // Semaine affichée : celle demandée, sinon la même que l'onglet Programme (B2) : l'actuelle ;
  // avant le début, la première ; après la fin, la dernière.
  const fallback = defaultWeekIndex(program.startDate, program.weeksCount, today);
  const shown =
    weeks.find((week) => week.index === requestedWeek) ??
    weeks.find((week) => week.index === fallback) ??
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
  // Le mode enregistré de la semaine affichée (B13 : une séance avec le coach a un jour sans que la
  // semaine soit à jours fixes).
  const fixed = shown.fixed;

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
        <div className="flex min-w-0 flex-[1_1_260px] items-start justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-[3px]">
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
          {/* Les PDF que le coach envoie au sportif (D-186 : ils étaient sur la carte de l'ancienne vue
              de l'onglet Programme) ; 44 px de cible sur téléphone. */}
          <ProgramPdfMenu
            base={pdfBase}
            className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-[11px] bg-surface px-3 text-[13px] font-semibold text-text inset-ring inset-ring-field-ring transition-[scale,background-color] duration-150 hover:bg-surface-2 active:scale-[0.97] lg:h-8 lg:rounded-[9px] lg:text-[12.5px]"
          />
        </div>
        <p className="flex min-w-0 flex-[1_1_300px] items-start gap-2.5 rounded-[12px] bg-surface-2 px-3.5 py-2.5 text-[13px] leading-[1.5] text-text-2">
          <ListOrdered
            aria-hidden
            size={16}
            strokeWidth={2}
            className="mt-0.5 shrink-0 text-violet-text"
          />
          {fixed ? (
            <span>
              <strong className="font-semibold text-text">Jours fixés par le coach.</strong>{" "}
              {`${name} suit les jours indiqués sur chaque séance. Tu peux repasser en « dans l'ordre » à tout moment, dans l'éditeur.`}
            </span>
          ) : (
            <span>
              <strong className="font-semibold text-text">
                Dans l&apos;ordre, au jour choisi.
              </strong>{" "}
              {`${name} enchaîne les séances${most > 1 ? ` 1 → ${most}` : ""} ${
                pronoun ? `quand ${pronoun} veut` : "à son rythme"
              } ; seules celles avec le coach ont une date.`}
            </span>
          )}
        </p>
      </section>

      {/* Une semaine ou toutes ; dans la vue Semaine, ‹ menu ›. */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <nav
          aria-label="Affichage du programme"
          className="flex w-full rounded-[12px] bg-track p-1 lg:w-auto"
        >
          {modes.map((mode) => (
            <Link
              key={mode.key}
              href={mode.href}
              scroll={false}
              aria-current={view === mode.key ? "page" : undefined}
              className={`flex h-8 items-center justify-center rounded-[9px] px-[13px] text-[13px] font-medium whitespace-nowrap transition-colors duration-150 max-lg:h-[34px] max-lg:flex-1 ${
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
          <div className="relative flex w-full items-center gap-1.5 lg:w-auto">
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

      {/* Programme à venir (B1) : l'agenda reste la vue par défaut de l'onglet ; on y revient d'ici. */}
      {program.timing === "upcoming" ? (
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 rounded-[12px] bg-violet/7 px-3.5 py-2.5">
          <p className="text-[13px] leading-[1.45] text-text-2">
            Ce programme commence le{" "}
            <strong className="font-semibold text-text">
              {dayMonth.format(utc(program.startDate))}
            </strong>
            .
          </p>
          <Link
            href={`${agendaHref}&vue=semaine`}
            scroll={false}
            className="flex min-h-11 items-center text-[13px] font-medium whitespace-nowrap text-violet-text hover:underline"
          >
            Revenir à l&apos;agenda
          </Link>
        </div>
      ) : null}

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

      <OpenSessionProvider>
        {shownWeeks.map((week, index) => (
          <WeekCard
            key={week.index}
            last={view === "toutes" && index === shownWeeks.length - 1}
            week={week}
            current={week.index === current?.index}
            today={today}
            basePath={basePath}
            editHref={editHref}
            pdfBase={pdfBase}
            coachItems={coachItemsByMonday.get(week.monday) ?? []}
            agendaPath={agendaPath}
            name={name}
          />
        ))}
      </OpenSessionProvider>
    </div>
  );
}
