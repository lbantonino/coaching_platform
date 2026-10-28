import { Check } from "lucide-react";
import type { ReactNode } from "react";

import {
  checkboxChipClass,
  hintClass,
  inputClass,
  textareaClass,
  labelClass,
} from "@/components/ui/form-styles";
import { FieldCheck } from "@/components/ui/field-check";
import type { AthleteFormValues, AvailabilityFormValues } from "@/features/athletes/actions";
import {
  ATHLETE_LEVELS,
  athleteLevelLabels,
  SEXES,
  sexLabels,
  CONTACT_CHANNELS,
  contactChannelLabels,
  TRAINING_PLACES,
  trainingPlaceLabels,
  WEEK_DAYS,
  weekDayLabels,
} from "@/features/athletes/schemas";

// Champs d'une fiche sportif, partagés par la page « Nouveau sportif » (D-54) et les onglets Profil
// et Disponibilités de la fiche : mêmes libellés, mêmes limites, une seule source. Chaque groupe ne
// contient que des champs ; le formulaire qui les entoure (et son action) reste à la page.

// Intertitre d'une partie du formulaire (micro-libellé du design system).
export function Part({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-4">
      <legend className="mb-4 font-mono text-data tracking-wide text-muted uppercase">
        {title}
      </legend>
      {children}
    </fieldset>
  );
}

type Values = Pick<AthleteFormValues, "firstName" | "lastName" | "sex">;

