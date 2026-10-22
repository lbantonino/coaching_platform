import { ChevronLeft, ChevronRight, CircleCheck, Flag } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { z } from "zod";

import { Badge } from "@/components/ui/badge";
import { buttonClass, iconButtonClass } from "@/components/ui/button";
import { FilterChips } from "@/components/ui/filter-chips";
import { inputClass } from "@/components/ui/form-styles";
import { disciplineStyles, type Discipline } from "@/domain/training/discipline";
import {
  dayLabel,
  groupByDay,
  monthGrid,
  monthLabel,
  parseMonth,
  shiftMonth,
  shortMonth,
} from "@/features/agenda/calendar";
import { listAgendaEvents, type AgendaEvent } from "@/features/agenda/queries";
import { listAthletes } from "@/features/athletes/queries";
import { requireOrgAccess } from "@/features/auth/guards";
import { goalCountdown } from "@/features/goals/format";
import { todayIsoInBrussels } from "@/lib/format";

export const metadata: Metadata = {
  title: "Agenda",
};

// Filtre de discipline dans l'URL, en français : ?discipline=course|musculation|hyrox
const disciplineSlugs = {
  course: "running",
  musculation: "strength",
  hyrox: "hyrox",
} as const satisfies Record<string, Discipline>;
type DisciplineSlug = keyof typeof disciplineSlugs;
const disciplineSlugLabels: Record<DisciplineSlug, string> = {
  course: "Course à pied",
  musculation: "Musculation",
  hyrox: "Hyrox",
};

// Pastille d'une échéance dans la grille : couleur de sa discipline (D-23), neutre sans discipline.
const chipClasses: Record<Discipline | "none", string> = {
  running: "bg-run-soft text-run",
  strength: "bg-strength-soft text-strength",
  hyrox: "bg-hyrox-soft text-hyrox",
  hybrid: "bg-hybrid-soft text-hybrid",
  none: "bg-chip text-text",
};

const weekDays = [
  ["lun.", "lundi"],
  ["mar.", "mardi"],
  ["mer.", "mercredi"],
  ["jeu.", "jeudi"],
  ["ven.", "vendredi"],
  ["sam.", "samedi"],
  ["dim.", "dimanche"],
] as const;

type Query = Record<string, string | string[] | undefined>;
const single = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

export default function AgendaPage({ params, searchParams }: PageProps<"/coach/o/[orgId]/agenda">) {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-5 py-6 md:px-8 md:py-[22px]">
      {/* Organisation, mois et filtres viennent de l'URL : données de requête, derrière Suspense. */}
      <Suspense fallback={<p className="text-muted">Chargement de l&apos;agenda…</p>}>
        {Promise.all([params, searchParams]).then(([{ orgId }, query]) => (
          <Agenda orgId={orgId} query={query} />
        ))}
      </Suspense>
    </main>
  );
}

