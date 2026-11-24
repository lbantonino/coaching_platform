"use client";

import { BookOpen, Copy, Ellipsis, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

import { MoreMenu, type MoreMenuItem } from "@/components/ui/more-menu";
import { disciplineStyles, type Discipline } from "@/domain/training/discipline";
import type { CardRole, GroupCard, SessionCard, StepCard } from "@/domain/training/session-cards";

import { glue } from "./session-line";

// Une séance en CARTES (test d'Antonino et de Gianluca sur iPhone, 15/11/2026, D-187), la même vue
// partout (page du programme, page d'un modèle, récap de l'éditeur de séance, agenda d'un sportif) :
// une carte par étape, une grande carte pour ce qui se répète (superset, EMOM, « Répéter », circuit),
// avec une petite carte par exercice dedans. À gauche, une barre de couleur à la place des pastilles :
// la discipline pour un exercice, gris pour un repos ou une transition, gris clair pour l'échauffement
// et le retour au calme. « ⋯ » : Dupliquer et Supprimer là où la séance se modifie (page du programme),
// et « Voir dans la Bibliothèque » pour un exercice lié, partout.

export type CardActions = {
  duplicate: (path: string[]) => void;
  remove: (path: string[]) => void;
  // Refusé (l'échauffement ne se duplique pas, la séance garde au moins une étape…) : le menu ne le
  // propose pas.
  canDuplicate: (path: string[]) => boolean;
  canRemove: (path: string[]) => boolean;
};

const BARS: Record<Exclude<CardRole, "work">, string> = {
  warmup: "bg-dlg-disabled",
  cooldown: "bg-dlg-disabled",
  rest: "bg-checkbox",
};

// Exporté pour les cartes de l'éditeur de séance (17/11) : le même « ⋯ » partout.
export function CardMenu({
  title,
  path,
  exerciseId,
  actions,
}: {
  title: string;
  path: string[];
  exerciseId?: string;
  actions?: CardActions;
}) {
  const router = useRouter();
  const items: MoreMenuItem[] = [];
  if (actions?.canDuplicate(path)) {
    items.push({ label: "Dupliquer", icon: Copy, onSelect: () => actions.duplicate(path) });
  }
  if (exerciseId) {
    items.push({
      label: "Voir dans la Bibliothèque",
      icon: BookOpen,
      // La fiche ramène ici (« ← Programme », « ← Modèle »), comme le geste de retour (D-124).
      onSelect: () =>
        router.push(
          `/coach/bibliotheque/${exerciseId}?retour=${encodeURIComponent(
            `${window.location.pathname}${window.location.search}`,
          )}`,
        ),
    });
  }
  if (actions?.canRemove(path)) {
    items.push({
      label: "Supprimer",
      icon: Trash2,
      destructive: true,
      onSelect: () => actions.remove(path),
    });
  }
  if (items.length === 0) return null;
  return (
    <MoreMenu
      label={`Plus d'actions sur « ${title} »`}
      title={title}
      items={items}
      width={240}
      button={{
        content: <Ellipsis aria-hidden size={18} strokeWidth={2} />,
        className:
          "-my-1.5 -mr-1 grid size-11 shrink-0 place-items-center rounded-[10px] text-muted transition-colors duration-150 hover:bg-surface hover:text-text lg:size-8 lg:rounded-[9px]",
      }}
    />
  );
}

// Toute la carte s'ouvre d'un clic (24/11/2026) : un bouton posé sur la carte, « ··· » au-dessus.
function OpenButton({ title, onOpen }: { title: string; onOpen: () => void }) {
  return (
    <button
      type="button"
      aria-label={`Modifier « ${title} »`}
      onClick={onOpen}
      className="absolute inset-0 rounded-[inherit] transition-colors duration-150 hover:bg-text/[0.04] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-violet"
    />
  );
}

function Step({
  step,
  discipline,
  actions,
  onOpen,
  bg,
}: {
  step: StepCard;
  discipline: Discipline;
  actions?: CardActions;
  onOpen?: (path: string[]) => void;
  bg: string;
}) {
  const bar = step.role === "work" ? disciplineStyles[discipline].dot : BARS[step.role];
  return (
    <li
      className={`relative flex min-w-0 flex-col overflow-hidden rounded-[14px] py-3 pr-3 pl-[18px] lg:py-2.5 ${bg}`}
    >
      <span aria-hidden className={`absolute inset-y-0 left-0 w-[5px] ${bar}`} />
      {onOpen ? <OpenButton title={step.title} onOpen={() => onOpen(step.path)} /> : null}
      <span className="flex min-w-0 items-start gap-2.5">
        <span
          className={`min-w-0 flex-1 font-bold tracking-[-0.01em] text-text text-[17px] leading-[1.25] lg:text-[15.5px] lg:leading-[1.3]`}
        >
          {step.title}
        </span>
        {step.aside ? (
          <span
            className={`shrink-0 pt-[3px] font-semibold whitespace-nowrap text-text-2 text-[13.5px] lg:text-[12.5px]`}
          >
            {step.aside}
          </span>
        ) : null}
        <span className="relative z-10">
          <CardMenu
            title={step.title}
            path={step.path}
            {...(step.exerciseId ? { exerciseId: step.exerciseId } : {})}
            {...(actions ? { actions } : {})}
          />
        </span>
      </span>
      {step.lines.map((line, i) => (
        <span
          key={`l${i}`}
          className={`mt-1 text-text-2 text-[14.5px] leading-[1.4] lg:text-[13.5px]`}
        >
          {glue(line)}
        </span>
      ))}
      {step.sub.map((line, i) => (
        <span
          key={`s${i}`}
          className={`mt-0.5 text-muted text-[13.5px] leading-[1.4] lg:text-[12.5px]`}
        >
          {glue(line)}
        </span>
      ))}
    </li>
  );
}

function Group({
  group,
  discipline,
  actions,
  onOpen,
  bg,
}: {
  group: GroupCard;
  discipline: Discipline;
  actions?: CardActions;
  onOpen?: (path: string[]) => void;
  bg: string;
}) {
  return (
    <li className="flex min-w-0 flex-col gap-2 rounded-[16px] p-2.5 inset-ring inset-ring-line-2 lg:p-2">
      <span className="relative flex min-w-0 items-start gap-2.5 py-1 pl-1.5">
        {onOpen ? <OpenButton title={group.title} onOpen={() => onOpen(group.path)} /> : null}
        <span
          className={`min-w-0 flex-1 font-bold tracking-[-0.01em] text-text text-[17px] leading-[1.25] lg:text-[15.5px] lg:leading-[1.3]`}
        >
          {group.title}
        </span>
        {group.aside ? (
          <span
            className={`shrink-0 pt-[3px] font-semibold whitespace-nowrap text-text-2 text-[13.5px] lg:text-[12.5px]`}
          >
            {group.aside}
          </span>
        ) : null}
        <span className="relative z-10">
          <CardMenu title={group.title} path={group.path} {...(actions ? { actions } : {})} />
        </span>
      </span>
      <ol aria-label={group.title} className="m-0 flex list-none flex-col gap-2 p-0">
        {group.cards.map((step) => (
          <Step
            key={step.path.join("/")}
            step={step}
            discipline={discipline}
            bg={bg}
            {...(actions ? { actions } : {})}
            {...(onOpen ? { onOpen } : {})}
          />
        ))}
      </ol>
      {group.footer ? (
        <span className={`px-1.5 pb-0.5 text-muted text-[13.5px] lg:text-[12.5px]`}>
          {group.footer}
        </span>
      ) : null}
    </li>
  );
}

export function SessionCardsView({
  cards,
  discipline,
  actions,
  onOpen,
  onTint = false,
}: {
  cards: SessionCard[];
  discipline: Discipline;
  // Détail posé sur un fond déjà teinté (agenda de la fiche) : les cartes prennent le fond de carte
  // pour rester visibles (relecture).
  onTint?: boolean;
  // Page du programme (brouillon modifiable) seulement.
  actions?: CardActions;
  // Page du programme (24/11/2026) : un clic sur une carte ouvre son réglage (chemin de l'étape).
  onOpen?: (path: string[]) => void;
}) {
  // Plus grand sur téléphone, plus serré dès l'ordinateur (lg), partout la même vue.
  const bg = onTint ? "bg-surface" : "bg-surface-2";
  return (
    <ol aria-label="Étapes de la séance" className="m-0 flex list-none flex-col gap-2 p-0">
      {cards.map((item) =>
        item.kind === "group" ? (
          <Group
            key={item.path.join("/")}
            group={item}
            discipline={discipline}
            bg={bg}
            {...(actions ? { actions } : {})}
            {...(onOpen ? { onOpen } : {})}
          />
        ) : (
          <Step
            key={item.path.join("/")}
            step={item}
            discipline={discipline}
            bg={bg}
            {...(actions ? { actions } : {})}
            {...(onOpen ? { onOpen } : {})}
          />
        ),
      )}
    </ol>
  );
}
