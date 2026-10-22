"use client";

import { useActionState } from "react";

import { buttonClass } from "@/components/ui/button";
import { errorTextClass, inputClass, labelClass } from "@/components/ui/form-styles";
import { updateCoachName } from "@/features/coach/actions";

export function CoachNameForm({
  firstName,
  lastName,
  companyName,
}: {
  firstName: string;
  lastName: string;
  companyName: string;
}) {
  const [state, formAction, pending] = useActionState(updateCoachName, {
    error: null,
    saved: false,
    attempt: 0,
  });
  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="coach-first-name" className={labelClass}>
            Prénom
          </label>
          <input
            id="coach-first-name"
            name="firstName"
            autoComplete="given-name"
            maxLength={80}
            defaultValue={firstName}
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="coach-last-name" className={labelClass}>
            Nom <span className="font-normal text-muted">(facultatif)</span>
          </label>
          <input
            id="coach-last-name"
            name="lastName"
            autoComplete="family-name"
            maxLength={80}
            defaultValue={lastName}
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <label htmlFor="coach-company" className={labelClass}>
            Entreprise <span className="font-normal text-muted">(facultatif)</span>
          </label>
          <input
            id="coach-company"
            name="companyName"
            autoComplete="organization"
            maxLength={120}
            placeholder="Nom de ton activité, tel qu'il apparaîtra sur tes factures"
            defaultValue={companyName}
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
          {pending ? "Enregistrement…" : "Enregistrer"}
        </button>
        {state.error ? (
          <p role="alert" className={errorTextClass}>
            {state.error}
          </p>
        ) : state.saved ? (
          <p role="status" className="text-small text-ok">
            Profil enregistré.
          </p>
        ) : null}
      </div>
    </form>
  );
}
