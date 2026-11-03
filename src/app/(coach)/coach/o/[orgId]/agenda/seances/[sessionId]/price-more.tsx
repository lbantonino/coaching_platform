"use client";

import { ChevronDown } from "lucide-react";
import { useState, type ReactNode } from "react";

// Le détail de la carte Prix (TVA, mode de paiement, dates à encaisser) : sur téléphone, replié sous
// « Voir plus » pour une carte compacte (03/11) ; sur ordinateur, toujours visible, la liste des dates
// remplissant la hauteur de la carte (FitList).
export function PriceMore({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex min-h-11 w-fit items-center gap-1 text-[13px] font-medium text-violet-text lg:hidden"
      >
        {open ? "Voir moins" : "Voir plus"}
        <ChevronDown
          aria-hidden
          size={14}
          strokeWidth={2}
          className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>
      <div
        className={`flex flex-col gap-2 pb-1 lg:min-h-0 lg:flex-auto lg:pb-0 ${open ? "" : "max-lg:hidden"}`}
      >
        {children}
      </div>
    </>
  );
}
