import { House, CalendarDays, FileText } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense, type ReactNode } from "react";

import { MonthGrid } from "@/components/blocks/month-grid";
import { NextSessionCard } from "@/components/blocks/next-session-card";
import { SwipeNav } from "@/components/blocks/swipe-nav";
import { AgendaToolbar, periodLabel } from "@/components/blocks/agenda-toolbar";
import { WeekGrid } from "@/components/blocks/week-grid";
import { PageBody, PageHeader, PageLoading, pageMainClass } from "@/components/layout/page-header";
import { Card, CardEmpty } from "@/components/ui/card";
import { TaskList } from "@/components/blocks/task-list";
import { Avatar } from "@/components/ui/avatar";
import { FilterChips } from "@/components/ui/filter-chips";
import { currentWeekIndex, listActivePrograms } from "@/features/programs/queries";
import { monthActivity } from "@/domain/billing/invoices";
import { describeTotal, formatMoney, type ByCurrency, type Currency } from "@/domain/billing/money";
import { coveredByPackage, paymentTotals } from "@/domain/billing/payments";
import { monthGrid, monthLabel, shiftMonth } from "@/features/agenda/calendar";
import { addDays } from "@/features/agenda/items";
import {
  formatHours,
  layoutDays,
  layoutWeek,
  withHours,
  mondayOf,
  parseDay,
  type WeekBlock,
} from "@/features/agenda/week";
import { requireCoach } from "@/features/auth/guards";
import { listPackageCovers, listPayments } from "@/features/billing/payment-queries";
import { listMonthInvoices } from "@/features/billing/queries";
import { getConverter } from "@/features/coach/currency-queries";
import { getDefaultVatRate } from "@/features/coach/legal-queries";
import { getCoachProfile } from "@/features/coach/profile";
import { moveSession } from "@/features/sessions/actions";
import { plannedIncome } from "@/features/sessions/prices";
import { listSessions } from "@/features/sessions/queries";
import { setTaskDone } from "@/features/tasks/actions";
import { editableTask } from "@/features/tasks/editable";
import { getDashboardTasks } from "@/features/tasks/queries";
import { DISCIPLINES, disciplineLabels } from "@/domain/training/discipline";
import { dayShortLabel, dueLabel, nowTimeInBrussels, todayIsoInBrussels } from "@/lib/format";

import { CreateMenu } from "./create-menu";

export const metadata: Metadata = {
  title: "Tableau de bord",
};

// Tableau de bord du coach (prompt Claude Design §7.2, retouché par Antonino le 23/10), avec les
// VRAIES données : coachings du jour, heures de la semaine, tâches à cocher (D-35), CA de la semaine
// (paiements reçus, D-36), agenda, séances à venir, activité financière du mois. Les messages non lus
// sont une pastille sur « Messages » et sur la cloche. Les modules pas encore
// construits (programmes) affichent ce qu'ils contiennent réellement : rien pour l'instant (D-32).
export default function CoachHomePage({ searchParams }: PageProps<"/coach">) {
  return (
    <main className={pageMainClass}>
      {/* La session et la semaine se lisent à la requête : derrière Suspense (Cache Components). */}
      <Suspense fallback={<PageLoading />}>
        {searchParams.then((query) => (
          <Dashboard
            view={query.vue === "jour" || query.vue === "mois" ? query.vue : "semaine"}
            date={typeof query.date === "string" ? query.date : undefined}
            kind={
              query.type === "individuelles" || query.type === "collectives" ? query.type : "toutes"
            }
            fullWeek={query.jours === "7"}
          />
        ))}
      </Suspense>
    </main>
  );
}

type AgendaView = "semaine" | "jour" | "mois";

const longDay = new Intl.DateTimeFormat("fr-BE", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: "UTC",
});
const dayAndMonth = new Intl.DateTimeFormat("fr-BE", {
  day: "numeric",
  month: "long",
  timeZone: "UTC",
});
const utc = (day: string) => new Date(`${day}T00:00:00Z`);
const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

