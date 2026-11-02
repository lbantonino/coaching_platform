"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";

// Menu du téléphone (coach, admin), à la façon de ChatGPT (demande d'Antonino du 01/11) : le menu est
// SOUS la page. Toucher ☰ fait glisser la page vers la droite (--menu-w) ; le menu apparaît à gauche et
// la page reste visible sur le bord droit, grisée, avec les coins arrondis d'un écran d'iPhone. Toucher
// ce bord de page, ou le pousser vers la gauche, referme le menu ; Échap aussi ; un lien du menu le
// referme en ouvrant sa page.
// `active` : le menu est ouvert ou en train de se refermer (la page est encore décalée) ; `open` : il
// est ouvert. La page se découpe à la taille de l'écran (elle peut être bien plus haute que lui) pour
// que ses coins arrondis tombent aux coins de l'écran ; on ne la fait pas défiler tant que le menu est là.
const DURATION = 320;

type MenuState = {
  open: boolean;
  active: boolean;
  openMenu: () => void;
  closeMenu: () => void;
  page: RefObject<HTMLDivElement | null>;
};

const MenuContext = createContext<MenuState>({
  open: false,
  active: false,
  openMenu: () => {},
  closeMenu: () => {},
  page: { current: null },
});

export const useMobileMenu = () => useContext(MenuContext);

export function MobileMenuProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(false);
  const page = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLElement | null>(null);
  const settle = useRef<ReturnType<typeof setTimeout>>(undefined);

  const openMenu = useCallback(() => {
    const main = page.current;
    if (!main) return;
    clearTimeout(settle.current);
    trigger.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const box = main.getBoundingClientRect();
    main.style.setProperty("--clip-top", `${Math.max(0, -box.top)}px`);
    main.style.setProperty("--clip-bottom", `${Math.max(0, box.bottom - window.innerHeight)}px`);
    setActive(true);
    // Une image avec la page découpée mais pas encore décalée, puis le glissement.
    requestAnimationFrame(() => requestAnimationFrame(() => setOpen(true)));
  }, []);

  const closeMenu = useCallback(() => {
    setOpen(false);
    clearTimeout(settle.current);
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    settle.current = setTimeout(() => setActive(false), still ? 0 : DURATION + 40);
    trigger.current?.focus({ preventScroll: true });
    trigger.current = null;
  }, []);

  useEffect(() => {
    if (!active) return;
    const root = document.documentElement;
    const overflow = root.style.overflow;
    root.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeMenu();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      root.style.overflow = overflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [active, closeMenu]);

  return (
    <MenuContext.Provider value={{ open, active, openMenu, closeMenu, page }}>
      {children}
    </MenuContext.Provider>
  );
}
