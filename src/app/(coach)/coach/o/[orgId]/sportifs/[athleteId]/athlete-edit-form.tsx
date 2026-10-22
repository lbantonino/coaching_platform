"use client";

import { Check } from "lucide-react";
import { useActionState, type ReactNode } from "react";

import { buttonClass } from "@/components/ui/button";
import { errorTextClass, hintClass, inputClass, labelClass } from "@/components/ui/form-styles";
import { Segmented } from "@/components/ui/segmented";
import {
  updateAthlete,
  type AthleteFormValues,
  type UpdateAthleteState,
} from "@/features/athletes/actions";
import {
  ATHLETE_LEVELS,
  athleteLevelLabels,
  CONTACT_CHANNELS,
  contactChannelLabels,
  TRAINING_PLACES,
  trainingPlaceLabels,
  type AthleteStatus,
} from "@/features/athletes/schemas";

type Props = {
  organizationId: string;
  athleteId: string;
  hasAccount: boolean;
  // Valeurs enregistrées, en chaînes (« » = non renseigné), au même format que la saisie.
  values: AthleteFormValues;
};

const initialState: UpdateAthleteState = { error: null, saved: false, values: null };

// Intertitre d'une partie du formulaire (micro-libellé du design system).
function Part({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-4">
      <legend className="mb-4 font-mono text-data tracking-wide text-muted uppercase">
        {title}
      </legend>
      {children}
    </fieldset>
  );
}

export function AthleteEditForm({ organizationId, athleteId, hasAccount, values }: Props) {
  // Organisation et fiche liées à l'action ; l'action les revérifie côté serveur.
  const [state, formAction, pending] = useActionState(
    updateAthlete.bind(null, organizationId, athleteId),
    initialState,
  );
  // Après une erreur, on réaffiche la saisie ; sinon les valeurs enregistrées.
  const shown = state.values ?? values;

  return (
    <form action={formAction} className="flex flex-col gap-7" noValidate>
      <Part title="Identité">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="firstName" className={labelClass}>
              Prénom
            </label>
            <input
              id="firstName"
              name="firstName"
              type="text"
              autoComplete="off"
              required
              maxLength={80}
              defaultValue={shown.firstName}
              className={inputClass}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="lastName" className={labelClass}>
              Nom de famille
            </label>
            <input
              id="lastName"
              name="lastName"
              type="text"
              autoComplete="off"
              maxLength={80}
              defaultValue={shown.lastName}
              className={inputClass}
            />
          </div>
        </div>
      </Part>

      <Part title="Contact">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className={labelClass}>
              Adresse e-mail
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="off"
              inputMode="email"
              defaultValue={shown.email}
              readOnly={hasAccount}
              aria-describedby={hasAccount ? "email-hint" : undefined}
              className={inputClass}
            />
            {hasAccount ? (
              <p id="email-hint" className={hintClass}>
                Identifiant de connexion du sportif : non modifiable ici.
              </p>
            ) : null}
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="phone" className={labelClass}>
              Téléphone
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              autoComplete="off"
              inputMode="tel"
              placeholder="+32 …"
              defaultValue={shown.phone}
              className={inputClass}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="preferredContact" className={labelClass}>
              Canal de contact préféré
            </label>
            <select
              id="preferredContact"
              name="preferredContact"
              defaultValue={shown.preferredContact}
              className={inputClass}
            >
              <option value="">Non précisé</option>
              {CONTACT_CHANNELS.map((channel) => (
                <option key={channel} value={channel}>
                  {contactChannelLabels[channel]}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Part>

      <Part title="Profil sportif">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="level" className={labelClass}>
              Niveau
            </label>
            <select id="level" name="level" defaultValue={shown.level} className={inputClass}>
              <option value="">Non précisé</option>
              {ATHLETE_LEVELS.map((level) => (
                <option key={level} value={level}>
                  {athleteLevelLabels[level]}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="experience" className={labelClass}>
            Expérience
          </label>
          <textarea
            id="experience"
            name="experience"
            rows={2}
            maxLength={500}
            placeholder="Ex. : course depuis 3 ans, un Hyrox en Open, musculation régulière"
            defaultValue={shown.experience}
            className={`${inputClass} h-auto py-3`}
          />
        </div>

        <fieldset className="flex flex-col gap-2">
          <legend className={`${labelClass} mb-2`}>Lieux d&apos;entraînement</legend>
          <div className="flex flex-wrap gap-2">
            {TRAINING_PLACES.map((place) => (
              <label
                key={place}
                className="group inline-flex h-11 cursor-pointer items-center gap-2 rounded-pill border border-line-2 px-3.5 text-small text-muted transition-colors not-has-checked:hover:text-text has-checked:border-inv has-checked:bg-inv has-checked:text-on-inv has-focus-visible:outline-2 has-focus-visible:outline-accent sm:h-9"
              >
                <input
                  type="checkbox"
                  name="trainingPlaces"
                  value={place}
                  defaultChecked={shown.trainingPlaces.includes(place)}
                  className="sr-only"
                />
                <Check
                  aria-hidden
                  size={14}
                  strokeWidth={2}
                  className="hidden group-has-checked:block"
                />
                {trainingPlaceLabels[place]}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="equipment" className={labelClass}>
            Matériel disponible
          </label>
          <textarea
            id="equipment"
            name="equipment"
            rows={2}
            maxLength={500}
            placeholder="Ex. : haltères jusqu'à 20 kg, kettlebell 16 kg, rameur"
            defaultValue={shown.equipment}
            className={`${inputClass} h-auto py-3`}
          />
        </div>
      </Part>

      <div className="flex flex-col gap-1.5">
        <Segmented
          name="status"
          legend="Statut"
          defaultValue={shown.status as AthleteStatus}
          options={[
            { value: "active", label: "Actif" },
            { value: "paused", label: "En pause" },
            { value: "archived", label: "Archivé" },
          ]}
        />
        <p className={hintClass}>
          Archiver retire le sportif de la liste active sans rien effacer ; tu peux le restaurer à
          tout moment.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={pending}
          className={buttonClass({ variant: "primary", size: "md" })}
        >
          {pending ? "Enregistrement…" : "Enregistrer"}
        </button>
        {state.error ? (
          <p role="alert" className={errorTextClass}>
            {state.error}
          </p>
        ) : state.saved ? (
          <p role="status" className="text-small text-ok">
            Modifications enregistrées.
          </p>
        ) : null}
      </div>
    </form>
  );
}
