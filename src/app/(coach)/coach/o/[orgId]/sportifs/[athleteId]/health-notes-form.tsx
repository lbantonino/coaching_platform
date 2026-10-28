"use client";

import { useActionState } from "react";

import { buttonClass } from "@/components/ui/button";
import { errorTextClass } from "@/components/ui/form-styles";
import { updateHealthNotes, type HealthNotesState } from "@/features/athletes/actions";

import { HealthConstraintsField } from "../athlete-fields";

const initialState: HealthNotesState = { error: null, saved: false, attempt: 0, value: null };

// Blessures et points d'attention (D-56) : le champ et son bouton, seulement pendant un accord.
export function HealthNotesForm({
  organizationId,
  athleteId,
  value,
}: {
  organizationId: string;
  athleteId: string;
  value: string;
}) {
  const [state, formAction, pending] = useActionState(
    updateHealthNotes.bind(null, organizationId, athleteId),
    initialState,
  );
  return (
    // Reconstruit après chaque réponse : la saisie renvoyée (ou enregistrée) s'affiche.
    <form key={state.attempt} action={formAction} className="flex flex-col gap-3" noValidate>
      <HealthConstraintsField value={state.value ?? value} />
      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={pending}
          className={buttonClass({ variant: "inverse", size: "md" })}
        >
          {pending ? "Enregistrement…" : "Enregistrer les blessures"}
        </button>
        {state.error ? (
          <p role="alert" className={errorTextClass}>
            {state.error}
          </p>
        ) : state.saved ? (
          <p role="status" className="text-small text-ok">
            Blessures et points d&apos;attention enregistrés.
          </p>
        ) : null}
      </div>
    </form>
  );
}
