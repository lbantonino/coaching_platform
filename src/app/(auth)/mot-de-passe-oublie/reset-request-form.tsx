"use client";

import { CircleCheck } from "lucide-react";
import { useActionState } from "react";

import { entryPrimaryClass, FormAlert, InfoCard } from "@/components/layout/entry-ui";
import { Field } from "@/components/ui/field";
import { entryInputClass } from "@/components/ui/form-styles";
import { Spinner } from "@/components/ui/spinner";
import { requestPasswordReset, type ResetRequestState } from "@/features/auth/password-actions";

const initialState: ResetRequestState = { status: "idle", message: null, fields: {}, email: "" };

// Demande de lien. Réponse identique que le compte existe ou non (rien n'est révélé).
export function ResetRequestForm() {
  const [state, formAction, pending] = useActionState(requestPasswordReset, initialState);

  if (state.status === "sent") {
    return (
      <div role="status">
        <InfoCard tone="ok">
          <div className="flex items-start gap-3">
            <CircleCheck
              aria-hidden
              size={20}
              strokeWidth={1.8}
              className="mt-0.5 shrink-0 text-ok"
            />
            <p className="text-[15px] leading-[1.55]">
              Si un compte existe pour <strong>{state.email}</strong>, un lien vient d&apos;être
              envoyé. Il est valable 1 h.
            </p>
          </div>
        </InfoCard>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-[22px]" noValidate>
      {state.message ? <FormAlert>{state.message}</FormAlert> : null}
      <Field id="email" label="Adresse e-mail" error={state.fields.email}>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder="ton@email.com"
          defaultValue={state.email}
          aria-invalid={state.fields.email ? true : undefined}
          aria-describedby={state.fields.email ? "email-error" : undefined}
          className={entryInputClass}
        />
      </Field>
      <button type="submit" disabled={pending} className={entryPrimaryClass}>
        {pending ? (
          <>
            <Spinner />
            Envoi…
          </>
        ) : (
          "Recevoir le lien"
        )}
      </button>
    </form>
  );
}
