"use client";

import { SendHorizontal } from "lucide-react";
import { useActionState, useRef, useState } from "react";

import { FormAlert } from "@/components/layout/entry-ui";
import { sendMessage, type SendMessageState } from "@/features/messages/actions";
import { MESSAGE_MAX_LENGTH } from "@/features/messages/schemas";

const initial: SendMessageState = { error: null, attempt: 0, body: "" };

// Champ « Écrire un message… » + envoyer (kit « Coory Pages », 07, D-131) : Entrée envoie,
// Maj + Entrée passe à la ligne ; « Envoyer » grisé tant que le champ est vide. Pas de trombone
// (décision 13 : les pièces jointes viendront plus tard). Le message est enregistré dans le fil, sans
// e-mail ni WhatsApp : la phrase sous le champ le dit, pour ne jamais faire croire à un envoi.
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
  const [text, setText] = useState(state.body);
  const [attempt, setAttempt] = useState(state.attempt);
  const form = useRef<HTMLFormElement>(null);
  // Après chaque réponse : vidé si l'envoi a réussi, gardé après une erreur.
  if (attempt !== state.attempt) {
    setAttempt(state.attempt);
    setText(state.body);
  }
  const empty = text.trim() === "";

  return (
    <form
      ref={form}
      action={action}
      className="flex flex-col gap-2 border-t border-line bg-surface px-4 pt-3.5 pb-[max(14px,env(safe-area-inset-bottom))] max-lg:sticky max-lg:bottom-0 max-lg:z-10 lg:px-[max(30px,calc((100%-860px)/2))] lg:pb-4"
    >
      {state.error ? <FormAlert>{state.error}</FormAlert> : null}
      <div className="flex items-end gap-2.5">
        <label htmlFor="message-body" className="sr-only">
          Ton message
        </label>
        <textarea
          id="message-body"
          name="body"
          value={text}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
              event.preventDefault();
              if (!empty && !pending) form.current?.requestSubmit();
            }
          }}
          placeholder="Écrire un message…"
          maxLength={MESSAGE_MAX_LENGTH}
          rows={1}
          required
          enterKeyHint="send"
          className="max-h-40 min-h-[54px] flex-1 resize-none rounded-[14px] bg-surface px-4 py-[15px] text-[16px] leading-[1.45] text-text inset-ring inset-ring-line-2 outline-none [field-sizing:content] placeholder:text-faint focus:inset-ring-[1.5px] focus:inset-ring-violet lg:text-[15px]"
        />
        <button
          type="submit"
          disabled={pending || empty}
          aria-label="Envoyer"
          className="grid size-[54px] shrink-0 place-items-center rounded-[14px] bg-cta text-on-cta transition-[background-color,color,scale] duration-150 active:scale-95 disabled:bg-dlg-check-line disabled:text-white"
        >
          <SendHorizontal aria-hidden size={19} strokeWidth={1.9} />
        </button>
      </div>
      <p className="text-[12.5px] leading-[1.45] text-muted">
        Le sportif ne voit pas encore ce fil : sa messagerie arrive avec son espace. Aucun e-mail ni
        WhatsApp n&apos;est envoyé.
      </p>
    </form>
  );
}
