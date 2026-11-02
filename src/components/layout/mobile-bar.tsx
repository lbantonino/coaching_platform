"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";

import { CooryLogo } from "@/components/ui/coory-logo";

import { AssistantButton, NotificationBell } from "./header-tools";
import { MobileMenuButton } from "./mobile-menu";
import { athleteTabs, homeHref, pageTitle } from "./navigation";
import { PageIcon } from "./page-icon";
import { useShell } from "./shell-context";

// Téléphone (prompt Claude Design §5.2 et §5.3). Coach et admin (D-78) : deux petites cartes flottantes
// en haut, ☰ à gauche, et à droite l'assistant IA (coach), la cloche et le « + » de la page
// (MobileBarAction : « Créer » sur le tableau de bord, « Nouvelle séance » sur l'Agenda). Entre les
// deux, le nom de la page (02/11 : savoir tout de suite où l'on est), sans carte ni hauteur en plus ;
// avec l'icône de la page (celle du menu) ; le titre propre à la page (PageHeader) reste pour les
// lecteurs d'écran. Les pages défilent sous les
// cartes, dans un fondu de la couleur de la page.
// Sportif : barre du haut avec le logo, le titre de la page et la cloche (sa barre d'onglets est en bas).
const ACTION_SLOT = "mobile-bar-action";

export function MobileTopBar() {
  const { space } = useShell();
  const pathname = usePathname();
  const atTop = useAtTop();
  if (space === "athlete") {
    return (
      <header className="sticky top-3 z-30 mx-3 mt-3 flex h-16 items-center gap-2 rounded-[20px] border border-line bg-panel pr-2 pl-4 lg:hidden">
        <Link href={homeHref[space]} aria-label="Accueil" className="flex w-fit rounded-sm">
          <CooryLogo variant="symbol" size={20} />
        </Link>
        <span className="min-w-0 flex-1 truncate text-center text-[15px] font-semibold">
          {pageTitle(space, pathname)}
        </span>
        <NotificationBell phone />
      </header>
    );
  }
  return (
    <header className="sticky top-0 z-30 flex h-[var(--top-bar)] items-center justify-between px-3 [background:linear-gradient(to_bottom,var(--under-bar)_60%,transparent)] lg:hidden">
      <MobileMenuButton />
      {/* Le nom de la page s'efface dès qu'on descend dans la page et revient tout en haut (02/11) ;
          les boutons, eux, restent. */}
      <p
        aria-hidden
        className={`flex min-w-0 flex-1 items-center gap-2 px-3 text-[17px] font-semibold tracking-tight transition-[opacity,translate] duration-200 ease-out motion-reduce:transition-none ${
          atTop ? "" : "pointer-events-none -translate-y-1 opacity-0"
        }`}
      >
        <PageIcon className="shrink-0 text-violet-text" />
        <span className="truncate">{pageTitle(space, pathname)}</span>
      </p>
      <div className="flex shrink-0 items-center gap-0.5 rounded-2xl border border-line bg-panel p-1 shadow-[0_6px_20px_rgba(0,0,0,0.14)]">
        {space === "coach" ? <AssistantButton /> : null}
        <NotificationBell phone />
        <span id={ACTION_SLOT} className="contents" />
      </div>
    </header>
  );
}

// La page est-elle tout en haut ? (seuil de 12 px, lu une fois par image pendant le défilement)
function useAtTop() {
  const [atTop, setAtTop] = useState(true);
  useEffect(() => {
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setAtTop(window.scrollY < 12));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);
  return atTop;
}

// Le « + » d'une page, posé dans la carte de droite de la barre du téléphone (portail React : il garde
// le contexte de la page, comme les fenêtres « Nouvelle séance » ou « Créer »).
const noSubscribe = () => () => {};
export function MobileBarAction({ children }: { children: ReactNode }) {
  const slot = useSyncExternalStore(
    noSubscribe,
    () => document.getElementById(ACTION_SLOT),
    () => null,
  );
  return slot ? createPortal(children, slot) : null;
}

// Classe du « + » de la barre : plein (action principale), 44 px, dans la carte de droite.
export const barActionClass =
  "grid size-11 shrink-0 place-items-center rounded-xl bg-cta text-on-cta transition-transform duration-150 active:scale-[0.94]";

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
