"use client";

import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";

import type { ReferenceSeries, ReferenceTone } from "@/features/references/series";

// Graphique d'évolution d'un repère (P2-04 étape 3). SVG dessiné à la main : aucune bibliothèque.
// Une seule courbe à la fois (jamais deux unités sur un même axe), choisie par pastilles.

// Couleur du tracé (mêmes familles que les tuiles) ; les textes restent en couleurs de texte.
const toneColor: Record<ReferenceTone, string> = {
  run: "var(--run)",
  hyrox: "var(--hyrox)",
  heart: "var(--accent)",
  strength: "var(--strength)",
};

const HEIGHT = 220;
const PAD = { top: 16, right: 20, bottom: 30, left: 52 };

export function ReferenceChart({ series }: { series: ReferenceSeries[] }) {
  const chartable = series.filter((item) => item.points.length >= 2);
  const [selectedKey, setSelectedKey] = useState(chartable[0]?.key);

  if (chartable.length === 0) {
    return (
      <p role="status" className="rounded-[14px] border border-dashed border-line-2 p-4 text-muted">
        L&apos;évolution s&apos;affiche dès qu&apos;un repère compte au moins deux mesures, à des
        dates différentes.
      </p>
    );
  }

  const current = chartable.find((item) => item.key === selectedKey) ?? chartable[0];
  return (
    <div className="flex flex-col gap-4">
      {chartable.length > 1 ? (
        <div
          role="group"
          aria-label="Repère affiché"
          className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1"
        >
          {chartable.map((item) => {
            const active = item.key === current.key;
            return (
              <button
                key={item.key}
                type="button"
                aria-pressed={active}
                onClick={() => setSelectedKey(item.key)}
                className={`inline-flex h-9 shrink-0 items-center rounded-pill border px-3 text-caption transition-colors sm:h-7 sm:px-2.5 ${
                  active
                    ? "border-transparent bg-selected text-text"
                    : "border-line text-muted hover:bg-selected-hover hover:text-text"
                }`}
              >
                {item.title}
              </button>
            );
          })}
        </div>
      ) : null}
      {/* Reconstruit à chaque changement de repère : le point survolé repart de zéro. */}
      <Plot key={current.key} series={current} />
    </div>
  );
}