async function Agenda({ orgId, query }: { orgId: string; query: Query }) {
  // Garde-fou serveur : membre de CETTE organisation, sinon redirection.
  const { membership } = await requireOrgAccess(orgId);
  const organizationId = membership.organizationId;
  const today = todayIsoInBrussels();
  const month = parseMonth(single(query.mois), today);

  const slug = single(query.discipline);
  const disciplineSlug = slug && slug in disciplineSlugs ? (slug as DisciplineSlug) : null;
  const discipline = disciplineSlug ? disciplineSlugs[disciplineSlug] : null;

  const [events, athletes] = await Promise.all([
    listAgendaEvents(organizationId),
    listAthletes(organizationId, { status: "all", q: "" }),
  ]);
  const selectable = athletes.filter((athlete) => athlete.status !== "archived");
  const athleteParam = single(query.sportif);
  const athleteId =
    athleteParam &&
    z.uuid().safeParse(athleteParam).success &&
    selectable.some((a) => a.id === athleteParam)
      ? athleteParam
      : null;

  const filtered = events.filter(
    (event) =>
      (!discipline || event.discipline === discipline) &&
      (!athleteId || event.athleteId === athleteId),
  );
  const upcoming = filtered.filter((event) => !event.achieved && event.date >= today).slice(0, 5);
  const inMonth = filtered.filter((event) => event.date.startsWith(month));
  const byDay = groupByDay(inMonth);

  const base = `/coach/o/${organizationId}/agenda`;
  const href = (changes: { mois?: string; discipline?: DisciplineSlug | null }) => {
    const search = new URLSearchParams();
    const nextMonth = changes.mois ?? month;
    if (nextMonth !== today.slice(0, 7)) search.set("mois", nextMonth);
    const nextDiscipline = changes.discipline === undefined ? disciplineSlug : changes.discipline;
    if (nextDiscipline) search.set("discipline", nextDiscipline);
    if (athleteId) search.set("sportif", athleteId);
    const text = search.toString();
    return text ? `${base}?${text}` : base;
  };
  const goalHref = (event: AgendaEvent) =>
    `/coach/o/${organizationId}/sportifs/${event.athleteId}?onglet=objectifs`;

  return (
    <>
      <div className="flex flex-col gap-1">
        <p className="text-small text-muted">{membership.organizationName}</p>
        <h1 className="font-display text-h2 font-medium md:text-h1">Agenda</h1>
        <p className="text-small text-muted">
          Compétitions et objectifs datés de tes sportifs. Les séances s&apos;ajouteront ici avec
          les programmes.
        </p>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <FilterChips
          label="Filtrer par discipline"
          options={[
            { href: href({ discipline: null }), label: "Toutes", active: !disciplineSlug },
            ...(Object.keys(disciplineSlugs) as DisciplineSlug[]).map((key) => ({
              href: href({ discipline: key }),
              label: disciplineSlugLabels[key],
              active: disciplineSlug === key,
            })),
          ]}
        />
        {/* Formulaire GET : le filtre reste dans l'adresse et fonctionne sans JavaScript. */}
        <form method="get" action={base} className="flex items-center gap-2">
          {month !== today.slice(0, 7) ? <input type="hidden" name="mois" value={month} /> : null}
          {disciplineSlug ? <input type="hidden" name="discipline" value={disciplineSlug} /> : null}
          <label htmlFor="agenda-athlete" className="sr-only">
            Sportif
          </label>
          <select
            id="agenda-athlete"
            name="sportif"
            defaultValue={athleteId ?? ""}
            className={`${inputClass} h-9 w-full md:w-56`}
          >
            <option value="">Tous les sportifs</option>
            {selectable.map((athlete) => (
              <option key={athlete.id} value={athlete.id}>
                {athlete.displayName}
              </option>
            ))}
          </select>
          <button type="submit" className={buttonClass({ variant: "outline", size: "sm" })}>
            Filtrer
          </button>
        </form>
      </div>

      <section
        aria-labelledby="upcoming-title"
        className="flex flex-col gap-4 rounded-card border border-line bg-surface p-5 md:p-[22px]"
      >
        <h2 id="upcoming-title" className="text-title font-medium">
          Prochaines échéances
        </h2>
        {upcoming.length === 0 ? (
          <p role="status" className="text-small text-muted">
            Aucune échéance à venir pour ce filtre.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {upcoming.map((event) => (
              <li key={event.id}>
                <UpcomingRow event={event} today={today} href={goalHref(event)} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section
        aria-labelledby="month-title"
        className="flex flex-col gap-4 rounded-card border border-line bg-surface p-5 md:p-[22px]"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="month-title" className="text-title font-medium first-letter:uppercase">
            {monthLabel(month)}
          </h2>
          <nav aria-label="Changer de mois" className="flex items-center gap-2">
            <Link
              href={href({ mois: shiftMonth(month, -1) })}
              aria-label="Mois précédent"
              className={iconButtonClass({ size: "sm" })}
            >
              <ChevronLeft aria-hidden size={16} strokeWidth={1.8} />
            </Link>
            <Link
              href={href({ mois: today.slice(0, 7) })}
              className={buttonClass({ variant: "outline", size: "sm" })}
            >
              Aujourd&apos;hui
            </Link>
            <Link
              href={href({ mois: shiftMonth(month, 1) })}
              aria-label="Mois suivant"
              className={iconButtonClass({ size: "sm" })}
            >
              <ChevronRight aria-hidden size={16} strokeWidth={1.8} />
            </Link>
          </nav>
        </div>

        {/* Ordinateur : grille du mois. */}
        <table className="hidden w-full table-fixed border-collapse md:table">
          <caption className="sr-only">Échéances de {monthLabel(month)}</caption>
          <thead>
            <tr>
              {weekDays.map(([short, long]) => (
                <th
                  key={long}
                  scope="col"
                  className="px-1.5 pb-2 text-left text-caption font-normal text-muted"
                >
                  <abbr title={long} className="no-underline">
                    {short}
                  </abbr>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {monthGrid(month).map((week) => (
              <tr key={week[0].iso}>
                {week.map((day) => (
                  <td
                    key={day.iso}
                    className={`h-24 border border-line p-1.5 align-top ${day.inMonth ? "" : "bg-bg/40"}`}
                  >
                    <span
                      className={`inline-flex size-6 items-center justify-center rounded-full text-caption tabular ${
                        day.iso === today
                          ? "bg-accent font-semibold text-on-accent"
                          : day.inMonth
                            ? "text-text"
                            : "text-faint"
                      }`}
                    >
                      {day.inMonth ? day.day : ""}
                    </span>
                    {day.inMonth ? (
                      <ul className="mt-1 flex flex-col gap-1">
                        {(byDay.get(day.iso) ?? []).map((event) => (
                          <li key={event.id}>
                            <Link
                              href={goalHref(event)}
                              title={`${event.title} · ${event.athleteName}`}
                              className={`flex items-center gap-1 truncate rounded-[6px] px-1.5 py-0.5 text-micro font-medium hover:opacity-80 ${chipClasses[event.discipline ?? "none"]}`}
                            >
                              {event.achieved ? (
                                <CircleCheck
                                  aria-label="Atteint"
                                  size={11}
                                  strokeWidth={2}
                                  className="shrink-0"
                                />
                              ) : null}
                              <span className="truncate">
                                {event.athleteName.split(" ")[0]} · {event.title}
                              </span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        {/* Téléphone : liste des jours qui ont une échéance (une grille serait illisible). */}
        <div className="md:hidden">
          {inMonth.length === 0 ? (
            <p role="status" className="text-small text-muted">
              Aucune échéance ce mois-ci.
            </p>
          ) : (
            <ul aria-label={`Échéances de ${monthLabel(month)}`} className="flex flex-col gap-4">
              {[...byDay.entries()].map(([date, dayEvents]) => (
                <li key={date} className="flex flex-col gap-2">
                  <h3 className="text-small font-medium first-letter:uppercase">
                    {dayLabel(date)}
                  </h3>
                  <ul className="flex flex-col gap-2">
                    {dayEvents.map((event) => (
                      <li key={event.id}>
                        <UpcomingRow event={event} today={today} href={goalHref(event)} compact />
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </>
  );
}

// Ligne d'une échéance : date, pastille de discipline, titre, sportif, compte à rebours.
function UpcomingRow({
  event,
  today,
  href,
  compact = false,
}: {
  event: AgendaEvent;
  today: string;
  href: string;
  compact?: boolean;
}) {
  const icon = event.discipline
    ? disciplineStyles[event.discipline].icon
    : "border border-line-2 bg-chip text-muted";
  const countdown = event.achieved ? null : goalCountdown(today, event.date);
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-[14px] border border-line bg-bg p-3 transition-colors hover:bg-surface-2"
    >
      {compact ? null : (
        <span className="flex w-11 shrink-0 flex-col items-center leading-none">
          <span className="font-display text-[20px] font-medium tabular">
            {Number(event.date.slice(8, 10))}
          </span>
          <span className="text-caption text-muted">{shortMonth(event.date)}</span>
        </span>
      )}
      <span
        aria-hidden
        className={`inline-flex size-9 shrink-0 items-center justify-center rounded-full ${icon}`}
      >
        {event.achieved ? (
          <CircleCheck size={16} strokeWidth={1.75} />
        ) : (
          <Flag size={16} strokeWidth={1.75} />
        )}
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate font-medium">{event.title}</span>
        <span className="truncate text-caption text-muted">
          {event.athleteName}
          {event.detail ? ` · ${event.detail}` : ""}
        </span>
      </span>
      {event.achieved ? (
        <Badge tone="ok">Atteint</Badge>
      ) : countdown ? (
        <Badge tone={countdown.overdue ? "warn" : "neutral"}>{countdown.label}</Badge>
      ) : null}
    </Link>
  );
}
