"use client";

import { Camera, Check } from "lucide-react";
import Link from "next/link";
import { useActionState, useEffect, useId, useRef, useState } from "react";

import { ExerciseImage } from "@/components/blocks/exercise-image";
import { buttonClass } from "@/components/ui/button";
import {
  checkboxChipClass,
  errorTextClass,
  hintClass,
  inputClass,
  labelClass,
  textareaClass,
} from "@/components/ui/form-styles";
import {
  EXERCISE_NAME_MAX,
  INSTRUCTIONS_MAX_STEPS,
  VIDEO_URL_MAX,
  type CoachExerciseInput,
} from "@/domain/exercises/coach-exercise";
import {
  EXERCISE_CATEGORIES,
  equipmentGroupLabels,
  equipmentInfo,
  exerciseCategoryLabels,
  muscleGroupLabels,
  type EquipmentGroup,
  type ExerciseCategory,
  type MuscleGroup,
} from "@/domain/exercises/vocabulary";
import type { CoachExerciseFormState } from "@/features/exercises/coach-actions";

// Formulaire « Créer un exercice » / « Modifier l'exercice » (D-76) : nom, rubrique, groupes
// musculaires, matériel principal, consignes (une par ligne), photo et lien vidéo. La photo est
// réduite dans le navigateur (1 200 px au plus) avant l'envoi : la bibliothèque reste légère.
type Action = (
  previous: CoachExerciseFormState,
  formData: FormData,
) => Promise<CoachExerciseFormState>;

const PHOTO_SIDE_MAX = 1200;

// Réduit une photo trop grande (JPEG). Le fond transparent prend le bleu des illustrations.
async function shrinkPhoto(file: File): Promise<File> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, PHOTO_SIDE_MAX / Math.max(bitmap.width, bitmap.height));
    if (scale === 1 && file.size < 1024 * 1024) return file;
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const context = canvas.getContext("2d");
    if (!context) return file;
    const tile = getComputedStyle(document.documentElement)
      .getPropertyValue("--illustration")
      .trim();
    if (tile) {
      context.fillStyle = tile;
      context.fillRect(0, 0, canvas.width, canvas.height);
    }
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.85),
    );
    return blob ? new File([blob], "photo.jpg", { type: "image/jpeg" }) : file;
  } catch {
    // Format que le navigateur ne sait pas lire : le serveur dira lequel est accepté.
    return file;
  }
}

const equipmentByGroup = Object.entries(equipmentInfo).reduce<Record<string, [string, string][]>>(
  (groups, [code, info]) => {
    (groups[info.group] ??= []).push([code, info.label]);
    return groups;
  },
  {},
);

