"use client";

import { useEffect, useRef, type ReactNode } from "react";

// Défilement horizontal des jours (vue Semaine sur téléphone, comme le calendrier de l'iPhone) :
// à l'ouverture, la colonne marquée data-start est placée juste après la colonne des heures.
export function ScrollToDay({ children, className }: { children: ReactNode; className: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const scroller = ref.current;
    const start = scroller?.querySelector<HTMLElement>("[data-start]");
    const gutter = scroller?.querySelector<HTMLElement>("[data-gutter]");
    if (!scroller || !start) return;
    const offset = start.getBoundingClientRect().left - scroller.getBoundingClientRect().left;
    scroller.scrollLeft += offset - (gutter?.offsetWidth ?? 0);
  }, []);
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
