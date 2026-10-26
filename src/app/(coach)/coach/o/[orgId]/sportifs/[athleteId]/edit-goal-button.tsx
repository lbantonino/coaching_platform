"use client";

import { Pencil } from "lucide-react";
import { useActionState, useState } from "react";

import { buttonClass } from "@/components/ui/button";
import { Sheet } from "@/components/ui/overlay";
import { useToast } from "@/components/ui/toast";
import { updateGoal, type EditGoalState } from "@/features/goals/actions";
import type { GoalEntry } from "@/features/goals/queries";
import type { GoalFormInput } from "@/features/goals/schemas";
import { formatRaceTime } from "@/features/records/schemas";

import { GoalFields } from "./add-goal-form";

// « Modifier » sur un objectif en cours (demande d'Antonino du 26/10) : la fenêtre reprend les champs
// de l'ajout, remplis avec l'objectif. Corriger une date ou un nom ne demande plus de le supprimer.
const initialState: EditGoalState = { error: null, saved: 0, attempt: 0, values: null };

function toForm(goal: GoalEntry): GoalFormInput {
  return {
    goalType: goal.type,
    priority: goal.priority,
    targetDate: goal.targetDate ?? "",
    targetTime: goal.targetTimeSeconds ? formatRaceTime(goal.targetTimeSeconds) : "",
    isCompetition: goal.competitionName !== null,
    competitionName: goal.competitionName ?? "",
    competitionLocation: goal.competitionLocation ?? "",
    hyroxCategory: goal.hyroxCategory ?? "",
    description: goal.description ?? "",
  };
}

export function EditGoalButton({
  organizationId,
  athleteId,
  goal,
  title,
  today,
  otherMain,
}: {
  organizationId: string;
  athleteId: string;
  goal: GoalEntry;
  title: string;
  today: string;
  // Un AUTRE objectif est principal : choisir « Principal » ici le fera passer en secondaire.
  otherMain: boolean;
}) {
  const [open, setOpen] = useState(false);
  const toast = useToast();
  // Enregistré : la fenêtre se ferme et un message le confirme.
  const [state, formAction, pending] = useActionState(
    async (previous: EditGoalState, formData: FormData) => {
      const next = await updateGoal(organizationId, athleteId, goal.id, previous, formData);
      if (next.error === null) {
        setOpen(false);
        toast("Objectif modifié.");
      }
      return next;
    },
    initialState,
  );

  // Un objectif en retard garde sa date passée ; sinon, pas de date avant aujourd'hui.
  const minDate = goal.targetDate && goal.targetDate < today ? goal.targetDate : today;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Modifier : ${title}`}
        className={buttonClass({ variant: "outline", size: "sm" })}
      >
        <Pencil aria-hidden size={13} strokeWidth={1.7} />
        Modifier
      </button>
      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title="Modifier l'objectif"
        subtitle={title}
      >
        {open ? (
          <GoalFields
            key={state.attempt}
            idPrefix={`edit-goal-${goal.id}`}
            formAction={formAction}
            pending={pending}
            minDate={minDate}
            hasMain={otherMain}
            error={state.error}
            values={state.values ?? toForm(goal)}
            submitLabel="Enregistrer"
          />
        ) : null}
      </Sheet>
    </>
  );
}
