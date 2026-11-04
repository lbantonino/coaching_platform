"use client";

import { useActionState } from "react";

import { buttonClass } from "@/components/ui/button";
import { errorTextClass, ficheTextareaClass } from "@/components/ui/form-styles";
import { saveNote, type SaveNoteState } from "@/features/notes/actions";
import { NOTE_MAX_LENGTH, type NoteVisibility } from "@/features/notes/schemas";

const initialState: SaveNoteState = { error: null, saved: false, attempt: 0, body: null };

// Une note du coach, dans sa carte (maquette « Sportifs » 2i) : le champ est nommé par le titre de la
// carte (`labelledBy`) et décrit par son sous-titre (`describedBy`) ; « Enregistrer » à gauche, la date
// de mise à jour à droite (en dessous sur téléphone). Vider le texte puis enregistrer supprime la note.
export function NoteForm({
  organizationId,
  athleteId,
  visibility,
  label,
  labelledBy,
  describedBy,
  placeholder,
  body,
  updatedLabel,
}: {
  organizationId: string;
  athleteId: string;
  visibility: NoteVisibility;
  label: string;
  labelledBy: string;
  describedBy: string;
  placeholder: string;
  body: string;
  // « Mise à jour le … », absent tant que la note n'existe pas.
  updatedLabel: string | null;
}) {
  const [state, formAction, pending] = useActionState(
    saveNote.bind(null, organizationId, athleteId, visibility),
    initialState,
  );

  return (
    // Reconstruit après chaque réponse : la saisie renvoyée (ou enregistrée) s'affiche.
    <form key={state.attempt} action={formAction} className="flex flex-col gap-4" noValidate>
      <textarea
        id={`note-${visibility}`}
        name="body"
        rows={2}
        maxLength={NOTE_MAX_LENGTH}
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
        placeholder={placeholder}
        defaultValue={state.body ?? body}
        className={ficheTextareaClass}
      />
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-4">
          <button
            type="submit"
            disabled={pending}
            className={buttonClass({
              variant: "primary",
              size: "md",
              className: "rounded-[12px]! text-[14px]! font-medium!",
            })}
          >
            {pending ? (
              "Enregistrement…"
            ) : (
              <>
                Enregistrer<span className="sr-only"> : {label.toLowerCase()}</span>
              </>
            )}
          </button>
          {state.error ? (
            <p role="alert" className={errorTextClass}>
              {state.error}
            </p>
          ) : state.saved ? (
            <p role="status" className="text-[13px] font-medium text-ok">
              Note enregistrée.
            </p>
          ) : null}
        </div>
        {updatedLabel ? (
          <p className="text-[12.5px] leading-4 text-faint">Mise à jour le {updatedLabel}</p>
        ) : null}
      </div>
    </form>
  );
}
