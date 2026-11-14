"use client";

import { useActionState, useId, useState } from "react";

import {
  DlgCheckCard,
  DlgDate,
  DlgField,
  DlgFieldset,
  DlgHint,
  DlgSegmented,
  DlgSelect,
} from "@/components/ui/dialog-fields";
import {
  dlgErrorClass,
  dlgFormGridClass,
  dlgInputClass,
  dlgPrimaryButtonClass,
  dlgTextareaClass,
} from "@/components/ui/dialog-styles";
import { DialogBody, DialogFooter, Sheet } from "@/components/ui/overlay";
import { useToast } from "@/components/ui/toast";
import { updateGoal, type EditGoalState } from "@/features/goals/actions";
import type { GoalEntry } from "@/features/goals/queries";
import {
  goalTypeGroups,
  goalTypeLabels,
  HYROX_CATEGORIES,
  hyroxCategoryLabels,
  type GoalFormInput,
  type GoalPriority,
} from "@/features/goals/schemas";
import { goalFormValues } from "@/features/goals/form-values";

// « Modifier » un objectif en cours (demande d'Antonino du 26/10) : la fenêtre reprend les champs de
// l'ajout, remplis avec l'objectif. Corriger une date ou un nom ne demande plus de le supprimer.
const initialState: EditGoalState = { error: null, saved: 0, attempt: 0, values: null };

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
    <Sheet open={open} onClose={onClose} title="Modifier l'objectif" subtitle={title} bare>
      {open ? (
        <EditGoalFields
          key={state.attempt}
          idPrefix={`edit-goal-${goal.id}`}
          formAction={formAction}
          pending={pending}
          minDate={minDate}
          hasMain={otherMain}
          error={state.error}
          values={state.values ?? goalFormValues(goal)}
          onCancel={onClose}
        />
      ) : null}
    </Sheet>
  );
}

// Champs de la boîte (kit, 10) : mêmes champs et mêmes noms que l'ajout d'un objectif (GoalFields,
// carte de la fiche), présentés en grille de 12 colonnes, compétition en carte à cocher, boutons
// dans le pied fixe.
function EditGoalFields({
  idPrefix,
  formAction,
  pending,
  minDate,
  hasMain,
  error,
  values: v,
  onCancel,
}: {
  idPrefix: string;
  formAction: (formData: FormData) => void;
  pending: boolean;
  minDate: string;
  hasMain: boolean;
  error: string | null;
  values: GoalFormInput;
  onCancel: () => void;
}) {
  const formId = useId();
  const [goalType, setGoalType] = useState(v.goalType);
  const [isCompetition, setIsCompetition] = useState(v.isCompetition);
  const defaultPriority =
    (v.priority as GoalPriority | undefined) ?? (hasMain ? "secondary" : "main");
  return (
    <>
      <DialogBody>
        <form id={formId} action={formAction} className={dlgFormGridClass} noValidate>
          <DlgField label="Type d'objectif" htmlFor={`${idPrefix}-type`} half>
            <DlgSelect
              id={`${idPrefix}-type`}
              name="goalType"
              defaultValue={v.goalType}
              onChange={(event) => setGoalType(event.target.value)}
              required
            >
              <option value="" disabled>
                Choisir…
              </option>
              {goalTypeGroups.map((group) => (
                <optgroup key={group.label} label={group.label}>
                  {group.types.map((type) => (
                    <option key={type} value={type}>
                      {goalTypeLabels[type]}
                    </option>
                  ))}
                </optgroup>
              ))}
            </DlgSelect>
          </DlgField>
          <DlgField label="Date cible" htmlFor={`${idPrefix}-date`} optional half>
            <DlgDate
              id={`${idPrefix}-date`}
              name="targetDate"
              min={minDate}
              defaultValue={v.targetDate}
            />
          </DlgField>
          <DlgField label="Temps visé" htmlFor={`${idPrefix}-time`} optional half>
            <input
              id={`${idPrefix}-time`}
              name="targetTime"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              placeholder="Ex. : 1:15:00"
              defaultValue={v.targetTime}
              className={dlgInputClass}
            />
          </DlgField>
          <div className="col-span-2 flex min-w-0 flex-col gap-2 md:col-span-6">
            <DlgFieldset legend="Priorité">
              <DlgSegmented
                name="priority"
                defaultValue={defaultPriority}
                options={[
                  { value: "main", label: "Principal" },
                  { value: "secondary", label: "Secondaire" },
                ]}
              />
            </DlgFieldset>
          </div>
          {hasMain ? (
            <DlgHint>
              Choisir « Principal » fait passer l&apos;objectif principal actuel en secondaire.
            </DlgHint>
          ) : null}

          <DlgCheckCard
            name="isCompetition"
            checked={isCompetition}
            onChange={(event) => setIsCompetition(event.target.checked)}
            label="C'est une compétition"
          />
          {isCompetition ? (
            <>
              <DlgField label="Nom de la compétition" htmlFor={`${idPrefix}-competition`} half>
                <input
                  id={`${idPrefix}-competition`}
                  name="competitionName"
                  type="text"
                  maxLength={120}
                  autoComplete="off"
                  placeholder="Ex. : Hyrox Bruxelles"
                  defaultValue={v.competitionName}
                  className={dlgInputClass}
                />
              </DlgField>
              <DlgField label="Lieu" htmlFor={`${idPrefix}-location`} optional half>
                <input
                  id={`${idPrefix}-location`}
                  name="competitionLocation"
                  type="text"
                  maxLength={120}
                  autoComplete="off"
                  defaultValue={v.competitionLocation}
                  className={dlgInputClass}
                />
              </DlgField>
              {goalType === "hyrox" ? (
                <DlgField label="Catégorie Hyrox" htmlFor={`${idPrefix}-hyrox-category`} half>
                  <DlgSelect
                    id={`${idPrefix}-hyrox-category`}
                    name="hyroxCategory"
                    defaultValue={v.hyroxCategory ?? ""}
                  >
                    <option value="">Pas encore décidée</option>
                    {HYROX_CATEGORIES.map((category) => (
                      <option key={category} value={category}>
                        {hyroxCategoryLabels[category]}
                      </option>
                    ))}
                  </DlgSelect>
                </DlgField>
              ) : null}
            </>
          ) : null}

          <DlgField label="Description" htmlFor={`${idPrefix}-description`} optional>
            <textarea
              id={`${idPrefix}-description`}
              name="description"
              rows={2}
              maxLength={500}
              placeholder="Ex. : finir sous 1 h 45 ; tenir 45 min de cardio ; squat à 100 kg"
              defaultValue={v.description}
              className={dlgTextareaClass}
            />
          </DlgField>

          {error ? (
            <p role="alert" className={dlgErrorClass}>
              {error}
            </p>
          ) : null}
        </form>
      </DialogBody>
      <DialogFooter
        onCancel={onCancel}
        primary={
          <button type="submit" form={formId} disabled={pending} className={dlgPrimaryButtonClass}>
            {pending ? "Enregistrement…" : "Enregistrer"}
          </button>
        }
      />
    </>
  );
}
