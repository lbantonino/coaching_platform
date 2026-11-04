"use client";

import { useActionState, type ReactNode } from "react";

import { buttonClass } from "@/components/ui/button";
import { errorTextClass } from "@/components/ui/form-styles";
import { updateHealthNotes, type HealthNotesState } from "@/features/athletes/actions";

import { HealthConstraintsField } from "../athlete-fields";

const initialState: HealthNotesState = { error: null, saved: false, attempt: 0, value: null };

const FORM_ID = "health-notes-form";

// Blessures et points d'attention (D-56) : le champ et son bouton, seulement pendant un accord.
// Maquette « Sportifs » 2i : « Enregistrer les blessures » et « Retirer l'accord » sur la même
// rangée. Le retrait est un autre formulaire (`besideSave`) : un formulaire ne peut pas en contenir un
// autre, le bouton d'enregistrement est donc relié au sien par l'attribut `form`.
export function HealthNotesForm({
  organizationId,
  athleteId,
  value,
  besideSave,
}: {
  organizationId: string;
  athleteId: string;
  value: string;
  besideSave?: ReactNode;
}) {
  const [state, formAction, pending] = useActionState(
    updateHealthNotes.bind(null, organizationId, athleteId),
    initialState,
  );
  return (
    <>
      {/* Reconstruit après chaque réponse : la saisie renvoyée (ou enregistrée) s'affiche.
          Ordinateur : la zone prend la hauteur libre de la carte (étirée jusqu'au bas du menu). */}
      <form
        id={FORM_ID}
        key={state.attempt}
        action={formAction}
        className="flex flex-col lg:flex-auto"
        noValidate
      >
        <HealthConstraintsField
          value={state.value ?? value}
          look="fiche"
          className="lg:flex-auto"
        />
      </form>
      <div className="flex flex-wrap items-center gap-2.5">
        <button
          type="submit"
          form={FORM_ID}
          disabled={pending}
          className={buttonClass({
            variant: "primary",
            size: "md",
            className: "rounded-[12px]! text-[14px]! font-medium!",
          })}
        >
          {pending ? "Enregistrement…" : "Enregistrer les blessures"}
        </button>
        {besideSave}
        {state.error ? (
          <p role="alert" className={errorTextClass}>
            {state.error}
          </p>
        ) : state.saved ? (
          <p role="status" className="text-[13px] font-medium text-ok">
            Blessures et points d&apos;attention enregistrés.
          </p>
        ) : null}
      </div>
    </>
  );
}
