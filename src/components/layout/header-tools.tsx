"use client";

import { Bell, Search, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

import { iconButtonClass } from "@/components/ui/button";

import { notificationsHref } from "./navigation";
import { useShell } from "./shell-context";

// Outils à droite de l'en-tête de page sur ordinateur (prompt Claude Design §5.2) : recherche
// « Rechercher dans Coory… ⌘K » de 260 px, Assistant IA (coach), cloche des notifications.
// Coach : la recherche trouve les sportifs (vraie liste filtrée) en attendant la recherche globale.
// Sportif et admin : la recherche ouvre la page Recherche de l'espace. ⌘K / Ctrl K y mène aussi.
export function HeaderTools() {
  const { space, orgBase } = useShell();
  return (
    <div className="hidden items-center gap-2 lg:flex">
      {space === "coach" && orgBase ? (
        <CoachSearch athletesHref={`${orgBase}/sportifs`} />
      ) : (
        <SearchLink href={space === "athlete" ? "/app/recherche" : "/admin/recherche"} />
      )}
      {space === "coach" ? (
        <Link href="/coach/assistant" aria-label="Assistant IA" className={iconButtonClass()}>
          <Sparkles aria-hidden size={18} strokeWidth={1.8} />
        </Link>
      ) : null}
      <Link
        href={notificationsHref[space]}
        aria-label="Notifications"
        className={iconButtonClass()}
      >
        <Bell aria-hidden size={18} strokeWidth={1.8} />
      </Link>
    </div>
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

// Formulaire GET vers la liste des sportifs, tous statuts confondus : le résultat est une vraie page,
// partageable, qui marche aussi sans JavaScript.
function CoachSearch({ athletesHref }: { athletesHref: string }) {
  const input = useRef<HTMLInputElement>(null);
  useCommandK(() => input.current?.focus());
  return (
    <form role="search" action={athletesHref} className={`${searchBox} focus-within:border-accent`}>
      <label htmlFor="coach-search" className="sr-only">
        Rechercher dans Coory (sportifs)
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
      <input type="hidden" name="statut" value="tous" />
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
