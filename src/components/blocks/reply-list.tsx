import { Reply } from "lucide-react";
import Link from "next/link";

// Messages non lus de la carte Messages du tableau de bord (demande d'Antonino, 23/10) : une ligne par
// sportif, avec à gauche un bouton « Répondre » qui ouvre directement SA conversation. Pas de rond à
// cocher : un message passe en lu quand on ouvre la conversation. Couleur : celle de la carte (--kpi).
export type ReplyItem = {
  href: string;
  name: string;
  preview: string;
  time: string;
  unread: number;
};

export function ReplyList({ items, empty }: { items: ReplyItem[]; empty: string }) {
  if (items.length === 0) {
    return <p className="min-w-0 flex-1 self-center text-[13px] text-muted">{empty}</p>;
  }
  return (
    <ul className="flex min-w-0 flex-1 flex-col">
      {items.map((item) => (
        <li key={item.href}>
          <Link
            href={item.href}
            className="group -ml-1.5 flex min-h-11 min-w-0 items-center gap-2.5 rounded-[12px] py-0.5 pl-1.5 transition-colors duration-150 hover:bg-[color-mix(in_srgb,var(--kpi)_10%,transparent)]"
          >
            <span
              aria-hidden
              className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--kpi)_18%,transparent)] text-[var(--kpi)] transition-colors duration-150 group-hover:bg-[var(--kpi)] group-hover:text-surface"
            >
              <Reply size={15} strokeWidth={2} />
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="flex min-w-0 items-baseline gap-2">
                <span className="min-w-0 flex-1 truncate text-[14px] leading-snug font-medium">
                  <span className="sr-only">Répondre à </span>
                  {item.name}
                  {item.unread > 1 ? <span className="text-muted"> · {item.unread}</span> : null}
                </span>
                <span className="shrink-0 font-mono text-[11px] text-muted tabular">
                  {item.time}
                </span>
              </span>
              <span className="truncate text-[12px] leading-snug text-muted">{item.preview}</span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
