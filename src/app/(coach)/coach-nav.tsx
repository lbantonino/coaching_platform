"use client";

import { CalendarDays, House, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

// Navigation coach : seulement les sections qui EXISTENT (pas de faux liens vers des écrans futurs).
// `orgBase` : « /coach/o/<organisation> », absent tant que le coach n'a pas d'organisation.
type Props = { orgBase: string | null };

function useItems({ orgBase }: Props) {
  const pathname = usePathname();
  const items = [
    { href: "/coach", label: "Tableau de bord", icon: House, active: pathname === "/coach" },
  ];
  if (orgBase) {
    items.push(
      {
        href: `${orgBase}/sportifs`,
        label: "Sportifs",
        icon: Users,
        active: pathname.startsWith(`${orgBase}/sportifs`),
      },
      {
        href: `${orgBase}/agenda`,
        label: "Agenda",
        icon: CalendarDays,
        active: pathname.startsWith(`${orgBase}/agenda`),
      },
    );
  }
  return items;
}

// Barre latérale (ordinateur). L'élément actif n'est JAMAIS rouge : fond surface-2, texte clair.
export function CoachSideNav(props: Props) {
  const items = useItems(props);
  return (
    <ul className="flex flex-col gap-1">
      {items.map(({ href, label, icon: Icon, active }) => (
        <li key={href}>
          <Link
            href={href}
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-3 rounded-[9px] px-2.5 py-[9px] text-body transition-colors ${
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

// Barre d'onglets en bas d'écran (téléphone) : seul l'onglet actif est rouge.
export function CoachTabBar(props: Props) {
  const items = useItems(props);
  return (
    <ul className="flex justify-around">
      {items.map(({ href, label, icon: Icon, active }) => (
        <li key={href} className="flex-1">
          <Link
            href={href}
            aria-current={active ? "page" : undefined}
            className={`flex h-16 flex-col items-center justify-center gap-1 text-micro ${
              active ? "text-accent-text" : "text-muted"
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
