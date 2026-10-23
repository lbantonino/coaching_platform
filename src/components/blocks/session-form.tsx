"use client";

import { Check } from "lucide-react";
import { useActionState, useEffect, useState } from "react";

import { buttonClass } from "@/components/ui/button";
import {
  checkboxChipClass,
  errorTextClass,
  hintClass,
  inputClass,
  textareaClass,
  labelClass,
} from "@/components/ui/form-styles";
import { segmentedGroupClass, segmentedItemClass } from "@/components/ui/segmented";
import { disciplineLabels, type Discipline } from "@/domain/training/discipline";
import type { SessionFormState } from "@/features/sessions/actions";
import {
  SESSION_KINDS,
  sessionKindLabels,
  type SessionFormInput,
  type SessionKind,
} from "@/features/sessions/schemas";

// Ordre du menu Discipline (demande d'Antonino, 23/10) : les séances encadrées ont surtout lieu en salle.
const SESSION_DISCIPLINES: Discipline[] = ["strength", "hyrox", "running", "hybrid"];

type Action = (previous: SessionFormState, formData: FormData) => Promise<SessionFormState>;

type Props = {
  action: Action;
  athletes: { id: string; name: string }[];
  initial: SessionFormInput;
  // Modification : le type (et le sportif d'une séance individuelle) ne changent pas.
  locked: boolean;
  submitLabel: string;
  // Fenêtre de l'agenda : la création reste sur la page et prévient la fenêtre (sinon : page de la séance).
  onCreated?: (created: { id: string; title: string }) => void;
};

export function SessionForm({ action, athletes, initial, locked, submitLabel, onCreated }: Props) {
  const [state, formAction, pending] = useActionState(action, {
    error: null,
    attempt: 0,
    values: null,
  });
  const created = state.created ?? null;
  useEffect(() => {
    if (created) onCreated?.(created);
  }, [created, onCreated]);
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
      stay={Boolean(onCreated)}
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
  stay,
}: {
  formAction: (formData: FormData) => void;
  pending: boolean;
  error: string | null;
  values: SessionFormInput;
  athletes: { id: string; name: string }[];
  locked: boolean;
  submitLabel: string;
  stay: boolean;
}) {
  const [kind, setKind] = useState<SessionKind>(v.kind === "individual" ? "individual" : "group");
  const [repeats, setRepeats] = useState(v.repeatsWeekly);
  const [newClient, setNewClient] = useState(v.newClient);
  const individualName = athletes.find((athlete) => athlete.id === v.athleteId)?.name;
  // Séance déjà rattachée à un sportif : il ne change plus. Nouveau client : rattachable une fois.
  const athleteLocked = locked && v.athleteId !== "";

  return (
    <form action={formAction} className="flex flex-col gap-6" noValidate>
      {stay ? <input type="hidden" name="stay" value="1" /> : null}
      {locked ? (
        <p className="text-small text-muted">
          Séance {sessionKindLabels[kind].toLowerCase()}
          {kind === "individual" && individualName ? ` avec ${individualName}` : ""}
          {kind === "individual" && !athleteLocked ? " avec un nouveau client" : ""}. Pour changer
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
            {SESSION_DISCIPLINES.map((discipline) => (
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
        athleteLocked ? null : (
          <div className="flex flex-col gap-3 md:w-1/2">
            {newClient ? (
              <div className="flex flex-col gap-1.5">
                <label htmlFor="session-prospect" className={labelClass}>
                  Nom du nouveau client <span className="font-normal text-muted">(facultatif)</span>
                </label>
                <input
                  id="session-prospect"
                  name="prospectName"
                  defaultValue={v.prospectName}
                  maxLength={80}
                  placeholder="Ex. : Marc"
                  className={inputClass}
                />
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
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
            )}
            {/* Première rencontre (D-35) : une date tout de suite, la fiche du sportif plus tard. */}
            <label className="inline-flex w-fit cursor-pointer items-start gap-2.5 text-small">
              <input
                type="checkbox"
                name="newClient"
                checked={newClient}
                onChange={(event) => setNewClient(event.target.checked)}
                className="mt-0.5 size-4 shrink-0 accent-[var(--text)]"
              />
              <span>
                Nouveau sportif, pas encore créé
                <span className="block text-muted">
                  Crée sa fiche plus tard, puis rattache-lui la séance depuis « Modifier ».
                </span>
              </span>
            </label>
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
          className={textareaClass}
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
