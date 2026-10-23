import type { CSSProperties } from "react";

import type { Discipline } from "@/domain/training/discipline";
import { dayLabel } from "@/features/agenda/calendar";
import { addDays } from "@/features/agenda/items";
import { formatHoursShort, type WeekLayout } from "@/features/agenda/week";
import type { MoveSessionInput } from "@/features/sessions/actions";

import { DraggableBlock, DropPreview, GridInteractions } from "./grid-interactions";
import { ScrollToDay } from "./scroll-to-day";
import { SlotLayer } from "./slot-layer";

// Grille horaire de la semaine (prompt Claude Design §6), au tableau de bord et dans l'Agenda.
// Toute la journée (06:00 → 22:00 par défaut) est visible sans défilement vertical : la page défile.
// Interactive (D-35) : un clic sur un créneau vide ajoute une séance (`creatable`, dans un
// NewSessionSheet), une séance se déplace au glisser-déposer (`onMove`).
// Une heure = 44 px sur téléphone, 48 px sur ordinateur (variable CSS --hour). Ordinateur : 7 colonnes
// égales. Téléphone : colonnes de 104 px, 3 jours visibles, défilement horizontal qui s'ouvre sur la
// veille d'aujourd'hui. Vue « jour » : une seule colonne pleine largeur.
const disciplineColor: Record<Discipline | "none", string> = {
  running: "var(--run)",
  strength: "var(--strength)",
  hyrox: "var(--hyrox)",
  hybrid: "var(--hybrid)",
  none: "var(--muted)",
};

const weekday = new Intl.DateTimeFormat("fr-BE", { weekday: "short", timeZone: "UTC" });
const dayParts = (date: string) => {
  const d = new Date(`${date}T00:00:00Z`);
  const name = weekday.format(d).replace(".", "");
  return { name: name.charAt(0).toUpperCase() + name.slice(1), day: d.getUTCDate() };
};

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);
const hourLabel = (hour: number) => `${String(hour).padStart(2, "0")}:00`;
// Position verticale en heures depuis le début de la grille, convertie par la variable --hour.
const at = (hours: number) => `calc(var(--hour) * ${hours})`;

