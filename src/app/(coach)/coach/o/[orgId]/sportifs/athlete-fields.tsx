import { Check } from "lucide-react";
import type { ReactNode } from "react";

import {
  checkboxChipClass,
  ficheChipClass,
  ficheGridClass,
  ficheHintClass,
  ficheInputClass,
  ficheLabelClass,
  ficheOvertitleClass,
  ficheTextareaClass,
  hintClass,
  inputClass,
  kitHintClass,
  kitInputClass,
  kitLabelClass,
  kitOptionalClass,
  kitPillClass,
  kitTextareaBaseClass,
  kitTextareaClass,
  textareaClass,
  labelClass,
} from "@/components/ui/form-styles";
import { FieldCheck } from "@/components/ui/field-check";
import { FEATURES } from "@/config/features";
import type {
  AddressFormValues,
  AthleteFormValues,
  AvailabilityFormValues,
} from "@/features/athletes/actions";
import {
  ATHLETE_LEVELS,
  athleteLevelLabels,
  SEXES,
  sexLabels,
  CONTACT_CHANNELS,
  contactChannelLabels,
  COUNTRIES,
  TRAINING_PLACES,
  trainingPlaceLabels,
  WEEK_DAYS,
  weekDayLabels,
} from "@/features/athletes/schemas";

// Champs d'une fiche sportif, partagés par la page « Nouveau sportif » (D-54) et les onglets Profil
// et Disponibilités de la fiche : mêmes libellés, mêmes limites, une seule source. Chaque groupe ne
// contient que des champs ; le formulaire qui les entoure (et son action) reste à la page.

// Habillage des champs : celui de l'app, celui de la fiche (maquette « Sportifs » du 03/11/2026 :
// champs de 46 px, sur-titres en capitales, grille de colonnes de 240 px) ou celui du kit « Coory
// Pages » (page 10 « Nouveau sportif », D-126 : champs gris pâle de 48 / 46 px, pilules violettes,
// deux colonnes à partir de 900 px, « facultatif » sans parenthèses).
export type FieldLook = "app" | "fiche" | "kit";

function looks(look: FieldLook) {
  if (look === "kit") {
    return {
      input: kitInputClass,
      textarea: kitTextareaClass,
      label: kitLabelClass,
      hint: kitHintClass,
      chip: kitPillClass,
      grid: "grid gap-4 min-[56.25rem]:grid-cols-2",
      field: "flex min-w-0 flex-col gap-2",
      optional: kitOptionalClass,
      optionalText: "facultatif",
    };
  }
  return look === "fiche"
    ? {
        input: ficheInputClass,
        textarea: ficheTextareaClass,
        label: ficheLabelClass,
        hint: ficheHintClass,
        chip: ficheChipClass,
        grid: ficheGridClass,
        field: "flex min-w-0 flex-col gap-2",
        optional: "font-normal text-faint",
        optionalText: "(facultatif)",
      }
    : {
        input: inputClass,
        textarea: textareaClass,
        label: labelClass,
        hint: hintClass,
        chip: checkboxChipClass,
        grid: "grid gap-4 md:grid-cols-2",
        field: "flex flex-col gap-1.5",
        optional: "font-normal text-muted",
        optionalText: "(facultatif)",
      };
}

