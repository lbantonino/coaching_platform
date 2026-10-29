"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import { AccountKindCards } from "@/components/layout/account-kind-cards";
import { entryLinkClass, entryPrimaryClass, FormAlert } from "@/components/layout/entry-ui";
import { Checkbox } from "@/components/ui/checkbox";
import { Field } from "@/components/ui/field";
import { entryInputClass } from "@/components/ui/form-styles";
import { Spinner } from "@/components/ui/spinner";
import {
  completeSignup,
  type OnboardingState,
  type SignupValues,
} from "@/features/auth/signup-actions";
import type { AccountKind, BillingSetupInput } from "@/features/auth/signup-schemas";

import { BillingSetupFields } from "./billing-setup-fields";

// Dernière étape quand l'inscription n'a pas tout fourni (Google, Facebook, Apple) : type de compte,
// identité, entreprise, facturation du coach (D-69) et conditions, pré-remplis avec ce que le
// fournisseur a transmis.
type Props = { initial: SignupValues; billing: BillingSetupInput; termsAlreadyAccepted: boolean };

export function OnboardingForm({ initial, billing, termsAlreadyAccepted }: Props) {
  const [state, formAction, pending] = useActionState(completeSignup, {
    error: null,
    attempt: 0,
    values: null,
  } satisfies OnboardingState);
  return (
    <OnboardingFields
      key={state.attempt}
      formAction={formAction}
      pending={pending}
      error={state.error}
      values={state.values ?? initial}
      billing={state.billing ?? billing}
      termsChecked={state.values ? false : termsAlreadyAccepted}
    />
  );
}

function OnboardingFields({
  formAction,
  pending,
  error,
  values: v,
  billing,
  termsChecked,
}: {
  formAction: (formData: FormData) => void;
  pending: boolean;
  error: string | null;
  values: SignupValues;
  billing: BillingSetupInput;
  termsChecked: boolean;
}) {
  const [kind, setKind] = useState<AccountKind>(v.kind === "athlete" ? "athlete" : "coach");
  return (
    <form action={formAction} className="flex flex-col gap-[22px]" noValidate>
      {error ? <FormAlert>{error}</FormAlert> : null}
      <AccountKindCards value={kind} onChange={setKind} />

      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <Field id="firstName" label="Prénom">
            <input
              id="firstName"
              name="firstName"
              autoComplete="given-name"
              maxLength={80}
              defaultValue={v.firstName}
              className={entryInputClass}
            />
          </Field>
          <Field id="lastName" label="Nom">
            <input
              id="lastName"
              name="lastName"
              autoComplete="family-name"
              maxLength={80}
              defaultValue={v.lastName}
              className={entryInputClass}
            />
          </Field>
        </div>
        <Field id="phone" label="Téléphone" optional>
          <input
            id="phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            inputMode="tel"
            placeholder="+32 470 00 00 00"
            defaultValue={v.phone}
            className={`${entryInputClass} font-mono`}
          />
        </Field>
        {kind === "coach" ? (
          <Field id="organizationName" label="Nom de l'entreprise" optional>
            <input
              id="organizationName"
              name="organizationName"
              autoComplete="organization"
              maxLength={120}
              placeholder="Sinon : ton prénom et ton nom"
              defaultValue={v.organizationName}
              className={entryInputClass}
            />
          </Field>
        ) : null}
      </div>

      {kind === "coach" ? <BillingSetupFields initial={billing} /> : null}

      <Checkbox
        name="terms"
        multiline
        defaultChecked={termsChecked}
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

      <button type="submit" disabled={pending} className={entryPrimaryClass}>
        {pending ? (
          <>
            <Spinner />
            Création…
          </>
        ) : kind === "coach" ? (
          "Créer mon espace coach"
        ) : (
          "Terminer"
        )}
      </button>
    </form>
  );
}
