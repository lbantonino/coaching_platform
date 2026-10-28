"use client";

import { Bell, Search, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

import { iconButtonClass } from "@/components/ui/button";
import { CountBadge } from "@/components/ui/count-badge";

import { notificationsHref } from "./navigation";
import { useShell } from "./shell-context";

// Outils à droite de l'en-tête de page sur ordinateur (prompt Claude Design §5.2) : recherche
// « Rechercher dans Coory… ⌘K » de 260 px, Assistant IA (coach), cloche des notifications.
// Coach : la recherche ouvre la page Recherche globale (D-62) avec la saisie.
// Sportif et admin : la recherche ouvre la page Recherche de l'espace. ⌘K / Ctrl K y mène aussi.
export function HeaderTools() {
  const { space, orgBase } = useShell();
  return (
    <div className="hidden items-center gap-2 lg:flex">
      {space === "coach" && orgBase ? (
        <CoachSearch />
      ) : (
        <SearchLink href={space === "athlete" ? "/app/recherche" : "/admin/recherche"} />
      )}
      {space === "coach" ? (
        <Link href="/coach/assistant" aria-label="Assistant IA" className={iconButtonClass()}>
          <Sparkles aria-hidden size={18} strokeWidth={1.8} />
        </Link>
      ) : null}
      <NotificationBell />
    </div>
  );
}

// Cloche des notifications, avec la pastille rouge de tout ce qui attend (D-37).
export function NotificationBell() {
  const { space, notificationCount = 0 } = useShell();
  return (
    <Link
      href={notificationsHref[space]}
      aria-label={
        notificationCount > 0 ? `Notifications, ${notificationCount} à voir` : "Notifications"
      }
      className={iconButtonClass()}
    >
      <Bell aria-hidden size={18} strokeWidth={1.8} />
      <CountBadge count={notificationCount} className="absolute -top-1.5 -right-1.5" />
    </Link>
  );
}

const searchBox =
  "flex h-11 w-[260px] items-center gap-2.5 rounded-control border border-line bg-surface px-3 text-[14px] text-muted";

function Kbd() {
  return (
    <kbd
      aria-hidden
      className="pointer-events-none rounded-kbd border border-line-2 px-[5px] py-px font-mono text-[11px] text-muted"
    >
      ⌘K
    </kbd>
  );
}

function useCommandK(onTrigger: () => void) {
  const handler = useRef(onTrigger);
  useEffect(() => {
    handler.current = onTrigger;
  });
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        handler.current();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
}

// Formulaire GET vers la page Recherche (D-62) : le résultat est une vraie page, partageable, qui
// marche aussi sans JavaScript. Sur la page Recherche elle-même, ⌘K revient à son grand champ.
function CoachSearch() {
  const input = useRef<HTMLInputElement>(null);
  useCommandK(() => {
    if (window.location.pathname !== "/coach/recherche") input.current?.focus();
  });
  return (
    <form
      role="search"
      action="/coach/recherche"
      className={`${searchBox} focus-within:border-accent`}
    >
      <label htmlFor="coach-search" className="sr-only">
        Rechercher dans Coory
      </label>
      <Search aria-hidden size={16} strokeWidth={1.8} className="shrink-0" />
      <input
        ref={input}
        id="coach-search"
        name="q"
        type="search"
        autoComplete="off"
        placeholder="Rechercher dans Coory…"
        className="h-full min-w-0 flex-1 bg-transparent text-text outline-none placeholder:text-muted"
      />
      <Kbd />
    </form>
  );
}

function SearchLink({ href }: { href: string }) {
  const router = useRouter();
  useCommandK(() => router.push(href));
  return (
    <Link href={href} className={`${searchBox} transition-colors duration-150 hover:bg-surface-2`}>
      <Search aria-hidden size={16} strokeWidth={1.8} className="shrink-0" />
      <span className="flex-1 whitespace-nowrap">Rechercher dans Coory…</span>
      <Kbd />
    </Link>
  );
}
