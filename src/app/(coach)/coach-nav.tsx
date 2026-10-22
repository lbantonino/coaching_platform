"use client";

import {
  BookOpen,
  Calculator,
  CalendarDays,
  ChartNoAxesColumn,
  FileText,
  FolderOpen,
  House,
  ListChecks,
  MessageSquare,
  ReceiptText,
  Settings,
  Users,
  type LucideIcon,
} from "lucide-react";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { COMING_SOON, type ComingSoonSlug } from "./coming-soon";

// Navigation coach (D-28, d'après la maquette d'Antonino) : les sections qui existent, et les modules
// prévus, grisés avec « Bientôt » et menant à une page qui explique leur phase.
// `orgBase` : « /coach/o/<organisation> », absent tant que le coach n'a pas d'organisation.
type Props = { orgBase: string | null };
type Item = { href: string; label: string; icon: LucideIcon; active: boolean; soon: boolean };

const soonIcons: Record<ComingSoonSlug, LucideIcon> = {
  programmes: FileText,
  seances: ChartNoAxesColumn,
  facturation: ReceiptText,
  comptabilite: Calculator,
  bibliotheque: BookOpen,
  taches: ListChecks,
  messages: MessageSquare,
  documents: FolderOpen,
};

function useItems({ orgBase }: Props): { main: Item[]; secondary: Item[] } {
  const pathname = usePathname();
  const soon = (slug: ComingSoonSlug): Item => ({
    href: `/coach/bientot/${slug}`,
    label: COMING_SOON[slug].label,
    icon: soonIcons[slug],
    active: pathname === `/coach/bientot/${slug}`,
    soon: true,
  });
  const items: Item[] = [
    {
      href: "/coach",
      label: "Tableau de bord",
      icon: House,
      active: pathname === "/coach",
      soon: false,
    },
  ];
  if (orgBase) {
    items.push({
      href: `${orgBase}/sportifs`,
      label: "Sportifs",
      icon: Users,
      active: pathname.startsWith(`${orgBase}/sportifs`),
      soon: false,
    });
  }
  items.push(soon("programmes"));
  if (orgBase) {
    items.push({
      href: `${orgBase}/agenda`,
      label: "Agenda",
      icon: CalendarDays,
      active: pathname.startsWith(`${orgBase}/agenda`),
      soon: false,
    });
  }
  items.push(soon("seances"), soon("facturation"), soon("comptabilite"), soon("bibliotheque"));
  // Second groupe, en bas du menu (maquette D-28) : Paramètres mène au profil du coach.
  const secondary: Item[] = [
    soon("taches"),
    soon("messages"),
    soon("documents"),
    {
      href: "/coach/profil",
      label: "Paramètres",
      icon: Settings,
      active: pathname === "/coach/profil",
      soon: false,
    },
  ];
  return { main: items, secondary };
}

function NavList({ items }: { items: Item[] }) {
  return (
    <ul className="flex flex-col gap-1">
      {items.map(({ href, label, icon: Icon, active, soon }) => (
        <li key={href}>
          <Link
            href={href}
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-3 rounded-[11px] border px-3 py-2 text-body transition-colors ${
              active
                ? "border-accent/35 bg-[color-mix(in_srgb,var(--accent)_16%,var(--bg))] text-text"
                : "border-transparent text-muted hover:bg-surface hover:text-text"
            }`}
          >
            <Icon aria-hidden size={18} strokeWidth={1.7} />
            <span className="flex-1">{label}</span>
            {soon ? (
              <span className="rounded-pill bg-chip px-1.5 py-0.5 text-[10px] font-medium text-muted">
                Bientôt
              </span>
            ) : null}
          </Link>
        </li>
      ))}
    </ul>
  );
}

// Barre latérale (ordinateur). Élément actif : fond teinté rouge, comme sur la maquette (D-28).
export function CoachSideNav(props: Props) {
  const { main, secondary } = useItems(props);
  return (
    <div className="flex flex-1 flex-col justify-between gap-6">
      <NavList items={main} />
      <NavList items={secondary} />
    </div>
  );
}

// Menu hamburger (téléphone, demande d'Antonino) : tout le menu, la carte du coach et la déconnexion
// dans un panneau. Élément <dialog> natif : focus gardé dedans, fermeture avec Échap ou le fond.
export function CoachMobileMenu({ orgBase, footer }: Props & { footer: ReactNode }) {
  const { main, secondary } = useItems({ orgBase });
  const dialog = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Une page ouverte depuis le menu le referme.
  useEffect(() => {
    dialog.current?.close();
  }, [pathname]);

  return (
    <>
      <button
        type="button"
        aria-label="Ouvrir le menu"
        aria-expanded={open}
        onClick={() => {
          dialog.current?.showModal();
          setOpen(true);
        }}
        className="inline-flex size-9 items-center justify-center rounded-[9px] border border-line text-text"
      >
        <Menu aria-hidden size={18} strokeWidth={1.8} />
      </button>
      <dialog
        ref={dialog}
        aria-label="Menu"
        onClose={() => setOpen(false)}
        onClick={(event) => {
          // Toucher le fond (hors du panneau) referme le menu.
          if (event.target === dialog.current) dialog.current?.close();
        }}
        className="m-0 ml-auto h-dvh max-h-dvh w-[86%] max-w-sm bg-bg p-0 text-text backdrop:bg-black/60"
      >
        <div className="flex h-full flex-col gap-4 overflow-y-auto border-l border-line px-3 py-4">
          <div className="flex items-center justify-between px-1">
            <span className="text-small font-medium text-muted">Menu</span>
            <button
              type="button"
              aria-label="Fermer le menu"
              onClick={() => dialog.current?.close()}
              className="inline-flex size-9 items-center justify-center rounded-[9px] border border-line"
            >
              <X aria-hidden size={18} strokeWidth={1.8} />
            </button>
          </div>
          <nav
            aria-label="Navigation principale"
            className="flex flex-1 flex-col justify-between gap-6"
          >
            <NavList items={main} />
            <NavList items={secondary} />
          </nav>
          {footer}
        </div>
      </dialog>
    </>
  );
}
