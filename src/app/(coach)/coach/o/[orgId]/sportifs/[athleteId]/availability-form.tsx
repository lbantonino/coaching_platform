"use client";

import { useActionState } from "react";

import { buttonClass } from "@/components/ui/button";
import { errorTextClass } from "@/components/ui/form-styles";
import {
  updateAvailability,
  type AvailabilityFormValues,
  type UpdateAvailabilityState,
} from "@/features/athletes/actions";

import { AvailabilityFields } from "../athlete-fields";

const initialState: UpdateAvailabilityState = {
  error: null,
  saved: false,
  attempt: 0,
  values: null,
};

type Props = {
  organizationId: string;
  athleteId: string;
  values: AvailabilityFormValues;
};

// Les blessures et points d'attention ne sont plus ici : onglet Notes (D-56).
export function AvailabilityForm({ organizationId, athleteId, values }: Props) {
  const [state, formAction, pending] = useActionState(
    updateAvailability.bind(null, organizationId, athleteId),
    initialState,
  );
  // Après une erreur, on réaffiche la saisie ; sinon les valeurs enregistrées.
  const shown = state.values ?? values;

  return (
    // Reconstruit après chaque réponse : la saisie renvoyée (ou enregistrée) s'affiche partout.
    // Ordinateur : le formulaire remplit la carte (étirée jusqu'au bas du menu), le bouton reste en bas.
    <form
      key={state.attempt}
      action={formAction}
      className="flex flex-col gap-4 lg:flex-1"
      noValidate
    >
      <AvailabilityFields values={shown} look="fiche" />

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={pending}
          className={buttonClass({
            variant: "primary",
            size: "md",
            className: "self-start rounded-[12px]! text-[14px]! font-medium!",
          })}
        >
          {pending ? "Enregistrement…" : "Enregistrer les disponibilités"}
        </button>
        {state.error ? (
          <p role="alert" className={errorTextClass}>
            {state.error}
          </p>
        ) : state.saved ? (
          <p role="status" className="text-[13px] font-medium text-ok">
            Disponibilités enregistrées.
          </p>
        ) : null}
      </div>
    </form>
  );
}
