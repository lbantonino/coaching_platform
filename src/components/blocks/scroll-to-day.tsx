"use client";

import { useEffect, useRef, type ReactNode } from "react";

// Défilement de la grille de l'Agenda (D-78, demande d'Antonino du 01/11 : fluide comme Google Agenda).
// Deux zones imbriquées : [data-grid-scroll] défile VERTICALEMENT (les heures), [data-grid-x]
// HORIZONTALEMENT (les jours, aimantés sur une colonne). Le téléphone donne chaque geste à une seule
// zone : descendre ne fait plus glisser les jours, et le défilement horizontal est le vrai défilement
// natif (élan, aimantation). L'en-tête des jours [data-grid-head] et les totaux [data-grid-foot]
// suivent le défilement horizontal.
// À l'ouverture : la colonne [data-start] en premier, l'heure `scrollHour` en haut. En défilant, la
// grille annonce le premier jour visible (« agenda:visible », pour le mois de la barre du téléphone).
export const VISIBLE_EVENT = "agenda:visible";

export function ScrollToDay({
  children,
  className,
  scrollHour = 0,
}: {
  children: ReactNode;
  className: string;
  // Heure placée en haut à l'ouverture (réglage « Heures de l'agenda »).
  scrollHour?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const hours = root.querySelector<HTMLElement>("[data-grid-scroll]");
    const days = root.querySelector<HTMLElement>("[data-grid-x]");
    const head = root.querySelector<HTMLElement>("[data-grid-head]");
    const foot = root.querySelector<HTMLElement>("[data-grid-foot]");
    // La marge des heures fait toujours la hauteur d'une journée (un jour peut être caché).
    const gutter = root.querySelector<HTMLElement>("[data-gutter]");
    if (hours && gutter) hours.scrollTop = (scrollHour * gutter.offsetHeight) / 24;
    if (!days) return;
    const columns = () => [...days.querySelectorAll<HTMLElement>("[data-day-col]")];
    const sync = () => {
      if (head) head.scrollLeft = days.scrollLeft;
      if (foot) foot.scrollLeft = days.scrollLeft;
    };
    const start = days.querySelector<HTMLElement>("[data-start]");
    if (start) {
      days.scrollLeft = start.offsetLeft;
      sync();
    }

    let settle: ReturnType<typeof setTimeout> | undefined;
    const onScroll = () => {
      sync();
      clearTimeout(settle);
      settle = setTimeout(() => {
        const first = columns().find(
          (col) => col.offsetLeft + col.offsetWidth / 2 > days.scrollLeft,
        );
        if (first?.dataset.date) {
          window.dispatchEvent(new CustomEvent(VISIBLE_EVENT, { detail: first.dataset.date }));
        }
      }, 120);
    };
    days.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      clearTimeout(settle);
      days.removeEventListener("scroll", onScroll);
    };
  }, [scrollHour]);
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