// « Semaine du 19 au 25 octobre », ou « du 28 septembre au 4 octobre » à cheval sur deux mois.
function weekTitle(monday: string): string {
  const sunday = addDays(monday, 6);
  const sameMonth = monday.slice(0, 7) === sunday.slice(0, 7);
  const from = sameMonth ? String(utc(monday).getUTCDate()) : dayAndMonth.format(utc(monday));
  return `Semaine du ${from} au ${dayAndMonth.format(utc(sunday))}`;
}

// Point de couleur de chaque discipline (légende de l'agenda).
const disciplineFill = {
  running: "bg-run-fill",
  strength: "bg-strength-fill",
  hyrox: "bg-hyrox-fill",
  hybrid: "bg-hybrid-fill",
} as const;

// Discipline écrite dans sa couleur (petites cartes des séances à venir).
const disciplineText = {
  running: "text-run",
  strength: "text-strength",
  hyrox: "text-hyrox",
  hybrid: "text-hybrid",
} as const;

// « Lundi », « Mardi »… pour les séances à venir (jamais « Demain », demande d'Antonino du 01/11).
const weekdayFormat = new Intl.DateTimeFormat("fr-BE", { weekday: "long", timeZone: "UTC" });
const weekdayName = (date: string) => capitalize(weekdayFormat.format(utc(date)));

const plural = (count: number, word: string) => `${count} ${word}${count > 1 ? "s" : ""}`;

const toMinutes = (time: string) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5));

// Filtre de l'agenda (demande d'Antonino du 26/10), dans cet ordre : Toutes, Individuelles,
// Collectives. Il ne touche que l'agenda : les chiffres clés comptent toujours toutes les séances.
type SessionKindFilter = "toutes" | "individuelles" | "collectives";
const kindFilters: { key: SessionKindFilter; label: string }[] = [
  { key: "toutes", label: "Toutes" },
  { key: "individuelles", label: "Individuelles" },
  { key: "collectives", label: "Collectives" },
];

