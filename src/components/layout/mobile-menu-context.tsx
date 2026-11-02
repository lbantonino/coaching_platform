"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

// Menu du téléphone (coach, admin) : il couvre tout l'écran (demande d'Antonino du 02/11, il remplace
// le menu « sous la page » façon ChatGPT). Toucher ☰ le fait glisser depuis la gauche ; ✕ (à la place
// exacte du ☰), Échap ou un lien du menu le referment. Tant qu'il est là, la page derrière ne défile
// pas et ne reçoit plus le focus.
// `active` : le menu est ouvert ou en train de se refermer (il reste affiché le temps du glissement) ;
// `open` : il est ouvert.
const DURATION = 280;

type MenuState = {
  open: boolean;
  active: boolean;
  openMenu: () => void;
  closeMenu: () => void;
};

const MenuContext = createContext<MenuState>({
  open: false,
  active: false,
  openMenu: () => {},
  closeMenu: () => {},
});

export const useMobileMenu = () => useContext(MenuContext);

export function MobileMenuProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(false);
  const trigger = useRef<HTMLElement | null>(null);
  const settle = useRef<ReturnType<typeof setTimeout>>(undefined);

  const openMenu = useCallback(() => {
    clearTimeout(settle.current);
    trigger.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setActive(true);
    // Une image avec le menu en place mais hors de l'écran, puis le glissement.
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
    <MenuContext.Provider value={{ open, active, openMenu, closeMenu }}>
      {children}
    </MenuContext.Provider>
  );
}
