"use client";

import { Plus } from "lucide-react";
import type { ReactNode } from "react";

import { glue } from "@/components/programs/session-line";
import { disciplineStyles, type Discipline } from "@/domain/training/discipline";
import type { CardRole, SessionCard, StepCard } from "@/domain/training/session-cards";

// Les cartes de l'éditeur de séance (test sur iPhone du 15/11, maquette validée le 17/11) : EXACTEMENT
// la carte de la séance (SessionCardsView, D-187 : barre de couleur, nom en gras, volume en haut à
// droite, lignes, repos en gris), avec ce qu'il faut pour modifier : la poignée de déplacement, un appui
// pour ouvrir la carte dans le panneau (entourée de violet), « ⋯ », et « + Ajouter » dans une grande
// carte. Les textes viennent du même modèle que la vue (sessionCards) : l'éditeur et la séance disent
// toujours la même chose.

export const SELECTED_CARD =
  "inset-ring-[1.5px] inset-ring-violet shadow-[0_8px_20px_-12px_rgba(139,92,246,0.6)]";

const BARS: Record<Exclude<CardRole, "work">, string> = {
  warmup: "bg-dlg-disabled",
  cooldown: "bg-dlg-disabled",
  rest: "bg-checkbox",
};

// Ligne de dépôt pendant un glisser-déposer.
function DropMark({ at }: { at: "before" | "after" | null }) {
  if (!at) return null;
  return (
    <span
      aria-hidden
      className={`pointer-events-none absolute inset-x-2 h-0.5 rounded-[1px] bg-violet ${at === "before" ? "-top-[5px]" : "-bottom-[5px]"}`}
    />
  );
}

// Le chemin d'une carte dans le modèle (« id », « groupe/id », « warmup »…) -> la carte.
export function cardsByPath(cards: SessionCard[]): Map<string, SessionCard> {
  const map = new Map<string, SessionCard>();
  for (const card of cards) {
    map.set(card.path.join("/"), card);
    if (card.kind === "group") {
      for (const child of card.cards) map.set(child.path.join("/"), child);
    }
  }
  return map;
}

const titleClass =
  "min-w-0 flex-1 text-[17px] leading-[1.25] font-bold tracking-[-0.01em] text-text lg:text-[15.5px] lg:leading-[1.3]";
const asideClass =
  "shrink-0 pt-[3px] text-[13.5px] font-semibold whitespace-nowrap text-text-2 lg:text-[12.5px]";

export function EditorCard({
  card,
  discipline,
  selected = false,
  onSelect,
  handle = null,
  menu = null,
  drop = null,
  dragging = false,
  empty,
}: {
  card: Pick<StepCard, "role" | "title" | "aside" | "lines" | "sub">;
  discipline: Discipline;
  selected?: boolean;
  // Sans `onSelect` : une carte qui se lit seulement (bloc de texte, séance lue seule).
  onSelect?: () => void;
  handle?: ReactNode;
  menu?: ReactNode;
  drop?: "before" | "after" | null;
  dragging?: boolean;
  // Carte vide (échauffement pas encore écrit) : ce qu'elle dit à la place des lignes.
  empty?: string;
}) {
  const bar = card.role === "work" ? disciplineStyles[discipline].dot : BARS[card.role];
  const body = (
    <>
      <span className="flex min-w-0 items-start gap-2.5">
        <span className={titleClass}>{card.title}</span>
        {card.aside ? <span className={asideClass}>{card.aside}</span> : null}
      </span>
      {card.lines.length === 0 && empty ? (
        <span className="mt-1 text-[14px] leading-[1.4] text-muted lg:text-[13px]">{empty}</span>
      ) : null}
      {card.lines.map((line, i) => (
        <span
          key={`l${i}`}
          className="mt-1 text-[14.5px] leading-[1.4] text-text-2 lg:text-[13.5px]"
        >
          {glue(line)}
        </span>
      ))}
      {card.sub.map((line, i) => (
        <span
          key={`s${i}`}
          className="mt-0.5 text-[13.5px] leading-[1.4] text-muted lg:text-[12.5px]"
        >
          {glue(line)}
        </span>
      ))}
    </>
  );
  return (
    <div
      data-reorder-row=""
      className={`relative flex min-w-0 items-start gap-1.5 rounded-[14px] bg-surface-2 py-3 pr-3 pl-[14px] transition-[box-shadow,opacity] duration-150 lg:py-2.5 ${
        selected ? SELECTED_CARD : ""
      } ${dragging ? "opacity-60" : ""}`}
    >
      <span aria-hidden className={`absolute inset-y-0 left-0 w-[5px] rounded-l-[14px] ${bar}`} />
      <DropMark at={drop} />
      {handle ? <span className="relative z-10 -my-1 self-stretch">{handle}</span> : null}
      {onSelect ? (
        <button
          type="button"
          onClick={onSelect}
          aria-pressed={selected}
          className="flex min-w-0 flex-1 flex-col pl-1 text-left after:absolute after:inset-0 after:rounded-[inherit] focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-violet"
        >
          {body}
        </button>
      ) : (
        <span className="flex min-w-0 flex-1 flex-col pl-1">{body}</span>
      )}
      {menu ? <span className="relative z-10">{menu}</span> : null}
    </div>
  );
}

