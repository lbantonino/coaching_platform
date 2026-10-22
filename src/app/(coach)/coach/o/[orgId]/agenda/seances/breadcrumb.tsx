import { ArrowLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

// Fil d'Ariane des pages de séance (même forme que celui de la fiche sportif).
export function AgendaBreadcrumb({ items }: { items: { href: string; label: string }[] }) {
  const [first, ...rest] = items;
  const last = rest.pop();
  return (
    <nav aria-label="Fil d'Ariane" className="flex items-center gap-2 text-small text-muted">
      <Link href={first.href} className="inline-flex items-center gap-2 rounded-sm hover:text-text">
        <ArrowLeft aria-hidden size={15} strokeWidth={1.7} />
        {first.label}
      </Link>
      {rest.map((item) => (
        <span key={item.href} className="inline-flex items-center gap-2">
          <ChevronRight aria-hidden size={14} strokeWidth={1.7} />
          <Link href={item.href} className="truncate hover:text-text">
            {item.label}
          </Link>
        </span>
      ))}
      {last ? (
        <>
          <ChevronRight aria-hidden size={14} strokeWidth={1.7} />
          <span aria-current="page" className="truncate text-text">
            {last.label}
          </span>
        </>
      ) : null}
    </nav>
  );
}
