"use client";

import { useActionState } from "react";

import { errorTextClass, inputClass, primaryButtonClass } from "@/components/ui/form-styles";
import { requestPasswordReset, type ResetRequestState } from "@/features/auth/password-actions";

const initialState: ResetRequestState = { status: "idle", message: null, email: "" };

export function ResetRequestForm() {
  const [state, formAction, pending] = useActionState(requestPasswordReset, initialState);

  if (state.status === "sent") {
    return (
      <p role="status" className="rounded-lg border border-zinc-300 p-4 dark:border-zinc-700">
        {state.message}
      </p>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm font-medium">
          Adresse e-mail
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          defaultValue={state.email}
          aria-invalid={state.status === "error" ? true : undefined}
          aria-describedby={state.status === "error" ? "reset-error" : undefined}
          className={inputClass}
        />
      </div>

      {state.status === "error" ? (
        <p id="reset-error" role="alert" className={errorTextClass}>
          {state.message}
        </p>
      ) : null}

      <button type="submit" disabled={pending} className={primaryButtonClass}>
        {pending ? "Envoi…" : "Recevoir un lien de réinitialisation"}
      </button>
    </form>
  );
}
