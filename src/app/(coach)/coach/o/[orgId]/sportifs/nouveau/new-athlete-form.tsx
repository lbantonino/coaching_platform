"use client";

import { ShieldCheck } from "lucide-react";
import { useActionState, useState } from "react";

import { buttonClass } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FieldCheck } from "@/components/ui/field-check";
import { errorTextClass, hintClass, inputClass, labelClass } from "@/components/ui/form-styles";
import { Segmented } from "@/components/ui/segmented";
import { DISCIPLINES, disciplineLabels } from "@/domain/training/discipline";
import { createAthlete, type NewAthleteState } from "@/features/athletes/actions";
import type { NewAthleteFormInput } from "@/features/athletes/new-athlete";
import type { AthleteStatus } from "@/features/athletes/schemas";
import { COACH_PROOFS, coachProofLabels } from "@/features/consents/schemas";
import { goalTypeGroups, goalTypeLabels } from "@/features/goals/schemas";

import {
  AvailabilityFields,
  CoachNoteField,
  ContactFields,
  HealthConstraintsField,
  IdentityFields,
  Part,
  SportProfileFields,
} from "../athlete-fields";

// Page « Nouveau sportif » (D-54, prompt Claude Design §7.2) : la fiche complète en une fois.
// Téléphone (mobile first) : les sections s'empilent ; le bouton rouge reste collé en bas. Ordinateur :
// le formulaire sur 8 colonnes, la colonne de droite (rappel des données de santé + bouton) collée en
// haut pendant le défilement. Seul le prénom est obligatoire. Section Notes (D-56) : blessures avec
// l'accord du sportif, et notes libres.
const emptyValues: NewAthleteFormInput = {
  firstName: "",
  lastName: "",
  sex: "",
  email: "",
  phone: "",
  status: "active",
  preferredContact: "",
  level: "",
  experience: "",
  trainingPlaces: [],
  equipment: "",
  programType: "",
  sessionsPerWeek: "",
  maxSessionMinutes: "",
  availableDays: [],
  scheduleConstraints: "",
  healthConstraints: "",
  goalType: "",
  goalDate: "",
  competitionName: "",
  healthConsent: false,
  consentProof: "",
  coachNote: "",
};

const initialState: NewAthleteState = { error: null, attempt: 0, values: null };

const sectionClass = "rounded-card border border-line bg-surface p-[18px] md:p-[22px]";

export function NewAthleteForm({ organizationId }: { organizationId: string }) {
  // L'organisation est liée à l'action ; l'action la revérifie de toute façon côté serveur.
  const [state, formAction, pending] = useActionState(
    createAthlete.bind(null, organizationId),
    initialState,
  );
  return (
    // Reconstruit après chaque réponse : la saisie renvoyée s'affiche partout, menus et cases compris.
    <NewAthleteFields
      key={state.attempt}
      formAction={formAction}
      pending={pending}
      error={state.error}
      values={state.values ?? emptyValues}
    />
  );
}

