"use client";

import { Check } from "lucide-react";
import { useActionState, useState } from "react";

import { buttonClass } from "@/components/ui/button";
import {
  errorTextClass,
  ficheGridClass,
  ficheHintClass,
  ficheInputClass,
  ficheLabelClass,
  ficheTextareaClass,
} from "@/components/ui/form-styles";
import { FieldCheck } from "@/components/ui/field-check";
import { Segmented } from "@/components/ui/segmented";
import { addGoal, type AddGoalState } from "@/features/goals/actions";
import {
  goalTypeGroups,
  goalTypeLabels,
  HYROX_CATEGORIES,
  hyroxCategoryLabels,
  type GoalFormInput,
  type GoalPriority,
} from "@/features/goals/schemas";

const initialState: AddGoalState = { error: null, saved: 0, attempt: 0, values: null };

type Props = { organizationId: string; athleteId: string; today: string; hasMain: boolean };

export function AddGoalForm({ organizationId, athleteId, today, hasMain }: Props) {
  const [state, formAction, pending] = useActionState(
    addGoal.bind(null, organizationId, athleteId),
    initialState,
  );

  return (
    // Carte à part sous les objectifs (maquette « Sportifs », page 2f).
    <section
      aria-labelledby="add-goal-title"
      className="flex min-w-0 flex-col gap-4 rounded-[20px] bg-surface p-[22px] inset-ring inset-ring-line-soft"
    >
      <h2
        id="add-goal-title"
        className="text-[17px] leading-[21.5px] font-semibold tracking-[-0.01em]"
      >
        Ajouter un objectif
      </h2>
      {/* La clé change après chaque réponse : le formulaire se vide après un ajout réussi, et
          réaffiche toute la saisie (listes et cases comprises) après une erreur. */}
      <GoalFields
        key={state.attempt}
        idPrefix="goal"
        formAction={formAction}
        pending={pending}
        minDate={today}
        hasMain={hasMain}
        error={state.error}
        values={state.values}
        submitLabel="Ajouter l'objectif"
        savedMessage={state.saved > 0 && state.error === null ? "Objectif ajouté." : null}
      />
    </section>
  );
}

