import {
  House,
  CalendarDays,
  Check,
  Clock,
  FileText,
  ListChecks,
  Coins,
  type LucideIcon,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense, type CSSProperties } from "react";

import { ListRow } from "@/components/blocks/list-row";
import { MonthGrid } from "@/components/blocks/month-grid";
import { NextSessionCard } from "@/components/blocks/next-session-card";
import { SessionDayList } from "@/components/blocks/session-day-list";
import { AgendaToolbar, periodLabel } from "@/components/blocks/agenda-toolbar";
import { WeekTimeGrid } from "@/components/blocks/week-time-grid";
import { PageBody, PageHeader, PageLoading, pageMainClass } from "@/components/layout/page-header";
import { Card, CardEmpty } from "@/components/ui/card";
import { TaskList } from "@/components/blocks/task-list";
import { KpiCard, KpiGrid, KpiListCard } from "@/components/ui/kpi-card";
import { StatTiles } from "@/components/ui/stat-tiles";
import { Avatar } from "@/components/ui/avatar";
import { FilterChips } from "@/components/ui/filter-chips";
import { currentWeekIndex, listActivePrograms } from "@/features/programs/queries";
import { monthActivity } from "@/domain/billing/invoices";
import { formatMoney, type Currency } from "@/domain/billing/money";
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
import { getDefaultVatRate } from "@/features/coach/legal-queries";
import { getCoachProfile } from "@/features/coach/profile";
import { moveSession } from "@/features/sessions/actions";
import { plannedIncome } from "@/features/sessions/prices";
import { listSessions } from "@/features/sessions/queries";
import { setTaskDone } from "@/features/tasks/actions";
import { editableTask } from "@/features/tasks/editable";
import { getDashboardTasks } from "@/features/tasks/queries";
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
  const weekIncome = paymentTotals(payments, weekStart, addDays(weekStart, 6));
  const monthIncome = paymentTotals(payments, monthStart, today);
  // Ce que les séances de la semaine pourraient rapporter (D-52) : leurs prix, payées ou non, sauf
  // les dates comprises dans un forfait déjà réglé.
  const planned = plannedIncome(
    sessions,
    weekStart,
    addDays(weekStart, 6),
    vatRate,
    (session, date) =>
      session.kind === "individual" && coveredByPackage(covers, session.athletes[0]?.id, date),
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
  const activity = monthActivity(invoices, today);

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
        <div className="grid gap-3 lg:col-span-12 lg:grid-cols-3">
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
          />
          {/* Même hauteur que la carte « Prochaine séance ». */}
          <div className="lg:col-span-2 lg:[&>section]:h-full">
            <KpiGrid label="Chiffres clés" columns={2} equal>
              <KpiListCard
                href="/coach/taches"
                color="strength"
                icon={ListChecks}
                value={String(tasks.openCount)}
                label={tasks.openCount > 1 ? "tâches à faire" : "tâche à faire"}
                shortLabel="Tâches"
              >
                <TaskList
                  tasks={tasks.items.map((task) => ({
                    id: task.id,
                    title: task.title,
                    sub: [dueLabel(task.dueOn, today), task.athleteName]
                      .filter(Boolean)
                      .join(" · "),
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
              </KpiListCard>
              {/* CA de la semaine (D-36) : l'argent réellement reçu, à la date du paiement. */}
              <KpiCard
                compact
                href="/coach/comptabilite"
                color="ok"
                icon={Coins}
                value={money(weekIncome.inclCents)}
                shortLabel="Encaissé"
                mobileLines={[
                  "cette semaine",
                  plural(weekIncome.count, "paiement"),
                  ...(planned.count > 0 ? [`${money(planned.inclCents)} prévus`] : []),
                ]}
                label="encaissés cette semaine"
                detail={[
                  `${money(weekIncome.exclCents)} HTVA`,
                  plural(weekIncome.count, "paiement"),
                  planned.count > 0
                    ? `${money(planned.inclCents)} prévus (${plural(planned.count, "séance")})`
                    : null,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              />
            </KpiGrid>
          </div>
        </div>

        <section
          aria-labelledby="agenda-title"
          // Téléphone (demande d'Antonino du 26/10) : pas de carte autour de l'agenda, la grille prend
          // toute la largeur de l'écran ; ordinateur : la carte.
          // Téléphone (26/10) : pas de carte, mais une bande de couleur d'un bord à l'autre qui sépare
          // l'agenda des autres sections ; la grille prend toute la largeur. Ordinateur : la carte.
          className="flex min-w-0 flex-col gap-3.5 rounded-card border border-line bg-surface p-[18px] max-lg:-mx-4 max-lg:rounded-none max-lg:border-x-0 max-lg:px-4 max-lg:py-4 lg:col-span-8"
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

        {/* À droite de l'agenda (29/10/2026) : Séances à venir, Programmes en cours et Activité
            financière, empilées dans une colonne qui prend exactement la hauteur de l'agenda (la
            liste des séances défile si besoin). Téléphone : les cartes se suivent. */}
        <div className="lg:relative lg:col-span-4">
          <div className="flex flex-col gap-4 lg:absolute lg:inset-0">
            <Card
              id="upcoming-title"
              title="Séances à venir"
              action={{ href: `${orgBase}/agenda?vue=liste`, label: "Voir tout" }}
              className="lg:min-h-0 lg:flex-1 lg:overflow-y-auto"
            >
              {upcoming.length === 0 ? (
                <CardEmpty icon={CalendarDays}>
                  Aucune séance prévue dans les 30 prochains jours.
                </CardEmpty>
              ) : (
                // Groupées par jour (barre or aujourd'hui, ambre demain), comme la vue Liste de l'Agenda.
                <SessionDayList
                  blocks={upcoming}
                  today={today}
                  sessionHref={(id) => `${orgBase}/agenda/seances/${id}`}
                />
              )}
            </Card>

            <Card
              id="programs-title"
              title="Programmes en cours"
              action={{ href: "/coach/programmes", label: "Voir tous les programmes" }}
              className="lg:shrink-0"
            >
              {programs.length === 0 ? (
                <CardEmpty icon={FileText}>
                  Aucun programme pour l&apos;instant. Chaque programme apparaîtra ici avec son
                  sportif et sa progression (semaine 6 sur 12…).
                </CardEmpty>
              ) : (
                <div className="flex flex-col">
                  {programs.slice(0, 3).map((program) => {
                    const week = currentWeekIndex(program.startDate, program.weeksCount, today);
                    return (
                      <ListRow
                        key={program.id}
                        href={`${orgBase}/sportifs/${program.athleteId}?onglet=agenda`}
                        leading={
                          <Avatar name={program.athleteName} photoPath={program.photoPath} />
                        }
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
              className="lg:shrink-0"
            >
              <div className="flex flex-col">
                <ListRow
                  leading={<FinanceIcon icon={FileText} color="accent" />}
                  title={`${activity.sent.count} ${activity.sent.count > 1 ? "factures envoyées" : "facture envoyée"}`}
                  sub="Ce mois-ci"
                  trailing={
                    <FinanceAmount currency={current.currency} cents={activity.sent.cents} />
                  }
                />
                <ListRow
                  leading={<FinanceIcon icon={Check} color="ok" />}
                  title={`${monthIncome.count} ${monthIncome.count > 1 ? "paiements reçus" : "paiement reçu"}`}
                  sub="Ce mois-ci"
                  trailing={
                    <FinanceAmount currency={current.currency} cents={monthIncome.inclCents} />
                  }
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
                    <FinanceAmount
                      currency={current.currency}
                      cents={activity.pending.cents}
                      late={activity.pending.overdue > 0}
                    />
                  }
                />
              </div>
            </Card>
          </div>
        </div>
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
function FinanceAmount({
  cents,
  currency,
  late = false,
}: {
  cents: number;
  currency: Currency;
  late?: boolean;
}) {
  return (
    <span className={`text-[15px] font-semibold tabular ${late ? "text-warn" : ""}`}>
      {formatMoney(cents, currency)}
    </span>
  );
}
