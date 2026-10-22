"use client";

import { useActionState } from "react";

import { buttonClass } from "@/components/ui/button";
import { errorTextClass, inputClass, labelClass } from "@/components/ui/form-styles";
import { grantHealthConsentByCoach, type CoachConsentState } from "@/features/consents/actions";
import { COACH_PROOFS, coachProofLabels } from "@/features/consents/schemas";

const initialState: CoachConsentState = { error: null, attempt: 0 };

// Le coach note l'accord explicite que le sportif lui a donné, en précisant comment.
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
    <form action={formAction} className="flex flex-col gap-3" noValidate>
      <label className="flex cursor-pointer items-start gap-2.5 text-small">
        <input
          type="checkbox"
          name="confirmed"
          className="mt-0.5 size-4 shrink-0 accent-[var(--accent)]"
        />
        Le sportif m&apos;a donné son accord explicite pour que je note ses contraintes physiques.
      </label>
      <div className="flex flex-col gap-1.5 md:w-1/2">
        <label htmlFor="consent-proof" className={labelClass}>
          Comment ?
        </label>
        <select id="consent-proof" name="proof" defaultValue="" className={inputClass}>
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
      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={pending}
          className={buttonClass({ variant: "outline", size: "md" })}
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
