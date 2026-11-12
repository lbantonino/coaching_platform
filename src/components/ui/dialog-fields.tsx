import { Calendar, Check, ChevronDown, Clock, Info } from "lucide-react";
import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";

import {
  dlgChipClass,
  dlgFieldClass,
  dlgInputClass,
  dlgLabelClass,
  dlgOptionalClass,
  dlgSegmentOptionClass,
  dlgSegmentedClass,
  dlgSelectClass,
  dlgSpanFull,
  dlgSpanHalf,
  dlgSuffixFieldClass,
  dlgSuffixInputClass,
} from "./dialog-styles";

// Champs des formulaires en boîte (kit « Coory Boites », shared-components/form-controls) : libellé
// 13,5/600 au-dessus, « (facultatif) » en gris clair, écart 8 ; grille de 12 colonnes sur ordinateur
// (un champ prend toute la ligne ou la moitié), 2 sur téléphone (toujours toute la ligne). Pur balisage :
// utilisable dans un composant serveur comme client.

function LabelText({ label, optional }: { label: ReactNode; optional?: boolean }) {
  return (
    <>
      {label}
      {optional ? <span className={dlgOptionalClass}> (facultatif)</span> : null}
    </>
  );
}

// Un champ simple (texte, menu, date, zone de texte) relié à son libellé.
export function DlgField({
  label,
  htmlFor,
  optional = false,
  half = false,
  quarter = false,
  aside,
  children,
}: {
  label: ReactNode;
  htmlFor?: string;
  optional?: boolean;
  half?: boolean;
  // À droite du libellé, sur la même ligne (lien « Gérer les catégories »).
  aside?: ReactNode;
  // Un quart de ligne sur ordinateur (Heure, Durée : 3 colonnes sur 12), la moitié sur téléphone.
  quarter?: boolean;
  children: ReactNode;
}) {
  const span = quarter ? "col-span-1 md:col-span-3" : half ? dlgSpanHalf : dlgSpanFull;
  return (
    <div className={`${dlgFieldClass} ${span}`}>
      <div className="flex items-baseline justify-between gap-2.5">
        {htmlFor ? (
          <label htmlFor={htmlFor} className={dlgLabelClass}>
            <LabelText label={label} optional={optional} />
          </label>
        ) : (
          <span className={dlgLabelClass}>
            <LabelText label={label} optional={optional} />
          </span>
        )}
        {aside}
      </div>
      {children}
    </div>
  );
}

// Un groupe de choix (pastilles, segments) : fieldset et légende, la légende posée en bloc au-dessus
// (flottante, pour échapper à la place spéciale que le navigateur lui donne).
export function DlgFieldset({
  legend,
  optional = false,
  children,
}: {
  legend: ReactNode;
  optional?: boolean;
  children: ReactNode;
}) {
  return (
    <fieldset className={`min-w-0 ${dlgSpanFull}`}>
      <legend className={`float-left mb-2 w-full ${dlgLabelClass}`}>
        <LabelText label={legend} optional={optional} />
      </legend>
      <div className="clear-both">{children}</div>
    </fieldset>
  );
}

// Pastilles à choix unique (bouton radio caché, coche de 14 px quand elle est choisie).
export function DlgChips({
  name,
  options,
  value,
  defaultValue,
  defaultValues,
  onChange,
}: {
  name: string;
  options: { value: string; label: string }[];
  value?: string;
  defaultValue?: string;
  // Choix multiple (cases à cocher), ex. les sportifs inscrits à une séance collective.
  defaultValues?: string[];
  onChange?: (value: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <label key={option.value || "none"} className={dlgChipClass}>
          <input
            type={defaultValues ? "checkbox" : "radio"}
            name={name}
            value={option.value}
            checked={value === undefined ? undefined : value === option.value}
            defaultChecked={
              defaultValues
                ? defaultValues.includes(option.value)
                : value === undefined
                  ? defaultValue === option.value
                  : undefined
            }
            onChange={onChange ? () => onChange(option.value) : undefined}
            className="sr-only"
          />
          <Check
            aria-hidden
            size={14}
            strokeWidth={2.8}
            className="hidden shrink-0 group-has-checked:block"
          />
          {option.label}
        </label>
      ))}
    </div>
  );
}

// Contrôle segmenté à choix unique.
export function DlgSegmented({
  name,
  options,
  defaultValue,
  value,
  onChange,
  fit = false,
}: {
  name: string;
  options: readonly { value: string; label: string }[];
  defaultValue?: string;
  value?: string;
  onChange?: (value: string) => void;
  // À la largeur de son contenu sur ordinateur (sinon toute la largeur).
  fit?: boolean;
}) {
  return (
    <div className={`${dlgSegmentedClass} ${fit ? "md:w-max md:auto-cols-auto" : ""}`}>
      {options.map((option) => (
        <label key={option.value} className={dlgSegmentOptionClass}>
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={value === undefined ? undefined : value === option.value}
            defaultChecked={value === undefined ? defaultValue === option.value : undefined}
            onChange={onChange ? () => onChange(option.value) : undefined}
            className="sr-only"
          />
          {option.label}
        </label>
      ))}
    </div>
  );
}

