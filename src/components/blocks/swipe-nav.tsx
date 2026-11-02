"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useTransition, type ReactNode } from "react";

// Changer de période au doigt dans l'agenda (téléphone et tablette, demande d'Antonino du 01/11) :
// glisser vers la gauche ouvre la période suivante (jour, semaine ou mois), vers la droite la
// précédente, comme les flèches. La vue suit le doigt avec de la résistance, puis glisse dans le sens du
// geste ; s'il est trop court ou trop lent, elle revient en place.
// `edges` (Jour, 3 jours, Semaine : la grille défile déjà d'un jour à l'autre sur plusieurs semaines) :
// seulement depuis le bord de la grille, pour ouvrir les semaines suivantes ou précédentes ; c'est
// alors le défilement de la grille qui rebondit, la vue ne bouge pas.
// Les gestes verticaux restent au défilement normal (touch-action pan-y, le zoom reste permis), et une
// séance attrapée par appui long (glisser-déposer, qui bloque le défilement) n'est jamais prise pour un
// changement de période. Souris : rien ne change, les flèches restent.
const DISTANCE = 64; // px
const SPEED = 0.45; // px/ms : un geste vif suffit, même court
const RESISTANCE = 0.35;
const EASE = "cubic-bezier(0.23, 1, 0.32, 1)";

type Gesture = {
  x: number;
  y: number;
  time: number;
  axis: "x" | "y" | null;
  atStart: boolean;
  atEnd: boolean;
  cancelled: boolean;
};

export function SwipeNav({
  prevHref,
  nextHref,
  edges = false,
  className = "",
  children,
}: {
  prevHref: string;
  nextHref: string;
  edges?: boolean;
  // Mise en page du conteneur (page Agenda : il remplit la hauteur du calendrier).
  className?: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);
  const hrefs = useRef({ prevHref, nextHref });
  useEffect(() => {
    hrefs.current = { prevHref, nextHref };
  });
  // Sens du dernier changement (1 = suivante) : la nouvelle période arrive de ce côté.
  const direction = useRef(0);
  const still = () => edges || window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    let gesture: Gesture | null = null;
    const follow = (dx: number) => {
      if (still()) return;
      element.style.transition = "none";
      element.style.transform = dx ? `translateX(${dx}px)` : "";
    };
    const settle = () => {
      element.style.transition = `transform 220ms ${EASE}`;
      element.style.transform = "";
    };
    const onStart = (event: TouchEvent) => {
      if (event.touches.length !== 1) {
        gesture = null;
        return;
      }
      const touch = event.touches[0];
      const scroller = edges ? element.querySelector<HTMLElement>("[data-grid-x]") : null;
      const max = scroller ? scroller.scrollWidth - scroller.clientWidth : 0;
      gesture = {
        x: touch.clientX,
        y: touch.clientY,
        time: event.timeStamp,
        axis: null,
        atStart: !scroller || scroller.scrollLeft <= 1,
        atEnd: !scroller || scroller.scrollLeft >= max - 1,
        cancelled: false,
      };
    };
    const onMove = (event: TouchEvent) => {
      if (!gesture || gesture.cancelled) return;
      // Une séance attrapée bloque le défilement : c'est un glisser-déposer, pas un changement.
      if (event.defaultPrevented || event.touches.length !== 1) {
        gesture.cancelled = true;
        settle();
        return;
      }
      const touch = event.touches[0];
      const dx = touch.clientX - gesture.x;
      const dy = touch.clientY - gesture.y;
      if (!gesture.axis && Math.hypot(dx, dy) > 10) {
        gesture.axis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
      }
      if (gesture.axis === "x") follow(dx * RESISTANCE);
    };
    const onEnd = (event: TouchEvent) => {
      const current = gesture;
      gesture = null;
      if (!current || current.cancelled || current.axis !== "x") {
        settle();
        return;
      }
      const dx = event.changedTouches[0].clientX - current.x;
      const speed = Math.abs(dx) / Math.max(event.timeStamp - current.time, 1);
      const href =
        dx < 0
          ? current.atEnd
            ? hrefs.current.nextHref
            : null
          : current.atStart
            ? hrefs.current.prevHref
            : null;
      if (!href || (Math.abs(dx) < DISTANCE && (speed < SPEED || Math.abs(dx) < 24))) {
        settle();
        return;
      }
      direction.current = dx < 0 ? 1 : -1;
      // La période quittée glisse dans le sens du geste en s'effaçant, le temps que l'autre arrive.
      element.style.transition = `transform 160ms ${EASE}, opacity 160ms ease-out`;
      element.style.transform = still() ? "" : `translateX(${-direction.current * 40}px)`;
      element.style.opacity = "0.5";
      startTransition(() => router.push(href, { scroll: false }));
    };
    const onCancel = () => {
      gesture = null;
      settle();
    };
    element.addEventListener("touchstart", onStart, { passive: true });
    element.addEventListener("touchmove", onMove, { passive: true });
    element.addEventListener("touchend", onEnd, { passive: true });
    element.addEventListener("touchcancel", onCancel, { passive: true });
    return () => {
      element.removeEventListener("touchstart", onStart);
      element.removeEventListener("touchmove", onMove);
      element.removeEventListener("touchend", onEnd);
      element.removeEventListener("touchcancel", onCancel);
    };
    // `still` ne dépend que de `edges`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [edges, router]);

  // La nouvelle période est là : elle entre du côté d'où venait le geste.
  useEffect(() => {
    const element = ref.current;
    if (pending || !direction.current || !element) return;
    const from = direction.current;
    direction.current = 0;
    element.style.transition = "none";
    element.style.transform = still() ? "" : `translateX(${from * 32}px)`;
    element.style.opacity = "0.5";
    void element.offsetWidth;
    element.style.transition = `transform 220ms ${EASE}, opacity 220ms ease-out`;
    element.style.transform = "";
    element.style.opacity = "";
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending]);

  return (
    <div ref={ref} className={`${edges ? "" : "touch-pan-y touch-pinch-zoom"} ${className}`}>
      {children}
    </div>
  );
}
