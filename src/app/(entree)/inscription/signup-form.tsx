"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import { AccountKindCards } from "@/components/layout/account-kind-cards";
import { entryLinkClass, entryPrimaryClass, FormAlert } from "@/components/layout/entry-ui";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldError } from "@/components/ui/field";
import { entryInputClass } from "@/components/ui/form-styles";
import { PasswordGauge, PasswordInput } from "@/components/ui/password-input";
import { Spinner } from "@/components/ui/spinner";
import { signUp, type SignupState, type SignupValues } from "@/features/auth/signup-actions";
import type { AccountKind } from "@/features/auth/signup-schemas";
import { PASSWORD_MIN_LENGTH } from "@/features/auth/schemas";

const initialState: SignupState = {
  status: "idle",
  message: null,
  fields: {},
  attempt: 0,
  values: null,
};

// Inscription (prompt Claude Design §7.1, D-30) : cartes Coach / Sportif, champs du prototype, jauge
// de robustesse. Choix d'Antonino (23/10) : le champ « Confirmation du mot de passe » est gardé.
// Logique inchangée (action signUp, validation serveur) ; après l'envoi, « Vérifie ta boîte mail ».
export function SignupForm() {
  const [state, formAction, pending] = useActionState(signUp, initialState);
  return (
    // Reconstruit après chaque réponse : la saisie renvoyée s'affiche partout (sauf les mots de passe).
    <SignupFields
      key={state.attempt}
      formAction={formAction}
      pending={pending}
      message={state.message}
      errors={state.fields}
      values={state.values}
    />
  );
}

function SignupFields({
  formAction,
  pending,
  message,
  errors,
  values: v,
}: {
  formAction: (formData: FormData) => void;
  pending: boolean;
  message: string | null;
  errors: Record<string, string>;
  values: SignupValues | null;
}) {
  const [kind, setKind] = useState<AccountKind>(v?.kind === "athlete" ? "athlete" : "coach");
  const [shown, setShown] = useState(false);
  const [password, setPassword] = useState("");
  const invalid = (name: string) =>
    errors[name] ? { "aria-invalid": true, "aria-describedby": `${name}-error` } : {};

  return (
    <form action={formAction} className="flex flex-col gap-[22px]" noValidate>
      {message ? <FormAlert>{message}</FormAlert> : null}

      <AccountKindCards value={kind} onChange={setKind} />

      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <Field id="firstName" label="Prénom" error={errors.firstName}>
            <input
              id="firstName"
              name="firstName"
              autoComplete="given-name"
              maxLength={80}
              placeholder="Camille"
              defaultValue={v?.firstName}
              {...invalid("firstName")}
              className={entryInputClass}
            />
          </Field>
          <Field id="lastName" label="Nom" error={errors.lastName}>
            <input
              id="lastName"
              name="lastName"
              autoComplete="family-name"
              maxLength={80}
              placeholder="Moreau"
              defaultValue={v?.lastName}
              {...invalid("lastName")}
              className={entryInputClass}
            />
          </Field>
        </div>

        <Field id="email" label="Adresse e-mail" error={errors.email}>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            placeholder="toi@exemple.com"
            defaultValue={v?.email}
            {...invalid("email")}
            className={entryInputClass}
          />
        </Field>

        <Field id="phone" label="Téléphone" optional error={errors.phone}>
          <input
            id="phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            inputMode="tel"
            placeholder="+32 470 00 00 00"
            defaultValue={v?.phone}
            {...invalid("phone")}
            className={`${entryInputClass} font-mono`}
          />
        </Field>

        {kind === "coach" ? (
          <Field
            id="organizationName"
            label="Nom de l'entreprise"
            optional
            error={errors.organizationName}
          >
            <input
              id="organizationName"
              name="organizationName"
              autoComplete="organization"
              maxLength={120}
              placeholder="Ex. Behybrid"
              defaultValue={v?.organizationName}
              {...invalid("organizationName")}
              className={entryInputClass}
            />
          </Field>
        ) : null}

        <Field id="password" label="Mot de passe" error={errors.password}>
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

        <Field id="confirmation" label="Confirmation du mot de passe" error={errors.confirmation}>
          <PasswordInput
            id="confirmation"
            name="confirmation"
            autoComplete="new-password"
            placeholder="Répète ton mot de passe"
            {...invalid("confirmation")}
            shown={shown}
            onToggle={() => setShown((value) => !value)}
            withToggle={false}
            className={entryInputClass}
          />
        </Field>
      </div>

      <div className="flex flex-col gap-2">
        <Checkbox
          name="terms"
          multiline
          {...invalid("terms")}
          label={
            <>
              J&apos;ai 18 ans ou plus et j&apos;accepte les{" "}
              <Link href="/conditions" target="_blank" className={entryLinkClass}>
                conditions d&apos;utilisation
              </Link>{" "}
              et la{" "}
              <Link href="/confidentialite" target="_blank" className={entryLinkClass}>
                politique de confidentialité
              </Link>
              .
            </>
          }
        />
        <FieldError id="terms-error" message={errors.terms} />
      </div>

      <button type="submit" disabled={pending} className={entryPrimaryClass}>
        {pending ? (
          <>
            <Spinner />
            Création du compte…
          </>
        ) : (
          <>
            Créer mon compte
            <span aria-hidden className="text-[18px]">
              →
            </span>
          </>
        )}
      </button>
    </form>
  );
}
