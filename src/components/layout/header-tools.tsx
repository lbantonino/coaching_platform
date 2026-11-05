"use client";

import { Bell, Search, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

import { useAssistant } from "@/components/blocks/assistant";
import { CountBadge } from "@/components/ui/count-badge";

import { notificationsHref } from "./navigation";
import { NotificationsPopover } from "./notifications-popover";
import { useShell } from "./shell-context";

// Outils à droite de l'en-tête de page sur ordinateur (maquette v6, D-77) : recherche « Rechercher dans
// Coory… ⌘K », Assistant IA en violet (coach), cloche à pastille violette. Plus de bouton de thème
// (D-78) : le thème se choisit dans les Paramètres.
// Coach : la recherche ouvre la page Recherche globale (D-62) avec la saisie.
// Sportif et admin : la recherche ouvre la page Recherche de l'espace. ⌘K / Ctrl K y mène aussi.
// `compact` (barre de l'Agenda, D-78) : sous 1536 px, la recherche devient une loupe (⌘K marche
// toujours) pour laisser la place au choix de la vue et à « Nouvelle séance ». `compact="xl"` (page
// avec retour et boutons, D-124) : la loupe seulement sous 1280 px, pour que le chemin
// « ← Bibliothèque · Back squat » reste lisible sur une seule ligne.
export function HeaderTools({ compact = false }: { compact?: boolean | "xl" }) {
  const { space, orgBase } = useShell();
  const icon = compact === "xl" ? "xl:hidden" : "2xl:hidden";
  const field = compact === "xl" ? "hidden xl:contents" : "hidden 2xl:contents";
  return (
    <div className="hidden items-center gap-2.5 lg:flex">
      {compact && space === "coach" ? (
        <Link
          href="/coach/recherche"
          aria-label="Rechercher dans Coory"
          title="Rechercher (⌘K)"
          className={`${headerIcon} ${icon}`}
        >
          <Search aria-hidden size={15} strokeWidth={1.8} />
        </Link>
      ) : null}
      {space === "coach" && orgBase ? (
        <span className={compact ? field : "contents"}>
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

// Boutons icônes de l'en-tête (ordinateur) : 32 px, filet fin. Sur téléphone (barre du haut) : 40 px.
// Boutons de la barre du téléphone : 40 px dans la pilule (maquette « Sportifs », 03/11/2026).
export const headerIcon =
  "relative inline-flex size-8 shrink-0 items-center justify-center rounded-[9px] border border-line text-text-2 transition-colors duration-150 hover:bg-selected-hover";
const phoneIcon =
  "relative inline-flex size-10 shrink-0 items-center justify-center rounded-xl text-text-2 transition-colors duration-150 hover:bg-selected-hover";

// Assistant IA (coach) : dans l'en-tête des pages sur ordinateur (avec son nom), et dans la barre du haut
// sur téléphone (demande d'Antonino du 29/10/2026 : « super important »). En violet (D-77) pour qu'on
// comprenne qu'il s'ouvre : translucide en sombre, plein en clair.
// Kit « Coory Pages », 02 (D-132) : il ouvre la boîte de l'assistant par-dessus la page (et la ferme) ;
// sans la boîte (hors espace coach), il mène à la page de l'assistant.
export function AssistantButton({ withLabel = false }: { withLabel?: boolean }) {
  const assistant = useAssistant();
  const className = `inline-flex shrink-0 items-center justify-center bg-ai-bg text-ai-text inset-ring inset-ring-ai-border transition-[filter] duration-150 hover:brightness-110 ${
    withLabel ? "h-8 gap-1.5 rounded-[9px] px-3 text-[12.5px] font-medium" : "size-10 rounded-xl"
  }`;
  const content = (
    <>
      <Sparkles aria-hidden size={withLabel ? 13 : 16} strokeWidth={1.8} className="fill-current" />
      {withLabel ? "Assistant IA" : null}
    </>
  );
  if (!assistant) {
    return (
      <Link
        href="/coach/assistant"
        aria-label={withLabel ? undefined : "Assistant IA"}
        className={className}
      >
        {content}
      </Link>
    );
  }
  return (
    <button
      type="button"
      aria-label={withLabel ? undefined : "Assistant IA"}
      aria-expanded={assistant.open}
      aria-haspopup="dialog"
      onClick={() => (assistant.open ? assistant.closeDialog() : assistant.openDialog())}
      className={className}
    >
      {content}
    </button>
  );
}

// Cloche des notifications, avec la pastille violette de tout ce qui attend (D-37, D-77). Coach
// (02/11) : elle déplie l'aperçu des notifications, sur ordinateur et sur téléphone
// (notifications-popover.tsx) ; ailleurs (sportif, admin), elle ouvre la page Notifications.
export function NotificationBell({ phone = false }: { phone?: boolean }) {
  const { space, notificationCount = 0, notifications } = useShell();
  if (notifications) return <NotificationsPopover notifications={notifications} phone={phone} />;
  return (
    <Link
      href={notificationsHref[space]}
      aria-label={
        notificationCount > 0 ? `Notifications, ${notificationCount} à voir` : "Notifications"
      }
      className={phone ? phoneIcon : headerIcon}
    >
      <Bell aria-hidden size={phone ? 16 : 14} strokeWidth={1.8} />
      <CountBadge
        count={notificationCount}
        className={`absolute ${phone ? "top-1 right-1" : "-top-1.5 -right-1.5"}`}
      />
    </Link>
  );
}

// Maquette « Sportifs » (03/11/2026) : 200 × 32, rayon 9, 12,5 px. Filet en ombre intérieure et
// espacements de 6 px : « Rechercher dans Coory » tient entier sans écraser la loupe.
const searchBox =
  "flex h-8 w-[200px] items-center gap-1.5 rounded-[9px] bg-surface-2 pr-1.5 pl-2 text-[12.5px] tracking-[-0.01em] text-muted inset-ring inset-ring-line";

function Kbd() {
  return (
    <kbd
      aria-hidden
      className="pointer-events-none rounded-[5px] px-[5px] py-0.5 text-[10px] leading-none font-medium tracking-normal text-muted inset-ring inset-ring-line-2"
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
      className={`${searchBox} focus-within:inset-ring-muted`}
    >
      <label htmlFor="coach-search" className="sr-only">
        Rechercher dans Coory
      </label>
      <Search aria-hidden size={13} strokeWidth={2} className="shrink-0" />
      <input
        ref={input}
        id="coach-search"
        name="q"
        type="search"
        autoComplete="off"
        placeholder="Rechercher dans Coory"
        // Sans la croix d'effacement de Chrome : elle prend la place du texte dans ce champ étroit.
        className="h-full min-w-0 flex-1 bg-transparent text-text outline-none placeholder:text-muted [&::-webkit-search-cancel-button]:hidden"
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
      <Search aria-hidden size={13} strokeWidth={2} className="shrink-0" />
      <span className="flex-1 whitespace-nowrap">Rechercher dans Coory…</span>
      <Kbd />
    </Link>
  );
}
