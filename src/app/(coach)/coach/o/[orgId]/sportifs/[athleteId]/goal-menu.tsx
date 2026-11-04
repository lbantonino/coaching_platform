"use client";

import { CircleCheck, CircleX, Ellipsis, Pencil, Star, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";

import { ActionMenu, ConfirmDialog } from "@/components/ui/overlay";
import { deleteGoal, makeGoalMain, setGoalStatus } from "@/features/goals/actions";
import type { GoalEntry } from "@/features/goals/queries";

import { EditGoalSheet } from "./edit-goal-sheet";

// Menu « ··· » d'une carte d'objectif (choix d'Antonino du 03/11 : cartes allégées, toutes les actions
// ici) : Modifier, Atteint, Abandonné, Rendre principal (objectif secondaire), Supprimer. Supprimer
// demande une confirmation. Chaque action est revérifiée côté serveur (actions des objectifs).
export function GoalMenu({
  organizationId,
  athleteId,
  goal,
  title,
  subtitle,
  today,
  otherMain,
}: {
  organizationId: string;
  athleteId: string;
  goal: GoalEntry;
  title: string;
  // Sous-titre du menu (kit, boîte 09) : la date et les précisions de la carte.
  subtitle?: string;
  today: string;
  // Un AUTRE objectif est principal (avertissement dans « Modifier »).
  otherMain: boolean;
}) {
  const [menu, setMenu] = useState(false);
  const [edit, setEdit] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [pending, startTransition] = useTransition();
  const run = (action: () => Promise<void>) => startTransition(() => action());

  const achieved = () => run(() => setGoalStatus(organizationId, athleteId, goal.id, "achieved"));
  const dropped = () => run(() => setGoalStatus(organizationId, athleteId, goal.id, "dropped"));

  return (
    // Colonne de droite de la carte : « ··· » en haut ; sur ordinateur seulement (demande d'Antonino
    // du 03/11), trois petits boutons en bas : Modifier, Atteint, Abandonné. Le téléphone ne change pas.
    <div className="flex shrink-0 flex-col items-end justify-between gap-3 self-stretch">
      <button
        type="button"
        aria-label={`Actions : ${title}`}
        aria-haspopup="dialog"
        onClick={() => setMenu(true)}
        disabled={pending}
        className="-mt-1.5 -mr-2 grid size-10 shrink-0 place-items-center rounded-[10px] text-muted transition-colors duration-150 hover:bg-surface-2/70 hover:text-text active:scale-[0.96] disabled:opacity-50"
      >
        <Ellipsis aria-hidden size={19} strokeWidth={1.8} />
      </button>
      <div className="flex gap-1.5 max-lg:hidden">
        {[
          { label: "Modifier", onClick: () => setEdit(true) },
          { label: "Atteint", onClick: achieved },
          { label: "Abandonné", onClick: dropped },
        ].map((action) => (
          <button
            key={action.label}
            type="button"
            onClick={action.onClick}
            disabled={pending}
            aria-label={`${action.label} : ${title}`}
            className="flex h-8 items-center rounded-[9px] bg-surface px-3 text-[12.5px] font-medium whitespace-nowrap text-text-2 inset-ring inset-ring-line-2 transition-colors duration-150 hover:text-text active:scale-[0.97] disabled:opacity-50"
          >
            {action.label}
          </button>
        ))}
      </div>
      <ActionMenu
        open={menu}
        onClose={() => setMenu(false)}
        title={title}
        subtitle={subtitle}
        items={[
          { label: "Modifier", icon: Pencil, onSelect: () => setEdit(true) },
          {
            label: "Atteint",
            icon: CircleCheck,
            tone: "ok",
            onSelect: achieved,
          },
          {
            label: "Abandonné",
            icon: CircleX,
            tone: "warn",
            onSelect: dropped,
          },
          ...(goal.priority === "secondary"
            ? [
                {
                  label: "Rendre principal",
                  icon: Star,
                  onSelect: () => run(() => makeGoalMain(organizationId, athleteId, goal.id)),
                },
              ]
            : []),
          { label: "Supprimer", icon: Trash2, destructive: true, onSelect: () => setConfirm(true) },
        ]}
      />
      <EditGoalSheet
        organizationId={organizationId}
        athleteId={athleteId}
        goal={goal}
        title={title}
        today={today}
        otherMain={otherMain}
        open={edit}
        onClose={() => setEdit(false)}
      />
      <ConfirmDialog
        open={confirm}
        onClose={() => setConfirm(false)}
        onConfirm={() => {
          setConfirm(false);
          run(() => deleteGoal(organizationId, athleteId, goal.id));
        }}
        title="Supprimer cet objectif ?"
        confirmLabel="Supprimer"
        pending={pending}
      >
        « {title} » sera effacé, sans passer par l&apos;historique. Pour un objectif atteint ou
        abandonné, choisis plutôt « Atteint » ou « Abandonné ».
      </ConfirmDialog>
    </div>
  );
}
