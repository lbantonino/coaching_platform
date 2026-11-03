"use client";

import { Search } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

// Recherche de la liste des sportifs (maquette du 03/11/2026) : la liste se filtre pendant la frappe.
// La recherche reste dans l'adresse (?q=, lien partageable) : elle y est écrite 250 ms après la
// dernière lettre. Sans JavaScript, Entrée envoie le formulaire, comme avant.
// Téléphone : champ de 48 px, texte 16 px (pas de zoom d'iOS) ; ordinateur : 320 × 52, dans la carte.
export function AthleteSearch({ action, initial }: { action: string; initial: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [value, setValue] = useState(initial);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const push = (text: string) => {
    const next = new URLSearchParams(params.toString());
    if (text.trim()) next.set("q", text.trim());
    else next.delete("q");
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  return (
    <form
      role="search"
      action={action}
      onSubmit={(event) => {
        event.preventDefault();
        clearTimeout(timer.current);
        push(value);
      }}
      className="flex h-12 items-center gap-2.5 rounded-[14px] bg-surface px-3.5 text-muted inset-ring inset-ring-line-soft focus-within:inset-ring-violet/55 lg:h-[52px] lg:w-[320px] lg:shrink-0 lg:gap-2 lg:rounded-[11px] lg:px-3 lg:inset-ring-line-2"
    >
      <Search aria-hidden strokeWidth={2} className="size-[17px] shrink-0 lg:size-[15px]" />
      <label htmlFor="athlete-search" className="sr-only">
        Rechercher un sportif
      </label>
      <input
        id="athlete-search"
        name="q"
        type="search"
        autoComplete="off"
        value={value}
        onChange={(event) => {
          const text = event.target.value;
          setValue(text);
          clearTimeout(timer.current);
          timer.current = setTimeout(() => push(text), 250);
        }}
        placeholder="Rechercher un sportif"
        className="h-full min-w-0 flex-1 bg-transparent text-[16px] text-text outline-none placeholder:text-faint lg:text-[14px]"
      />
      {/* Filtres déjà choisis : gardés quand on valide par Entrée sans JavaScript. */}
      {[...params.entries()]
        .filter(([key]) => key !== "q")
        .map(([key, val]) => (
          <input key={key} type="hidden" name={key} value={val} />
        ))}
    </form>
  );
}
