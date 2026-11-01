import { Users } from "lucide-react";
import type { CSSProperties } from "react";

import type { Discipline } from "@/domain/training/discipline";
import { dayLabel } from "@/features/agenda/calendar";
import { addDays } from "@/features/agenda/items";
import type { WeekBlock, WeekLayout } from "@/features/agenda/week";
import type { MoveSessionInput } from "@/features/sessions/actions";

import { DraggableBlock, DropPreview, GridInteractions } from "./grid-interactions";
import { ScrollToDay } from "./scroll-to-day";
import { SlotLayer } from "./slot-layer";
import { KindLegend } from "./week-time-grid";

// Agenda de la semaine du tableau de bord, en GRILLE (mode « Grille » de la maquette v6, D-77 ; choisi
// par Antonino le 01/11 à la place des cases, sur ordinateur comme sur téléphone) : sept colonnes
// jointives séparées d'un filet, un jour sur deux légèrement gris (--day-alt) pour bien distinguer les
// jours. Les séances sont posées à leur heure exacte, une heure = 34 px, et une séance d'une heure ou
// moins garde toujours la hauteur d'une heure (seules les plus longues sont plus hautes).
// Toute la journée, 00:00 - 24:00, se programme : la semaine DÉFILE D'UN SEUL BLOC (tous les jours
// ensemble, les heures écrites une seule fois à gauche) et s'ouvre sur la plage du réglage « Heures de
// l'agenda » (élargie par une séance plus tôt ou plus tard). Restent en place pendant le défilement :
// l'en-tête des jours en haut, les totaux en bas, la marge des heures (et des moments de la journée,
// Matin, Midi, Après-midi, Soir) à gauche.
// Aujourd'hui : colonne teintée de violet, numéro dans un rond violet, ligne « maintenant » violette.
// Mêmes interactions que la grille de la page Agenda (D-35) : clic sur un créneau vide pour ajouter une
// séance, glisser-déposer pour la déplacer (la grille défile près de ses bords).
// Téléphone : trois jours entiers à l'écran, on fait glisser ; la marge des heures reste collée.
const HOUR = 34;
const HEAD = 58;
const DAY = 24 * HOUR;
// Rangée des totaux, collée en bas de la zone visible.
const TOTAL = 32;
// Air au-dessus de la première heure et sous la dernière (en heures) : leurs chiffres, centrés sur le
// filet, ne sont pas coupés par l'en-tête des jours ni par les totaux.
const AIR = 0.25;

const BANDS: [label: string, from: number, to: number][] = [
  ["Matin", 0, 12],
  ["Midi", 12, 14],
  ["Après-midi", 14, 18],
  ["Soir", 18, 24],
];

const fills: Record<Discipline | "none", string> = {
  running: "bg-run-fill text-on-run-fill",
  strength: "bg-strength-fill text-on-strength-fill",
  hyrox: "bg-hyrox-fill text-on-hyrox-fill",
  hybrid: "bg-hybrid-fill text-on-hybrid-fill",
  none: "bg-chip text-text",
};

const weekday = new Intl.DateTimeFormat("fr-BE", { weekday: "short", timeZone: "UTC" });
const dayParts = (date: string) => {
  const d = new Date(`${date}T00:00:00Z`);
  const name = weekday.format(d).replace(".", "");
  return { name: name.charAt(0).toUpperCase() + name.slice(1), day: d.getUTCDate() };
};
const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);
// Durée courte : « 1h30 », « 0h45 », « 6h ».
const hoursLabel = (minutes: number) =>
  `${Math.floor(minutes / 60)}h${minutes % 60 ? String(minutes % 60).padStart(2, "0") : ""}`;
