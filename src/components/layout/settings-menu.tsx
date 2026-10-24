"use client";

import { ChevronRight, LogOut, Settings, UserRound } from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";

import { iconButtonClass } from "@/components/ui/button";
import { ThemeChoice } from "@/components/ui/theme-choice";
import { logout } from "@/features/auth/actions";

import { useShell } from "./shell-context";

// Roue dentée en bas du menu (D-38, comme Claude Code) : au survol ou au clic, un petit menu
// s'ouvre au-dessus : Paramètres, Thème (Clair / Sombre / Système), Compte, Se déconnecter.
// Au téléphone (menu hamburger), il s'ouvre au toucher. Échap ou un clic ailleurs le referme.
export function SettingsMenu() {
  const { user } = useShell();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const closing = useRef<ReturnType<typeof setTimeout>>(undefined);
  // Ouvert par le survol : le clic qui suit (sur la roue) le garde ouvert au lieu de le refermer.
  const openedByHover = useRef(false);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (!box.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);
  useEffect(() => () => clearTimeout(closing.current), []);

  // Survol à la souris seulement (sur écran tactile, le toucher suffit).
  const hover = (next: boolean) => (event: React.PointerEvent) => {
    if (event.pointerType !== "mouse") return;
    clearTimeout(closing.current);
    if (next) {
      if (!open) openedByHover.current = true;
      setOpen(true);
    } else closing.current = setTimeout(() => setOpen(false), 200);
  };

  const itemClass =
    "flex min-h-11 w-full items-center gap-3 rounded-[10px] px-2.5 text-left text-[14px] font-medium text-text transition-colors duration-150 hover:bg-surface-2";
  const settingsHref = user?.settingsHref ?? null;

  return (
    <div
      ref={box}
      className="relative shrink-0"
      onPointerEnter={hover(true)}
      onPointerLeave={hover(false)}
    >
      <button
        type="button"
        aria-label="Paramètres et compte"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => {
          if (openedByHover.current) openedByHover.current = false;
          else setOpen((value) => !value);
        }}
        className={`${iconButtonClass()} ${open ? "bg-surface-2" : ""}`}
      >
        <Settings aria-hidden size={18} strokeWidth={1.7} />
      </button>
      {open ? (
        <div
          id={menuId}
          aria-label="Paramètres et compte"
          role="group"
          className="absolute right-0 bottom-full z-40 mb-2 flex w-[224px] flex-col gap-0.5 rounded-wide border border-line-2 bg-bg p-1.5 shadow-[0_8px_30px_rgba(0,0,0,0.18)]"
        >
          {settingsHref ? (
            <Link href={settingsHref} onClick={() => setOpen(false)} className={itemClass}>
              <Settings aria-hidden size={17} strokeWidth={1.7} />
              <span className="flex-1">Paramètres</span>
              <ChevronRight aria-hidden size={15} strokeWidth={1.8} className="text-muted" />
            </Link>
          ) : null}
          <div className="flex flex-col gap-1.5 px-2.5 py-2">
            <span className="text-[12px] font-medium text-muted">Thème</span>
            <ThemeChoice name="theme-menu" compact />
          </div>
          {settingsHref ? (
            <Link
              href={`${settingsHref}#compte`}
              onClick={() => setOpen(false)}
              className={itemClass}
            >
              <UserRound aria-hidden size={17} strokeWidth={1.7} />
              <span className="flex-1">Compte</span>
              <ChevronRight aria-hidden size={15} strokeWidth={1.8} className="text-muted" />
            </Link>
          ) : null}
          <div className="my-0.5 border-t border-line" />
          <form action={logout}>
            <button type="submit" className={`${itemClass} text-accent-text`}>
              <LogOut aria-hidden size={17} strokeWidth={1.7} />
              Se déconnecter
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