export function ExerciseForm({
  action,
  initial,
  mode,
  cancelHref,
  variantOf,
  currentPhoto,
}: {
  action: Action;
  initial: CoachExerciseInput;
  mode: "create" | "edit";
  cancelHref: string;
  // « Créer ma variante » : l'exercice d'origine.
  variantOf?: { id: string; nameFr: string } | null;
  currentPhoto?: string | null;
}) {
  const [state, formAction, pending] = useActionState(action, {
    error: null,
    attempt: 0,
    values: null,
  });
  const values = state.values ?? initial;
  const [preview, setPreview] = useState<string | null>(null);
  const [preparing, setPreparing] = useState(false);
  const photoInput = useRef<HTMLInputElement>(null);
  const photoId = useId();

  // Libère l'aperçu de la photo choisie quand il change ou que le formulaire disparaît.
  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview],
  );

  const choosePhoto = async (input: HTMLInputElement) => {
    const file = input.files?.[0];
    if (!file) return;
    setPreparing(true);
    const small = await shrinkPhoto(file);
    if (small !== file) {
      const transfer = new DataTransfer();
      transfer.items.add(small);
      input.files = transfer.files;
    }
    setPreview(URL.createObjectURL(small));
    setPreparing(false);
  };

  const category = (EXERCISE_CATEGORIES as readonly string[]).includes(values.category)
    ? (values.category as ExerciseCategory)
    : "strength";

  return (
    <form key={state.attempt} action={formAction} className="flex flex-col gap-5">
      {variantOf ? (
        <>
          <input type="hidden" name="variantOf" value={variantOf.id} />
          <p className={hintClass}>Variante de « {variantOf.nameFr} ».</p>
        </>
      ) : null}

      <label className="flex flex-col gap-2">
        <span className={labelClass}>Nom de l&apos;exercice</span>
        <input
          name="name"
          defaultValue={values.name}
          required
          maxLength={EXERCISE_NAME_MAX}
          autoComplete="off"
          className={inputClass}
        />
      </label>

      <fieldset className="flex flex-col gap-2">
        <legend className={`${labelClass} mb-2`}>Rubrique</legend>
        <div className="flex flex-wrap gap-2">
          {EXERCISE_CATEGORIES.map((code) => (
            <label key={code} className={checkboxChipClass}>
              <input
                type="radio"
                name="category"
                value={code}
                defaultChecked={category === code}
                className="sr-only"
              />
              <Check
                aria-hidden
                size={14}
                strokeWidth={2.2}
                className="hidden group-has-checked:block"
              />
              {exerciseCategoryLabels[code]}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className={`${labelClass} mb-2`}>Groupes musculaires</legend>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(muscleGroupLabels) as MuscleGroup[]).map((group) => (
            <label key={group} className={checkboxChipClass}>
              <input
                type="checkbox"
                name="muscles"
                value={group}
                defaultChecked={values.muscleGroups.includes(group)}
                className="sr-only"
              />
              <Check
                aria-hidden
                size={14}
                strokeWidth={2.2}
                className="hidden group-has-checked:block"
              />
              {muscleGroupLabels[group]}
            </label>
          ))}
        </div>
      </fieldset>

      <label className="flex flex-col gap-2">
        <span className={labelClass}>Matériel</span>
        <select name="equipment" defaultValue={values.equipment} className={inputClass}>
          <option value="">Aucun : poids du corps</option>
          {(Object.keys(equipmentGroupLabels) as EquipmentGroup[])
            .filter((group) => equipmentByGroup[group])
            .map((group) => (
              <optgroup key={group} label={equipmentGroupLabels[group]}>
                {equipmentByGroup[group].map(([code, label]) => (
                  <option key={code} value={code}>
                    {label}
                  </option>
                ))}
              </optgroup>
            ))}
        </select>
      </label>

      <label className="flex flex-col gap-2">
        <span className={labelClass}>Consignes</span>
        <textarea
          name="instructions"
          defaultValue={values.instructions}
          rows={6}
          className={textareaClass}
          placeholder={
            "Tiens-toi debout, pieds à largeur de hanches.\nDescends en gardant le dos droit."
          }
        />
        <span className={hintClass}>
          Une consigne par ligne, {INSTRUCTIONS_MAX_STEPS} au maximum. Facultatif.
        </span>
      </label>

      <div className="flex flex-col gap-2">
        <span className={labelClass}>Photo</span>
        <div className="flex items-start gap-4">
          {preview || currentPhoto ? (
            <ExerciseImage
              src={preview ?? currentPhoto ?? null}
              alt="Aperçu de la photo"
              category={category}
              className="w-28 shrink-0"
            />
          ) : null}
          <div className="flex flex-col items-start gap-2">
            <input
              ref={photoInput}
              id={photoId}
              name="photo"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              aria-label="Photo de l'exercice"
              onChange={(event) => choosePhoto(event.currentTarget)}
              className="peer sr-only"
            />
            <label
              htmlFor={photoId}
              aria-hidden
              className={`${buttonClass({ variant: "outline", size: "sm" })} cursor-pointer peer-focus-visible:ring-2 peer-focus-visible:ring-accent`}
            >
              <Camera aria-hidden size={14} strokeWidth={1.8} />
              {preparing
                ? "Préparation…"
                : preview || currentPhoto
                  ? "Changer la photo"
                  : "Ajouter une photo"}
            </label>
            <span className={hintClass}>
              JPEG, PNG ou WebP. Stockée en privé, visible par ton équipe.
            </span>
            {mode === "edit" && currentPhoto ? (
              <label className="inline-flex min-h-11 items-center gap-2 text-[14px]">
                <input
                  type="checkbox"
                  name="removePhoto"
                  className="size-4 accent-[var(--accent)]"
                />
                Retirer la photo
              </label>
            ) : null}
          </div>
        </div>
      </div>

      <label className="flex flex-col gap-2">
        <span className={labelClass}>Lien vidéo</span>
        <input
          name="videoUrl"
          type="url"
          inputMode="url"
          defaultValue={values.videoUrl}
          maxLength={VIDEO_URL_MAX}
          placeholder="https://www.instagram.com/reel/…"
          autoComplete="off"
          className={inputClass}
        />
        <span className={hintClass}>
          YouTube, Instagram, TikTok… Facultatif, s&apos;ouvre dans un nouvel onglet.
        </span>
      </label>

      {state.error ? (
        <p role="alert" className={errorTextClass}>
          {state.error}
        </p>
      ) : null}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Link href={cancelHref} className={buttonClass({ variant: "ghost" })}>
          Annuler
        </Link>
        <button type="submit" disabled={pending || preparing} className={buttonClass()}>
          {pending ? "Enregistrement…" : mode === "create" ? "Créer l'exercice" : "Enregistrer"}
        </button>
      </div>
    </form>
  );
}
