"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

// « Gagné et dépensé » (D-73, choix d'Antonino : barres par période) : pour chaque semaine, mois ou
// année, une barre « Gagné » (--chart-1, bleu) et une barre « Dépensé » (--chart-2, orange) côte à
// côte, sur UN seul axe qui part de zéro. Barres fines, bouts arrondis posés sur la ligne de base,
// 2 px d'écart. Au survol (ou au clavier), une bulle donne les deux montants et le résultat ; un clic
// choisit la période (comme une ligne du tableau). La période choisie est surlignée en jaune.
export type BarGroup = {
  key: string;
  label: string;
  short: string;
  href: string;
  gained: number;
  spent: number;
  gainedText: string;
  spentText: string;
  resultText: string;
  negative: boolean;
};

const HEIGHT = 168;

export function BarChart({
  groups,
  selected,
  basisLabel,
}: {
  groups: BarGroup[];
  selected: string;
  basisLabel: string;
}) {
  const router = useRouter();
  const [active, setActive] = useState<string | null>(null);
  const max = Math.max(1, ...groups.flatMap((group) => [group.gained, group.spent]));
  const focused = groups.find((group) => group.key === (active ?? selected)) ?? null;
  const height = (cents: number) => (cents === 0 ? 0 : Math.max(3, (cents / max) * HEIGHT));

  return (
    <figure className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-[13px] text-muted">
        <span className="inline-flex items-center gap-2">
          <span
            aria-hidden
            className="size-2.5 rounded-full"
            style={{ background: "var(--chart-1)" }}
          />
          Gagné {basisLabel}
        </span>
        <span className="inline-flex items-center gap-2">
          <span
            aria-hidden
            className="size-2.5 rounded-full"
            style={{ background: "var(--chart-2)" }}
          />
          Dépensé {basisLabel}
        </span>
      </div>

      {/* Bulle : la période survolée (ou choisie), ses deux montants et le résultat. */}
      <div
        aria-live="polite"
        className="flex min-h-11 flex-wrap items-baseline gap-x-4 gap-y-1 text-[14px]"
      >
        {focused ? (
          <>
            <span className="font-semibold">{focused.label}</span>
            <span className="text-muted">
              Gagné <span className="font-medium text-text tabular">{focused.gainedText}</span>
            </span>
            <span className="text-muted">
              Dépensé <span className="font-medium text-text tabular">{focused.spentText}</span>
            </span>
            <span className="text-muted">
              Résultat{" "}
              <span
                className={`font-semibold tabular ${focused.negative ? "text-alert" : "text-text"}`}
              >
                {focused.resultText}
              </span>
            </span>
          </>
        ) : null}
      </div>

      <div
        className="relative flex items-end gap-1 border-b border-line-2 sm:gap-1.5"
        style={{ height: HEIGHT + 8 }}
        onMouseLeave={() => setActive(null)}
      >
        {/* Lignes de repère discrètes : la moitié et le haut de l'échelle. */}
        <span aria-hidden className="absolute inset-x-0 top-2 border-t border-dashed border-line" />
        <span
          aria-hidden
          className="absolute inset-x-0 border-t border-dashed border-line"
          style={{ bottom: HEIGHT / 2 }}
        />
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
              className={`relative z-10 flex h-full min-w-0 flex-1 items-end justify-center gap-[2px] rounded-t-[8px] px-0.5 transition-colors duration-150 ${
                current ? "bg-selected" : active === group.key ? "bg-selected-hover" : ""
              }`}
            >
              <span
                aria-hidden
                className="w-full max-w-3.5 rounded-t-[4px]"
                style={{ height: height(group.gained), background: "var(--chart-1)" }}
              />
              <span
                aria-hidden
                className="w-full max-w-3.5 rounded-t-[4px]"
                style={{ height: height(group.spent), background: "var(--chart-2)" }}
              />
            </button>
          );
        })}
      </div>
      <div aria-hidden className="-mt-2 flex gap-1 sm:gap-1.5">
        {groups.map((group, index) => (
          <span
            key={group.key}
            className={`min-w-0 flex-1 text-center font-mono text-[10px] whitespace-nowrap text-muted sm:text-[11px] ${
              // Téléphone : une étiquette sur deux, pour qu'elles ne se chevauchent pas.
              index % 2 === 1 ? "max-sm:invisible" : ""
            }`}
          >
            {group.short}
          </span>
        ))}
      </div>
      <figcaption className="sr-only">
        Gagné et dépensé par période ; le tableau de comptabilité donne tous les montants.
      </figcaption>
    </figure>
  );
}
