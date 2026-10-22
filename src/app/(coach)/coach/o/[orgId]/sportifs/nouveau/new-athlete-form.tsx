"use client";

import { useActionState } from "react";

import { errorTextClass, inputClass, primaryButtonClass } from "@/components/ui/form-styles";
import { createAthlete, type NewAthleteState } from "@/features/athletes/actions";

const initialState: NewAthleteState = {
  error: null,
  values: { firstName: "", lastName: "", email: "", phone: "" },
};

export function NewAthleteForm({ organizationId }: { organizationId: string }) {
  // L'organisation est liée à l'action ; l'action la revérifie de toute façon côté serveur.
  const [state, formAction, pending] = useActionState(
    createAthlete.bind(null, organizationId),
    initialState,
  );
  const errorProps = state.error ? { "aria-describedby": "athlete-error" } : {};

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="firstName" className="text-small font-medium">
            Prénom
          </label>
          <input
            id="firstName"
            name="firstName"
            type="text"
            autoComplete="off"
            required
            maxLength={80}
            defaultValue={state.values.firstName}
            {...errorProps}
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="lastName" className="text-small font-medium">
            Nom de famille <span className="font-normal text-muted">(facultatif)</span>
          </label>
          <input
            id="lastName"
            name="lastName"
            type="text"
            autoComplete="off"
            maxLength={80}
            defaultValue={state.values.lastName}
            {...errorProps}
            className={inputClass}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-small font-medium">
          Adresse e-mail <span className="font-normal text-muted">(facultatif)</span>
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="off"
          inputMode="email"
          defaultValue={state.values.email}
          {...errorProps}
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="phone" className="text-small font-medium">
          Téléphone <span className="font-normal text-muted">(facultatif)</span>
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          autoComplete="off"
          inputMode="tel"
          placeholder="+32 …"
          defaultValue={state.values.phone}
          {...errorProps}
          className={inputClass}
        />
      </div>

      {state.error ? (
        <p id="athlete-error" role="alert" className={errorTextClass}>
          {state.error}
        </p>
      ) : null}

      <button type="submit" disabled={pending} className={primaryButtonClass}>
        {pending ? "Enregistrement…" : "Ajouter le sportif"}
      </button>
    </form>
  );
}
