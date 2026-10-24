"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { iconButtonClass } from "@/components/ui/button";
import { CooryLogo } from "@/components/ui/coory-logo";

import { NotificationBell } from "./header-tools";
import { athleteTabs, homeHref, pageTitle } from "./navigation";
import { SettingsMenu } from "./settings-menu";
import { SideNav, UserCard } from "./side-nav";
import { useShell } from "./shell-context";

// Téléphone (prompt Claude Design §5.2 et §5.3). Barre du haut collante : logo · titre de la page
// centré · cloche (+ hamburger pour le coach et l'admin). Le sportif a une barre du bas à la place.
export function MobileTopBar() {
  const { space } = useShell();
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-30 grid grid-cols-[1fr_auto_1fr] items-center gap-2 border-b border-line bg-bg px-3.5 py-2 lg:hidden">
      <Link href={homeHref[space]} aria-label="Accueil" className="flex w-fit rounded-sm">
        <CooryLogo size={19} />
      </Link>
      <span className="max-w-[170px] truncate font-display text-[16px] font-semibold">
        {pageTitle(space, pathname)}
      </span>
      <div className="flex justify-end gap-1.5">
        <NotificationBell />
        {space === "athlete" ? null : <MobileMenu />}
      </div>
    </header>
  );
}

// Menu hamburger : panneau plein écran (logo, « Menu », fermer), carte de la personne connectée,
// PRINCIPAL et PLUS, puis « Se déconnecter » et le thème. Élément <dialog> natif : focus gardé
// dedans, Échap le ferme. Toucher une ligne ferme le menu et ouvre la page.
function MobileMenu() {
  const dialog = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    dialog.current?.close();
  }, [pathname]);

  return (
    <>
      <button
        type="button"
        aria-label="Ouvrir le menu"
        aria-expanded={open}
        onClick={() => {
          dialog.current?.showModal();
          setOpen(true);
        }}
        className={iconButtonClass()}
      >
        <Menu aria-hidden size={18} strokeWidth={1.8} />
      </button>
      <dialog
        ref={dialog}
        aria-label="Menu"
        onClose={() => setOpen(false)}
        className="m-0 h-dvh max-h-none w-full max-w-none bg-bg p-0 text-text backdrop:bg-transparent lg:hidden"
      >
        <div className="flex h-full flex-col">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center border-b border-line px-3.5 py-2">
            <CooryLogo size={19} />
            <span className="font-display text-[16px] font-semibold">Menu</span>
            <button
              type="button"
              aria-label="Fermer le menu"
              onClick={() => dialog.current?.close()}
              className={`${iconButtonClass()} justify-self-end`}
            >
              <X aria-hidden size={18} strokeWidth={1.8} />
            </button>
          </div>
          <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-3.5 pt-4 pb-8">
            <SideNav large />
            <div className="mt-auto flex items-center gap-2">
              <div className="min-w-0 flex-1">
                <UserCard />
              </div>
              <SettingsMenu />
            </div>
          </div>
        </div>
      </dialog>
    </>
  );
}

// Barre du bas du sportif (téléphone) : 5 onglets de 52 px, icône 22, libellé 11/500, onglet actif
// en rouge texte. La séance du jour reste à 2 actions maximum.
export function AthleteTabBar() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Navigation du sportif"
      className="sticky bottom-0 z-30 mt-auto grid grid-cols-5 border-t border-line bg-bg px-1 pt-1.5 pb-[max(10px,env(safe-area-inset-bottom))] lg:hidden"
    >
      {athleteTabs().map(({ href, label, icon: Icon, match }) => {
        const active = match(pathname);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`flex min-h-[52px] flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors duration-150 ${
              active ? "text-accent-text" : "text-muted hover:text-text"
            }`}
          >
            <Icon aria-hidden size={22} strokeWidth={1.7} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