async function Dashboard({
  view,
  date: dateParam,
  kind,
  fullWeek,
}: {
  view: AgendaView;
  date: string | undefined;
  kind: SessionKindFilter;
  // Téléphone : semaine entière (7 colonnes étroites) plutôt que 3 jours (?jours=7).
  fullWeek: boolean;
}) {
  // Garde-fou serveur : connecté ET membre actif d'une organisation, sinon redirection.
  const { user, memberships } = await requireCoach();
  const current = memberships[0];
  const orgBase = `/coach/o/${current.organizationId}`;
  const today = todayIsoInBrussels();
  // Paiements depuis le lundi ou le 1er du mois (le plus ancien des deux) : semaine et mois.
  const monthStart = `${today.slice(0, 7)}-01`;
  const weekStart = mondayOf(today);
  const [profile, sessions, tasks, invoices, payments, programs, covers, vatRate] =
    await Promise.all([
      getCoachProfile(user),
      listSessions(current.organizationId),
      getDashboardTasks(current.organizationId),
      listMonthInvoices(current.organizationId, today),
      listPayments(current.organizationId, weekStart < monthStart ? weekStart : monthStart),
      listActivePrograms(current.organizationId),
      listPackageCovers(current.organizationId),
      getDefaultVatRate(current.organizationId),
    ]);
  // Montants dans la devise de l'organisation (D-69).
  const money = (cents: number) => formatMoney(cents, current.currency);
  // Après un changement de devise (D-70) : les montants d'avant sont convertis, total « ≈ ».
  const convert = await getConverter(current);
  const weekIncome = paymentTotals(payments, weekStart, addDays(weekStart, 6), convert);
  const monthIncome = paymentTotals(payments, monthStart, today, convert);
  // Ce que les séances de la semaine pourraient rapporter (D-52) : leurs prix, payées ou non, sauf
  // les dates comprises dans un forfait déjà réglé.
  const planned = plannedIncome(
    sessions,
    weekStart,
    addDays(weekStart, 6),
    vatRate,
    (session, date) =>
      session.kind === "individual" && coveredByPackage(covers, session.athletes[0]?.id, date),
    convert,
  );

  const now = nowTimeInBrussels();
  const nowMinutes = toMinutes(now);

  // Chiffres clés : toujours aujourd'hui et la semaine en cours, quelle que soit la période affichée.
  const todayBlocks = layoutDays(sessions, [today]).days[0].blocks;
  const doneToday = todayBlocks.filter((block) => block.end <= nowMinutes).length;
  const thisWeek = layoutWeek(sessions, mondayOf(today));
  const weekSessions = thisWeek.days.reduce((sum, day) => sum + day.blocks.length, 0);

  // Agenda : une seule date dans l'adresse (?date=), sa semaine, sa journée ou son mois (?vue=).
  const date = parseDay(dateParam, today);
  const monday = mondayOf(date);
  const month = date.slice(0, 7);
  const agendaSessions = sessions.filter(
    (session) =>
      kind === "toutes" ||
      (kind === "collectives" ? session.kind === "group" : session.kind === "individual"),
  );
  // Heures affichées : celles des Paramètres (D-57), élargies par une séance hors plage.
  const layout = withHours(
    view === "jour" ? layoutDays(agendaSessions, [date]) : layoutWeek(agendaSessions, monday),
    profile.preferences.agendaFirstHour,
    profile.preferences.agendaLastHour,
  );
  const monthDates = monthGrid(month)
    .flat()
    .filter((day) => day.inMonth)
    .map((day) => day.iso);
  const monthLayout = view === "mois" ? layoutDays(agendaSessions, monthDates) : null;
  const monthBlocks = new Map<string, WeekBlock[]>(
    monthLayout ? monthLayout.days.map((day) => [day.date, day.blocks]) : [],
  );

  const viewHref = (
    target: AgendaView,
    at: string = date,
    nextKind: SessionKindFilter = kind,
    nextFullWeek: boolean = fullWeek,
  ) => {
    const search = new URLSearchParams();
    if (target !== "semaine" || at !== today) {
      search.set("vue", target);
      search.set("date", at);
    }
    if (target === "semaine" && nextFullWeek) search.set("jours", "7");
    if (nextKind !== "toutes") search.set("type", nextKind);
    const text = search.toString();
    return text ? `/coach?${text}` : "/coach";
  };
  const step = (direction: 1 | -1) =>
    view === "jour"
      ? addDays(date, direction)
      : view === "mois"
        ? `${shiftMonth(month, direction)}-01`
        : addDays(monday, 7 * direction);
  const agendaTitle =
    view === "jour"
      ? capitalize(longDay.format(utc(date)))
      : view === "mois"
        ? capitalize(monthLabel(month))
        : weekTitle(monday);

  // Séances à venir : les 5 prochaines dates (aujourd'hui après l'heure actuelle, puis 30 jours).
  const upcoming = layoutDays(
    sessions,
    Array.from({ length: 31 }, (_, i) => addDays(today, i)),
  )
    .days.flatMap((day) => day.blocks)
    .filter((block) => block.date > today || block.start >= nowMinutes)
    .slice(0, 5);
  const activity = monthActivity(invoices, today, convert);

  // Prochaine séance (carte or, 29/10/2026) : la plus proche, avec son rang dans sa journée.
  const next = upcoming[0] ?? null;
  const nextDay = next ? layoutDays(sessions, [next.date]).days[0].blocks : [];
  const nextSession = next ? sessions.find((session) => session.id === next.sessionId) : undefined;
  const nextAthlete = next?.individual ? nextSession?.athletes[0] : undefined;

  return (
    <>
      <PageHeader
        // Le nom de la page, comme les autres pages (demande d'Antonino du 29/10/2026 : plus de
        // « Bonjour » ni de date).
        title="Tableau de bord"
        icon={House}
        actions={<CreateMenu orgBase={orgBase} />}
        inline
      />
      <PageBody grid>
        {/* Rangée du haut (29/10/2026) : la carte or « Prochaine séance » tout à gauche, puis les
            tâches et l'encaissé de la semaine (demande d'Antonino du 26/10). */}
        <div className="grid gap-4 md:grid-cols-3 lg:col-span-12">
          <NextSessionCard
            block={next}
            rank={
              next
                ? {
                    index: nextDay.findIndex((block) => block.key === next.key) + 1,
                    total: nextDay.length,
                  }
                : null
            }
            dayLabel={next ? dayShortLabel(next.date, today) : ""}
            today={today}
            nowMinutes={nowMinutes}
            sessionHref={next ? `${orgBase}/agenda/seances/${next.sessionId}` : null}
            messageHref={nextAthlete ? `/coach/messages?sportif=${nextAthlete.id}` : null}
            location={nextSession?.location ?? null}
            person={
              nextAthlete
                ? { name: nextAthlete.name, photoPath: nextAthlete.photoPath ?? null }
                : null
            }
          />
          {/* Tâches à faire (D-35) : le compteur en violet, les tâches à cocher (maquette v6, D-77). */}
          <section
            aria-labelledby="tasks-title"
            className="flex min-w-0 flex-col rounded-[20px] border border-line bg-surface p-5"
          >
            <div className="mb-2 flex items-center justify-between gap-3">
              <h2 id="tasks-title" className="text-[13px] font-medium">
                <Link
                  href="/coach/taches"
                  aria-label={`${tasks.openCount} ${tasks.openCount > 1 ? "tâches à faire" : "tâche à faire"}`}
                  className="hover:underline"
                >
                  Tâches à faire
                </Link>
              </h2>
              <span
                aria-hidden
                className="grid h-5 min-w-5 place-items-center rounded-md bg-violet-soft-2 px-1.5 text-[11px] font-medium text-violet-text tabular"
              >
                {tasks.openCount}
              </span>
            </div>
            <TaskList
              tasks={tasks.items.map((task) => ({
                id: task.id,
                title: task.title,
                sub: [dueLabel(task.dueOn, today), task.athleteName].filter(Boolean).join(" · "),
                urgent: task.priority === "high",
                checked: task.done,
                label: `Tâche faite : ${task.title}`,
                edit: editableTask(task),
              }))}
              action={setTaskDone.bind(null, current.organizationId)}
              empty="Aucune tâche à faire"
              toasts={{ checked: "Tâche terminée.", unchecked: "Tâche rouverte." }}
              removeOnToggle
            />
          </section>
          {/* CA de la semaine (D-36) : l'argent réellement reçu, à la date du paiement. */}
          <Link
            href="/coach/comptabilite"
            aria-label={`${
              describeTotal(weekIncome.inclCents, weekIncome.byCurrency, current.currency).value
            } encaissés cette semaine`}
            className="flex min-w-0 flex-col justify-between gap-5 rounded-[20px] border border-line bg-surface p-5 transition-[scale] duration-150 active:scale-[.98]"
          >
            <div>
              <span className="text-[11px] font-medium tracking-[0.08em] text-muted uppercase">
                Encaissés cette semaine
              </span>
              <div className="mt-3 text-[26px] leading-none font-semibold tracking-tight whitespace-nowrap tabular">
                {describeTotal(weekIncome.inclCents, weekIncome.byCurrency, current.currency).value}
              </div>
              <p className="mt-2.5 text-[12px] text-muted">
                {`${money(weekIncome.exclCents)} HTVA`} · {plural(weekIncome.count, "paiement")}
              </p>
            </div>
            {planned.count > 0 ? (
              <span className="flex h-6 items-center self-start rounded-md bg-ok-soft px-2 text-[11px] font-medium text-ok tabular">
                {money(planned.inclCents)} prévus ({plural(planned.count, "séance")})
              </span>
            ) : null}
          </Link>
        </div>

        <section
          aria-labelledby="agenda-title"
          // Agenda en grille (maquette v6, D-77) : une carte sur ordinateur comme sur téléphone.
          className="flex min-w-0 flex-col gap-4 rounded-[20px] border border-line bg-surface p-5 lg:col-span-8"
        >
          <div>
            <h2 id="agenda-title" className="text-[13px] font-medium">
              {agendaTitle}
            </h2>
            {view === "semaine" ? (
              <p className="mt-0.5 text-[12px] text-muted">
                {thisWeek.totalMinutes > 0 ? formatHours(thisWeek.totalMinutes) : "0 h"} de coaching
                cette semaine · {plural(weekSessions, "séance")}
              </p>
            ) : null}
          </div>
          <AgendaToolbar
            titleId="agenda-period"
            srTitle="Navigation de l'agenda"
            label={
              view === "jour"
                ? capitalize(longDay.format(utc(date)))
                : view === "mois"
                  ? capitalize(monthLabel(month))
                  : periodLabel(monday, addDays(monday, 6))
            }
            // Téléphone : pas de période à côté des flèches, le titre de la carte la donne déjà
            // (« Semaine du 26 octobre au 1 novembre ») et la place manque à côté du bouton « Vue ».
            shortLabel=""
            prevHref={viewHref(view, step(-1))}
            nextHref={viewHref(view, step(1))}
            viewOptions={[
              {
                key: "jour",
                label: "Aujourd'hui",
                href: viewHref("jour", today),
                selected: view === "jour",
              },
              {
                key: "3jours",
                label: "3 jours",
                href: viewHref("semaine", date, kind, false),
                selected: view === "semaine" && !fullWeek,
              },
              {
                key: "semaine",
                label: "Semaine",
                href: viewHref("semaine", date, kind, true),
                selected: view === "semaine" && fullWeek,
              },
              { key: "mois", label: "Mois", href: viewHref("mois"), selected: view === "mois" },
            ]}
            desktopViews={[
              { href: viewHref("jour", today), label: "Aujourd'hui", active: view === "jour" },
              { href: viewHref("semaine"), label: "Semaine", active: view === "semaine" },
              { href: viewHref("mois"), label: "Mois", active: view === "mois" },
            ]}
            extra={
              <Link
                href={`${orgBase}/agenda`}
                className="ml-1 shrink-0 text-[12px] text-violet-text transition-opacity duration-150 hover:opacity-80 max-lg:hidden"
              >
                Agenda →
              </Link>
            }
          />
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <FilterChips
              size="sm"
              label="Filtrer l'agenda"
              options={kindFilters.map((filter) => ({
                href: viewHref(view, date, filter.key),
                label: filter.label,
                active: kind === filter.key,
              }))}
            />
            {/* Couleur de chaque discipline (légende de l'agenda). */}
            <ul
              aria-label="Disciplines"
              className="flex flex-wrap gap-3 text-[11px] text-muted lg:ml-auto"
            >
              {DISCIPLINES.map((discipline) => (
                <li key={discipline} className="flex items-center gap-1.5">
                  <span
                    aria-hidden
                    className={`size-1.5 rounded-full ${disciplineFill[discipline]}`}
                  />
                  {disciplineLabels[discipline]}
                </li>
              ))}
            </ul>
          </div>
          {/* Téléphone : on change de jour, de semaine ou de mois en glissant le doigt (01/11). En vue
              3 jours, la grille défile d'abord dans la semaine ; depuis lundi, la semaine précédente
              s'ouvre sur son dimanche. */}
          <SwipeNav
            prevHref={
              view === "semaine" && !fullWeek
                ? viewHref("semaine", addDays(monday, -1))
                : viewHref(view, step(-1))
            }
            nextHref={viewHref(view, step(1))}
            edges={view === "semaine" && !fullWeek}
          >
            {view === "mois" ? (
              <MonthGrid
                month={month}
                monthBlocks={monthBlocks}
                today={today}
                dayHref={(day) => viewHref("jour", day)}
              />
            ) : (
              <WeekGrid
                layout={layout}
                today={today}
                now={now}
                single={view === "jour"}
                fullWeek={fullWeek}
                creatable
                focus={view === "semaine" && date !== monday && date !== today ? date : undefined}
                onMove={moveSession.bind(null, current.organizationId)}
                sessionHref={(id) => `${orgBase}/agenda/seances/${id}`}
              />
            )}
          </SwipeNav>
          {/* Aujourd'hui et la semaine en cours, quelle que soit la période affichée (26/10). */}
          <div className="flex flex-wrap gap-x-8 gap-y-2 border-t border-line-soft pt-3">
            <p>
              <span className="text-[13px] font-medium tabular">{todayBlocks.length}</span>{" "}
              <span className="text-[12px] text-muted">
                {todayBlocks.length > 1 ? "coachings aujourd'hui" : "coaching aujourd'hui"} ·{" "}
                {todayBlocks.length === 0
                  ? "rien de prévu"
                  : `${plural(doneToday, "terminé")}, ${todayBlocks.length - doneToday} à venir`}
              </span>
            </p>
            <p>
              <span className="text-[13px] font-medium tabular">
                {thisWeek.totalMinutes > 0 ? formatHours(thisWeek.totalMinutes) : "0 h"}
              </span>{" "}
              <span className="text-[12px] text-muted">
                de coaching cette semaine · {plural(weekSessions, "séance")}
              </span>
            </p>
          </div>
        </section>

        {/* À droite de l'agenda (29/10/2026) : Séances à venir, Programmes en cours et Activité
            financière, empilées dans une colonne qui prend exactement la hauteur de l'agenda (la
            liste des séances défile si besoin). Téléphone : les cartes se suivent. */}
        <div className="lg:relative lg:col-span-4">
          <div className="flex flex-col gap-4 lg:absolute lg:inset-0">
            <Card
              id="upcoming-title"
              title="Séances à venir"
              action={{ href: `${orgBase}/agenda?vue=liste`, label: "Voir tout" }}
              compact
              className="lg:min-h-0 lg:flex-1 lg:overflow-y-auto"
            >
              {upcoming.length === 0 ? (
                <CardEmpty icon={CalendarDays}>
                  Aucune séance prévue dans les 30 prochains jours.
                </CardEmpty>
              ) : (
                // Petites cartes (maquette v6, D-77) : le jour (« Aujourd'hui » ou son nom) et l'heure, la
                // discipline écrite dans sa couleur ; la plus proche, teintée de violet, « Prochaine ».
                <ul className="mt-1.5 flex flex-col gap-2.5">
                  {upcoming.map((block, index) => (
                    <li key={block.key}>
                      <Link
                        href={`${orgBase}/agenda/seances/${block.sessionId}`}
                        className={`block rounded-2xl border px-3 py-2.5 transition-colors duration-150 ${
                          index === 0
                            ? "border-violet-line bg-violet-soft"
                            : "border-line-soft bg-surface-2 hover:border-line"
                        }`}
                      >
                        <span className="flex items-baseline justify-between gap-2 leading-snug">
                          <span className="flex items-center gap-2">
                            <span className="text-[13px] font-semibold tabular">
                              {block.date === today ? "Aujourd'hui" : weekdayName(block.date)}{" "}
                              {block.label.slice(0, 5)}
                            </span>
                            {index === 0 ? (
                              <span className="-my-1 grid h-5 place-items-center rounded-[10px] bg-accent px-2 text-[11px] font-medium text-on-accent">
                                Prochaine
                              </span>
                            ) : null}
                          </span>
                          {block.discipline ? (
                            <span className={`text-[10px] ${disciplineText[block.discipline]}`}>
                              {disciplineLabels[block.discipline]}
                            </span>
                          ) : null}
                        </span>
                        <span className="mt-px block truncate text-[12px] leading-snug text-muted">
                          {block.title} ·{" "}
                          {block.individual ? block.subtitle : `Collective · ${block.subtitle}`}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card
              id="programs-title"
              title="Programmes en cours"
              action={{ href: "/coach/programmes", label: "Voir tous les programmes" }}
              compact
              className="lg:shrink-0"
            >
              {programs.length === 0 ? (
                <CardEmpty icon={FileText}>
                  Aucun programme pour l&apos;instant. Chaque programme apparaîtra ici avec son
                  sportif et sa progression (semaine 6 sur 12…).
                </CardEmpty>
              ) : (
                <ul className="-mt-1 divide-y divide-line-soft">
                  {programs.slice(0, 3).map((program, index) => {
                    const week = currentWeekIndex(program.startDate, program.weeksCount, today);
                    return (
                      <li key={program.id}>
                        <Link
                          href={`${orgBase}/sportifs/${program.athleteId}?onglet=agenda`}
                          className="flex items-center gap-3 py-2.5"
                        >
                          {/* Le programme le plus récent : avatar cerclé de violet. */}
                          <span
                            className={`inline-flex shrink-0 rounded-full ${
                              index === 0
                                ? "outline outline-[1.5px] outline-offset-1 outline-violet"
                                : ""
                            }`}
                          >
                            <Avatar
                              name={program.athleteName}
                              photoPath={program.photoPath}
                              size="2xs"
                            />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[13px] font-medium">
                              {program.athleteName}
                            </span>
                            <span className="block truncate text-[12px] text-muted">
                              {program.title}
                            </span>
                          </span>
                          <span className="flex shrink-0 flex-col items-end gap-1.5">
                            <span className="text-[11px] text-muted tabular">
                              Sem. {week}/{program.weeksCount}
                            </span>
                            <span
                              aria-hidden
                              className="h-[3px] w-12 overflow-hidden rounded-full bg-chip"
                            >
                              <span
                                className="block h-full rounded-full bg-violet"
                                style={{ width: `${(week / program.weeksCount) * 100}%` }}
                              />
                            </span>
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Card>

            <Card
              id="finance-title"
              title="Activité financière"
              action={{ href: "/coach/facturation", label: "Voir tout" }}
              compact
              className="lg:shrink-0"
            >
              <ul className="-mt-1 divide-y divide-line-soft">
                <FinanceRow
                  title={`${activity.sent.count} ${activity.sent.count > 1 ? "factures envoyées" : "facture envoyée"}`}
                  sub="Ce mois-ci"
                  amount={
                    <FinanceAmount
                      currency={current.currency}
                      cents={activity.sent.cents}
                      byCurrency={activity.sent.byCurrency}
                    />
                  }
                />
                <FinanceRow
                  title={`${monthIncome.count} ${monthIncome.count > 1 ? "paiements reçus" : "paiement reçu"}`}
                  sub="Ce mois-ci"
                  amount={
                    <FinanceAmount
                      currency={current.currency}
                      cents={monthIncome.inclCents}
                      byCurrency={monthIncome.byCurrency}
                    />
                  }
                />
                <FinanceRow
                  title={`${activity.pending.count} paiement${activity.pending.count > 1 ? "s" : ""} en attente`}
                  sub={
                    activity.pending.overdue > 0
                      ? activity.pending.overdue === activity.pending.count
                        ? "En retard"
                        : `Dont ${activity.pending.overdue} en retard`
                      : activity.pending.count > 0
                        ? "Dans les délais"
                        : "Rien en attente"
                  }
                  late={activity.pending.overdue > 0}
                  amount={
                    <FinanceAmount
                      currency={current.currency}
                      cents={activity.pending.cents}
                      byCurrency={activity.pending.byCurrency}
                      late={activity.pending.overdue > 0}
                    />
                  }
                />
              </ul>
            </Card>
          </div>
        </div>
      </PageBody>
    </>
  );
}

// Ligne de l'activité financière (maquette v6) : intitulé et période à gauche, montant à droite ;
// période en rouge quand des paiements sont en retard.
function FinanceRow({
  title,
  sub,
  amount,
  late = false,
}: {
  title: string;
  sub: string;
  amount: ReactNode;
  late?: boolean;
}) {
  return (
    <li className="flex items-center justify-between gap-3 py-2.5">
      <span className="min-w-0">
        <span className="block text-[13px] text-text-2">{title}</span>
        <span className={`block text-[12px] ${late ? "text-alert" : "text-muted"}`}>{sub}</span>
      </span>
      {amount}
    </li>
  );
}

// Montant d'une ligne : en rouge quand des paiements sont en retard.
function FinanceAmount({
  cents,
  currency,
  byCurrency,
  late = false,
}: {
  cents: number;
  currency: Currency;
  // Montants par devise (D-70) : « ≈ » si le total mélange deux devises.
  byCurrency: ByCurrency;
  late?: boolean;
}) {
  return (
    <span
      className={`shrink-0 text-[13px] font-medium tabular ${late ? "text-alert" : "text-text"}`}
    >
      {describeTotal(cents, byCurrency, currency).value}
    </span>
  );
}
