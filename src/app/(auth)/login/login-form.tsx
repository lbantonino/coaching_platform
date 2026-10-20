"use client";

import Link from "next/link";
import { useActionState } from "react";

import { errorTextClass, inputClass, primaryButtonClass } from "@/components/ui/form-styles";
import { login, type LoginState } from "@/features/auth/actions";

const initialState: LoginState = { error: null, email: "" };

export function LoginForm() {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-small font-medium">
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
          aria-invalid={state.error ? true : undefined}
          aria-describedby={state.error ? "login-error" : undefined}
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-baseline justify-between gap-4">
          <label htmlFor="password" className="text-small font-medium">
            Mot de passe
          </label>
          <Link
            href="/mot-de-passe-oublie"
            className="text-small text-muted underline underline-offset-4 hover:text-text"
          >
            Mot de passe oublié ?
          </Link>
        </div>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          aria-invalid={state.error ? true : undefined}
          aria-describedby={state.error ? "login-error" : undefined}
          className={inputClass}
        />
      </div>

      {state.error ? (
        <p id="login-error" role="alert" className={errorTextClass}>
          {state.error}
        </p>
      ) : null}

      <button type="submit" disabled={pending} className={primaryButtonClass}>
        {pending ? "Connexion…" : "Se connecter"}
      </button>
    </form>
  );
}
