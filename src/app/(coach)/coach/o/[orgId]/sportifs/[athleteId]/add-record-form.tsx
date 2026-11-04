"use client";

import { useActionState, useState } from "react";

import { buttonClass } from "@/components/ui/button";
import {
  errorTextClass,
  ficheGridClass,
  ficheHintClass,
  ficheInputClass,
  ficheLabelClass,
} from "@/components/ui/form-styles";
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
    <div className="flex flex-col gap-4">
      <h3 className="text-[15px] leading-[19px] font-semibold">Ajouter une performance</h3>
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
      {/* Habillage de la fiche (maquette « Sportifs », page 2g). */}
      <div className={ficheGridClass}>
        <div className="flex min-w-0 flex-col gap-2">
          <label htmlFor="rec-event" className={ficheLabelClass}>
            Épreuve
          </label>
          <select
            id="rec-event"
            name="event"
            value={event}
            onChange={(e) => setEvent(e.target.value as RecordEvent)}
            className={ficheInputClass}
          >
            {RECORD_EVENTS.map((candidate) => (
              <option key={candidate} value={candidate}>
                {recordEventLabels[candidate]}
              </option>
            ))}
          </select>
        </div>

        {event === "hyrox" ? (
          <div className="flex min-w-0 flex-col gap-2">
            <label htmlFor="rec-category" className={ficheLabelClass}>
              Catégorie Hyrox
            </label>
            <select
              id="rec-category"
              name="hyroxCategory"
              defaultValue={v?.hyroxCategory ?? ""}
              className={ficheInputClass}
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

        <div className="flex min-w-0 flex-col gap-2">
          <label htmlFor="rec-time" className={ficheLabelClass}>
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
            className={ficheInputClass}
          />
          <p id="rec-time-hint" className={ficheHintClass}>
            mm:ss ou h:mm:ss, temps officiel ou chrono final.
          </p>
        </div>

        <div className="flex min-w-0 flex-col gap-2">
          <label htmlFor="rec-date" className={ficheLabelClass}>
            Date de la performance
          </label>
          <input
            id="rec-date"
            name="achievedOn"
            type="date"
            max={today}
            defaultValue={v?.achievedOn || today}
            className={ficheInputClass}
          />
        </div>

        <div className="flex min-w-0 flex-col gap-2">
          <label htmlFor="rec-race" className={ficheLabelClass}>
            Course <span className="font-normal text-faint">(facultatif)</span>
          </label>
          <input
            id="rec-race"
            name="raceName"
            autoComplete="off"
            maxLength={120}
            placeholder="Ex. : 20 km de Bruxelles, Hyrox Gent"
            defaultValue={v?.raceName}
            className={ficheInputClass}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={pending}
          className={buttonClass({
            variant: "primary",
            size: "md",
            className: "rounded-[12px]! text-[14px]! font-medium!",
          })}
        >
          {pending ? "Enregistrement…" : "Ajouter la performance"}
        </button>
        {error ? (
          <p role="alert" className={errorTextClass}>
            {error}
          </p>
        ) : justSaved ? (
          <p role="status" className="text-[13px] font-medium text-ok">
            Performance ajoutée.
          </p>
        ) : null}
      </div>
    </form>
  );
}
