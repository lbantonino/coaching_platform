"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import { signUp, type SignupState, type SignupValues } from "@/features/auth/signup-actions";
import { ACCOUNT_KINDS, type AccountKind } from "@/features/auth/signup-schemas";
import { PASSWORD_MIN_LENGTH } from "@/features/auth/schemas";

import {
  authInputClass,
  Field,
  PasswordGauge,
  PasswordInput,
  SubmitButton,
  TermsCheckbox,
} from "../auth-fields";

const initialState: SignupState = {
  status: "idle",
  message: null,
  field: null,
  attempt: 0,
  values: null,
};

const kindLabels: Record<AccountKind, { desktop: string; mobile: string }> = {
  coach: { desktop: "Je suis coach", mobile: "Coach" },
  athlete: { desktop: "Je suis sportif", mobile: "Sportif" },
};

const kindHelp: Record<AccountKind, string> = {
  coach: "Tu crées ton espace coach : tes sportifs, ton agenda et tes programmes.",
  athlete: "Ton coach t'envoie tes séances. Tu les suis, tu notes tes charges et ton ressenti.",
};

const termsLinkClass = "border-b border-line-2 pb-px text-text";

// Logique inchangée (action signUp, validation serveur) ; présentation : COORY_AUTH_PAGES.md §4.
export function SignupForm() {
  const [state, formAction, pending] = useActionState(signUp, initialState);

  if (state.status === "sent") {
    return (
      <div
        role="status"
        className="flex flex-col gap-3 rounded-[20px] border border-line bg-surface p-5"
      >
        <h3 className="font-display text-[20px] font-semibold">Vérifie ta boîte mail</h3>
        <p className="text-[14px] text-muted">{state.message}</p>
        <p className="text-[14px] text-muted">
          Adresse utilisée : <span className="font-medium text-text">{state.values?.email}</span>
        </p>
      </div>
    );
  }

  return (
    // Reconstruit après chaque réponse : la saisie renvoyée s'affiche partout (sauf les mots de passe).
    <SignupFields
      key={state.attempt}
      formAction={formAction}
      pending={pending}
      error={state.status === "error" ? state.message : null}
      errorField={state.status === "error" ? state.field : null}
      values={state.values}
    />
  );
}

