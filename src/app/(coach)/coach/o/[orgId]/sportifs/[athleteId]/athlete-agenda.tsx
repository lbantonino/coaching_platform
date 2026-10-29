import { ChevronLeft, ChevronRight, Flag } from "lucide-react";
import Link from "next/link";

import { buttonClass, iconButtonClass } from "@/components/ui/button";
import { disciplineStyles, type Discipline } from "@/domain/training/discipline";
import { groupByDay, monthGrid, monthLabel, shiftMonth } from "@/features/agenda/calendar";
import { addDays, type AgendaItem } from "@/features/agenda/items";
import { mondayOf } from "@/features/agenda/week";
import type { AthleteProgram } from "@/features/programs/queries";
import { dayShortLabel } from "@/lib/format";

// Agenda d'un sportif sur sa fiche (demande d'Antonino du 26/10) : ses séances encadrées avec le coach
// (individuelles, et collectives où il est inscrit) et ses compétitions. Les séances de son programme
// s'y ajouteront avec l'espace sportif (P6), marquées « Programme » pour les distinguer.

// Une ligne : jour et heure à gauche, titre et détail ; « Aujourd'hui » surligné. Partagée par la
// carte « Prochaines séances » de la vue d'ensemble et l'onglet Agenda.
export function AgendaItemRow({
  item,
  today,
  agendaPath,
  goalsHref,
}: {
  item: AgendaItem;
  today: string;
  agendaPath: string;
  goalsHref: string;
}) {
  const isToday = item.date === today;
  return (
    <Link
      href={item.type === "session" ? `${agendaPath}/seances/${item.sessionId}` : goalsHref}
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
            <Flag aria-hidden size={14} strokeWidth={2} className="shrink-0 text-accent-text" />
          ) : null}
          <span className="truncate">{item.title}</span>
        </span>
        <span className="truncate text-[13px] text-muted">
          {item.type === "event"
            ? `Compétition · ${item.detail}`
            : item.individual
              ? // Le détail commence par « Avec {sportif} » : inutile sur sa propre fiche.
                ["Avec le coach", ...item.detail.split(" · ").slice(1)].join(" · ")
              : `Collective · ${item.detail}`}
        </span>
      </span>
    </Link>
  );
}

export const AGENDA_VIEWS = ["jour", "semaine", "mois"] as const;
export type AgendaView = (typeof AGENDA_VIEWS)[number];

// Période affichée par chaque vue : le jour, la semaine (lundi → dimanche) ou la grille du mois
// (semaines complètes, jours des mois voisins compris).
export function agendaRange(view: AgendaView, date: string): { from: string; to: string } {
  if (view === "jour") return { from: date, to: date };
  if (view === "semaine") {
    const monday = mondayOf(date);
    return { from: monday, to: addDays(monday, 6) };
  }
  const weeks = monthGrid(date.slice(0, 7));
  return { from: weeks[0][0].iso, to: weeks[weeks.length - 1][6].iso };
}

const utc = (day: string) => new Date(`${day}T00:00:00Z`);
const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);
const longDay = new Intl.DateTimeFormat("fr-BE", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: "UTC",
});
const shortDay = new Intl.DateTimeFormat("fr-BE", { weekday: "short", timeZone: "UTC" });
const dayMonth = new Intl.DateTimeFormat("fr-BE", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});

function periodTitle(view: AgendaView, date: string): string {
  if (view === "jour") return capitalize(longDay.format(utc(date)));
  if (view === "mois") return capitalize(monthLabel(date.slice(0, 7)));
  const monday = mondayOf(date);
  return `Semaine du ${dayMonth.format(utc(monday))} au ${dayMonth.format(utc(addDays(monday, 6)))}`;
}

function shiftedDate(view: AgendaView, date: string, delta: 1 | -1): string {
  if (view === "jour") return addDays(date, delta);
  if (view === "semaine") return addDays(mondayOf(date), 7 * delta);
  return `${shiftMonth(date.slice(0, 7), delta)}-01`;
}