export function IdentityFields({
  values,
  optionalLastName = false,
}: {
  values: Values;
  optionalLastName?: boolean;
}) {
  return (
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
          defaultValue={values.firstName}
          className={inputClass}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="lastName" className={labelClass}>
          Nom de famille
          {optionalLastName ? <span className="font-normal text-muted"> (facultatif)</span> : null}
        </label>
        <input
          id="lastName"
          name="lastName"
          type="text"
          autoComplete="off"
          maxLength={80}
          defaultValue={values.lastName}
          className={inputClass}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="sex" className={labelClass}>
          Sexe <span className="font-normal text-muted">(facultatif)</span>
        </label>
        <select id="sex" name="sex" defaultValue={values.sex} className={inputClass}>
          <option value="">Non renseigné</option>
          {SEXES.map((sex) => (
            <option key={sex} value={sex}>
              {sexLabels[sex]}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export function ContactFields({
  values,
  hasAccount = false,
  optional = false,
}: {
  values: Pick<AthleteFormValues, "email" | "phone" | "preferredContact">;
  // Compte activé : l'e-mail est l'identifiant de connexion, il ne se change pas ici.
  hasAccount?: boolean;
  // Nouveau sportif : on précise que l'e-mail et le téléphone sont facultatifs.
  optional?: boolean;
}) {
  const facultatif = optional ? (
    <span className="font-normal text-muted"> (facultatif)</span>
  ) : null;
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className={labelClass}>
          Adresse e-mail{facultatif}
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="off"
          inputMode="email"
          defaultValue={values.email}
          readOnly={hasAccount}
          aria-describedby={hasAccount ? "email-hint" : optional ? "email-invite-hint" : undefined}
          className={inputClass}
        />
        {hasAccount ? null : <FieldCheck htmlFor="email" rule="email" />}
        {hasAccount ? (
          <p id="email-hint" className={hintClass}>
            Identifiant de connexion du sportif : non modifiable ici.
          </p>
        ) : optional ? (
          <p id="email-invite-hint" className={hintClass}>
            Il servira à l&apos;inviter dans son espace sportif.
          </p>
        ) : null}
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="phone" className={labelClass}>
          Téléphone{facultatif}
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          autoComplete="off"
          inputMode="tel"
          placeholder="+32 …"
          defaultValue={values.phone}
          className={inputClass}
        />
        <FieldCheck htmlFor="phone" rule="phone" />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="preferredContact" className={labelClass}>
          Canal de contact préféré
        </label>
        <select
          id="preferredContact"
          name="preferredContact"
          defaultValue={values.preferredContact}
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
  );
}

// Niveau, expérience, lieux et matériel. `besideLevel` : champ ajouté dans la grille, à côté du
// niveau (le type de programme, sur la page « Nouveau sportif »).
export function SportProfileFields({
  values,
  besideLevel,
}: {
  values: Pick<AthleteFormValues, "level" | "experience" | "trainingPlaces" | "equipment">;
  besideLevel?: ReactNode;
}) {
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="level" className={labelClass}>
            Niveau
          </label>
          <select id="level" name="level" defaultValue={values.level} className={inputClass}>
            <option value="">Non précisé</option>
            {ATHLETE_LEVELS.map((level) => (
              <option key={level} value={level}>
                {athleteLevelLabels[level]}
              </option>
            ))}
          </select>
        </div>
        {besideLevel}
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
          defaultValue={values.experience}
          className={textareaClass}
        />
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className={`${labelClass} mb-2`}>Lieux d&apos;entraînement</legend>
        <div className="flex flex-wrap gap-2">
          {TRAINING_PLACES.map((place) => (
            <label key={place} className={checkboxChipClass}>
              <input
                type="checkbox"
                name="trainingPlaces"
                value={place}
                defaultChecked={values.trainingPlaces.includes(place)}
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
          defaultValue={values.equipment}
          className={textareaClass}
        />
      </div>
    </>
  );
}

// Séances par semaine, durée maximale, jours, contraintes d'organisation. Les blessures et points
// d'attention ont leur propre champ (HealthConstraintsField) : il n'existe qu'avec un accord.
export function AvailabilityFields({
  values,
}: {
  values: Pick<
    AvailabilityFormValues,
    "sessionsPerWeek" | "maxSessionMinutes" | "availableDays" | "scheduleConstraints"
  >;
}) {
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="sessionsPerWeek" className={labelClass}>
            Séances par semaine
          </label>
          <input
            id="sessionsPerWeek"
            name="sessionsPerWeek"
            type="number"
            inputMode="numeric"
            min={1}
            max={14}
            defaultValue={values.sessionsPerWeek}
            className={`${inputClass} font-mono`}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="maxSessionMinutes" className={labelClass}>
            Durée maximale d&apos;une séance (min)
          </label>
          <input
            id="maxSessionMinutes"
            name="maxSessionMinutes"
            type="number"
            inputMode="numeric"
            min={10}
            max={300}
            step={5}
            defaultValue={values.maxSessionMinutes}
            className={`${inputClass} font-mono`}
          />
        </div>
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className={`${labelClass} mb-2`}>Jours disponibles</legend>
        <div className="flex flex-wrap gap-2">
          {WEEK_DAYS.map((day) => (
            <label key={day} className={checkboxChipClass}>
              <input
                type="checkbox"
                name="availableDays"
                value={day}
                defaultChecked={values.availableDays.includes(day)}
                className="sr-only"
              />
              <Check
                aria-hidden
                size={14}
                strokeWidth={2}
                className="hidden group-has-checked:block"
              />
              {weekDayLabels[day]}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="scheduleConstraints" className={labelClass}>
          Contraintes d&apos;organisation
        </label>
        <textarea
          id="scheduleConstraints"
          name="scheduleConstraints"
          rows={2}
          maxLength={500}
          placeholder="Ex. : déplacements le jeudi ; séances avant 8 h en semaine"
          defaultValue={values.scheduleConstraints}
          className={textareaClass}
        />
      </div>
    </>
  );
}

// Blessures et points d'attention (D-56, ancien « contraintes physiques ») : donnée de santé, sans
// diagnostic, et seulement avec l'accord du sportif.
export function HealthConstraintsField({ value }: { value: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor="healthConstraints" className={labelClass}>
        Blessures et points d&apos;attention
      </label>
      <textarea
        id="healthConstraints"
        name="healthConstraints"
        rows={4}
        maxLength={1000}
        aria-describedby="health-hint"
        placeholder="Ex. : entorse de la cheville droite en septembre, éviter les sauts ; dos sensible en soulevé de terre"
        defaultValue={value}
        className={textareaClass}
      />
      <p id="health-hint" className={hintClass}>
        Ce qui change l&apos;entraînement : blessures, douleurs, zones à ménager. Pas de diagnostic
        ni de traitement.
      </p>
    </div>
  );
}

// Notes libres (D-56) : la note privée du coach, tout ce qui n'est pas de la santé.
export function CoachNoteField({ value, id = "coachNote" }: { value: string; id?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className={labelClass}>
        Notes libres <span className="font-normal text-muted">(facultatif)</span>
      </label>
      <textarea
        id={id}
        name="coachNote"
        rows={4}
        maxLength={2000}
        aria-describedby={`${id}-hint`}
        placeholder="Ex. : très motivée, préfère les séances du matin ; vient en vélo ; aime les défis chronométrés"
        defaultValue={value}
        className={textareaClass}
      />
      <p id={`${id}-hint`} className={hintClass}>
        Caractère, préférences, logistique… Visible seulement par les coachs. Pas de blessures ici :
        elles vont dans « Blessures et points d&apos;attention », avec l&apos;accord du sportif.
      </p>
    </div>
  );
}