function Plot({ series }: { series: ReferenceSeries }) {
  const frame = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(640);
  const [active, setActive] = useState<number | null>(null);

  // Largeur réelle du conteneur : le texte de l'axe garde sa taille sur téléphone comme sur ordinateur.
  useEffect(() => {
    const element = frame.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const { points, ticks } = series;
  const last = points[points.length - 1];
  const color = toneColor[series.tone];
  const innerWidth = Math.max(width - PAD.left - PAD.right, 1);
  const innerHeight = HEIGHT - PAD.top - PAD.bottom;
  const firstDay = points[0].day;
  const spanDays = Math.max(last.day - firstDay, 1);
  const low = ticks[0].value;
  const high = ticks[ticks.length - 1].value;

  const x = (day: number) => PAD.left + ((day - firstDay) / spanDays) * innerWidth;
  // Allure : la plus petite valeur (la plus rapide) en haut.
  const y = (value: number) => {
    const ratio = (value - low) / (high - low || 1);
    return PAD.top + (series.inverted ? ratio : 1 - ratio) * innerHeight;
  };

  const coords = points.map((point) => ({ x: x(point.day), y: y(point.value) }));
  const line = coords.map((c, i) => `${i === 0 ? "M" : "L"}${c.x},${c.y}`).join(" ");
  const baseline = PAD.top + innerHeight;
  const area = `${line} L${coords[coords.length - 1].x},${baseline} L${coords[0].x},${baseline} Z`;

  // La ligne verticale suit le pointeur et s'accroche au point le plus proche dans le temps.
  function nearest(clientX: number, target: Element) {
    const left = target.getBoundingClientRect().left;
    const pointerX = clientX - left;
    let best = 0;
    coords.forEach((c, i) => {
      if (Math.abs(c.x - pointerX) < Math.abs(coords[best].x - pointerX)) best = i;
    });
    return best;
  }

  function onPointerMove(event: PointerEvent<SVGSVGElement>) {
    setActive(nearest(event.clientX, event.currentTarget));
  }

  // Clavier : mêmes informations qu'au survol, point par point.
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
    <figure className="flex flex-col gap-3">
      <figcaption className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <span className="flex flex-col gap-0.5">
          <span className="text-small font-medium">{series.title}</span>
          {series.progress ? (
            <span className="text-caption text-muted">{series.progress}</span>
          ) : null}
        </span>
        <span className="font-mono text-title font-medium tabular">{last.valueLabel}</span>
      </figcaption>

      <div
        ref={frame}
        tabIndex={0}
        role="group"
        aria-label={`Évolution : ${series.title}. Flèches gauche et droite pour parcourir les ${points.length} mesures.`}
        onKeyDown={onKeyDown}
        onFocus={() => setActive((index) => index ?? points.length - 1)}
        onBlur={() => setActive(null)}
        className="relative overflow-hidden rounded-[14px] outline-none focus-visible:ring-2 focus-visible:ring-line-2"
      >
        <svg
          width={width}
          height={HEIGHT}
          aria-hidden
          className="block touch-pan-y select-none"
          onPointerMove={onPointerMove}
          onPointerDown={onPointerMove}
          onPointerLeave={() => setActive(null)}
        >
          {ticks.map((tick) => (
            <g key={tick.value}>
              <line
                x1={PAD.left}
                x2={width - PAD.right}
                y1={y(tick.value)}
                y2={y(tick.value)}
                stroke="var(--line)"
                strokeWidth={1}
                shapeRendering="crispEdges"
              />
              <text
                x={PAD.left - 8}
                y={y(tick.value)}
                dy="0.32em"
                textAnchor="end"
                fill="var(--muted)"
                className="font-mono text-[11px] tabular"
              >
                {tick.label}
              </text>
            </g>
          ))}
          <text
            x={PAD.left}
            y={HEIGHT - 8}
            textAnchor="start"
            fill="var(--muted)"
            className="text-[11px]"
          >
            {points[0].dateLabel}
          </text>
          <text
            x={width - PAD.right}
            y={HEIGHT - 8}
            textAnchor="end"
            fill="var(--muted)"
            className="text-[11px]"
          >
            {last.dateLabel}
          </text>

          <path d={area} fill={color} fillOpacity={0.1} />
          <path
            d={line}
            fill="none"
            stroke={color}
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          {tip ? (
            <line
              x1={tip.x}
              x2={tip.x}
              y1={PAD.top}
              y2={baseline}
              stroke="var(--line-2)"
              strokeWidth={1}
              shapeRendering="crispEdges"
            />
          ) : null}
          {coords.map((c, i) => (
            <circle
              key={points[i].id}
              cx={c.x}
              cy={c.y}
              r={i === active ? 6 : 4}
              fill={color}
              stroke="var(--surface)"
              strokeWidth={2}
            />
          ))}
        </svg>

        {shown && tip ? (
          <div
            className="pointer-events-none absolute z-10 flex w-max max-w-[220px] flex-col gap-0.5 rounded-[10px] border border-line-2 bg-surface-2 px-3 py-2"
            style={{
              left: Math.min(Math.max(tip.x - 90, 0), Math.max(width - 200, 0)),
              top: Math.max(tip.y - 76, 0),
            }}
          >
            <span className="flex items-center gap-2">
              <span aria-hidden className="h-0.5 w-3 rounded-full" style={{ background: color }} />
              <span className="font-mono text-small font-medium tabular">{shown.valueLabel}</span>
            </span>
            <span className="text-caption text-muted">
              {shown.dateLabel} · {shown.sourceLabel}
            </span>
          </div>
        ) : null}
        {/* Annonce du point choisi au clavier, pour les lecteurs d'écran. */}
        <p aria-live="polite" className="sr-only">
          {shown ? `${shown.dateLabel} : ${shown.valueLabel} (${shown.sourceLabel})` : ""}
        </p>
      </div>

      {series.inverted ? (
        <p className="text-caption text-muted">
          Axe inversé : plus la courbe monte, plus l&apos;allure est rapide.
        </p>
      ) : null}

      <details className="rounded-[14px] border border-line">
        <summary className="cursor-pointer px-4 py-3 text-small text-muted hover:text-text">
          Voir les valeurs en tableau
        </summary>
        <table className="w-full border-t border-line text-small">
          <caption className="sr-only">Mesures : {series.title}</caption>
          <thead>
            <tr className="text-left text-caption text-muted">
              <th scope="col" className="px-4 py-2 font-normal">
                Date
              </th>
              <th scope="col" className="px-4 py-2 font-normal">
                Valeur
              </th>
              <th scope="col" className="px-4 py-2 font-normal">
                Source
              </th>
            </tr>
          </thead>
          <tbody>
            {[...points].reverse().map((point) => (
              <tr key={point.id} className="border-t border-line">
                <td className="px-4 py-2">{point.dateLabel}</td>
                <td className="px-4 py-2 font-mono tabular">{point.valueLabel}</td>
                <td className="px-4 py-2 text-muted">{point.sourceLabel}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}
