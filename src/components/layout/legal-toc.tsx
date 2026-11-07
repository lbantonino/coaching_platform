"use client";

import { ChevronDown, List } from "lucide-react";
import { useEffect, useState } from "react";

// Sommaire des pages légales (maquette du 06/11/2026, D-139).
// - Ordinateur : colonne de 270 px, collée en haut pendant la lecture ; la section lue est surlignée
//   (lavande, numéro violet), la première au départ comme dans la maquette.
// - Téléphone : une ligne « Sommaire · N sections » qui s'ouvre en accordéon sous elle
//   (comportement proposé, l'ouverture n'est pas dessinée).

const number = (index: number) => String(index + 1).padStart(2, "0");

function useCurrentSection(count: number) {
  const [current, setCurrent] = useState(0);
  useEffect(() => {
    const sections = Array.from({ length: count }, (_, index) =>
      document.getElementById(`section-${index + 1}`),
    ).filter((node): node is HTMLElement => node !== null);
    if (sections.length === 0) return;
    // La section courante : la dernière dont le haut est passé au-dessus du tiers de l'écran.
    const update = () => {
      const line = window.innerHeight / 3;
      let index = 0;
      sections.forEach((node, i) => {
        if (node.getBoundingClientRect().top <= line) index = i;
      });
      setCurrent(index);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [count]);
  return current;
}

export function LegalTocAside({ titles }: { titles: string[] }) {
  const current = useCurrentSection(titles.length);
  return (
    <nav
      aria-label="Sommaire"
      className="sticky top-6 flex flex-col gap-3 rounded-[20px] bg-surface px-[18px] py-[22px] ring-1 ring-line-soft"
    >
      <span className="px-2.5 text-[11.5px] font-semibold tracking-[0.12em] text-muted uppercase">
        Sommaire
      </span>
      <ol className="flex flex-col gap-0.5">
        {titles.map((title, index) => {
          const on = index === current;
          return (
            <li key={title}>
              <a
                href={`#section-${index + 1}`}
                aria-current={on ? "location" : undefined}
                className={`flex items-center gap-3 rounded-[10px] px-2.5 py-[9px] text-[14px] font-medium text-text transition-colors duration-150 ${
                  on ? "bg-dlg-accent-tile" : "hover:bg-dlg-field"
                }`}
              >
                <span
                  className={`text-[12px] font-semibold tabular-nums ${on ? "text-violet" : "text-muted"}`}
                >
                  {number(index)}
                </span>
                {title}
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export function LegalTocAccordion({ titles }: { titles: string[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-[14px] bg-dlg-field">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="legal-toc-list"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full cursor-pointer items-center gap-3 px-4 py-3.5 text-left"
      >
        <List aria-hidden size={18} strokeWidth={2} className="text-violet" />
        <span className="flex-1 text-[14px] font-bold text-text">Sommaire</span>
        <span className="text-[13px] font-medium text-muted">{titles.length} sections</span>
        <ChevronDown
          aria-hidden
          size={16}
          strokeWidth={2}
          className={`text-muted transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open ? (
        <ol id="legal-toc-list" className="flex flex-col px-2 pb-2">
          {titles.map((title, index) => (
            <li key={title}>
              <a
                href={`#section-${index + 1}`}
                onClick={() => setOpen(false)}
                className="flex min-h-11 items-center gap-3 rounded-[10px] px-2.5 text-[14px] font-medium text-text hover:bg-dlg-accent-tile"
              >
                <span className="text-[12px] font-semibold text-violet tabular-nums">
                  {number(index)}
                </span>
                {title}
              </a>
            </li>
          ))}
        </ol>
      ) : null}
    </div>
  );
}
