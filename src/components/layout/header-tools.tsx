"use client";

import { Bell, Search, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

import { CountBadge } from "@/components/ui/count-badge";

import { notificationsHref } from "./navigation";
import { useShell } from "./shell-context";

// Outils à droite de l'en-tête de page sur ordinateur (maquette v6, D-77) : recherche « Rechercher dans
// Coory… ⌘K », Assistant IA en violet (coach), cloche à pastille violette. Plus de bouton de thème
// (D-78) : le thème se choisit dans les Paramètres.
// Coach : la recherche ouvre la page Recherche globale (D-62) avec la saisie.
// Sportif et admin : la recherche ouvre la page Recherche de l'espace. ⌘K / Ctrl K y mène aussi.
// `compact` (barre de l'Agenda, D-78) : sous 1536 px, la recherche devient une loupe (⌘K marche
// toujours) pour laisser la place au choix de la vue et à « Nouvelle séance ».
export function HeaderTools({ compact = false }: { compact?: boolean }) {
  const { space, orgBase } = useShell();
  return (
    <div className="hidden items-center gap-2 lg:flex">
      {compact && space === "coach" ? (
        <Link
          href="/coach/recherche"
          aria-label="Rechercher dans Coory"
          title="Rechercher (⌘K)"
          className={`${headerIcon} 2xl:hidden`}
        >
          <Search aria-hidden size={15} strokeWidth={1.8} />
        </Link>
      ) : null}
      {space === "coach" && orgBase ? (
        <span className={compact ? "hidden 2xl:contents" : "contents"}>
          <CoachSearch />
        </span>
      ) : (
        <SearchLink href={space === "athlete" ? "/app/recherche" : "/admin/recherche"} />
      )}
      {space === "coach" ? <AssistantButton withLabel /> : null}
      <NotificationBell />
    </div>
  );
}

// Boutons icônes de l'en-tête (ordinateur) : 32 px, filet fin. Sur téléphone (barre du haut) : 44 px.
export const headerIcon =
  "relative inline-flex size-8 shrink-0 items-center justify-center rounded-lg border border-line text-text-2 transition-colors duration-150 hover:bg-selected-hover";
const phoneIcon =
  "relative inline-flex size-11 shrink-0 items-center justify-center rounded-xl text-text-2 transition-colors duration-150 hover:bg-selected-hover";

// Assistant IA (coach) : dans l'en-tête des pages sur ordinateur (avec son nom), et dans la barre du haut
// sur téléphone (demande d'Antonino du 29/10/2026 : « super important »). En violet (D-77) pour qu'on
// comprenne qu'il s'ouvre : translucide en sombre, plein en clair.
export function AssistantButton({ withLabel = false }: { withLabel?: boolean }) {
  return (
    <Link
      href="/coach/assistant"
      aria-label={withLabel ? undefined : "Assistant IA"}
      className={`inline-flex shrink-0 items-center justify-center border border-ai-border bg-ai-bg text-ai-text transition-[filter] duration-150 hover:brightness-110 ${
        withLabel ? "h-8 gap-1.5 rounded-lg px-3 text-[12px] font-medium" : "size-11 rounded-xl"
      }`}
    >
      <Sparkles aria-hidden size={withLabel ? 14 : 18} strokeWidth={1.8} className="fill-current" />
      {withLabel ? "Assistant IA" : null}
    </Link>
  );
}

// Cloche des notifications, avec la pastille violette de tout ce qui attend (D-37, D-77).
export function NotificationBell({ phone = false }: { phone?: boolean }) {
  const { space, notificationCount = 0 } = useShell();
  return (
    <Link
      href={notificationsHref[space]}
      aria-label={
        notificationCount > 0 ? `Notifications, ${notificationCount} à voir` : "Notifications"
      }
      className={phone ? phoneIcon : headerIcon}
    >
      <Bell aria-hidden size={phone ? 18 : 15} strokeWidth={1.8} />
      <CountBadge
        count={notificationCount}
        className={`absolute ${phone ? "top-2 right-2" : "-top-1.5 -right-1.5"}`}
      />
    </Link>
  );
}

const searchBox =
  "flex h-8 w-56 items-center gap-2 rounded-lg border border-line bg-surface-2 px-2.5 text-[12px] text-faint";

function Kbd() {
  return (
    <kbd
      aria-hidden
      className="pointer-events-none rounded border border-line px-1 py-px text-[11px] text-faint"
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
      className={`${searchBox} focus-within:border-muted`}
    >
      <label htmlFor="coach-search" className="sr-only">
        Rechercher dans Coory
      </label>
      <Search aria-hidden size={14} strokeWidth={1.8} className="shrink-0" />
      <input
        ref={input}
        id="coach-search"
        name="q"
        type="search"
        autoComplete="off"
        placeholder="Rechercher dans Coory…"
        className="h-full min-w-0 flex-1 bg-transparent text-text outline-none placeholder:text-faint"
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
      <Search aria-hidden size={14} strokeWidth={1.8} className="shrink-0" />
      <span className="flex-1 whitespace-nowrap">Rechercher dans Coory…</span>
      <Kbd />
    </Link>
  );
}
