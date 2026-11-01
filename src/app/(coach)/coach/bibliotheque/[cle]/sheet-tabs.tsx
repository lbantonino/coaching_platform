"use client";

import { useId, useState, type ReactNode } from "react";

import { segmentedGroupClass } from "@/components/ui/segmented";

// Onglets de la maquette 3 de la fiche d'un exercice (temporaire, voir maquettes.tsx) : l'habillage
// du sélecteur segmenté, avec les rôles d'onglets pour les lecteurs d'écran.
export function SheetTabs({ tabs }: { tabs: { label: string; content: ReactNode }[] }) {
  const [active, setActive] = useState(0);
  const id = useId();
  return (
    <div className="flex flex-col gap-3.5">
      <div role="tablist" aria-label="Fiche de l'exercice" className={segmentedGroupClass}>
        {tabs.map((tab, index) => (
          <button
            key={tab.label}
            type="button"
            role="tab"
            id={`${id}-tab-${index}`}
            aria-selected={active === index}
            aria-controls={`${id}-panel-${index}`}
            onClick={() => setActive(index)}
            className={`flex h-9 flex-1 items-center justify-center rounded-[9px] px-3.5 text-[14px] font-medium whitespace-nowrap transition-colors duration-150 sm:flex-none ${
              active === index ? "bg-selected text-text" : "text-muted hover:text-text"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {tabs.map((tab, index) => (
        <div
          key={tab.label}
          role="tabpanel"
          id={`${id}-panel-${index}`}
          aria-labelledby={`${id}-tab-${index}`}
          hidden={active !== index}
        >
          {tab.content}
        </div>
      ))}
    </div>
  );
}
