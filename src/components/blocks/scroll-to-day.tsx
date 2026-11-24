"use client";

import { useEffect, useRef, type ReactNode } from "react";

// Défilement de la grille de l'Agenda (D-78, demande d'Antonino du 01/11 : fluide comme Google Agenda).
// Deux zones imbriquées : [data-grid-scroll] défile VERTICALEMENT (les heures), [data-grid-x]
// HORIZONTALEMENT (les jours, aimantés sur une colonne). Le téléphone donne chaque geste à une seule
// zone : descendre ne fait plus glisser les jours, et le défilement horizontal est le vrai défilement
// natif (élan, aimantation). L'en-tête des jours [data-grid-head] suit le défilement horizontal.
// À l'ouverture : la colonne [data-start] en premier, l'heure `scrollHour` en haut. En défilant, la
// grille annonce le premier jour visible et les minutes de coaching de la semaine affichée (celle du
// jour du milieu), du lundi au dimanche (« agenda:visible », pour le mois et le total d'heures du téléphone).
export const VISIBLE_EVENT = "agenda:visible";
// « agenda:goto » (bande de la semaine de la vue Jour, 02/11) : la grille glisse jusqu'à ce jour, sans
// recharger.
export const GOTO_EVENT = "agenda:goto";
export type VisibleDays = { date: string; weekStart: string; weekMinutes: number };

const mondayOf = (day: string) => {
  const date = new Date(`${day}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() - ((date.getUTCDay() + 6) % 7));
  return date.toISOString().slice(0, 10);
};
const sundayOf = (monday: string) => {
  const date = new Date(`${monday}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + 6);
  return date.toISOString().slice(0, 10);
};

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
    // En-tête des jours et rangée « Jour entier » (D-204) : tous suivent les jours.
    const heads = [...root.querySelectorAll<HTMLElement>("[data-grid-head]")];
    // La marge des heures fait toujours la hauteur d'une journée (un jour peut être caché).
    const gutter = root.querySelector<HTMLElement>("[data-gutter]");
    if (hours && gutter) hours.scrollTop = (scrollHour * gutter.offsetHeight) / 24;
    if (!days) return;
    const columns = () => [...days.querySelectorAll<HTMLElement>("[data-day-col]")];
    const sync = () => {
      for (const head of heads) head.scrollLeft = days.scrollLeft;
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
        const all = columns();
        const index = all.findIndex(
          (col) => col.offsetLeft + col.offsetWidth / 2 > days.scrollLeft,
        );
        const first = all[index];
        const date = first?.dataset.date;
        if (!date) return;
        // La semaine du jour du MILIEU de l'écran (3 jours d'hier à demain : celle d'aujourd'hui).
        const count = Math.max(1, Math.round(days.clientWidth / (first.offsetWidth || 1)));
        const middle = all[Math.min(all.length - 1, index + Math.floor(count / 2))];
        const weekStart = mondayOf(middle?.dataset.date ?? date);
        const weekEnd = sundayOf(weekStart);
        const weekMinutes = all
          .filter(
            (col) => (col.dataset.date ?? "") >= weekStart && (col.dataset.date ?? "") <= weekEnd,
          )
          .reduce((sum, col) => sum + Number(col.dataset.minutes ?? 0), 0);
        const detail: VisibleDays = { date, weekStart, weekMinutes };
        window.dispatchEvent(new CustomEvent(VISIBLE_EVENT, { detail }));
      }, 120);
    };
    const onGoto = (event: Event) => {
      const target = days.querySelector<HTMLElement>(
        `[data-day-col][data-date="${(event as CustomEvent<string>).detail}"]`,
      );
      if (!target) return;
      const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      days.scrollTo({ left: target.offsetLeft, behavior: still ? "auto" : "smooth" });
    };
    days.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener(GOTO_EVENT, onGoto);
    return () => {
      clearTimeout(settle);
      days.removeEventListener("scroll", onScroll);
      window.removeEventListener(GOTO_EVENT, onGoto);
    };
  }, [scrollHour]);
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