function SignupFields({
  formAction,
  pending,
  error,
  errorField,
  values: v,
}: {
  formAction: (formData: FormData) => void;
  pending: boolean;
  error: string | null;
  errorField: string | null;
  values: SignupValues | null;
}) {
  const [kind, setKind] = useState<AccountKind>(v?.kind === "athlete" ? "athlete" : "coach");
  const [shown, setShown] = useState(false);
  const [length, setLength] = useState(0);
  const [terms, setTerms] = useState(false);
  // Message sous le champ concerné ; une erreur générale s'affiche au-dessus du bouton.
  const errorFor = (name: string) => (errorField === name ? error : null);
  const invalid = (name: string) => (errorField === name ? true : undefined);
  const describedBy = (name: string) => (errorField === name ? `${name}-error` : undefined);

  return (
    <form action={formAction} className="flex flex-col gap-3.5" noValidate>
      <fieldset className="flex flex-col gap-2">
        <legend className="sr-only">Type de compte</legend>
        <div className="grid grid-cols-2 gap-1 rounded-[13px] border border-line bg-surface p-1">
          {ACCOUNT_KINDS.map((option) => (
            <label key={option} className="cursor-pointer">
              <input
                type="radio"
                name="kind"
                value={option}
                checked={kind === option}
                onChange={() => setKind(option)}
                className="peer sr-only"
              />
              <span className="flex h-11 items-center justify-center rounded-[9px] text-[14px] font-medium text-muted transition-colors peer-checked:bg-chip peer-checked:text-text peer-focus-visible:outline-2 peer-focus-visible:outline-accent lg:h-[42px]">
                <span className="hidden lg:inline">{kindLabels[option].desktop}</span>
                <span className="lg:hidden">{kindLabels[option].mobile}</span>
              </span>
            </label>
          ))}
        </div>
        <p className="text-[13px] text-muted">{kindHelp[kind]}</p>
      </fieldset>

      <div className="grid grid-cols-2 gap-3">
        <Field id="firstName" label="Prénom" error={errorFor("firstName")}>
          <input
            id="firstName"
            name="firstName"
            autoComplete="given-name"
            maxLength={80}
            placeholder="Camille"
            defaultValue={v?.firstName}
            aria-invalid={invalid("firstName")}
            aria-describedby={describedBy("firstName")}
            className={authInputClass("signup")}
          />
        </Field>
        <Field id="lastName" label="Nom" error={errorFor("lastName")}>
          <input
            id="lastName"
            name="lastName"
            autoComplete="family-name"
            maxLength={80}
            placeholder="Moreau"
            defaultValue={v?.lastName}
            aria-invalid={invalid("lastName")}
            aria-describedby={describedBy("lastName")}
            className={authInputClass("signup")}
          />
        </Field>
      </div>

      <Field id="email" label="Adresse e-mail" error={errorFor("email")}>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder="toi@exemple.com"
          defaultValue={v?.email}
          aria-invalid={invalid("email")}
          aria-describedby={describedBy("email")}
          className={authInputClass("signup")}
        />
      </Field>

      <div className={`grid gap-3.5 ${kind === "coach" ? "lg:grid-cols-2 lg:gap-3" : ""}`}>
        <Field id="phone" label="Téléphone" optional error={errorFor("phone")}>
          <input
            id="phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            inputMode="tel"
            placeholder="+32 …"
            defaultValue={v?.phone}
            aria-invalid={invalid("phone")}
            aria-describedby={describedBy("phone")}
            className={authInputClass("signup", "font-mono")}
          />
        </Field>
        {kind === "coach" ? (
          <Field
            id="organizationName"
            label={
              <>
                <span className="hidden lg:inline">Ton activité</span>
                <span className="lg:hidden">Nom de ton activité</span>
              </>
            }
            optional
            error={errorFor("organizationName")}
          >
            <input
              id="organizationName"
              name="organizationName"
              autoComplete="organization"
              maxLength={120}
              placeholder="Ex. Studio Renard"
              defaultValue={v?.organizationName}
              aria-invalid={invalid("organizationName")}
              aria-describedby={describedBy("organizationName")}
              className={authInputClass("signup")}
            />
          </Field>
        ) : null}
      </div>

      <Field id="password" label="Mot de passe" error={errorFor("password")}>
        <PasswordInput
          id="password"
          name="password"
          autoComplete="new-password"
          placeholder={`${PASSWORD_MIN_LENGTH} caractères minimum`}
          onChange={(event) => setLength(event.target.value.length)}
          aria-invalid={invalid("password")}
          aria-describedby={describedBy("password")}
          shown={shown}
          onToggle={() => setShown((value) => !value)}
          className={authInputClass("signup")}
        />
        <PasswordGauge length={length} min={PASSWORD_MIN_LENGTH} />
      </Field>

      <Field
        id="confirmation"
        label="Confirmation du mot de passe"
        error={errorFor("confirmation")}
      >
        <PasswordInput
          id="confirmation"
          name="confirmation"
          autoComplete="new-password"
          placeholder="Répète ton mot de passe"
          aria-invalid={invalid("confirmation")}
          aria-describedby={describedBy("confirmation")}
          shown={shown}
          onToggle={() => setShown((value) => !value)}
          withToggle={false}
          className={authInputClass("signup")}
        />
      </Field>

      <TermsCheckbox checked={terms} onChange={setTerms} error={errorFor("terms")}>
        J&apos;ai 18 ans ou plus et j&apos;accepte les{" "}
        <Link href="/conditions" target="_blank" className={termsLinkClass}>
          conditions d&apos;utilisation
        </Link>{" "}
        et la{" "}
        <Link href="/confidentialite" target="_blank" className={termsLinkClass}>
          politique de confidentialité
        </Link>
        .
      </TermsCheckbox>

      {error && !errorField ? (
        <p role="alert" className="text-[13px] font-medium text-accent-text">
          {error}
        </p>
      ) : null}

      <div className="pt-2">
        {/* Désactivé tant que les conditions ne sont pas acceptées ; le serveur revérifie tout. */}
        <SubmitButton disabled={pending || !terms}>
          {pending ? "Création…" : kind === "coach" ? "Créer mon espace coach" : "Créer mon compte"}
        </SubmitButton>
      </div>
    </form>
  );
}
