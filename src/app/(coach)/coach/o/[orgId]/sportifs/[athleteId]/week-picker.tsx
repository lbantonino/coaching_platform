"use client";

import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";

// Agenda du programme, vue Semaine (maquette « Sportifs » du 03/11/2026, page 2c) : « Semaine 2 / 12 ⌄ »
// ouvre la grille des semaines (4 par ligne). Semaine affichée en noir, semaine actuelle du sportif
// entourée de violet. Chaque semaine est un lien (la semaine est dans l'adresse). Clic dehors ou
// Échap : fermé.
export function WeekPicker({
  shown,
  current,
  count,
  ofName,
  hrefFor,
}: {
  shown: number;
  current: number | null;
  count: number;
  // « d'Inès », « de Julien » : la légende de la semaine actuelle.
  ofName: string;
  hrefFor: Record<number, string>;
}) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);

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
    }
  };

  return (
    // Pas de « relative » ici : la grille se place sur tout le groupe ‹ Semaine › (le parent), alignée à
    // gauche sur téléphone (le groupe y est à gauche de l'écran) et à droite sur ordinateur.
    <div ref={box} onKeyDown={onKeyDown} className="flex min-w-0 flex-1 lg:flex-none">
      <button
        ref={trigger}
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={`Semaine ${shown} sur ${count} : choisir une semaine`}
        onClick={() => setOpen((value) => !value)}
        className={`flex h-[38px] items-center gap-2 rounded-[11px] bg-surface pr-3 pl-3.5 text-[14px] font-semibold whitespace-nowrap text-text transition-shadow duration-150 max-lg:h-[42px] max-lg:w-full max-lg:justify-center ${
          open ? "inset-ring-[1.5px] inset-ring-violet/55" : "inset-ring inset-ring-line-2"
        }`}
      >
        Semaine {shown}
        <span className="text-[12.5px] font-medium text-faint">/ {count}</span>
        <ChevronDown
          aria-hidden
          size={14}
          strokeWidth={2}
          className={`text-muted transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open ? (
        <nav
          aria-label="Semaines du programme"
          className="absolute top-[46px] left-0 z-20 grid lg:right-0 lg:left-auto w-[236px] grid-cols-4 gap-1 rounded-2xl bg-popover p-2 shadow-[0_16px_36px_rgba(22,18,40,0.16)] inset-ring inset-ring-popover-line"
        >
          {Array.from({ length: count }, (_, i) => i + 1).map((index) => (
            <Link
              key={index}
              href={hrefFor[index]}
              scroll={false}
              aria-current={index === shown ? "page" : undefined}
              aria-label={`Semaine ${index}${index === current ? " (actuelle)" : ""}`}
              onClick={() => setOpen(false)}
              className={`grid h-11 place-items-center rounded-[10px] text-[14px] font-semibold transition-colors duration-150 ${
                index === shown ? "bg-cta text-on-cta" : "bg-surface-2 text-text hover:bg-bg"
              } ${index === current ? "inset-ring-2 inset-ring-violet" : ""}`}
            >
              {index}
            </Link>
          ))}
          {current ? (
            <span className="col-span-full px-1 pt-1.5 pb-0.5 text-[12px] text-muted">
              Contour violet : semaine actuelle {ofName}
            </span>
          ) : null}
        </nav>
      ) : null}
    </div>
  );
}
