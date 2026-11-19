"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";

import { ThemedCooryMark } from "@/components/brand/themed-logo";

import { AssistantButton, NotificationBell } from "./header-tools";
import { MobileMenuButton } from "./mobile-menu";
import { athleteTabs, homeHref, pageTitle } from "./navigation";
import { PageIcon } from "./page-icon";
import { useShell } from "./shell-context";

// Téléphone (prompt Claude Design §5.2 et §5.3). Coach et admin (D-78) : deux petites cartes flottantes
// en haut, ☰ à gauche, et à droite l'assistant IA (coach) et la cloche. Entre les deux, le nom de la
// page (02/11 : savoir tout de suite où l'on est), sans carte ni hauteur en plus, avec l'icône de la
// page (celle du menu) ; une page de détail y met son retour à la place (« ← Tableau de bord »,
// D-117). Le « + » d'une page n'est plus dans la barre : c'est le bouton flottant en bas à droite,
// celui de l'Agenda (phoneFabClass, D-117). Les pages défilent sous les cartes, dans un fondu de la
// couleur de la page.
// Sportif : barre du haut avec le logo, le titre de la page et la cloche (sa barre d'onglets est en bas).
// Agenda (02/11, gagner de la place) : le mois remplace le nom de la page, l'icône de la vue se pose
// juste avant l'assistant IA.
const TITLE_SLOT = "mobile-bar-title";
const TOOL_SLOT = "mobile-bar-tool";

// Pages qui posent EN CE MOMENT quelque chose à la place du nom de la page (MobileBarTitle). Next garde
// la page quittée cachée dans le DOM : ce qu'elle avait posé dans la barre y reste (masqué), mais ses
// effets sont démontés. On compte donc les effets actifs, pas le contenu de la barre (05/11 : le nom
// « Tableau de bord » restait caché après une page de détail ou l'Agenda, jusqu'au rechargement).
let barTitleCount = 0;
const barTitleListeners = new Set<() => void>();
const notifyBarTitle = () => barTitleListeners.forEach((listener) => listener());
const subscribeBarTitle = (listener: () => void) => {
  barTitleListeners.add(listener);
  return () => {
    barTitleListeners.delete(listener);
  };
};
const hasBarTitle = () => barTitleCount > 0;
const noBarTitle = () => false;

export function MobileTopBar() {
  const { space } = useShell();
  const pathname = usePathname();
  const atTop = useAtTop();
  const replaced = useSyncExternalStore(subscribeBarTitle, hasBarTitle, noBarTitle);
  if (space === "athlete") {
    return (
      <header className="sticky top-3 z-30 mx-3 mt-3 flex h-16 items-center gap-2 rounded-[20px] border border-line bg-panel pr-2 pl-4 lg:hidden">
        <Link href={homeHref[space]} aria-label="Accueil" className="flex w-fit rounded-sm">
          <ThemedCooryMark height={18} />
        </Link>
        <span className="min-w-0 flex-1 truncate text-center text-[15px] font-semibold">
          {pageTitle(space, pathname)}
        </span>
        <NotificationBell phone />
      </header>
    );
  }
  return (
    <header className="sticky top-0 z-30 flex h-[var(--top-bar)] items-center justify-between px-3 pt-2.5 [background:linear-gradient(to_bottom,var(--under-bar)_60%,transparent)] lg:hidden">
      <MobileMenuButton />
      {/* Le nom de la page s'efface dès qu'on descend dans la page et revient tout en haut (02/11) ;
          les boutons, eux, restent. Une page peut le remplacer (MobileBarTitle : le mois de l'Agenda),
          avec moins de marge pour que « Septembre ▾ » tienne entier sur un écran de 390 px. */}
      <div
        className={`flex min-w-0 flex-1 items-center ${replaced ? "pr-0 pl-2" : "pr-2.5 pl-3.5"}`}
      >
        <span id={TITLE_SLOT} data-bar-title="" className="contents" />
        <p
          aria-hidden
          className={`flex min-w-0 items-center gap-[9px] text-[16px] font-medium tracking-[-0.01em] transition-[opacity,translate] duration-200 ease-out motion-reduce:transition-none ${
            replaced ? "hidden" : ""
          } ${atTop ? "" : "pointer-events-none -translate-y-1 opacity-0"}`}
        >
          <PageIcon className="shrink-0 text-violet-text" />
          <span className="truncate">{pageTitle(space, pathname)}</span>
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1 rounded-2xl bg-panel p-1 inset-ring inset-ring-line shadow-[0_6px_20px_rgba(0,0,0,0.14)]">
        <span id={TOOL_SLOT} className="contents" />
        {space === "coach" && !pathname.startsWith("/coach/assistant") ? <AssistantButton /> : null}
        <NotificationBell phone />
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

// Ce qu'une page pose dans la barre du téléphone (portail React : il garde le contexte de la page).
const noSubscribe = () => () => {};
function InSlot({ id, children }: { id: string; children: ReactNode }) {
  const slot = useSyncExternalStore(
    noSubscribe,
    () => document.getElementById(id),
    () => null,
  );
  return slot ? createPortal(children, slot) : null;
}
// À la place du nom de la page (Agenda : « Novembre ▾ » ; page de détail : son retour).
export function MobileBarTitle({ children }: { children: ReactNode }) {
  useEffect(() => {
    barTitleCount += 1;
    notifyBarTitle();
    return () => {
      barTitleCount -= 1;
      notifyBarTitle();
    };
  }, []);
  return <InSlot id={TITLE_SLOT}>{children}</InSlot>;
}
// Dans la carte de droite, avant l'assistant IA (Agenda : l'icône de la vue).
export function MobileBarTool({ children }: { children: ReactNode }) {
  return <InSlot id={TOOL_SLOT}>{children}</InSlot>;
}

// Bouton flottant « + » du téléphone (D-117, valeurs du kit « Coory Pages » SH-08 depuis D-119) :
// l'action principale de création d'une page, 60 × 60, rayon 18, à 20 px du bord et 28 px du bas
// (plus la zone du geste de l'iPhone). Un seul composant : Agenda, tableau de bord, Sportifs, fiche
// d'un sportif, Bibliothèque… Le bouton porte `data-phone-fab` : le corps de la page (PageBody)
// garde alors assez de place en bas pour que la fin de la page passe au-dessus (globals.css).
// Icône : Plus 24, trait 2,2 (elle tourne de 45° quand le bouton ouvre un petit menu : rotate-45).
export const phoneFabClass =
  "fixed right-5 bottom-[calc(28px+env(safe-area-inset-bottom))] z-30 grid size-[60px] place-items-center rounded-[18px] bg-cta text-on-cta shadow-[0_12px_28px_-8px_rgba(22,18,40,0.5)] transition-transform duration-150 ease-out active:scale-95 lg:hidden [&>svg]:transition-transform [&>svg]:duration-200";

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
