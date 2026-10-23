import Link from "next/link";

import { chipActiveClass, chipClass, chipIdleClass } from "./chip";

// Pastilles de filtre (prompt Claude Design §4 « Chip / filtre »). Sur téléphone, une rangée qui
// défile sans retour à la ligne ; sur ordinateur, retour à la ligne.
// Ce sont de vrais liens : le filtre est dans l'URL, donc partageable, et fonctionne sans JavaScript.

export function FilterChips({
  label,
  options,
}: {
  label: string;
  options: { href: string; label: string; active: boolean }[];
}) {
  return (
    <nav
      aria-label={label}
      className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] md:mx-0 md:flex-wrap md:overflow-visible md:px-0"
    >
      {options.map((option) => (
        <Link
          key={option.href}
          href={option.href}
          aria-current={option.active ? "true" : undefined}
          className={`${chipClass} ${option.active ? chipActiveClass : chipIdleClass}`}
        >
          {option.label}
        </Link>
      ))}
    </nav>
  );
}
