"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";

// Défilement horizontal des jours (grille de la semaine sur téléphone, comme le calendrier de
// l'iPhone) : à l'ouverture, la colonne marquée data-start est placée juste après la colonne des
// heures (prompt Claude Design §6 : la veille d'aujourd'hui en premier).
export function ScrollToDay({
  children,
  className,
  style,
  fitPage = false,
  scrollHour = 0,
}: {
  children: ReactNode;
  className: string;
  style?: CSSProperties;
  // Tableau de bord sur ordinateur (D-35) : la grille défile dans sa carte, à la hauteur de l'écran.
  fitPage?: boolean;
  // Grille qui défile verticalement (ordinateur) : heure d'ouverture, comptée depuis la première ligne.
  scrollHour?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const scroller = ref.current;
    const hours = scroller?.querySelector<HTMLElement>("[data-drop-date]");
    const card = scroller?.closest("section");
    if (!fitPage || !scroller || !hours || !card) return;
    // Tout ce qui entoure la zone qui défile : au-dessus (page, chiffres clés, en-tête de la carte)
    // et en dessous (légende, bas de la carte), + 16 px pour ne pas toucher le bas de l'écran.
    const measure = () => {
      const box = scroller.getBoundingClientRect();
      const below = card.getBoundingClientRect().bottom - box.bottom;
      scroller.style.setProperty(
        "--grid-chrome-lg",
        `${Math.round(box.top + window.scrollY + below + 16)}px`,
      );
    };
    measure();
    if (scroller.scrollHeight > scroller.clientHeight) {
      scroller.scrollTop = (scrollHour * hours.offsetHeight) / Number(hours.dataset.span || 16);
    }
    const observer = new ResizeObserver(measure);
    const main = card.closest("main");
    if (main) observer.observe(main);
    return () => observer.disconnect();
  }, [fitPage, scrollHour]);
  useEffect(() => {
    const scroller = ref.current;
    const start = scroller?.querySelector<HTMLElement>("[data-start]");
    const gutter = scroller?.querySelector<HTMLElement>("[data-gutter]");
    if (!scroller || !start) return;
    const offset = start.getBoundingClientRect().left - scroller.getBoundingClientRect().left;
    scroller.scrollLeft += offset - (gutter?.offsetWidth ?? 0);
  }, []);
  return (
    // data-grid-scroll : repère du glisser-déposer, qui fait défiler les jours près des bords.
    <div ref={ref} data-grid-scroll className={className} style={style}>
      {children}
    </div>
  );
}
