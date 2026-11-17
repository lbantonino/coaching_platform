"use client";

import { Camera, Check, GitBranch, Link as LinkIcon } from "lucide-react";
import Link from "next/link";
import { useActionState, useEffect, useId, useRef, useState, type DragEvent } from "react";

import { shrinkPhoto } from "@/lib/shrink-photo";

import {
  MobileActionBar,
  mobileActionPrimaryClass,
  mobileActionSecondaryClass,
} from "@/components/ui/mobile-action-bar";
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

import { DeleteExerciseButton } from "./[cle]/delete-exercise-button";

// Formulaire « Créer un exercice » / « Modifier l'exercice » (D-76), redessiné d'après le kit
// « Coory Pages », pages 08 et 11 (D-121). Ordinateur : la carte APERÇU en haut (nom, rubrique,
// muscles et matériel, mis à jour pendant la saisie) avec Enregistrer / Annuler, et « Supprimer
// l'exercice » en modification ; puis la carte du formulaire. Téléphone : le formulaire seul et la
// barre fixe Annuler / Enregistrer. Champs : nom, rubrique et groupes musculaires en pilules,
// matériel, consignes (une par ligne), photo (zone de dépôt) et lien vidéo. La photo est réduite dans
// le navigateur (1 200 px au plus) avant l'envoi : la bibliothèque reste légère.
type Action = (
  previous: CoachExerciseFormState,
  formData: FormData,
) => Promise<CoachExerciseFormState>;

const PHOTO_SIDE_MAX = 1200;
const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];

// Réduit une photo trop grande (JPEG, réduction partagée avec la photo de profil). Le fond
// transparent prend le bleu des illustrations.
function shrinkExercisePhoto(file: File): Promise<File> {
  const tile = getComputedStyle(document.documentElement).getPropertyValue("--illustration").trim();
  return shrinkPhoto(file, { maxSide: PHOTO_SIDE_MAX, ...(tile ? { background: tile } : {}) });
}

const equipmentByGroup = Object.entries(equipmentInfo).reduce<Record<string, [string, string][]>>(
  (groups, [code, info]) => {
    (groups[info.group] ??= []).push([code, info.label]);
    return groups;
  },
  {},
);
const MUSCLE_GROUPS = Object.keys(muscleGroupLabels) as MuscleGroup[];
const NO_EQUIPMENT = "Aucun : poids du corps";

// Styles du kit (08 / 11). Téléphone d'abord : champs de 48 px en 16 px (en dessous, l'iPhone agrandit
// la page) ; ordinateur : 46 px en 14 px. Fond gris pâle, filet intérieur, anneau violet au focus.
const labelClass = "text-[14px] leading-[normal] font-semibold text-text lg:text-[13.5px]";
const optionalClass = "font-normal text-faint";
const hintClass = "text-[12px] leading-[1.45] text-faint";
const fieldClass =
  "w-full rounded-[12px] bg-surface-2 text-[16px] text-text inset-ring inset-ring-line-2 outline-none placeholder:text-faint transition-shadow duration-150 focus:inset-ring-[1.5px] focus:inset-ring-violet lg:text-[14px]";
// Pilule cochable : la vraie case reste dans la page (sr-only) ; cochée = fond et texte violets, « ✓ ».
const pillClass =
  "tap-44 group inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-full bg-surface px-[15px] text-[14px] leading-[normal] font-medium whitespace-nowrap text-text inset-ring inset-ring-line-2 transition-colors duration-150 not-has-checked:hover:bg-surface-2 has-checked:bg-status-accent-soft has-checked:text-status-accent has-checked:inset-ring-transparent has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent lg:h-[34px] lg:px-3.5 lg:text-[13px]";