function NewAthleteFields({
  formAction,
  pending,
  error,
  values: v,
}: {
  formAction: (formData: FormData) => void;
  pending: boolean;
  error: string | null;
  values: NewAthleteFormInput;
}) {
  const [consent, setConsent] = useState(v.healthConsent);

  return (
    <form
      action={formAction}
      noValidate
      className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12 lg:gap-4"
    >
      <div className="flex min-w-0 flex-col gap-6 lg:col-span-8 lg:gap-4">
        <section className={sectionClass}>
          <div className="flex flex-col gap-7">
            <Part title="Identité">
              <IdentityFields values={v} optionalLastName />
            </Part>
            <Part title="Contact">
              <ContactFields values={v} optional />
            </Part>
          </div>
        </section>

        <section className={sectionClass}>
          <Part title="Profil sportif">
            <SportProfileFields
              values={v}
              besideLevel={
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="programType" className={labelClass}>
                    Type de programme
                  </label>
                  <select
                    id="programType"
                    name="programType"
                    defaultValue={v.programType}
                    className={inputClass}
                  >
                    <option value="">Non précisé</option>
                    {DISCIPLINES.map((discipline) => (
                      <option key={discipline} value={discipline}>
                        {disciplineLabels[discipline]}
                      </option>
                    ))}
                  </select>
                </div>
              }
            />
            <Segmented
              name="status"
              legend="Statut"
              defaultValue={(v.status || "active") as AthleteStatus}
              options={[
                { value: "active", label: "Actif" },
                { value: "paused", label: "En pause" },
                { value: "archived", label: "Archivé" },
              ]}
            />
          </Part>
        </section>

        <section className={sectionClass}>
          <Part title="Objectif principal">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="goalType" className={labelClass}>
                  Type d&apos;objectif <span className="font-normal text-muted">(facultatif)</span>
                </label>
                <select
                  id="goalType"
                  name="goalType"
                  defaultValue={v.goalType}
                  className={inputClass}
                >
                  <option value="">Pas encore défini</option>
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
              <div className="flex flex-col gap-1.5">
                <label htmlFor="goalDate" className={labelClass}>
                  Date visée <span className="font-normal text-muted">(facultatif)</span>
                </label>
                <input
                  id="goalDate"
                  name="goalDate"
                  type="date"
                  defaultValue={v.goalDate}
                  className={`${inputClass} font-mono`}
                />
                <FieldCheck htmlFor="goalDate" rule="future-date" />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="competitionName" className={labelClass}>
                Prochaine compétition <span className="font-normal text-muted">(facultatif)</span>
              </label>
              <input
                id="competitionName"
                name="competitionName"
                autoComplete="off"
                maxLength={120}
                placeholder="Ex. : Hyrox Bruxelles"
                defaultValue={v.competitionName}
                aria-describedby="competition-hint"
                className={inputClass}
              />
              <p id="competition-hint" className={hintClass}>
                Avec un nom, l&apos;objectif devient une compétition : indique alors sa date.
              </p>
            </div>
          </Part>
        </section>

        <section className={sectionClass}>
          <Part title="Disponibilités">
            <AvailabilityFields values={v} />
          </Part>
        </section>

        {/* Notes (D-56, demande d'Antonino) : les blessures, avec l'accord du sportif (donnée de
            santé, journalisée), puis des notes libres, privées au coach. */}
        <section aria-labelledby="new-athlete-notes" className={sectionClass}>
          <div className="flex flex-col gap-7">
            <fieldset className="flex flex-col gap-4">
              <legend
                id="new-athlete-notes"
                className="mb-4 font-mono text-data tracking-wide text-muted uppercase"
              >
                Notes
              </legend>
              <div
                role="group"
                aria-labelledby="health-block-title"
                className="flex flex-col gap-3 rounded-[14px] border border-line p-4"
              >
                <h3 id="health-block-title" className="text-small font-medium">
                  Blessures et points d&apos;attention
                </h3>
                <label className="flex cursor-pointer items-start gap-2.5 text-small">
                  <input
                    type="checkbox"
                    name="healthConsent"
                    checked={consent}
                    onChange={(event) => setConsent(event.target.checked)}
                    className="mt-0.5 size-4 shrink-0 accent-[var(--accent)]"
                  />
                  Le sportif m&apos;a donné son accord explicite pour que je note ses blessures et
                  points d&apos;attention.
                </label>
                {consent ? (
                  <>
                    <div className="flex flex-col gap-1.5 md:w-1/2">
                      <label htmlFor="consentProof" className={labelClass}>
                        Comment ?
                      </label>
                      <select
                        id="consentProof"
                        name="consentProof"
                        defaultValue={v.consentProof}
                        className={inputClass}
                      >
                        <option value="" disabled>
                          Choisir…
                        </option>
                        {COACH_PROOFS.map((proof) => (
                          <option key={proof} value={proof}>
                            {coachProofLabels[proof]}
                          </option>
                        ))}
                      </select>
                    </div>
                    <HealthConstraintsField value={v.healthConstraints} />
                  </>
                ) : (
                  <p className={hintClass}>
                    Donnée de santé : coche l&apos;accord pour les noter. Sans accord, tu pourras le
                    faire plus tard depuis sa fiche.
                  </p>
                )}
              </div>
              <CoachNoteField value={v.coachNote} />
            </fieldset>
          </div>
        </section>
      </div>

      <div className="flex min-w-0 flex-col gap-4 lg:sticky lg:top-6 lg:col-span-4">
        {/* Données de santé (D-20, D-56) : rappel, le choix se fait dans la section Notes. */}
        <Card id="health-info-title" title="Données de santé">
          <p className="flex items-start gap-2 text-small text-muted">
            <ShieldCheck
              aria-hidden
              size={16}
              strokeWidth={1.8}
              className="mt-0.5 shrink-0 text-ok"
            />
            Les blessures ne se notent qu&apos;avec l&apos;accord explicite du sportif (section
            Notes). Il peut le retirer à tout moment : ce qui a été noté est alors effacé.
          </p>
        </Card>

        {/* Ordinateur : le bouton sous la carte, collé en haut avec elle. */}
        <div className="flex flex-col gap-3 max-lg:hidden">
          <SubmitArea pending={pending} error={error} />
        </div>
      </div>

      {/* Téléphone (audit apple-design du 28/10) : le bouton reste visible tout le long du formulaire,
          dans une barre translucide collée en bas ; le contenu défile dessous. */}
      <div className="material sticky bottom-0 z-20 -mx-3.5 flex flex-col gap-2 border-t px-3.5 pt-3 pb-[max(12px,env(safe-area-inset-bottom))] lg:hidden">
        <SubmitArea pending={pending} error={error} />
      </div>
    </form>
  );
}

function SubmitArea({ pending, error }: { pending: boolean; error: string | null }) {
  return (
    <>
      {error ? (
        <p role="alert" className={errorTextClass}>
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className={buttonClass({ variant: "primary", size: "lg", className: "w-full" })}
      >
        {pending ? "Enregistrement…" : "Enregistrer le sportif"}
      </button>
      <p className={`${hintClass} max-lg:hidden`}>
        Seul le prénom est obligatoire : le reste se complète plus tard.
      </p>
    </>
  );
}