// Intertitre d'une partie du formulaire (micro-libellé du design system ; sur-titre sur la fiche).
export function Part({
  title,
  look = "app",
  children,
}: {
  title: string;
  look?: FieldLook;
  children: ReactNode;
}) {
  return (
    <fieldset className="flex min-w-0 flex-col gap-4">
      <legend
        className={
          look === "fiche"
            ? `${ficheOvertitleClass} mb-4`
            : "mb-4 font-mono text-data tracking-wide text-muted uppercase"
        }
      >
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
  look = "app",
}: {
  values: Values;
  optionalLastName?: boolean;
  look?: FieldLook;
}) {
  const s = looks(look);
  return (
    <div className={s.grid}>
      <div className={s.field}>
        <label htmlFor="firstName" className={s.label}>
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
          className={s.input}
        />
      </div>
      <div className={s.field}>
        <label htmlFor="lastName" className={s.label}>
          Nom de famille
          {optionalLastName ? <span className={s.optional}> {s.optionalText}</span> : null}
        </label>
        <input
          id="lastName"
          name="lastName"
          type="text"
          autoComplete="off"
          maxLength={80}
          defaultValue={values.lastName}
          className={s.input}
        />
      </div>
      <div className={s.field}>
        <label htmlFor="sex" className={s.label}>
          Sexe <span className={s.optional}>{s.optionalText}</span>
        </label>
        <select id="sex" name="sex" defaultValue={values.sex} className={s.input}>
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
  look = "app",
}: {
  values: Pick<AthleteFormValues, "email" | "phone" | "preferredContact">;
  // Compte activé : l'e-mail est l'identifiant de connexion, il ne se change pas ici.
  hasAccount?: boolean;
  // Nouveau sportif : on précise que l'e-mail et le téléphone sont facultatifs.
  optional?: boolean;
  look?: FieldLook;
}) {
  const s = looks(look);
  const facultatif = optional ? <span className={s.optional}> {s.optionalText}</span> : null;
  return (
    <div className={s.grid}>
      <div className={s.field}>
        <label htmlFor="email" className={s.label}>
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
          className={s.input}
        />
        {hasAccount ? null : <FieldCheck htmlFor="email" rule="email" />}
        {hasAccount ? (
          <p id="email-hint" className={s.hint}>
            Identifiant de connexion du sportif : non modifiable ici.
          </p>
        ) : optional ? (
          <p id="email-invite-hint" className={s.hint}>
            {FEATURES.invitations
              ? "Elle servira à l'inviter dans son espace sportif."
              : "Pour garder un moyen de contact."}
          </p>
        ) : null}
      </div>
      <div className={s.field}>
        <label htmlFor="phone" className={s.label}>
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
          className={s.input}
        />
        <FieldCheck htmlFor="phone" rule="phone" />
      </div>
      <div className={s.field}>
        <label htmlFor="preferredContact" className={s.label}>
          Canal de contact préféré
        </label>
        <select
          id="preferredContact"
          name="preferredContact"
          defaultValue={values.preferredContact}
          className={s.input}
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

// Adresse postale (D-65) : ses coordonnées, utiles pour ses factures faites hors de Coory (D-90).
export function AddressFields({
  values,
  look = "app",
}: {
  values: AddressFormValues;
  look?: FieldLook;
}) {
  const s = looks(look);
  return (
    <div className={s.grid}>
      <div className={`${s.field} col-span-full`}>
        <label htmlFor="addressLine" className={s.label}>
          Rue et numéro
        </label>
        <input
          id="addressLine"
          name="addressLine"
          autoComplete="off"
          defaultValue={values.addressLine}
          aria-describedby="address-hint"
          className={s.input}
        />
        <p id="address-hint" className={s.hint}>
          Utile pour ses factures, faites dans ton logiciel de facturation.
        </p>
      </div>
      <div className={s.field}>
        <label htmlFor="postalCode" className={s.label}>
          Code postal
        </label>
        <input
          id="postalCode"
          name="postalCode"
          autoComplete="off"
          defaultValue={values.postalCode}
          className={s.input}
        />
      </div>
      <div className={s.field}>
        <label htmlFor="city" className={s.label}>
          Ville
        </label>
        <input
          id="city"
          name="city"
          autoComplete="off"
          defaultValue={values.city}
          className={s.input}
        />
      </div>
      <div className={s.field}>
        <label htmlFor="country" className={s.label}>
          Pays
        </label>
        <select id="country" name="country" defaultValue={values.country} className={s.input}>
          {COUNTRIES.map(([code, label]) => (
            <option key={code} value={code}>
              {label}
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
  look = "app",
}: {
  values: Pick<AthleteFormValues, "level" | "experience" | "trainingPlaces" | "equipment">;
  besideLevel?: ReactNode;
  look?: FieldLook;
}) {
  const s = looks(look);
  const fiche = look === "fiche";
  return (
    <div className={s.grid}>
      <div className={s.field}>
        <label htmlFor="level" className={s.label}>
          Niveau
        </label>
        <select id="level" name="level" defaultValue={values.level} className={s.input}>
          <option value="">Non précisé</option>
          {ATHLETE_LEVELS.map((level) => (
            <option key={level} value={level}>
              {athleteLevelLabels[level]}
            </option>
          ))}
        </select>
      </div>
      {besideLevel}

      <div className={`${s.field} col-span-full`}>
        <label htmlFor="experience" className={s.label}>
          Expérience
        </label>
        <textarea
          id="experience"
          name="experience"
          rows={2}
          maxLength={500}
          placeholder="Ex. : course depuis 3 ans, un Hyrox en Open, musculation régulière"
          defaultValue={values.experience}
          className={s.textarea}
        />
      </div>

      <fieldset className="col-span-full flex min-w-0 flex-col gap-2">
        <legend className={`${s.label} mb-2`}>Lieux d&apos;entraînement</legend>
        <div className="flex flex-wrap gap-2">
          {TRAINING_PLACES.map((place) => (
            <label key={place} className={s.chip}>
              <input
                type="checkbox"
                name="trainingPlaces"
                value={place}
                defaultChecked={values.trainingPlaces.includes(place)}
                className="sr-only"
              />
              {fiche ? (
                // Fiche : le « ✓ » est dessiné par la pastille (ficheChipClass), le libellé reste seul.
                trainingPlaceLabels[place]
              ) : (
                <>
                  <Check
                    aria-hidden
                    size={14}
                    strokeWidth={2}
                    className="hidden group-has-checked:block"
                  />
                  {trainingPlaceLabels[place]}
                </>
              )}
            </label>
          ))}
        </div>
      </fieldset>

      <div className={`${s.field} col-span-full`}>
        <label htmlFor="equipment" className={s.label}>
          Matériel disponible
        </label>
        <textarea
          id="equipment"
          name="equipment"
          rows={2}
          maxLength={500}
          placeholder="Ex. : haltères jusqu'à 20 kg, kettlebell 16 kg, rameur"
          defaultValue={values.equipment}
          className={s.textarea}
        />
      </div>
    </div>
  );
}

// Séances par semaine, durée maximale, jours, contraintes d'organisation. Les blessures et points
// d'attention ont leur propre champ (HealthConstraintsField) : il n'existe qu'avec un accord.
export function AvailabilityFields({
  values,
  look = "app",
}: {
  values: Pick<
    AvailabilityFormValues,
    "sessionsPerWeek" | "maxSessionMinutes" | "availableDays" | "scheduleConstraints"
  >;
  look?: FieldLook;
}) {
  const s = looks(look);
  const fiche = look === "fiche";
  // Fiche (maquette « Sportifs », page 2h) et kit (page 10) : une seule grille, les deux nombres dans
  // les premières colonnes, puis les jours et les contraintes sur toute la largeur. App : deux blocs
  // empilés.
  const oneGrid = look !== "app";
  const numberClass = look === "app" ? `${s.input} font-mono` : s.input;
  const numbers = (
    <>
      <div className={s.field}>
        <label htmlFor="sessionsPerWeek" className={s.label}>
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
          className={numberClass}
        />
      </div>
      <div className={s.field}>
        <label htmlFor="maxSessionMinutes" className={s.label}>
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
          className={numberClass}
        />
      </div>
    </>
  );
  const rest = (
    <>
      <fieldset className={`flex min-w-0 flex-col gap-2 ${oneGrid ? "col-span-full" : ""}`}>
        <legend className={`${s.label} mb-2`}>Jours disponibles</legend>
        <div className="flex flex-wrap gap-2">
          {WEEK_DAYS.map((day) => (
            <label key={day} className={s.chip}>
              <input
                type="checkbox"
                name="availableDays"
                value={day}
                defaultChecked={values.availableDays.includes(day)}
                className="sr-only"
              />
              {fiche ? (
                // Fiche : le « ✓ » est dessiné par la pastille (ficheChipClass), le libellé reste seul.
                weekDayLabels[day]
              ) : (
                <>
                  <Check
                    aria-hidden
                    size={14}
                    strokeWidth={2}
                    className="hidden group-has-checked:block"
                  />
                  {weekDayLabels[day]}
                </>
              )}
            </label>
          ))}
        </div>
      </fieldset>

      <div className={`${s.field} ${oneGrid ? "col-span-full" : ""}`}>
        <label htmlFor="scheduleConstraints" className={s.label}>
          Contraintes d&apos;organisation
        </label>
        <textarea
          id="scheduleConstraints"
          name="scheduleConstraints"
          rows={2}
          maxLength={500}
          placeholder="Ex. : déplacements le jeudi ; séances avant 8 h en semaine"
          defaultValue={values.scheduleConstraints}
          // flex-auto (et non flex-1) : la poignée de redimensionnement reste utilisable, la carte
          // grandit alors au-delà du menu.
          className={fiche ? `${s.textarea} lg:flex-auto` : s.textarea}
        />
      </div>
    </>
  );

  // Fiche, ordinateur (demande d'Antonino du 04/11) : quand la carte est étirée jusqu'au bas du menu,
  // la grille prend la hauteur libre et la donne aux contraintes (3e rangée, 1fr), pour qu'il n'y ait
  // pas de blanc sous le bouton. Sans hauteur libre, rien ne change.
  return fiche ? (
    <div className={`${s.grid} lg:flex-1 lg:grid-rows-[auto_auto_1fr]`}>
      {numbers}
      {rest}
    </div>
  ) : oneGrid ? (
    <div className={s.grid}>
      {numbers}
      {rest}
    </div>
  ) : (
    <>
      <div className={s.grid}>{numbers}</div>
      {rest}
    </>
  );
}

// Blessures et points d'attention (D-56, ancien « contraintes physiques ») : donnée de santé, sans
// diagnostic, et seulement avec l'accord du sportif.
//
// Fiche (onglet Notes, maquette « Sportifs » 2i) : le champ seul, nommé par une étiquette invisible ;
// le titre et le sous-titre de la carte (id « health-hint ») le décrivent. `className` : étirement
// de la zone sur ordinateur.
// Kit (page 10, D-126) : le champ seul, blanc, dans l'encadré gris de l'accord ; le titre de
// l'encadré et l'aide dessous (id « health-hint ») sont dans la page.
export function HealthConstraintsField({
  value,
  look = "app",
  className = "",
}: {
  value: string;
  look?: FieldLook;
  className?: string;
}) {
  if (look === "kit") {
    return (
      <>
        <label htmlFor="healthConstraints" className="sr-only">
          Blessures et points d&apos;attention
        </label>
        <textarea
          id="healthConstraints"
          name="healthConstraints"
          rows={2}
          maxLength={1000}
          aria-describedby="health-hint"
          placeholder="Ex. : douleur genou droit en descente"
          defaultValue={value}
          className={`${kitTextareaBaseClass} min-h-[72px] bg-field ${className}`}
        />
      </>
    );
  }
  if (look === "fiche") {
    return (
      <>
        <label htmlFor="healthConstraints" className="sr-only">
          Blessures et points d&apos;attention
        </label>
        <textarea
          id="healthConstraints"
          name="healthConstraints"
          rows={2}
          maxLength={1000}
          aria-describedby="health-hint"
          placeholder="Ex. : entorse de la cheville droite en septembre, éviter les sauts ; dos sensible en soulevé de terre"
          defaultValue={value}
          className={`${ficheTextareaClass} ${className}`}
        />
      </>
    );
  }
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
export function CoachNoteField({
  value,
  id = "coachNote",
  look = "app",
}: {
  value: string;
  id?: string;
  look?: "app" | "kit";
}) {
  if (look === "kit") {
    return (
      <div className="flex min-w-0 flex-col gap-2">
        <label htmlFor={id} className={kitLabelClass}>
          Notes libres <span className={kitOptionalClass}>facultatif</span>
        </label>
        <textarea
          id={id}
          name="coachNote"
          rows={2}
          maxLength={2000}
          aria-describedby={`${id}-hint`}
          placeholder="Ex. : très motivée, préfère les séances du matin ; vient en vélo"
          defaultValue={value}
          className={kitTextareaClass}
        />
        <p id={`${id}-hint`} className={kitHintClass}>
          Visible seulement par les coachs. Pas de blessures ici.
        </p>
      </div>
    );
  }
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