const time = (minutes: number) =>
  `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;

// Un sportif s'écrit « Prénom I. » (Nadia E.) ; une séance collective garde son titre.
export function shortName(block: Pick<WeekBlock, "title" | "individual">): string {
  if (!block.individual) return block.title;
  const [first, ...rest] = block.title.trim().split(/\s+/);
  return rest.length > 0 ? `${first} ${rest[0].charAt(0).toUpperCase()}.` : first;
}

export function WeekGrid({
  layout,
  today,
  now,
  sessionHref,
  single = false,
  fullWeek = false,
  creatable = false,
  focus,
  onMove,
}: {
  layout: WeekLayout;
  today: string;
  // Heure actuelle (« 10:42 ») pour la ligne « maintenant ».
  now: string;
  sessionHref: (sessionId: string) => string;
  // Vue d'un seul jour.
  single?: boolean;
  // Téléphone, vue « Semaine » : les 7 jours tiennent dans l'écran (colonnes étroites).
  fullWeek?: boolean;
  creatable?: boolean;
  // Téléphone : jour placé en premier à l'ouverture (la semaine précédente, atteinte au doigt depuis
  // lundi, s'ouvre sur dimanche). Sinon : la veille d'aujourd'hui, ou le lundi.
  focus?: string;
  onMove?: (input: MoveSessionInput) => Promise<{ ok: boolean; error?: string }>;
}) {
  const first = layout.firstHour;
  const last = layout.lastHour;
  // Hauteur de la zone visible : la plage du réglage (et un peu d'air), l'en-tête des jours, les totaux.
  const height = HEAD + (last - first + 2 * AIR) * HOUR + TOTAL;
  const nowHours = Number(now.slice(0, 2)) + Number(now.slice(3, 5)) / 60;
  const dates = layout.days.map((day) => day.date);
  const yesterday = addDays(today, -1);
  const start =
    focus && dates.includes(focus)
      ? focus
      : dates.includes(yesterday)
        ? yesterday
        : dates.includes(today)
          ? today
          : dates[0];
  // Téléphone, 3 jours : chaque colonne mesure le tiers de la largeur moins la marge des heures.
  const column =
    single || fullWeek
      ? "min-w-0 flex-1"
      : "w-[calc((100cqw-var(--gut))/3)] shrink-0 snap-start lg:w-auto lg:min-w-0 lg:flex-1";
  const row = `flex ${single || fullWeek ? "w-full" : "w-max min-w-full lg:w-full"}`;

  return (
    <GridInteractions move={onMove}>
      <div className="flex flex-col gap-3">
        <ScrollToDay
          // Nouvelle période (flèches ou doigt) : la grille repart, ouverte sur son jour et son heure.
          key={`${dates[0]}:${start}`}
          className="@container snap-x snap-mandatory scroll-pl-[var(--gut)] overflow-auto [--gut:52px] [scrollbar-width:thin] lg:[--gut:58px]"
          style={{ "--hour": `${HOUR}px`, height } as CSSProperties}
          scrollHour={Math.max(first - AIR, 0)}
        >
          <div className={row}>
            {/* Marge : heures et moments de la journée, collée à gauche pendant le défilement. */}
            <div
              data-gutter
              aria-hidden
              className="sticky left-0 z-40 w-[var(--gut)] shrink-0 bg-surface"
            >
              <div
                className="sticky top-0 z-10 border-b border-line-soft bg-surface"
                style={{ height: HEAD }}
              />
              <div className="relative" style={{ height: DAY }}>
                {BANDS.map(([label, from, to]) => {
                  // Le nom est centré dans la partie de son moment visible à l'ouverture (dans tout
                  // le moment s'il est hors de la plage).
                  const seen = Math.min(to, last) > Math.max(from, first);
                  const top = seen ? Math.max(from, first) : from;
                  const bottom = seen ? Math.min(to, last) : to;
                  return (
                    <div
                      key={label}
                      className={`absolute left-0 w-4 ${from > 0 ? "border-t border-line" : ""}`}
                      style={{ top: from * HOUR, height: (to - from) * HOUR }}
                    >
                      <span
                        className="absolute left-0 flex w-4 items-center justify-center"
                        style={{ top: (top - from) * HOUR, height: (bottom - top) * HOUR }}
                      >
                        <span className="rotate-180 text-[10.5px] font-medium whitespace-nowrap text-text-2 [writing-mode:vertical-rl]">
                          {label}
                        </span>
                      </span>
                    </div>
                  );
                })}
                {Array.from({ length: 25 }, (_, hour) => hour).map((hour) => (
                  <span
                    key={hour}
                    className={`absolute right-1.5 text-[10.5px] text-faint tabular ${hour > 0 ? "-translate-y-1/2" : ""}`}
                    style={{ top: hour * HOUR }}
                  >
                    {String(hour).padStart(2, "0")}
                  </span>
                ))}
              </div>
            </div>

            {layout.days.map((day, index) => {
              const { name, day: number } = dayParts(day.date);
              const isToday = day.date === today;
              return (
                <div
                  key={day.date}
                  data-start={day.date === start ? "" : undefined}
                  className={`${column} flex flex-col border-l border-line-soft`}
                >
                  <div
                    className="sticky top-0 z-30 flex flex-col items-center border-b border-line-soft bg-surface pt-2.5"
                    style={{ height: HEAD }}
                  >
                    <span className={`text-[11px] ${isToday ? "text-violet-text" : "text-muted"}`}>
                      {name}
                    </span>
                    <span
                      className={`mt-0.5 grid size-6 place-items-center rounded-full text-[12px] font-medium tabular ${
                        isToday ? "bg-accent text-on-accent" : "text-text"
                      }`}
                    >
                      {number}
                    </span>
                  </div>
                  <div
                    // Repères du glisser-déposer : le jour et la plage horaire de la colonne (toute la
                    // journée).
                    data-drop-date={day.date}
                    data-first-hour={0}
                    data-span={24}
                    className={`relative ${
                      isToday
                        ? "bg-today-col shadow-[inset_0_0_0_1px_var(--violet-line)]"
                        : index % 2 === 1
                          ? "bg-day-alt"
                          : ""
                    }`}
                    style={{
                      height: DAY,
                      backgroundImage: `linear-gradient(var(--line-soft) 1px, transparent 1px)`,
                      backgroundSize: `100% ${HOUR}px`,
                    }}
                  >
                    {BANDS.slice(1).map(([label, from]) => (
                      <span
                        key={label}
                        aria-hidden
                        className="absolute inset-x-0 h-px bg-line"
                        style={{ top: from * HOUR }}
                      />
                    ))}
                    {creatable ? (
                      <SlotLayer
                        date={day.date}
                        dayLabel={capitalize(dayLabel(day.date))}
                        firstHour={0}
                        span={24}
                      />
                    ) : null}
                    {day.blocks.map((block) => {
                      const minutes = block.end - block.start;
                      const style = {
                        top: (block.start / 60) * HOUR + 1,
                        height: (Math.max(minutes, 60) / 60) * HOUR - 2,
                        left: `calc(${(block.lane / block.lanes) * 100}% + 4px)`,
                        width: `calc(${100 / block.lanes}% - 8px)`,
                      } as CSSProperties;
                      return (
                        <DraggableBlock
                          key={block.key}
                          block={{
                            sessionId: block.sessionId,
                            originalDate: block.originalDate,
                            date: block.date,
                            start: block.start,
                            end: block.end,
                            title: block.title,
                            recurring: block.recurring,
                            moved: block.moved,
                          }}
                          href={sessionHref(block.sessionId)}
                          title={`${block.label} · ${block.title} · ${block.subtitle}`}
                          style={style}
                          className={`absolute flex flex-col justify-center overflow-hidden rounded-lg px-1.5 transition-[filter,opacity] duration-150 hover:brightness-110 ${
                            fills[block.discipline ?? "none"]
                          }`}
                        >
                          <span className="flex min-w-0 items-center gap-0.5 text-[11px] leading-[1.2] font-semibold">
                            {block.individual ? null : (
                              <Users aria-hidden size={11} strokeWidth={2.2} className="shrink-0" />
                            )}
                            <span className="min-w-0 truncate">{shortName(block)}</span>
                          </span>
                          <span className="truncate text-[10.5px] leading-[1.2] opacity-90 tabular">
                            {minutes > 60
                              ? `${time(block.start)} · ${hoursLabel(minutes)}`
                              : time(block.start)}
                          </span>
                        </DraggableBlock>
                      );
                    })}
                    {onMove ? <DropPreview date={day.date} firstHour={0} /> : null}
                    {isToday ? (
                      <span
                        aria-hidden
                        className="pointer-events-none absolute inset-x-0 z-10 h-px bg-violet"
                        style={{ top: nowHours * HOUR }}
                      >
                        <span className="absolute -top-[3px] -left-[3px] size-[7px] rounded-full bg-violet shadow-[0_0_0_3px_var(--violet-ring)]" />
                      </span>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
          {/* Total d'heures de chaque jour, sous sa colonne (demande d'Antonino du 01/11). */}
          <div
            className={`sticky bottom-0 z-40 items-center border-t border-line-soft bg-surface ${row}`}
            style={{ height: TOTAL }}
          >
            <span className="sticky left-0 w-[var(--gut)] shrink-0 bg-surface text-[11px] text-faint">
              Total
            </span>
            {layout.days.map((day) => (
              <span
                key={day.date}
                className={`${column} text-center text-[12px] font-medium tabular ${
                  day.date === today ? "text-violet-text" : "text-text"
                }`}
              >
                {hoursLabel(day.minutes)}
              </span>
            ))}
          </div>
        </ScrollToDay>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted">
          <KindLegend />
          <span>
            {single ? (
              "1 jour · fais défiler pour toute la journée"
            ) : (
              <>
                <span className="lg:hidden">
                  {fullWeek ? "7 jours" : "Glisse pour changer de jour"}
                </span>
                <span className="hidden lg:inline">
                  7 jours · fais défiler pour toute la journée
                </span>
              </>
            )}
          </span>
          <span className="ml-auto shrink-0 tabular">00:00 – 24:00</span>
        </div>
      </div>
    </GridInteractions>
  );
}
