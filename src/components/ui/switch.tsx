"use client";

import type { ReactNode } from "react";

// Interrupteur des maquettes « Programmes » (D-156) : « Inès peut déplacer la séance », objectif de
// course dans l'assistant. Piste 44 × 26, rayon 13 ; bouton rond de 20 px à 3 px du bord. Allumé : piste
// encre (l'action principale, blanche en sombre) et bouton clair (noir en sombre). Éteint (non dessiné,
// PROPOSÉ) : la piste grise et le bouton blanc des Paramètres, à gauche. Toute la ligne est cliquable ;
// une case à cocher native au rôle « switch » porte l'état.
export function Switch({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  className = "",
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: ReactNode;
  // Précision sous le libellé (« Dans la même semaine. Tu reçois une notification. »).
  description?: ReactNode;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <label
      className={`flex min-h-11 items-center gap-3 ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"} ${className}`}
    >
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-[14px] leading-[1.3] font-semibold text-text lg:text-[13.5px]">
          {label}
        </span>
        {description ? (
          <span className="text-[12.5px] leading-[1.4] text-muted lg:text-[12px]">
            {description}
          </span>
        ) : null}
      </span>
      <span
        className={`relative h-[26px] w-11 shrink-0 rounded-[13px] transition-colors duration-200 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-violet ${
          checked ? "bg-cta" : "bg-dlg-check-line"
        }`}
      >
        <input
          type="checkbox"
          role="switch"
          checked={checked}
          disabled={disabled}
          onChange={(event) => onChange(event.target.checked)}
          className="absolute inset-0 m-0 size-full cursor-[inherit] appearance-none rounded-[13px] opacity-0"
        />
        <span
          aria-hidden
          className={`pointer-events-none absolute top-[3px] left-[3px] size-5 rounded-full shadow-[0_1px_2px_rgba(0,0,0,0.2)] transition-transform duration-200 ease-out motion-reduce:transition-none ${
            checked ? "translate-x-[18px] bg-on-cta" : "bg-white"
          }`}
        />
      </span>
    </label>
  );
}
