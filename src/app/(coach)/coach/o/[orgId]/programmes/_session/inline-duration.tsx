"use client";

import { useEffect, useRef, useState } from "react";

// Durée de la séance changée sur place, dans la « Séance choisie » du programme (24/11/2026) : mêmes
// règles que le champ « Durée » de l'éditeur de séance (5 à 600 min ; écrite à la main, elle ne suit
// plus le contenu ; « Calculer » revient à l'estimation). Entrée ou un clic ailleurs enregistre, Échap
// annule, une valeur hors limites est refusée (l'ancienne revient).
export function InlineDuration({
  minutes,
  display,
  manual,
  onChange,
  onRecompute,
}: {
  minutes: number;
  // Le texte affiché au repos (« ≈ 30 min »), celui du détail.
  display: string;
  manual: boolean;
  onChange: (minutes: number) => void;
  onRecompute: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(String(minutes));
  const input = useRef<HTMLInputElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const active = useRef(false);

  useEffect(() => {
    if (!editing) return;
    input.current?.focus();
    input.current?.select();
  }, [editing]);

  const finish = (save: boolean, refocus: boolean) => {
    if (!active.current) return;
    active.current = false;
    const value = Number(text);
    if (save && text !== "" && value >= 5 && value <= 600 && value !== minutes) onChange(value);
    setEditing(false);
    if (refocus) requestAnimationFrame(() => button.current?.focus());
  };

  if (editing) {
    return (
      <span className="flex items-center gap-1.5">
        <input
          ref={input}
          inputMode="numeric"
          aria-label="Durée de la séance (min)"
          value={text}
          onChange={(event) => setText(event.target.value.replace(/\D/g, "").slice(0, 3))}
          onBlur={() => finish(true, false)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              finish(true, true);
            } else if (event.key === "Escape") {
              event.preventDefault();
              event.stopPropagation();
              finish(false, true);
            }
          }}
          className="h-7 w-14 min-w-0 rounded-[8px] bg-surface px-1.5 text-[15px] font-semibold text-text outline-none inset-ring-[1.5px] inset-ring-violet/60"
        />
        <span className="text-[13px] font-medium text-muted">min</span>
      </span>
    );
  }
  return (
    <span className="flex flex-wrap items-baseline gap-x-2">
      <button
        ref={button}
        type="button"
        aria-label={`Durée : ${display}. Changer la durée`}
        onClick={() => {
          active.current = true;
          setText(String(minutes));
          setEditing(true);
        }}
        className="-mx-1 cursor-text rounded-[7px] px-1 text-left transition-colors duration-150 hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-violet"
      >
        {display}
      </button>
      {manual ? (
        <button
          type="button"
          onClick={onRecompute}
          className="text-[12px] font-semibold text-violet-text hover:underline"
        >
          Calculer
        </button>
      ) : null}
    </span>
  );
}
