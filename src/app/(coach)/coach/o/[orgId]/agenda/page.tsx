import {
  CalendarCheck,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  Flag,
  Users,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense, type ReactNode } from "react";

import { ListRow } from "@/components/blocks/list-row";
import { MonthGrid } from "@/components/blocks/month-grid";
import { NewSessionButton } from "@/components/blocks/new-session-sheet";
import { KindBadge, WeekTimeGrid } from "@/components/blocks/week-time-grid";
import { PageBody, PageHeader, PageLoading, pageMainClass } from "@/components/layout/page-header";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { iconButtonClass } from "@/components/ui/button";
import { CardEmpty } from "@/components/ui/card";
import { FilterChips } from "@/components/ui/filter-chips";
import { KpiCard, KpiGrid } from "@/components/ui/kpi-card";
import { PageTabs } from "@/components/ui/page-tabs";
import { disciplineLabels, disciplineTones } from "@/domain/training/discipline";
import { monthGrid, monthLabel, shiftMonth } from "@/features/agenda/calendar";
import { addDays, buildAgendaItems, type AgendaItem } from "@/features/agenda/items";
import {
  formatHours,
  isoWeek,
  layoutDays,
  layoutWeek,
  mondayOf,
  parseDay,
  type WeekBlock,
} from "@/features/agenda/week";
import { requireOrgAccess } from "@/features/auth/guards";
import { moveSession } from "@/features/sessions/actions";
import { listSessions, type CoachSession } from "@/features/sessions/queries";
import { nowTimeInBrussels, todayIsoInBrussels } from "@/lib/format";

export const metadata: Metadata = {
  title: "Agenda",
};

// Agenda du coach (prompt Claude Design §6 et §7.2) : SES séances encadrées, collectives et
// individuelles. Demande d'Antonino du 26/10 : les compétitions des sportifs ne sont plus dans son
// planning (rappels dans les Notifications) ; vues Aujourd'hui, Semaine, Mois ; filtres Toutes,
// Individuelles, Collectives. La vue Jour reste accessible en touchant un jour du mois.
// Adresse : ?vue=semaine|jour|mois|aujourdhui, ?date=AAAA-MM-JJ, ?type=individuelles|collectives.
type View = "semaine" | "jour" | "mois" | "aujourdhui";
type Kind = "toutes" | "individuelles" | "collectives";

const views: { key: View; label: string }[] = [
  { key: "aujourdhui", label: "Aujourd'hui" },
  { key: "semaine", label: "Semaine" },
  { key: "mois", label: "Mois" },
];
const viewKeys: View[] = ["semaine", "jour", "mois", "aujourdhui"];
const kinds: { key: Kind; label: string }[] = [
  { key: "toutes", label: "Toutes" },
  { key: "individuelles", label: "Individuelles" },
  { key: "collectives", label: "Collectives" },
];

type Query = Record<string, string | string[] | undefined>;
const single = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

export default function AgendaPage({ params, searchParams }: PageProps<"/coach/o/[orgId]/agenda">) {
  return (
    <main className={pageMainClass}>
      {/* Organisation, vue et filtres viennent de l'URL : données de requête, derrière Suspense. */}
      <Suspense fallback={<PageLoading label="Chargement de l'agenda…" />}>
        {Promise.all([params, searchParams]).then(([{ orgId }, query]) => (
          <Agenda orgId={orgId} query={query} />
        ))}
      </Suspense>
    </main>
  );
}

const utc = (day: string) => new Date(`${day}T00:00:00Z`);
const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);
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
const shortWeekday = new Intl.DateTimeFormat("fr-BE", { weekday: "short", timeZone: "UTC" });
const plural = (count: number, word: string) => `${count} ${word}${count > 1 ? "s" : ""}`;
const toMinutes = (time: string) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5));

function weekTitle(monday: string): string {
  const sunday = addDays(monday, 6);
  const sameMonth = monday.slice(0, 7) === sunday.slice(0, 7);
  const from = sameMonth ? String(utc(monday).getUTCDate()) : dayAndMonth.format(utc(monday));
  return `Semaine du ${from} au ${dayAndMonth.format(utc(sunday))}`;
}

// « Jeu. et dim. », « Lun., mar. et ven. »
function dayNames(dates: string[]): string {
  const names = dates.map((date) => shortWeekday.format(utc(date)));
  if (names.length === 0) return "";
  const text =
    names.length === 1 ? names[0] : `${names.slice(0, -1).join(", ")} et ${names.at(-1)}`;
  return capitalize(text);
}