// Menu déroulant natif, flèche du kit (17 px, gris) à droite.
export function DlgSelect({ children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select {...props} data-chevron="own" className={dlgSelectClass}>
        {children}
      </select>
      <ChevronDown
        aria-hidden
        size={17}
        strokeWidth={2}
        className="pointer-events-none absolute top-1/2 right-[15px] -translate-y-1/2 text-muted"
      />
    </div>
  );
}

// Date native (le calendrier du système), avec l'icône du kit à droite : l'icône du navigateur, rendue
// invisible, reste dessous et ouvre le calendrier quand on touche l'icône.
export function DlgDate(props: Omit<InputHTMLAttributes<HTMLInputElement>, "type">) {
  return (
    <div className="relative">
      <input
        {...props}
        type="date"
        className={`${dlgInputClass} relative pr-[41px] [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:top-1/2 [&::-webkit-calendar-picker-indicator]:right-[15px] [&::-webkit-calendar-picker-indicator]:size-[17px] [&::-webkit-calendar-picker-indicator]:-translate-y-1/2 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0`}
      />
      <Calendar
        aria-hidden
        size={17}
        strokeWidth={1.8}
        className="pointer-events-none absolute top-1/2 right-[15px] -translate-y-1/2 text-muted"
      />
    </div>
  );
}

// Heure native, avec l'horloge du kit à droite (même principe que DlgDate).
export function DlgTime(props: Omit<InputHTMLAttributes<HTMLInputElement>, "type">) {
  return (
    <div className="relative">
      <input
        {...props}
        type="time"
        className={`${dlgInputClass} relative pr-[41px] [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:top-1/2 [&::-webkit-calendar-picker-indicator]:right-[15px] [&::-webkit-calendar-picker-indicator]:size-[17px] [&::-webkit-calendar-picker-indicator]:-translate-y-1/2 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0`}
      />
      <Clock
        aria-hidden
        size={17}
        strokeWidth={1.8}
        className="pointer-events-none absolute top-1/2 right-[15px] -translate-y-1/2 text-muted"
      />
    </div>
  );
}

// Champ avec son unité dans le cadre (« min », « € TVAC », « % »).
export function DlgSuffixInput({
  suffix,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { suffix: ReactNode }) {
  return (
    <div className={dlgSuffixFieldClass}>
      <input {...props} className={dlgSuffixInputClass} />
      <span
        aria-hidden
        className="shrink-0 text-[13px] leading-[normal] font-semibold whitespace-nowrap text-dlg-faint"
      >
        {suffix}
      </span>
    </div>
  );
}

// Carte à cocher (kit) : case de 22 px, libellé 14,5/600 et description 13 gris ; cochée, la carte
// passe en violet pâle et la case en violet plein avec une coche blanche.
export function DlgCheckCard({
  label,
  description,
  half = false,
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label: ReactNode;
  description?: ReactNode;
  half?: boolean;
}) {
  return (
    <label
      className={`flex cursor-pointer items-start gap-3 rounded-[14px] border border-dlg-field-line bg-dlg p-3.5 transition-[background-color,border-color] duration-150 has-checked:border-dlg-accent-line has-checked:bg-dlg-accent-soft has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-dlg-accent ${
        half ? dlgSpanHalf : dlgSpanFull
      }`}
    >
      <span className="relative grid size-[22px] shrink-0 place-items-center">
        <input
          {...props}
          type="checkbox"
          className="peer absolute inset-0 m-0 size-full cursor-pointer appearance-none rounded-[7px] border-[1.5px] border-dlg-check-line bg-dlg transition-colors duration-150 checked:border-dlg-accent checked:bg-dlg-accent focus-visible:outline-none"
        />
        <Check
          aria-hidden
          size={13}
          strokeWidth={3}
          className="pointer-events-none relative hidden text-white peer-checked:block"
        />
      </span>
      <span className="flex min-w-0 flex-col gap-[3px]">
        <span className="text-[14.5px] leading-[1.4] font-semibold text-text">{label}</span>
        {description ? (
          <span className="text-[13px] leading-[1.5] text-pretty text-muted">{description}</span>
        ) : null}
      </span>
    </label>
  );
}

// Texte d'aide (kit) : icône « info » 15 px, 13 / 1,5 gris, collé au champ du dessus (−8 px).
export function DlgHint({
  id,
  live = false,
  children,
}: {
  id?: string;
  live?: boolean;
  children: ReactNode;
}) {
  return (
    <p
      id={id}
      aria-live={live ? "polite" : undefined}
      className={`-mt-2 flex items-start gap-2 text-[13px] leading-[1.5] text-muted ${dlgSpanFull}`}
    >
      <Info aria-hidden size={15} strokeWidth={2} className="mt-0.5 shrink-0 text-dlg-faint" />
      <span className="text-pretty">{children}</span>
    </p>
  );
}
