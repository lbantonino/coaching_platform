import { ChevronRight } from "lucide-react";

// Accordéon de la fiche sportif (maquette « Sportifs » du 03/11/2026) : <details> de 46 px (même sur
// deux lignes), rayon 12,
// filet fin, chevron qui pivote à l'ouverture. Module neutre (ni serveur ni client) : utilisable
// partout, y compris par les composants serveur.
export const accordionClass = "group rounded-xl inset-ring inset-ring-line";

export const accordionSummaryClass =
  "flex min-h-[46px] cursor-pointer list-none items-center gap-2.5 rounded-xl px-3.5 py-[5px] text-[13.5px] leading-[1.3] font-medium text-text-2 transition-colors duration-150 hover:text-text [&::-webkit-details-marker]:hidden";

export function AccordionChevron() {
  return (
    <ChevronRight
      aria-hidden
      size={15}
      strokeWidth={2}
      className="shrink-0 text-muted transition-transform duration-200 group-open:rotate-90"
    />
  );
}
