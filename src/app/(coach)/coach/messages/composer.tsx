"use client";

import { SendHorizontal } from "lucide-react";
import { useActionState } from "react";

import { FormAlert } from "@/components/layout/entry-ui";
import { buttonClass } from "@/components/ui/button";
import { textareaClass } from "@/components/ui/form-styles";
import { sendMessage, type SendMessageState } from "@/features/messages/actions";
import { MESSAGE_MAX_LENGTH } from "@/features/messages/schemas";

const initial: SendMessageState = { error: null, attempt: 0, body: "" };

// Champ « Écrire un message… » + envoyer. Le message est enregistré dans le fil, sans e-mail ni
// WhatsApp : la phrase sous le champ le dit, pour ne jamais faire croire à un envoi.
export function Composer({
  organizationId,
  athleteId,
}: {
  organizationId: string;
  athleteId: string;
}) {
  const [state, action, pending] = useActionState(
    sendMessage.bind(null, organizationId, athleteId),
    initial,
  );
  return (
    <form action={action} className="flex flex-col gap-2 border-t border-line pt-3.5">
      {state.error ? <FormAlert>{state.error}</FormAlert> : null}
      <div className="flex items-end gap-2">
        <label htmlFor="message-body" className="sr-only">
          Ton message
        </label>
        <textarea
          // Vidé après un envoi réussi, gardé après une erreur.
          key={state.attempt}
          id="message-body"
          name="body"
          defaultValue={state.body}
          placeholder="Écrire un message…"
          maxLength={MESSAGE_MAX_LENGTH}
          rows={2}
          required
          className={`${textareaClass} min-h-[52px] flex-1 resize-none`}
        />
        <button
          type="submit"
          disabled={pending}
          aria-label="Envoyer"
          className={buttonClass({ className: "size-[52px] shrink-0 rounded-wide px-0" })}
        >
          <SendHorizontal aria-hidden size={18} strokeWidth={1.8} />
        </button>
      </div>
      <p className="text-[12px] text-muted">
        Le sportif ne voit pas encore ce fil : sa messagerie arrive avec son espace. Aucun e-mail ni
        WhatsApp n&apos;est envoyé.
      </p>
    </form>
  );
}