export function WeekTimeGrid({
  layout,
  today,
  now,
  sessionHref,
  single = false,
  fit = false,
  creatable = false,
  onMove,
}: {
  layout: WeekLayout;
  today: string;
  // Heure actuelle (« 10:42 ») pour la ligne « maintenant » sur la colonne d'aujourd'hui.
  now: string;
  sessionHref: (sessionId: string) => string;
  single?: boolean;
  // Tableau de bord (demandes d'Antonino). Téléphone : la hauteur d'une heure s'adapte pour que la
  // carte entière tienne dans la hauteur visible (26–44 px ; --grid-chrome = barre du haut, en-tête
  // de carte, en-tête des jours, légende). Ordinateur : 40 px par heure, et la grille défile dans sa
  // carte, à la hauteur de l'écran (mesurée au navigateur), ouverte près de l'heure actuelle.
  fit?: boolean;
  creatable?: boolean;
  onMove?: (input: MoveSessionInput) => Promise<{ ok: boolean; error?: string }>;
}) {
  const span = layout.lastHour - layout.firstHour;
  const hours = Array.from({ length: span + 1 }, (_, i) => layout.firstHour + i);
  const nowHours = Number(now.slice(0, 2)) + Number(now.slice(3, 5)) / 60 - layout.firstHour;
  const showNow = nowHours >= 0 && nowHours <= span;
  // Ouverture de la grille qui défile (ordinateur) : 1 h 30 avant maintenant si aujourd'hui est
  // affiché, sinon juste avant la première séance, sinon 08:00.
  const firstStart = Math.min(...layout.days.flatMap((day) => day.blocks.map((b) => b.start)));
  const scrollHour = Math.max(
    0,
    layout.days.some((day) => day.date === today) && showNow
      ? nowHours - 1.5
      : Number.isFinite(firstStart)
        ? firstStart / 60 - layout.firstHour - 0.5
        : 8 - layout.firstHour,
  );
  // Colonne d'ouverture sur téléphone : la veille d'aujourd'hui si elle est dans la semaine.
  const dates = layout.days.map((day) => day.date);
  const yesterday = addDays(today, -1);
  const start = dates.includes(yesterday) ? yesterday : dates.includes(today) ? today : dates[0];
  const column = single
    ? "min-w-0 flex-1"
    : "w-[104px] shrink-0 snap-start lg:w-auto lg:min-w-0 lg:flex-1";

  return (
    <GridInteractions move={onMove}>
      <div className="flex flex-col gap-2.5">
        <ScrollToDay
          className={`snap-x snap-mandatory scroll-pl-12 overflow-x-auto rounded-wide border border-line bg-bg ${
            fit
              ? "[--hour:clamp(26px,calc((100dvh-var(--grid-chrome))/16),44px)] [--grid-chrome:340px] lg:max-h-[max(380px,calc(100dvh-var(--grid-chrome-lg,560px)))] lg:overflow-y-auto lg:[--hour:40px]"
              : "[--hour:44px] lg:[--hour:48px]"
          }`}
          fitPage={fit}
          scrollHour={scrollHour}
        >
          <div className={`flex ${single ? "w-full" : "w-max min-w-full lg:w-full"}`}>
            {/* Heures, collées à gauche pendant le défilement. */}
            <div data-gutter aria-hidden className="sticky left-0 z-20 w-12 shrink-0 bg-surface">
              <div
                className={`sticky top-0 z-[15] h-14 border-b border-line bg-surface ${fit ? "lg:h-11" : ""}`}
              />
              <div className="relative" style={{ height: at(span) }}>
                {hours.map((hour, index) => (
                  <span
                    key={hour}
                    className="absolute inset-x-0 text-center font-mono text-[11px] text-muted tabular"
                    style={{
                      top: at(hour - layout.firstHour),
                      transform:
                        index === 0
                          ? "translateY(0)"
                          : index === hours.length - 1
                            ? "translateY(-100%)"
                            : "translateY(-50%)",
                    }}
                  >
                    {hourLabel(hour)}
                  </span>
                ))}
              </div>
            </div>

            {layout.days.map((day) => {
              const { name, day: number } = dayParts(day.date);
              const isToday = day.date === today;
              return (
                <div
                  key={day.date}
                  data-start={day.date === start ? "" : undefined}
                  className={`${column} border-l border-line`}
                >
                  <div
                    // Collé en haut quand la grille défile dans sa carte (ordinateur, tableau de bord).
                    className={`sticky top-0 z-[15] flex h-14 flex-col items-center justify-center border-b border-line ${fit ? "lg:h-11" : ""} ${
                      isToday
                        ? "bg-[color-mix(in_srgb,var(--accent)_10%,var(--bg))] text-accent-text"
                        : "bg-bg"
                    }`}
                  >
                    <span
                      className={`text-[12px] whitespace-nowrap ${isToday ? "" : "text-muted"}`}
                    >
                      {name} {formatHoursShort(day.minutes)}
                    </span>
                    <span className="font-display text-[18px] leading-tight font-semibold tabular">
                      {number}
                    </span>
                  </div>
                  <div
                    // Repères du glisser-déposer : le jour et la plage horaire de la colonne.
                    data-drop-date={day.date}
                    data-first-hour={layout.firstHour}
                    data-span={span}
                    className={`relative ${isToday ? "bg-[color-mix(in_srgb,var(--accent)_4%,transparent)]" : ""}`}
                    style={{
                      height: at(span),
                      backgroundImage:
                        "repeating-linear-gradient(to bottom, var(--line) 0 1px, transparent 1px var(--hour))",
                    }}
                  >
                    {creatable ? (
                      <SlotLayer
                        date={day.date}
                        dayLabel={capitalize(dayLabel(day.date))}
                        firstHour={layout.firstHour}
                        span={span}
                      />
                    ) : null}
                    {day.blocks.map((block) => {
                      const top = (block.start - layout.firstHour * 60) / 60;
                      const length = (block.end - block.start) / 60;
                      // Détail affiché seulement si le bloc mesure au moins 56 px (téléphone compris).
                      const roomy = length * (fit ? 26 : 44) - 3 >= 56;
                      // Grille resserrée : un bloc court tient sur une ligne (téléphone : jusqu'à 1 h ;
                      // ordinateur, 40 px par heure : jusqu'à 45 min).
                      const compactPhone = fit && length <= 1;
                      const compactDesktop = fit && length <= 0.75;
                      const style = {
                        "--c": disciplineColor[block.discipline ?? "none"],
                        top: at(top),
                        height: `calc(var(--hour) * ${length} - 3px)`,
                        left: `calc(${(block.lane / block.lanes) * 100}% + 3px)`,
                        width: `calc(${100 / block.lanes}% - 6px)`,
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
                          className={`absolute flex flex-col overflow-hidden rounded-[8px] border-l-[3px] border-l-[var(--c)] bg-[color-mix(in_srgb,var(--c)_12%,var(--surface))] px-1.5 transition-[filter,opacity] duration-150 hover:brightness-110 ${
                            compactPhone ? "max-lg:justify-center max-lg:py-0.5" : "max-lg:py-1"
                          } ${compactDesktop ? "lg:justify-center lg:py-0" : "lg:py-1"}`}
                        >
                          {compactPhone || compactDesktop ? (
                            <span
                              className={`truncate text-[12px] leading-tight ${compactPhone ? "" : "max-lg:hidden"} ${compactDesktop ? "" : "lg:hidden"}`}
                            >
                              <span className="font-mono text-[11px] text-[var(--c)] tabular">
                                {block.label.slice(0, 5)}
                              </span>{" "}
                              <span className="font-semibold">{block.title}</span>
                            </span>
                          ) : null}
                          <span
                            className={`truncate font-mono text-[11px] leading-tight text-[var(--c)] tabular ${compactPhone ? "max-lg:hidden" : ""} ${compactDesktop ? "lg:hidden" : ""}`}
                          >
                            {block.label.replace(" - ", " – ")}
                          </span>
                          <span
                            className={`truncate text-[12px] leading-tight font-semibold ${compactPhone ? "max-lg:hidden" : ""} ${compactDesktop ? "lg:hidden" : ""}`}
                          >
                            {block.title}
                          </span>
                          {roomy ? (
                            <span className="truncate text-[11px] leading-tight text-muted">
                              {block.individual ? block.subtitle : `Collective · ${block.subtitle}`}
                            </span>
                          ) : null}
                        </DraggableBlock>
                      );
                    })}
                    {onMove ? <DropPreview date={day.date} firstHour={layout.firstHour} /> : null}
                    {isToday && showNow ? (
                      <span
                        aria-hidden
                        className="pointer-events-none absolute inset-x-0 z-10 h-0.5 bg-accent"
                        style={{ top: at(nowHours) }}
                      >
                        <span className="absolute -top-1 -left-1 size-2.5 rounded-full bg-accent" />
                      </span>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollToDay>
        <div className="flex items-start justify-between gap-3 text-[12px] text-muted">
          <span>
            {single ? (
              `1 jour · ${span} heures visibles`
            ) : (
              <>
                <span className="lg:hidden">Glisse pour changer de jour</span>
                <span className="hidden lg:inline">7 jours · {span} heures visibles</span>
              </>
            )}
          </span>
          <span className="shrink-0 font-mono tabular">
            {hourLabel(layout.firstHour)} – {hourLabel(layout.lastHour)}
          </span>
        </div>
      </div>
    </GridInteractions>
  );
}
