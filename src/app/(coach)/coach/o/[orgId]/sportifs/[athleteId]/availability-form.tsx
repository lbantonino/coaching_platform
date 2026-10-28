"use client";

import { useActionState } from "react";

import { buttonClass } from "@/components/ui/button";
import { errorTextClass } from "@/components/ui/form-styles";
import {
  updateAvailability,
  type AvailabilityFormValues,
  type UpdateAvailabilityState,
} from "@/features/athletes/actions";

import { AvailabilityFields, HealthConstraintsField } from "../athlete-fields";

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
      <AvailabilityFields values={shown} />

      {hasConsent ? <HealthConstraintsField value={shown.healthConstraints} /> : null}

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
