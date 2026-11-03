"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { GOTO_EVENT, VISIBLE_EVENT, type VisibleDays } from "./scroll-to-day";

// La semaine au-dessus de l'Agenda (demandes d'Antonino du 02/11, d'après le Calendrier de l'iPhone),
// dans toutes les vues sauf Mois : L M M J V S D et leurs dates ; en vue
// Jour, le jour écrit en entier dessous. Aujourd'hui : un rond violet plein (toujours). Les jours
// affichés sont en gris : un rond pour un seul jour (Jour, début de la Liste), une bande pour plusieurs
// (3 jours, Semaine).
// Toucher un jour y fait glisser la grille sans recharger ; glisser la grille met la bande à jour ;
// glisser la BANDE sur le côté change de semaine (même jour de la semaine) ; la bande se cache quand le
// mois est déplié (« Novembre ▾ », html[data-agenda-month]). Téléphone seulement (02/11) : sur
// ordinateur, le petit calendrier du panneau de l'Agenda suffit.
const letters = ["L", "M", "M", "J", "V", "S", "D"];
const longDay = new Intl.DateTimeFormat("fr-BE", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: "UTC",
});
const utc = (day: string) => new Date(`${day}T00:00:00Z`);
const addDays = (day: string, n: number) => {
  const date = utc(day);
  date.setUTCDate(date.getUTCDate() + n);
  return date.toISOString().slice(0, 10);
};
const mondayOf = (day: string) => addDays(day, -((utc(day).getUTCDay() + 6) % 7));
// Un glissé de la bande : au moins 40 px, nettement plus horizontal que vertical.
const SWIPE = 40;

