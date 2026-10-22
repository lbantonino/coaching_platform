"use client";

import { Check } from "lucide-react";
import { useActionState, useState } from "react";

import { buttonClass } from "@/components/ui/button";
import {
  checkboxChipClass,
  errorTextClass,
  hintClass,
  inputClass,
  labelClass,
} from "@/components/ui/form-styles";
import { segmentedGroupClass, segmentedItemClass } from "@/components/ui/segmented";
import { DISCIPLINES, disciplineLabels } from "@/domain/training/discipline";
import type { SessionFormState } from "@/features/sessions/actions";
import {
  SESSION_KINDS,
  sessionKindLabels,
  type SessionFormInput,
  type SessionKind,
} from "@/features/sessions/schemas";

type Action = (previous: SessionFormState, formData: FormData) => Promise<SessionFormState>;

type Props = {
  action: Action;
  athletes: { id: string; name: string }[];
  initial: SessionFormInput;
  // Modification : le type (et le sportif d'une séance individuelle) ne changent pas.
  locked: boolean;
  submitLabel: string;
};

export function SessionForm({ action, athletes, initial, locked, submitLabel }: Props) {
  const [state, formAction, pending] = useActionState(action, {
    error: null,
    attempt: 0,
    values: null,
  });
  return (
    // Reconstruit après chaque réponse : la saisie renvoyée s'affiche partout, menus compris.
    <SessionFields
      key={state.attempt}
      formAction={formAction}
      pending={pending}
      error={state.error}
      values={state.values ?? initial}
      athletes={athletes}
      locked={locked}
      submitLabel={submitLabel}
    />
  );
}

