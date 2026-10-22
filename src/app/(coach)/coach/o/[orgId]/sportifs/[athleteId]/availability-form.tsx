"use client";

import { Check } from "lucide-react";
import { useActionState } from "react";

import { buttonClass } from "@/components/ui/button";
import {
  checkboxChipClass,
  errorTextClass,
  hintClass,
  inputClass,
  labelClass,
} from "@/components/ui/form-styles";
import {
  updateAvailability,
  type AvailabilityFormValues,
  type UpdateAvailabilityState,
} from "@/features/athletes/actions";
import { WEEK_DAYS, weekDayLabels } from "@/features/athletes/schemas";

const initialState: UpdateAvailabilityState = {
  error: null,
  saved: false,
  attempt: 0,
  values: null,
};

type Props = {
  organizationId: string;
  athleteId: string;
  // Le champ « contraintes physiques » n'existe que pendant qu'un accord du sportif est en cours.
  hasConsent: boolean;
  values: AvailabilityFormValues;
};

export function AvailabilityForm({ organizationId, athleteId, hasConsent, values }: Props) {
  const [state, formAction, pending] = useActionState(
    updateAvailability.bind(null, organizationId, athleteId),
    initialState,
  );
  // Après une erreur, on réaffiche la saisie ; sinon les valeurs enregistrées.
  const shown = state.values ?? values;

  return (
    // Reconstruit après chaque réponse : la saisie renvoyée (ou enregistrée) s'affiche partout.
    <form key={state.attempt} action={formAction} className="flex flex-col gap-5" noValidate>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="sessionsPerWeek" className={labelClass}>
            Séances par semaine
          </label>
          <input
            id="sessionsPerWeek"
            name="sessionsPerWeek"
            type="number"
            inputMode="numeric"
            min={1}
            max={14}
            defaultValue={shown.sessionsPerWeek}
            className={`${inputClass} font-mono`}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="maxSessionMinutes" className={labelClass}>
            Durée maximale d&apos;une séance (min)
          </label>
          <input
            id="maxSessionMinutes"
            name="maxSessionMinutes"
            type="number"
            inputMode="numeric"
            min={10}
            max={300}
            step={5}
            defaultValue={shown.maxSessionMinutes}
            className={`${inputClass} font-mono`}
          />
        </div>
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className={`${labelClass} mb-2`}>Jours disponibles</legend>
        <div className="flex flex-wrap gap-2">
          {WEEK_DAYS.map((day) => (
            <label key={day} className={checkboxChipClass}>
              <input
                type="checkbox"
                name="availableDays"
                value={day}
                defaultChecked={shown.availableDays.includes(day)}
                className="sr-only"
              />
              <Check
                aria-hidden
                size={14}
                strokeWidth={2}
                className="hidden group-has-checked:block"
              />
              {weekDayLabels[day]}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="scheduleConstraints" className={labelClass}>
          Contraintes d&apos;organisation
        </label>
        <textarea
          id="scheduleConstraints"
          name="scheduleConstraints"
          rows={2}
          maxLength={500}
          placeholder="Ex. : déplacements le jeudi ; séances avant 8 h en semaine"
          defaultValue={shown.scheduleConstraints}
          className={`${inputClass} h-auto py-3`}
        />
      </div>

      {hasConsent ? (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="healthConstraints" className={labelClass}>
            Contraintes physiques
          </label>
          <textarea
            id="healthConstraints"
            name="healthConstraints"
            rows={2}
            maxLength={300}
            aria-describedby="health-hint"
            placeholder="Ex. : genou droit sensible en descente ; éviter les sauts"
            defaultValue={shown.healthConstraints}
            className={`${inputClass} h-auto py-3`}
          />
          <p id="health-hint" className={hintClass}>
            Seulement ce qui change l&apos;entraînement : pas de diagnostic, pas de traitement.
          </p>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={pending}
          className={buttonClass({ variant: "inverse", size: "md" })}
        >
          {pending ? "Enregistrement…" : "Enregistrer les disponibilités"}
        </button>
        {state.error ? (
          <p role="alert" className={errorTextClass}>
            {state.error}
          </p>
        ) : state.saved ? (
          <p role="status" className="text-small text-ok">
            Disponibilités enregistrées.
          </p>
        ) : null}
      </div>
    </form>
  );
}
