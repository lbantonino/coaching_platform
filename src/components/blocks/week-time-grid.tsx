import { Users } from "lucide-react";
import type { CSSProperties } from "react";

import type { Discipline } from "@/domain/training/discipline";
import { dayLabel } from "@/features/agenda/calendar";
import { addDays } from "@/features/agenda/items";
import { type WeekLayout } from "@/features/agenda/week";
import type { MoveSessionInput } from "@/features/sessions/actions";

import { DraggableBlock, DropPreview, GridInteractions } from "./grid-interactions";
import { ScrollToDay } from "./scroll-to-day";
import { SlotLayer } from "./slot-layer";

// Grille horaire de la semaine (prompt Claude Design §6), au tableau de bord et dans l'Agenda.
// La grille couvre toute la journée, de 00:00 à 24:00 (demande d'Antonino du 29/10/2026 : un coach
// peut aussi y noter quelque chose tôt le matin ou tard le soir), mais n'en montre que les heures du
// réglage « Heures de l'agenda » (06:00 → 22:00 par défaut, élargies par une séance plus tôt ou plus
// tard) : le reste se découvre en défilant DANS la carte, la page ne bouge pas.
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
  fullWeek = false,
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
  // Téléphone, vue « Semaine » (demande d'Antonino du 26/10, comme Google Agenda) : les 7 jours tiennent
  // dans l'écran, en colonnes étroites ; chaque séance se réduit à son heure et son titre. Sans cette
  // option, le téléphone montre 3 jours et l'on fait glisser. L'ordinateur montre toujours 7 jours.
  fullWeek?: boolean;
  // Tableau de bord, ordinateur seulement (demandes d'Antonino) : 48 px par heure comme la page
  // Agenda, en-tête des jours plus bas, blocs de 45 min au plus sur une ligne. Sur téléphone, plus aucune différence avec la
  // page Agenda (demande d'Antonino du 26/10 au soir : la grille du tableau de bord, adaptée à la
  // hauteur de l'écran, était « beaucoup trop petite en hauteur ») : 44 px par heure, 56 px en vue
  // d'un seul jour, et le détail des blocs.
  fit?: boolean;
  creatable?: boolean;
  onMove?: (input: MoveSessionInput) => Promise<{ ok: boolean; error?: string }>;
}) {
  // Grille complète (24 heures) ; fenêtre visible = layout.firstHour → layout.lastHour.
  const span = 24;
  const visible = layout.lastHour - layout.firstHour;
  const hours = Array.from({ length: span + 1 }, (_, i) => i);
  const nowHours = Number(now.slice(0, 2)) + Number(now.slice(3, 5)) / 60;
  // Colonne d'ouverture sur téléphone : la veille d'aujourd'hui si elle est dans la semaine.
  const dates = layout.days.map((day) => day.date);
  const yesterday = addDays(today, -1);
  const start = dates.includes(yesterday) ? yesterday : dates.includes(today) ? today : dates[0];
  const column =
    single || fullWeek
      ? "min-w-0 flex-1"
      : // Téléphone, 3 jours (demande d'Antonino du 26/10) : chaque colonne mesure exactement le tiers
        // de la largeur de l'agenda moins la colonne des heures (3rem), pour voir 3 jours ENTIERS.
        // cqw = 1 % de la largeur du conteneur (l'agenda, déclaré @container ci-dessous).
        "w-[calc((100cqw-3rem)/3)] shrink-0 snap-start lg:w-auto lg:min-w-0 lg:flex-1";

  return (
    <GridInteractions move={onMove}>
      <div className="flex flex-col gap-2.5">
        <ScrollToDay
          // Téléphone : la grille va d'un bord à l'autre de l'écran (-mx-4 = marge de la page).
          // Hauteur d'une heure : téléphone 56 px pour un seul jour, sinon 44 px ; ordinateur 48 px,
          // sauf la vue d'un seul jour de la page Agenda (56 px).
          // Hauteur de la carte = les heures visibles + l'en-tête des jours (+ 2 px de bordure).
          className={`@container max-h-[calc(var(--hour)*var(--visible)+3.5rem+2px)] snap-x snap-mandatory scroll-pl-12 overflow-auto rounded-wide border border-line bg-surface max-lg:-mx-4 max-lg:rounded-none max-lg:border-x-0 ${
            single ? "[--hour:56px]" : "[--hour:44px]"
          } ${fit || !single ? "lg:[--hour:48px]" : ""} ${fit ? "lg:max-h-[calc(var(--hour)*var(--visible)+2.75rem+2px)]" : ""}`}
          // Un quart d'heure de marge en haut et en bas : les libellés 06:00 et 22:00, centrés sur
          // leur ligne, restent lisibles entiers (sinon coupés par l'en-tête des jours et le bas).
          style={{ "--visible": visible + 0.5 } as CSSProperties}
          scrollHour={layout.firstHour - 0.25}
        >
          <div className={`flex ${single || fullWeek ? "w-full" : "w-max min-w-full lg:w-full"}`}>
            {/* Heures, collées à gauche pendant le défilement. */}
            <div
              data-gutter
              aria-hidden
              className={`sticky left-0 z-20 shrink-0 bg-surface ${fullWeek ? "w-9 lg:w-12" : "w-12"}`}
            >
              <div
                className={`sticky top-0 z-[15] h-14 border-b border-line bg-surface ${fit ? "lg:h-11" : ""}`}
              />
              <div className="relative" style={{ height: at(span) }}>
                {hours.map((hour, index) => (
                  <span
                    key={hour}
                    className={`absolute inset-x-0 text-center font-mono text-muted tabular ${
                      fullWeek ? "text-[9px] lg:text-[11px]" : "text-[11px]"
                    }`}
                    style={{
                      top: at(hour),
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
                      // Jour actuel (§6 Agenda) : trait or de 2 px en haut, textes or, fond or très doux.
                      isToday
                        ? "bg-[color-mix(in_srgb,var(--accent)_9%,var(--surface))] text-accent-text shadow-[inset_0_2px_0_var(--accent)]"
                        : "bg-surface"
                    }`}
                  >
                    <span
                      className={`text-[12px] whitespace-nowrap ${isToday ? "" : "text-muted"}`}
                    >
                      {/* Le nom du jour seul (demande d'Antonino du 29/10 : plus les heures). */}
                      {name}
                    </span>
                    <span className="font-display text-[18px] leading-tight font-semibold tabular">
                      {number}
                    </span>
                  </div>
                  <div
                    // Repères du glisser-déposer : le jour et la plage horaire de la colonne.
                    data-drop-date={day.date}
                    data-first-hour={0}
                    data-span={span}
                    className={`relative ${isToday ? "bg-[color-mix(in_srgb,var(--text)_2%,transparent)]" : ""}`}
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
                        firstHour={0}
                        span={span}
                      />
                    ) : null}
                    {day.blocks.map((block) => {
                      const top = block.start / 60;
                      const length = (block.end - block.start) / 60;
                      // Détail (sportif, inscrits) affiché seulement si le bloc mesure au moins 56 px,
                      // selon la hauteur d'une heure de chaque écran : téléphone 56 px (un seul jour)
                      // ou 44 px ; ordinateur, vue d'un seul jour de la page Agenda (56 px) : toujours,
                      // tableau de bord (fit) : la règle de hauteur habituelle.
                      const roomyPhone = single || length * 44 - 3 >= 56;
                      const roomyDesktop = (single && !fit) || length * (fit ? 26 : 44) - 3 >= 56;
                      const roomy = roomyPhone || roomyDesktop;
                      const roomyClass =
                        roomyPhone && roomyDesktop
                          ? ""
                          : roomyPhone
                            ? "lg:hidden"
                            : "max-lg:hidden";
                      // Tableau de bord sur ordinateur : un bloc de 45 min au plus tient sur une ligne.
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
                          // Graphite & Or (§6) : fond teinté de la discipline, sans contour ni liseré. Collective : icône
                          // « groupe », pour la distinguer d'un coup d'œil d'une séance individuelle.
                          className={`absolute flex flex-col overflow-hidden rounded-[7px] bg-[color-mix(in_srgb,var(--c)_var(--tint-block),var(--surface))] px-1.5 transition-[filter,opacity] duration-150 hover:brightness-110 max-lg:py-1 ${compactDesktop ? "lg:justify-center lg:py-0" : "lg:py-1"} ${
                            fullWeek ? "max-lg:justify-start max-lg:px-0.5 max-lg:py-0.5" : ""
                          }`}
                        >
                          {fullWeek ? (
                            // Semaine entière sur téléphone : l'heure de début et le titre, en petit.
                            <span className="flex min-w-0 flex-col lg:hidden">
                              <span className="font-mono text-[9px] leading-tight text-[var(--c)] tabular">
                                {block.label.slice(0, 5)}
                              </span>
                              <span className="line-clamp-3 overflow-hidden text-[10px] leading-tight font-semibold">
                                {block.title}
                              </span>
                            </span>
                          ) : null}
                          <span className={fullWeek ? "contents max-lg:hidden" : "contents"}>
                            {compactDesktop ? (
                              <span className="truncate text-[12px] leading-tight max-lg:hidden">
                                {block.individual ? null : (
                                  <Users
                                    aria-hidden
                                    size={10}
                                    strokeWidth={2.4}
                                    className="mr-0.5 inline align-[-1px] text-[var(--c)]"
                                  />
                                )}
                                <span className="font-mono text-[11px] text-[var(--c)] tabular">
                                  {block.label.slice(0, 5)}
                                </span>{" "}
                                <span className="font-semibold">{block.title}</span>
                              </span>
                            ) : null}
                            <span
                              className={`flex items-center gap-1 truncate font-mono text-[11px] leading-tight text-[var(--c)] tabular ${compactDesktop ? "lg:hidden" : ""}`}
                            >
                              {block.individual ? null : (
                                <Users
                                  aria-hidden
                                  size={11}
                                  strokeWidth={2.4}
                                  className="shrink-0"
                                />
                              )}
                              {/* Dans un élément à part : les points de suspension marchent dans une flexbox. */}
                              <span className="min-w-0 truncate">
                                {block.label.replace(" - ", " – ")}
                              </span>
                            </span>
                            <span
                              className={`truncate text-[12px] leading-tight font-semibold ${compactDesktop ? "lg:hidden" : ""}`}
                            >
                              {block.title}
                            </span>
                            {roomy ? (
                              <span
                                className={`truncate text-[11px] leading-tight text-muted ${roomyClass}`}
                              >
                                {block.individual
                                  ? block.subtitle
                                  : `Collective · ${block.subtitle}`}
                              </span>
                            ) : null}
                          </span>
                        </DraggableBlock>
                      );
                    })}
                    {onMove ? <DropPreview date={day.date} firstHour={0} /> : null}
                    {isToday ? (
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
        <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1.5 text-[12px] text-muted">
          <KindLegend />
          <span>
            {single ? (
              `1 jour · ${visible} heures visibles`
            ) : (
              <>
                <span className="lg:hidden">
                  {fullWeek ? "7 jours" : "Glisse pour changer de jour"}
                </span>
                <span className="hidden lg:inline">7 jours · {visible} heures visibles</span>
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

// Légende sous l'agenda : comment reconnaître une séance individuelle et une collective.
export function KindLegend() {
  return (
    <span aria-label="Légende" className="flex items-center gap-3">
      <span className="inline-flex items-center gap-1.5">
        <span aria-hidden className="h-3 w-4 rounded-[3px] bg-surface-2" />
        Individuelle
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span aria-hidden className="h-3 w-4 rounded-[3px] bg-surface-2" />
        <Users aria-hidden size={12} strokeWidth={2.2} />
        Collective
      </span>
    </span>
  );
}
