"use client";

import { House, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

// Navigation coach : seulement les sections qui EXISTENT (pas de faux liens vers des écrans futurs).
type Props = { athletesHref: string | null };

function useItems({ athletesHref }: Props) {
  const pathname = usePathname();
  const items = [
    { href: "/coach", label: "Tableau de bord", icon: House, active: pathname === "/coach" },
  ];
  if (athletesHref) {
    items.push({
      href: athletesHref,
      label: "Sportifs",
      icon: Users,
      active: pathname.startsWith("/coach/o/"),
    });
  }
  return items;
}

// Barre latérale (ordinateur).
export function CoachSideNav(props: Props) {
  const items = useItems(props);
  return (
    <ul className="flex flex-col gap-1">
      {items.map(({ href, label, icon: Icon, active }) => (
        <li key={href}>
          <Link
            href={href}
            aria-current={active ? "page" : undefined}
            className={`flex h-10 items-center gap-3 rounded-[10px] px-3 text-body transition-colors ${
              active ? "bg-surface-2 text-text" : "text-muted hover:bg-surface hover:text-text"
            }`}
          >
            <Icon aria-hidden size={17} strokeWidth={1.7} />
            {label}
          </Link>
        </li>
      ))}
    </ul>
  );
}

// Barre d'onglets en bas d'écran (téléphone).
export function CoachTabBar(props: Props) {
  const items = useItems(props);
  return (
    <ul className="flex justify-around">
      {items.map(({ href, label, icon: Icon, active }) => (
        <li key={href} className="flex-1">
          <Link
            href={href}
            aria-current={active ? "page" : undefined}
            className={`flex h-16 flex-col items-center justify-center gap-1 text-caption ${
              active ? "text-accent" : "text-muted"
            }`}
          >
            <Icon aria-hidden size={21} strokeWidth={1.7} />
            {label}
          </Link>
        </li>
      ))}
    </ul>
  );
}
