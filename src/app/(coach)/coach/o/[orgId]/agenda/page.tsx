import { Calendar, CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense, type ReactNode } from "react";

import {
  AgendaFilters,
  AgendaMiniMonth,
  AgendaPhoneBar,
  AgendaViewMenu,
  type AgendaKind,
  type AgendaViewItem,
} from "@/components/blocks/agenda-controls";
import { CoachingHours, type HoursSplit } from "@/components/blocks/coaching-hours";
import { DayWeekStrip } from "@/components/blocks/day-week-strip";
import { MonthGrid } from "@/components/blocks/month-grid";
import { NewSessionButton } from "@/components/blocks/new-session-sheet";
import { SessionDayList } from "@/components/blocks/session-day-list";
import { SwipeNav } from "@/components/blocks/swipe-nav";
import { WeekGrid } from "@/components/blocks/week-grid";
import { HeaderTools } from "@/components/layout/header-tools";
import { PageLoading, pageMainClass } from "@/components/layout/page-header";
import { AgendaPanelToggle, AgendaSidebarCollapse } from "@/components/layout/sidebar-toggle";
import { CardEmpty } from "@/components/ui/card";
import type { Discipline } from "@/domain/training/discipline";
import { monthGrid, monthLabel, periodLabel, shiftMonth } from "@/features/agenda/calendar";
import { addDays } from "@/features/agenda/items";
import { layoutDays, withHours, mondayOf, parseDay, type WeekBlock } from "@/features/agenda/week";
import { requireOrgAccess } from "@/features/auth/guards";
import { getCoachProfile } from "@/features/coach/profile";
import { moveSession } from "@/features/sessions/actions";
import { listSessions, type CoachSession } from "@/features/sessions/queries";
import { nowTimeInBrussels, todayIsoInBrussels } from "@/lib/format";

export const metadata: Metadata = {
  title: "Agenda",
};

// Agenda du coach, à la façon de Google Agenda (D-78, maquette agenda-v1 validée par Antonino le
// 01/11) : SES séances encadrées, collectives et individuelles.
// Ordinateur : le menu Coory s'ouvre replié ; à gauche, le panneau de l'agenda (titre, petit calendrier
// du mois, cases Individuelles / Collectives) ; en haut, une barre (Aujourd'hui, flèches, période, le
// choix de la vue au centre, recherche, Assistant IA, cloche, « Nouvelle séance ») ; le calendrier prend
// toute la hauteur de l'écran et défile dedans. Vues Jour, Semaine (00:00 - 24:00, un jour sur deux
// gris), Mois (séances écrites), Liste (le « Planning » de Google, 4 semaines).
// Téléphone : sous la barre Coory, « Novembre ▾ » (le mois se déplie), aujourd'hui, « Vue et filtres » ;
// le calendrier est l'écran (pas de carte) ; on change de période en glissant le doigt ; bouton « + ».
// Adresse : ?vue=semaine|jour|mois|liste (aujourdhui : ancienne adresse), ?date=AAAA-MM-JJ,
// ?type=individuelles|collectives, ?jours=7 (téléphone : la semaine entière plutôt que 3 jours).
type View = "semaine" | "jour" | "mois" | "aujourdhui" | "liste";

const viewKeys: View[] = ["semaine", "jour", "mois", "aujourdhui", "liste"];
// Vue Liste : 4 semaines à partir du jour choisi (aujourd'hui par défaut).
const LIST_DAYS = 28;
const kindKeys: AgendaKind[] = ["toutes", "individuelles", "collectives"];

type Query = Record<string, string | string[] | undefined>;
const single = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

