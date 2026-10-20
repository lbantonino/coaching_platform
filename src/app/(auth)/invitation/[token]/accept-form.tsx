"use client";

import { useActionState } from "react";

import { errorTextClass, inputClass, primaryButtonClass } from "@/components/ui/form-styles";
import { PASSWORD_MIN_LENGTH } from "@/features/auth/schemas";
import { acceptInvitation, type AcceptInvitationState } from "@/features/invitations/actions";

const initialState: AcceptInvitationState = { error: null };

type Props = { token: string; email: string; isSignedIn: boolean };

export function AcceptForm({ token, email, isSignedIn }: Props) {
  const [state, formAction, pending] = useActionState(
    acceptInvitation.bind(null, token),
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-small font-medium">
          Adresse e-mail (identifiant)
        </label>
        <input id="email" type="email" value={email} readOnly className={`${inputClass}`} />
      </div>

      {isSignedIn ? null : (
        <>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-small font-medium">
              Choisis un mot de passe
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              minLength={PASSWORD_MIN_LENGTH}
              required
              aria-describedby="password-hint"
              className={inputClass}
            />
            <p id="password-hint" className="text-small text-muted">
              Au moins {PASSWORD_MIN_LENGTH} caractères.
            </p>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="confirmation" className="text-small font-medium">
              Confirme le mot de passe
            </label>
            <input
              id="confirmation"
              name="confirmation"
              type="password"
              autoComplete="new-password"
              required
              className={inputClass}
            />
          </div>
        </>
      )}

      <label className="flex items-start gap-3 text-small">
        <input type="checkbox" name="adult" required className="mt-0.5 size-5 shrink-0" />
        <span>J&apos;ai 18 ans ou plus</span>
      </label>

      {state.error ? (
        <p role="alert" className={errorTextClass}>
          {state.error}
        </p>
      ) : null}

      <button type="submit" disabled={pending} className={primaryButtonClass}>
        {pending ? "Activation…" : isSignedIn ? "Accepter l'invitation" : "Créer mon accès"}
      </button>

      {isSignedIn ? null : (
        <p className="text-small text-muted">
          Tu as déjà un compte (suivi par un autre coach) ? Connecte-toi d&apos;abord, puis rouvre
          ce lien.
        </p>
      )}
    </form>
  );
}