// Couleurs écrites en entier pour Tailwind : pastille du mois et carte de la semaine.
const dotColors: Record<Discipline, string> = {
  running: "bg-run",
  strength: "bg-strength",
  hyrox: "bg-hyrox",
  hybrid: "bg-hybrid",
};

function itemHref(item: AgendaItem, agendaPath: string, goalsHref: string) {
  return item.type === "session" ? `${agendaPath}/seances/${item.sessionId}` : goalsHref;
}

function itemKind(item: AgendaItem): string {
  if (item.type === "event") return "Compétition";
  return item.individual ? "Avec le coach" : "Collective";
}

// Carte d'une séance dans la vue Semaine : teinte de sa discipline, heure, titre, type.
function WeekCard({
  item,
  agendaPath,
  goalsHref,
}: {
  item: AgendaItem;
  agendaPath: string;
  goalsHref: string;
}) {
  return (
    <Link
      href={itemHref(item, agendaPath, goalsHref)}
      scroll={item.type === "session"}
      className={`flex flex-col gap-0.5 rounded-[10px] border p-2 transition-[filter] duration-150 hover:brightness-95 ${
        item.discipline ? disciplineStyles[item.discipline].header : "border-line bg-bg"
      }`}
    >
      <span className="flex items-center gap-1 font-mono text-[12px] font-medium tabular">
        {item.type === "event" ? (
          <Flag aria-hidden size={12} strokeWidth={2} className="text-accent-text" />
        ) : null}
        {item.type === "session" ? item.time : "Journée"}
      </span>
      <span className="line-clamp-2 text-[13px] leading-snug font-medium break-words">
        {item.title}
      </span>
      <span className="text-[12px] leading-snug text-muted">{itemKind(item)}</span>
    </Link>
  );
}

