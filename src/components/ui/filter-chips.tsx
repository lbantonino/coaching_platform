import Link from "next/link";

// Pastilles de filtre (design system §6 Chip). Ce sont de vrais liens :
// le filtre est dans l'URL, donc partageable, et fonctionne même sans JavaScript.
// Sélectionnée = couleurs inversées (jamais rouge). Plus hautes sur téléphone pour le doigt.
export function FilterChips({
  label,
  options,
}: {
  label: string;
  options: { href: string; label: string; active: boolean }[];
}) {
  return (
    <nav aria-label={label} className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
      {options.map((option) => (
        <Link
          key={option.href}
          href={option.href}
          aria-current={option.active ? "true" : undefined}
          className={`inline-flex h-9 shrink-0 items-center rounded-pill border px-3 text-caption transition-colors sm:h-7 sm:px-2.5 ${
            option.active
              ? "border-inv bg-inv text-on-inv"
              : "border-line text-muted hover:bg-surface hover:text-text"
          }`}
        >
          {option.label}
        </Link>
      ))}
    </nav>
  );
}