async function Agenda({ orgId, query }: { orgId: string; query: Query }) {
  // Garde-fou serveur : membre de CETTE organisation, sinon redirection.
  const { membership } = await requireOrgAccess(orgId);
  const organizationId = membership.organizationId;
  const base = `/coach/o/${organizationId}/agenda`;
  const today = todayIsoInBrussels();
  const now = nowTimeInBrussels();

  // Ancienne adresse ?mois=AAAA-MM : la vue Mois de ce mois.
  const legacyMonth = single(query.mois);
  const viewParam = single(query.vue);
  const view: View = /^\d{4}-\d{2}$/.test(legacyMonth ?? "")
    ? "mois"
    : viewKeys.includes(viewParam as View)
      ? (viewParam as View)
      : "semaine";
  const kindParam = single(query.type);
  const kind: Kind = kinds.some((k) => k.key === kindParam) ? (kindParam as Kind) : "toutes";
  const date =
    view === "aujourdhui"
      ? today
      : parseDay(legacyMonth ? `${legacyMonth}-01` : single(query.date), today);
  const monday = mondayOf(date);
  const month = date.slice(0, 7);

  const sessions = await listSessions(organizationId);
  const shownSessions: CoachSession[] = sessions.filter(
    (session) =>
      kind === "toutes" ||
      (kind === "collectives" ? session.kind === "group" : session.kind === "individual"),
  );

  const href = (changes: { vue?: View; date?: string; type?: Kind }) => {
    const search = new URLSearchParams();
    const nextView = changes.vue ?? view;
    if (nextView !== "semaine") search.set("vue", nextView);
    const nextDate = changes.date ?? date;
    if (nextView !== "aujourdhui" && nextDate !== today) search.set("date", nextDate);
    const nextKind = changes.type ?? kind;
    if (nextKind !== "toutes") search.set("type", nextKind);
    const text = search.toString();
    return text ? `${base}?${text}` : base;
  };
  const step = (direction: 1 | -1) =>
    view === "mois"
      ? `${shiftMonth(month, direction)}-01`
      : view === "semaine"
        ? addDays(monday, 7 * direction)
        : addDays(date, direction);

  // Chiffres de la semaine affichée, toutes séances confondues.
  const week = layoutWeek(sessions, monday);
  const weekCount = week.days.reduce((sum, day) => sum + day.blocks.length, 0);
  const busyDays = week.days.filter((day) => day.blocks.length > 0);
  const freeDays = week.days.filter((day) => day.blocks.length === 0).map((day) => day.date);
  const groupBlocks = week.days.flatMap((day) => day.blocks.filter((block) => !block.individual));
  const groupDetail = groupBlocks
    .slice(0, 2)
    .map((block) => `${shortWeekday.format(utc(block.date))} ${block.label.slice(0, 5)}`)
    .join(" · ");

  const sessionHref = (id: string) => `${base}/seances/${id}`;

  let title: string;
  let subtitle: string;
  let content: ReactNode;
  if (view === "semaine") {
    const layout = layoutWeek(shownSessions, monday);
    const count = layout.days.reduce((sum, day) => sum + day.blocks.length, 0);
    title = weekTitle(monday);
    subtitle = `${plural(count, "séance")} · ${formatHours(layout.totalMinutes)} planifiées`;
    content = (
      <WeekTimeGrid
        layout={layout}
        today={today}
        now={now}
        sessionHref={sessionHref}
        creatable
        onMove={moveSession.bind(null, organizationId)}
      />
    );
  } else if (view === "mois") {
    const dates = monthGrid(month)
      .flat()
      .filter((day) => day.inMonth)
      .map((day) => day.iso);
    const monthLayout = layoutDays(shownSessions, dates);
    const monthBlocks = new Map<string, WeekBlock[]>(
      monthLayout.days.map((day) => [day.date, day.blocks]),
    );
    const count = monthLayout.days.reduce((sum, day) => sum + day.blocks.length, 0);
    title = capitalize(monthLabel(month));
    subtitle = plural(count, "séance");
    content = (
      <MonthGrid
        month={month}
        monthBlocks={monthBlocks}
        today={today}
        dayHref={(day) => href({ vue: "jour", date: day })}
      />
    );
  } else {
    // Jour ou Aujourd'hui : la liste de la journée, par heure.
    const items = buildAgendaItems(shownSessions, [], date, date, {
      discipline: null,
      athleteId: null,
    });
    const sessionCount = items.filter((item) => item.type === "session").length;
    title =
      view === "aujourdhui"
        ? `Aujourd'hui · ${plural(sessionCount, "séance")}`
        : capitalize(longDay.format(utc(date)));
    subtitle =
      view === "aujourdhui"
        ? capitalize(longDay.format(utc(date)))
        : plural(sessionCount, "séance");
    content =
      items.length === 0 ? (
        <CardEmpty icon={CalendarDays}>Rien de prévu ce jour-là.</CardEmpty>
      ) : (
        <div className="flex flex-col">
          {items.map((item) => (
            <DayRow
              key={item.key}
              item={item}
              href={item.type === "session" ? sessionHref(item.sessionId) : ""}
              status={
                view === "aujourdhui" && item.type === "session"
                  ? sessionStatus(item, sessions, now)
                  : null
              }
            />
          ))}
        </div>
      );
  }

  return (
    <>
      <PageHeader
        title="Agenda"
        subtitle="Tes séances encadrées, collectives et individuelles."
        actions={<NewSessionButton date={view === "jour" ? date : undefined} />}
      />
      <PageBody>
        <PageTabs
          label="Vue de l'agenda"
          items={views.map((item) => ({
            href: href({ vue: item.key, date: item.key === "aujourdhui" ? today : date }),
            label: item.label,
            active: item.key === view,
          }))}
        />
        <KpiGrid label="Chiffres de la semaine">
          <KpiCard
            color="run"
            icon={Clock}
            value={week.totalMinutes > 0 ? formatHours(week.totalMinutes) : "0 h"}
            label="de coaching planifiées"
            detail={`Semaine ${isoWeek(monday)}`}
          />
          <KpiCard
            color="accent"
            icon={CalendarDays}
            value={String(weekCount)}
            label={weekCount > 1 ? "séances programmées" : "séance programmée"}
            detail={
              busyDays.length > 0
                ? `Sur ${plural(busyDays.length, "jour")}`
                : "Aucune cette semaine"
            }
          />
          <KpiCard
            color="ok"
            icon={CalendarCheck}
            value={String(freeDays.length)}
            label={freeDays.length > 1 ? "jours libres" : "jour libre"}
            detail={freeDays.length === 7 ? "Toute la semaine" : dayNames(freeDays)}
          />
          <KpiCard
            color="strength"
            icon={Users}
            value={String(groupBlocks.length)}
            label={groupBlocks.length > 1 ? "séances collectives" : "séance collective"}
            detail={groupDetail ? capitalize(groupDetail) : "Aucune cette semaine"}
          />
        </KpiGrid>

        <section
          aria-labelledby="agenda-title"
          className="flex min-w-0 flex-col gap-3.5 rounded-card border border-line bg-surface p-[18px]"
        >
          <header className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 flex-col gap-1">
              <h2 id="agenda-title" className="font-display text-block font-semibold">
                {title}
              </h2>
              <p className="text-[13px] text-muted">{subtitle}</p>
            </div>
            {view === "aujourdhui" ? null : (
              <nav aria-label="Changer de période" className="flex shrink-0 items-center gap-1.5">
                <Link
                  href={href({ date: step(-1) })}
                  scroll={false}
                  aria-label="Période précédente"
                  className={iconButtonClass()}
                >
                  <ChevronLeft aria-hidden size={18} strokeWidth={1.8} />
                </Link>
                <Link
                  href={href({ date: step(1) })}
                  scroll={false}
                  aria-label="Période suivante"
                  className={iconButtonClass()}
                >
                  <ChevronRight aria-hidden size={18} strokeWidth={1.8} />
                </Link>
              </nav>
            )}
          </header>
          <FilterChips
            label="Filtrer l'agenda"
            options={kinds.map((item) => ({
              href: href({ type: item.key }),
              label: item.label,
              active: item.key === kind,
            }))}
          />
          {content}
        </section>
      </PageBody>
    </>
  );
}

