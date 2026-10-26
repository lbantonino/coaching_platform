import { CalendarCheck, CalendarDays, Clock, Users } from "lucide-react";
import type { Metadata } from "next";
import { Suspense, type ReactNode } from "react";

import { MonthGrid } from "@/components/blocks/month-grid";
import { AgendaToolbar, periodLabel } from "@/components/blocks/agenda-toolbar";
import { NewSessionButton } from "@/components/blocks/new-session-sheet";
import { WeekTimeGrid } from "@/components/blocks/week-time-grid";
import { PageBody, PageHeader, PageLoading, pageMainClass } from "@/components/layout/page-header";
import { FilterChips } from "@/components/ui/filter-chips";
import { StatTiles } from "@/components/ui/stat-tiles";
import { monthGrid, monthLabel, shiftMonth } from "@/features/agenda/calendar";
import { addDays } from "@/features/agenda/items";
import {
  formatHours,
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
// Barre de l'agenda sur téléphone, vue d'un jour : « Lun 26 ».
const shortDayLabel = new Intl.DateTimeFormat("fr-BE", {
  weekday: "short",
  day: "numeric",
  timeZone: "UTC",
});
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
const plural = (count: number, word: string) => `${count} ${word}${count > 1 ? "s" : ""}`;

function weekTitle(monday: string): string {
  const sunday = addDays(monday, 6);
  const sameMonth = monday.slice(0, 7) === sunday.slice(0, 7);
  const from = sameMonth ? String(utc(monday).getUTCDate()) : dayAndMonth.format(utc(monday));
  return `Semaine du ${from} au ${dayAndMonth.format(utc(sunday))}`;
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
  // Téléphone, vue Semaine : les 7 jours dans l'écran (?jours=7) plutôt que 3 jours qui défilent.
  const fullWeek = single(query.jours) === "7";
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

  const href = (changes: { vue?: View; date?: string; type?: Kind; fullWeek?: boolean }) => {
    const search = new URLSearchParams();
    const nextView = changes.vue ?? view;
    if (nextView !== "semaine") search.set("vue", nextView);
    if (nextView === "semaine" && (changes.fullWeek ?? fullWeek)) search.set("jours", "7");
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
  const freeDays = week.days.filter((day) => day.blocks.length === 0).map((day) => day.date);
  const groupBlocks = week.days.flatMap((day) => day.blocks.filter((block) => !block.individual));

  const sessionHref = (id: string) => `${base}/seances/${id}`;

  let title: string;
  let content: ReactNode;
  if (view === "semaine") {
    const layout = layoutWeek(shownSessions, monday);
    title = weekTitle(monday);
    content = (
      <WeekTimeGrid
        layout={layout}
        today={today}
        now={now}
        sessionHref={sessionHref}
        fullWeek={fullWeek}
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
    title = capitalize(monthLabel(month));
    content = (
      <MonthGrid
        month={month}
        monthBlocks={monthBlocks}
        today={today}
        dayHref={(day) => href({ vue: "jour", date: day })}
      />
    );
  } else {
    // Jour ou Aujourd'hui : la même grille horaire que la vue « Aujourd'hui » du tableau de bord
    // (demande d'Antonino du 26/10), plutôt qu'une liste.
    const dayLayout = layoutDays(shownSessions, [date]);
    const count = dayLayout.days[0].blocks.length;
    title =
      view === "aujourdhui"
        ? `Aujourd'hui · ${plural(count, "séance")}`
        : capitalize(longDay.format(utc(date)));
    content = (
      <WeekTimeGrid
        layout={dayLayout}
        today={today}
        now={now}
        single
        sessionHref={sessionHref}
        creatable
        onMove={moveSession.bind(null, organizationId)}
      />
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
        {/* Le calendrier d'abord, à la façon de Google Agenda (demande d'Antonino du 26/10) : barre
            (flèches, mois, vue), filtres, puis la grille ; les chiffres de la semaine, en petit, dessous. */}
        <section
          aria-labelledby="agenda-title"
          // Téléphone : pas de carte autour de l'agenda, la grille prend toute la largeur de l'écran.
          className="flex min-w-0 flex-col gap-3.5 rounded-card border border-line bg-surface p-[18px] max-lg:rounded-none max-lg:border-0 max-lg:bg-transparent max-lg:p-0"
        >
          <AgendaToolbar
            titleId="agenda-title"
            srTitle={title}
            label={
              view === "mois"
                ? capitalize(monthLabel(month))
                : view === "semaine"
                  ? periodLabel(monday, addDays(monday, 6))
                  : capitalize(longDay.format(utc(date)))
            }
            shortLabel={
              view === "mois"
                ? periodLabel(`${month}-01`, `${month}-01`, true)
                : view === "semaine"
                  ? periodLabel(monday, addDays(monday, 6), true)
                  : capitalize(shortDayLabel.format(utc(date)).replace(".", ""))
            }
            prevHref={href({ vue: view === "aujourdhui" ? "jour" : view, date: step(-1) })}
            nextHref={href({ vue: view === "aujourdhui" ? "jour" : view, date: step(1) })}
            viewOptions={[
              {
                key: "jour",
                label: "Aujourd'hui",
                href: href({ vue: "aujourdhui", date: today }),
                selected: view === "aujourdhui" || view === "jour",
              },
              {
                key: "3jours",
                label: "3 jours",
                href: href({ vue: "semaine", fullWeek: false }),
                selected: view === "semaine" && !fullWeek,
              },
              {
                key: "semaine",
                label: "Semaine",
                href: href({ vue: "semaine", fullWeek: true }),
                selected: view === "semaine" && fullWeek,
              },
              {
                key: "mois",
                label: "Mois",
                href: href({ vue: "mois" }),
                selected: view === "mois",
              },
            ]}
            desktopViews={views.map((item) => ({
              href: href({ vue: item.key, date: item.key === "aujourdhui" ? today : date }),
              label: item.label,
              active: item.key === view,
            }))}
          />
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

        {/* Chiffres de la semaine (26/10) : quatre petites tuiles colorées sur une ligne, grand chiffre
            en couleur et mot court dessous ; plus de grandes cartes au-dessus du calendrier. */}
        <StatTiles
          label="Chiffres de la semaine"
          tiles={[
            {
              color: "run",
              icon: Clock,
              value: week.totalMinutes > 0 ? formatHours(week.totalMinutes) : "0 h",
              text: "de coaching",
            },
            {
              color: "accent",
              icon: CalendarDays,
              value: String(weekCount),
              text: weekCount > 1 ? "séances" : "séance",
            },
            {
              color: "ok",
              icon: CalendarCheck,
              value: String(freeDays.length),
              text: freeDays.length > 1 ? "jours libres" : "jour libre",
            },
            {
              color: "strength",
              icon: Users,
              value: String(groupBlocks.length),
              text: groupBlocks.length > 1 ? "collectives" : "collective",
            },
          ]}
        />
      </PageBody>
    </>
  );
}