// Onglet « Agenda » de la fiche (demande d'Antonino du 26/10) : trois vues, Aujourd'hui (la liste du
// jour), Semaine (une colonne par jour, cartes sans grille horaire ; 3 jours visibles sur téléphone,
// on fait glisser) et Mois (pastilles par jour, toucher un jour ouvre ce jour-là). Seulement ce qui
// concerne le sportif ; l'agenda du coach (tableau de bord, page Agenda) reste celui de tout le monde.
export function AthleteAgendaSection({
  name,
  view,
  date,
  today,
  items,
  basePath,
  agendaPath,
  goalsHref,
}: {
  name: string;
  view: AgendaView;
  date: string;
  today: string;
  items: AgendaItem[];
  basePath: string;
  agendaPath: string;
  goalsHref: string;
}) {
  const href = (nextView: AgendaView, nextDate: string) =>
    `${basePath}?onglet=agenda&vue=${nextView}&date=${nextDate}`;
  const byDay = groupByDay(items);
  const viewLinks: { view: AgendaView; label: string; date: string }[] = [
    { view: "jour", label: "Aujourd'hui", date: today },
    { view: "semaine", label: "Semaine", date },
    { view: "mois", label: "Mois", date },
  ];

  return (
    <section
      aria-labelledby="athlete-agenda-title"
      className="flex flex-col gap-4 rounded-card border border-line bg-surface p-4 md:p-[22px]"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="athlete-agenda-title" className="text-title font-medium">
          Agenda de {name}
        </h2>
        <nav
          aria-label="Vue de l'agenda du sportif"
          className="flex rounded-pill border border-line bg-bg p-1"
        >
          {viewLinks.map((link) => (
            <Link
              key={link.view}
              href={href(link.view, link.date)}
              scroll={false}
              aria-current={view === link.view ? "page" : undefined}
              className={`inline-flex min-h-9 items-center rounded-pill px-3.5 text-[14px] font-medium transition-colors duration-150 ${
                view === link.view ? "bg-selected text-text" : "text-muted hover:text-text"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="flex items-center justify-between gap-2">
        <Link
          href={href(view, shiftedDate(view, date, -1))}
          scroll={false}
          aria-label="Période précédente"
          className={iconButtonClass()}
        >
          <ChevronLeft aria-hidden size={18} strokeWidth={1.8} />
        </Link>
        <h3 className="text-center text-[15px] font-medium">{periodTitle(view, date)}</h3>
        <Link
          href={href(view, shiftedDate(view, date, 1))}
          scroll={false}
          aria-label="Période suivante"
          className={iconButtonClass()}
        >
          <ChevronRight aria-hidden size={18} strokeWidth={1.8} />
        </Link>
      </div>

      {view === "jour" ? (
        items.length === 0 ? (
          <p
            role="status"
            className="rounded-[14px] border border-dashed border-line-2 p-4 text-muted"
          >
            Rien de prévu pour {name} ce jour-là.
          </p>
        ) : (
          <ul aria-label="Séances du jour" className="flex flex-col">
            {items.map((item) => (
              <li key={item.key} className="border-t border-line first:border-t-0">
                <AgendaItemRow
                  item={item}
                  today={today}
                  agendaPath={agendaPath}
                  goalsHref={goalsHref}
                />
              </li>
            ))}
          </ul>
        )
      ) : view === "semaine" ? (
        <div className="-mx-4 snap-x snap-mandatory scroll-px-4 overflow-x-auto px-4 [scrollbar-width:none] md:mx-0 md:scroll-px-0 md:px-0">
          <ol
            aria-label="Jours de la semaine"
            className="grid w-max grid-flow-col auto-cols-[calc((100vw-88px)/3)] gap-2 md:w-full md:auto-cols-fr md:grid-cols-7"
          >
            {Array.from({ length: 7 }, (_, i) => addDays(mondayOf(date), i)).map((day) => {
              const dayItems = byDay.get(day) ?? [];
              const isToday = day === today;
              return (
                <li key={day} className="flex min-w-0 snap-start flex-col gap-2">
                  <span
                    className={`flex items-baseline justify-center gap-1.5 rounded-[10px] py-1.5 text-[13px] ${
                      isToday ? "bg-accent-soft font-medium text-accent-text" : "text-muted"
                    }`}
                  >
                    {capitalize(shortDay.format(utc(day)).replace(".", ""))}
                    <span className="font-mono text-[15px] font-medium text-text tabular">
                      {utc(day).getUTCDate()}
                    </span>
                  </span>
                  {dayItems.length === 0 ? (
                    <span aria-hidden className="py-2 text-center text-[13px] text-faint">
                      —
                    </span>
                  ) : (
                    dayItems.map((item) => (
                      <WeekCard
                        key={item.key}
                        item={item}
                        agendaPath={agendaPath}
                        goalsHref={goalsHref}
                      />
                    ))
                  )}
                </li>
              );
            })}
          </ol>
        </div>
      ) : (
        <div className="flex flex-col gap-1">
          <div aria-hidden className="grid grid-cols-7 text-center text-[12px] text-muted">
            {["L", "M", "M", "J", "V", "S", "D"].map((letter, i) => (
              <span key={i}>{letter}</span>
            ))}
          </div>
          <ol aria-label="Jours du mois" className="grid grid-cols-7 gap-1">
            {monthGrid(date.slice(0, 7))
              .flat()
              .map((day) => {
                const dayItems = byDay.get(day.iso) ?? [];
                const sessions = dayItems.filter((item) => item.type === "session");
                const competition = dayItems.some((item) => item.type === "event");
                const isToday = day.iso === today;
                const count = dayItems.length;
                return (
                  <li key={day.iso}>
                    <Link
                      href={href("jour", day.iso)}
                      scroll={false}
                      aria-label={`${capitalize(longDay.format(utc(day.iso)))} : ${
                        count === 0 ? "rien de prévu" : `${count} élément${count > 1 ? "s" : ""}`
                      }`}
                      className={`flex min-h-[52px] flex-col items-center gap-1 rounded-[10px] border py-1.5 transition-colors duration-150 hover:bg-surface-2 ${
                        isToday ? "border-accent" : "border-transparent"
                      } ${day.inMonth ? "" : "opacity-40"}`}
                    >
                      <span
                        className={`font-mono text-[13px] tabular ${
                          isToday ? "font-semibold text-accent-text" : ""
                        }`}
                      >
                        {day.day}
                      </span>
                      <span className="flex min-h-2 flex-wrap items-center justify-center gap-0.5">
                        {competition ? (
                          <Flag
                            aria-hidden
                            size={10}
                            strokeWidth={2.4}
                            className="text-accent-text"
                          />
                        ) : null}
                        {sessions.slice(0, 3).map((item) => (
                          <span
                            key={item.key}
                            aria-hidden
                            className={`size-1.5 rounded-full ${
                              item.discipline ? dotColors[item.discipline] : "bg-muted"
                            }`}
                          />
                        ))}
                      </span>
                    </Link>
                  </li>
                );
              })}
          </ol>
        </div>
      )}

      <Link
        href={agendaPath}
        className="w-fit text-small text-muted underline underline-offset-4 hover:text-text"
      >
        Ouvrir l&apos;agenda complet du coach
      </Link>
    </section>
  );
}

// Onglet « Programme » : le programme publié (titre, objectif, période, version) et le lien vers sa
// vue semaine par semaine ; sans programme, un état vide honnête et le bouton pour en créer un.
// La création et la modification arrivent avec l'éditeur (tranche 2).
export function AthleteProgramSection({
  name,
  program,
  agendaHref,
}: {
  name: string;
  program: AthleteProgram | null;
  agendaHref: string;
}) {
  if (program) {
    const last = program.weeks[program.weeks.length - 1];
    const sessions = program.weeks.reduce((sum, week) => sum + week.sessions.length, 0);
    return (
      <section
        aria-labelledby="athlete-program-title"
        className="flex flex-col gap-4 rounded-card border border-line bg-surface p-5 md:p-[22px]"
      >
        <div className="flex flex-col gap-1">
          <h2 id="athlete-program-title" className="text-title font-medium">
            {program.title}
          </h2>
          {program.goal ? <p className="text-small text-muted">Objectif : {program.goal}</p> : null}
        </div>
        <dl className="grid grid-cols-2 gap-3 text-small sm:grid-cols-4">
          {[
            ["Période", `${dayMonthShort(program.startDate)} → ${dayMonthShort(last.sunday)}`],
            ["Durée", `${program.weeksCount} semaines`],
            ["Séances", String(sessions)],
            ["Version", `Publiée n° ${program.publicationNumber}`],
          ].map(([label, value]) => (
            <div key={label} className="flex flex-col gap-0.5 rounded-[12px] bg-bg p-3">
              <dt className="text-[12px] text-muted">{label}</dt>
              <dd className="font-medium">{value}</dd>
            </div>
          ))}
        </dl>
        <Link href={agendaHref} className={buttonClass({ variant: "outline", className: "w-fit" })}>
          Voir le programme semaine par semaine
        </Link>
      </section>
    );
  }
  return (
    <section
      aria-labelledby="athlete-program-title"
      className="flex flex-col gap-4 rounded-card border border-line bg-surface p-5 md:p-[22px]"
    >
      <h2 id="athlete-program-title" className="text-title font-medium">
        Programme
      </h2>
      <div className="flex flex-col items-start gap-3 rounded-[14px] border border-dashed border-line-2 p-5">
        <p className="text-muted">
          Aucun programme pour {name} pour l&apos;instant. Ici, tu verras son programme semaine par
          semaine, tu pourras le modifier et y ajouter des séances.
        </p>
        <Link href="/coach/programmes" className={buttonClass({ variant: "outline" })}>
          Créer un programme
        </Link>
      </div>
    </section>
  );
}

const dayMonthShortFormat = new Intl.DateTimeFormat("fr-BE", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});
function dayMonthShort(day: string): string {
  return dayMonthShortFormat.format(new Date(`${day}T00:00:00Z`));
}
