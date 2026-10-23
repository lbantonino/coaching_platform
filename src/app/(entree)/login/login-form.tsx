"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import { entryPrimaryClass, FormAlert } from "@/components/layout/entry-ui";
import { Field } from "@/components/ui/field";
import { entryInputClass } from "@/components/ui/form-styles";
import { PasswordInput } from "@/components/ui/password-input";
import { Spinner } from "@/components/ui/spinner";
import { login, type LoginState } from "@/features/auth/actions";

const initialState: LoginState = { error: null, fields: {}, email: "" };

// Connexion (prompt Claude Design §7.1). Logique inchangée (action login, message générique qui ne
// révèle jamais si un compte existe) ; erreurs de saisie sous chaque champ, refus en bandeau.
export function LoginForm() {
  const [state, formAction, pending] = useActionState(login, initialState);
  const [shown, setShown] = useState(false);
  const fieldProps = (name: string) =>
    state.fields[name]
      ? { "aria-invalid": true, "aria-describedby": `${name}-error` }
      : state.error
        ? { "aria-describedby": "login-error" }
        : {};

  return (
    <form action={formAction} className="flex flex-col gap-[22px]" noValidate>
      {state.error ? <FormAlert id="login-error">{state.error}</FormAlert> : null}
      <div className="flex flex-col gap-[18px]">
        <Field id="email" label="Adresse e-mail" error={state.fields.email}>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            placeholder="toi@exemple.com"
            defaultValue={state.email}
            disabled={pending}
            {...fieldProps("email")}
            className={entryInputClass}
          />
        </Field>
        <Field
          id="password"
          label="Mot de passe"
          error={state.fields.password}
          aside={
            <Link
              href="/mot-de-passe-oublie"
              className="border-b border-line-2 text-[14px] whitespace-nowrap text-muted transition-colors duration-150 hover:text-text"
            >
              Mot de passe oublié ?
            </Link>
          }
        >
          <PasswordInput
            id="password"
            name="password"
            autoComplete="current-password"
            placeholder="Ton mot de passe"
            disabled={pending}
            {...fieldProps("password")}
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
            Connexion…
          </>
        ) : (
          <>
            Se connecter
            <span aria-hidden className="text-[18px]">
              →
            </span>
          </>
        )}
      </button>
    </form>
  );
}
