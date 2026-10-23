"use client";

import { Lock } from "lucide-react";
import { useActionState, useState } from "react";

import { entryPrimaryClass, FormAlert } from "@/components/layout/entry-ui";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldError } from "@/components/ui/field";
import { entryInputClass } from "@/components/ui/form-styles";
import { PasswordGauge, PasswordInput } from "@/components/ui/password-input";
import { Spinner } from "@/components/ui/spinner";
import { PASSWORD_MIN_LENGTH } from "@/features/auth/schemas";
import { acceptInvitation, type AcceptInvitationState } from "@/features/invitations/actions";

const initialState: AcceptInvitationState = { error: null, fields: {} };

type Props = { token: string; email: string; isSignedIn: boolean };

// Acceptation de l'invitation : adresse imposée par la fiche (verrouillée), mot de passe avec jauge
// et confirmation, âge confirmé. Logique inchangée (acceptInvitation).
export function AcceptForm({ token, email, isSignedIn }: Props) {
  const [state, formAction, pending] = useActionState(
    acceptInvitation.bind(null, token),
    initialState,
  );
  const [shown, setShown] = useState(false);
  const [password, setPassword] = useState("");
  const invalid = (name: string) =>
    state.fields[name] ? { "aria-invalid": true, "aria-describedby": `${name}-error` } : {};

  return (
    <form action={formAction} className="flex flex-col gap-[22px]" noValidate>
      {state.error ? <FormAlert>{state.error}</FormAlert> : null}
      <div className="flex flex-col gap-[18px]">
        <Field id="email" label="Adresse e-mail">
          <div className="relative">
            <Lock
              aria-hidden
              size={17}
              strokeWidth={1.8}
              className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-muted"
            />
            <input
              id="email"
              type="email"
              value={email}
              readOnly
              className={`${entryInputClass} pl-11`}
            />
          </div>
        </Field>

        {isSignedIn ? null : (
          <>
            <Field id="password" label="Mot de passe" error={state.fields.password}>
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
            <Field
              id="confirmation"
              label="Confirmation du mot de passe"
              error={state.fields.confirmation}
            >
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
          </>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Checkbox name="adult" multiline {...invalid("adult")} label="J'ai 18 ans ou plus" />
        <FieldError id="adult-error" message={state.fields.adult} />
      </div>

      <button type="submit" disabled={pending} className={entryPrimaryClass}>
        {pending ? (
          <>
            <Spinner />
            Création…
          </>
        ) : isSignedIn ? (
          "Accepter l'invitation"
        ) : (
          <>
            Rejoindre l&apos;espace
            <span aria-hidden className="text-[18px]">
              →
            </span>
          </>
        )}
      </button>

      {isSignedIn ? null : (
        <p className="text-center text-[14px] text-muted">
          Tu as déjà un compte (suivi par un autre coach) ? Connecte-toi d&apos;abord, puis rouvre
          ce lien.
        </p>
      )}
    </form>
  );
}
