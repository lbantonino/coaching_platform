"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import { login, type LoginState } from "@/features/auth/actions";

import { authInputClass, authLinkClass, Field, PasswordInput, SubmitButton } from "../auth-fields";

const initialState: LoginState = { error: null, email: "" };

// Logique inchangée (action login, message d'erreur générique) ; présentation : COORY_AUTH_PAGES.md §3.
export function LoginForm() {
  const [state, formAction, pending] = useActionState(login, initialState);
  const [shown, setShown] = useState(false);

  return (
    <form action={formAction} className="flex flex-1 flex-col gap-4 lg:flex-none" noValidate>
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

      {/* Téléphone : bouton et lien « Créer un compte » en bas de l'écran. */}
      <div className="mt-auto flex flex-col gap-5 pt-6 lg:mt-4 lg:pt-0">
        <SubmitButton disabled={pending}>{pending ? "Connexion…" : "Se connecter"}</SubmitButton>
        <p className="text-center text-[14px] text-muted lg:hidden">
          Pas encore de compte ?{" "}
          <Link href="/inscription" className={authLinkClass}>
            Créer un compte
          </Link>
        </p>
      </div>
    </form>
  );
}
