"use client";

import { useActionState, useState } from "react";

import { buttonClass } from "@/components/ui/button";
import { errorTextClass, hintClass, inputClass, labelClass } from "@/components/ui/form-styles";
import { HYROX_CATEGORIES, hyroxCategoryLabels } from "@/features/goals/schemas";
import { addRecord, type AddRecordState } from "@/features/records/actions";
import {
  RECORD_EVENTS,
  recordEventLabels,
  type RecordEvent,
  type RecordFormInput,
} from "@/features/records/schemas";

const initialState: AddRecordState = { error: null, saved: 0, attempt: 0, values: null };

type Props = { organizationId: string; athleteId: string; today: string };

export function AddRecordForm({ organizationId, athleteId, today }: Props) {
  const [state, formAction, pending] = useActionState(
    addRecord.bind(null, organizationId, athleteId),
    initialState,
  );

  return (
    <div className="flex flex-col gap-3 border-t border-line pt-5">
      <h3 className="text-small font-medium">Ajouter une performance</h3>
      {/* Reconstruit après chaque réponse : vide après un ajout, saisie renvoyée après une erreur. */}
      <RecordFields
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

function RecordFields({
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
  values: RecordFormInput | null;
  justSaved: boolean;
}) {
  // Après une erreur, on réaffiche la saisie (React 19 vide le formulaire après chaque envoi).
  const v = values;
  const [event, setEvent] = useState<RecordEvent>(
    RECORD_EVENTS.find((candidate) => candidate === v?.event) ?? "run_5k",
  );

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="rec-event" className={labelClass}>
            Épreuve
          </label>
          <select
            id="rec-event"
            name="event"
            value={event}
            onChange={(e) => setEvent(e.target.value as RecordEvent)}
            className={inputClass}
          >
            {RECORD_EVENTS.map((candidate) => (
              <option key={candidate} value={candidate}>
                {recordEventLabels[candidate]}
              </option>
            ))}
          </select>
        </div>

        {event === "hyrox" ? (
          <div className="flex flex-col gap-1.5">
            <label htmlFor="rec-category" className={labelClass}>
              Catégorie Hyrox
            </label>
            <select
              id="rec-category"
              name="hyroxCategory"
              defaultValue={v?.hyroxCategory ?? ""}
              className={inputClass}
            >
              <option value="">Choisir…</option>
              {HYROX_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {hyroxCategoryLabels[category]}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        <div className="flex flex-col gap-1.5">
          <label htmlFor="rec-time" className={labelClass}>
            Temps
          </label>
          <input
            id="rec-time"
            name="time"
            inputMode="numeric"
            autoComplete="off"
            placeholder={event === "run_5k" || event === "run_10k" ? "21:45" : "1:42:30"}
            defaultValue={v?.time}
            aria-describedby="rec-time-hint"
            className={`${inputClass} font-mono`}
          />
          <p id="rec-time-hint" className={hintClass}>
            mm:ss ou h:mm:ss, temps officiel ou chrono final.
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="rec-date" className={labelClass}>
            Date de la performance
          </label>
          <input
            id="rec-date"
            name="achievedOn"
            type="date"
            max={today}
            defaultValue={v?.achievedOn || today}
            className={`${inputClass} font-mono`}
          />
        </div>

        <div className="flex flex-col gap-1.5 md:col-span-2">
          <label htmlFor="rec-race" className={labelClass}>
            Course <span className="font-normal text-muted">(facultatif)</span>
          </label>
          <input
            id="rec-race"
            name="raceName"
            autoComplete="off"
            maxLength={120}
            placeholder="Ex. : 20 km de Bruxelles, Hyrox Gent, entraînement"
            defaultValue={v?.raceName}
            className={inputClass}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={pending}
          className={buttonClass({ variant: "inverse", size: "md" })}
        >
          {pending ? "Enregistrement…" : "Ajouter la performance"}
        </button>
        {error ? (
          <p role="alert" className={errorTextClass}>
            {error}
          </p>
        ) : justSaved ? (
          <p role="status" className="text-small text-ok">
            Performance ajoutée.
          </p>
        ) : null}
      </div>
    </form>
  );
}
