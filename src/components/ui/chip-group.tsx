"use client";

import { useId, type ReactNode } from "react";

// Pastilles à choix unique des maquettes « Programmes » (D-156) : un groupe de boutons radio natifs
// (flèches du clavier, lecteurs d'écran). Choisie : encre pleine, texte blanc (blanc et texte noir en
// sombre, comme l'action principale). Mesures exactes, par usage :
// - pill : « Appliquer à » (cette semaine, la phase, tout le programme) et filtres du téléphone :
//   36 px, rayon 18, 13 px de côté, 13,5/500, écart 6, retour à la ligne permis ; non choisie : fond de
//   page sur une carte (« card »), fond de carte sur la page (« page ») ; compteur 12/500 adouci ;
// - zone : zones de FC Z1 à Z5, parts égales de 40 px, rayon 10, 13,5/600, fond de page ;
// - count : séances par semaine (1 à 7), parts égales de 44 px, rayon 11, 15/600, fond de carte et filet.
export type ChipSize = "pill" | "zone" | "count";

const GROUP: Record<ChipSize, string> = {
  pill: "flex flex-wrap gap-1.5",
  zone: "flex gap-1.5",
  count: "flex gap-1.5",
};

const ITEM: Record<ChipSize, string> = {
  pill: "h-9 rounded-[18px] px-[13px] text-[13.5px] font-medium gap-1.5",
  zone: "h-10 flex-1 rounded-[10px] text-[13.5px] font-semibold",
  count: "h-11 flex-1 rounded-[11px] text-[15px] font-semibold",
};

function idleClass(size: ChipSize, on: "card" | "page"): string {
  if (size === "count") return "bg-surface text-text inset-ring inset-ring-field-ring";
  if (size === "zone") return "bg-bg text-text-2";
  return on === "page" ? "bg-surface text-text-2" : "bg-bg text-text-2";
}

export type ChipOption<T extends string> = {
  value: T;
  label: ReactNode;
  count?: number;
  disabled?: boolean;
};

export function ChipGroup<T extends string>({
  label,
  value,
  onChange,
  options,
  size = "pill",
  on = "card",
  className = "",
}: {
  label: string;
  value: T;
  onChange: (value: T) => void;
  options: ChipOption<T>[];
  size?: ChipSize;
  // Surface sous les pastilles : une carte blanche ou le fond de la page.
  on?: "card" | "page";
  className?: string;
}) {
  const name = useId();
  return (
    <fieldset className={`m-0 min-w-0 border-0 p-0 ${className}`}>
      <legend className="sr-only">{label}</legend>
      <div className={GROUP[size]}>
        {options.map((option) => {
          const active = option.value === value;
          return (
            <label
              key={option.value}
              className={`tap-44 inline-flex min-w-0 cursor-pointer items-center justify-center leading-[normal] whitespace-nowrap transition-[background-color,color,box-shadow,scale] duration-150 active:scale-[0.97] has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-violet ${ITEM[size]} ${
                active ? "bg-cta text-on-cta" : idleClass(size, on)
              }`}
            >
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={active}
                disabled={option.disabled}
                onChange={() => onChange(option.value)}
                className="sr-only"
              />
              {option.label}
              {option.count === undefined ? null : (
                <span className="text-[12px] font-medium tabular opacity-65">{option.count}</span>
              )}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
