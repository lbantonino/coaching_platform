"use client";

import {
  ArrowDown,
  ArrowLeftRight,
  ChevronDown,
  Dumbbell,
  HeartPulse,
  Timer,
  type LucideIcon,
} from "lucide-react";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from "react";

import { AccordionChevron, accordionClass, accordionSummaryClass } from "@/components/ui/accordion";
import {
  describeProgress,
  formatAxisValue,
  type ReferenceSeries,
  type ReferenceTone,
} from "@/features/references/series";

// Onglet Repères, partie interactive (maquette « Sportifs » du 03/11/2026, page 2g) : deux cartes de
// repère interchangeables (« Changer », « Inverser les deux cartes »), le graphique d'évolution
// (repère et période au choix) et le tableau de ses valeurs. Les autres accordéons (historique,
// calcul depuis un test) sont rendus par le serveur et passés en `accordions`.

export type ReferenceCardData = {
  key: string;
  group: "pace" | "hr" | "strength";
  tone: ReferenceTone;
  name: string;
  value: string;
  unit: string;
  detail: string;
  // Date de la dernière mesure (AAAA-MM-JJ) : les cartes s'ouvrent sur les repères mesurés en dernier.
  measuredOn: string;
};

// Couleurs d'un repère : texte, tracé (et contour de la carte affichée dans le graphique), fond de
// l'icône. Running en bleu, race pace en ambre Hyrox, FC en violet, charges en rouge Musculation.
const tones: Record<ReferenceTone, { text: string; soft: string; line: string }> = {
  run: { text: "text-run", soft: "bg-run-soft", line: "var(--run-fill)" },
  hyrox: {
    text: "text-hyrox",
    soft: "bg-hyrox-soft",
    line: "color-mix(in srgb, var(--hyrox-fill) 75%, var(--hyrox))",
  },
  heart: { text: "text-accent-text", soft: "bg-accent-soft", line: "var(--accent)" },
  strength: { text: "text-strength", soft: "bg-strength-soft", line: "var(--strength-fill)" },
};
const icons: Record<ReferenceCardData["group"], LucideIcon> = {
  pace: Timer,
  hr: HeartPulse,
  strength: Dumbbell,
};
const categories: Record<ReferenceCardData["group"], string> = {
  pace: "Running",
  hr: "Cardio",
  strength: "Musculation",
};

// Périodes du graphique (« Depuis le début » en plus de la maquette : un historique plus long reste
// lisible). Par défaut 6 mois, ou la plus courte période qui montre au moins deux mesures.
const PERIODS = [
  { key: "1s", label: "1 semaine", days: 7 },
  { key: "4s", label: "4 semaines", days: 28 },
  { key: "1m", label: "1 mois", days: 31 },
  { key: "6m", label: "6 mois", days: 183 },
  { key: "1a", label: "1 an", days: 366 },
  { key: "tout", label: "Depuis le début", days: Infinity },
] as const;
type PeriodKey = (typeof PERIODS)[number]["key"];

const shortDate = new Intl.DateTimeFormat("fr-BE", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});
const dayLabel = (day: number) => shortDate.format(new Date(day * 86_400_000));

type ChoiceGroup = {
  label?: string;
  options: { key: string; label: string; aside?: string }[];
};

