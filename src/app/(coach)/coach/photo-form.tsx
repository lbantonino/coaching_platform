"use client";

import { Camera, Trash2 } from "lucide-react";
import { useActionState, useId, useRef } from "react";

import { Avatar } from "@/components/ui/avatar";
import { buttonClass } from "@/components/ui/button";
import { errorTextClass, hintClass } from "@/components/ui/form-styles";
import type { PhotoState } from "@/features/photos/actions";

type Props = {
  name: string;
  photoPath: string | null;
  upload: (previous: PhotoState, formData: FormData) => Promise<PhotoState>;
  remove: () => Promise<void>;
};

// Photo de profil (D-28) : aperçu, envoi d'une nouvelle photo, retrait. Utilisé pour un sportif
// (onglet Profil de sa fiche) et pour le coach (Paramètres > Profil).
// Un seul bouton « Ajouter / Changer la photo » (D-58) : il ouvre le choix du fichier, et la photo
// part dès qu'elle est choisie. Plus de champ fichier natif (« Choose File », en anglais).
export function PhotoForm({ name, photoPath, upload, remove }: Props) {
  const [state, formAction, pending] = useActionState(upload, {
    error: null,
    saved: false,
    attempt: 0,
  });
  const form = useRef<HTMLFormElement>(null);
  const inputId = useId();
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <Avatar name={name} size="xl" photoPath={photoPath} />
      <div className="flex flex-col items-start gap-2">
        {/* Reconstruit après chaque réponse : le champ fichier se vide. */}
        <form ref={form} key={state.attempt} action={formAction} className="flex">
          <input
            id={inputId}
            name="photo"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            aria-label="Photo de profil"
            disabled={pending}
            onChange={(event) => {
              if (event.currentTarget.files?.length) form.current?.requestSubmit();
            }}
            className="peer sr-only"
          />
          <label
            htmlFor={inputId}
            aria-hidden
            className={`${buttonClass({ variant: "inverse", size: "sm" })} cursor-pointer peer-focus-visible:ring-2 peer-focus-visible:ring-accent peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-bg ${
              pending ? "pointer-events-none opacity-60" : ""
            }`}
          >
            <Camera aria-hidden size={14} strokeWidth={1.8} />
            {pending ? "Envoi…" : photoPath ? "Changer la photo" : "Ajouter la photo"}
          </label>
        </form>
        <p className={hintClass}>JPEG, PNG ou WebP, 2 Mo maximum. Stockée en privé.</p>
        {state.error ? (
          <p role="alert" className={errorTextClass}>
            {state.error}
          </p>
        ) : state.saved ? (
          <p role="status" className="text-small text-ok">
            Photo enregistrée.
          </p>
        ) : null}
        {photoPath ? (
          <form action={remove}>
            <button type="submit" className={buttonClass({ variant: "ghost", size: "sm" })}>
              <Trash2 aria-hidden size={14} strokeWidth={1.8} />
              Retirer la photo
            </button>
          </form>
        ) : null}
      </div>
    </div>
  );
}