// Champs d'un objectif, partagés par l'ajout et la modification (« Modifier l'objectif »).
// `idPrefix` : les deux formulaires peuvent être sur la page en même temps, leurs id doivent différer.
// `hasMain` : un autre objectif est déjà principal (l'avertissement s'affiche alors).
export function GoalFields({
  idPrefix,
  formAction,
  pending,
  minDate,
  hasMain,
  error,
  values,
  submitLabel,
  savedMessage = null,
}: {
  idPrefix: string;
  formAction: (formData: FormData) => void;
  pending: boolean;
  minDate: string;
  hasMain: boolean;
  error: string | null;
  values: GoalFormInput | null;
  submitLabel: string;
  savedMessage?: string | null;
}) {
  // Après une erreur, on réaffiche la saisie (React 19 vide le formulaire après chaque envoi).
  const v = values;
  const [goalType, setGoalType] = useState(v?.goalType ?? "");
  const [isCompetition, setIsCompetition] = useState(v?.isCompetition ?? false);
  // Date vide : « jj/mm/aaaa » en gris clair, comme un texte d'exemple.
  const [hasDate, setHasDate] = useState(Boolean(v?.targetDate));
  // Par défaut, le premier objectif est principal ; les suivants sont secondaires.
  const defaultPriority =
    (v?.priority as GoalPriority | undefined) ?? (hasMain ? "secondary" : "main");

  const optional = (text: string) => <span className="font-normal text-faint">({text})</span>;

  // Habillage de la fiche (maquette « Sportifs », page 2f) : grille de colonnes de 240 px (3 à
  // 1280 px, 1 sur téléphone), la case et la description sur toute la largeur.
  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      <div className={ficheGridClass}>
        <div className="flex min-w-0 flex-col gap-2">
          <label htmlFor={`${idPrefix}-type`} className={ficheLabelClass}>
            Type d&apos;objectif
          </label>
          <select
            id={`${idPrefix}-type`}
            name="goalType"
            defaultValue={v?.goalType ?? ""}
            onChange={(event) => setGoalType(event.target.value)}
            className={`${ficheInputClass} invalid:text-faint`}
            required
          >
            <option value="" disabled>
              Choisir…
            </option>
            {goalTypeGroups.map((group) => (
              <optgroup key={group.label} label={group.label}>
                {group.types.map((type) => (
                  <option key={type} value={type}>
                    {goalTypeLabels[type]}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
        <div className="flex min-w-0 flex-col gap-2">
          <label htmlFor={`${idPrefix}-date`} className={ficheLabelClass}>
            Date cible {optional(isCompetition ? "date de la compétition" : "facultatif")}
          </label>
          <input
            id={`${idPrefix}-date`}
            name="targetDate"
            type="date"
            min={minDate}
            defaultValue={v?.targetDate}
            onChange={(event) => setHasDate(event.target.value !== "")}
            className={`${ficheInputClass} ${hasDate ? "" : "text-faint!"}`}
          />
          {/* Ajout seulement : une modification garde une date passée qui n'a pas changé. */}
          {idPrefix === "goal" ? <FieldCheck htmlFor="goal-date" rule="future-date" /> : null}
        </div>
        <div className="flex min-w-0 flex-col gap-2">
          <label htmlFor={`${idPrefix}-time`} className={ficheLabelClass}>
            Temps visé {optional("facultatif")}
          </label>
          <input
            id={`${idPrefix}-time`}
            name="targetTime"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            placeholder="Ex. : 1:15:00"
            defaultValue={v?.targetTime}
            className={ficheInputClass}
          />
        </div>

        <div className="flex min-w-0 flex-col gap-2">
          <Segmented
            name="priority"
            legend="Priorité"
            look="track"
            defaultValue={defaultPriority}
            options={[
              { value: "main", label: "Principal" },
              { value: "secondary", label: "Secondaire" },
            ]}
          />
          {hasMain ? (
            <p className={ficheHintClass}>
              Choisir « Principal » fait passer l&apos;objectif principal actuel en secondaire.
            </p>
          ) : null}
        </div>

        {/* Case de 20 px (maquette) : la vraie case, transparente, est posée sur la case dessinée
            (clavier, lecteurs d'écran et clics l'atteignent) ; cochée, elle passe en violet. */}
        <label className="col-span-full flex w-fit cursor-pointer items-center gap-2.5 text-[14px] leading-5 font-medium">
          <span className="relative grid size-5 shrink-0">
            <input
              type="checkbox"
              name="isCompetition"
              checked={isCompetition}
              onChange={(event) => setIsCompetition(event.target.checked)}
              className="peer absolute inset-0 m-0 size-full cursor-pointer appearance-none opacity-0"
            />
            <span
              aria-hidden
              className="pointer-events-none grid size-5 place-items-center rounded-md text-on-accent inset-ring-[1.5px] inset-ring-checkbox transition-colors duration-150 peer-checked:bg-violet peer-checked:inset-ring-violet peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-violet [&>svg]:hidden peer-checked:[&>svg]:block"
            >
              <Check size={14} strokeWidth={3} />
            </span>
          </span>
          C&apos;est une compétition
        </label>

        {isCompetition ? (
          <>
            <div className="flex min-w-0 flex-col gap-2">
              <label htmlFor={`${idPrefix}-competition`} className={ficheLabelClass}>
                Nom de la compétition
              </label>
              <input
                id={`${idPrefix}-competition`}
                name="competitionName"
                type="text"
                maxLength={120}
                autoComplete="off"
                placeholder="Ex. : Hyrox Bruxelles"
                defaultValue={v?.competitionName}
                className={ficheInputClass}
              />
            </div>
            <div className="flex min-w-0 flex-col gap-2">
              <label htmlFor={`${idPrefix}-location`} className={ficheLabelClass}>
                Lieu {optional("facultatif")}
              </label>
              <input
                id={`${idPrefix}-location`}
                name="competitionLocation"
                type="text"
                maxLength={120}
                autoComplete="off"
                defaultValue={v?.competitionLocation}
                className={ficheInputClass}
              />
            </div>
            {goalType === "hyrox" ? (
              <div className="flex min-w-0 flex-col gap-2">
                <label htmlFor={`${idPrefix}-hyrox-category`} className={ficheLabelClass}>
                  Catégorie Hyrox
                </label>
                <select
                  id={`${idPrefix}-hyrox-category`}
                  name="hyroxCategory"
                  defaultValue={v?.hyroxCategory ?? ""}
                  className={ficheInputClass}
                >
                  <option value="">Pas encore décidée</option>
                  {HYROX_CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {hyroxCategoryLabels[category]}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
          </>
        ) : null}

        <div className="col-span-full flex min-w-0 flex-col gap-2">
          <label htmlFor={`${idPrefix}-description`} className={ficheLabelClass}>
            Description {optional("facultatif")}
          </label>
          <textarea
            id={`${idPrefix}-description`}
            name="description"
            rows={2}
            maxLength={500}
            placeholder="Ex. : finir sous 1 h 45 ; tenir 45 min de cardio ; squat à 100 kg"
            defaultValue={v?.description}
            className={ficheTextareaClass}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={pending}
          className={buttonClass({
            variant: "primary",
            size: "md",
            className: "self-start rounded-[12px]! text-[14px]! font-medium!",
          })}
        >
          {pending ? "Enregistrement…" : submitLabel}
        </button>
        {error ? (
          <p role="alert" className={errorTextClass}>
            {error}
          </p>
        ) : savedMessage ? (
          <p role="status" className="text-[13px] font-medium text-ok">
            {savedMessage}
          </p>
        ) : null}
      </div>
    </form>
  );
}