// Statut d'une séance d'aujourd'hui selon l'heure : Terminée, En cours ou À venir.
function sessionStatus(
  item: Extract<AgendaItem, { type: "session" }>,
  sessions: CoachSession[],
  now: string,
): string {
  const session = sessions.find((s) => s.id === item.sessionId);
  const start = toMinutes(item.time);
  const end = start + (session?.durationMinutes ?? 0);
  const current = toMinutes(now);
  return current >= end ? "Terminée" : current >= start ? "En cours" : "À venir";
}

function DayRow({ item, href, status }: { item: AgendaItem; href: string; status: string | null }) {
  return (
    <ListRow
      href={href}
      leading={
        <span className="w-12 shrink-0 font-mono text-[14px] font-medium tabular">
          {item.type === "session" ? (
            item.time.slice(0, 5)
          ) : (
            <Flag
              aria-label="Compétition"
              size={16}
              strokeWidth={1.8}
              className="text-accent-text"
            />
          )}
        </span>
      }
      title={item.type === "session" ? item.title : `${item.title} · ${item.athleteName}`}
      sub={item.detail || (item.type === "event" ? "Compétition" : undefined)}
      trailing={
        <>
          {item.type === "session" ? <KindBadge individual={item.individual} /> : null}
          {item.discipline ? (
            <Badge tone={disciplineTones[item.discipline]}>
              {disciplineLabels[item.discipline]}
            </Badge>
          ) : null}
          {status ? <StatusBadge label={status} /> : null}
        </>
      }
    />
  );
}
