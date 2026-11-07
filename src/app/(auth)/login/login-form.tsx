"use client";

import { ArrowRight, Lock, Mail } from "lucide-react";
import Link from "next/link";
import { useActionState, useState } from "react";

import {
  AuthCheckbox,
  AuthField,
  entryLinkClass,
  entryPrimaryClass,
  FormAlert,
} from "@/components/layout/entry-ui";
import { authInputClass, authPasswordClass } from "@/components/ui/form-styles";
import { PasswordInput } from "@/components/ui/password-input";
import { Spinner } from "@/components/ui/spinner";
import { login, type LoginState } from "@/features/auth/actions";
import { useWideScreen } from "@/lib/use-wide-screen";

const initialState: LoginState = { error: null, fields: {}, email: "" };

// Formulaire de connexion (maquette du 06/11/2026, D-139). Logique inchangée (action login, message
// générique qui ne révèle jamais si un compte existe), plus « Se souvenir de moi » : décochée, la
// session s'efface à la fermeture du navigateur (voir lib/supabase/session-cookies.ts).
// Espacements : 10 px entre les lignes sur téléphone (4 px seulement au-dessus du bouton), 18 px sur
// ordinateur (maquette).
export function LoginForm() {
  const [state, formAction, pending] = useActionState(login, initialState);
  const [shown, setShown] = useState(false);
  const wide = useWideScreen();
  const fieldProps = (name: string) =>
    state.fields[name]
      ? { "aria-invalid": true, "aria-describedby": `${name}-error` }
      : state.error
        ? { "aria-describedby": "login-error" }
        : {};

  return (
    <form
      action={formAction}
      className="flex flex-col gap-2.5 pt-5 lg:gap-[18px] lg:pt-[18px]"
      noValidate
    >
      {state.error ? <FormAlert id="login-error">{state.error}</FormAlert> : null}
      <AuthField id="email" label="Adresse e-mail" icon={Mail} error={state.fields.email}>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          autoCapitalize="none"
          placeholder="ton@email.com"
          defaultValue={state.email}
          disabled={pending}
          {...fieldProps("email")}
          className={authInputClass}
        />
      </AuthField>
      <AuthField id="password" label="Mot de passe" icon={Lock} error={state.fields.password}>
        <PasswordInput
          id="password"
          name="password"
          autoComplete="current-password"
          placeholder={wide ? "Ton mot de passe" : "Mot de passe"}
          disabled={pending}
          {...fieldProps("password")}
          shown={shown}
          onToggle={() => setShown((value) => !value)}
          iconSize={18}
          className={authPasswordClass}
        />
      </AuthField>
      <div className="flex min-h-11 items-center justify-between gap-3 lg:min-h-0">
        <AuthCheckbox name="remember" label="Se souvenir de moi" disabled={pending} />
        <Link
          href="/mot-de-passe-oublie"
          className={`${entryLinkClass} flex min-h-11 items-center text-[13.5px] leading-[normal] font-semibold lg:min-h-0 lg:text-[13px]`}
        >
          {/* Téléphone : « Oublié ? » à l'écran, le nom complet pour les lecteurs d'écran. */}
          <span aria-hidden className="lg:hidden">
            Oublié ?
          </span>
          <span className="max-lg:sr-only">Mot de passe oublié ?</span>
        </Link>
      </div>
      <button type="submit" disabled={pending} className={`${entryPrimaryClass} -mt-1.5 lg:mt-0`}>
        {pending ? (
          <>
            <Spinner />
            Connexion…
          </>
        ) : (
          <>
            Se connecter
            <ArrowRight aria-hidden size={18} strokeWidth={2} />
          </>
        )}
      </button>
    </form>
  );
}
