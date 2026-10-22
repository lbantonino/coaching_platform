"use client";

import { Search } from "lucide-react";
import { useEffect, useRef } from "react";

// Recherche de sportif dans la barre du haut (ordinateur). Formulaire GET vers la liste, tous statuts
// confondus : le résultat est une vraie page, partageable, qui marche aussi sans JavaScript.
// ⌘K (Mac) ou Ctrl+K (Windows) place le curseur dans le champ.
export function CoachSearch({ athletesHref }: { athletesHref: string }) {
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        input.current?.focus();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <form role="search" action={athletesHref} className="relative w-72">
      <label htmlFor="coach-search" className="sr-only">
        Trouver un sportif
      </label>
      <Search
        aria-hidden
        size={15}
        strokeWidth={1.7}
        className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted"
      />
      <input
        ref={input}
        id="coach-search"
        name="q"
        type="search"
        autoComplete="off"
        placeholder="Rechercher un sportif…"
        className="h-[38px] w-full rounded-md border border-line bg-surface pr-12 pl-9 text-small text-text outline-none placeholder:text-faint focus:border-accent"
      />
      <input type="hidden" name="statut" value="tous" />
      <kbd
        aria-hidden
        className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 rounded-kbd border border-line-2 px-1.5 font-mono text-micro text-faint"
      >
        ⌘K
      </kbd>
    </form>
  );
}
