"use client";

import { useActionState, useState } from "react";

import { entryPrimaryClass, FormAlert } from "@/components/layout/entry-ui";
import { Field } from "@/components/ui/field";
import { entryInputClass } from "@/components/ui/form-styles";
import { PasswordGauge, PasswordInput } from "@/components/ui/password-input";
import { Spinner } from "@/components/ui/spinner";
import { updatePassword, type NewPasswordState } from "@/features/auth/password-actions";
import { PASSWORD_MIN_LENGTH } from "@/features/auth/schemas";

const initialState: NewPasswordState = { error: null, fields: {} };

// Nouveau mot de passe avec jauge et confirmation. Une fois enregistré, la personne arrive dans son
// espace (la session du lien de réinitialisation est déjà ouverte).
export function NewPasswordForm() {
  const [state, formAction, pending] = useActionState(updatePassword, initialState);
  const [shown, setShown] = useState(false);
  const [password, setPassword] = useState("");
  const invalid = (name: string) =>
    state.fields[name] ? { "aria-invalid": true, "aria-describedby": `${name}-error` } : {};

  return (
    <form action={formAction} className="flex flex-col gap-[22px]" noValidate>
      {state.error ? <FormAlert>{state.error}</FormAlert> : null}
      <div className="flex flex-col gap-[18px]">
        <Field id="password" label="Nouveau mot de passe" error={state.fields.password}>
          <PasswordInput
            id="password"
            name="password"
            autoComplete="new-password"
            placeholder={`${PASSWORD_MIN_LENGTH} caractères minimum`}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            {...invalid("password")}
            shown={shown}
            onToggle={() => setShown((value) => !value)}
            className={entryInputClass}
          />
          <PasswordGauge password={password} />
        </Field>
        <Field id="confirmation" label="Confirmation" error={state.fields.confirmation}>
          <PasswordInput
            id="confirmation"
            name="confirmation"
            autoComplete="new-password"
            placeholder="Répète ton mot de passe"
            {...invalid("confirmation")}
            shown={shown}
            onToggle={() => setShown((value) => !value)}
            className={entryInputClass}
          />
        </Field>
      </div>
      <button type="submit" disabled={pending} className={entryPrimaryClass}>
        {pending ? (
          <>
            <Spinner />
            Enregistrement…
          </>
        ) : (
          "Enregistrer le mot de passe"
        )}
      </button>
    </form>
  );
}
