import { CalendarDays, Coffee, SlidersHorizontal } from "lucide-react";
import Link from "next/link";

import { buttonClass } from "@/components/ui/button";
import type { Discipline } from "@/domain/training/discipline";
import { monthGrid } from "@/features/agenda/calendar";
import { formatHours, type WeekBlock, type WeekLayout } from "@/features/agenda/week";

import { ScrollToDay } from "./scroll-to-day";

// Agenda du tableau de bord (D-28) : trois vues sans quitter la page.
// Semaine : 7 colonnes sur ordinateur, 3 colonnes à faire défiler sur téléphone (départ : aujourd'hui).
// Jour : une grande colonne avec toutes les heures. Mois : la grille du mois, un jour ouvre sa journée.
export type AgendaView = "semaine" | "jour" | "mois";

const HOUR = 50;

// Bloc d'une séance (maquettes, D-29) : fond sombre teinté de sa discipline et barre de couleur à
// gauche ; texte en couleur de texte (≥ 6:1 mesuré sur chaque teinte, dans les deux thèmes).
const blockClasses: Record<Discipline | "none", string> = {
  running:
    "border-l-[3px] border-l-run bg-[color-mix(in_srgb,var(--run)_var(--tint-block),var(--surface))]",
  strength:
    "border-l-[3px] border-l-strength bg-[color-mix(in_srgb,var(--strength)_var(--tint-block),var(--surface))]",
  hyrox:
    "border-l-[3px] border-l-hyrox bg-[color-mix(in_srgb,var(--hyrox)_var(--tint-block),var(--surface))]",
  hybrid:
    "border-l-[3px] border-l-hybrid bg-[color-mix(in_srgb,var(--hybrid)_var(--tint-block),var(--surface))]",
  none: "border-l-[3px] border-l-line-2 bg-chip",
};
const dotClasses: Record<Discipline | "none", string> = {
  running: "bg-run",
  strength: "bg-strength",
  hyrox: "bg-hyrox",
  hybrid: "bg-hybrid",
  none: "bg-muted",
};

const shortDay = new Intl.DateTimeFormat("fr-BE", { weekday: "short", timeZone: "UTC" });
const longDay = new Intl.DateTimeFormat("fr-BE", { weekday: "long", timeZone: "UTC" });
const shortMonth = new Intl.DateTimeFormat("fr-BE", { month: "short", timeZone: "UTC" });
const parts = (date: string) => {
  const d = new Date(`${date}T00:00:00Z`);
  return {
    weekday: shortDay.format(d).replace(".", ""),
    longWeekday: longDay.format(d),
    day: d.getUTCDate(),
    month: shortMonth.format(d),
  };
};

type Props = {
  view: AgendaView;
  // Semaine ou journée affichée (une seule colonne en vue Jour).
  layout: WeekLayout;
  // Vue Mois : séances de chaque jour du mois affiché.
  month: string;
  monthBlocks: Map<string, WeekBlock[]>;
  today: string;
  agendaHref: string;
  viewHref: (view: AgendaView, date?: string) => string;
};

export function WeekAgenda({
  view,
  layout,
  month,
  monthBlocks,
  today,
  agendaHref,
  viewHref,
}: Props) {
  const sessionHref = (id: string) => `${agendaHref}/seances/${id}`;
  const tab = (target: AgendaView, label: string, active: boolean) => (
    <Link
      href={target === "jour" ? viewHref("jour", today) : viewHref(target)}
      aria-current={active ? "page" : undefined}
      className={`rounded-[7px] px-3 py-1 text-caption ${
        active ? "bg-accent font-semibold text-on-accent" : "text-muted hover:text-text"
      }`}
    >
      {label}
    </Link>
  );

  return (
    <section
      aria-labelledby="week-agenda-title"
      className="flex min-w-0 flex-col gap-4 rounded-card border border-line bg-surface p-4 md:p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <CalendarDays aria-hidden size={22} strokeWidth={1.7} className="text-muted" />
          <div className="flex flex-col">
            <h2 id="week-agenda-title" className="text-title font-medium">
              {view === "jour"
                ? "Agenda du jour"
                : view === "mois"
                  ? "Agenda du mois"
                  : "Agenda de la semaine"}
            </h2>
            {view !== "mois" ? (
              <p className="text-caption text-muted">
                {formatHours(layout.totalMinutes)} planifiées
              </p>
            ) : null}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <nav
            aria-label="Vue de l'agenda"
            className="inline-flex rounded-[9px] border border-line p-0.5"
          >
            {tab("jour", "Aujourd'hui", view === "jour")}
            {tab("semaine", "Semaine", view === "semaine")}
            {tab("mois", "Mois", view === "mois")}
          </nav>
          <Link href={agendaHref} className={buttonClass({ variant: "outline", size: "sm" })}>
            <SlidersHorizontal aria-hidden size={14} strokeWidth={1.8} />
            Filtres
          </Link>
        </div>
      </div>

      {view === "mois" ? (
        <MonthGrid month={month} monthBlocks={monthBlocks} today={today} viewHref={viewHref} />
      ) : (
        <TimeGrid
          layout={layout}
          today={today}
          sessionHref={sessionHref}
          single={view === "jour"}
        />
      )}
    </section>
  );
}

