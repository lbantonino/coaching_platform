import {
  CalendarDays,
  Check,
  Clock,
  FileText,
  ListChecks,
  Euro,
  type LucideIcon,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense, type CSSProperties } from "react";

import { ListRow } from "@/components/blocks/list-row";
import { MonthGrid } from "@/components/blocks/month-grid";
import { AgendaToolbar, periodLabel } from "@/components/blocks/agenda-toolbar";
import { WeekTimeGrid } from "@/components/blocks/week-time-grid";
import { PageBody, PageHeader, PageLoading, pageMainClass } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardEmpty } from "@/components/ui/card";
import { CheckList } from "@/components/ui/check-list";
import { KpiCard, KpiGrid, KpiListCard } from "@/components/ui/kpi-card";
import { StatTiles } from "@/components/ui/stat-tiles";
import { Avatar } from "@/components/ui/avatar";
import { FilterChips } from "@/components/ui/filter-chips";
import { currentWeekIndex, listActivePrograms } from "@/features/programs/queries";
import { formatEuros, monthActivity } from "@/domain/billing/invoices";
import { paymentTotals } from "@/domain/billing/payments";
import { disciplineLabels, disciplineTones } from "@/domain/training/discipline";
import { monthGrid, monthLabel, shiftMonth } from "@/features/agenda/calendar";
import { addDays } from "@/features/agenda/items";
import {
  formatHours,
  isoWeek,
  layoutDays,
  layoutWeek,
  mondayOf,
  parseDay,
  type WeekBlock,
} from "@/features/agenda/week";
import { requireCoach } from "@/features/auth/guards";
import { listPayments } from "@/features/billing/payment-queries";
import { listMonthInvoices } from "@/features/billing/queries";
import { getCoachProfile } from "@/features/coach/profile";
import { moveSession } from "@/features/sessions/actions";
import { listSessions } from "@/features/sessions/queries";
import { setTaskDone } from "@/features/tasks/actions";
import { getDashboardTasks } from "@/features/tasks/queries";
import {
  dayShortLabel,
  daysBetween,
  dueLabel,
  nowTimeInBrussels,
  todayIsoInBrussels,
} from "@/lib/format";

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
// Barre de l'agenda sur téléphone, vue d'un jour : « Lun 26 ».
const shortDayLabel = new Intl.DateTimeFormat("fr-BE", {
  weekday: "short",
  day: "numeric",
  timeZone: "UTC",
});
const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

