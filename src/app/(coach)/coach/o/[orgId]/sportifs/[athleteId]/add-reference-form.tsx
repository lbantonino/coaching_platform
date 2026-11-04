"use client";

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
import { Segmented } from "@/components/ui/segmented";
import { addReference, type AddReferenceState } from "@/features/references/actions";
import {
  referenceGroup,
  referenceKindLabels,
  type ReferenceFormInput,
  type ReferenceKind,
} from "@/features/references/schemas";

const initialState: AddReferenceState = { error: null, saved: 0, attempt: 0, values: null };

const groups: { label: string; kinds: ReferenceKind[] }[] = [
  {
    label: "Allures running",
    kinds: [
      "pace_easy",
      "pace_tempo",
      "pace_threshold",
      "pace_5k",
      "pace_10k",
      "pace_half",
      "pace_marathon",
      "pace_race",
    ],
  },
  { label: "Fréquence cardiaque", kinds: ["hr_max", "hr_rest"] },
  { label: "Musculation / Hyrox", kinds: ["strength_load"] },
];

type Props = { organizationId: string; athleteId: string; today: string };

export function AddReferenceForm({ organizationId, athleteId, today }: Props) {
  const [state, formAction, pending] = useActionState(
    addReference.bind(null, organizationId, athleteId),
    initialState,
  );

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-[15px] leading-[19px] font-semibold">Ajouter une mesure</h3>
      {/* Reconstruit après chaque réponse : vide après un ajout, saisie renvoyée après une erreur. */}
      <ReferenceFields
        key={state.attempt}
        formAction={formAction}
        pending={pending}
        today={today}
        error={state.error}
        values={state.values}
        justSaved={state.saved > 0 && state.error === null}
      />
    </div>
  );
}

function ReferenceFields({
  formAction,
  pending,
  today,
  error,
  values,
  justSaved,
}: {
  formAction: (formData: FormData) => void;
  pending: boolean;
  today: string;
  error: string | null;
  values: ReferenceFormInput | null;
  justSaved: boolean;
}) {
  // Après une erreur, on réaffiche la saisie (React 19 vide le formulaire après chaque envoi),
  // y compris le type choisi : sinon la mesure suivante partirait sous un autre type.
  const v = values;
  const [kind, setKind] = useState<ReferenceKind>(
    v && v.kind in referenceKindLabels ? (v.kind as ReferenceKind) : "pace_easy",
  );
  const group = referenceGroup(kind);

  const optional = <span className="font-normal text-faint">(facultatif)</span>;
  // Habillage de la fiche (maquette « Sportifs », page 2g) : grille de colonnes de 240 px, la source
  // en contrôle segmenté, la note sur toute la largeur.
  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      <div className={ficheGridClass}>
        <div className="flex min-w-0 flex-col gap-2">
          <label htmlFor="ref-kind" className={ficheLabelClass}>
            Type de repère
          </label>
          <select
            id="ref-kind"
            name="kind"
            value={kind}
            onChange={(event) => setKind(event.target.value as ReferenceKind)}
            className={ficheInputClass}
          >
            {groups.map((g) => (
              <optgroup key={g.label} label={g.label}>
                {g.kinds.map((k) => (
                  <option key={k} value={k}>
                    {referenceKindLabels[k]}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        {group === "pace" ? (
          <div className="flex min-w-0 flex-col gap-2">
            <label htmlFor="ref-pace" className={ficheLabelClass}>
              Allure (min/km)
            </label>
            <input
              id="ref-pace"
              name="pace"
              inputMode="numeric"
              autoComplete="off"
              placeholder="4:55 ou 6:40-7:15"
              defaultValue={v?.pace}
              aria-describedby="ref-pace-hint"
              className={ficheInputClass}
            />
            <p id="ref-pace-hint" className={ficheHintClass}>
              Une allure ou une plage, secondes sur deux chiffres.
            </p>
          </div>
        ) : null}

        {group === "hr" ? (
          <div className="flex min-w-0 flex-col gap-2">
            <label htmlFor="ref-bpm" className={ficheLabelClass}>
              Fréquence cardiaque (bpm)
            </label>
            <input
              id="ref-bpm"
              name="bpm"
              type="number"
              inputMode="numeric"
              min={30}
              max={240}
              defaultValue={v?.bpm}
              className={ficheInputClass}
            />
          </div>
        ) : null}

        {group === "strength" ? (
          <>
            <div className="flex min-w-0 flex-col gap-2">
              <label htmlFor="ref-exercise" className={ficheLabelClass}>
                Exercice
              </label>
              <input
                id="ref-exercise"
                name="exercise"
                autoComplete="off"
                maxLength={80}
                placeholder="Squat, Sled push…"
                defaultValue={v?.exercise}
                className={ficheInputClass}
              />
            </div>
            <div className="flex min-w-0 flex-col gap-2">
              <label htmlFor="ref-load" className={ficheLabelClass}>
                Charge (kg)
              </label>
              <input
                id="ref-load"
                name="loadKg"
                inputMode="decimal"
                autoComplete="off"
                defaultValue={v?.loadKg}
                className={ficheInputClass}
              />
            </div>
            <div className="flex min-w-0 flex-col gap-2">
              <label htmlFor="ref-reps" className={ficheLabelClass}>
                Répétitions {optional}
              </label>
              <input
                id="ref-reps"
                name="reps"
                type="number"
                inputMode="numeric"
                min={1}
                max={100}
                defaultValue={v?.reps}
                className={ficheInputClass}
              />
            </div>
          </>
        ) : null}

        <div className="flex min-w-0 flex-col gap-2">
          <label htmlFor="ref-date" className={ficheLabelClass}>
            Date de la mesure
          </label>
          <input
            id="ref-date"
            name="measuredOn"
            type="date"
            max={today}
            defaultValue={v?.measuredOn || today}
            className={ficheInputClass}
          />
        </div>

        <div className="col-span-full flex min-w-0 flex-col gap-2 [&>fieldset]:self-start">
          <Segmented
            name="source"
            legend="Source"
            look="track"
            defaultValue={
              (v?.source as "test" | "observed" | "coach_estimate" | undefined) || "test"
            }
            options={[
              { value: "test", label: "Test" },
              { value: "observed", label: "Constaté" },
              { value: "coach_estimate", label: "Estimation coach" },
            ]}
          />
        </div>

        <div className="col-span-full flex min-w-0 flex-col gap-2">
          <label htmlFor="ref-note" className={ficheLabelClass}>
            Note privée du coach {optional}
          </label>
          <textarea
            id="ref-note"
            name="note"
            rows={2}
            maxLength={500}
            defaultValue={v?.note}
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
            className: "rounded-[12px]! text-[14px]! font-medium!",
          })}
        >
          {pending ? "Enregistrement…" : "Ajouter la mesure"}
        </button>
        {error ? (
          <p role="alert" className={errorTextClass}>
            {error}
          </p>
        ) : justSaved ? (
          <p role="status" className="text-[13px] font-medium text-ok">
            Mesure ajoutée.
          </p>
        ) : null}
      </div>
    </form>
  );
}
