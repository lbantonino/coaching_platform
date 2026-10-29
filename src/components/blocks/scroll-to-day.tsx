"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";

// Défilement horizontal des jours (grille de la semaine sur téléphone, comme le calendrier de
// l'iPhone) : à l'ouverture, la colonne marquée data-start est placée juste après la colonne des
// heures (prompt Claude Design §6 : la veille d'aujourd'hui en premier).
export function ScrollToDay({
  children,
  className,
  style,
  scrollHour = 0,
}: {
  children: ReactNode;
  className: string;
  style?: CSSProperties;
  // La grille de 24 heures défile dans sa carte : heure placée en haut à l'ouverture (06:00 par
  // défaut, réglage « Heures de l'agenda »).
  scrollHour?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const scroller = ref.current;
    const hours = scroller?.querySelector<HTMLElement>("[data-drop-date]");
    if (!scroller || !hours) return;
    scroller.scrollTop = (scrollHour * hours.offsetHeight) / Number(hours.dataset.span || 24);
  }, [scrollHour]);
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
