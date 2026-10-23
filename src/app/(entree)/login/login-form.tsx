"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import { login, type LoginState } from "@/features/auth/actions";

import { authInputClass, Field, PasswordInput, SubmitButton } from "../auth-fields";

const initialState: LoginState = { error: null, email: "" };

// Logique inchangée (action login, message d'erreur générique) ; présentation : COORY_AUTH_PAGES.md §3.
export function LoginForm() {
  const [state, formAction, pending] = useActionState(login, initialState);
  const [shown, setShown] = useState(false);

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      <Field id="email" label="Adresse e-mail">
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          placeholder="toi@exemple.com"
          defaultValue={state.email}
          aria-invalid={state.error ? true : undefined}
          className={authInputClass("login")}
        />
      </Field>

      <Field
        id="password"
        label="Mot de passe"
        error={state.error}
        aside={
          <Link href="/mot-de-passe-oublie" className="text-[13px] text-muted hover:text-text">
            <span className="hidden lg:inline">Mot de passe oublié ?</span>
            <span className="lg:hidden">Oublié ?</span>
          </Link>
        }
      >
        <PasswordInput
          id="password"
          name="password"
          autoComplete="current-password"
          required
          aria-invalid={state.error ? true : undefined}
          aria-describedby={state.error ? "password-error" : undefined}
          shown={shown}
          onToggle={() => setShown((value) => !value)}
          className={authInputClass("login")}
        />
      </Field>

      {/* Le lien « Créer un compte » est sous le titre de la page, sur téléphone comme sur ordinateur. */}
      <div className="mt-2 flex flex-col">
        <SubmitButton disabled={pending}>{pending ? "Connexion…" : "Se connecter"}</SubmitButton>
      </div>
    </form>
  );
}