export function EditorGroup({
  title,
  aside = null,
  footer = null,
  selected = false,
  onSelect,
  handle = null,
  menu = null,
  drop = null,
  dragging = false,
  add = null,
  children,
}: {
  title: string;
  // « 3 tours », ou le compteur de tours de la course et du Hyrox.
  aside?: ReactNode;
  footer?: string | null;
  selected?: boolean;
  onSelect?: () => void;
  handle?: ReactNode;
  menu?: ReactNode;
  drop?: "before" | "after" | null;
  dragging?: boolean;
  add?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div
      data-reorder-row=""
      className={`relative flex min-w-0 flex-col gap-2 rounded-[16px] p-2.5 inset-ring inset-ring-line-2 transition-[box-shadow,opacity] duration-150 lg:p-2 ${
        selected ? SELECTED_CARD : ""
      } ${dragging ? "opacity-60" : ""}`}
    >
      <DropMark at={drop} />
      <div className="flex min-h-9 min-w-0 items-center gap-1.5 pl-1">
        {handle ? <span className="relative z-10 -my-1 self-stretch">{handle}</span> : null}
        {onSelect ? (
          <button
            type="button"
            onClick={onSelect}
            aria-pressed={selected}
            // 44 px de haut sur téléphone : c'est le seul accès au panneau du bloc (relecture du 17/11).
            className={`${titleClass} flex min-h-11 items-center rounded-[8px] pl-1 text-left focus-visible:outline-2 focus-visible:outline-violet lg:min-h-0`}
          >
            {title}
          </button>
        ) : (
          <span className={`${titleClass} pl-1`}>{title}</span>
        )}
        {typeof aside === "string" ? <span className={asideClass}>{aside}</span> : aside}
        {menu}
      </div>
      {children}
      {add}
      {footer ? (
        <span className="px-1.5 pb-0.5 text-[13.5px] text-muted lg:text-[12.5px]">{footer}</span>
      ) : null}
    </div>
  );
}

// La carte d'un élément dans le modèle ; à défaut (jamais en pratique), son seul nom.
export function cardAt(byPath: Map<string, SessionCard>, path: string[], title: string): StepCard {
  const found = byPath.get(path.join("/"));
  return found?.kind === "card"
    ? found
    : { kind: "card", role: "work", title, lines: [], sub: [], path };
}

// Un bloc de texte (séance reprise d'une ancienne version) : il se lit et se déplace. Répété
// (« Circuit », 4 tours), c'est une grande carte avec ses lignes, comme dans la séance (relecture du
// 17/11 : il s'affichait vide).
export function TextItemCard({
  byPath,
  id,
  title,
  discipline,
  handle = null,
  drop = null,
  dragging = false,
}: {
  byPath: Map<string, SessionCard>;
  id: string;
  title: string;
  discipline: Discipline;
  handle?: ReactNode;
  drop?: "before" | "after" | null;
  dragging?: boolean;
}) {
  const found = byPath.get(id);
  if (found?.kind === "group") {
    return (
      <EditorGroup
        title={found.title}
        aside={found.aside ?? null}
        footer={found.footer ?? null}
        handle={handle}
        drop={drop}
        dragging={dragging}
      >
        <div className="flex flex-col gap-2">
          {found.cards.map((card, i) => (
            <EditorCard key={i} card={card} discipline={discipline} />
          ))}
        </div>
      </EditorGroup>
    );
  }
  return (
    <EditorCard
      card={cardAt(byPath, [id], title)}
      discipline={discipline}
      handle={handle}
      drop={drop}
      dragging={dragging}
    />
  );
}

// « + Ajouter… » dans une grande carte, ou sous la liste.
export function AddInside({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-11 items-center gap-1.5 self-start rounded-[10px] px-1.5 text-[14px] font-semibold text-violet-text transition-colors duration-150 hover:bg-surface-2 lg:min-h-9 lg:text-[13px]"
    >
      <Plus aria-hidden size={15} strokeWidth={2.2} />
      {label}
    </button>
  );
}
