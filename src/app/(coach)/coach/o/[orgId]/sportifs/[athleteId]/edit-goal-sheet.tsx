"use client";

import { useActionState } from "react";

import { Sheet } from "@/components/ui/overlay";
import { useToast } from "@/components/ui/toast";
import { updateGoal, type EditGoalState } from "@/features/goals/actions";
import type { GoalEntry } from "@/features/goals/queries";
import type { GoalFormInput } from "@/features/goals/schemas";
import { formatRaceTime } from "@/features/records/schemas";

import { GoalFields } from "./add-goal-form";

// « Modifier » un objectif en cours (demande d'Antonino du 26/10) : la fenêtre reprend les champs de
// l'ajout, remplis avec l'objectif. Corriger une date ou un nom ne demande plus de le supprimer.
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

// Fenêtre « Modifier l'objectif », ouverte depuis le menu « ··· » de la carte (choix d'Antonino du
// 03/11 : les actions d'un objectif sont dans ce menu).
export function EditGoalSheet({
  organizationId,
  athleteId,
  goal,
  title,
  today,
  otherMain,
  open,
  onClose,
}: {
  organizationId: string;
  athleteId: string;
  goal: GoalEntry;
  title: string;
  today: string;
  // Un AUTRE objectif est principal : choisir « Principal » ici le fera passer en secondaire.
  otherMain: boolean;
  open: boolean;
  onClose: () => void;
}) {
  const toast = useToast();
  // Enregistré : la fenêtre se ferme et un message le confirme.
  const [state, formAction, pending] = useActionState(
    async (previous: EditGoalState, formData: FormData) => {
      const next = await updateGoal(organizationId, athleteId, goal.id, previous, formData);
      if (next.error === null) {
        onClose();
        toast("Objectif modifié.");
      }
      return next;
    },
    initialState,
  );

  // Un objectif en retard garde sa date passée ; sinon, pas de date avant aujourd'hui.
  const minDate = goal.targetDate && goal.targetDate < today ? goal.targetDate : today;

  return (
    <Sheet open={open} onClose={onClose} title="Modifier l'objectif" subtitle={title}>
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
  );
}
