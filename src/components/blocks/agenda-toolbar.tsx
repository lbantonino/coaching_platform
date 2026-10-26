import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { iconButtonClass } from "@/components/ui/button";
import { SegmentedNav } from "@/components/ui/segmented";

import { ViewMenu, type ViewOption } from "./view-menu";

// Barre de l'agenda, à la façon de Google Agenda (demande d'Antonino du 26/10) : flèches, période
// en clair (« Octobre 2026 »), puis la vue (bouton « Vue » sur téléphone, trois vues sur ordinateur).
// Plus de grand titre « Semaine du … » : il reste pour les lecteurs d'écran (titre masqué, qui nomme
// la zone de l'agenda).

const monthYear = new Intl.DateTimeFormat("fr-BE", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});
const monthShort = new Intl.DateTimeFormat("fr-BE", { month: "short", timeZone: "UTC" });
const monthOnly = new Intl.DateTimeFormat("fr-BE", { month: "long", timeZone: "UTC" });
const thisYear = () =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Brussels" }).format(new Date()).slice(0, 4);
const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);
const utc = (day: string) => new Date(`${day}T00:00:00Z`);

// « Octobre 2026 » ; une semaine à cheval : « Oct. – nov. 2026 » (ou « Déc. 2026 – janv. 2027 »).
// `short` (téléphone) : sans l'année quand c'est celle d'aujourd'hui (« Octobre », « Oct. – nov. »).
export function periodLabel(from: string, to: string, short = false): string {
  if (short && from.slice(0, 4) === to.slice(0, 4) && from.slice(0, 4) === thisYear()) {
    return from.slice(0, 7) === to.slice(0, 7)
      ? capitalize(monthOnly.format(utc(from)))
      : capitalize(`${monthShort.format(utc(from))} – ${monthShort.format(utc(to))}`);
  }
  if (from.slice(0, 7) === to.slice(0, 7)) return capitalize(monthYear.format(utc(from)));
  const sameYear = from.slice(0, 4) === to.slice(0, 4);
  const start = monthShort.format(utc(from));
  const end = monthShort.format(utc(to));
  return capitalize(
    sameYear
      ? `${start} – ${end} ${to.slice(0, 4)}`
      : `${start} ${from.slice(0, 4)} – ${end} ${to.slice(0, 4)}`,
  );
}

export function AgendaToolbar({
  titleId,
  srTitle,
  label,
  shortLabel = label,
  prevHref,
  nextHref,
  viewOptions,
  desktopViews,
  extra,
}: {
  titleId: string;
  // Titre lu par les lecteurs d'écran (« Semaine du 26 octobre au 1 novembre »).
  srTitle: string;
  // Période affichée en clair (« Octobre 2026 », « Lundi 26 octobre ») ; `shortLabel` sur téléphone.
  label: string;
  shortLabel?: string;
  prevHref: string;
  nextHref: string;
  viewOptions: ViewOption[];
  desktopViews: { href: string; label: string; active: boolean }[];
  extra?: ReactNode;
}) {
  return (
    <header className="flex items-center gap-2">
      <h2 id={titleId} className="sr-only">
        {srTitle}
      </h2>
      <nav aria-label="Changer de période" className="flex items-center gap-1">
        <Link
          href={prevHref}
          scroll={false}
          aria-label="Période précédente"
          className={iconButtonClass()}
        >
          <ChevronLeft aria-hidden size={18} strokeWidth={1.8} />
        </Link>
        <Link
          href={nextHref}
          scroll={false}
          aria-label="Période suivante"
          className={iconButtonClass()}
        >
          <ChevronRight aria-hidden size={18} strokeWidth={1.8} />
        </Link>
      </nav>
      <p
        aria-hidden
        className="min-w-0 truncate font-display text-[17px] font-semibold tracking-[-0.01em] lg:text-[20px]"
      >
        <span className="lg:hidden">{shortLabel}</span>
        <span className="max-lg:hidden">{label}</span>
      </p>
      <span className="ml-auto flex shrink-0 items-center gap-2">
        <span className="lg:hidden">
          <ViewMenu options={viewOptions} />
        </span>
        <span className="hidden lg:block">
          <SegmentedNav label="Vue de l'agenda" items={desktopViews} />
        </span>
        {extra}
      </span>
    </header>
  );
}
