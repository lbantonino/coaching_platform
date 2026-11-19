"use client";

import { useActionState, useState } from "react";

import { buttonClass } from "@/components/ui/button";
import { errorTextClass, hintClass, inputClass, labelClass } from "@/components/ui/form-styles";
import { segmentedGroupClass, segmentedItemClass } from "@/components/ui/segmented";
import { formatPace } from "@/domain/training/pace";
import { parseDuration, proposePaces, vmaFrom5k, vmaFromCooper } from "@/domain/training/vma";
import { addReferencesFromTest, type TestReferenceState } from "@/features/references/actions";
import { referenceKindLabels } from "@/features/references/schemas";
import { formatProposedPace } from "@/features/references/test-form";

const initialState: TestReferenceState = { error: null, saved: 0 };
const numberFr = new Intl.NumberFormat("fr-BE", { maximumFractionDigits: 1 });

type Props = { organizationId: string; athleteId: string; today: string };

// Calcul des allures depuis un test de Cooper ou de 5 km (OPEN-13). L'aperçu est calculé dans le navigateur
// avec les mêmes règles que le serveur ; à l'enregistrement, le serveur refait le calcul lui-même.
export function TestCalculator({ organizationId, athleteId, today }: Props) {
  const [state, formAction, pending] = useActionState(
    addReferencesFromTest.bind(null, organizationId, athleteId),
    initialState,
  );
  // La clé change après chaque enregistrement réussi : les champs et l'aperçu repartent de zéro,
  // ce qui évite d'enregistrer deux fois le même test.
  return (
    <CalculatorForm
      key={state.saved}
      formAction={formAction}
      pending={pending}
      state={state}
      today={today}
    />
  );
}

function CalculatorForm({
  formAction,
  pending,
  state,
  today,
}: {
  formAction: (formData: FormData) => void;
  pending: boolean;
  state: TestReferenceState;
  today: string;
}) {
  const [test, setTest] = useState<"cooper" | "5k">("cooper");
  const [distance, setDistance] = useState("");
  const [time, setTime] = useState("");

  const vma =
    test === "cooper"
      ? distance.trim()
        ? vmaFromCooper(Number(distance))
        : null
      : time.trim()
        ? (() => {
            const seconds = parseDuration(time);
            return seconds === null
              ? { ok: false as const, error: "Temps invalide : écris par exemple 22:30." }
              : vmaFrom5k(seconds);
          })()
        : null;
  const proposals = vma?.ok ? proposePaces(vma.vmaKmh) : [];

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      <fieldset className="flex flex-col gap-1.5">
        <legend className={`${labelClass} mb-1.5`}>Test réalisé</legend>
        <div className={segmentedGroupClass}>
          {(
            [
              ["cooper", "Cooper (12 min)"],
              ["5k", "5 km"],
            ] as const
          ).map(([value, label]) => (
            <label
              key={value}
              className="flex-1 cursor-pointer rounded-sm has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent sm:flex-none"
            >
              <input
                type="radio"
                name="test"
                value={value}
                checked={test === value}
                onChange={() => setTest(value)}
                className="peer sr-only"
              />
              <span className={segmentedItemClass}>{label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-4 md:grid-cols-2">
        {test === "cooper" ? (
          <div className="flex flex-col gap-1.5">
            <label htmlFor="test-distance" className={labelClass}>
              Distance parcourue en 12 min (m)
            </label>
            <input
              id="test-distance"
              name="distance"
              type="number"
              inputMode="numeric"
              min={1000}
              max={5000}
              value={distance}
              onChange={(event) => setDistance(event.target.value)}
              className={`${inputClass} font-mono`}
            />
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            <label htmlFor="test-time" className={labelClass}>
              Temps sur 5 km
            </label>
            <input
              id="test-time"
              name="time"
              inputMode="numeric"
              autoComplete="off"
              placeholder="22:30"
              value={time}
              onChange={(event) => setTime(event.target.value)}
              className={`${inputClass} font-mono`}
            />
          </div>
        )}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="test-date" className={labelClass}>
            Date du test
          </label>
          <input
            id="test-date"
            name="measuredOn"
            type="date"
            max={today}
            defaultValue={today}
            className={`${inputClass} font-mono`}
          />
        </div>
      </div>

      {vma && !vma.ok ? (
        <p role="alert" className={errorTextClass}>
          {vma.error}
        </p>
      ) : null}

      {vma?.ok ? (
        <div className="flex flex-col gap-3 rounded-[14px] border border-line bg-bg p-4">
          <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="text-small text-muted">VMA estimée</span>
            <span className="font-mono text-h3 font-medium tabular" aria-live="polite">
              {numberFr.format(vma.vmaKmh)} km/h
            </span>
            <span className="font-mono text-small text-muted">
              {formatPace(3600 / vma.vmaKmh)} /km
            </span>
          </p>
          <fieldset className="flex flex-col">
            <legend className={`${hintClass} mb-2`}>
              Allures proposées (table par défaut). Décoche celles que tu ne veux pas enregistrer.
            </legend>
            {proposals.map((pace) => (
              <label
                key={pace.kind}
                className="flex cursor-pointer items-center justify-between gap-3 border-t border-line py-2.5 text-small first-of-type:border-t-0"
              >
                <span className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    name="zones"
                    value={pace.kind}
                    defaultChecked
                    className="size-4 accent-[var(--accent)]"
                  />
                  {referenceKindLabels[pace.kind]}
                  <span className="text-caption text-faint">
                    {pace.minPercent === pace.maxPercent
                      ? `${pace.maxPercent} %`
                      : `${pace.minPercent}–${pace.maxPercent} %`}
                  </span>
                </span>
                <span className="font-mono tabular">
                  {formatProposedPace(pace.minSecPerKm, pace.maxSecPerKm)} /km
                </span>
              </label>
            ))}
          </fieldset>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={pending || !vma?.ok}
          className={buttonClass({ variant: "inverse", size: "md" })}
        >
          {pending ? "Enregistrement…" : "Enregistrer ces allures"}
        </button>
        {state.error ? (
          <p role="alert" className={errorTextClass}>
            {state.error}
          </p>
        ) : state.saved > 0 ? (
          <p role="status" className="text-small text-ok">
            Allures enregistrées comme repères.
          </p>
        ) : null}
      </div>
    </form>
  );
}
