"use client";

import { useActionState, useState } from "react";

import { buttonClass } from "@/components/ui/button";
import { errorTextClass, hintClass, inputClass, labelClass } from "@/components/ui/form-styles";
import { Segmented } from "@/components/ui/segmented";
import { addReference, type AddReferenceState } from "@/features/references/actions";
import {
  referenceGroup,
  referenceKindLabels,
  type ReferenceFormInput,
  type ReferenceKind,
} from "@/features/references/schemas";

const initialState: AddReferenceState = { error: null, saved: 0, attempt: 0, values: null };

const groups: { label: string; kinds: ReferenceKind[] }[] = [
  {
    label: "Allures running",
    kinds: [
      "pace_easy",
      "pace_tempo",
      "pace_threshold",
      "pace_5k",
      "pace_10k",
      "pace_half",
      "pace_marathon",
      "pace_race",
    ],
  },
  { label: "Fréquence cardiaque", kinds: ["hr_max", "hr_rest"] },
  { label: "Musculation / Hyrox", kinds: ["strength_load"] },
];

type Props = { organizationId: string; athleteId: string; today: string };

export function AddReferenceForm({ organizationId, athleteId, today }: Props) {
  const [state, formAction, pending] = useActionState(
    addReference.bind(null, organizationId, athleteId),
    initialState,
  );

  return (
    <div className="flex flex-col gap-3 border-t border-line pt-5">
      <h3 className="text-small font-medium">Ajouter une mesure</h3>
      {/* Reconstruit après chaque réponse : vide après un ajout, saisie renvoyée après une erreur. */}
      <ReferenceFields
        key={state.attempt}
        formAction={formAction}
        pending={pending}
        today={today}
        error={state.error}
        values={state.values}
        justSaved={state.saved > 0 && state.error === null}
      />
    </div>
  );
}

function ReferenceFields({
  formAction,
  pending,
  today,
  error,
  values,
  justSaved,
}: {
  formAction: (formData: FormData) => void;
  pending: boolean;
  today: string;
  error: string | null;
  values: ReferenceFormInput | null;
  justSaved: boolean;
}) {
  // Après une erreur, on réaffiche la saisie (React 19 vide le formulaire après chaque envoi),
  // y compris le type choisi : sinon la mesure suivante partirait sous un autre type.
  const v = values;
  const [kind, setKind] = useState<ReferenceKind>(
    v && v.kind in referenceKindLabels ? (v.kind as ReferenceKind) : "pace_easy",
  );
  const group = referenceGroup(kind);

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="ref-kind" className={labelClass}>
            Type de repère
          </label>
          <select
            id="ref-kind"
            name="kind"
            value={kind}
            onChange={(event) => setKind(event.target.value as ReferenceKind)}
            className={inputClass}
          >
            {groups.map((g) => (
              <optgroup key={g.label} label={g.label}>
                {g.kinds.map((k) => (
                  <option key={k} value={k}>
                    {referenceKindLabels[k]}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        {group === "pace" ? (
          <div className="flex flex-col gap-1.5">
            <label htmlFor="ref-pace" className={labelClass}>
              Allure (min/km)
            </label>
            <input
              id="ref-pace"
              name="pace"
              inputMode="numeric"
              autoComplete="off"
              placeholder="4:55 ou 6:40-7:15"
              defaultValue={v?.pace}
              aria-describedby="ref-pace-hint"
              className={`${inputClass} font-mono`}
            />
            <p id="ref-pace-hint" className={hintClass}>
              Une allure ou une plage, secondes sur deux chiffres.
            </p>
          </div>
        ) : null}

        {group === "hr" ? (
          <div className="flex flex-col gap-1.5">
            <label htmlFor="ref-bpm" className={labelClass}>
              Fréquence cardiaque (bpm)
            </label>
            <input
              id="ref-bpm"
              name="bpm"
              type="number"
              inputMode="numeric"
              min={30}
              max={240}
              defaultValue={v?.bpm}
              className={`${inputClass} font-mono`}
            />
          </div>
        ) : null}

        {group === "strength" ? (
          <>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="ref-exercise" className={labelClass}>
                Exercice
              </label>
              <input
                id="ref-exercise"
                name="exercise"
                autoComplete="off"
                maxLength={80}
                placeholder="Squat, Sled push…"
                defaultValue={v?.exercise}
                className={inputClass}
              />
            </div>
            <div className="grid grid-cols-2 gap-4 md:col-span-2">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="ref-load" className={labelClass}>
                  Charge (kg)
                </label>
                <input
                  id="ref-load"
                  name="loadKg"
                  inputMode="decimal"
                  autoComplete="off"
                  defaultValue={v?.loadKg}
                  className={`${inputClass} font-mono`}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="ref-reps" className={labelClass}>
                  Répétitions <span className="font-normal text-muted">(facultatif)</span>
                </label>
                <input
                  id="ref-reps"
                  name="reps"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={100}
                  defaultValue={v?.reps}
                  className={`${inputClass} font-mono`}
                />
              </div>
            </div>
          </>
        ) : null}

        <div className="flex flex-col gap-1.5">
          <label htmlFor="ref-date" className={labelClass}>
            Date de la mesure
          </label>
          <input
            id="ref-date"
            name="measuredOn"
            type="date"
            max={today}
            defaultValue={v?.measuredOn || today}
            className={`${inputClass} font-mono`}
          />
        </div>
      </div>

      <Segmented
        name="source"
        legend="Source"
        defaultValue={(v?.source as "test" | "observed" | "coach_estimate" | undefined) || "test"}
        options={[
          { value: "test", label: "Test" },
          { value: "observed", label: "Constaté" },
          { value: "coach_estimate", label: "Estimation coach" },
        ]}
      />

      <div className="flex flex-col gap-1.5">
        <label htmlFor="ref-note" className={labelClass}>
          Note privée du coach <span className="font-normal text-muted">(facultatif)</span>
        </label>
        <textarea
          id="ref-note"
          name="note"
          rows={2}
          maxLength={500}
          defaultValue={v?.note}
          className={`${inputClass} h-auto py-3`}
        />
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={pending}
          className={buttonClass({ variant: "inverse", size: "md" })}
        >
          {pending ? "Enregistrement…" : "Ajouter la mesure"}
        </button>
        {error ? (
          <p role="alert" className={errorTextClass}>
            {error}
          </p>
        ) : justSaved ? (
          <p role="status" className="text-small text-ok">
            Mesure ajoutée.
          </p>
        ) : null}
      </div>
    </form>
  );
}
