"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Avatar } from "@/components/ui/avatar";
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

// Carte de la personne connectée : photo, nom, chevron vers ses paramètres.
export function UserCard() {
  const { user } = useShell();
  if (!user) return null;
  // Même hauteur que la roue dentée à côté (44 px, demande d'Antonino du 24/10) : photo et nom seuls ;
  // le rôle et l'organisation sont dans Paramètres > Compte (et en infobulle).
  const body = (
    <>
      <Avatar name={user.name} photoPath={user.photoPath} sex={user.sex} size="sm" />
      <span className="min-w-0 flex-1 truncate text-[14px] font-semibold">{user.name}</span>
      {user.settingsHref ? (
        <ChevronRight aria-hidden size={16} strokeWidth={1.8} className="shrink-0 text-muted" />
      ) : null}
    </>
  );
  const box =
    "flex h-11 items-center gap-2.5 rounded-control border border-line bg-surface pr-2.5 pl-1 text-text";
  return user.settingsHref ? (
    <Link
      href={user.settingsHref}
      title={user.role}
      className={`${box} transition-colors duration-150 hover:bg-surface-2`}
    >
      {body}
    </Link>
  ) : (
    <div title={user.role} className={box}>
      {body}
    </div>
  );
}
