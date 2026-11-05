"use client";

import { useState } from "react";

// Graphique circulaire de la Comptabilité (D-72) : la part de chaque mode de paiement dans une
// période. Anneau fin, 2 px d'écart entre les parts, couleurs de graphique validées (--chart-1 à 4),
// toujours dans le même ordre. Le total est au centre ; au survol d'une part (ou d'une ligne de la
// légende, au clavier aussi), le centre affiche ce mode, son montant et sa part. Les montants sont
// toujours écrits dans la légende : la couleur n'est jamais la seule information.
export type DonutSegment = {
  key: string;
  label: string;
  color: string;
  cents: number;
  amount: string;
  share: number;
};

const SIZE = 180;
const STROKE = 22;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const GAP = 3;

// Kit « Coory Pages », page 04 (D-130) : anneau de 180 px centré (ou, `view="bars"`, le total et une
// barre de proportion), puis une ligne par mode : point, nom, part, montant, séparées d'un filet.
export function DonutChart({
  segments,
  total,
  caption,
  view = "pie",
}: {
  segments: DonutSegment[];
  total: string;
  caption: string;
  view?: "pie" | "bars";
}) {
  const [active, setActive] = useState<string | null>(null);
  const sum = segments.reduce((acc, segment) => acc + segment.cents, 0);
  const shown = segments.filter((segment) => segment.cents > 0);
  const focused = shown.find((segment) => segment.key === active) ?? null;

  // Début de chaque part : la somme des parts qui la précèdent.
  const lengths = shown.map((segment) => (segment.cents / sum) * CIRCUMFERENCE);
  const arcs = shown.map((segment, index) => ({
    ...segment,
    offset: -lengths.slice(0, index).reduce((acc, length) => acc + length, 0),
    // Un seul mode : l'anneau est plein, sans écart.
    dash: Math.max(lengths[index] - (shown.length > 1 ? GAP : 0), 0.5),
  }));

  return (
    <figure className="flex flex-col gap-[18px]">
      {view === "pie" ? (
        <div className="relative size-[180px] shrink-0 self-center">
          <svg
            viewBox={`0 0 ${SIZE} ${SIZE}`}
            className="size-full -rotate-90"
            aria-hidden
            onMouseLeave={() => setActive(null)}
          >
            <circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              fill="none"
              stroke="var(--track)"
              strokeWidth={STROKE}
            />
            {arcs.map((arc) => (
              <circle
                key={arc.key}
                cx={SIZE / 2}
                cy={SIZE / 2}
                r={RADIUS}
                fill="none"
                stroke={arc.color}
                strokeWidth={active === arc.key ? STROKE + 6 : STROKE}
                strokeDasharray={`${arc.dash} ${CIRCUMFERENCE - arc.dash}`}
                strokeDashoffset={arc.offset}
                onMouseEnter={() => setActive(arc.key)}
                className="cursor-default transition-[stroke-width,opacity] duration-150"
                style={{ opacity: active && active !== arc.key ? 0.35 : 1 }}
              />
            ))}
          </svg>
          <div
            aria-live="polite"
            className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-1 px-7 text-center"
          >
            <span className="text-[12.5px] leading-[normal] font-medium text-muted">
              {focused ? `${focused.label} · ${focused.share} %` : "Total reçu"}
            </span>
            <span className="text-[20px] leading-none font-semibold tracking-[-0.02em] whitespace-nowrap tabular">
              {focused ? focused.amount : total}
            </span>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <span className="text-[13px] leading-[normal] font-medium text-muted">Total reçu</span>
            <span className="text-[26px] leading-none font-semibold tracking-[-0.025em] tabular">
              {total}
            </span>
          </div>
          <div aria-hidden className="flex h-2.5 gap-0.5 overflow-hidden rounded-[6px] bg-track">
            {shown.map((segment) => (
              <span
                key={segment.key}
                style={{ width: `${(segment.cents / sum) * 100}%`, background: segment.color }}
              />
            ))}
          </div>
        </div>
      )}

      <figcaption className="flex w-full min-w-0 flex-col">
        <span className="sr-only">{caption}</span>
        <ul className="flex flex-col">
          {segments.map((segment) => (
            <li key={segment.key} className="border-t border-line">
              <button
                type="button"
                disabled={segment.cents === 0}
                onMouseEnter={() => setActive(segment.cents > 0 ? segment.key : null)}
                onMouseLeave={() => setActive(null)}
                onFocus={() => setActive(segment.cents > 0 ? segment.key : null)}
                onBlur={() => setActive(null)}
                className={`flex min-h-10 w-full items-center gap-2.5 rounded-[8px] py-[9px] text-left text-[14px] leading-[normal] font-medium transition-colors duration-150 disabled:cursor-default ${
                  active === segment.key ? "bg-surface-2" : ""
                }`}
              >
                <span
                  aria-hidden
                  className="size-2 shrink-0 rounded-full"
                  style={{ background: segment.cents > 0 ? segment.color : "var(--track)" }}
                />
                <span className={`flex-1 truncate ${segment.cents === 0 ? "text-muted" : ""}`}>
                  {segment.label}
                </span>
                <span className="w-11 text-right text-[13px] font-normal text-muted tabular">
                  {segment.share} %
                </span>
                <span
                  className={`w-[100px] text-right font-semibold tabular ${segment.cents === 0 ? "text-muted" : ""}`}
                >
                  {segment.amount}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </figcaption>
    </figure>
  );
}
