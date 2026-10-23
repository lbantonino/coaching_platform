"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import {
  errorTextClass,
  hintClass,
  inputClass,
  labelClass,
  primaryButtonClass,
} from "@/components/ui/form-styles";
import { segmentedGroupClass, segmentedItemClass } from "@/components/ui/segmented";
import { signUp, type SignupState, type SignupValues } from "@/features/auth/signup-actions";
import { ACCOUNT_KINDS, accountKindLabels, type AccountKind } from "@/features/auth/signup-schemas";
import { PASSWORD_MIN_LENGTH } from "@/features/auth/schemas";

const initialState: SignupState = { status: "idle", message: null, attempt: 0, values: null };

export function SignupForm() {
  const [state, formAction, pending] = useActionState(signUp, initialState);

  if (state.status === "sent") {
    return (
      <div
        role="status"
        className="flex flex-col gap-3 rounded-card border border-line bg-surface p-5"
      >
        <h2 className="text-title font-medium">Vérifie ta boîte mail</h2>
        <p className="text-small text-muted">{state.message}</p>
        <p className="text-small text-muted">
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
      values={state.values}
    />
  );
}

function SignupFields({
  formAction,
  pending,
  error,
  values: v,
}: {
  formAction: (formData: FormData) => void;
  pending: boolean;
  error: string | null;
  values: SignupValues | null;
}) {
  const [kind, setKind] = useState<AccountKind>(v?.kind === "athlete" ? "athlete" : "coach");

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      <fieldset className="flex flex-col gap-1.5">
        <legend className="mb-1.5 text-small font-medium">Type de compte</legend>
        <div className={`${segmentedGroupClass} sm:w-full`}>
          {ACCOUNT_KINDS.map((option) => (
            <label
              key={option}
              className="flex-1 cursor-pointer rounded-sm has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent"
            >
              <input
                type="radio"
                name="kind"
                value={option}
                checked={kind === option}
                onChange={() => setKind(option)}
                className="peer sr-only"
              />
              <span className={segmentedItemClass}>{accountKindLabels[option]}</span>
            </label>
          ))}
        </div>
        <p className={hintClass}>
          {kind === "coach"
            ? "Tu crées ton espace de coach : tes sportifs, ton agenda, bientôt tes programmes."
            : "Ton coach pourra ensuite te rattacher à son espace avec ton adresse e-mail."}
        </p>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="firstName" className={labelClass}>
            Prénom
          </label>
          <input
            id="firstName"
            name="firstName"
            autoComplete="given-name"
            maxLength={80}
            defaultValue={v?.firstName}
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="lastName" className={labelClass}>
            Nom
          </label>
          <input
            id="lastName"
            name="lastName"
            autoComplete="family-name"
            maxLength={80}
            defaultValue={v?.lastName}
            className={inputClass}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className={labelClass}>
          Adresse e-mail
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          defaultValue={v?.email}
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="phone" className={labelClass}>
          Téléphone <span className="font-normal text-muted">(facultatif)</span>
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          inputMode="tel"
          placeholder="+32 …"
          defaultValue={v?.phone}
          className={inputClass}
        />
      </div>

      {kind === "coach" ? (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="organizationName" className={labelClass}>
            Nom de ton activité <span className="font-normal text-muted">(facultatif)</span>
          </label>
          <input
            id="organizationName"
            name="organizationName"
            autoComplete="organization"
            maxLength={120}
            placeholder="Sinon : ton prénom et ton nom"
            defaultValue={v?.organizationName}
            className={inputClass}
          />
        </div>
      ) : null}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className={labelClass}>
          Mot de passe
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          aria-describedby="password-hint"
          className={inputClass}
        />
        <p id="password-hint" className={hintClass}>
          Au moins {PASSWORD_MIN_LENGTH} caractères.
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="confirmation" className={labelClass}>
          Confirmation du mot de passe
        </label>
        <input
          id="confirmation"
          name="confirmation"
          type="password"
          autoComplete="new-password"
          className={inputClass}
        />
      </div>

      <label className="flex items-start gap-3 text-small">
        <input type="checkbox" name="terms" className="mt-0.5 size-5 shrink-0" />
        <span>
          J&apos;ai 18 ans ou plus et j&apos;accepte les{" "}
          <Link href="/conditions" target="_blank" className="underline underline-offset-4">
            conditions d&apos;utilisation
          </Link>{" "}
          et la{" "}
          <Link href="/confidentialite" target="_blank" className="underline underline-offset-4">
            politique de confidentialité
          </Link>
          .
        </span>
      </label>

      {error ? (
        <p role="alert" className={errorTextClass}>
          {error}
        </p>
      ) : null}

      <button type="submit" disabled={pending} className={primaryButtonClass}>
        {pending ? "Création…" : "Créer mon compte"}
      </button>
    </form>
  );
}
