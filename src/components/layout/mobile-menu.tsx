"use client";

import { Menu, Search, X } from "lucide-react";
import { useEffect, useRef, type PointerEvent, type ReactNode } from "react";

import { CooryLogo } from "@/components/ui/coory-logo";

import { AccountMenu } from "./account-menu";
import { useMobileMenu } from "./mobile-menu-context";
import { SideNav } from "./side-nav";
import { useShell } from "./shell-context";

// Menu du téléphone (coach, admin), à la façon de ChatGPT : voir mobile-menu-context.tsx.

// Le bouton ☰, seul dans sa petite carte en haut à gauche.
export function MobileMenuButton() {
  const { open, openMenu } = useMobileMenu();
  return (
    <button
      type="button"
      aria-label="Ouvrir le menu"
      aria-expanded={open}
      onClick={openMenu}
      className="grid size-[52px] shrink-0 place-items-center rounded-2xl border border-line bg-panel text-text shadow-[0_6px_20px_rgba(0,0,0,0.14)] transition-transform duration-150 active:scale-[0.96]"
    >
      <Menu aria-hidden size={20} strokeWidth={1.8} />
    </button>
  );
}

// La page (data-app-main) : elle glisse et s'arrondit quand le menu s'ouvre ; inerte tant qu'il est là.
export function MenuPage({ className, children }: { className: string; children: ReactNode }) {
  const { open, active, page } = useMobileMenu();
  const motion =
    "max-lg:transition-[translate,clip-path] max-lg:duration-[320ms] max-lg:ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none";
  const clip = open
    ? "max-lg:translate-x-[var(--menu-w)] max-lg:[clip-path:inset(var(--clip-top)_0_var(--clip-bottom)_0_round_var(--menu-radius))]"
    : "max-lg:[clip-path:inset(var(--clip-top)_0_var(--clip-bottom)_0_round_0px)]";
  return (
    <div
      ref={page}
      data-app-main=""
      inert={open}
      className={`relative ${className} ${active ? `${motion} ${clip}` : ""}`}
    >
      {children}
    </div>
  );
}

// Le menu, sous la page : logo, recherche (coach), PRINCIPAL et PLUS, puis le compte. Il glisse un peu
// (de 18 %) pendant que la page s'en va, pour qu'on sente la profondeur. Le bouton « Fermer le menu »
// n'apparaît qu'au clavier : au doigt, on touche la page.
export function MobileMenuPanel() {
  const { space } = useShell();
  const { open, active, closeMenu } = useMobileMenu();
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (open) box.current?.focus({ preventScroll: true });
  }, [open]);
  if (space === "athlete") return null;
  return (
    <div className={`fixed inset-0 bg-panel lg:hidden ${active ? "" : "invisible"}`}>
      <div
        ref={box}
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        tabIndex={-1}
        inert={!open}
        onClickCapture={(event) => {
          if ((event.target as Element).closest("a[href]")) closeMenu();
        }}
        // Ouvert, AUCUN déplacement (translate-none) : un « translate » ferait du menu le repère des
        // éléments « fixed » qu'il contient, et le menu du compte se décalerait hors de l'écran.
        className={`flex h-full w-[var(--menu-w)] flex-col px-3.5 pt-[max(16px,env(safe-area-inset-top))] pb-[max(16px,env(safe-area-inset-bottom))] outline-none transition-[translate] duration-[320ms] ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none ${
          open ? "translate-none" : "-translate-x-[18%]"
        }`}
      >
        <div className="flex h-12 items-center justify-between pl-1">
          <CooryLogo size={14} />
          <button
            type="button"
            aria-label="Fermer le menu"
            onClick={closeMenu}
            className="sr-only place-items-center rounded-control border border-line bg-surface text-text focus-visible:not-sr-only focus-visible:grid focus-visible:size-11"
          >
            <X aria-hidden size={18} strokeWidth={1.8} />
          </button>
        </div>
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain pt-3">
          {/* Coach (D-62) : la recherche globale, en tête du menu. Même cadre que les lignes du menu
              (44 px, même rayon, loupe alignée sur leurs icônes) ; shrink-0 : le menu défile, la
              recherche ne se tasse pas. */}
          {space === "coach" ? (
            <form
              role="search"
              action="/coach/recherche"
              className="flex h-11 shrink-0 items-center gap-3 rounded-control border border-line bg-surface px-3 focus-within:border-violet-line"
            >
              <Search aria-hidden size={19} strokeWidth={1.8} className="shrink-0 text-muted" />
              <label htmlFor="menu-search" className="sr-only">
                Rechercher dans Coory
              </label>
              <input
                id="menu-search"
                name="q"
                type="search"
                enterKeyHint="search"
                autoComplete="off"
                placeholder="Rechercher dans Coory…"
                className="h-full min-w-0 flex-1 bg-transparent text-[16px] text-text outline-none placeholder:text-muted"
              />
            </form>
          ) : null}
          <SideNav large />
          <div className="mt-auto">
            <AccountMenu />
          </div>
        </div>
      </div>
    </div>
  );
}

// Le bord de page visible quand le menu est ouvert : grisé, coins arrondis, filet fin. Toucher le ferme ;
// on peut aussi le pousser vers la gauche, il suit le doigt (un geste vif suffit).
export function MenuScrim() {
  const { open, active, closeMenu, page } = useMobileMenu();
  const scrim = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; time: number; dx: number; moving: boolean } | null>(null);
  const follow = (dx: number | null) => {
    for (const element of [page.current, scrim.current]) {
      if (!element) continue;
      if (dx === null) {
        element.style.removeProperty("translate");
        element.style.removeProperty("transition");
      } else {
        element.style.transition = "none";
        element.style.translate = `calc(var(--menu-w) + ${dx}px) 0`;
      }
    }
  };
  const onPointerMove = (event: PointerEvent) => {
    const current = drag.current;
    if (!current) return;
    current.dx = Math.min(0, event.clientX - current.x);
    if (!current.moving && current.dx < -6) current.moving = true;
    if (current.moving) follow(current.dx);
  };
  const onPointerUp = (event: PointerEvent) => {
    const current = drag.current;
    drag.current = null;
    if (!current) return;
    if (!current.moving) {
      closeMenu();
      return;
    }
    const speed = current.dx / Math.max(1, event.timeStamp - current.time);
    follow(null);
    if (current.dx < -80 || speed < -0.4) closeMenu();
  };
  return (
    <div
      ref={scrim}
      aria-hidden
      data-menu-scrim=""
      onPointerDown={(event) => {
        drag.current = { x: event.clientX, time: event.timeStamp, dx: 0, moving: false };
        event.currentTarget.setPointerCapture(event.pointerId);
      }}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={() => {
        drag.current = null;
        follow(null);
      }}
      className={`fixed inset-0 z-40 touch-none rounded-l-[var(--menu-radius)] border border-line bg-black/25 transition-[translate,opacity] duration-[320ms] ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none lg:hidden ${
        open
          ? "translate-x-[var(--menu-w)]"
          : `pointer-events-none opacity-0 ${active ? "" : "invisible"}`
      }`}
    />
  );
}
