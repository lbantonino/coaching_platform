import type { LucideIcon } from "lucide-react";
import type { CSSProperties } from "react";

import type { KpiColor } from "./kpi-card";

// Petites tuiles chiffrées sous un calendrier (page Agenda et tableau de bord, demandes d'Antonino du
// 26/10) : une ligne de tuiles colorées, grand chiffre en couleur et mot court. Téléphone : chiffre,
// mot et précision empilés ; ordinateur : pictogramme, chiffre et mot sur une ligne.
export type StatTile = {
  color: KpiColor;
  icon: LucideIcon;
  value: string;
  text: string;
  detail?: string;
};

export function StatTiles({ label, tiles }: { label: string; tiles: StatTile[] }) {
  return (
    <ul
      aria-label={label}
      style={{ "--n": tiles.length } as CSSProperties}
      className="grid grid-cols-[repeat(var(--n),minmax(0,1fr))] gap-2 lg:gap-3"
    >
      {tiles.map((tile) => (
        <li
          key={tile.text}
          style={{ "--c": `var(--${tile.color})` } as CSSProperties}
          className="flex min-w-0 flex-col items-center gap-0.5 rounded-[14px] border border-line bg-surface px-1.5 py-2.5 text-center lg:flex-row lg:justify-center lg:gap-2"
        >
          <tile.icon
            aria-hidden
            size={14}
            strokeWidth={2}
            className="text-[var(--c)] max-lg:hidden"
          />
          <span className="font-display text-[18px] leading-none font-semibold text-[var(--c)] tabular">
            {tile.value}
          </span>
          <span className="max-w-full truncate text-[11px] leading-tight text-muted lg:text-[13px]">
            {tile.text}
          </span>
          {tile.detail ? (
            <span className="max-w-full truncate text-[11px] leading-tight text-muted lg:text-[13px]">
              <span aria-hidden className="max-lg:hidden">
                ·{" "}
              </span>
              {tile.detail}
            </span>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
