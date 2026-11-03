import { Users } from "lucide-react";
import type { CSSProperties } from "react";

import type { Discipline } from "@/domain/training/discipline";
import { dayLabel } from "@/features/agenda/calendar";
import type { WeekBlock, WeekLayout } from "@/features/agenda/week";
import type { MoveSessionInput } from "@/features/sessions/actions";

import { DayWeekStrip } from "./day-week-strip";
import { DraggableBlock, DropPreview, GridInteractions } from "./grid-interactions";
import { ScrollToDay } from "./scroll-to-day";
import { SlotLayer } from "./slot-layer";

// Grille horaire de la page Agenda (D-77, D-78) : des colonnes jointives séparées d'un filet, un jour
// sur deux légèrement gris (--day-alt). Les séances sont posées à leur heure exacte ; une séance d'une
// heure ou moins garde la hauteur d'une heure. Toute la journée, 00:00 - 24:00, se programme ; la
// grille s'ouvre sur la plage du réglage « Heures de l'agenda ». Heure : 44 px sur téléphone (02/11,
// comme le Calendrier de l'iPhone, pour voir plus d'heures), 48 px
// sur ordinateur (variable CSS --hour). Aujourd'hui : colonne teintée de violet, date en gras violet,
// ligne « maintenant » violette. Clic sur un créneau vide pour ajouter une séance,
// glisser-déposer pour la déplacer (D-35).
// Défilement (01/11, comme Google Agenda) : deux zones imbriquées, les heures défilent verticalement,
// les jours horizontalement (aimantés sur une colonne) ; l'en-tête des jours suit (ScrollToDay). La grille reçoit plusieurs semaines d'affilée : sur téléphone on glisse librement
// d'un jour et d'une semaine à l'autre (1, 3 ou 7 jours visibles) ; sur ordinateur, seuls les jours de
// `desktopDays` s'affichent (la semaine ou le jour choisis, les flèches changent de période).
// Le total d'heures n'est plus sous la grille (02/11) : panneau de l'Agenda sur ordinateur, menu
// déroulant du mois sur téléphone (data-minutes de chaque colonne).
// En-tête des jours (demande d'Antonino du 01/11) : de l'air au-dessus du nom du jour, et le nom collé
// à sa date. Sur téléphone (02/11, pour gagner de la place) : une seule ligne basse, « Lun 2 ».
// Air au-dessus de la première heure (en heures) : son chiffre, centré sur le filet, n'est pas coupé.
const AIR = 0.25;
// Une position dans la journée, en heures, d'après la hauteur d'une heure.
const at = (hours: number, extra = "") => `calc(var(--hour) * ${hours}${extra})`;

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
  return {
    name: name.charAt(0).toUpperCase() + name.slice(1),
    day: d.getUTCDate(),
  };
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
  dayHref,
  viewHref,
  perView,
  desktopDays,
  focus,
  creatable = false,
  onMove,
}: {
  layout: WeekLayout;
  today: string;
  // Heure actuelle (« 10:42 ») pour la ligne « maintenant ».
  now: string;
  // Page de la séance, ouverte sur cette date (02/11).
  sessionHref: (sessionId: string, date: string) => string;
  // Vue Jour : le jour écrit sous la bande de la semaine et des séances détaillées (le nom en entier,
  // l'horaire et le titre).
  single?: boolean;
  // Bande de la semaine (02/11) : adresse d'un jour ouvert d'un clic, et de la même vue à une autre
  // date (« __DATE__ » remplacé par la date).
  dayHref: string;
  viewHref: string;
  // Jours visibles à la fois sur téléphone : 1 (Jour), 3 (3 jours) ou 7 (Semaine).
  perView: 1 | 3 | 7;
  // Ordinateur : les jours affichés (la semaine ou le jour choisis) ; les autres sont masqués.
  desktopDays: string[];
  // Téléphone : le jour placé en premier à l'ouverture.
  focus: string;
  creatable?: boolean;
  onMove?: (input: MoveSessionInput) => Promise<{ ok: boolean; error?: string }>;
}) {
  const first = layout.firstHour;
  const nowHours = Number(now.slice(0, 2)) + Number(now.slice(3, 5)) / 60;
  const shown = new Set(desktopDays);
  // Largeur d'une colonne sur téléphone : la largeur de la grille (sans la marge des heures) divisée
  // par le nombre de jours visibles ; sur ordinateur, les jours affichés se partagent la largeur.
  const width = {
    1: "w-[calc(100cqw-var(--gut))]",
    3: "w-[calc((100cqw-var(--gut))/3)]",
    7: "w-[calc((100cqw-var(--gut))/7)]",
  }[perView];
  const column = (date: string) =>
    `${width} shrink-0 lg:w-auto lg:min-w-0 lg:flex-1 ${shown.has(date) ? "" : "lg:hidden"}`;
  const row = "flex w-max min-w-full lg:w-full";

  return (
    <GridInteractions move={onMove}>
      <ScrollToDay
        // Nouvelle période : la grille repart, ouverte sur son jour et son heure.
        key={`${layout.days[0]?.date}:${focus}:${perView}`}
        className="@container flex h-full min-h-0 flex-col [--gut:40px] [--hour:44px] lg:[--gut:48px] lg:[--hour:48px]"
        scrollHour={Math.max(first - AIR, 0)}
      >
        {/* La semaine au-dessus de la grille (comme le Calendrier de l'iPhone) ; en vue Jour, elle
            remplace l'en-tête du jour. */}
        {/* Téléphone seulement (02/11 : sur ordinateur, le petit calendrier du panneau suffit). */}
        <div className="lg:hidden">
          <DayWeekStrip
            initial={focus}
            today={today}
            dayHref={dayHref}
            viewHref={viewHref}
            span={single ? 1 : perView}
            title={single}
          />
        </div>
        {/* En-tête des jours : suit le défilement horizontal des jours. */}
        <div
          className={`flex h-8 shrink-0 border-b border-line-soft lg:h-16 ${single ? "max-lg:hidden" : ""}`}
        >
          <div aria-hidden className="w-[var(--gut)] shrink-0" />
          <div data-grid-head="" className="min-w-0 flex-1 overflow-hidden">
            <div className={`${row} h-full`}>
              {layout.days.map((day) => {
                const { name, day: number } = dayParts(day.date);
                const isToday = day.date === today;
                return (
                  <div
                    key={day.date}
                    className={`${column(day.date)} flex border-l border-line-soft ${
                      single
                        ? "items-center gap-3 px-5"
                        : "items-center justify-center gap-1 lg:flex-col"
                    }`}
                  >
                    {/* La date en gras, sans rond ; aujourd'hui en violet (demande d'Antonino du
                        02/11 : le rond rapprochait trop le chiffre du nom du jour). */}
                    <span
                      className={`leading-none tabular ${
                        single ? "order-first text-[22px]" : "order-last text-[15px] lg:text-[17px]"
                      } ${isToday ? "font-bold text-violet-text" : "font-semibold text-text"}`}
                    >
                      {number}
                    </span>
                    <span
                      className={`text-[13px] leading-none ${single ? "lg:text-[14px] lg:font-medium" : "lg:text-[11px]"} ${isToday ? "font-medium text-violet-text" : single ? "text-text-2" : "text-muted"}`}
                    >
                      {single ? capitalize(dayLabel(day.date)) : name}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Les heures défilent verticalement ; dedans, les jours défilent horizontalement. */}
        <div
          data-grid-scroll=""
          className="flex min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain [scrollbar-width:thin]"
        >
          <div
            data-gutter
            aria-hidden
            className="relative w-[var(--gut)] shrink-0"
            style={{ height: at(24) }}
          >
            {Array.from({ length: 24 }, (_, hour) => hour + 1).map((hour) => (
              <span
                key={hour}
                className="absolute right-2 -translate-y-1/2 text-[12px] text-faint tabular lg:text-[10.5px]"
                style={{ top: at(hour) }}
              >
                {hour < 24 ? String(hour).padStart(2, "0") : ""}
              </span>
            ))}
          </div>
          <div
            data-grid-x=""
            className="relative min-w-0 flex-1 snap-x snap-mandatory overflow-x-auto overflow-y-hidden overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            style={{ height: at(24) }}
          >
            <div className={row}>
              {layout.days.map((day, index) => {
                const isToday = day.date === today;
                return (
                  <div
                    key={day.date}
                    data-day-col=""
                    data-date={day.date}
                    // Minutes de coaching du jour : le total de la semaine affichée (téléphone).
                    data-minutes={day.minutes}
                    data-start={day.date === focus ? "" : undefined}
                    className={`${column(day.date)} snap-start border-l border-line-soft`}
                  >
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
                        height: at(24),
                        backgroundImage: `linear-gradient(var(--line-soft) 1px, transparent 1px)`,
                        backgroundSize: "100% var(--hour)",
                      }}
                    >
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
                          top: at(block.start / 60, " + 1px"),
                          height: at(Math.max(minutes, 60) / 60, " - 2px"),
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
                            href={sessionHref(block.sessionId, block.date)}
                            title={`${block.label} · ${block.title} · ${block.subtitle}`}
                            style={style}
                            className={`absolute flex flex-col justify-center overflow-hidden rounded-lg px-1.5 transition-[filter,opacity] duration-150 hover:brightness-110 ${
                              fills[block.discipline ?? "none"]
                            }`}
                          >
                            {single ? (
                              // Vue d'un jour : la place de tout écrire (le nom en entier, l'horaire
                              // et le titre de la séance), comme Google Agenda.
                              <>
                                <span className="flex min-w-0 items-center gap-1 text-[14px] leading-[1.25] font-semibold lg:text-[12.5px]">
                                  {block.individual ? null : (
                                    <Users
                                      aria-hidden
                                      size={12}
                                      strokeWidth={2.2}
                                      className="shrink-0"
                                    />
                                  )}
                                  <span className="min-w-0 truncate">{block.title}</span>
                                </span>
                                <span className="truncate text-[13px] leading-[1.25] opacity-90 tabular lg:text-[11.5px]">
                                  {time(block.start)} – {time(block.end)} ·{" "}
                                  {block.individual
                                    ? block.subtitle
                                    : `Collective · ${block.subtitle}`}
                                </span>
                              </>
                            ) : (
                              <>
                                <span className="flex min-w-0 items-center gap-0.5 text-[13px] leading-[1.2] font-semibold lg:text-[11px]">
                                  {block.individual ? null : (
                                    <Users
                                      aria-hidden
                                      size={11}
                                      strokeWidth={2.2}
                                      className="shrink-0"
                                    />
                                  )}
                                  <span className="min-w-0 truncate">{shortName(block)}</span>
                                </span>
                                <span className="truncate text-[12px] leading-[1.2] opacity-90 tabular lg:text-[10.5px]">
                                  {minutes > 60
                                    ? `${time(block.start)} · ${hoursLabel(minutes)}`
                                    : time(block.start)}
                                </span>
                              </>
                            )}
                          </DraggableBlock>
                        );
                      })}
                      {onMove ? <DropPreview date={day.date} firstHour={0} /> : null}
                      {isToday ? (
                        <span
                          aria-hidden
                          className="pointer-events-none absolute inset-x-0 z-10 h-px bg-violet"
                          style={{ top: at(nowHours) }}
                        >
                          <span className="absolute -top-[3px] -left-[3px] size-[7px] rounded-full bg-violet shadow-[0_0_0_3px_var(--violet-ring)]" />
                        </span>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </ScrollToDay>
    </GridInteractions>
  );
}
