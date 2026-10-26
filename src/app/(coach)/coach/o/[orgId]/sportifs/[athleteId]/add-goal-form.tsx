"use client";

import { useActionState, useState } from "react";

import { buttonClass } from "@/components/ui/button";
import {
  errorTextClass,
  hintClass,
  inputClass,
  textareaClass,
  labelClass,
} from "@/components/ui/form-styles";
import { Segmented } from "@/components/ui/segmented";
import { addGoal, type AddGoalState } from "@/features/goals/actions";
import {
  goalTypeGroups,
  goalTypeLabels,
  HYROX_CATEGORIES,
  hyroxCategoryLabels,
  type GoalFormInput,
  type GoalPriority,
} from "@/features/goals/schemas";

const initialState: AddGoalState = { error: null, saved: 0, attempt: 0, values: null };

type Props = { organizationId: string; athleteId: string; today: string; hasMain: boolean };

export function AddGoalForm({ organizationId, athleteId, today, hasMain }: Props) {
  const [state, formAction, pending] = useActionState(
    addGoal.bind(null, organizationId, athleteId),
    initialState,
  );

  return (
    <div className="flex flex-col gap-3 border-t border-line pt-5">
      <h3 className="text-small font-medium">Ajouter un objectif</h3>
      {/* La clé change après chaque réponse : le formulaire se vide après un ajout réussi, et
          réaffiche toute la saisie (listes et cases comprises) après une erreur. */}
      <GoalFields
        key={state.attempt}
        idPrefix="goal"
        formAction={formAction}
        pending={pending}
        minDate={today}
        hasMain={hasMain}
        error={state.error}
        values={state.values}
        submitLabel="Ajouter l'objectif"
        savedMessage={state.saved > 0 && state.error === null ? "Objectif ajouté." : null}
      />
    </div>
  );
}

// Champs d'un objectif, partagés par l'ajout et la modification (« Modifier l'objectif »).
// `idPrefix` : les deux formulaires peuvent être sur la page en même temps, leurs id doivent différer.
// `hasMain` : un autre objectif est déjà principal (l'avertissement s'affiche alors).
export function GoalFields({
  idPrefix,
  formAction,
  pending,
  minDate,
  hasMain,
  error,
  values,
  submitLabel,
  savedMessage = null,
}: {
  idPrefix: string;
  formAction: (formData: FormData) => void;
  pending: boolean;
  minDate: string;
  hasMain: boolean;
  error: string | null;
  values: GoalFormInput | null;
  submitLabel: string;
  savedMessage?: string | null;
}) {
  // Après une erreur, on réaffiche la saisie (React 19 vide le formulaire après chaque envoi).
  const v = values;
  const [goalType, setGoalType] = useState(v?.goalType ?? "");
  const [isCompetition, setIsCompetition] = useState(v?.isCompetition ?? false);
  // Par défaut, le premier objectif est principal ; les suivants sont secondaires.
  const defaultPriority =
    (v?.priority as GoalPriority | undefined) ?? (hasMain ? "secondary" : "main");

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${idPrefix}-type`} className={labelClass}>
            Type d&apos;objectif
          </label>
          <select
            id={`${idPrefix}-type`}
            name="goalType"
            defaultValue={v?.goalType ?? ""}
            onChange={(event) => setGoalType(event.target.value)}
            className={inputClass}
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
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${idPrefix}-date`} className={labelClass}>
            Date cible{" "}
            <span className="font-normal text-muted">
              ({isCompetition ? "date de la compétition" : "facultatif"})
            </span>
          </label>
          <input
            id={`${idPrefix}-date`}
            name="targetDate"
            type="date"
            min={minDate}
            defaultValue={v?.targetDate}
            className={`${inputClass} font-mono`}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${idPrefix}-time`} className={labelClass}>
            Temps visé <span className="font-normal text-muted">(facultatif)</span>
          </label>
          <input
            id={`${idPrefix}-time`}
            name="targetTime"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            placeholder="Ex. : 1:15:00"
            defaultValue={v?.targetTime}
            className={`${inputClass} font-mono`}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Segmented
          name="priority"
          legend="Priorité"
          defaultValue={defaultPriority}
          options={[
            { value: "main", label: "Principal" },
            { value: "secondary", label: "Secondaire" },
          ]}
        />
        {hasMain ? (
          <p className={hintClass}>
            Choisir « Principal » fait passer l&apos;objectif principal actuel en secondaire.
          </p>
        ) : null}
      </div>

      <label className="flex w-fit cursor-pointer items-center gap-2.5 text-small font-medium">
        <input
          type="checkbox"
          name="isCompetition"
          checked={isCompetition}
          onChange={(event) => setIsCompetition(event.target.checked)}
          className="size-4 accent-[var(--accent)]"
        />
        C&apos;est une compétition
      </label>

      {isCompetition ? (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label htmlFor={`${idPrefix}-competition`} className={labelClass}>
              Nom de la compétition
            </label>
            <input
              id={`${idPrefix}-competition`}
              name="competitionName"
              type="text"
              maxLength={120}
              autoComplete="off"
              placeholder="Ex. : Hyrox Bruxelles"
              defaultValue={v?.competitionName}
              className={inputClass}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor={`${idPrefix}-location`} className={labelClass}>
              Lieu <span className="font-normal text-muted">(facultatif)</span>
            </label>
            <input
              id={`${idPrefix}-location`}
              name="competitionLocation"
              type="text"
              maxLength={120}
              autoComplete="off"
              defaultValue={v?.competitionLocation}
              className={inputClass}
            />
          </div>
          {goalType === "hyrox" ? (
            <div className="flex flex-col gap-1.5">
              <label htmlFor={`${idPrefix}-hyrox-category`} className={labelClass}>
                Catégorie Hyrox
              </label>
              <select
                id={`${idPrefix}-hyrox-category`}
                name="hyroxCategory"
                defaultValue={v?.hyroxCategory ?? ""}
                className={inputClass}
              >
                <option value="">Pas encore décidée</option>
                {HYROX_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {hyroxCategoryLabels[category]}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-col gap-1.5">
        <label htmlFor={`${idPrefix}-description`} className={labelClass}>
          Description <span className="font-normal text-muted">(facultatif)</span>
        </label>
        <textarea
          id={`${idPrefix}-description`}
          name="description"
          rows={2}
          maxLength={500}
          placeholder="Ex. : finir sous 1 h 45 ; tenir 45 min de cardio ; squat à 100 kg"
          defaultValue={v?.description}
          className={textareaClass}
        />
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={pending}
          className={buttonClass({ variant: "inverse", size: "md" })}
        >
          {pending ? "Enregistrement…" : submitLabel}
        </button>
        {error ? (
          <p role="alert" className={errorTextClass}>
            {error}
          </p>
        ) : savedMessage ? (
          <p role="status" className="text-small text-ok">
            {savedMessage}
          </p>
        ) : null}
      </div>
    </form>
  );
}
