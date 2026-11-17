"use client";

import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";

// Menu déroulant (maquette « Sportifs » du 03/11/2026, filtres Statut et Programme) : un bouton à deux
// lignes (libellé discret, choix en cours en gras) et une flèche qui pivote ; la liste s'ouvre JUSTE
// SOUS le bouton (pas en feuille du bas) : 6 px de marge, rayon 14, choix de 44 px avec point de
// couleur et compteur à droite, choix en cours en violet. Chaque choix est un lien (le filtre est dans
// l'adresse). Clic dehors ou Échap : fermé ; flèches ↑ ↓ : d'un choix à l'autre.
export type DropdownOption = {
  key: string;
  label: string;
  href: string;
  selected: boolean;
  // Classe de couleur du point (bg-…), rien = pas de point.
  dot?: string;
  count?: number;
  // Filet au-dessus du choix (ex. « Fiches à compléter » après les statuts).
  separated?: boolean;
};

export function Dropdown({
  label,
  options,
  className = "",
}: {
  label: string;
  options: DropdownOption[];
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const listId = useId();
  const current = options.find((option) => option.selected) ?? options[0];
  const value = (option: DropdownOption) =>
    option.count === undefined ? option.label : `${option.label} (${option.count})`;

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
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
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    event.preventDefault();
    const items = [...(box.current?.querySelectorAll<HTMLElement>("[role=option]") ?? [])];
    if (!open) {
      setOpen(true);
      return;
    }
    const index = items.indexOf(document.activeElement as HTMLElement);
    const next =
      event.key === "ArrowDown"
        ? (index + 1) % items.length
        : (index - 1 + items.length) % items.length;
    items[next]?.focus();
  };

  return (
    <div ref={box} onKeyDown={onKeyDown} className={`relative min-w-0 ${className}`}>
      <button
        ref={trigger}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={`${label} : ${value(current)}`}
        onClick={() => setOpen((value) => !value)}
        className={`flex min-h-[60px] w-full items-center gap-2 rounded-2xl bg-surface px-3.5 py-2.5 text-left text-text transition-shadow duration-150 lg:min-h-[52px] lg:rounded-xl lg:py-[7px] ${
          open ? "inset-ring-[1.5px] inset-ring-violet/55" : "inset-ring inset-ring-line-soft"
        }`}
      >
        <span className="flex min-w-0 flex-1 flex-col gap-0.5 leading-[normal]">
          <span className="text-[12.5px] text-muted">{label}</span>
          <span className="truncate text-[15px] font-semibold">{value(current)}</span>
        </span>
        <ChevronDown
          aria-hidden
          size={16}
          strokeWidth={2}
          className={`shrink-0 text-muted transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open ? (
        <div
          id={listId}
          role="listbox"
          aria-label={label}
          className="absolute inset-x-0 top-[66px] z-20 flex flex-col rounded-[14px] bg-popover p-1.5 shadow-[0_14px_34px_rgba(22,18,40,0.16)] inset-ring inset-ring-popover-line lg:top-[58px]"
        >
          {options.map((option) => (
            <div key={option.key} className="flex flex-col">
              {option.separated ? <span aria-hidden className="mx-2.5 my-1 h-px bg-line" /> : null}
              <Link
                href={option.href}
                scroll={false}
                role="option"
                aria-selected={option.selected}
                onClick={() => setOpen(false)}
                className={`flex min-h-11 items-center gap-2 rounded-[9px] px-2.5 text-[14px] font-medium transition-colors duration-150 ${
                  option.selected ? "bg-selected text-violet-text" : "text-text hover:bg-surface-2"
                }`}
              >
                {option.dot ? (
                  <span aria-hidden className={`h-1 w-3.5 shrink-0 rounded-[2px] ${option.dot}`} />
                ) : null}
                <span className="flex-1 whitespace-nowrap">{option.label}</span>
                {option.count === undefined ? null : (
                  <span className="text-[12.5px] font-medium text-faint tabular">
                    {option.count}
                  </span>
                )}
              </Link>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
