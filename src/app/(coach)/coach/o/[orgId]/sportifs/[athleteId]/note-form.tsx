"use client";

import { useActionState } from "react";

import { buttonClass } from "@/components/ui/button";
import { errorTextClass, hintClass, inputClass, labelClass } from "@/components/ui/form-styles";
import { saveNote, type SaveNoteState } from "@/features/notes/actions";
import { NOTE_MAX_LENGTH, type NoteVisibility } from "@/features/notes/schemas";

const initialState: SaveNoteState = { error: null, saved: false, attempt: 0, body: null };

// Une note du coach (privée ou visible par le sportif). Vider le texte puis enregistrer supprime la note.
export function NoteForm({
  organizationId,
  athleteId,
  visibility,
  label,
  hint,
  placeholder,
  body,
}: {
  organizationId: string;
  athleteId: string;
  visibility: NoteVisibility;
  label: string;
  hint: string;
  placeholder: string;
  body: string;
}) {
  const [state, formAction, pending] = useActionState(
    saveNote.bind(null, organizationId, athleteId, visibility),
    initialState,
  );
  const id = `note-${visibility}`;

  return (
    // Reconstruit après chaque réponse : la saisie renvoyée (ou enregistrée) s'affiche.
    <form key={state.attempt} action={formAction} className="flex flex-col gap-3" noValidate>
      <div className="flex flex-col gap-1.5">
        <label htmlFor={id} className={labelClass}>
          {label}
        </label>
        <textarea
          id={id}
          name="body"
          rows={4}
          maxLength={NOTE_MAX_LENGTH}
          aria-describedby={`${id}-hint`}
          placeholder={placeholder}
          defaultValue={state.body ?? body}
          className={`${inputClass} h-auto py-3`}
        />
        <p id={`${id}-hint`} className={hintClass}>
          {hint}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={pending}
          className={buttonClass({ variant: "inverse", size: "md" })}
        >
          {pending ? "Enregistrement…" : `Enregistrer : ${label.toLowerCase()}`}
        </button>
        {state.error ? (
          <p role="alert" className={errorTextClass}>
            {state.error}
          </p>
        ) : state.saved ? (
          <p role="status" className="text-small text-ok">
            Note enregistrée.
          </p>
        ) : null}
      </div>
    </form>
  );
}