// Menu de choix (maquette : liste sous le bouton, rayon 14, groupes en petites capitales, choix en
// cours coché en violet). Clic dehors ou Échap : fermé ; flèches ↑ ↓ : d'un choix à l'autre.
function ChoiceMenu({
  label,
  selected,
  groups,
  onPick,
  align,
  className,
  buttonClassName,
  children,
}: {
  label: string;
  selected: string | null;
  groups: ChoiceGroup[];
  onPick: (key: string) => void;
  align: "left" | "right";
  className: string;
  buttonClassName: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const listId = useId();

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: globalThis.PointerEvent) => {
      if (!box.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape" && open) {
      event.preventDefault();
      setOpen(false);
      trigger.current?.focus();
      return;
    }
    if (!open || (event.key !== "ArrowDown" && event.key !== "ArrowUp")) return;
    event.preventDefault();
    const items = [...(box.current?.querySelectorAll<HTMLElement>("[role=option]") ?? [])];
    const index = items.indexOf(document.activeElement as HTMLElement);
    const next = event.key === "ArrowDown" ? index + 1 : index - 1;
    items[(next + items.length) % items.length]?.focus();
  };

  return (
    <div ref={box} onKeyDown={onKeyDown} className={`relative ${className}`}>
      <button
        ref={trigger}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-label={label}
        onClick={() => setOpen((value) => !value)}
        className={`${buttonClassName} ${open ? "[&>svg:last-child]:rotate-180" : ""}`}
      >
        {children}
      </button>
      {open ? (
        <div
          id={listId}
          role="listbox"
          aria-label={label}
          className={`absolute top-[calc(100%+6px)] z-20 flex w-max max-w-[min(340px,calc(100vw-48px))] min-w-full flex-col gap-px rounded-[14px] bg-popover p-1.5 shadow-[0_16px_36px_rgba(22,18,40,0.16)] inset-ring inset-ring-popover-line ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          {groups.map((group, i) => (
            <div
              key={group.label ?? i}
              role="group"
              aria-label={group.label}
              className="flex flex-col gap-px"
            >
              {group.label ? (
                <span
                  aria-hidden
                  className={`px-3 pb-1 text-[11px] font-semibold tracking-[0.07em] text-faint uppercase ${
                    i === 0 ? "pt-2" : "pt-2.5"
                  }`}
                >
                  {group.label}
                </span>
              ) : null}
              {group.options.map((option) => {
                const isSelected = option.key === selected;
                return (
                  <button
                    key={option.key}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      setOpen(false);
                      onPick(option.key);
                      trigger.current?.focus();
                    }}
                    className={`flex min-h-10 w-full items-center gap-2.5 rounded-[10px] px-3 text-left text-[13.5px] font-medium text-text transition-colors duration-150 ${
                      isSelected ? "bg-violet/8" : "hover:bg-surface-2"
                    }`}
                  >
                    <span className="flex-1 whitespace-nowrap">{option.label}</span>
                    {option.aside ? (
                      <span className="text-[12.5px] font-normal whitespace-nowrap text-muted">
                        {option.aside}
                      </span>
                    ) : null}
                    <span aria-hidden className="w-3.5 font-bold text-violet-text">
                      {isSelected ? "✓" : ""}
                    </span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

// Choix groupés des menus : allures et FC d'un côté, charges de l'autre (libellés de la maquette).
function groupsOf<T extends { key: string; label: string; aside?: string; group: string }>(
  items: T[],
): ChoiceGroup[] {
  return [
    {
      label: "Allures et repères running",
      options: items.filter((item) => item.group !== "strength"),
    },
    { label: "Charges de référence", options: items.filter((item) => item.group === "strength") },
  ].filter((group) => group.options.length > 0);
}

function ReferenceCard({
  card,
  shown,
  chartable,
  menu,
  onShow,
}: {
  card: ReferenceCardData;
  shown: boolean;
  chartable: boolean;
  menu: ReactNode;
  onShow: () => void;
}) {
  const tone = tones[card.tone];
  const Icon = icons[card.group];
  return (
    <li
      style={{ "--tone-line": tone.line } as CSSProperties}
      className={`flex min-w-0 flex-col gap-3.5 rounded-2xl bg-surface-2 px-[18px] py-5 lg:px-5 lg:py-[18px] ${
        shown ? "inset-ring-[1.5px] inset-ring-[var(--tone-line)]" : ""
      }`}
    >
      <div className="flex items-center gap-3">
        <span
          aria-hidden
          className={`grid size-10 shrink-0 place-items-center rounded-xl ${tone.soft} ${tone.text}`}
        >
          <Icon size={18} strokeWidth={1.8} />
        </span>
        <span className="min-w-0 flex-1 truncate text-[11px] leading-[14px] font-semibold tracking-[0.07em] text-faint uppercase">
          {categories[card.group]}
        </span>
        {menu}
      </div>
      <div className="flex min-w-0 flex-col gap-1.5">
        <span className="text-[13.5px] leading-[17px] font-medium text-text-2">{card.name}</span>
        <span className="flex items-baseline gap-1.5 whitespace-nowrap">
          <span className={`text-[26px] leading-[1.1] font-bold tracking-[-0.02em] ${tone.text}`}>
            {card.value}
          </span>
          {card.unit ? (
            <span className={`text-[13.5px] leading-[17px] font-semibold ${tone.text}`}>
              {card.unit}
            </span>
          ) : null}
        </span>
        <span className="text-[12.5px] leading-[1.5] text-muted">{card.detail}</span>
      </div>
      {shown ? (
        <span className="text-[13px] leading-[16.5px] font-medium text-violet-text">
          Affiché dans le graphique
        </span>
      ) : chartable ? (
        <button
          type="button"
          onClick={onShow}
          className="inline-flex items-center gap-1 self-start text-left text-[13px] leading-[16.5px] font-medium whitespace-nowrap text-violet-text hover:underline"
        >
          Voir l&apos;évolution
          <ArrowDown aria-hidden size={13} strokeWidth={2} />
        </button>
      ) : (
        <span className="text-[13px] leading-[16.5px] text-muted">
          Une seule mesure pour l&apos;instant
        </span>
      )}
    </li>
  );
}

export function ReferencesBoard({
  cards,
  series,
  todayDay,
  accordions,
}: {
  cards: ReferenceCardData[];
  series: ReferenceSeries[];
  // Jours depuis le 1er janvier 1970 (UTC), comme les points des courbes.
  todayDay: number;
  accordions: ReactNode;
}) {
  // Le graphique propose TOUS les repères (demande d'Antonino du 03/11) ; avec une seule mesure, il
  // l'explique au lieu de tracer.
  const chartable = series.filter((item) => item.points.length >= 2);
  const isChartable = (key: string) => chartable.some((item) => item.key === key);
  const hasSeries = (key: string) => series.some((item) => item.key === key);
  const has = (key: string | null) => key !== null && cards.some((card) => card.key === key);

  // Cartes par défaut : la dernière allure mesurée à gauche (sinon une FC), la dernière charge à
  // droite (sinon un autre repère).
  const recent = [...cards].sort((a, b) => b.measuredOn.localeCompare(a.measuredOn));
  const defaultA =
    recent.find((card) => card.group === "pace")?.key ??
    recent.find((card) => card.group === "hr")?.key ??
    recent[0]?.key ??
    null;
  const [chosenA, setA] = useState<string | null>(null);
  const [chosenB, setB] = useState<string | null>(null);
  const keyA = has(chosenA) ? chosenA : defaultA;
  const fallbackB =
    recent.find((card) => card.key !== keyA && card.group === "strength")?.key ??
    recent.find((card) => card.key !== keyA)?.key ??
    null;
  const keyB = has(chosenB) && chosenB !== keyA ? chosenB : fallbackB;
  const [chosenChart, setChart] = useState<string | null>(null);
  const chartKey =
    chosenChart && hasSeries(chosenChart)
      ? chosenChart
      : ([keyA, keyB].find((key) => key && isChartable(key)) ??
        chartable[0]?.key ??
        (keyA && hasSeries(keyA) ? keyA : (series[0]?.key ?? null)));
  const current = series.find((item) => item.key === chartKey) ?? null;
  const evolution = useRef<HTMLDivElement>(null);

  const cardOptions = cards.map((card) => ({
    key: card.key,
    label: card.name,
    aside: card.unit ? `${card.value} ${card.unit}` : card.value,
    group: card.group,
  }));
  // Choisir pour une carte le repère de l'autre carte : les deux cartes échangent leurs repères.
  const pick = (key: string, slot: "A" | "B") => {
    const mine = slot === "A" ? keyA : keyB;
    const other = slot === "A" ? keyB : keyA;
    if (key === other) {
      setA(slot === "A" ? key : mine);
      setB(slot === "A" ? mine : key);
    } else if (slot === "A") {
      setA(key);
    } else {
      setB(key);
    }
    if (hasSeries(key)) setChart(key);
  };
  const showInChart = (key: string) => {
    setChart(key);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    evolution.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "nearest" });
  };

  const shownCards = [keyA, keyB]
    .map((key) => cards.find((card) => card.key === key))
    .filter((card): card is ReferenceCardData => card !== undefined);

  return (
    <>
      {shownCards.length > 0 ? (
        <div className="flex flex-col gap-2.5">
          <ul
            aria-label="Repères affichés"
            className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(min(100%,260px),1fr))]"
          >
            {shownCards.map((card, i) => (
              <ReferenceCard
                key={card.key}
                card={card}
                shown={card.key === chartKey}
                chartable={isChartable(card.key)}
                onShow={() => showInChart(card.key)}
                menu={
                  <ChoiceMenu
                    label={`Changer le repère : ${card.name}`}
                    selected={card.key}
                    groups={groupsOf(cardOptions)}
                    onPick={(key) => pick(key, i === 0 ? "A" : "B")}
                    align="right"
                    className="shrink-0"
                    buttonClassName="flex h-9 items-center gap-1.5 rounded-[10px] bg-surface pr-2.5 pl-3 text-[13px] font-medium whitespace-nowrap text-text inset-ring inset-ring-line-2 transition-colors duration-150 hover:bg-bg [&>svg]:transition-transform [&>svg]:duration-200"
                  >
                    Changer
                    <ChevronDown aria-hidden size={14} strokeWidth={2} className="text-muted" />
                  </ChoiceMenu>
                }
              />
            ))}
          </ul>
          {shownCards.length === 2 ? (
            <button
              type="button"
              onClick={() => {
                setA(keyB);
                setB(keyA);
              }}
              className="flex h-9 items-center gap-[7px] self-center rounded-[10px] px-3 text-[13px] font-medium whitespace-nowrap text-text-2 transition-colors duration-150 hover:bg-surface-2"
            >
              <ArrowLeftRight aria-hidden size={15} strokeWidth={1.8} />
              Inverser les deux cartes
            </button>
          ) : null}
        </div>
      ) : null}

      {cards.length > 0 ? (
        <section
          ref={evolution}
          aria-labelledby="evolution-title"
          className="flex min-w-0 scroll-mt-4 flex-col gap-3 rounded-2xl p-[18px] inset-ring inset-ring-line"
        >
          {current ? (
            <Evolution
              key={current.key}
              series={current}
              all={series}
              todayDay={todayDay}
              onPick={setChart}
            />
          ) : (
            <>
              <h3 id="evolution-title" className="text-[15px] leading-[19px] font-semibold">
                Évolution
              </h3>
              <p role="status" className="text-[13.5px] leading-[1.5] text-muted">
                L&apos;évolution s&apos;affiche dès qu&apos;un repère compte au moins deux mesures,
                à des dates différentes.
              </p>
            </>
          )}
        </section>
      ) : null}

      <div className="flex flex-col gap-2">
        {current && current.points.length >= 2 ? <ValuesTable series={current} /> : null}
        {accordions}
      </div>
    </>
  );
}

function ValuesTable({ series }: { series: ReferenceSeries }) {
  return (
    <details className={accordionClass}>
      <summary className={accordionSummaryClass}>
        <AccordionChevron />
        Voir les valeurs en tableau
      </summary>
      <table className="w-full border-t border-line text-[13.5px]">
        <caption className="sr-only">Mesures : {series.title}</caption>
        <thead>
          <tr className="text-left text-[12.5px] text-muted">
            <th scope="col" className="px-3.5 py-2 font-normal">
              Date
            </th>
            <th scope="col" className="px-3.5 py-2 font-normal">
              Valeur
            </th>
            <th scope="col" className="px-3.5 py-2 font-normal">
              Source
            </th>
          </tr>
        </thead>
        <tbody>
          {[...series.points].reverse().map((point) => (
            <tr key={point.id} className="border-t border-line">
              <td className="px-3.5 py-2">{point.dateLabel}</td>
              <td className="px-3.5 py-2 tabular-nums">{point.valueLabel}</td>
              <td className="px-3.5 py-2 text-muted">{point.sourceLabel}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </details>
  );
}

// Graphique d'évolution : 160 px de haut, axe vertical à 5 graduations régulières sur 36 px, trois
// dates en bas. Allure : axe inversé (plus rapide en haut). Survol et flèches ← → : la mesure la
// plus proche, avec sa date et sa source.
function Evolution({
  series,
  all,
  todayDay,
  onPick,
}: {
  series: ReferenceSeries;
  all: ReferenceSeries[];
  todayDay: number;
  onPick: (key: string) => void;
}) {
  const inPeriod = (days: number) => series.points.filter((point) => point.day >= todayDay - days);
  // Période par défaut : 6 mois, ou la plus courte qui contient au moins deux mesures.
  const fallback =
    PERIODS.slice(3).find((period) => inPeriod(period.days).length >= 2)?.key ?? "tout";
  const [period, setPeriod] = useState<PeriodKey>(fallback);
  const days = PERIODS.find((item) => item.key === period)?.days ?? Infinity;
  const points = inPeriod(days);
  const tone = tones[series.tone];

  const single = series.points.length < 2;
  const plotted = points.length >= 2;
  const progress = plotted ? describeProgress({ ...series, points }) : null;
  const last = series.points[series.points.length - 1];

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2.5">
        <h3 id="evolution-title" className="text-[15px] leading-[19px] font-semibold">
          Évolution
        </h3>
        <div className="flex min-w-0 flex-[1_1_100%] gap-2 lg:flex-[0_1_auto]">
          <ChoiceMenu
            label="Repère affiché"
            selected={series.key}
            groups={groupsOf(
              all.map((item) => ({
                key: item.key,
                label: item.title,
                aside: item.points[item.points.length - 1].valueLabel,
                group: item.kind === "strength_load" ? "strength" : "pace",
              })),
            )}
            onPick={onPick}
            align="left"
            className="min-w-0 flex-[1_1_auto] lg:flex-[0_1_auto]"
            buttonClassName="flex h-[38px] w-full items-center gap-2 rounded-[10px] bg-surface px-3 text-[13.5px] font-medium whitespace-nowrap text-text inset-ring inset-ring-line-2 transition-colors duration-150 hover:bg-bg lg:max-w-[220px] [&>svg]:transition-transform [&>svg]:duration-200"
          >
            <span
              aria-hidden
              style={{ background: tone.line }}
              className="size-2 shrink-0 rounded-full"
            />
            <span className="min-w-0 flex-1 truncate text-left">{series.title}</span>
            <ChevronDown aria-hidden size={14} strokeWidth={2} className="shrink-0 text-muted" />
          </ChoiceMenu>
          {single ? null : (
            <ChoiceMenu
              label="Période"
              selected={period}
              groups={[{ options: PERIODS.map((item) => ({ key: item.key, label: item.label })) }]}
              onPick={(key) => setPeriod(key as PeriodKey)}
              align="right"
              className="shrink-0"
              buttonClassName="flex h-[38px] items-center gap-1.5 rounded-[10px] bg-surface pr-2.5 pl-3 text-[13.5px] font-medium whitespace-nowrap text-text inset-ring inset-ring-line-2 transition-colors duration-150 hover:bg-bg [&>svg]:transition-transform [&>svg]:duration-200"
            >
              {PERIODS.find((item) => item.key === period)?.label}
              <ChevronDown aria-hidden size={14} strokeWidth={2} className="text-muted" />
            </ChoiceMenu>
          )}
        </div>
      </div>

      <div className="mb-1 flex flex-wrap items-baseline justify-between gap-x-2 gap-y-1">
        <span className="text-[12.5px] leading-[1.45] whitespace-nowrap text-muted">
          {single
            ? `Une seule mesure, le ${last.dateLabel}`
            : (progress ?? "Pas assez de mesures sur cette période.")}
        </span>
        <span className={`text-[16px] leading-5 font-bold whitespace-nowrap ${tone.text}`}>
          {last.valueLabel}
        </span>
      </div>

      {single ? (
        <p role="status" className="text-[13.5px] leading-[1.5] text-muted">
          L&apos;évolution s&apos;affiche dès qu&apos;un repère compte au moins deux mesures, à des
          dates différentes.
        </p>
      ) : plotted ? (
        <Plot series={series} points={points} line={tone.line} />
      ) : (
        <p className="text-[13.5px] leading-[1.5] text-muted">
          Choisis une période plus longue pour voir la courbe.
        </p>
      )}

      {plotted && series.inverted ? (
        <p className="text-[12.5px] leading-4 text-muted">
          {series.unit === "bpm"
            ? "Axe inversé : plus la courbe monte, plus la FC de repos est basse."
            : "Axe inversé : plus la courbe monte, plus l’allure est rapide."}
        </p>
      ) : null}
    </>
  );
}

// Graduation lisible : allure en min:ss, bpm entiers, kg et km/h à une décimale au plus.
const oneDecimal = new Intl.NumberFormat("fr-BE", { maximumFractionDigits: 1 });
function tickLabel(value: number, unit: ReferenceSeries["unit"]): string {
  if (unit === "min/km") return formatAxisValue(value, unit);
  if (unit === "bpm") return String(Math.round(value));
  return oneDecimal.format(value);
}

function Plot({
  series,
  points,
  line,
}: {
  series: ReferenceSeries;
  points: ReferenceSeries["points"];
  line: string;
}) {
  const [active, setActive] = useState<number | null>(null);
  const values = points.map((point) => point.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  // Marge au-dessus et au-dessous des mesures ; une seule valeur : une marge fixe.
  const pad =
    max - min > 1e-9
      ? (max - min) * 0.1
      : series.unit === "min/km"
        ? 10
        : Math.max(Math.abs(min) * 0.05, 1);
  const low = min - pad;
  const high = max + pad;
  const first = points[0].day;
  const span = Math.max(points[points.length - 1].day - first, 1);
  // Positions en % : x selon la date, y selon la valeur (allure : la plus rapide en haut).
  const x = (day: number) => ((day - first) / span) * 100;
  const y = (value: number) => {
    const ratio = (value - low) / (high - low);
    return (series.inverted ? ratio : 1 - ratio) * 100;
  };
  const ticks = [0, 1, 2, 3, 4].map((i) => {
    const ratio = i / 4;
    const value = series.inverted ? low + ratio * (high - low) : high - ratio * (high - low);
    return { top: ratio * 100, label: tickLabel(value, series.unit) };
  });
  const coords = points.map((point) => ({ x: x(point.day), y: y(point.value) }));
  const path = coords.map((c, i) => `${i === 0 ? "M" : "L"}${c.x},${c.y}`).join(" ");
  const area = `${path} L${coords[coords.length - 1].x},100 L${coords[0].x},100 Z`;
  const middleDay = Math.round(first + span / 2);

  function nearest(clientX: number, target: HTMLElement) {
    const rect = target.getBoundingClientRect();
    const pointer = ((clientX - rect.left) / rect.width) * 100;
    let best = 0;
    coords.forEach((c, i) => {
      if (Math.abs(c.x - pointer) < Math.abs(coords[best].x - pointer)) best = i;
    });
    return best;
  }
  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    setActive(nearest(event.clientX, event.currentTarget));
  }
  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
      event.preventDefault();
      const step = event.key === "ArrowRight" ? 1 : -1;
      setActive((index) =>
        Math.min(Math.max((index ?? points.length - 1) + step, 0), points.length - 1),
      );
    } else if (event.key === "Escape") {
      setActive(null);
    }
  }
  const shown = active === null ? null : points[active];
  const tip = active === null ? null : coords[active];

  return (
    <figure
      tabIndex={0}
      role="group"
      aria-label={`Évolution : ${series.title}. Flèches gauche et droite pour parcourir les ${points.length} mesures.`}
      onKeyDown={onKeyDown}
      onFocus={() => setActive((index) => index ?? points.length - 1)}
      onBlur={() => setActive(null)}
      className="mt-2.5 grid grid-cols-[36px_minmax(0,1fr)] gap-2 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-violet/55"
    >
      <div aria-hidden className="relative h-40">
        {ticks.map((tick) => (
          <span
            key={tick.top}
            style={{ top: `${tick.top}%` }}
            className="absolute right-0 -translate-y-1/2 text-[11px] leading-[14px] text-faint tabular-nums"
          >
            {tick.label}
          </span>
        ))}
      </div>
      <div
        onPointerMove={onPointerMove}
        onPointerDown={onPointerMove}
        onPointerLeave={() => setActive(null)}
        className="relative h-40 touch-pan-y border-b border-line bg-[repeating-linear-gradient(to_bottom,var(--line)_0_1px,transparent_1px_25%)] select-none"
      >
        <svg
          aria-hidden
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="absolute inset-0 size-full overflow-visible"
        >
          <path d={area} fill={line} fillOpacity={0.14} />
          <path
            d={path}
            fill="none"
            stroke={line}
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
          {tip ? (
            <line
              x1={tip.x}
              x2={tip.x}
              y1={0}
              y2={100}
              stroke="var(--line-2)"
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
            />
          ) : null}
        </svg>
        {coords.map((c, i) => (
          <span
            key={points[i].id}
            aria-hidden
            style={{ left: `${c.x}%`, top: `${c.y}%`, boxShadow: `inset 0 0 0 2px ${line}` }}
            className={`absolute -m-[4.5px] size-[9px] rounded-full bg-surface transition-transform duration-150 ${
              i === active ? "scale-[1.4]" : ""
            }`}
          />
        ))}
        {shown && tip ? (
          <div
            style={{
              left: `clamp(0px, calc(${tip.x}% - 90px), calc(100% - 200px))`,
              top: `max(0px, calc(${tip.y}% - 64px))`,
            }}
            className="pointer-events-none absolute z-10 flex w-max max-w-[220px] flex-col gap-0.5 rounded-[10px] bg-popover px-3 py-2 shadow-[0_8px_20px_rgba(22,18,40,0.12)] inset-ring inset-ring-popover-line"
          >
            <span className="flex items-center gap-2">
              <span aria-hidden className="h-0.5 w-3 rounded-full" style={{ background: line }} />
              <span className="text-[13.5px] font-semibold tabular-nums">{shown.valueLabel}</span>
            </span>
            <span className="text-[12px] text-muted">
              {shown.dateLabel} · {shown.sourceLabel}
            </span>
          </div>
        ) : null}
      </div>
      <div
        aria-hidden
        className="col-start-2 flex justify-between text-[11.5px] leading-[14.5px] whitespace-nowrap text-faint"
      >
        <span>{dayLabel(first)}</span>
        <span>{dayLabel(middleDay)}</span>
        <span>{dayLabel(points[points.length - 1].day)}</span>
      </div>
      {/* Mesure choisie au clavier, annoncée aux lecteurs d'écran. */}
      <p aria-live="polite" className="sr-only">
        {shown ? `${shown.dateLabel} : ${shown.valueLabel} (${shown.sourceLabel})` : ""}
      </p>
    </figure>
  );
}
