"use client";

import { useEffect, useId, useRef, useState } from "react";

// Nom de la séance renommable d'un clic, comme un dossier sur Mac ou Windows (demande d'Antonino du
// 24/11/2026) : le titre devient un champ de même taille ; Entrée ou un clic ailleurs enregistre, Échap
// annule, un nom vide rend l'ancien. 80 caractères au plus, comme la fenêtre « Renommer ». Le titre reste
// un vrai titre (h2) dont le nom accessible est celui de la séance ; l'aide est une description à part.
export const SESSION_TITLE_MAX = 80;

export function InlineTitle({
  title,
  onRename,
  className,
}: {
  title: string;
  onRename: (title: string) => void;
  className: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(title);
  const button = useRef<HTMLButtonElement>(null);
  const input = useRef<HTMLInputElement>(null);
  // Une seule fin par ouverture : Entrée ou Échap ferment le champ, et la perte du focus qui suit
  // (le champ disparaît) ne doit ni enregistrer une seconde fois ni défaire une annulation.
  const active = useRef(false);
  const hint = useId();

  useEffect(() => {
    if (!editing) return;
    input.current?.focus();
    input.current?.select();
  }, [editing]);

  // `refocus` : après Entrée ou Échap, le focus revient sur le titre (clavier, lecteur d'écran) ; après
  // un clic ailleurs, il reste là où le coach a cliqué.
  const finish = (save: boolean, refocus: boolean) => {
    if (!active.current) return;
    active.current = false;
    const next = draft.trim().slice(0, SESSION_TITLE_MAX);
    if (save && next && next !== title) onRename(next);
    setEditing(false);
    if (refocus) requestAnimationFrame(() => button.current?.focus());
  };

  return (
    <>
      <h2 className={className}>
        {editing ? (
          <input
            ref={input}
            aria-label="Nom de la séance"
            value={draft}
            maxLength={SESSION_TITLE_MAX}
            onChange={(event) => setDraft(event.target.value)}
            onBlur={() => finish(true, false)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                finish(true, true);
              } else if (event.key === "Escape") {
                // Échap n'enregistre rien et ne ferme rien d'autre (fenêtre, panneau).
                event.preventDefault();
                event.stopPropagation();
                finish(false, true);
              }
            }}
            className="-mx-1.5 w-[calc(100%+12px)] min-w-0 rounded-[9px] bg-surface-2 px-1.5 font-[inherit] tracking-[inherit] text-text outline-none inset-ring-[1.5px] inset-ring-violet/60"
          />
        ) : (
          <button
            ref={button}
            type="button"
            aria-describedby={hint}
            onClick={() => {
              active.current = true;
              setDraft(title);
              setEditing(true);
            }}
            className="-mx-1.5 max-w-[calc(100%+12px)] cursor-text rounded-[9px] px-1.5 text-left transition-colors duration-150 hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet"
          >
            {title}
          </button>
        )}
      </h2>
      <span id={hint} hidden>
        Cliquer pour renommer la séance
      </span>
    </>
  );
}
