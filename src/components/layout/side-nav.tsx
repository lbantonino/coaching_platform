"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { CountBadge } from "@/components/ui/count-badge";
import { navItemClass } from "@/components/ui/nav-item";

import { navFor, type NavEntry } from "./navigation";
import { useShell } from "./shell-context";

// Listes du menu (D-77) : lignes de 32 px, icône 16, page active en violet léger. `large` : version du
// menu hamburger (44 px, texte 16 px, titres PRINCIPAL / PLUS).

function NavList({ entries, large }: { entries: NavEntry[]; large: boolean }) {
  const pathname = usePathname();
  const { space, unreadMessages = 0, notificationCount = 0 } = useShell();
  // Pastilles rouges du coach : messages non lus sur « Messages » (D-36), et le même total que la
  // cloche sur « Notifications » (D-37).
  const countFor = (href: string) =>
    space !== "coach"
      ? 0
      : href === "/coach/messages"
        ? unreadMessages
        : href === "/coach/notifications"
          ? notificationCount
          : 0;
  const countLabel = (href: string, count: number) =>
    href === "/coach/notifications" ? `, ${count} à voir` : `, ${count} non lus`;
  return (
    <ul className="flex flex-col gap-0.5">
      {entries.map(({ href, label, icon: Icon, match }) => {
        const active = match(pathname);
        return (
          <li key={href}>
            <Link
              href={href}
              aria-current={active ? "page" : undefined}
              // Menu replié : le nom de la page apparaît au survol de son icône.
              title={large ? undefined : label}
              className={`${navItemClass(active, large)} relative`}
            >
              <Icon aria-hidden size={large ? 19 : 16} strokeWidth={1.8} className="shrink-0" />
              <span data-nav-label="" className="flex-1 truncate">
                {label}
                {countFor(href) > 0 ? (
                  <span className="sr-only">{countLabel(href, countFor(href))}</span>
                ) : null}
              </span>
              <CountBadge count={countFor(href)} tone="soft" className="nav-count" />
              {/* Menu replié : la pastille pleine de la cloche, par-dessus le coin de l'icône (02/11). */}
              <CountBadge count={countFor(href)} className="nav-count-dot" />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

const sectionLabel = "px-1 pb-1.5 text-[11px] font-medium tracking-[0.08em] text-muted uppercase";

export function SideNav({ large = false }: { large?: boolean }) {
  const { space, orgBase } = useShell();
  const { main, secondary } = navFor(space, orgBase);
  if (large) {
    return (
      <nav aria-label="Navigation principale" className="flex flex-col gap-4">
        <div className="flex flex-col">
          <p className={sectionLabel}>Principal</p>
          <NavList entries={main} large />
        </div>
        {secondary ? (
          <div className="flex flex-col">
            <p className={sectionLabel}>Plus</p>
            <NavList entries={secondary} large />
          </div>
        ) : null}
      </nav>
    );
  }
  return (
    // Ordinateur (maquette « Sportifs », 03/11) : lignes espacées de 2 px, filet entre les deux groupes
    // (10 px au-dessus et dessous, 4 px en retrait).
    <nav aria-label="Navigation principale" className="flex flex-col gap-0.5">
      <NavList entries={main} large={false} />
      {secondary ? (
        <>
          <div aria-hidden className="mx-1 my-2.5 h-px shrink-0 bg-line" />
          <NavList entries={secondary} large={false} />
        </>
      ) : null}
    </nav>
  );
}