function TimeGrid({
  layout,
  today,
  sessionHref,
  single,
}: {
  layout: WeekLayout;
  today: string;
  sessionHref: (id: string) => string;
  single: boolean;
}) {
  const hours = Array.from(
    { length: layout.lastHour - layout.firstHour + 1 },
    (_, i) => layout.firstHour + i,
  );
  const height = (layout.lastHour - layout.firstHour) * HOUR;
  // Colonne de départ du défilement : aujourd'hui s'il est dans la semaine, sinon le premier jour.
  const start = layout.days.some((d) => d.date === today) ? today : layout.days[0]?.date;
  // Téléphone : 3 colonnes visibles ; ordinateur : toutes les colonnes se partagent la largeur.
  // Largeurs en unités de conteneur (cqw = largeur visible de la zone qui défile) : la colonne des
  // heures reste collée à gauche pendant tout le défilement.
  const columnWidth = single
    ? "w-[calc(100cqw-48px)]"
    : "w-[calc((100cqw-48px)/3)] md:w-[calc((100cqw-48px)/7)]";

  return (
    <ScrollToDay className="@container snap-x snap-mandatory scroll-pl-12 overflow-x-auto">
      <div className="flex w-max min-w-full">
        <div data-gutter className="sticky left-0 z-10 w-12 shrink-0 bg-surface" aria-hidden>
          <div className="h-12 border-b border-line" />
          <div className="relative" style={{ height }}>
            {hours.map((hour) => (
              <span
                key={hour}
                className="absolute right-2 -translate-y-1/2 font-mono text-micro text-muted tabular"
                style={{ top: (hour - layout.firstHour) * HOUR }}
              >
                {String(hour).padStart(2, "0")}:00
              </span>
            ))}
          </div>
        </div>
        {layout.days.map((day) => {
          const p = parts(day.date);
          const isToday = day.date === today;
          return (
            <div
              key={day.date}
              data-start={day.date === start ? "" : undefined}
              className={`${columnWidth} shrink-0 snap-start`}
            >
              <div
                className={`flex h-12 flex-col items-center justify-center border-b border-line text-center ${
                  isToday
                    ? "rounded-t-[10px] bg-[color-mix(in_srgb,var(--accent)_14%,var(--surface))]"
                    : ""
                }`}
              >
                <span
                  className={`text-small font-medium capitalize ${isToday ? "text-accent-text" : ""}`}
                >
                  {single ? `${p.longWeekday} ${p.day} ${p.month}` : `${p.weekday} ${p.day}`}
                </span>
                <span className="text-caption text-muted">
                  {single ? "" : p.month}
                  {day.minutes > 0 ? `${single ? "" : " · "}${formatHours(day.minutes)}` : ""}
                </span>
              </div>
              <div
                className={`relative border-l border-line ${
                  isToday && !single
                    ? "bg-[color-mix(in_srgb,var(--accent)_7%,var(--surface))]"
                    : ""
                }`}
                style={{ height }}
              >
                {hours.slice(1, -1).map((hour) => (
                  <span
                    key={hour}
                    aria-hidden
                    className="absolute inset-x-0 border-t border-line/60"
                    style={{ top: (hour - layout.firstHour) * HOUR }}
                  />
                ))}
                {day.blocks.length === 0 ? (
                  <span className="absolute inset-x-0 top-1/2 flex -translate-y-1/2 flex-col items-center gap-1 text-caption text-muted">
                    <Coffee aria-hidden size={16} strokeWidth={1.6} />
                    Libre
                  </span>
                ) : null}
                {day.blocks.map((block) => {
                  const blockHeight = Math.max(26, ((block.end - block.start) / 60) * HOUR - 3);
                  // Bloc court (une heure ou moins) : nom et horaire seulement, sans texte coupé.
                  const roomy = blockHeight >= 64 || single;
                  return (
                    <Link
                      key={block.key}
                      href={sessionHref(block.sessionId)}
                      title={`${block.label} · ${block.title} · ${block.subtitle}`}
                      className={`absolute flex flex-col justify-center overflow-hidden rounded-[8px] px-2 py-1 transition-[filter] hover:brightness-110 ${
                        blockClasses[block.discipline ?? "none"]
                      }`}
                      style={{
                        top: ((block.start - layout.firstHour * 60) / 60) * HOUR + 1,
                        height: blockHeight,
                        left: `calc(${(block.lane / block.lanes) * 100}% + 3px)`,
                        width: `calc(${100 / block.lanes}% - 6px)`,
                      }}
                    >
                      <span className="truncate text-caption leading-tight font-semibold">
                        {block.title}
                      </span>
                      {roomy ? (
                        <span className="truncate text-micro leading-tight">{block.subtitle}</span>
                      ) : null}
                      <span className="truncate font-mono text-micro leading-tight tabular opacity-80">
                        {block.label}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </ScrollToDay>
  );
}

const weekDayNames = ["lun.", "mar.", "mer.", "jeu.", "ven.", "sam.", "dim."];

function MonthGrid({
  month,
  monthBlocks,
  today,
  viewHref,
}: {
  month: string;
  monthBlocks: Map<string, WeekBlock[]>;
  today: string;
  viewHref: (view: AgendaView, date?: string) => string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="grid grid-cols-7 text-center text-caption text-muted">
        {weekDayNames.map((name) => (
          <span key={name} className="py-1">
            {name}
          </span>
        ))}
      </div>
      <ol className="grid grid-cols-7 gap-1">
        {monthGrid(month)
          .flat()
          .map((day) => {
            const blocks = monthBlocks.get(day.iso) ?? [];
            if (!day.inMonth) return <li key={day.iso} aria-hidden />;
            const isToday = day.iso === today;
            return (
              <li key={day.iso}>
                <Link
                  href={viewHref("jour", day.iso)}
                  aria-label={`${day.day} : ${blocks.length} séance${blocks.length > 1 ? "s" : ""}`}
                  className="flex min-h-14 flex-col items-center gap-1 rounded-[10px] border border-line px-1 py-1.5 hover:bg-surface-2 md:min-h-20 md:items-stretch"
                >
                  <span
                    className={`inline-flex size-7 items-center justify-center self-center rounded-full text-small tabular md:self-start ${
                      isToday ? "bg-accent font-semibold text-on-accent" : ""
                    }`}
                  >
                    {day.day}
                  </span>
                  {/* Téléphone : des points de couleur ; ordinateur : l'heure et le nom. */}
                  <span className="flex flex-wrap justify-center gap-0.5 md:hidden">
                    {blocks.slice(0, 3).map((block) => (
                      <span
                        key={block.key}
                        className={`size-1.5 rounded-full ${dotClasses[block.discipline ?? "none"]}`}
                      />
                    ))}
                  </span>
                  <span className="hidden flex-col gap-0.5 md:flex">
                    {blocks.slice(0, 2).map((block) => (
                      <span
                        key={block.key}
                        className={`truncate rounded-[5px] px-1 text-micro ${
                          blockClasses[block.discipline ?? "none"]
                        }`}
                      >
                        {block.label.slice(0, 5)} {block.title}
                      </span>
                    ))}
                    {blocks.length > 2 ? (
                      <span className="text-micro text-muted">+{blocks.length - 2}</span>
                    ) : null}
                  </span>
                </Link>
              </li>
            );
          })}
      </ol>
    </div>
  );
}