export default function AgendaPage({ params, searchParams }: PageProps<"/coach/o/[orgId]/agenda">) {
  return (
    // La page fait exactement la hauteur de l'écran (au-dessus de la barre de l'app sur téléphone) :
    // c'est le calendrier qui défile, pas la page.
    <main
      className={`${pageMainClass} h-[calc(100dvh-var(--top-bar)-env(safe-area-inset-top))] flex-none lg:h-dvh`}
    >
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
const longDayYear = new Intl.DateTimeFormat("fr-BE", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});
const dayAndMonth = new Intl.DateTimeFormat("fr-BE", {
  day: "numeric",
  month: "long",
  timeZone: "UTC",
});
const monthName = new Intl.DateTimeFormat("fr-BE", { month: "long", timeZone: "UTC" });
const monthShort = new Intl.DateTimeFormat("fr-BE", { month: "short", timeZone: "UTC" });
const plural = (count: number, word: string) => `${count} ${word}${count > 1 ? "s" : ""}`;
const toMinutes = (time: string) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5));

function weekTitle(monday: string): string {
  const sunday = addDays(monday, 6);
  const sameMonth = monday.slice(0, 7) === sunday.slice(0, 7);
  const from = sameMonth ? String(utc(monday).getUTCDate()) : dayAndMonth.format(utc(monday));
  return `Semaine du ${from} au ${dayAndMonth.format(utc(sunday))}`;
}

