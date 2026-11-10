"use client";

import type { LucideIcon } from "lucide-react";
import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";

import { ActionMenu } from "./overlay";

// Menu « ··· » des maquettes « Programmes » (D-156) : Enregistrer comme modèle, Dupliquer, Renommer,
// Archiver… Ordinateur : bouton 32 × 32 rayon 9 (filet .12, « ··· » 14/700) et menu collé dessous à
// droite, 260 px, rayon 14, marge 6, ombre de la maquette ; lignes de 38 px rayon 9, icône 15 (trait
// 1,8) à 10 px du libellé 13,5/500 ; la ligne mise en avant sur un fond violet pâle, une action
// destructrice en rouge. Téléphone : bouton 44 × 44 rayon 12 sur fond de carte, et la feuille d'actions
// de l'app (la maquette ne dessine pas de menu sur téléphone). Échap, clic dehors : fermé ; flèches
// ↑ ↓ : d'une ligne à l'autre.
export type MoreMenuItem = {
  label: string;
  icon: LucideIcon;
  onSelect: () => void;
  // Mise en avant (« Enregistrer comme modèle » dans la maquette).
  highlighted?: boolean;
  destructive?: boolean;
};

export function MoreMenu({
  label,
  title,
  items,
  phoneSize = "md",
  width = 260,
  className = "",
}: {
  // Nom du bouton pour les lecteurs d'écran (« Plus d'actions sur le programme »).
  label: string;
  // Titre de la feuille d'actions sur téléphone (« Programme », « Séance »).
  title: string;
  items: MoreMenuItem[];
  // Téléphone : 44 px (en-tête), 48 px rayon 13 (pied de la page d'une séance).
  phoneSize?: "md" | "lg";
  width?: number;
  className?: string;
}) {
  const [open, setOpen] = useState<"popover" | "sheet" | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (open !== "popover") return;
    const onPointerDown = (event: PointerEvent) => {
      if (!box.current?.contains(event.target as Node)) setOpen(null);
    };
    document.addEventListener("pointerdown", onPointerDown);
    box.current?.querySelector<HTMLElement>("[role=menuitem]")?.focus();
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  const toggle = () => {
    if (open) return setOpen(null);
    setOpen(window.matchMedia("(min-width: 1024px)").matches ? "popover" : "sheet");
  };

  const choose = (item: MoreMenuItem) => {
    setOpen(null);
    item.onSelect();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (open !== "popover") return;
    if (event.key === "Escape" || event.key === "Tab") {
      if (event.key === "Escape") event.preventDefault();
      setOpen(null);
      if (event.key === "Escape") trigger.current?.focus();
      return;
    }
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    event.preventDefault();
    const rows = [...(box.current?.querySelectorAll<HTMLElement>("[role=menuitem]") ?? [])];
    const index = rows.indexOf(document.activeElement as HTMLElement);
    const next =
      event.key === "ArrowDown"
        ? (index + 1) % rows.length
        : (index - 1 + rows.length) % rows.length;
    rows[next]?.focus();
  };

  return (
    <div ref={box} onKeyDown={onKeyDown} className={`relative ${className}`}>
      <button
        ref={trigger}
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open !== null}
        aria-controls={open === "popover" ? menuId : undefined}
        onClick={toggle}
        className={`grid place-items-center bg-surface text-[14px] leading-none font-bold tracking-[1px] text-text inset-ring inset-ring-field-ring transition-[scale,background-color] duration-150 active:scale-[0.96] lg:size-8 lg:rounded-[9px] lg:bg-transparent ${
          phoneSize === "lg" ? "size-12 rounded-[13px]" : "size-11 rounded-[12px]"
        } ${open ? "bg-surface-2" : "hover:bg-surface-2"}`}
      >
        ···
      </button>

      {open === "popover" ? (
        <div
          id={menuId}
          role="menu"
          aria-label={label}
          style={{ width }}
          className="absolute top-[calc(100%+6px)] right-0 z-30 flex origin-top-right flex-col rounded-[14px] bg-popover p-1.5 shadow-menu transition-[opacity,scale] duration-150 ease-out starting:scale-95 starting:opacity-0"
        >
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                type="button"
                role="menuitem"
                onClick={() => choose(item)}
                className={`flex h-[38px] w-full items-center gap-2.5 rounded-[9px] px-2.5 text-left text-[13.5px] leading-[normal] font-medium whitespace-nowrap transition-colors duration-150 focus-visible:outline-none ${
                  item.destructive ? "text-alert" : "text-text"
                } ${item.highlighted ? "bg-selected" : "hover:bg-surface-2 focus-visible:bg-surface-2"}`}
              >
                <Icon aria-hidden size={15} strokeWidth={1.8} className="shrink-0" />
                {item.label}
              </button>
            );
          })}
        </div>
      ) : null}

      <ActionMenu
        open={open === "sheet"}
        onClose={() => setOpen(null)}
        title={title}
        items={items.map((item) => ({
          label: item.label,
          icon: item.icon,
          destructive: item.destructive,
          separatorBefore: item.destructive && items.length > 1,
          onSelect: () => choose(item),
        }))}
      />
    </div>
  );
}
