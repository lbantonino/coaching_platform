"use client";

import { useActionState } from "react";

import { buttonClass } from "@/components/ui/button";
import {
  errorTextClass,
  ficheGridClass,
  ficheInputClass,
  ficheLabelClass,
} from "@/components/ui/form-styles";
import { grantHealthConsentByCoach, type CoachConsentState } from "@/features/consents/actions";
import { COACH_PROOFS, coachProofLabels } from "@/features/consents/schemas";

const initialState: CoachConsentState = { error: null, attempt: 0 };

// Le coach note l'accord explicite que le sportif lui a donné, en précisant comment. Habillage de la
// fiche (maquette « Sportifs » 2i, état sans accord non dessiné) : champs de 46 px, bouton à contour.
export function HealthConsentForm({
  organizationId,
  athleteId,
}: {
  organizationId: string;
  athleteId: string;
}) {
  const [state, formAction, pending] = useActionState(
    grantHealthConsentByCoach.bind(null, organizationId, athleteId),
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      <label className="flex cursor-pointer items-start gap-2.5 text-[13.5px] leading-[1.5] text-text">
        <input
          type="checkbox"
          name="confirmed"
          className="mt-[3px] size-4 shrink-0 accent-[var(--accent)]"
        />
        Le sportif m&apos;a donné son accord explicite pour que je note ses blessures et points
        d&apos;attention.
      </label>
      <div className={ficheGridClass}>
        <div className="flex min-w-0 flex-col gap-2">
          <label htmlFor="consent-proof" className={ficheLabelClass}>
            Comment ?
          </label>
          <select id="consent-proof" name="proof" defaultValue="" className={ficheInputClass}>
            <option value="" disabled>
              Choisir…
            </option>
            {COACH_PROOFS.map((proof) => (
              <option key={proof} value={proof}>
                {coachProofLabels[proof]}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2.5">
        <button
          type="submit"
          disabled={pending}
          className={buttonClass({
            variant: "outline",
            size: "md",
            className: "rounded-[12px]! text-[14px]! font-medium!",
          })}
        >
          {pending ? "Enregistrement…" : "Enregistrer l'accord"}
        </button>
        {state.error ? (
          <p role="alert" className={errorTextClass}>
            {state.error}
          </p>
        ) : null}
      </div>
    </form>
  );
}
