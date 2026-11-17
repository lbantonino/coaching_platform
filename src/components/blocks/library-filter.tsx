"use client";

import { ChevronDown, type LucideIcon } from "lucide-react";
import { Fragment, useId, useRef, useState, type KeyboardEvent } from "react";

import { Overlay, type MenuAnchor } from "@/components/ui/overlay";

import { TickIcon } from "./library-icons";

// Filtre de la Bibliothèque (maquette du 06/11/2026, D-142) : un bouton de 40 px qui ouvre la liste
// des choix, sous le bouton sur ordinateur (menu 1a, 256 px), en feuille flottante sur téléphone
// (feuille 1c, titre + « Réinitialiser »). Un seul choix à la fois : un appui l'applique et ferme.
// Le même composant sert à Catégorie, Muscles et Matériel (PROPOSED validé le 06/11).
export type FilterOption = {
  value: string;
  label: string;
  count?: number;
  icon?: LucideIcon;
  // Pastille de couleur sur l'icône (rubriques : couleurs des disciplines).
  dot?: string;
  // Filet avant ce choix (Favoris et Mes exercices, après les rubriques).
  separatorBefore?: boolean;
};

const MENU_WIDTH = 256;

export function LibraryFilter({
  title,
  options,
  value,
  onChange,
  onReset,
  label,
  shortLabel,
  count,
  dark = false,
  className = "",
}: {
  // Nom du filtre : titre de la feuille et nom de la liste pour les lecteurs d'écran.
  title: string;
  options: FilterOption[];
  value: string;
  onChange: (value: string) => void;
  onReset: () => void;
  // Texte du bouton : `label` sur ordinateur, `shortLabel` sur téléphone (« Tous les muscles » /
  // « Muscles »).
  label: string;
  shortLabel: string;
  // Compteur à droite du libellé (ordinateur, bouton Catégorie).
  count?: number;
  // Bouton noir (Catégorie, ou filtre en cours) ; sinon blanc à contour fin.
  dark?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [anchor, setAnchor] = useState<MenuAnchor | null>(null);
  const button = useRef<HTMLButtonElement>(null);
  const titleId = useId();

  const show = () => {
    const rect = button.current?.getBoundingClientRect();
    if (rect) {
      // Maquette 1a : le menu dépasse le bouton de 20 px à droite et se pose 8 px dessous ; il reste
      // à 14 px des bords de l'écran.
      const x = Math.min(
        Math.max(14, rect.right + 20 - MENU_WIDTH),
        window.innerWidth - 14 - MENU_WIDTH,
      );
      setAnchor({ x, y: rect.bottom + 8, side: "top", width: MENU_WIDTH });
    }
    setOpen(true);
  };
  const choose = (next: string) => {
    onChange(next);
    setOpen(false);
  };
  const active = dark || open;

  // Flèches ↑ / ↓ (Début / Fin) d'un choix à l'autre ; Entrée ou Espace choisit.
  const move = (event: KeyboardEvent<HTMLUListElement>) => {
    const keys = ["ArrowDown", "ArrowUp", "Home", "End"];
    if (!keys.includes(event.key)) return;
    const rows = [...event.currentTarget.querySelectorAll<HTMLButtonElement>("[role=option]")];
    if (rows.length === 0) return;
    event.preventDefault();
    const index = rows.indexOf(document.activeElement as HTMLButtonElement);
    const next =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? rows.length - 1
          : event.key === "ArrowDown"
            ? (index + 1) % rows.length
            : (index - 1 + rows.length) % rows.length;
    rows[next].focus();
  };

  return (
    <>
      <button
        ref={button}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={show}
        className={`flex h-10 min-w-0 items-center gap-2 rounded-[11px] pr-3 pl-3.5 text-left text-[13.5px] leading-none font-medium whitespace-nowrap transition-[background-color,scale] duration-150 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet active:scale-[0.98] ${
          active
            ? "bg-cta text-on-cta"
            : "bg-surface text-text inset-ring inset-ring-lib-field-ring hover:bg-surface-2"
        } ${className}`}
      >
        <span className="min-w-0 flex-1 truncate">
          <span className="lg:hidden">{shortLabel}</span>
          <span className="max-lg:hidden">{label}</span>
        </span>
        {count !== undefined ? (
          <span
            className={`text-[12px] font-medium max-lg:hidden ${active ? "text-dlg-disabled" : "text-dlg-faint"}`}
          >
            {count}
          </span>
        ) : null}
        <ChevronDown
          aria-hidden
          size={15}
          strokeWidth={2}
          // Ouvert, le chevron garde son sens (capture 1a de la maquette).
          className={`shrink-0 ${active ? "" : "text-muted"}`}
        />
      </button>

      <Overlay
        open={open}
        onClose={() => setOpen(false)}
        labelledBy={titleId}
        size="picker"
        anchor={anchor}
      >
        {/* Téléphone : 2 px entre la poignée, le titre et la liste (maquette 1c). */}
        <div className="flex min-h-0 flex-auto flex-col gap-0.5 px-2.5 pt-0.5 pb-[18px] md:gap-0 md:p-1.5">
          {/* Téléphone : titre et « Réinitialiser » (on attrape aussi l'en-tête pour glisser). Caché sur
              ordinateur, le titre nomme encore la liste (aria-labelledby lit un élément caché). */}
          <div
            data-sheet-grab
            className="flex shrink-0 items-center justify-between px-2 pb-2.5 md:hidden"
          >
            <h2 id={titleId} className="text-[18px] leading-[normal] font-bold text-text">
              {title}
            </h2>
            <button
              type="button"
              onClick={() => {
                onReset();
                setOpen(false);
              }}
              className="-my-2 rounded-[8px] px-1 py-2 text-[13.5px] leading-none font-semibold text-violet-text"
            >
              Réinitialiser
            </button>
          </div>
          <ul
            role="listbox"
            aria-labelledby={titleId}
            onKeyDown={move}
            className="flex min-h-0 flex-col gap-0.5 overflow-y-auto overscroll-contain md:gap-px"
          >
            {options.map((option) => {
              const selected = option.value === value;
              const Icon = option.icon;
              return (
                <Fragment key={option.value}>
                  {option.separatorBefore ? (
                    <li role="separator" className="mx-2 my-1 h-px shrink-0 bg-line-soft" />
                  ) : null}
                  <li className="flex">
                    <button
                      type="button"
                      role="option"
                      aria-selected={selected}
                      autoFocus={selected}
                      onClick={() => choose(option.value)}
                      className={`flex h-12 w-full min-w-0 items-center gap-2.5 rounded-[10px] px-2.5 text-left transition-[background-color] duration-150 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-violet md:h-[38px] ${
                        selected ? "bg-lib-lavender" : "hover:bg-surface-2"
                      }`}
                    >
                      {Icon ? (
                        <span
                          className={`relative grid size-7 shrink-0 place-items-center rounded-[8px] ${
                            selected ? "bg-dlg" : "bg-lib-chip"
                          }`}
                        >
                          <Icon
                            aria-hidden
                            size={15}
                            strokeWidth={1.8}
                            className={selected ? "text-violet-text" : "text-dlg-ink-2"}
                          />
                          {option.dot ? (
                            <span
                              aria-hidden
                              className={`absolute bottom-[3px] left-1/2 h-[2px] w-3 -translate-x-1/2 rounded-[1px] ${option.dot}`}
                            />
                          ) : null}
                        </span>
                      ) : null}
                      <span
                        className={`min-w-0 flex-1 truncate text-[15px] leading-[normal] text-text md:text-[13.5px] ${
                          selected ? "font-semibold" : "font-medium"
                        }`}
                      >
                        {option.label}
                      </span>
                      {option.count !== undefined ? (
                        <span className="text-[12px] leading-none font-medium text-dlg-faint">
                          {option.count}
                        </span>
                      ) : null}
                      {selected ? (
                        <TickIcon
                          aria-hidden
                          size={15}
                          strokeWidth={2.4}
                          className="shrink-0 text-violet"
                        />
                      ) : null}
                    </button>
                  </li>
                </Fragment>
              );
            })}
          </ul>
        </div>
      </Overlay>
    </>
  );
}