// « Semaine du 19 au 25 octobre », ou « du 28 septembre au 4 octobre » à cheval sur deux mois.
function weekTitle(monday: string): string {
  const sunday = addDays(monday, 6);
  const sameMonth = monday.slice(0, 7) === sunday.slice(0, 7);
  const from = sameMonth ? String(utc(monday).getUTCDate()) : dayAndMonth.format(utc(monday));
  return `Semaine du ${from} au ${dayAndMonth.format(utc(sunday))}`;
}

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
  const [profile, sessions, tasks, invoices, payments, programs] = await Promise.all([
    getCoachProfile(user),
    listSessions(current.organizationId),
    getDashboardTasks(current.organizationId),
    listMonthInvoices(current.organizationId, today),
    listPayments(current.organizationId, weekStart < monthStart ? weekStart : monthStart),
    listActivePrograms(current.organizationId),
  ]);
  const weekIncome = paymentTotals(payments, weekStart, addDays(weekStart, 6));
  const monthIncome = paymentTotals(payments, monthStart, today);

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
  const layout =
    view === "jour" ? layoutDays(agendaSessions, [date]) : layoutWeek(agendaSessions, monday);
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
  const activity = monthActivity(invoices, today);

  return (
    <>
      <PageHeader
        title={`Bonjour ${profile.firstName ?? profile.displayName}`}
        subtitle={`${capitalize(longDay.format(utc(today)))} · semaine ${isoWeek(today)}`}
        actions={<CreateMenu orgBase={orgBase} />}
      />
      <PageBody grid>
        <div className="lg:col-span-12">
          {/* Demande d'Antonino du 26/10 : en haut, seulement ce que le coach doit voir d'abord, ses
              tâches et ce qu'il a encaissé cette semaine. Les chiffres de l'agenda passent sous le
              calendrier. */}
          <KpiGrid label="Chiffres clés" columns={2} equal>
            <KpiListCard
              href="/coach/taches"
              color="strength"
              icon={ListChecks}
              value={String(tasks.openCount)}
              label={tasks.openCount > 1 ? "tâches à faire" : "tâche à faire"}
              shortLabel="Tâches"
            >
              <CheckList
                items={tasks.items.map((task) => ({
                  id: task.id,
                  title: task.title,
                  sub: [dueLabel(task.dueOn, today), task.athleteName].filter(Boolean).join(" · "),
                  urgent: task.priority === "high",
                  checked: task.done,
                  label: `Tâche faite : ${task.title}`,
                }))}
                action={setTaskDone.bind(null, current.organizationId)}
                empty="Aucune tâche à faire"
                toasts={{ checked: "Tâche terminée.", unchecked: "Tâche rouverte." }}
                removeOnToggle
              />
            </KpiListCard>
            {/* CA de la semaine (D-36) : l'argent réellement reçu, à la date du paiement. */}
            <KpiCard
              compact
              href="/coach/comptabilite"
              color="ok"
              icon={Euro}
              value={formatEuros(weekIncome.inclCents)}
              shortLabel="Encaissé"
              mobileLines={["cette semaine", plural(weekIncome.count, "paiement")]}
              label="encaissés cette semaine"
              detail={`${formatEuros(weekIncome.exclCents)} HTVA · ${plural(weekIncome.count, "paiement")}`}
            />
          </KpiGrid>
        </div>

        <section
          aria-labelledby="agenda-title"
          // Téléphone (demande d'Antonino du 26/10) : pas de carte autour de l'agenda, la grille prend
          // toute la largeur de l'écran ; ordinateur : la carte.
          // Téléphone (26/10) : pas de carte, mais une bande de couleur d'un bord à l'autre qui sépare
          // l'agenda des autres sections ; la grille prend toute la largeur. Ordinateur : la carte.
          className="flex min-w-0 flex-col gap-3.5 rounded-card border border-line bg-surface p-[18px] max-lg:-mx-4 max-lg:rounded-none max-lg:border-x-0 max-lg:px-4 max-lg:py-4 lg:col-span-12"
        >
          {/* Barre façon Google Agenda (26/10) : flèches, mois, vue ; plus de grand titre. */}
          <AgendaToolbar
            titleId="agenda-title"
            srTitle={agendaTitle}
            label={
              view === "jour"
                ? capitalize(longDay.format(utc(date)))
                : view === "mois"
                  ? capitalize(monthLabel(month))
                  : periodLabel(monday, addDays(monday, 6))
            }
            shortLabel={
              view === "mois"
                ? periodLabel(`${month}-01`, `${month}-01`, true)
                : view === "semaine"
                  ? periodLabel(monday, addDays(monday, 6), true)
                  : capitalize(shortDayLabel.format(utc(date)).replace(".", ""))
            }
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
                className="ml-2 shrink-0 border-b border-line-2 pb-px text-[13px] text-muted transition-colors duration-150 hover:text-text max-lg:hidden"
              >
                Agenda →
              </Link>
            }
          />
          <FilterChips
            label="Filtrer l'agenda"
            options={kindFilters.map((filter) => ({
              href: viewHref(view, date, filter.key),
              label: filter.label,
              active: kind === filter.key,
            }))}
          />
          {view === "mois" ? (
            <MonthGrid
              month={month}
              monthBlocks={monthBlocks}
              today={today}
              dayHref={(day) => viewHref("jour", day)}
            />
          ) : (
            <WeekTimeGrid
              layout={layout}
              today={today}
              now={now}
              single={view === "jour"}
              fullWeek={fullWeek}
              fit
              creatable
              onMove={moveSession.bind(null, current.organizationId)}
              sessionHref={(id) => `${orgBase}/agenda/seances/${id}`}
            />
          )}
          {/* Sous le calendrier (26/10), comme sur la page Agenda : aujourd'hui et la semaine en
              cours, quelle que soit la période affichée. */}
          <StatTiles
            label="Chiffres de l'agenda"
            tiles={[
              {
                color: "accent",
                icon: CalendarDays,
                value: String(todayBlocks.length),
                text: todayBlocks.length > 1 ? "coachings aujourd'hui" : "coaching aujourd'hui",
                detail:
                  todayBlocks.length === 0
                    ? "rien de prévu"
                    : `${plural(doneToday, "terminé")}, ${todayBlocks.length - doneToday} à venir`,
              },
              {
                color: "run",
                icon: Clock,
                value: thisWeek.totalMinutes > 0 ? formatHours(thisWeek.totalMinutes) : "0 h",
                text: "de coaching cette semaine",
                detail: plural(weekSessions, "séance"),
              },
            ]}
          />
        </section>

        <Card
          id="upcoming-title"
          title="Séances à venir"
          action={{ href: "/coach/seances", label: "Voir tout" }}
          className="lg:col-span-4"
        >
          {upcoming.length === 0 ? (
            <CardEmpty icon={CalendarDays}>
              Aucune séance prévue dans les 30 prochains jours.
            </CardEmpty>
          ) : (
            // Groupées par jour (demande d'Antonino du 26/10) : « Aujourd'hui » marqué d'une barre
            // rouge, « Demain » d'une barre ambre, les jours suivants en gris ; chaque séance garde
            // la barre de son jour, pour voir d'un coup d'œil où s'arrête la journée.
            <div className="flex flex-col gap-3 pt-1">
              {[...new Set(upcoming.map((block) => block.date))].map((day) => {
                const gap = daysBetween(today, day);
                const bar = gap === 0 ? "bg-accent" : gap === 1 ? "bg-amber" : "bg-line-2";
                const text =
                  gap === 0 ? "text-accent-text" : gap === 1 ? "text-amber" : "text-muted";
                return (
                  <section key={day} aria-label={dayShortLabel(day, today)} className="flex gap-3">
                    <span aria-hidden className={`w-1 shrink-0 rounded-pill ${bar}`} />
                    <div className="flex min-w-0 flex-1 flex-col">
                      <h3
                        className={`text-[12px] font-semibold tracking-[0.04em] uppercase ${text}`}
                      >
                        {dayShortLabel(day, today)}
                      </h3>
                      {upcoming
                        .filter((block) => block.date === day)
                        .map((block) => (
                          <ListRow
                            key={block.key}
                            href={`${orgBase}/agenda/seances/${block.sessionId}`}
                            leading={
                              <span className="w-12 shrink-0 font-mono text-[14px] font-medium tabular">
                                {block.label.slice(0, 5)}
                              </span>
                            }
                            title={block.title}
                            sub={
                              block.individual ? block.subtitle : `Collective · ${block.subtitle}`
                            }
                            trailing={
                              block.discipline ? (
                                <Badge tone={disciplineTones[block.discipline]} dot={false}>
                                  {disciplineLabels[block.discipline]}
                                </Badge>
                              ) : null
                            }
                          />
                        ))}
                    </div>
                  </section>
                );
              })}
            </div>
          )}
        </Card>

        <Card
          id="programs-title"
          title="Programmes en cours"
          action={{ href: "/coach/programmes", label: "Programmes" }}
          className="lg:col-span-4"
        >
          {programs.length === 0 ? (
            <CardEmpty icon={FileText}>
              Aucun programme pour l&apos;instant. Chaque programme apparaîtra ici avec son sportif
              et sa progression (semaine 6 sur 12…).
            </CardEmpty>
          ) : (
            <div className="flex flex-col">
              {programs.slice(0, 4).map((program) => {
                const week = currentWeekIndex(program.startDate, program.weeksCount, today);
                return (
                  <ListRow
                    key={program.id}
                    href={`${orgBase}/sportifs/${program.athleteId}?onglet=agenda`}
                    leading={<Avatar name={program.athleteName} photoPath={program.photoPath} />}
                    title={program.athleteName}
                    sub={program.title}
                    trailing={
                      <span className="flex w-[84px] flex-col items-end gap-1">
                        <span className="font-mono text-[12px] text-muted tabular">
                          Sem. {week}/{program.weeksCount}
                        </span>
                        <span
                          aria-hidden
                          className="h-1.5 w-full overflow-hidden rounded-pill bg-bar"
                        >
                          <span
                            className="block h-full rounded-pill bg-accent"
                            style={{ width: `${(week / program.weeksCount) * 100}%` }}
                          />
                        </span>
                      </span>
                    }
                  />
                );
              })}
            </div>
          )}
        </Card>

        <Card
          id="finance-title"
          title="Activité financière"
          action={{ href: "/coach/facturation", label: "Voir tout" }}
          className="lg:col-span-4"
        >
          <div className="flex flex-col">
            <ListRow
              leading={<FinanceIcon icon={FileText} color="accent" />}
              title={`${activity.sent.count} ${activity.sent.count > 1 ? "factures envoyées" : "facture envoyée"}`}
              sub="Ce mois-ci"
              trailing={<FinanceAmount cents={activity.sent.cents} />}
            />
            <ListRow
              leading={<FinanceIcon icon={Check} color="ok" />}
              title={`${monthIncome.count} ${monthIncome.count > 1 ? "paiements reçus" : "paiement reçu"}`}
              sub="Ce mois-ci"
              trailing={<FinanceAmount cents={monthIncome.inclCents} />}
            />
            <ListRow
              leading={<FinanceIcon icon={Clock} color="amber" />}
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
              trailing={
                <FinanceAmount cents={activity.pending.cents} late={activity.pending.overdue > 0} />
              }
            />
          </div>
        </Card>
      </PageBody>
    </>
  );
}

// Pastille d'une ligne de l'activité financière : carré de 40 px teinté de sa couleur.
function FinanceIcon({
  icon: Icon,
  color,
}: {
  icon: LucideIcon;
  color: "accent" | "ok" | "amber";
}) {
  return (
    <span
      aria-hidden
      style={{ "--c": `var(--${color})` } as CSSProperties}
      className="inline-flex size-10 shrink-0 items-center justify-center rounded-[12px] bg-[color-mix(in_srgb,var(--c)_16%,transparent)] text-[var(--c)]"
    >
      <Icon size={18} strokeWidth={1.8} />
    </span>
  );
}

// Montant d'une ligne : en rouge quand des paiements sont en retard.
function FinanceAmount({ cents, late = false }: { cents: number; late?: boolean }) {
  return (
    <span className={`text-[15px] font-semibold tabular ${late ? "text-accent-text" : ""}`}>
      {formatEuros(cents)}
    </span>
  );
}
