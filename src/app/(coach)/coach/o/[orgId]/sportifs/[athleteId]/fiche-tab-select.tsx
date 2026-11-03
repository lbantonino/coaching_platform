"use client";

import { ChevronDown, LayoutGrid } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";

// Téléphone : les dix onglets de la fiche dans un sélecteur (maquette « Sportifs » du 03/11/2026,
// pages 2a à 2k). Sous l'identité du sportif, une ligne « Vue d'ensemble   1 / 10 ▾ » ; elle déplie
// les onglets sur deux colonnes, l'onglet ouvert en violet. Les onglets restent des liens (l'onglet
// est dans l'adresse). Clic dehors ou Échap : fermé.
export type FicheTab = { key: string; label: string; href: string; active: boolean };

export function FicheTabSelect({ tabs }: { tabs: FicheTab[] }) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const index = Math.max(
    0,
    tabs.findIndex((tab) => tab.active),
  );
  const current = tabs[index];

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
    <div ref={box} onKeyDown={onKeyDown} className="lg:hidden">
      <button
        ref={trigger}
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={`Section de la fiche : ${current.label}, ${index + 1} sur ${tabs.length}`}
        onClick={() => setOpen((value) => !value)}
        className={`flex min-h-[54px] w-full items-center gap-2.5 rounded-b-[20px] border-t border-line pr-4 pl-5 text-left text-text transition-colors duration-150 ${
          open ? "bg-surface-2" : ""
        }`}
      >
        <LayoutGrid aria-hidden size={17} strokeWidth={1.8} className="shrink-0 text-violet-text" />
        <span className="flex-1 text-[15px] font-semibold">{current.label}</span>
        <span className="text-[12.5px] font-medium whitespace-nowrap text-faint">
          {index + 1} / {tabs.length}
        </span>
        <ChevronDown
          aria-hidden
          size={16}
          strokeWidth={2}
          className={`shrink-0 text-muted transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open ? (
        <nav
          aria-label="Sections de la fiche"
          className="absolute inset-x-0 top-[calc(100%+6px)] z-20 grid grid-cols-2 gap-1 rounded-[18px] bg-popover p-1.5 shadow-[0_16px_36px_rgba(22,18,40,0.16)] inset-ring inset-ring-popover-line"
        >
          {tabs.map((tab) => (
            <Link
              key={tab.key}
              href={tab.href}
              scroll={false}
              aria-current={tab.active ? "page" : undefined}
              onClick={() => setOpen(false)}
              className={`flex min-h-[46px] items-center rounded-[11px] px-3 text-[14px] font-medium whitespace-nowrap transition-colors duration-150 ${
                tab.active ? "bg-selected text-violet-text" : "text-text hover:bg-surface-2"
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </nav>
      ) : null}
    </div>
  );
}
