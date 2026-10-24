import {
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
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
import { WeekTimeGrid } from "@/components/blocks/week-time-grid";
import { PageBody, PageHeader, PageLoading, pageMainClass } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { iconButtonClass } from "@/components/ui/button";
import { Card, CardEmpty } from "@/components/ui/card";
import { CheckList } from "@/components/ui/check-list";
import { KpiCard, KpiGrid, KpiListCard } from "@/components/ui/kpi-card";
import { SegmentedNav } from "@/components/ui/segmented";
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

const plural = (count: number, word: string) => `${count} ${word}${count > 1 ? "s" : ""}`;

const toMinutes = (time: string) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5));

async function Dashboard({
  view,
  date: dateParam,
}: {
  view: AgendaView;
  date: string | undefined;
}) {
  // Garde-fou serveur : connecté ET membre actif d'une organisation, sinon redirection.
  const { user, memberships } = await requireCoach();
  const current = memberships[0];
  const orgBase = `/coach/o/${current.organizationId}`;
  const today = todayIsoInBrussels();
  // Paiements depuis le lundi ou le 1er du mois (le plus ancien des deux) : semaine et mois.
  const monthStart = `${today.slice(0, 7)}-01`;
  const weekStart = mondayOf(today);
  const [profile, sessions, tasks, invoices, payments] = await Promise.all([
    getCoachProfile(user),
    listSessions(current.organizationId),
    getDashboardTasks(current.organizationId),
    listMonthInvoices(current.organizationId, today),
    listPayments(current.organizationId, weekStart < monthStart ? weekStart : monthStart),
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
  const layout = view === "jour" ? layoutDays(sessions, [date]) : layoutWeek(sessions, monday);
  const monthDates = monthGrid(month)
    .flat()
    .filter((day) => day.inMonth)
    .map((day) => day.iso);
  const monthLayout = view === "mois" ? layoutDays(sessions, monthDates) : null;
  const monthBlocks = new Map<string, WeekBlock[]>(
    monthLayout ? monthLayout.days.map((day) => [day.date, day.blocks]) : [],
  );
  const shown = monthLayout ?? layout;
  const shownCount = shown.days.reduce((sum, day) => sum + day.blocks.length, 0);

  const viewHref = (target: AgendaView, at: string = date) =>
    target === "semaine" && at === today ? "/coach" : `/coach?vue=${target}&date=${at}`;
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
          <KpiGrid label="Chiffres clés">
            <KpiCard
              href={`${orgBase}/agenda`}
              color="accent"
              icon={CalendarDays}
              value={String(todayBlocks.length)}
              label={todayBlocks.length > 1 ? "coachings aujourd'hui" : "coaching aujourd'hui"}
              detail={
                todayBlocks.length === 0
                  ? "Rien de prévu aujourd'hui"
                  : `${plural(doneToday, "terminé")} · ${todayBlocks.length - doneToday} à venir`
              }
            />
            <KpiCard
              href={`${orgBase}/agenda`}
              color="run"
              icon={Clock}
              value={thisWeek.totalMinutes > 0 ? formatHours(thisWeek.totalMinutes) : "0 h"}
              label="de coaching cette semaine"
              detail={`${plural(weekSessions, "séance")} ${weekSessions > 1 ? "planifiées" : "planifiée"}`}
            />
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
              href="/coach/comptabilite"
              color="ok"
              icon={Euro}
              value={formatEuros(weekIncome.inclCents)}
              label="encaissés cette semaine"
              detail={`${formatEuros(weekIncome.exclCents)} HTVA · ${plural(weekIncome.count, "paiement")}`}
            />
          </KpiGrid>
        </div>

        <section
          aria-labelledby="agenda-title"
          className="flex min-w-0 flex-col gap-3.5 rounded-card border border-line bg-surface p-[18px] lg:col-span-12"
        >
          {/* Téléphone : flèches sur la ligne du titre, vues et lien « Agenda » en dessous, pour que la
              carte entière tienne dans la hauteur de l'écran. Ordinateur : tout à droite du titre. */}
          <header className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 flex-col gap-1">
                <h2 id="agenda-title" className="font-display text-block font-semibold">
                  {agendaTitle}
                </h2>
                <p className="text-[13px] text-muted">
                  {plural(shownCount, "séance")}
                  {view === "mois" ? "" : ` · ${formatHours(shown.totalMinutes)} planifiées`}
                </p>
              </div>
              <nav
                aria-label="Changer de période"
                className="flex shrink-0 lg:hidden items-center gap-1.5"
              >
                <Link
                  href={viewHref(view, step(-1))}
                  scroll={false}
                  aria-label="Période précédente"
                  className={iconButtonClass()}
                >
                  <ChevronLeft aria-hidden size={18} strokeWidth={1.8} />
                </Link>
                <Link
                  href={viewHref(view, step(1))}
                  scroll={false}
                  aria-label="Période suivante"
                  className={iconButtonClass()}
                >
                  <ChevronRight aria-hidden size={18} strokeWidth={1.8} />
                </Link>
              </nav>
            </div>
            <div className="flex items-center justify-between gap-2 lg:justify-end">
              <nav aria-label="Changer de période" className="hidden lg:flex items-center gap-1.5">
                <Link
                  href={viewHref(view, step(-1))}
                  scroll={false}
                  aria-label="Période précédente"
                  className={iconButtonClass()}
                >
                  <ChevronLeft aria-hidden size={18} strokeWidth={1.8} />
                </Link>
                <Link
                  href={viewHref(view, step(1))}
                  scroll={false}
                  aria-label="Période suivante"
                  className={iconButtonClass()}
                >
                  <ChevronRight aria-hidden size={18} strokeWidth={1.8} />
                </Link>
              </nav>
              <SegmentedNav
                label="Vue de l'agenda"
                items={[
                  { href: viewHref("jour", today), label: "Aujourd'hui", active: view === "jour" },
                  { href: viewHref("semaine"), label: "Semaine", active: view === "semaine" },
                  { href: viewHref("mois"), label: "Mois", active: view === "mois" },
                ]}
              />
              <Link
                href={`${orgBase}/agenda`}
                className="shrink-0 border-b border-line-2 pb-px text-[13px] text-muted transition-colors duration-150 hover:text-text lg:ml-2"
              >
                Agenda →
              </Link>
            </div>
          </header>
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
              fit
              creatable
              onMove={moveSession.bind(null, current.organizationId)}
              sessionHref={(id) => `${orgBase}/agenda/seances/${id}`}
            />
          )}
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
            <div className="flex flex-col">
              {upcoming.map((block) => (
                <ListRow
                  key={block.key}
                  href={`${orgBase}/agenda/seances/${block.sessionId}`}
                  leading={
                    <span className="flex w-[84px] shrink-0 flex-col font-mono text-[12px] leading-tight tabular">
                      <span className="text-muted">{dayShortLabel(block.date, today)}</span>
                      <span className="text-[14px] font-medium">{block.label.slice(0, 5)}</span>
                    </span>
                  }
                  title={block.title}
                  sub={block.individual ? block.subtitle : `Collective · ${block.subtitle}`}
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
          )}
        </Card>

        <Card
          id="programs-title"
          title="Programmes en cours"
          action={{ href: "/coach/programmes", label: "Programmes" }}
          className="lg:col-span-4"
        >
          <CardEmpty icon={FileText}>
            Aucun programme pour l&apos;instant. Chaque programme apparaîtra ici avec son sportif et
            sa progression (semaine 6 sur 12…).
          </CardEmpty>
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
