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
import { formatEuros } from "@/domain/billing/invoices";
import { addVat, parseEuros, splitVat } from "@/domain/billing/payments";
import { disciplineLabels, type Discipline } from "@/domain/training/discipline";
import type { SessionFormState } from "@/features/sessions/actions";
import {
  SESSION_KINDS,
  SESSION_VAT_RATE,
  defaultVatIncluded,
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
  onCreated?: (created: { id: string; title: string; newAthleteName: string | null }) => void;
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
  const [price, setPrice] = useState(v.price);
  const [vatIncluded, setVatIncluded] = useState(v.vatIncluded);
  const [paymentMethod, setPaymentMethod] = useState(v.paymentMethod || "transfer");
  const priceCents = parseEuros(price);
  const individualName = athletes.find((athlete) => athlete.id === v.athleteId)?.name;

  return (
    <form action={formAction} className="flex flex-col gap-6" noValidate>
      {stay ? <input type="hidden" name="stay" value="1" /> : null}
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
        locked ? null : (
          <div className="flex flex-col gap-3 md:w-1/2">
            {newClient ? (
              <div className="flex flex-col gap-1.5">
                <label htmlFor="session-new-athlete" className={labelClass}>
                  Nom du nouveau sportif
                </label>
                <input
                  id="session-new-athlete"
                  name="newAthleteName"
                  defaultValue={v.newAthleteName}
                  maxLength={161}
                  autoComplete="off"
                  placeholder="Ex. : John Martin"
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
            {/* Première rencontre (D-35) : une fiche minimale est créée avec ce nom, à compléter. */}
            <label className="inline-flex w-fit cursor-pointer items-start gap-2.5 text-small">
              <input
                type="checkbox"
                name="newClient"
                checked={newClient}
                onChange={(event) => setNewClient(event.target.checked)}
                className="mt-0.5 size-4 shrink-0 accent-[var(--text)]"
              />
              <span>
                Nouveau sportif
                <span className="block text-muted">
                  Sa fiche est créée tout de suite dans Sportifs, avec son nom seulement : tu la
                  compléteras ensuite.
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

      {/* Prix (D-52, demande d'Antonino) : quand le coach marque une date « payée », ce montant compte
          dans « Encaissé cette semaine ». Collective : un seul prix pour toute la séance. Règle de
          Gianluca : virement = facturé, prix hors TVA (la TVA s'ajoute) ; espèces = prix direct, TVA
          comprise. La case suit le mode choisi, le coach peut la changer. */}
      <fieldset className="flex flex-col gap-3">
        <legend className={`${labelClass} mb-2`}>
          Prix <span className="font-normal text-muted">(facultatif)</span>
        </legend>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="session-price" className={labelClass}>
              {kind === "group" ? "Prix pour toute la séance (€)" : "Prix de la séance (€)"}
            </label>
            <input
              id="session-price"
              name="price"
              inputMode="decimal"
              autoComplete="off"
              placeholder="Ex. : 65"
              value={price}
              onChange={(event) => setPrice(event.target.value)}
              aria-describedby="session-price-hint"
              className={`${inputClass} font-mono`}
            />
          </div>
          <fieldset className="flex flex-col gap-1.5">
            <legend className={`${labelClass} mb-1.5`}>Paiement</legend>
            <div className={segmentedGroupClass}>
              {(
                [
                  ["transfer", "Virement"],
                  ["cash", "Espèces"],
                ] as const
              ).map(([method, label]) => (
                <label
                  key={method}
                  className="flex-1 cursor-pointer rounded-sm has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent"
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={method}
                    checked={paymentMethod === method}
                    onChange={() => {
                      setPaymentMethod(method);
                      setVatIncluded(defaultVatIncluded(method));
                    }}
                    className="peer sr-only"
                  />
                  <span className={segmentedItemClass}>{label}</span>
                </label>
              ))}
            </div>
          </fieldset>
        </div>
        <label className="inline-flex w-fit cursor-pointer items-center gap-2.5 text-small">
          <input
            type="checkbox"
            name="vatIncluded"
            checked={vatIncluded}
            onChange={(event) => setVatIncluded(event.target.checked)}
            className="size-4 accent-[var(--text)]"
          />
          TVA comprise dans le prix
        </label>
        <p id="session-price-hint" className={hintClass}>
          {priceCents === null
            ? "Sans prix, la séance ne compte pas dans l'encaissé."
            : vatIncluded
              ? `${formatEuros(priceCents)} reçus, TVA comprise : ${formatEuros(splitVat(priceCents, SESSION_VAT_RATE).exclCents)} HTVA et ${formatEuros(splitVat(priceCents, SESSION_VAT_RATE).vatCents)} de TVA.`
              : `${formatEuros(priceCents)} HTVA : le sportif paie ${formatEuros(addVat(priceCents, SESSION_VAT_RATE))}, TVA de ${SESSION_VAT_RATE} % comprise.`}
        </p>
      </fieldset>

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
