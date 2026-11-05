"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

// « Gagné et dépensé » (D-73 ; kit « Coory Pages », page 04, D-130) : pour chaque période, une barre
// « Gagné » (violet) et une « Dépensé » (jaune) côte à côte, sur UN axe gradué (0 · moitié · haut,
// « 1,75 k »). La période choisie a un fond violet pâle et ses barres pleines ; les autres sont
// pâlies. Au survol (ou au clavier), la ligne du dessus donne ses deux montants et le résultat ; un
// clic choisit la période pour toute la page (comme une ligne du tableau).
export type BarGroup = {
  key: string;
  label: string;
  short: string;
  // Téléphone : l'initiale du mois (« N »), le jour ou l'année courte (kit).
  tiny: string;
  href: string;
  gained: number;
  spent: number;
  gainedText: string;
  spentText: string;
  resultText: string;
  negative: boolean;
};

// Haut de l'axe : arrondi à la demi-puissance de 10 au-dessus (3 300 € -> 3 500 €).
function niceMax(cents: number) {
  if (cents <= 0) return 100;
  const magnitude = 10 ** Math.floor(Math.log10(cents));
  const step = magnitude / 2;
  return Math.ceil(cents / step) * step;
}

const tick = new Intl.NumberFormat("fr-BE", { maximumFractionDigits: 2 });
const tickLabel = (cents: number) => {
  const euros = cents / 100;
  return euros >= 1000 ? `${tick.format(euros / 1000)} k` : tick.format(euros);
};

export function BarChart({ groups, selected }: { groups: BarGroup[]; selected: string }) {
  const router = useRouter();
  const [active, setActive] = useState<string | null>(null);
  const top = niceMax(Math.max(0, ...groups.flatMap((group) => [group.gained, group.spent])));
  const focused = groups.find((group) => group.key === (active ?? selected)) ?? null;
  const height = (cents: number) => (cents === 0 ? "0%" : `${Math.max(1.5, (cents / top) * 100)}%`);

  return (
    <figure className="flex min-w-0 flex-1 flex-col gap-5">
      {/* La période survolée (ou choisie), ses deux montants et le résultat. */}
      <div
        aria-live="polite"
        className="flex min-h-[18px] min-w-0 flex-wrap items-baseline gap-x-4 gap-y-1 text-[13px] leading-[normal] text-muted"
      >
        {focused ? (
          <>
            <span className="text-[14px] font-semibold whitespace-nowrap text-text">
              {focused.label}
            </span>
            <span className="flex items-baseline gap-1.5 whitespace-nowrap">
              Gagné{" "}
              <strong className="text-[14px] font-semibold text-text tabular">
                {focused.gainedText}
              </strong>
            </span>
            <span className="flex items-baseline gap-1.5 whitespace-nowrap">
              Dépensé{" "}
              <strong className="text-[14px] font-semibold text-text tabular">
                {focused.spentText}
              </strong>
            </span>
            <span className="flex items-baseline gap-1.5 whitespace-nowrap">
              Résultat{" "}
              <strong
                className={`text-[14px] font-semibold tabular ${focused.negative ? "text-alert" : "text-ok"}`}
              >
                {focused.resultText}
              </strong>
            </span>
          </>
        ) : null}
      </div>

      <div className="flex min-h-[180px] flex-1 gap-2 lg:min-h-[240px] lg:gap-3">
        {/* Axe : 0, la moitié, le haut. */}
        <div aria-hidden className="relative w-[34px] shrink-0 pb-6 lg:w-[38px]">
          {[0, 0.5, 1].map((share) => (
            <span
              key={share}
              className="absolute right-0 translate-y-1/2 text-[11px] leading-none font-medium whitespace-nowrap text-faint tabular"
              style={{ bottom: `calc(24px + (100% - 24px) * ${share})` }}
            >
              {tickLabel(top * share)}
            </span>
          ))}
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <div
            className="relative flex flex-1 items-end gap-1 border-b border-line-2 lg:gap-2"
            onMouseLeave={() => setActive(null)}
          >
            {[0.5, 1].map((share) => (
              <span
                key={share}
                aria-hidden
                className="absolute inset-x-0 h-px bg-line"
                style={{ bottom: `${share * 100}%` }}
              />
            ))}
            {groups.map((group) => {
              const current = group.key === selected;
              return (
                <button
                  key={group.key}
                  type="button"
                  aria-label={`${group.label} : gagné ${group.gainedText}, dépensé ${group.spentText}, résultat ${group.resultText}`}
                  aria-pressed={current}
                  onMouseEnter={() => setActive(group.key)}
                  onFocus={() => setActive(group.key)}
                  onBlur={() => setActive(null)}
                  onClick={() => router.push(group.href, { scroll: false })}
                  className={`relative z-10 flex h-full min-w-0 flex-1 items-end justify-center gap-[2px] rounded-t-[10px] px-px transition-colors duration-150 lg:gap-[3px] lg:px-[5px] ${
                    current
                      ? "bg-status-accent-soft/60"
                      : active === group.key
                        ? "bg-surface-2"
                        : ""
                  }`}
                >
                  <span
                    aria-hidden
                    className={`w-full max-w-[18px] rounded-t-[5px] bg-violet transition-opacity duration-150 ${current ? "" : "opacity-40"}`}
                    style={{ height: height(group.gained) }}
                  />
                  <span
                    aria-hidden
                    className={`w-full max-w-[18px] rounded-t-[5px] bg-list-amber transition-opacity duration-150 ${current ? "" : "opacity-50"}`}
                    style={{ height: height(group.spent) }}
                  />
                </button>
              );
            })}
          </div>
          <div aria-hidden className="flex h-6 items-end gap-1 lg:gap-2">
            {groups.map((group) => (
              <span
                key={group.key}
                className={`min-w-0 flex-1 overflow-hidden text-center text-[11px] leading-none whitespace-nowrap lg:text-[12px] ${
                  group.key === selected ? "font-semibold text-text" : "font-medium text-faint"
                }`}
              >
                <span className="lg:hidden">{group.tiny}</span>
                <span className="max-lg:hidden">{group.short}</span>
              </span>
            ))}
          </div>
        </div>
      </div>
      <figcaption className="sr-only">
        Gagné et dépensé par période ; le tableau de comptabilité donne tous les montants.
      </figcaption>
    </figure>
  );
}
