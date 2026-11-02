"use client";

import { ChevronDown } from "lucide-react";
import { useState, type ReactNode } from "react";

// « Séances à venir » sur téléphone (demande d'Antonino du 02/11) : seul le premier jour est montré ;
// « Voir plus », sous sa dernière séance, déplie les jours suivants (« Voir moins » les replie). Sur
// les écrans plus larges, tous les jours restent affichés côte à côte (le bouton n'existe pas, et le
// conteneur s'efface dans la grille : « contents »).
export function MoreDays({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const button = (
    <button
      type="button"
      aria-expanded={open}
      onClick={() => setOpen((value) => !value)}
      className="-mt-3 flex min-h-11 w-full items-center justify-center gap-1.5 rounded-xl text-[14px] font-medium text-violet-text transition-colors duration-150 active:bg-selected-hover sm:hidden"
    >
      {open ? "Voir moins" : "Voir plus"}
      <ChevronDown
        aria-hidden
        size={16}
        strokeWidth={2}
        className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
      />
    </button>
  );
  return (
    <>
      {open ? null : button}
      <div className={open ? "contents" : "max-sm:hidden sm:contents"}>{children}</div>
      {open ? button : null}
    </>
  );
}