function SessionFields({
  formAction,
  pending,
  error,
  values: v,
  athletes,
  locked,
  submitLabel,
}: {
  formAction: (formData: FormData) => void;
  pending: boolean;
  error: string | null;
  values: SessionFormInput;
  athletes: { id: string; name: string }[];
  locked: boolean;
  submitLabel: string;
}) {
  const [kind, setKind] = useState<SessionKind>(v.kind === "individual" ? "individual" : "group");
  const [repeats, setRepeats] = useState(v.repeatsWeekly);
  const individualName = athletes.find((athlete) => athlete.id === v.athleteId)?.name;

  return (
    <form action={formAction} className="flex flex-col gap-6" noValidate>
      {locked ? (
        <p className="text-small text-muted">
          Séance {sessionKindLabels[kind].toLowerCase()}
          {kind === "individual" && individualName ? ` avec ${individualName}` : ""}. Pour changer
          de type ou de sportif, supprime la séance et crée-en une nouvelle.
        </p>
      ) : (
        <fieldset className="flex flex-col gap-1.5">
          <legend className="mb-1.5 text-small font-medium">Type de séance</legend>
          <div className={segmentedGroupClass}>
            {SESSION_KINDS.map((option) => (
              <label
                key={option}
                className="flex-1 cursor-pointer rounded-sm has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent sm:flex-none"
              >
                <input
                  type="radio"
                  name="kind"
                  value={option}
                  checked={kind === option}
                  onChange={() => setKind(option)}
                  className="peer sr-only"
                />
                <span className={segmentedItemClass}>{sessionKindLabels[option]}</span>
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-1.5 md:col-span-2">
          <label htmlFor="session-title" className={labelClass}>
            Titre
          </label>
          <input
            id="session-title"
            name="title"
            autoComplete="off"
            maxLength={120}
            placeholder={kind === "group" ? "Ex. : Piste du mercredi" : "Ex. : Coaching force"}
            defaultValue={v.title}
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="session-discipline" className={labelClass}>
            Discipline <span className="font-normal text-muted">(facultatif)</span>
          </label>
          <select
            id="session-discipline"
            name="discipline"
            defaultValue={v.discipline}
            className={inputClass}
          >
            <option value="">Non précisée</option>
            {DISCIPLINES.map((discipline) => (
              <option key={discipline} value={discipline}>
                {disciplineLabels[discipline]}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="session-location" className={labelClass}>
            Lieu <span className="font-normal text-muted">(facultatif)</span>
          </label>
          <input
            id="session-location"
            name="location"
            autoComplete="off"
            maxLength={120}
            placeholder="Ex. : Piste d'athlétisme, salle, parc"
            defaultValue={v.location}
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="session-date" className={labelClass}>
            {repeats ? "Première séance" : "Date"}
          </label>
          <input
            id="session-date"
            name="startsOn"
            type="date"
            defaultValue={v.startsOn}
            className={`${inputClass} font-mono`}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="session-time" className={labelClass}>
              Heure
            </label>
            <input
              id="session-time"
              name="startTime"
              type="time"
              defaultValue={v.startTime}
              className={`${inputClass} font-mono`}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="session-duration" className={labelClass}>
              Durée (min)
            </label>
            <input
              id="session-duration"
              name="durationMinutes"
              type="number"
              inputMode="numeric"
              min={15}
              max={480}
              step={5}
              defaultValue={v.durationMinutes}
              className={`${inputClass} font-mono`}
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <label className="inline-flex w-fit cursor-pointer items-center gap-2.5 text-small">
          <input
            type="checkbox"
            name="repeatsWeekly"
            checked={repeats}
            onChange={(event) => setRepeats(event.target.checked)}
            className="size-4 accent-[var(--text)]"
          />
          Chaque semaine, le même jour et à la même heure
        </label>
        {repeats ? (
          <div className="flex flex-col gap-1.5 md:w-1/2">
            <label htmlFor="session-ends" className={labelClass}>
              Jusqu&apos;au <span className="font-normal text-muted">(facultatif)</span>
            </label>
            <input
              id="session-ends"
              name="endsOn"
              type="date"
              defaultValue={v.endsOn}
              aria-describedby="session-ends-hint"
              className={`${inputClass} font-mono`}
            />
            <p id="session-ends-hint" className={hintClass}>
              Sans date de fin, la séance continue chaque semaine.
            </p>
          </div>
        ) : null}
      </div>

      {kind === "individual" ? (
        locked ? null : (
          <div className="flex flex-col gap-1.5 md:w-1/2">
            <label htmlFor="session-athlete" className={labelClass}>
              Sportif
            </label>
            <select
              id="session-athlete"
              name="athleteId"
              defaultValue={v.athleteId}
              className={inputClass}
            >
              <option value="">Choisir…</option>
              {athletes.map((athlete) => (
                <option key={athlete.id} value={athlete.id}>
                  {athlete.name}
                </option>
              ))}
            </select>
          </div>
        )
      ) : (
        <fieldset className="flex flex-col gap-2">
          <legend className={`${labelClass} mb-2`}>
            Sportifs inscrits <span className="font-normal text-muted">(facultatif)</span>
          </legend>
          {athletes.length === 0 ? (
            <p className={hintClass}>Aucun sportif actif pour l&apos;instant.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {athletes.map((athlete) => (
                <label key={athlete.id} className={checkboxChipClass}>
                  <input
                    type="checkbox"
                    name="athleteIds"
                    value={athlete.id}
                    defaultChecked={v.athleteIds.includes(athlete.id)}
                    className="sr-only"
                  />
                  <Check
                    aria-hidden
                    size={14}
                    strokeWidth={2}
                    className="hidden group-has-checked:block"
                  />
                  {athlete.name}
                </label>
              ))}
            </div>
          )}
        </fieldset>
      )}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="session-notes" className={labelClass}>
          Note du coach <span className="font-normal text-muted">(facultatif)</span>
        </label>
        <textarea
          id="session-notes"
          name="notes"
          rows={2}
          maxLength={500}
          placeholder="Ex. : prévoir chronos et plots"
          defaultValue={v.notes}
          className={`${inputClass} h-auto py-3`}
        />
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={pending}
          className={buttonClass({ variant: "primary", size: "md" })}
        >
          {pending ? "Enregistrement…" : submitLabel}
        </button>
        {error ? (
          <p role="alert" className={errorTextClass}>
            {error}
          </p>
        ) : null}
      </div>
    </form>
  );
}
