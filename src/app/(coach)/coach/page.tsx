import { CalendarDays, FileText, House } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense, type ReactNode } from "react";

import { NextSessionCard } from "@/components/blocks/next-session-card";
import { TaskList } from "@/components/blocks/task-list";
import { UpcomingDays, type UpcomingDay } from "@/components/blocks/upcoming-days";
import { WeekIncomeBars, type IncomeDay } from "@/components/blocks/week-income-bars";
import { PageBody, PageHeader, PageLoading, pageMainClass } from "@/components/layout/page-header";
import { Avatar } from "@/components/ui/avatar";
import { Card, CardEmpty } from "@/components/ui/card";
import { monthActivity } from "@/domain/billing/invoices";
import { describeTotal, formatMoney, type ByCurrency, type Currency } from "@/domain/billing/money";
import { coveredByPackage, paymentTotals } from "@/domain/billing/payments";
import { addDays } from "@/features/agenda/items";
import { layoutDays, mondayOf } from "@/features/agenda/week";
import { requireCoach } from "@/features/auth/guards";
import { listPackageCovers, listPayments } from "@/features/billing/payment-queries";
import { listMonthInvoices } from "@/features/billing/queries";
import { getConverter } from "@/features/coach/currency-queries";
import { getDefaultVatRate } from "@/features/coach/legal-queries";
import { currentWeekIndex, listActivePrograms } from "@/features/programs/queries";
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

// Tableau de bord du coach (D-78, maquette tableau-de-bord-v7 validée par Antonino le 01/11), avec les
// VRAIES données. Plus d'agenda ici (il est sur la page Agenda) : en haut, Prochaine séance, Tâches à
// faire (D-35) et Encaissé cette semaine (D-36) ; en bas, Séances à venir sur deux colonnes (les deux
// prochains jours qui ont des séances), puis Programmes en cours au-dessus d'Activité financière.
// Ordinateur : tout tient dans l'écran, le bas des cartes aligné sur celui du menu ; les listes défilent
// dans leur carte si besoin. Téléphone : les cartes se suivent.
export default function CoachHomePage() {
  return (
    // Ordinateur : la page fait exactement la hauteur de l'écran (flex-none, sinon elle prendrait la hauteur
    // de son contenu) ; les cartes se partagent l'espace et leurs listes défilent dedans.
    <main className={`${pageMainClass} lg:h-dvh lg:flex-none`}>
      {/* La session se lit à la requête : derrière Suspense (Cache Components). */}
      <Suspense fallback={<PageLoading />}>
        <Dashboard />
      </Suspense>
    </main>
  );
}

const utc = (day: string) => new Date(`${day}T00:00:00Z`);
const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);
// « Lundi 2 novembre », et la pastille calendrier « lun. » / « 2 ».
const dayTitle = new Intl.DateTimeFormat("fr-BE", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: "UTC",
});
const weekdayShort = new Intl.DateTimeFormat("fr-BE", { weekday: "short", timeZone: "UTC" });
// « Aujourd'hui », « Demain », « Dans 3 jours ».
const relativeDay = (date: string, today: string) => {
  const days = Math.round((utc(date).getTime() - utc(today).getTime()) / 86_400_000);
  return days === 0 ? "Aujourd'hui" : days === 1 ? "Demain" : `Dans ${days} jours`;
};

const plural = (count: number, word: string) => `${count} ${word}${count > 1 ? "s" : ""}`;

const toMinutes = (time: string) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5));

