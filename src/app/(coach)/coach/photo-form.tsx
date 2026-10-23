"use client";

import { Camera, Trash2 } from "lucide-react";
import { useActionState } from "react";

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
// (onglet Profil de sa fiche) et pour le coach (Mon profil).
export function PhotoForm({ name, photoPath, upload, remove }: Props) {
  const [state, formAction, pending] = useActionState(upload, {
    error: null,
    saved: false,
    attempt: 0,
  });
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <Avatar name={name} size="xl" photoPath={photoPath} />
      <div className="flex flex-col gap-2">
        {/* Reconstruit après chaque réponse : le champ fichier se vide. */}
        <form key={state.attempt} action={formAction} className="flex flex-wrap items-center gap-2">
          <label htmlFor="photo-file" className="sr-only">
            Photo de profil
          </label>
          <input
            id="photo-file"
            name="photo"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="max-w-full text-small text-muted file:mr-3 file:h-8 file:cursor-pointer file:rounded-[8px] file:border file:border-line-2 file:bg-transparent file:px-3 file:text-caption file:font-semibold file:text-text"
          />
          <button
            type="submit"
            disabled={pending}
            className={buttonClass({ variant: "inverse", size: "sm" })}
          >
            <Camera aria-hidden size={14} strokeWidth={1.8} />
            {pending ? "Envoi…" : photoPath ? "Changer la photo" : "Ajouter la photo"}
          </button>
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
