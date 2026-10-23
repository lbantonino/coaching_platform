"use client";

import { RotateCw } from "lucide-react";
import { useActionState } from "react";

import { entrySecondaryClass } from "@/components/layout/entry-ui";
import { FieldError } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { resendConfirmation, type ResendState } from "@/features/auth/signup-actions";

const initialState: ResendState = { status: "idle", message: null };

// « Renvoyer l'e-mail » : vrai renvoi par Supabase, une fois ; ensuite « E-mail renvoyé ✓ ».
export function ResendButton() {
  const [state, formAction, pending] = useActionState(resendConfirmation, initialState);
  const sent = state.status === "sent";
  return (
    <form action={formAction} className="flex flex-col gap-2">
      <button type="submit" disabled={pending || sent} className={entrySecondaryClass}>
        {pending ? (
          <>
            <Spinner />
            Envoi…
          </>
        ) : sent ? (
          "E-mail renvoyé ✓"
        ) : (
          <>
            <RotateCw aria-hidden size={17} strokeWidth={1.8} />
            Renvoyer l&apos;e-mail
          </>
        )}
      </button>
      <FieldError message={state.status === "error" ? state.message : null} />
    </form>
  );
}
