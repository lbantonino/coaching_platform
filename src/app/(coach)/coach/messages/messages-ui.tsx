"use client";

import { Calendar, MoreHorizontal, Plus, Search, UserRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";

import { useOpenNewSession } from "@/components/blocks/new-session-sheet";
import { phoneFabClass } from "@/components/layout/mobile-bar";
import { Avatar } from "@/components/ui/avatar";
import { DialogBody, MenuDialog, Sheet, type MenuAnchor } from "@/components/ui/overlay";
import { Spinner } from "@/components/ui/spinner";

// Morceaux interactifs de la page Messages, kit « Coory Pages », page 07 (D-131). Sans groupes
// (décision 12 : plus tard, avec l'espace sportif) ni pièces jointes (décision 13).

type Athlete = { id: string; name: string };

// « Nouveau message » : choisir le sportif, puis son fil s'ouvre. Trois déclencheurs : le bouton de
// l'en-tête (ordinateur), le « + » de la liste et le bouton flottant (téléphone).
export function NewMessage({
  variant,
  loadAthletes,
}: {
  variant: "header" | "plus" | "fab";
  loadAthletes: () => Promise<Athlete[]>;
}) {
  const [open, setOpen] = useState(false);
  const [athletes, setAthletes] = useState<Athlete[] | null>(null);
  const [query, setQuery] = useState("");
  const router = useRouter();
  const show = () => {
    setOpen(true);
    setQuery("");
    setAthletes(null);
    loadAthletes().then(setAthletes, () => setAthletes([]));
  };
  const shown = (athletes ?? []).filter((athlete) =>
    athlete.name.toLowerCase().includes(query.trim().toLowerCase()),
  );

  return (
    <>
      {variant === "header" ? (
        <button
          type="button"
          onClick={show}
          className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-[9px] bg-cta px-3.5 text-[12.5px] leading-[normal] font-medium whitespace-nowrap text-on-cta transition-[scale,opacity] duration-150 hover:opacity-90 active:scale-[0.98] max-lg:hidden"
        >
          <Plus aria-hidden size={14} strokeWidth={2.2} />
          Nouveau message
        </button>
      ) : variant === "plus" ? (
        <button
          type="button"
          aria-label="Nouveau message"
          onClick={show}
          className="grid size-9 shrink-0 place-items-center rounded-[10px] bg-dlg-tile text-text transition-[background-color,scale] duration-150 hover:bg-dlg-tile-hover active:scale-95 max-lg:hidden"
        >
          <Plus aria-hidden size={17} strokeWidth={2} />
        </button>
      ) : (
        <button
          type="button"
          aria-label="Nouveau message"
          data-phone-fab=""
          onClick={show}
          className={phoneFabClass}
        >
          <Plus aria-hidden size={24} strokeWidth={2.2} />
        </button>
      )}
      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title="Nouveau message"
        subtitle="Choisis le sportif à qui écrire."
        bare
      >
        <DialogBody>
          <div className="flex flex-col gap-3">
            <label className="relative flex items-center">
              <span className="sr-only">Rechercher un sportif</span>
              <Search
                aria-hidden
                size={16}
                strokeWidth={1.9}
                className="pointer-events-none absolute left-3.5 text-faint"
              />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Rechercher un sportif"
                className="h-12 w-full rounded-[12px] bg-surface-2 pr-3.5 pl-10 text-[16px] text-text inset-ring inset-ring-line-2 outline-none placeholder:text-faint focus:inset-ring-[1.5px] focus:inset-ring-violet md:h-11 md:text-[14px]"
              />
            </label>
            {athletes === null ? (
              <p className="flex items-center gap-2 py-4 text-[14px] text-muted">
                <Spinner /> Chargement…
              </p>
            ) : shown.length === 0 ? (
              <p className="py-4 text-[14px] text-muted">Aucun sportif trouvé.</p>
            ) : (
              <ul aria-label="Sportifs" className="flex flex-col">
                {shown.map((athlete) => (
                  <li key={athlete.id} className="border-t border-line first:border-t-0">
                    <button
                      type="button"
                      onClick={() => {
                        setOpen(false);
                        router.push(`/coach/messages?sportif=${athlete.id}`, { scroll: false });
                      }}
                      className="flex min-h-14 w-full items-center gap-3 rounded-[12px] px-1.5 text-left transition-colors duration-150 hover:bg-surface-2"
                    >
                      <Avatar name={athlete.name} size="sm" />
                      <span className="min-w-0 flex-1 truncate text-[15px] font-medium">
                        {athlete.name}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </DialogBody>
      </Sheet>
    </>
  );
}

// « Planifier » : la fenêtre « Nouvelle séance » remplie avec ce sportif.
export function PlanButton({ athleteId }: { athleteId: string }) {
  const openSession = useOpenNewSession();
  return (
    <button
      type="button"
      disabled={!openSession}
      onClick={() => openSession?.({ athleteId })}
      className="inline-flex h-11 shrink-0 items-center gap-2 rounded-[12px] px-3.5 text-[14px] leading-[normal] font-medium text-text inset-ring inset-ring-line-2 transition-colors duration-150 hover:bg-surface-2 lg:h-10 lg:text-[13.5px]"
    >
      <Calendar aria-hidden size={15} strokeWidth={1.9} />
      <span className="max-sm:sr-only">Planifier</span>
    </button>
  );
}

// « ··· » du fil : la fiche du sportif et son agenda.
export function ThreadMenu({ name, href }: { name: string; href: string }) {
  const [anchor, setAnchor] = useState<MenuAnchor | null>(null);
  const row =
    "flex h-[46px] w-full items-center gap-2.5 rounded-[9px] px-3 text-[15px] leading-[normal] font-medium text-text transition-[background-color] duration-150 hover:bg-dlg-tile md:h-9 md:px-2.5 md:text-[13px]";
  return (
    <>
      <button
        type="button"
        aria-label={`Plus d'actions : ${name}`}
        onClick={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          setAnchor({
            x: Math.round(Math.max(12, rect.right - 220)),
            y: Math.round(rect.bottom + 6),
            side: "top",
            width: 220,
          });
        }}
        className="grid size-11 shrink-0 place-items-center rounded-[12px] text-muted inset-ring inset-ring-line-2 transition-colors duration-150 hover:bg-surface-2 hover:text-text lg:size-10"
      >
        <MoreHorizontal aria-hidden size={17} strokeWidth={1.8} />
      </button>
      <MenuDialog
        open={anchor !== null}
        onClose={() => setAnchor(null)}
        anchor={anchor}
        title={name}
      >
        <Link href={href} className={row} onClick={() => setAnchor(null)}>
          <UserRound aria-hidden size={15} strokeWidth={1.9} />
          Voir la fiche
        </Link>
        <Link href={`${href}?onglet=agenda`} className={row} onClick={() => setAnchor(null)}>
          <Calendar aria-hidden size={15} strokeWidth={1.9} />
          Voir son agenda
        </Link>
      </MenuDialog>
    </>
  );
}

export type ConversationRow = {
  id: string;
  name: string;
  photoPath: string | null;
  sex: "female" | "male" | "unspecified" | null;
  preview: string;
  time: string;
  unread: number;
  href: string;
  active: boolean;
};

// La liste des conversations et sa recherche (nom ou dernier message), sans recharger.
export function ConversationList({
  rows,
  empty,
  filters,
}: {
  rows: ConversationRow[];
  empty: string;
  // Les filtres (Toutes · Non lues), sous la recherche (kit).
  filters?: ReactNode;
}) {
  const [query, setQuery] = useState("");
  const text = query.trim().toLowerCase();
  const shown = rows.filter(
    (row) =>
      text === "" ||
      row.name.toLowerCase().includes(text) ||
      row.preview.toLowerCase().includes(text),
  );
  return (
    <>
      <div className="px-4 lg:px-[30px]">
        <label className="relative flex items-center">
          <span className="sr-only">Rechercher une conversation</span>
          <Search
            aria-hidden
            size={16}
            strokeWidth={1.9}
            className="pointer-events-none absolute left-3.5 text-faint"
          />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Rechercher une conversation"
            className="h-12 w-full rounded-[12px] bg-surface-2 pr-3.5 pl-10 text-[16px] text-text inset-ring inset-ring-line-2 outline-none placeholder:text-faint focus:inset-ring-[1.5px] focus:inset-ring-violet lg:h-11 lg:text-[14px]"
          />
        </label>
      </div>
      {filters}
      <div className="min-h-0 flex-1 lg:overflow-y-auto lg:overscroll-contain">
        {shown.length === 0 ? (
          <p className="px-4 py-3 text-[14px] text-muted lg:px-[30px]">
            {rows.length === 0 ? empty : "Aucune conversation trouvée."}
          </p>
        ) : (
          <ul aria-label="Conversations" className="flex flex-col gap-0.5 px-2 pb-2 lg:px-3.5">
            {shown.map((row) => (
              <li key={row.id}>
                <Link
                  href={row.href}
                  scroll={false}
                  aria-current={row.active ? "page" : undefined}
                  className={`flex min-h-[72px] items-center gap-3 rounded-[16px] px-2.5 py-2.5 transition-colors duration-150 lg:min-h-[78px] lg:px-4 ${
                    row.active ? "lg:bg-status-accent-soft/60" : "hover:bg-surface-2"
                  }`}
                >
                  <Avatar name={row.name} photoPath={row.photoPath} sex={row.sex} size="lg" />
                  <span className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="flex min-w-0 items-baseline gap-2">
                      <span className="min-w-0 flex-1 truncate text-[15.5px] leading-[normal] font-semibold">
                        {row.unread > 0 ? <span className="sr-only">Non lu : </span> : null}
                        {row.name}
                      </span>
                      <span
                        className={`shrink-0 text-[12.5px] leading-[normal] font-medium tabular ${
                          row.unread > 0 ? "text-violet-text" : "text-faint"
                        }`}
                      >
                        {row.time}
                      </span>
                    </span>
                    <span className="flex min-w-0 items-center gap-2">
                      <span
                        className={`min-w-0 flex-1 truncate text-[14px] leading-[normal] ${
                          row.unread > 0 ? "font-medium text-text" : "text-muted"
                        }`}
                      >
                        {row.preview}
                      </span>
                      {row.unread > 0 ? (
                        <span className="grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-accent px-1.5 text-[11px] leading-none font-semibold text-white tabular">
                          {row.unread}
                          <span className="sr-only"> non lu{row.unread > 1 ? "s" : ""}</span>
                        </span>
                      ) : null}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
