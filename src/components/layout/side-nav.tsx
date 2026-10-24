"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { CountBadge } from "@/components/ui/count-badge";
import { navItemClass } from "@/components/ui/nav-item";

import { navFor, type NavEntry } from "./navigation";
import { useShell } from "./shell-context";

// Listes du menu (prompt Claude Design §5.2) : lignes de 44 px, icône 19, élément actif sur fond
// rouge doux. `large` : version du menu hamburger (texte 16 px, titres PRINCIPAL / PLUS).

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
              className={`${navItemClass(active)} ${large ? "text-[16px]" : ""}`}
            >
              <Icon aria-hidden size={19} strokeWidth={1.7} className="shrink-0" />
              <span className="flex-1 truncate">
                {label}
                {countFor(href) > 0 ? (
                  <span className="sr-only">{countLabel(href, countFor(href))}</span>
                ) : null}
              </span>
              <CountBadge count={countFor(href)} />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

const sectionLabel =
  "px-1 pb-1.5 font-mono text-[11px] font-medium tracking-[0.08em] text-muted uppercase";

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
    <nav aria-label="Navigation principale" className="flex flex-col gap-3">
      <NavList entries={main} large={false} />
      {secondary ? (
        <div className="border-t border-line pt-3">
          <NavList entries={secondary} large={false} />
        </div>
      ) : null}
    </nav>
  );
}
