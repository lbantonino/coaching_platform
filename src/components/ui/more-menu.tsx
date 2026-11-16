"use client";

import type { LucideIcon } from "lucide-react";
import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";

import { ActionMenu } from "./overlay";

// Menu « ··· » des maquettes « Programmes » (D-156) : Enregistrer comme modèle, Dupliquer, Renommer,
// Archiver… Ordinateur : bouton 32 × 32 rayon 9 (filet .12, « ··· » 14/700) et menu collé dessous à
// droite, 260 px, rayon 14, marge 6, ombre de la maquette ; lignes de 38 px rayon 9, icône 15 (trait
// 1,8) à 10 px du libellé 13,5/500 ; la ligne mise en avant sur un fond violet pâle, une action
// destructrice en rouge. Téléphone : bouton 44 × 44 rayon 12 sur fond de carte, et la feuille d'actions
// de l'app (la maquette ne dessine pas de menu sur téléphone). Échap, clic dehors : fermé ; flèches
// ↑ ↓ : d'une ligne à l'autre.
// Le menu s'ouvre dans la couche supérieure du navigateur (API Popover), posé sur le bouton : aucune
// liste qui défile ne peut plus le couper (menu d'une phase dans la colonne des semaines, signalé par
// Antonino le 11/11). Il s'ouvre au-dessus s'il manque de place en bas, et se ferme au défilement.
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
  button,
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
  // Autre bouton que « ··· » (ex. « PDF » : le même menu, une autre étiquette et son style).
  button?: { content: ReactNode; className: string };
}) {
  const [open, setOpen] = useState<"popover" | "sheet" | null>(null);
  // Position du menu (pixels de la fenêtre), calculée à l'ouverture depuis le bouton.
  const [place, setPlace] = useState<{ top: number; left: number; up: boolean } | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (open !== "popover") return;
    menu.current?.showPopover?.();
    const onPointerDown = (event: PointerEvent) => {
      if (!box.current?.contains(event.target as Node)) setOpen(null);
    };
    const close = () => setOpen(null);
    // Défilement de la page ou d'une liste : le menu ne suivrait pas son bouton, il se ferme… mais
    // seulement si le bouton a vraiment bougé. Un défilement en attente (une carte ajoutée juste
    // avant, l'inertie du pavé tactile) fermait le menu à peine ouvert : il fallait cliquer deux fois
    // (D-187, « ⋯ » des cartes d'une séance).
    const origin = trigger.current?.getBoundingClientRect();
    const onScroll = () => {
      const now = trigger.current?.getBoundingClientRect();
      if (
        !origin ||
        !now ||
        Math.abs(now.top - origin.top) > 2 ||
        Math.abs(now.left - origin.left) > 2
      )
        close();
    };
    document.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("resize", close);
    window.addEventListener("scroll", onScroll, true);
    box.current?.querySelector<HTMLElement>("[role=menuitem]")?.focus({ preventScroll: true });
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("resize", close);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [open]);

  const toggle = () => {
    if (open) return setOpen(null);
    const desktop = window.matchMedia("(min-width: 1024px)").matches;
    if (desktop && trigger.current) {
      const rect = trigger.current.getBoundingClientRect();
      const height = items.length * 38 + 12;
      const up = rect.bottom + 6 + height > window.innerHeight - 8 && rect.top - 6 - height >= 8;
      setPlace({
        top: up ? rect.top - 6 - height : rect.bottom + 6,
        left: Math.min(Math.max(8, rect.right - width), window.innerWidth - width - 8),
        up,
      });
    }
    setOpen(desktop ? "popover" : "sheet");
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
        className={
          button
            ? button.className
            : `grid place-items-center bg-surface text-[14px] leading-none font-bold tracking-[1px] text-text inset-ring inset-ring-field-ring transition-[scale,background-color] duration-150 active:scale-[0.96] lg:size-8 lg:rounded-[9px] lg:bg-transparent ${
                phoneSize === "lg" ? "size-12 rounded-[13px]" : "size-11 rounded-[12px]"
              } ${open ? "bg-surface-2" : "hover:bg-surface-2"}`
        }
      >
        {button ? button.content : "···"}
      </button>

      {open === "popover" ? (
        <div
          ref={menu}
          id={menuId}
          role="menu"
          aria-label={label}
          popover="manual"
          style={{ width, top: place?.top ?? 0, left: place?.left ?? 0 }}
          className={`fixed inset-auto m-0 flex flex-col overflow-visible rounded-[14px] border-0 bg-popover p-1.5 text-text shadow-menu transition-[opacity,scale] duration-150 ease-out starting:scale-95 starting:opacity-0 ${
            place?.up ? "origin-bottom-right" : "origin-top-right"
          }`}
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