export function DayWeekStrip({
  initial,
  today,
  dayHref,
  viewHref,
  span = 1,
  title = false,
}: {
  // Le premier jour affiché (jour de la vue Jour, premier jour visible, début de la Liste).
  initial: string;
  today: string;
  // Adresses avec « __DATE__ » : un jour ouvert (si la grille ne le contient pas), et la même vue à une
  // autre date (glissé hors des semaines chargées).
  dayHref: string;
  viewHref: string;
  // Jours affichés à partir du premier (1, 3 ou 7).
  span?: number;
  // Le jour en entier sous la bande (vue Jour).
  title?: boolean;
}) {
  const router = useRouter();
  const [shown, setShown] = useState(initial);
  // Sens du dernier changement de semaine : la nouvelle semaine arrive de ce côté.
  const [from, setFrom] = useState<"left" | "right" | null>(null);
  // Une autre date ouverte par l'adresse : la bande repart d'elle (ajusté au rendu).
  const [openedOn, setOpenedOn] = useState(initial);
  if (openedOn !== initial) {
    setOpenedOn(initial);
    setShown(initial);
  }
  const start = useRef<{ x: number; y: number } | null>(null);
  const swiped = useRef(false);
  // Dernier jour montré, tenu à jour par les gestes : il donne le sens d'un changement de semaine.
  const last = useRef(initial);
  useEffect(() => {
    const onVisible = (event: Event) => {
      const next = (event as CustomEvent<VisibleDays>).detail.date;
      if (
        mondayOf(addDays(next, Math.floor(span / 2))) !==
        mondayOf(addDays(last.current, Math.floor(span / 2)))
      ) {
        setFrom(next > last.current ? "right" : "left");
      }
      last.current = next;
      setShown(next);
    };
    window.addEventListener(VISIBLE_EVENT, onVisible);
    return () => window.removeEventListener(VISIBLE_EVENT, onVisible);
  }, [span]);

  const toDay = (date: string) => dayHref.replace("__DATE__", date);
  const toView = (date: string) => viewHref.replace("__DATE__", date);
  // Téléphone : la grille contient-elle ce jour (9 semaines chargées) ? Elle y glisse ; sinon on ouvre
  // la même vue à cette date.
  const go = (date: string) => {
    last.current = date;
    if (document.querySelector(`[data-day-col][data-date="${date}"]`)) {
      setShown(date);
      window.dispatchEvent(new CustomEvent(GOTO_EVENT, { detail: date }));
    } else {
      router.push(toView(date), { scroll: false });
    }
  };
  const changeWeek = (direction: 1 | -1) => {
    setFrom(direction === 1 ? "right" : "left");
    go(addDays(shown, 7 * direction));
  };

  // La semaine du jour du milieu de l'écran (3 jours d'hier à demain : celle d'aujourd'hui).
  const monday = mondayOf(addDays(shown, Math.floor(span / 2)));
  const phoneEnd = addDays(shown, span - 1);
  const week = letters.map((letter, index) => ({ letter, date: addDays(monday, index), index }));
  const dayTitle = longDay.format(utc(shown));
  // Le gris des jours affichés : rond (un jour) ou bande aux bouts arrondis (plusieurs jours).
  const highlight = (date: string, index: number) => {
    const shownDay = date >= shown && date <= phoneEnd;
    const band =
      span > 1 && shownDay
        ? `bg-bar ${date === shown || index === 0 ? "rounded-l-full" : ""} ${
            date === phoneEnd || index === 6 ? "rounded-r-full" : ""
          }`
        : "";
    const number =
      date === today
        ? "bg-accent font-semibold text-on-accent"
        : span === 1 && shownDay
          ? "bg-bar font-semibold text-text"
          : "text-text";
    return { band, number };
  };

  return (
    <div className="shrink-0 border-b border-line-soft [html[data-agenda-month]_&]:hidden">
      <div className={`flex px-1 pt-0.5 ${title ? "" : "pb-1"}`}>
        <div
          key={monday}
          role="group"
          aria-label="Jours de la semaine"
          // Glisser sur le côté change de semaine ; le navigateur garde le défilement vertical.
          onPointerDown={(event) => {
            start.current = { x: event.clientX, y: event.clientY };
            swiped.current = false;
          }}
          onPointerUp={(event) => {
            const origin = start.current;
            start.current = null;
            if (!origin) return;
            const dx = event.clientX - origin.x;
            const dy = event.clientY - origin.y;
            if (Math.abs(dx) < SWIPE || Math.abs(dx) < Math.abs(dy) * 1.5) return;
            swiped.current = true;
            changeWeek(dx < 0 ? 1 : -1);
          }}
          onPointerCancel={() => {
            start.current = null;
          }}
          // Un glissé n'est pas un appui sur le jour où il finit.
          onClickCapture={(event) => {
            if (!swiped.current) return;
            event.preventDefault();
            event.stopPropagation();
            swiped.current = false;
          }}
          className={`grid min-w-0 flex-1 touch-pan-y grid-cols-7 transition-[opacity,translate] duration-200 ease-out motion-reduce:transition-none ${
            from === "right"
              ? "starting:translate-x-6 starting:opacity-0"
              : from === "left"
                ? "starting:-translate-x-6 starting:opacity-0"
                : ""
          }`}
        >
          {week.map(({ letter, date, index }) => {
            const isToday = date === today;
            const { band, number } = highlight(date, index);
            return (
              <Link
                key={date}
                href={toDay(date)}
                scroll={false}
                draggable={false}
                aria-current={date === shown ? "date" : undefined}
                aria-label={longDay.format(utc(date))}
                onClick={(event) => {
                  // Téléphone : la grille ou la vue montre ce jour sans recharger quand elle le peut.
                  if (window.matchMedia("(min-width: 1024px)").matches) return;
                  event.preventDefault();
                  go(date);
                }}
                className="group flex min-h-12 flex-col items-center justify-center gap-0.5 select-none"
              >
                <span
                  aria-hidden
                  className={`text-[11px] leading-none font-medium ${
                    isToday ? "text-violet-text" : "text-muted"
                  }`}
                >
                  {letter}
                </span>
                <span aria-hidden className={`flex h-8 w-full items-center justify-center ${band}`}>
                  <span
                    className={`grid size-8 place-items-center rounded-full text-[15px] leading-none tabular transition-colors duration-150 ${number}`}
                  >
                    {utc(date).getUTCDate()}
                  </span>
                </span>
              </Link>
            );
          })}
        </div>
      </div>
      {title ? (
        <p className="pt-1 pb-2 text-center text-[14px] font-semibold tracking-tight">
          {dayTitle.charAt(0).toUpperCase() + dayTitle.slice(1)}
        </p>
      ) : null}
    </div>
  );
}
