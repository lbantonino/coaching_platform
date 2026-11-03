"use client";

import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

// Liste qui remplit la hauteur de sa carte sur ordinateur (demande d'Antonino du 03/11, page d'une
// séance) : elle montre autant de lignes ENTIÈRES que la place en contient, selon l'écran (plus sur
// un écran 24 pouces que sur un MacBook 13 pouces), et cache les suivantes (aussi pour les lecteurs
// d'écran). La dernière ligne montrée reçoit data-fit-last (pas de filet dessous, fin du rail) ; s'il
// reste des lignes cachées, la liste porte data-fit-overflow (le lien « Toutes les dates » de la carte
// s'affiche alors). `moreLabel` : un bouton qui montre tout, puis « Voir moins ». Les lignes sont les <li>
// de la première liste <ul> du contenu.
// `minHeight` : hauteur minimale sur ordinateur (ex. deux lignes toujours visibles) ; `moreClassName` :
// place du bouton « tout montrer » (ex. dans l'en-tête de la carte).
// Téléphone : la liste garde sa hauteur naturelle ; `phoneLimit` y montre seulement les premières.
// Base de flex en px (« 1 1 0px ») : une base en % redevient la taille du contenu quand la hauteur du
// parent n'est pas fixée, et la liste ferait grandir sa carte au lieu de s'y couper.
export function FitList({
  children,
  phoneLimit,
  moreLabel,
  moreClassName = "",
  minHeight = 0,
}: {
  children: ReactNode;
  phoneLimit?: number;
  moreLabel?: string;
  moreClassName?: string;
  minHeight?: number;
}) {
  const box = useRef<HTMLDivElement>(null);
  const [all, setAll] = useState(false);
  useLayoutEffect(() => {
    const element = box.current;
    if (!element) return;
    const desktop = window.matchMedia("(min-width: 1024px)");
    const fit = () => {
      const items = [...element.querySelectorAll<HTMLElement>(":scope > ul > li")];
      items.forEach((item, index) => {
        item.removeAttribute("data-fit-hidden");
        item.removeAttribute("data-fit-last");
        item.toggleAttribute("data-fit-extra", phoneLimit !== undefined && index >= phoneLimit);
      });
      element.removeAttribute("data-fit-overflow");
      if (!desktop.matches || all) return;
      // Mesure avec tous les filets en place, puis on cache ce qui dépasse.
      const limit = element.getBoundingClientRect().top + element.clientHeight + 0.5;
      const shown = items.findIndex((item) => item.getBoundingClientRect().bottom > limit);
      if (shown === -1) {
        items.at(-1)?.setAttribute("data-fit-last", "");
        return;
      }
      items.slice(shown).forEach((item) => item.setAttribute("data-fit-hidden", ""));
      items[shown - 1]?.setAttribute("data-fit-last", "");
      element.setAttribute("data-fit-overflow", "");
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(element);
    desktop.addEventListener("change", fit);
    return () => {
      observer.disconnect();
      desktop.removeEventListener("change", fit);
    };
  }, [phoneLimit, all, children]);

  return (
    <>
      <div
        ref={box}
        style={{ "--fit-min": `${minHeight}px` } as CSSProperties}
        className={`min-w-0 [&_[data-fit-hidden]]:invisible max-lg:[&_[data-fit-extra]]:hidden ${
          all ? "" : "lg:min-h-(--fit-min) lg:flex-[1_1_0px] lg:overflow-hidden"
        }`}
      >
        {children}
      </div>
      {moreLabel ? (
        // « Toutes les… » quand des lignes sont cachées ; une fois tout montré, « Voir moins »
        // ramène la liste à la hauteur de sa carte (demande d'Antonino du 03/11).
        <button
          type="button"
          aria-expanded={all}
          onClick={() => setAll((value) => !value)}
          className={`hidden min-h-8 w-fit items-center gap-1 text-[13px] text-violet-text hover:underline ${
            all ? "lg:flex" : "lg:[[data-fit-overflow]+&]:flex"
          } ${moreClassName}`}
        >
          {all ? "Voir moins" : moreLabel}
        </button>
      ) : null}
    </>
  );
}