async function Agenda({ orgId, query }: { orgId: string; query: Query }) {
  // Garde-fou serveur : membre de CETTE organisation, sinon redirection.
  const { user, membership } = await requireOrgAccess(orgId);
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
  const kind: AgendaKind = kindKeys.includes(kindParam as AgendaKind)
    ? (kindParam as AgendaKind)
    : "toutes";
  // Téléphone, vue Semaine : les 7 jours dans l'écran (?jours=7) plutôt que 3 jours qui défilent.
  const fullWeek = single(query.jours) === "7";
  const date =
    view === "aujourdhui"
      ? today
      : parseDay(legacyMonth ? `${legacyMonth}-01` : single(query.date), today);
  const monday = mondayOf(date);
  const month = date.slice(0, 7);
  // « Aujourd'hui » (ancienne vue) se lit comme la vue Jour.
  const shownView: Exclude<View, "aujourdhui"> = view === "aujourdhui" ? "jour" : view;

  const [sessions, profile] = await Promise.all([
    listSessions(organizationId),
    getCoachProfile(user),
  ]);
  // Heures affichées à l'ouverture : celles des Paramètres (D-57), élargies par une séance hors plage.
  const { agendaFirstHour, agendaLastHour } = profile.preferences;
  const shownSessions: CoachSession[] = sessions.filter(
    (session) =>
      kind === "toutes" ||
      (kind === "collectives" ? session.kind === "group" : session.kind === "individual"),
  );

  const href = (changes: {
    vue?: Exclude<View, "aujourdhui">;
    date?: string;
    type?: AgendaKind;
    fullWeek?: boolean;
  }) => {
    const search = new URLSearchParams();
    const nextView = changes.vue ?? shownView;
    if (nextView !== "semaine") search.set("vue", nextView);
    if (nextView === "semaine" && (changes.fullWeek ?? fullWeek)) search.set("jours", "7");
    const nextDate = changes.date ?? date;
    if (nextDate !== today) search.set("date", nextDate);
    const nextKind = changes.type ?? kind;
    if (nextKind !== "toutes") search.set("type", nextKind);
    const text = search.toString();
    return text ? `${base}?${text}` : base;
  };
  const step = (direction: 1 | -1) =>
    shownView === "mois"
      ? `${shiftMonth(month, direction)}-01`
      : shownView === "semaine"
        ? addDays(monday, 7 * direction)
        : shownView === "liste"
          ? addDays(date, LIST_DAYS * direction)
          : addDays(date, direction);
  const prevHref = href({ date: step(-1) });
  const nextHref = href({ date: step(1) });
  // Téléphone, 3 jours : depuis lundi, la semaine précédente s'ouvre sur son dimanche.
  const threeDays = shownView === "semaine" && !fullWeek;
  // Jour, 3 jours, Semaine (01/11, comme Google Agenda) : la grille reçoit 9 semaines d'affilée (4 avant,
  // 4 après) ; sur téléphone on glisse librement d'un jour et d'une semaine à l'autre. Au bout de ces
  // semaines, un glissé de plus ouvre les suivantes (ou les précédentes).
  const perView: 1 | 3 | 7 = shownView === "jour" ? 1 : fullWeek ? 7 : 3;
  const windowStart = addDays(monday, -28);
  const windowDates = Array.from({ length: 63 }, (_, i) => addDays(windowStart, i));
  const grid = shownView === "jour" || shownView === "semaine";
  const swipePrevHref = grid ? href({ date: addDays(windowStart, -perView) }) : prevHref;
  const swipeNextHref = grid ? href({ date: addDays(windowStart, 63) }) : nextHref;
  // Téléphone : le premier jour visible (3 jours : la veille d'aujourd'hui, pour l'avoir au milieu).
  const focus =
    perView === 7 ? monday : perView === 3 && date === today ? addDays(today, -1) : date;
  const todayHref = href({ date: today });
  const sessionHref = (id: string, day: string) => `${base}/seances/${id}?date=${day}`;

  // Le choix de la vue : quatre vues sur ordinateur, cinq sur téléphone (3 jours et Semaine).
  const desktopViews: AgendaViewItem[] = [
    { key: "jour", label: "Jour", href: href({ vue: "jour" }), active: shownView === "jour" },
    {
      key: "semaine",
      label: "Semaine",
      href: href({ vue: "semaine" }),
      active: shownView === "semaine",
    },
    { key: "mois", label: "Mois", href: href({ vue: "mois" }), active: shownView === "mois" },
    { key: "liste", label: "Liste", href: href({ vue: "liste" }), active: shownView === "liste" },
  ];
  const phoneViews: AgendaViewItem[] = [
    { key: "liste", label: "Liste", href: href({ vue: "liste" }), active: shownView === "liste" },
    { key: "jour", label: "Jour", href: href({ vue: "jour" }), active: shownView === "jour" },
    {
      key: "3jours",
      label: "3 jours",
      href: href({ vue: "semaine", fullWeek: false }),
      active: threeDays,
    },
    {
      key: "semaine",
      label: "Semaine",
      href: href({ vue: "semaine", fullWeek: true }),
      active: shownView === "semaine" && fullWeek,
    },
    { key: "mois", label: "Mois", href: href({ vue: "mois" }), active: shownView === "mois" },
  ];
  const kindHrefs: Record<AgendaKind, string> = {
    toutes: href({ type: "toutes" }),
    individuelles: href({ type: "individuelles" }),
    collectives: href({ type: "collectives" }),
  };

  // Petit calendrier : un jour ouvre cette date dans la vue en cours. Sur téléphone, des points de la
  // couleur des disciplines (mois affiché, et ses voisins).
  const dayHrefTemplate = href({ date: "__DATE__" });
  const dotsFrom = `${shiftMonth(month, -1)}-01`;
  const dotsLayout = layoutDays(
    shownSessions,
    Array.from({ length: 100 }, (_, i) => addDays(dotsFrom, i)),
  );
  const dots: Record<string, Discipline[]> = Object.fromEntries(
    dotsLayout.days
      .filter((day) => day.blocks.length > 0)
      .map((day) => [
        day.date,
        [...new Set(day.blocks.map((block) => block.discipline).filter(Boolean))] as Discipline[],
      ]),
  );
  const miniProps = {
    month,
    today,
    selected: shownView === "jour" ? date : null,
    // La semaine affichée (Jour, Semaine), sinon celle d'aujourd'hui : toujours surlignée (02/11).
    weekStart: grid ? monday : mondayOf(today),
    dayHref: dayHrefTemplate,
  };
  // Téléphone : les puces des mois suivants (à partir du mois en cours), l'année glissée entre deux ;
  // jusqu'à décembre dans quatre ans (02/11 : de novembre 2026 à décembre 2030).
  const thisMonth = today.slice(0, 7);
  const monthCount = 48 + 13 - Number(thisMonth.slice(5, 7));
  const months = Array.from({ length: monthCount }, (_, i) => shiftMonth(thisMonth, i)).map(
    (ym, i, all) => ({
      label: monthShort.format(utc(`${ym}-01`)),
      year: i > 0 && ym.slice(0, 4) !== all[i - 1].slice(0, 4) ? ym.slice(0, 4) : undefined,
      href: href({ vue: shownView === "mois" ? "mois" : shownView, date: `${ym}-01` }),
      active: ym === month,
    }),
  );

  let title: string;
  let periodText: string;
  let content: ReactNode;
  if (shownView === "semaine") {
    const layout = withHours(
      layoutDays(shownSessions, windowDates),
      agendaFirstHour,
      agendaLastHour,
    );
    title = weekTitle(monday);
    periodText = periodLabel(monday, addDays(monday, 6));
    content = (
      <WeekGrid
        layout={layout}
        today={today}
        now={now}
        sessionHref={sessionHref}
        perView={perView}
        dayHref={href({ vue: "jour", date: "__DATE__" })}
        viewHref={href({ date: "__DATE__" })}
        desktopDays={Array.from({ length: 7 }, (_, i) => addDays(monday, i))}
        focus={focus}
        creatable
        onMove={moveSession.bind(null, organizationId)}
      />
    );
  } else if (shownView === "liste") {
    const listLayout = layoutDays(
      shownSessions,
      Array.from({ length: LIST_DAYS }, (_, i) => addDays(date, i)),
    );
    const blocks = listLayout.days.flatMap((day) => day.blocks);
    title = `Séances du ${dayAndMonth.format(utc(date))} au ${dayAndMonth.format(utc(addDays(date, LIST_DAYS - 1)))}`;
    periodText = periodLabel(date, addDays(date, LIST_DAYS - 1));
    content = (
      <div className="flex h-full min-h-0 flex-col">
        {/* La semaine au-dessus de la liste (02/11), sur téléphone : un jour la fait commencer à
            cette date. Sur ordinateur, le petit calendrier du panneau suffit. */}
        <div className="lg:hidden">
          <DayWeekStrip
            initial={date}
            today={today}
            dayHref={href({ vue: "liste", date: "__DATE__" })}
            viewHref={href({ vue: "liste", date: "__DATE__" })}
          />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {blocks.length === 0 ? (
            <div className="p-5">
              <CardEmpty icon={CalendarDays}>
                Aucune séance sur ces 4 semaines. Ajoute-en une avec « Nouvelle séance ».
              </CardEmpty>
            </div>
          ) : (
            <SessionDayList
              blocks={blocks}
              today={today}
              nowMinutes={toMinutes(now)}
              sessionHref={sessionHref}
            />
          )}
        </div>
      </div>
    );
  } else if (shownView === "mois") {
    // Toute la grille (mois voisins compris), pour écrire aussi leurs séances, grisées.
    const dates = monthGrid(month)
      .flat()
      .map((day) => day.iso);
    const monthLayout = layoutDays(shownSessions, dates);
    const monthBlocks = new Map<string, WeekBlock[]>(
      monthLayout.days.map((day) => [day.date, day.blocks]),
    );
    title = capitalize(monthLabel(month));
    periodText = title;
    content = (
      <MonthGrid
        month={month}
        monthBlocks={monthBlocks}
        today={today}
        dayHref={(day) => href({ vue: "jour", date: day })}
      />
    );
  } else {
    const dayLayout = withHours(
      layoutDays(shownSessions, windowDates),
      agendaFirstHour,
      agendaLastHour,
    );
    const count = dayLayout.days.find((day) => day.date === date)?.blocks.length ?? 0;
    title =
      view === "aujourdhui"
        ? `Aujourd'hui · ${plural(count, "séance")}`
        : capitalize(longDay.format(utc(date)));
    periodText = capitalize(longDayYear.format(utc(date)));
    content = (
      <WeekGrid
        layout={dayLayout}
        today={today}
        now={now}
        single
        dayHref={href({ vue: "jour", date: "__DATE__" })}
        viewHref={href({ vue: "jour", date: "__DATE__" })}
        sessionHref={sessionHref}
        perView={1}
        desktopDays={[date]}
        focus={date}
        creatable
        onMove={moveSession.bind(null, organizationId)}
      />
    );
  }

  // Heures de coaching (02/11, plus sous la grille) : la période affichée, filtres compris, avec le même
  // calcul que la grille (durée des séances de chaque jour), séparées en individuelles et collectives.
  // Ordinateur : dans le panneau (CoachingHours). Téléphone : dans le menu déroulant du mois, la semaine
  // affichée (elle suit ensuite le défilement des jours).
  const periodDays =
    shownView === "semaine"
      ? Array.from({ length: 7 }, (_, i) => addDays(monday, i))
      : shownView === "jour"
        ? [date]
        : shownView === "mois"
          ? monthGrid(month)
              .flat()
              .filter((day) => day.inMonth)
              .map((day) => day.iso)
          : Array.from({ length: LIST_DAYS }, (_, i) => addDays(date, i));
  const splitOf = (days: string[]): HoursSplit =>
    layoutDays(shownSessions, days)
      .days.flatMap((day) => day.blocks)
      .reduce(
        (split, block) => {
          if (block.individual) split.individual += block.end - block.start;
          else split.group += block.end - block.start;
          return split;
        },
        { individual: 0, group: 0 },
      );
  const periodSplit = splitOf(periodDays);
  const periodName =
    shownView === "semaine"
      ? monday === mondayOf(today)
        ? "Cette semaine"
        : weekTitle(monday)
      : shownView === "jour"
        ? date === today
          ? "Aujourd'hui"
          : capitalize(longDay.format(utc(date)))
        : shownView === "mois"
          ? month === today.slice(0, 7)
            ? "Ce mois-ci"
            : capitalize(monthLabel(month))
          : `Du ${dayAndMonth.format(utc(date))} au ${dayAndMonth.format(utc(addDays(date, LIST_DAYS - 1)))}`;
  // La semaine du jour du milieu de l'écran (3 jours d'hier à demain : celle d'aujourd'hui).
  const phoneWeek = mondayOf(addDays(focus, Math.floor(perView / 2)));
  const phoneHours = grid
    ? {
        weekStart: phoneWeek,
        minutes: layoutDays(
          shownSessions,
          Array.from({ length: 7 }, (_, i) => addDays(phoneWeek, i)),
        ).totalMinutes,
      }
    : {
        label: periodName,
        minutes: periodSplit.individual + periodSplit.group,
      };

  const arrow =
    "grid size-8 place-items-center rounded-lg text-text-2 transition-colors duration-150 hover:bg-selected-hover";

  return (
    <>
      {/* Le menu Coory se replie en arrivant sur l'Agenda (et reprend son état en repartant). */}
      <AgendaSidebarCollapse />
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row lg:gap-3 lg:p-3">
        <h1 className="sr-only lg:hidden">Agenda</h1>
        <AgendaPhoneBar
          monthLabel={capitalize(monthName.format(utc(`${month}-01`)))}
          hours={phoneHours}
          views={phoneViews}
          kind={kind}
          kindHrefs={kindHrefs}
          mini={{ ...miniProps, dots }}
          months={months}
          todayLink={{
            href: todayHref,
            // La même ouverture qu'à l'arrivée : 3 jours d'hier à demain, la semaine depuis lundi.
            column: grid
              ? perView === 7
                ? mondayOf(today)
                : perView === 3
                  ? addDays(today, -1)
                  : today
              : null,
          }}
        />

        {/* Ordinateur : le panneau de l'agenda (le bouton ☰ de la barre le masque ou le montre). */}
        <aside
          data-agenda-panel=""
          aria-label="Agenda : navigation et filtres"
          className="hidden w-64 shrink-0 flex-col gap-6 overflow-y-auto rounded-[20px] border border-line bg-surface p-4 lg:flex"
        >
          <h1 className="flex items-center gap-2.5 px-1.5 pt-[14px] text-[15px] font-semibold tracking-tight">
            <Calendar aria-hidden size={18} strokeWidth={1.8} className="text-violet-text" />
            Agenda
          </h1>
          <AgendaMiniMonth {...miniProps} />
          <AgendaFilters kind={kind} hrefs={kindHrefs} />
          {/* Les heures de coaching de la période affichée (02/11), sous les filtres. */}
          <CoachingHours label={periodName} split={periodSplit} />
        </aside>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col lg:gap-3">
          {/* Ordinateur : la barre du haut ; le choix de la vue au centre exact. */}
          <header className="relative z-20 hidden h-16 shrink-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 rounded-[20px] border border-line bg-surface px-3 lg:grid">
            <div className="flex min-w-0 items-center gap-2">
              <AgendaPanelToggle />
              {/* Panneau masqué (☰) : le nom de la page passe dans la barre (02/11), pour toujours
                  savoir où l'on est. */}
              <p
                aria-hidden
                className="hidden shrink-0 items-center gap-2 pr-1.5 text-[15px] font-semibold tracking-tight [html[data-agenda-panel]_&]:flex"
              >
                <Calendar aria-hidden size={18} strokeWidth={1.8} className="text-violet-text" />
                Agenda
              </p>
              <Link
                href={todayHref}
                scroll={false}
                className="flex h-8 shrink-0 items-center rounded-lg border border-line px-3.5 text-[12px] font-medium transition-colors duration-150 hover:bg-selected-hover"
              >
                Aujourd&apos;hui
              </Link>
              <nav aria-label="Changer de période" className="flex shrink-0">
                <Link
                  href={prevHref}
                  scroll={false}
                  aria-label="Période précédente"
                  className={arrow}
                >
                  <ChevronLeft aria-hidden size={15} strokeWidth={1.8} />
                </Link>
                <Link
                  href={nextHref}
                  scroll={false}
                  aria-label="Période suivante"
                  className={arrow}
                >
                  <ChevronRight aria-hidden size={15} strokeWidth={1.8} />
                </Link>
              </nav>
              <p aria-hidden className="ml-1 truncate text-[15px] font-semibold tracking-tight">
                {periodText}
              </p>
            </div>
            <AgendaViewMenu
              items={desktopViews}
              prevHref={prevHref}
              nextHref={nextHref}
              todayHref={todayHref}
            />
            <div className="flex min-w-0 items-center justify-end gap-2">
              <HeaderTools compact />
              <NewSessionButton variant="header" date={shownView === "jour" ? date : undefined} />
            </div>
          </header>

          {/* Le calendrier : une carte sur ordinateur ; sur téléphone, l'écran lui-même, sur le fond gris des
              autres pages (02/11, choix d'Antonino : un seul fond dans toute l'app). */}
          <section
            aria-labelledby="agenda-title"
            className="isolate flex min-h-0 flex-1 flex-col overflow-hidden border-t border-line lg:rounded-[20px] lg:border lg:bg-surface"
          >
            <h2 id="agenda-title" className="sr-only">
              {title}
            </h2>
            <SwipeNav
              prevHref={swipePrevHref}
              nextHref={swipeNextHref}
              edges={grid}
              className="min-h-0 flex-1"
            >
              {content}
            </SwipeNav>
          </section>
        </div>
      </div>
      {/* Téléphone : « Nouvelle séance » est un bouton flottant en bas à droite, comme Google Agenda
          (03/11) ; la carte du haut garde la vue, l'assistant et la cloche. */}
      <NewSessionButton variant="fab" date={shownView === "jour" ? date : undefined} />
    </>
  );
}