export function ExerciseForm({
  action,
  initial,
  mode,
  cancelHref,
  variantOf,
  currentPhoto,
  deletion,
}: {
  action: Action;
  initial: CoachExerciseInput;
  mode: "create" | "edit";
  cancelHref: string;
  // « Créer ma variante » : l'exercice d'origine (sa fiche pour « Voir l'original »).
  variantOf?: { id: string; nameFr: string; href: string } | null;
  currentPhoto?: string | null;
  // Modifier : « Supprimer l'exercice » sous les boutons de l'aperçu (ordinateur).
  deletion?: { name: string; remove: () => Promise<{ ok: boolean }> } | null;
}) {
  const [state, formAction, pending] = useActionState(action, {
    error: null,
    attempt: 0,
    values: null,
  });
  const values = state.values ?? initial;
  const formId = useId();
  const nameId = useId();
  const musclesId = useId();
  const instructionsId = useId();
  const instructionsHintId = useId();
  const videoId = useId();
  const videoHintId = useId();
  const photoId = useId();

  // Ce que l'aperçu montre pendant la saisie : nom, rubrique, groupes musculaires, matériel.
  const [name, setName] = useState(initial.name);
  const [category, setCategory] = useState<ExerciseCategory>(
    (EXERCISE_CATEGORIES as readonly string[]).includes(initial.category)
      ? (initial.category as ExerciseCategory)
      : "strength",
  );
  const [muscles, setMuscles] = useState<string[]>(initial.muscleGroups);
  const [equipment, setEquipment] = useState(initial.equipment);

  // Photo : celle choisie (aperçu local), ou celle déjà enregistrée, sauf si le coach l'a retirée.
  const [preview, setPreview] = useState<string | null>(null);
  const [preparing, setPreparing] = useState(false);
  const [removed, setRemoved] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const photoInput = useRef<HTMLInputElement>(null);
  const shownPhoto = preview ?? (removed ? null : (currentPhoto ?? null));

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
    setPhotoError(null);
    setPreparing(true);
    const small = await shrinkExercisePhoto(file);
    if (small !== file) {
      const transfer = new DataTransfer();
      transfer.items.add(small);
      input.files = transfer.files;
    }
    setPreview(URL.createObjectURL(small));
    setPreparing(false);
  };

  // « Glisse une photo ici » : le fichier déposé passe dans le vrai champ, comme s'il avait été choisi.
  const dropPhoto = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files?.[0];
    const input = photoInput.current;
    if (!file || !input) return;
    if (!PHOTO_TYPES.includes(file.type)) {
      setPhotoError("Format non accepté : JPEG, PNG ou WebP.");
      return;
    }
    const transfer = new DataTransfer();
    transfer.items.add(file);
    input.files = transfer.files;
    void choosePhoto(input);
  };

  // « Retirer » : la photo choisie (le champ se vide), sinon celle enregistrée (retirée à l'envoi).
  const removePhoto = () => {
    setPhotoError(null);
    if (preview) {
      if (photoInput.current) photoInput.current.value = "";
      setPreview(null);
      return;
    }
    setRemoved(true);
  };

  const toggleMuscle = (group: MuscleGroup) =>
    setMuscles((current) =>
      current.includes(group) ? current.filter((item) => item !== group) : [...current, group],
    );
  const chosenMuscles = MUSCLE_GROUPS.filter((group) => muscles.includes(group));
  const musclesCount =
    chosenMuscles.length === 0
      ? "Plusieurs choix possibles"
      : `${chosenMuscles.length} sélectionné${chosenMuscles.length > 1 ? "s" : ""}`;
  const equipmentLabel = equipment
    ? (equipmentInfo[equipment]?.label ?? NO_EQUIPMENT)
    : NO_EQUIPMENT;
  const cta = pending
    ? "Enregistrement…"
    : mode === "edit"
      ? "Enregistrer"
      : variantOf
        ? "Enregistrer ma variante"
        : "Créer l'exercice";

  const error = state.error ? (
    <p role="alert" className="text-[13px] leading-[1.45] font-medium text-alert">
      {state.error}
    </p>
  ) : null;

  return (
    <div className="flex w-full flex-col gap-4 lg:max-w-[1120px]">
      {/* Aperçu (ordinateur, kit 08 / 11) : la fiche telle qu'elle sera enregistrée, et les boutons. */}
      <aside
        aria-label="Aperçu"
        className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_190px_120px] items-center gap-x-6 gap-y-3 rounded-[20px] bg-surface px-[22px] py-[18px] inset-ring inset-ring-line-soft max-lg:hidden"
      >
        <p className="col-span-full text-[11.5px] leading-[normal] font-semibold tracking-[0.06em] text-faint uppercase">
          Aperçu
        </p>
        <div className="flex min-w-0 flex-col gap-1.5">
          <p className="text-[16px] leading-[normal] font-semibold text-pretty break-words">
            {name.trim() || "Nouvel exercice"}
          </p>
          <span className="h-6 self-start rounded-[6px] bg-dlg-accent-soft px-2.5 text-[12px] leading-6 font-medium text-violet-text">
            {exerciseCategoryLabels[category]}
          </span>
        </div>
        <dl className="flex min-w-0 flex-col gap-2 border-l border-line pl-6 text-[13px] leading-[normal]">
          <div className="flex justify-between gap-2.5">
            <dt className="shrink-0 text-muted">Muscles</dt>
            <dd className="min-w-0 text-right font-semibold">
              {chosenMuscles.map((group) => muscleGroupLabels[group]).join(", ") || "—"}
            </dd>
          </div>
          <div className="flex justify-between gap-2.5">
            <dt className="shrink-0 text-muted">Matériel</dt>
            <dd className="min-w-0 text-right font-semibold">{equipmentLabel}</dd>
          </div>
        </dl>
        <button
          type="submit"
          form={formId}
          disabled={pending || preparing}
          className="inline-flex h-[42px] items-center justify-center rounded-[11px] bg-cta px-2 text-[14px] leading-[normal] font-semibold whitespace-nowrap text-on-cta transition-[background-color,scale] duration-150 hover:bg-cta-hover active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {cta}
        </button>
        <Link
          href={cancelHref}
          className="inline-flex h-[42px] items-center justify-center rounded-[11px] text-[14px] leading-[normal] font-medium text-text inset-ring inset-ring-line-2 transition-[background-color,scale] duration-150 hover:bg-surface-2 active:scale-[0.98]"
        >
          Annuler
        </Link>
        {error || deletion ? (
          <div className="col-span-full flex items-center justify-end gap-4">
            {error ? <div className="mr-auto">{error}</div> : null}
            {deletion ? (
              <DeleteExerciseButton name={deletion.name} remove={deletion.remove} variant="link" />
            ) : null}
          </div>
        ) : null}
      </aside>

      {/* Variante (kit 08, C-INFO), téléphone : une carte blanche au-dessus du formulaire. */}
      {variantOf ? (
        <div className="flex items-center gap-2.5 rounded-[16px] bg-surface px-3.5 py-3 text-[13.5px] leading-[1.4] text-dlg-ink-2 lg:hidden">
          <GitBranch
            aria-hidden
            size={16}
            strokeWidth={1.8}
            className="shrink-0 text-violet-text"
          />
          <p className="min-w-0 flex-1">
            Variante de <strong className="font-semibold text-text">« {variantOf.nameFr} »</strong>
          </p>
          <Link
            href={variantOf.href}
            aria-label="Voir l'original"
            className="-my-3 inline-flex min-h-11 shrink-0 items-center text-[13px] font-medium text-violet-text"
          >
            Original
          </Link>
        </div>
      ) : null}

      <form
        id={formId}
        key={state.attempt}
        action={formAction}
        className="flex flex-col gap-[18px] rounded-[22px] bg-surface px-4 py-[18px] lg:gap-[22px] lg:rounded-[20px] lg:p-6 lg:inset-ring lg:inset-ring-line-soft"
      >
        {variantOf ? (
          <>
            <input type="hidden" name="variantOf" value={variantOf.id} />
            {/* Ordinateur : le bandeau en tête de la carte du formulaire. */}
            <div className="flex items-center gap-2.5 rounded-[12px] bg-dlg-accent-soft px-3.5 py-3 text-[13px] leading-[1.4] text-dlg-ink-2 max-lg:hidden">
              <GitBranch
                aria-hidden
                size={15}
                strokeWidth={1.8}
                className="shrink-0 text-violet-text"
              />
              <p className="min-w-0 flex-1">
                Variante de{" "}
                <strong className="font-semibold text-text">« {variantOf.nameFr} »</strong>.
                L&apos;exercice d&apos;origine reste inchangé.
              </p>
              <Link
                href={variantOf.href}
                className="shrink-0 rounded-[4px] text-[12.5px] font-medium text-violet-text underline-offset-4 hover:underline"
              >
                Voir l&apos;original
              </Link>
            </div>
          </>
        ) : null}

        <div className="flex flex-col gap-2">
          <label htmlFor={nameId} className={labelClass}>
            Nom de l&apos;exercice
          </label>
          <input
            id={nameId}
            name="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            maxLength={EXERCISE_NAME_MAX}
            autoComplete="off"
            placeholder="Ex. Squat goblet"
            className={`${fieldClass} h-12 px-3.5 lg:h-[46px]`}
          />
        </div>

        <fieldset className="flex flex-col gap-2.5">
          <legend className={`${labelClass} mb-2.5`}>Rubrique</legend>
          <div className="flex flex-wrap gap-2">
            {EXERCISE_CATEGORIES.map((code) => (
              <label key={code} className={pillClass}>
                <input
                  type="radio"
                  name="category"
                  value={code}
                  checked={category === code}
                  onChange={() => setCategory(code)}
                  className="sr-only"
                />
                <Check
                  aria-hidden
                  size={13}
                  strokeWidth={2.6}
                  className="hidden shrink-0 group-has-checked:block"
                />
                {exerciseCategoryLabels[code]}
              </label>
            ))}
          </div>
        </fieldset>

        {/* Groupes musculaires : plusieurs choix, et leur nombre à côté du titre (à droite sur
            téléphone). */}
        <fieldset aria-labelledby={musclesId} className="flex flex-col gap-2.5">
          <div className="flex items-baseline justify-between gap-2.5 lg:justify-start">
            <span id={musclesId} className={labelClass}>
              Groupes musculaires
            </span>
            <span className="text-[12.5px] leading-[normal] text-faint">{musclesCount}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {MUSCLE_GROUPS.map((group) => (
              <label key={group} className={pillClass}>
                <input
                  type="checkbox"
                  name="muscles"
                  value={group}
                  checked={muscles.includes(group)}
                  onChange={() => toggleMuscle(group)}
                  className="sr-only"
                />
                <Check
                  aria-hidden
                  size={13}
                  strokeWidth={2.6}
                  className="hidden shrink-0 group-has-checked:block"
                />
                {muscleGroupLabels[group]}
              </label>
            ))}
          </div>
        </fieldset>

        <label className="flex flex-col gap-2">
          <span className={labelClass}>Matériel</span>
          <select
            name="equipment"
            value={equipment}
            onChange={(event) => setEquipment(event.target.value)}
            className={`${fieldClass} h-12 px-3.5 lg:h-[46px]`}
          >
            <option value="">{NO_EQUIPMENT}</option>
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

        <div className="flex flex-col gap-2">
          <label htmlFor={instructionsId} className={labelClass}>
            Consignes
          </label>
          <textarea
            id={instructionsId}
            name="instructions"
            defaultValue={values.instructions}
            aria-describedby={instructionsHintId}
            className={`${fieldClass} block min-h-[130px] resize-y px-3.5 py-3 leading-[1.5] lg:min-h-[140px] lg:leading-[1.55]`}
            placeholder={
              "Tiens-toi debout, pieds à largeur de hanches.\nDescends en gardant le dos droit."
            }
          />
          <span id={instructionsHintId} className={`${hintClass} max-lg:text-[13px]`}>
            {/* Kit 11 (modifier) / kit 08 (créer), avec la limite réelle de l'app. */}
            {mode === "edit" ? (
              <>
                Une consigne par ligne, {INSTRUCTIONS_MAX_STEPS} au maximum.
                <span className="max-lg:hidden"> Facultatif.</span>
              </>
            ) : (
              <>
                Une étape par ligne, {INSTRUCTIONS_MAX_STEPS} au maximum.
                <span className="max-lg:hidden"> Le sportif les voit dans son programme.</span>
              </>
            )}
          </span>
        </div>

        {/* Photo (kit, F-DROP) : on la glisse sur la zone (ordinateur) ou on la choisit ; une fois là,
            sa vignette avec « Remplacer » et « Retirer ». Le vrai champ fichier reste dans la page
            (invisible) : « Parcourir » en est l'étiquette, il prend le focus au clavier. */}
        <div className="flex flex-col gap-2">
          <span className={labelClass}>
            Photo <span className={optionalClass}>facultatif</span>
          </span>
          <div
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={dropPhoto}
            className={`flex items-center gap-3 rounded-[14px] bg-surface-2 p-3 transition-shadow duration-150 ${
              dragging ? "inset-ring-[1.5px] inset-ring-violet" : "inset-ring inset-ring-line-2"
            }`}
          >
            {shownPhoto ? (
              <span className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-[11px] bg-illustration">
                {/* eslint-disable-next-line @next/next/no-img-element -- fichier privé servi par l'app, ou aperçu local */}
                <img
                  src={shownPhoto}
                  alt="Aperçu de la photo"
                  className="size-full object-contain"
                />
              </span>
            ) : (
              <span
                aria-hidden
                className="grid size-14 shrink-0 place-items-center rounded-[11px] bg-status-accent-soft text-violet-text"
              >
                <Camera size={20} strokeWidth={1.8} />
              </span>
            )}
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="text-[14px] leading-[normal] font-semibold lg:text-[13.5px]">
                {preparing ? (
                  "Préparation de la photo…"
                ) : shownPhoto ? (
                  preview ? (
                    "Nouvelle photo"
                  ) : (
                    "Photo actuelle"
                  )
                ) : (
                  <>
                    <span className="lg:hidden">Ajouter une photo</span>
                    <span className="max-lg:hidden">Glisse une photo ici ou parcours</span>
                  </>
                )}
              </span>
              <span className={hintClass}>JPEG, PNG ou WebP · stockée en privé</span>
            </span>
            <span className="flex shrink-0 items-center gap-2">
              <input
                ref={photoInput}
                id={photoId}
                name="photo"
                type="file"
                accept={PHOTO_TYPES.join(",")}
                aria-label="Photo de l'exercice"
                onChange={(event) => choosePhoto(event.currentTarget)}
                className="peer sr-only"
              />
              <label
                htmlFor={photoId}
                aria-hidden
                className="tap-44 inline-flex h-10 cursor-pointer items-center rounded-[9px] bg-surface px-3 text-[13px] leading-[normal] font-medium whitespace-nowrap text-text inset-ring inset-ring-line-2 transition-[background-color,scale] duration-150 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent hover:bg-surface-2 active:scale-[0.97] lg:h-[34px]"
              >
                {shownPhoto ? "Remplacer" : "Parcourir"}
              </label>
              {shownPhoto ? (
                <button
                  type="button"
                  onClick={removePhoto}
                  className="tap-44 inline-flex h-10 items-center rounded-[9px] px-2 text-[13px] leading-[normal] font-medium whitespace-nowrap text-status-danger transition-[background-color,scale] duration-150 hover:bg-surface active:scale-[0.97] lg:h-[34px]"
                >
                  Retirer
                </button>
              ) : null}
            </span>
          </div>
          {removed && !preview ? <input type="hidden" name="removePhoto" value="on" /> : null}
          {photoError ? (
            <p role="alert" className="text-[13px] leading-[1.45] font-medium text-alert">
              {photoError}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor={videoId} className={labelClass}>
            Lien vidéo <span className={optionalClass}>facultatif</span>
          </label>
          <span className="flex h-12 items-center gap-2.5 rounded-[12px] bg-surface-2 px-3.5 inset-ring inset-ring-line-2 transition-shadow duration-150 focus-within:inset-ring-[1.5px] focus-within:inset-ring-violet lg:h-[46px]">
            <LinkIcon aria-hidden size={15} strokeWidth={2} className="shrink-0 text-faint" />
            <input
              id={videoId}
              name="videoUrl"
              type="url"
              inputMode="url"
              defaultValue={values.videoUrl}
              maxLength={VIDEO_URL_MAX}
              placeholder="https://www.instagram.com/reel/…"
              autoComplete="off"
              aria-describedby={videoHintId}
              className="h-full min-w-0 flex-1 bg-transparent text-[16px] text-text outline-none placeholder:text-faint lg:text-[14px]"
            />
          </span>
          <span id={videoHintId} className={hintClass}>
            YouTube, Instagram, TikTok… S&apos;ouvre dans un nouvel onglet.
          </span>
        </div>

        {/* Téléphone : l'erreur juste au-dessus de la barre fixe (sur ordinateur, dans l'aperçu). */}
        {error ? <div className="lg:hidden">{error}</div> : null}
      </form>

      <MobileActionBar>
        <Link href={cancelHref} className={mobileActionSecondaryClass}>
          Annuler
        </Link>
        <button
          type="submit"
          form={formId}
          disabled={pending || preparing}
          className={mobileActionPrimaryClass}
        >
          {cta}
        </button>
      </MobileActionBar>
    </div>
  );
}