async function Dashboard() {
  // Garde-fou serveur : connecté ET membre actif d'une organisation, sinon redirection.
  const { memberships } = await requireCoach();
  const current = memberships[0];
  const orgBase = `/coach/o/${current.organizationId}`;
  const today = todayIsoInBrussels();
  // Paiements depuis le lundi ou le 1er du mois (le plus ancien des deux) : semaine et mois.
  const monthStart = `${today.slice(0, 7)}-01`;
  const weekStart = mondayOf(today);
  const [sessions, tasks, invoices, payments, programs, covers, vatRate] = await Promise.all([
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
  // Le même total, jour par jour, pour le petit graphique de la carte.
  const incomeDays: IncomeDay[] = ["L", "M", "M", "J", "V", "S", "D"].map((letter, index) => {
    const date = addDays(weekStart, index);
    const cents = paymentTotals(payments, date, date, convert).inclCents;
    return {
      date,
      letter,
      cents,
      title: `${capitalize(dayTitle.format(utc(date)))} : ${money(cents)}`,
    };
  });
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

  // Séances à venir (D-78) : les deux prochains jours qui ont des séances, dans les 30 jours ;
  // aujourd'hui seulement s'il reste des séances plus tard dans la journée.
  const upcomingDays: UpcomingDay[] = layoutDays(
    sessions,
    Array.from({ length: 31 }, (_, i) => addDays(today, i)),
  )
    .days.map((day) => ({
      date: day.date,
      title: capitalize(dayTitle.format(utc(day.date))),
      weekday: weekdayShort.format(utc(day.date)),
      day: String(utc(day.date).getUTCDate()),
      relative: relativeDay(day.date, today),
      blocks: day.blocks.filter((block) => block.date > today || block.start >= nowMinutes),
    }))
    .filter((day) => day.blocks.length > 0)
    .slice(0, 2);
  const activity = monthActivity(invoices, today, convert);

  // Prochaine séance : la plus proche, avec son rang dans sa journée.
  const next = upcomingDays[0]?.blocks[0] ?? null;
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
      <PageBody fill>
        {/* Téléphone (02/11) : une grille de 2 colonnes ; Prochaine séance et Tâches en widgets carrés côte
            à côte (comme les widgets de l'iPhone), les autres cartes sur toute la largeur. Ailleurs, cette
            enveloppe s'efface (contents). */}
        <div className="grid grid-cols-2 gap-3 md:contents">
          {/* Téléphone (02/11) : les deux rangées s'effacent (contents) et les cartes se rangent dans la
            grille ci-dessus : Prochaine séance et Tâches (carrés), Séances à venir, Encaissés, Activité
            financière, puis Programmes en cours. Ordinateur et tablette : inchangés. */}
          {/* Rangée du haut (29/10/2026) : la carte or « Prochaine séance » tout à gauche, puis les
            tâches et l'encaissé de la semaine (demande d'Antonino du 26/10). */}
          <div className="grid shrink-0 gap-4 max-md:contents md:grid-cols-3">
            <NextSessionCard
              className="max-md:order-1"
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
            {/* Tâches (D-35 ; « Tâches » comme la page, 02/11) : le compteur en violet, les tâches à cocher
                (maquette v6, D-77). */}
            <section
              aria-labelledby="tasks-title"
              className="flex min-w-0 flex-col rounded-[20px] border border-line bg-surface p-5 max-md:order-2 max-md:aspect-square max-md:overflow-hidden max-md:p-4"
            >
              <div className="mb-2 flex items-center justify-between gap-3">
                <h2
                  id="tasks-title"
                  className="text-[17px] font-semibold tracking-tight lg:text-[13px] lg:font-medium lg:tracking-normal"
                >
                  <Link
                    href="/coach/taches"
                    aria-label={`${tasks.openCount} ${tasks.openCount > 1 ? "tâches à faire" : "tâche à faire"}`}
                    className="hover:underline"
                  >
                    Tâches
                  </Link>
                </h2>
                <span
                  aria-hidden
                  className="grid h-5 min-w-5 place-items-center rounded-md bg-violet-soft-2 px-1.5 text-[12px] font-medium text-violet-text tabular lg:text-[11px]"
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
              className="@container flex min-w-0 flex-col justify-between gap-5 rounded-[20px] border border-line bg-surface p-5 transition-[scale] duration-150 active:scale-[.98] max-md:order-4 max-md:col-span-2"
            >
              <div>
                <span className="text-[12px] font-medium tracking-[0.08em] text-muted uppercase lg:text-[11px]">
                  Encaissés cette semaine
                </span>
                <div className="mt-3 flex items-end justify-between gap-4">
                  <div className="min-w-0">
                    <div className="text-[26px] leading-none font-semibold tracking-tight whitespace-nowrap tabular">
                      {
                        describeTotal(weekIncome.inclCents, weekIncome.byCurrency, current.currency)
                          .value
                      }
                    </div>
                    <p className="mt-2.5 text-[14px] text-muted lg:text-[12px]">
                      {`${money(weekIncome.exclCents)} HTVA`} ·{" "}
                      {plural(weekIncome.count, "paiement")}
                    </p>
                  </div>
                  <WeekIncomeBars days={incomeDays} today={today} />
                </div>
              </div>
              {planned.count > 0 ? (
                <span className="flex h-6 items-center self-start rounded-md bg-ok-soft px-2 text-[12px] font-medium text-ok tabular lg:text-[11px]">
                  {money(planned.inclCents)} prévus ({plural(planned.count, "séance")})
                </span>
              ) : null}
            </Link>
          </div>

          {/* Rangée du bas : Séances à venir sur deux colonnes ; à droite, Programmes en cours au-dessus
            d'Activité financière, qui descend jusqu'en bas. */}
          <div className="grid gap-4 max-md:contents md:grid-cols-3 lg:min-h-0 lg:flex-1 lg:grid-rows-[minmax(0,1fr)]">
            <Card
              id="upcoming-title"
              title="Séances à venir"
              action={{ href: `${orgBase}/agenda?vue=liste`, label: "Voir tout" }}
              compact
              className="max-md:order-3 max-md:col-span-2 md:col-span-2 lg:min-h-0"
            >
              {upcomingDays.length === 0 ? (
                <CardEmpty icon={CalendarDays}>
                  Aucune séance prévue dans les 30 prochains jours.
                </CardEmpty>
              ) : (
                <div className="lg:-mr-2 lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:pr-2">
                  <UpcomingDays
                    days={upcomingDays}
                    nextKey={next?.key ?? null}
                    sessionHref={(id) => `${orgBase}/agenda/seances/${id}`}
                  />
                </div>
              )}
            </Card>

            <div className="flex min-w-0 flex-col gap-4 max-md:contents lg:min-h-0">
              <Card
                id="programs-title"
                title="Programmes en cours"
                action={{ href: "/coach/programmes", label: "Voir tout" }}
                compact
                className="max-md:order-6 max-md:col-span-2 lg:shrink-0"
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
                            className="flex items-center gap-3 py-2"
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
                              <span className="block truncate text-[15px] font-medium lg:text-[13px]">
                                {program.athleteName}
                              </span>
                              <span className="block truncate text-[14px] text-muted lg:text-[12px]">
                                {program.title}
                              </span>
                            </span>
                            <span className="flex shrink-0 flex-col items-end gap-1.5">
                              <span className="text-[12px] text-muted tabular lg:text-[11px]">
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
                className="max-md:order-5 max-md:col-span-2 lg:min-h-0 lg:flex-1"
              >
                <ul className="-mt-1 divide-y divide-line-soft lg:min-h-0 lg:overflow-y-auto">
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
    <li className="flex items-center justify-between gap-3 py-2">
      <span className="min-w-0">
        <span className="block text-[15px] text-text-2 lg:text-[13px]">{title}</span>
        <span className={`block text-[14px] lg:text-[12px] ${late ? "text-alert" : "text-muted"}`}>
          {sub}
        </span>
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
      className={`shrink-0 text-[15px] font-medium tabular lg:text-[13px] ${late ? "text-alert" : "text-text"}`}
    >
      {describeTotal(cents, byCurrency, currency).value}
    </span>
  );
}
