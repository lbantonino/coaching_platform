import Link from "next/link";

import { chipActiveClass, chipClass, chipIdleClass } from "./chip";

// Pastilles de filtre (prompt Claude Design §4 « Chip / filtre »). Sur téléphone, une rangée qui
// défile sans retour à la ligne ; sur ordinateur, retour à la ligne.
// Ce sont de vrais liens : le filtre est dans l'URL, donc partageable, et fonctionne sans JavaScript.

// `size="sm"` (agenda en cases, D-77) : pastilles basses, la choisie en gris (pas en violet).
const smallChip =
  "inline-flex h-9 shrink-0 items-center rounded-full border px-3 text-[12px] whitespace-nowrap transition-colors duration-150 lg:h-7 lg:px-2.5";

export function FilterChips({
  label,
  options,
  size = "md",
}: {
  label: string;
  options: { href: string; label: string; active: boolean }[];
  size?: "md" | "sm";
}) {
  return (
    <nav
      aria-label={label}
      className={`flex overflow-x-auto [scrollbar-width:none] md:flex-wrap md:overflow-visible ${
        size === "sm" ? "gap-1" : "-mx-4 gap-2 px-4 pb-1 md:mx-0 md:px-0"
      }`}
    >
      {options.map((option) => (
        <Link
          key={option.href}
          href={option.href}
          aria-current={option.active ? "true" : undefined}
          className={
            size === "sm"
              ? `${smallChip} ${option.active ? "border-transparent bg-chip font-medium text-text" : "border-line text-muted hover:text-text"}`
              : `${chipClass} ${option.active ? chipActiveClass : chipIdleClass}`
          }
        >
          {option.label}
        </Link>
      ))}
    </nav>
  );
}
