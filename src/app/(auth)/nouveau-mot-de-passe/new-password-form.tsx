"use client";

import { useActionState } from "react";

import { errorTextClass, inputClass, primaryButtonClass } from "@/components/ui/form-styles";
import { updatePassword, type NewPasswordState } from "@/features/auth/password-actions";
import { PASSWORD_MIN_LENGTH } from "@/features/auth/schemas";

const initialState: NewPasswordState = { error: null };

export function NewPasswordForm() {
  const [state, formAction, pending] = useActionState(updatePassword, initialState);
  const errorProps = state.error
    ? { "aria-invalid": true, "aria-describedby": "new-password-error" }
    : {};

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-small font-medium">
          Nouveau mot de passe
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={PASSWORD_MIN_LENGTH}
          required
          aria-describedby="password-hint"
          {...errorProps}
          className={inputClass}
        />
        <p id="password-hint" className="text-small text-muted">
          Au moins {PASSWORD_MIN_LENGTH} caractères.
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="confirmation" className="text-small font-medium">
          Confirme le mot de passe
        </label>
        <input
          id="confirmation"
          name="confirmation"
          type="password"
          autoComplete="new-password"
          required
          {...errorProps}
          className={inputClass}
        />
      </div>

      {state.error ? (
        <p id="new-password-error" role="alert" className={errorTextClass}>
          {state.error}
        </p>
      ) : null}

      <button type="submit" disabled={pending} className={primaryButtonClass}>
        {pending ? "Enregistrement…" : "Enregistrer le nouveau mot de passe"}
      </button>
    </form>
  );
}
