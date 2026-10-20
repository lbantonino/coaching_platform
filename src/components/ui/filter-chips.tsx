import Link from "next/link";

// Pastilles de filtre (design system : chips « Tous · Jambes · Pecs »). Ce sont de vrais liens :
// le filtre est dans l'URL, donc partageable, et fonctionne même sans JavaScript.
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
          className={`inline-flex h-9 shrink-0 items-center rounded-full border px-4 text-small transition-colors ${
            option.active
              ? "border-text bg-text text-page"
              : "border-line-2 text-muted hover:text-text"
          }`}
        >
          {option.label}
        </Link>
      ))}
    </nav>
  );
}
