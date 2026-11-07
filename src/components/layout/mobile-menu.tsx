"use client";

import { Menu, X } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";

import { ThemedCooryLogo } from "@/components/brand/themed-logo";

import { AccountMenu } from "./account-menu";
import { useMobileMenu } from "./mobile-menu-context";
import { SideNav } from "./side-nav";
import { useShell } from "./shell-context";

// Menu du téléphone (coach, admin), en plein écran : voir mobile-menu-context.tsx.

// Carte du bouton ☰ (et du ✕ qui le remplace, menu ouvert, à la même place).
// 44 px, rayon 14 (maquette « Sportifs », 03/11/2026) ; filet en ombre intérieure (sans place prise).
const cornerButton =
  "grid size-11 shrink-0 place-items-center rounded-[14px] bg-panel text-text inset-ring inset-ring-line shadow-[0_6px_20px_rgba(0,0,0,0.14)] transition-transform duration-150 active:scale-[0.96]";

// Le bouton ☰, seul dans sa petite carte en haut à gauche.
export function MobileMenuButton() {
  const { open, openMenu } = useMobileMenu();
  return (
    <button
      type="button"
      aria-label="Ouvrir le menu"
      aria-expanded={open}
      onClick={openMenu}
      className={cornerButton}
    >
      <Menu aria-hidden size={18} strokeWidth={1.8} />
    </button>
  );
}

// La page (data-app-main) : inerte tant que le menu est ouvert (ni focus ni clic derrière lui).
export function MenuPage({ className, children }: { className: string; children: ReactNode }) {
  const { open } = useMobileMenu();
  return (
    <div data-app-main="" inert={open} className={className}>
      {children}
    </div>
  );
}

// Le menu, sur tout l'écran : ✕ à la place du ☰ et le logo, puis la recherche (coach), PRINCIPAL et
// PLUS, et le compte en bas. Il glisse depuis la gauche et repart par la gauche.
export function MobileMenuPanel() {
  const { space } = useShell();
  const { open, active, closeMenu } = useMobileMenu();
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (open) box.current?.focus({ preventScroll: true });
  }, [open]);
  if (space === "athlete") return null;
  return (
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
      className={`fixed inset-0 z-50 flex flex-col bg-panel pt-[env(safe-area-inset-top)] text-text outline-none transition-[translate] duration-[280ms] ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none lg:hidden ${
        active ? "" : "invisible"
      } ${open ? "translate-none" : "-translate-x-full"}`}
    >
      <div className="flex h-[var(--top-bar)] shrink-0 items-center gap-3.5 px-3 pt-2.5">
        <button
          type="button"
          aria-label="Fermer le menu"
          onClick={closeMenu}
          className={cornerButton}
        >
          <X aria-hidden size={20} strokeWidth={1.8} />
        </button>
        <ThemedCooryLogo height={20} />
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain px-3.5 pt-2 pb-[max(16px,env(safe-area-inset-bottom))]">
        <SideNav large />
        <div className="mt-auto">
          <AccountMenu />
        </div>
      </div>
    </div>
  );
}
