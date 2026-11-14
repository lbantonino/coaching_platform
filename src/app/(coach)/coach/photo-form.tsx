"use client";

import { Camera, Trash2 } from "lucide-react";
import { startTransition, useActionState, useId, useState } from "react";

import { Avatar } from "@/components/ui/avatar";
import { buttonClass } from "@/components/ui/button";
import { errorTextClass, hintClass } from "@/components/ui/form-styles";
import type { PhotoState } from "@/features/photos/actions";
import { PHOTO_MAX_BYTES } from "@/features/photos/validate";
import { PROFILE_PHOTO_SIDE, shrinkPhoto } from "@/lib/shrink-photo";

type Props = {
  name: string;
  photoPath: string | null;
  upload: (previous: PhotoState, formData: FormData) => Promise<PhotoState>;
  remove: () => Promise<void>;
  // « fiche » : la carte de l'onglet Profil de la fiche sportif (le titre « Photo de profil » est
  // dans le composant, id « photo-title »). « app » : Paramètres > Profil du coach.
  // « dialog » : la fenêtre des Paramètres (kit des boîtes, 33).
  look?: "app" | "fiche" | "dialog";
  // Fond des initiales (couleur de la discipline sur la fiche).
  colorClass?: string;
};

// Photo de profil (D-28) : aperçu, envoi d'une nouvelle photo, retrait. Utilisé pour un sportif
// (onglet Profil de sa fiche) et pour le coach (Paramètres > Profil).
// Un seul bouton « Ajouter / Changer la photo » (D-58) : il ouvre le choix du fichier, et la photo
// part dès qu'elle est choisie. Plus de champ fichier natif (« Choose File », en anglais).
export function PhotoForm({ name, photoPath, upload, remove, look = "app", colorClass }: Props) {
  const [state, formAction, pending] = useActionState(upload, {
    error: null,
    saved: false,
    attempt: 0,
  });
  // Réduction de la photo dans le navigateur avant l'envoi (14/11) : une photo de téléphone dépassait
  // la limite d'un envoi sur Vercel et menait à une page d'erreur.
  const [preparing, setPreparing] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const busy = pending || preparing;
  const inputId = useId();

  const send = async (file: File) => {
    setLocalError(null);
    setPreparing(true);
    const small = await shrinkPhoto(file, { maxSide: PROFILE_PHOTO_SIDE });
    setPreparing(false);
    if (small.size > PHOTO_MAX_BYTES) {
      setLocalError("Photo trop lourde : 2 Mo maximum.");
      return;
    }
    const data = new FormData();
    data.set("photo", small);
    startTransition(() => formAction(data));
  };
  const fiche = look === "fiche";
  const dialog = look === "dialog";

  // Le champ fichier (caché) et son bouton, partagés par les deux habillages.
  const picker = (
    // Reconstruit après chaque réponse : le champ fichier se vide.
    <form key={state.attempt} action={formAction} className="flex">
      <input
        id={inputId}
        name="photo"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        aria-label="Photo de profil"
        disabled={busy}
        onChange={(event) => {
          const file = event.currentTarget.files?.[0];
          // Vidé tout de suite : la même photo peut être choisie à nouveau après un refus.
          event.currentTarget.value = "";
          if (file) void send(file);
        }}
        className="peer sr-only"
      />
      <label
        htmlFor={inputId}
        aria-hidden
        className={`${
          dialog
            ? "inline-flex h-10 items-center gap-2 rounded-[11px] bg-cta px-3.5 text-[14px] leading-[normal] font-semibold whitespace-nowrap text-on-cta transition-[background-color] duration-150 hover:bg-cta-hover"
            : fiche
              ? buttonClass({
                  variant: "primary",
                  size: "sm",
                  className: "h-10! gap-[7px]! rounded-[10px]! text-[13.5px]! font-medium!",
                })
              : buttonClass({ variant: "inverse", size: "sm" })
        } cursor-pointer peer-focus-visible:ring-2 peer-focus-visible:ring-accent peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-bg ${
          busy ? "pointer-events-none opacity-60" : ""
        }`}
      >
        {fiche ? null : (
          <Camera aria-hidden size={dialog ? 16 : 14} strokeWidth={dialog ? 1.9 : 1.8} />
        )}
        {busy
          ? "Envoi…"
          : dialog
            ? photoPath
              ? "Changer"
              : "Ajouter"
            : photoPath
              ? "Changer la photo"
              : "Ajouter la photo"}
      </label>
    </form>
  );
  const error = localError ?? state.error;
  const message = error ? (
    <p role="alert" className={errorTextClass}>
      {error}
    </p>
  ) : state.saved ? (
    <p role="status" className="text-small text-ok">
      Photo enregistrée.
    </p>
  ) : null;

  if (dialog) {
    // Paramètres (kit, boîte 33) : carte gris clair (rayon 18, marge 18) : photo de 72 px cerclée de
    // violet, titre et consigne, « Changer » noir et « Retirer » en rouge.
    return (
      <section
        aria-labelledby="photo-dialog-title"
        className="flex flex-wrap items-center gap-[18px] rounded-[18px] bg-dlg-nav p-[18px]"
      >
        <span className="inline-flex shrink-0 rounded-full ring-[3px] ring-dlg outline-[1.5px] outline-offset-[3px] outline-violet outline">
          <Avatar name={name} size="photo" photoPath={photoPath} />
        </span>
        <div className="flex min-w-0 flex-[1_1_180px] flex-col gap-1">
          <h4 id="photo-dialog-title" className="text-[16px] leading-[normal] font-bold">
            Photo de profil
          </h4>
          <p className="text-[13px] leading-[normal] text-pretty text-muted">
            JPEG, PNG ou WebP, réduite automatiquement. Stockée en privé.
          </p>
          {message}
        </div>
        <div className="flex items-center gap-[18px]">
          {picker}
          {photoPath ? (
            <form action={remove}>
              <button
                type="submit"
                aria-label="Retirer la photo"
                className="inline-flex h-10 items-center rounded-[11px] px-3 text-[14px] leading-[normal] font-semibold text-dlg-danger-ink transition-[background-color] duration-150 hover:bg-dlg-danger-soft"
              >
                Retirer
              </button>
            </form>
          ) : null}
        </div>
      </section>
    );
  }

  if (fiche) {
    // Fiche sportif (maquette « Sportifs » du 03/11/2026) : photo de 64 px avec sa pastille appareil
    // photo, titre et consigne, puis les deux boutons à droite (dessous sur téléphone).
    return (
      <div className="flex flex-wrap items-center gap-x-[18px] gap-y-3.5">
        <span className="relative flex shrink-0">
          <Avatar name={name} size="xl" photoPath={photoPath} colorClass={colorClass} />
          {/* La pastille ouvre aussi le choix du fichier (le bouton reste l'entrée accessible). */}
          <label
            htmlFor={inputId}
            aria-hidden
            className="absolute -right-0.5 -bottom-0.5 grid size-6 cursor-pointer place-items-center rounded-full bg-cta text-on-cta ring-[2.5px] ring-surface"
          >
            <Camera size={12} strokeWidth={2} />
          </label>
        </span>
        <div className="flex min-w-0 flex-[1_1_180px] flex-col gap-[3px]">
          <h2
            id="photo-title"
            className="text-[15px] leading-[19px] font-semibold whitespace-nowrap"
          >
            Photo de profil
          </h2>
          <p className="text-[12.5px] leading-[1.45] text-pretty text-muted">
            JPEG, PNG ou WebP, réduite automatiquement. Stockée en privé.
          </p>
          {message}
        </div>
        <div className="flex flex-[0_1_auto] gap-2">
          {picker}
          {photoPath ? (
            <form action={remove}>
              <button
                type="submit"
                aria-label="Retirer la photo"
                className={buttonClass({
                  variant: "outline",
                  size: "sm",
                  className:
                    "h-10! gap-[7px]! rounded-[10px]! border-0! text-[13.5px]! font-medium! text-text-2! inset-ring inset-ring-line-2 hover:bg-surface-2!",
                })}
              >
                <Trash2 aria-hidden size={14} strokeWidth={1.8} />
                Retirer
              </button>
            </form>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <Avatar name={name} size="xl" photoPath={photoPath} />
      <div className="flex flex-col items-start gap-2">
        {picker}
        <p className={hintClass}>JPEG, PNG ou WebP, réduite automatiquement. Stockée en privé.</p>
        {message}
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
