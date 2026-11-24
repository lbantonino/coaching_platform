"use client";

import { Plus } from "lucide-react";
import { useState, type MouseEvent } from "react";

import { useDragging } from "./grid-interactions";
import { useNewSessionDraft, useOpenNewSession } from "./new-session-sheet";

// Couche cliquable d'une colonne de la grille horaire : un clic (ou un appui) sur un créneau vide
// ouvre « Nouvelle séance » à cette heure, arrondie à la demi-heure. Au survol, un fantôme
// « + 10:30 » montre le créneau visé. Au clavier, un seul bouton par jour, à 19:00 par défaut
// (l'heure se change dans le formulaire). Les séances existantes passent par-dessus.
const DEFAULT_TIME = "19:00";
const pad = (value: number) => String(value).padStart(2, "0");
const toTime = (minutes: number) => `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;
const toMinutes = (time: string) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5));

export function SlotLayer({
  date,
  dayLabel,
  firstHour,
  span,
}: {
  date: string;
  // « Mercredi 21 octobre »
  dayLabel: string;
  firstHour: number;
  span: number;
}) {
  const open = useOpenNewSession();
  const dragging = useDragging();
  const draft = useNewSessionDraft();
  const [hover, setHover] = useState<number | null>(null);
  if (!open) return null;

  // Minutes depuis minuit du créneau sous le pointeur (demi-heure), sans déborder de la grille.
  const slotAt = (event: MouseEvent<HTMLButtonElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    const ratio = Math.min(Math.max((event.clientY - box.top) / box.height, 0), 0.999);
    const halfHours = Math.floor(ratio * span * 2);
    return Math.min(firstHour * 60 + halfHours * 30, 23 * 60 + 30);
  };
  const hourHeight = `calc(100% / ${span})`;

  return (
    <>
      <button
        type="button"
        aria-label={`Ajouter une séance le ${dayLabel}`}
        onMouseMove={(event) => setHover(slotAt(event))}
        onMouseLeave={() => setHover(null)}
        onClick={(event) => {
          // detail = 0 : activé au clavier, sans position de pointeur.
          const minutes = event.detail === 0 ? null : slotAt(event);
          const time = minutes === null ? DEFAULT_TIME : toTime(minutes);
          // Le créneau à l'écran : la bulle de l'ordinateur s'accroche à côté (D-204).
          const box = event.currentTarget.getBoundingClientRect();
          const top =
            minutes === null
              ? box.top
              : box.top + ((minutes - firstHour * 60) / 60) * (box.height / span);
          open({
            date,
            time,
            label: `${dayLabel} · ${time}`,
            rect: { left: box.left, right: box.right, top },
          });
        }}
        className="absolute inset-0 cursor-cell focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent"
      />
      {/* Séance provisoire pendant la saisie dans la bulle de l'ordinateur (comme le Mac, D-204). */}
      {draft && !draft.allDay && draft.date === date && /^\d{2}:\d{2}/.test(draft.time) ? (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-1 z-10 flex flex-col justify-center overflow-hidden rounded-lg bg-dlg-tile px-1.5 text-text shadow-[var(--lib-menu-shadow)]"
          style={{
            top: `calc(${hourHeight} * ${(toMinutes(draft.time) - firstHour * 60) / 60} + 1px)`,
            height: `calc(${hourHeight} * ${Math.max(draft.duration, 30) / 60} - 2px)`,
          }}
        >
          <span className="truncate text-[11px] leading-[1.2] font-semibold">
            {draft.title || "Nouvelle séance"}
          </span>
          <span className="truncate text-[10.5px] leading-[1.2] text-muted tabular">
            {draft.time.slice(0, 5)}
          </span>
        </span>
      ) : null}
      {hover !== null && !dragging && !draft ? (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-[3px] flex items-start gap-1 overflow-hidden rounded-[8px] border border-dashed border-accent/60 bg-accent/5 px-1.5 py-0.5 font-mono text-[11px] text-accent-text tabular"
          style={{
            top: `calc(${hourHeight} * ${(hover - firstHour * 60) / 60})`,
            height: `calc(${hourHeight} - 3px)`,
          }}
        >
          <Plus size={12} strokeWidth={2.2} className="mt-px shrink-0" />
          {toTime(hover)}
        </span>
      ) : null}
    </>
  );
}
