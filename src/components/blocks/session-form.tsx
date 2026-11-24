"use client";

import { Calendar, Check, Clock, Info, MapPin, Search, Users } from "lucide-react";
import Link from "next/link";
import { useActionState, useEffect, useId, useState, type ReactNode } from "react";

import { useMoney } from "@/components/blocks/money-context";
import { Avatar } from "@/components/ui/avatar";
import { errorTextClass } from "@/components/ui/form-styles";
import { FieldCheck } from "@/components/ui/field-check";
import {
  MobileActionBar,
  mobileActionPrimaryClass,
  mobileActionSecondaryClass,
} from "@/components/ui/mobile-action-bar";

import { SessionAppleFields, type SessionDraft } from "./session-apple-fields";
import {
  SESSION_DISCIPLINES,
  paidAmount,
  priceSentence,
  useSessionVat,
} from "./session-form-parts";
import { currencySymbol } from "@/domain/billing/money";
import { parseAmount } from "@/domain/billing/payments";
import { foldText } from "@/domain/documents/documents";
import { disciplineLabels } from "@/domain/training/discipline";
import type { SessionFormState } from "@/features/sessions/actions";
import {
  defaultVatIncluded,
  type SessionFormInput,
  type SessionKind,
} from "@/features/sessions/schemas";

// Case à cocher de la page Modifier la séance (« Appliquer la TVA », « TVA comprise dans le prix »).
const pageCheckLabelClass =
  "flex min-h-11 w-fit cursor-pointer items-center gap-2.5 text-[14.5px] leading-[normal] font-medium has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent lg:min-h-0 lg:text-[13.5px]";
const pageCheckBoxClass =
  "grid size-[22px] shrink-0 place-items-center rounded-[7px] bg-surface text-white inset-ring-[1.5px] inset-ring-line-2 transition-colors duration-150 peer-checked:bg-violet peer-checked:inset-ring-transparent lg:size-5 lg:rounded-[6px] [&>svg]:opacity-0 peer-checked:[&>svg]:opacity-100";

type Action = (previous: SessionFormState, formData: FormData) => Promise<SessionFormState>;

// Sportif proposé : photo et sexe pour l'avatar du récapitulatif (page Modifier).
type SessionAthleteChoice = {
  id: string;
  name: string;
  photoPath?: string | null;
  sex?: "female" | "male" | null;
};

type Props = {
  action: Action;
  athletes: SessionAthleteChoice[];
  initial: SessionFormInput;
  // Modification : le type (et le sportif d'une séance individuelle) ne changent pas. La page
  // « Modifier » est toujours verrouillée, la fenêtre « Nouvelle séance » jamais (ses propres champs).
  locked: boolean;
  submitLabel: string;
  // Page « Modifier la séance » : retour (Annuler), chemin des fiches (« Voir la fiche ») et bloc de
  // suppression (formulaire de l'action serveur, rendu par la page).
  cancelHref?: string;
  athletesPath?: string;
  footer?: ReactNode;
  // Fenêtre de l'agenda : la création reste sur la page et prévient la fenêtre (sinon : page de la séance).
  onCreated?: (created: { id: string; title: string; newAthleteName: string | null }) => void;
  // Fenêtre : « Annuler » (✕ de la feuille, Échap de la bulle).
  onCancel?: () => void;
  // Fenêtre : feuille façon iPhone, ou bulle accrochée au créneau de l'agenda (ordinateur, D-204).
  layout?: "sheet" | "popover";
  // Bulle de l'ordinateur : la grille de l'agenda montre la séance provisoire pendant la saisie.
  onDraft?: (draft: SessionDraft) => void;
};

export function SessionForm({
  action,
  athletes,
  initial,
  submitLabel,
  onCreated,
  onCancel,
  layout = "sheet",
  onDraft,
  cancelHref = "",
  athletesPath = "",
  footer,
}: Props) {
  const [state, formAction, pending] = useActionState(action, {
    error: null,
    attempt: 0,
    values: null,
  });
  const created = state.created ?? null;
  useEffect(() => {
    if (created) onCreated?.(created);
  }, [created, onCreated]);
  if (onCreated) {
    return (
      <SessionAppleFields
        key={state.attempt}
        formAction={formAction}
        pending={pending}
        error={state.error}
        values={state.values ?? initial}
        athletes={athletes}
        submitLabel={submitLabel}
        onCancel={onCancel ?? (() => {})}
        layout={layout}
        onDraft={onDraft}
      />
    );
  }
  return (
    // Reconstruit après chaque réponse : la saisie renvoyée s'affiche partout, menus compris.
    <SessionFields
      key={state.attempt}
      formAction={formAction}
      pending={pending}
      error={state.error}
      values={state.values ?? initial}
      athletes={athletes}
      submitLabel={submitLabel}
      cancelHref={cancelHref}
      athletesPath={athletesPath}
      footer={footer}
    />
  );
}

// Page « Modifier la séance » (kit « Coory Pages », pages 06 et 12, D-123). Le type de séance et le
// sportif d'une séance individuelle ne changent pas (le serveur les reprend de la séance).
// Ordinateur : le récapitulatif en haut (type, sportif ou inscrits, Quand · Durée · Jusqu'au · Prix ·
// Paiement mis à jour pendant la saisie, Enregistrer / Annuler), une carte en sections (Informations,
// Date et récurrence, Sportifs inscrits pour une collective, Prix, Note du coach), puis la carte de
// suppression (`footer`, fournie par la page). Téléphone : la carte « qui », une carte par section,
// l'avertissement, et la barre fixe Annuler / Enregistrer (la corbeille est à côté du titre).
const weekdayLong = new Intl.DateTimeFormat("fr-BE", { weekday: "long", timeZone: "UTC" });
const dayShort = new Intl.DateTimeFormat("fr-BE", {
  weekday: "short",
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});
const dayFull = new Intl.DateTimeFormat("fr-BE", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});
const isoDate = (value: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T12:00:00Z`) : null;

// « Chaque jeudi, 07:00 » ou « Jeu. 10 sept., 07:00 ».
function whenLabel(startsOn: string, startTime: string, repeats: boolean): string {
  const date = isoDate(startsOn);
  if (!date) return "—";
  const time = startTime || "—";
  if (repeats) return `Chaque ${weekdayLong.format(date)}, ${time}`;
  const day = dayShort.format(date);
  return `${day.charAt(0).toUpperCase()}${day.slice(1)}, ${time}`;
}

const enrolledLabel = (count: number) =>
  count === 0 ? "Aucun inscrit" : `${count} inscrit${count > 1 ? "s" : ""}`;

// Styles du kit (06 / 12). Téléphone d'abord : champs de 48 px en 16 px (en dessous, l'iPhone agrandit
// la page) ; ordinateur : 44 px en 14 px. Fond gris pâle, filet intérieur, anneau violet au focus.
const editLabelClass = "text-[14px] leading-[normal] font-semibold text-text lg:text-[13px]";
const editOptionalClass = "font-normal text-faint";
const editFieldClass =
  "h-12 w-full rounded-[12px] bg-surface-2 px-3.5 text-[16px] text-text inset-ring inset-ring-line-2 outline-none transition-shadow duration-150 placeholder:text-faint focus:inset-ring-[1.5px] focus:inset-ring-violet lg:h-11 lg:rounded-[11px] lg:text-[14px]";
// Date et heure natives : l'icône du kit à gauche (ordinateur), et un clic n'importe où ouvre le
// sélecteur du navigateur (sa petite icône, invisible, couvre le champ).
const pickerClass =
  "relative [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:size-auto [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0 lg:pl-9";
const fieldIconClass =
  "pointer-events-none absolute top-1/2 left-3.5 z-[1] -translate-y-1/2 text-muted max-lg:hidden";
const pillClass =
  "tap-44 group inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-full bg-surface px-3.5 text-[14px] leading-[normal] font-medium whitespace-nowrap text-text inset-ring inset-ring-line-2 transition-colors duration-150 not-has-checked:hover:bg-surface-2 has-checked:bg-status-accent-soft has-checked:text-status-accent has-checked:inset-ring-transparent has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent lg:h-[34px] lg:text-[13px]";

// Une section : carte blanche sur téléphone ; sur ordinateur, une partie de la carte du formulaire,
// séparée de la précédente par un filet.
function EditSection({
  title,
  optional = false,
  subtitle,
  aside,
  group = false,
  children,
}: {
  title: string;
  optional?: boolean;
  subtitle?: string;
  // À droite du titre (nombre d'inscrits, « Tout désélectionner »).
  aside?: ReactNode;
  // Pastilles à cocher : un groupe (fieldset) nommé par le titre.
  group?: boolean;
  children: ReactNode;
}) {
  const titleId = useId();
  const Tag = group ? "fieldset" : "section";
  return (
    <Tag
      aria-labelledby={titleId}
      className="flex min-w-0 flex-col gap-3.5 rounded-[22px] bg-surface px-4 py-[18px] lg:gap-4 lg:rounded-none lg:bg-transparent lg:px-6 lg:py-[22px] lg:last:pb-6 lg:[&:not(:first-child)]:border-t lg:[&:not(:first-child)]:border-line"
    >
      <div className="flex items-baseline justify-between gap-2.5 lg:justify-start">
        <div className="flex flex-col gap-[3px]">
          <h2 id={titleId} className="text-[16px] leading-[normal] font-semibold">
            {title}
            {optional ? <span className={editOptionalClass}> facultatif</span> : null}
          </h2>
          {subtitle ? (
            <p className="text-[12.5px] leading-[normal] text-muted max-lg:hidden">{subtitle}</p>
          ) : null}
        </div>
        {aside}
      </div>
      {children}
    </Tag>
  );
}

function SessionFields({
  formAction,
  pending,
  error,
  values: v,
  athletes,
  submitLabel,
  cancelHref,
  athletesPath,
  footer,
}: {
  formAction: (formData: FormData) => void;
  pending: boolean;
  error: string | null;
  values: SessionFormInput;
  athletes: SessionAthleteChoice[];
  submitLabel: string;
  cancelHref: string;
  athletesPath: string;
  footer?: ReactNode;
}) {
  const formId = useId();
  const titleId = useId();
  const disciplineId = useId();
  const locationId = useId();
  const dateId = useId();
  const timeId = useId();
  const durationId = useId();
  const endsId = useId();
  const endsHintId = useId();
  const priceId = useId();
  const priceLineId = useId();
  const kind: SessionKind = v.kind === "individual" ? "individual" : "group";
  // Ce que le récapitulatif montre pendant la saisie.
  const [startsOn, setStartsOn] = useState(v.startsOn);
  const [startTime, setStartTime] = useState(v.startTime);
  const [duration, setDuration] = useState(v.durationMinutes);
  // « Jour entier » (D-204) : sans heure ni durée.
  const [allDay, setAllDay] = useState(v.allDay === true);
  const [repeats, setRepeats] = useState(v.repeatsWeekly);
  const [endsOn, setEndsOn] = useState(v.endsOn);
  const [price, setPrice] = useState(v.price);
  const vat = useSessionVat(v);
  const vatId = useId();
  const [paymentMethod, setPaymentMethod] = useState(v.paymentMethod || "transfer");
  const [enrolled, setEnrolled] = useState<string[]>(v.athleteIds);
  const [search, setSearch] = useState("");
  // Devise de l'organisation (D-69) ; la TVA est celle de la séance (D-163).
  const { currency, format } = useMoney();

  const priceCents = parseAmount(price);
  const paidCents = priceCents === null ? null : paidAmount(priceCents, vat);
  const withVat = Boolean(vat.rate);
  const enrolledAthletes = athletes.filter((athlete) => enrolled.includes(athlete.id));
  const individual = athletes.find((athlete) => athlete.id === v.athleteId) ?? null;
  const ends = isoDate(endsOn);
  const words = foldText(search).split(/\s+/).filter(Boolean);

  // Ligne de calcul (kit) : recalculée à chaque frappe, au taux de la séance.
  const priceLine =
    priceCents === null || paidCents === null
      ? kind === "group"
        ? "Sans prix, la séance ne compte pas dans l'encaissé."
        : "Aucun prix : la séance ne sera pas facturée."
      : kind === "group" && enrolledAthletes.length > 0
        ? `${format(paidCents)}${withVat ? " TTC" : ""} pour la séance, soit ${format(
            Math.round(paidCents / enrolledAthletes.length),
          )} par inscrit${withVat ? "" : ", sans TVA"}.`
        : priceSentence(priceCents, vat, format);

  const recap = [
    {
      label: "Quand",
      value: whenLabel(startsOn, allDay ? "toute la journée" : startTime, repeats),
    },
    { label: "Durée", value: duration ? `${duration} min` : "—" },
    { label: "Jusqu'au", value: repeats ? (ends ? dayFull.format(ends) : "Sans fin") : "—" },
    {
      label: "Prix",
      value: paidCents === null ? "—" : `${format(paidCents)}${withVat ? " TTC" : ""}`,
    },
    { label: "Paiement", value: paymentMethod === "cash" ? "Espèces" : "Virement" },
  ];

  const errorAlert = error ? (
    <p role="alert" className={errorTextClass}>
      {error}
    </p>
  ) : null;

  return (
    <div className="flex w-full flex-col gap-3 lg:max-w-[1120px] lg:gap-4">
      {/* Récapitulatif (ordinateur, kit C-RECAP). */}
      <aside
        aria-label="Récapitulatif de la séance"
        className="grid grid-cols-[minmax(0,1fr)_170px] items-center gap-x-7 gap-y-3 rounded-[20px] bg-surface px-[22px] py-[18px] inset-ring inset-ring-line-soft max-lg:hidden xl:grid-cols-[220px_minmax(0,1fr)_170px]"
      >
        <p className="col-span-full text-[11.5px] leading-[normal] font-semibold tracking-[0.06em] text-faint uppercase">
          {kind === "group" ? "Séance collective" : "Séance individuelle"}
        </p>
        {kind === "group" ? (
          <div className="flex min-w-0 flex-col gap-2.5">
            {enrolledAthletes.length > 0 ? (
              <span className="flex">
                {enrolledAthletes.slice(0, 6).map((athlete) => (
                  <span
                    key={athlete.id}
                    className="-ml-2 flex rounded-full ring-2 ring-surface first:ml-0"
                  >
                    <Avatar name={athlete.name} size="stack" photoPath={athlete.photoPath} />
                  </span>
                ))}
              </span>
            ) : null}
            <span className="text-[14.5px] leading-[normal] font-semibold">
              {enrolledLabel(enrolledAthletes.length)}
            </span>
          </div>
        ) : individual ? (
          <div className="flex min-w-0 items-center gap-3">
            <Avatar
              name={individual.name}
              size="who"
              photoPath={individual.photoPath}
              sex={individual.sex}
            />
            <span className="flex min-w-0 flex-col gap-0.5">
              <span className="truncate text-[14.5px] leading-[normal] font-semibold">
                {individual.name}
              </span>
              <Link
                href={`${athletesPath}/${individual.id}`}
                className="self-start rounded-[4px] text-[12.5px] leading-[normal] font-medium text-violet-text underline-offset-4 hover:underline"
              >
                Voir la fiche
              </Link>
            </span>
          </div>
        ) : (
          <span className="text-[14.5px] font-semibold">Séance individuelle</span>
        )}
        {/* De 1 024 à 1 279 px (kit, responsive) : le récap passe sur sa propre ligne, sous le sportif
            et les boutons ; dès 1 280 px, au milieu, séparé par un filet vertical. */}
        <dl className="col-span-full grid min-w-0 grid-cols-5 gap-3 border-t border-line pt-3 max-xl:order-last xl:col-span-1 xl:border-t-0 xl:border-l xl:pt-0 xl:pl-6">
          {recap.map((item) => (
            <div
              key={item.label}
              className="flex min-w-0 flex-col gap-[3px] text-[13px] leading-[normal]"
            >
              <dt className="text-muted">{item.label}</dt>
              <dd className="font-semibold text-pretty">{item.value}</dd>
            </div>
          ))}
        </dl>
        <div className="flex flex-col gap-2">
          <button
            type="submit"
            form={formId}
            disabled={pending}
            className="inline-flex h-[42px] items-center justify-center rounded-[11px] bg-cta px-2 text-[14px] leading-[normal] font-semibold whitespace-nowrap text-on-cta transition-[background-color,scale] duration-150 hover:bg-cta-hover active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pending ? "Enregistrement…" : submitLabel}
          </button>
          <Link
            href={cancelHref}
            className="inline-flex h-[42px] items-center justify-center rounded-[11px] text-[14px] leading-[normal] font-medium text-text inset-ring inset-ring-line-2 transition-[background-color,scale] duration-150 hover:bg-surface-2 active:scale-[0.98]"
          >
            Annuler
          </Link>
        </div>
        {errorAlert ? <div className="col-span-full max-xl:order-last">{errorAlert}</div> : null}
      </aside>

      {/* Téléphone : qui (le sportif, ou la séance collective et ses inscrits). */}
      <div className="flex items-center gap-3 rounded-[22px] bg-surface px-4 py-3.5 lg:hidden">
        {kind === "group" ? (
          <span
            aria-hidden
            className="grid size-[42px] shrink-0 place-items-center rounded-[13px] bg-status-accent-soft text-violet-text"
          >
            <Users size={18} strokeWidth={1.8} />
          </span>
        ) : individual ? (
          <Avatar
            name={individual.name}
            size="who"
            photoPath={individual.photoPath}
            sex={individual.sex}
          />
        ) : null}
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="truncate text-[15px] leading-[normal] font-semibold">
            {kind === "group" ? "Séance collective" : (individual?.name ?? "Séance individuelle")}
          </span>
          <span className="text-[12.5px] leading-[normal] text-muted">
            {kind === "group" ? enrolledLabel(enrolledAthletes.length) : "Séance individuelle"}
          </span>
        </span>
      </div>

      <form
        id={formId}
        action={formAction}
        noValidate
        className="flex flex-col gap-3 lg:gap-0 lg:rounded-[20px] lg:bg-surface lg:inset-ring lg:inset-ring-line-soft"
      >
        <EditSection title="Informations" subtitle="Titre, discipline et lieu de la séance.">
          <div className="flex flex-col gap-[7px]">
            <label htmlFor={titleId} className={editLabelClass}>
              Titre
            </label>
            <input
              id={titleId}
              name="title"
              autoComplete="off"
              maxLength={120}
              placeholder={kind === "group" ? "Ex. : Piste du mercredi" : "Ex. : Coaching force"}
              defaultValue={v.title}
              className={editFieldClass}
            />
          </div>
          <div className="grid gap-3.5 lg:grid-cols-2">
            <div className="flex min-w-0 flex-col gap-[7px]">
              <label htmlFor={disciplineId} className={editLabelClass}>
                Discipline <span className={editOptionalClass}>facultatif</span>
              </label>
              <select
                id={disciplineId}
                name="discipline"
                defaultValue={v.discipline}
                className={editFieldClass}
              >
                <option value="">Non précisée</option>
                {SESSION_DISCIPLINES.map((discipline) => (
                  <option key={discipline} value={discipline}>
                    {disciplineLabels[discipline]}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex min-w-0 flex-col gap-[7px]">
              <label htmlFor={locationId} className={editLabelClass}>
                Lieu <span className={editOptionalClass}>facultatif</span>
              </label>
              <div className="relative">
                <MapPin aria-hidden size={14} strokeWidth={1.8} className={fieldIconClass} />
                <input
                  id={locationId}
                  name="location"
                  autoComplete="off"
                  maxLength={120}
                  placeholder="Ex. : Piste d'athlétisme, salle, parc"
                  defaultValue={v.location}
                  className={`${editFieldClass} lg:pl-9`}
                />
              </div>
            </div>
          </div>
        </EditSection>

        <EditSection title="Date et récurrence">
          <div className="grid grid-cols-2 gap-x-2.5 gap-y-3.5 lg:grid-cols-[1.4fr_1fr_1fr] lg:gap-3.5">
            <div className="col-span-2 flex min-w-0 flex-col gap-[7px] lg:col-span-1">
              <label htmlFor={dateId} className={editLabelClass}>
                {repeats ? "Première séance" : "Date"}
              </label>
              <div className="relative">
                <Calendar aria-hidden size={14} strokeWidth={1.8} className={fieldIconClass} />
                <input
                  id={dateId}
                  name="startsOn"
                  type="date"
                  value={startsOn}
                  onChange={(event) => setStartsOn(event.target.value)}
                  className={`${editFieldClass} ${pickerClass}`}
                />
              </div>
            </div>
            <div className={`flex min-w-0 flex-col gap-[7px] ${allDay ? "hidden" : ""}`}>
              <label htmlFor={timeId} className={editLabelClass}>
                Heure
              </label>
              <div className="relative">
                <Clock aria-hidden size={14} strokeWidth={1.8} className={fieldIconClass} />
                <input
                  id={timeId}
                  name="startTime"
                  type="time"
                  value={startTime}
                  onChange={(event) => setStartTime(event.target.value)}
                  className={`${editFieldClass} ${pickerClass}`}
                />
              </div>
            </div>
            <div className={`flex min-w-0 flex-col gap-[7px] ${allDay ? "hidden" : ""}`}>
              <label htmlFor={durationId} className={editLabelClass}>
                Durée
              </label>
              {/* L'unité dans le champ, à droite. */}
              <div className="relative">
                <input
                  id={durationId}
                  name="durationMinutes"
                  type="number"
                  inputMode="numeric"
                  min={15}
                  max={480}
                  step={5}
                  value={duration}
                  onChange={(event) => setDuration(event.target.value)}
                  className={`${editFieldClass} pr-12`}
                />
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-[16px] text-faint lg:text-[14px]"
                >
                  min
                </span>
              </div>
            </div>
          </div>

          <label className={pageCheckLabelClass}>
            <input
              type="checkbox"
              name="allDay"
              checked={allDay}
              onChange={(event) => setAllDay(event.target.checked)}
              className="peer sr-only"
            />
            <span aria-hidden className={pageCheckBoxClass}>
              <Check size={13} strokeWidth={3} />
            </span>
            Jour entier
          </label>

          {/* Répéter chaque semaine : interrupteur sur toute la ligne (violet pâle quand il est mis). */}
          <label
            className={`flex min-h-14 cursor-pointer items-center gap-3 rounded-[14px] p-3.5 transition-colors duration-150 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent lg:min-h-0 lg:gap-3.5 lg:px-4 ${
              repeats ? "bg-violet-soft" : "bg-surface-2"
            }`}
          >
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="text-[14.5px] leading-[normal] font-semibold lg:text-[13.5px]">
                Répéter chaque semaine
              </span>
              <span className="text-[13px] leading-[normal] text-muted lg:text-[12.5px]">
                <span className="lg:hidden">Même jour, même heure</span>
                <span className="max-lg:hidden">Le même jour et à la même heure</span>
              </span>
            </span>
            <input
              type="checkbox"
              role="switch"
              name="repeatsWeekly"
              checked={repeats}
              onChange={(event) => setRepeats(event.target.checked)}
              className="sr-only"
            />
            {/* Une règle personnalisée (D-203) repart telle quelle à l'enregistrement. */}
            <input type="hidden" name="recurrence" value={v.recurrence ?? ""} />
            <span
              aria-hidden
              className={`flex h-7 w-[46px] shrink-0 rounded-full p-[3px] transition-colors duration-200 lg:h-6 lg:w-10 ${
                repeats ? "bg-violet" : "bg-dlg-check-line"
              }`}
            >
              <span
                className={`size-[22px] rounded-full bg-white shadow-[0_1px_2px_rgba(0,0,0,0.2)] transition-transform duration-200 ease-out motion-reduce:transition-none lg:size-[18px] ${
                  repeats ? "translate-x-[18px] lg:translate-x-4" : ""
                }`}
              />
            </span>
          </label>

          {repeats ? (
            <div className="grid gap-[7px] lg:grid-cols-[1.4fr_2fr] lg:items-end lg:gap-3.5">
              <div className="flex min-w-0 flex-col gap-[7px]">
                <label htmlFor={endsId} className={editLabelClass}>
                  Jusqu&apos;au <span className={editOptionalClass}>facultatif</span>
                </label>
                <div className="relative">
                  <Calendar aria-hidden size={14} strokeWidth={1.8} className={fieldIconClass} />
                  <input
                    id={endsId}
                    name="endsOn"
                    type="date"
                    value={endsOn}
                    onChange={(event) => setEndsOn(event.target.value)}
                    aria-describedby={endsHintId}
                    className={`${editFieldClass} ${pickerClass}`}
                  />
                </div>
              </div>
              <p
                id={endsHintId}
                className="text-[13px] leading-[1.45] text-muted lg:pb-3 lg:text-[12.5px]"
              >
                Sans date de fin, la séance continue chaque semaine.
              </p>
            </div>
          ) : null}
        </EditSection>

        {kind === "group" ? (
          <EditSection
            title="Sportifs inscrits"
            group
            aside={
              <span className="flex flex-1 items-baseline justify-end gap-2.5 lg:justify-between">
                <span className="text-[13px] leading-[normal] font-medium text-violet-text lg:text-[12.5px]">
                  {enrolledLabel(enrolledAthletes.length)}
                </span>
                {enrolled.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => setEnrolled([])}
                    className="rounded-[4px] text-[12.5px] leading-[normal] font-medium text-muted transition-colors duration-150 hover:text-text max-lg:hidden"
                  >
                    Tout désélectionner
                  </button>
                ) : null}
              </span>
            }
          >
            {athletes.length === 0 ? (
              <p className="text-[13px] text-muted">Aucun sportif actif pour l&apos;instant.</p>
            ) : (
              <>
                <label className="relative flex h-10 items-center gap-2 rounded-[11px] bg-surface-2 px-3 text-faint inset-ring inset-ring-line-2 transition-shadow duration-150 focus-within:inset-ring-[1.5px] focus-within:inset-ring-violet max-lg:hidden">
                  <Search aria-hidden size={14} strokeWidth={2} className="shrink-0" />
                  <span className="sr-only">Rechercher un sportif</span>
                  <input
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Rechercher un sportif"
                    autoComplete="off"
                    className="h-full min-w-0 flex-1 bg-transparent text-[13.5px] text-text outline-none placeholder:text-faint"
                  />
                </label>
                {/* Toutes les cases restent dans le formulaire : la recherche masque seulement. */}
                <div className="flex flex-wrap gap-2">
                  {athletes.map((athlete) => {
                    const shown = words.every((word) => foldText(athlete.name).includes(word));
                    return (
                      <label key={athlete.id} className={`${pillClass} ${shown ? "" : "hidden"}`}>
                        <input
                          type="checkbox"
                          name="athleteIds"
                          value={athlete.id}
                          checked={enrolled.includes(athlete.id)}
                          onChange={(event) =>
                            setEnrolled((current) =>
                              event.target.checked
                                ? [...current, athlete.id]
                                : current.filter((id) => id !== athlete.id),
                            )
                          }
                          className="sr-only"
                        />
                        <Check
                          aria-hidden
                          size={13}
                          strokeWidth={2.6}
                          className="hidden shrink-0 group-has-checked:block"
                        />
                        {athlete.name}
                      </label>
                    );
                  })}
                </div>
              </>
            )}
          </EditSection>
        ) : null}

        {/* Prix (D-52) : quand le coach marque une date « payée », ce montant compte dans l'encaissé.
            Collective : un seul prix pour toute la séance (le prix par inscrit est un simple calcul).
            Règle de Gianluca : virement = facturé, prix hors TVA ; espèces = prix direct, TVA comprise.
            La case suit le mode choisi, le coach peut la changer. */}
        <EditSection title="Prix" optional>
          <div className="grid gap-3.5 lg:grid-cols-2">
            <div className="flex min-w-0 flex-col gap-[7px]">
              <label htmlFor={priceId} className={editLabelClass}>
                {kind === "group" ? "Prix pour toute la séance" : "Prix de la séance"}
              </label>
              <div className="relative">
                <input
                  id={priceId}
                  name="price"
                  inputMode="decimal"
                  autoComplete="off"
                  placeholder="Ex. : 65"
                  value={price}
                  onChange={(event) => setPrice(event.target.value)}
                  aria-describedby={priceLineId}
                  className={`${editFieldClass} pr-10`}
                />
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-[16px] text-faint lg:text-[14px]"
                >
                  {currencySymbol(currency)}
                </span>
              </div>
              <FieldCheck htmlFor={priceId} rule="amount" />
            </div>
            <fieldset className="flex min-w-0 flex-col gap-[7px]">
              <legend className={`${editLabelClass} mb-[7px]`}>Paiement</legend>
              <div className="grid h-12 grid-cols-2 gap-1 rounded-[12px] bg-dlg-segment p-1 lg:h-11 lg:rounded-[11px]">
                {(
                  [
                    ["transfer", "Virement"],
                    ["cash", "Espèces"],
                  ] as const
                ).map(([method, label]) => (
                  <label
                    key={method}
                    className="tap-44 flex cursor-pointer rounded-[9px] has-focus-visible:outline-2 has-focus-visible:outline-accent lg:rounded-[8px]"
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={method}
                      checked={paymentMethod === method}
                      onChange={() => {
                        setPaymentMethod(method);
                        vat.setIncluded(defaultVatIncluded(method));
                      }}
                      className="peer sr-only"
                    />
                    <span className="flex flex-1 items-center justify-center rounded-[9px] text-[14.5px] leading-[normal] font-medium text-muted transition-[background-color,color,box-shadow] duration-150 peer-checked:bg-dlg-segment-active peer-checked:text-text peer-checked:shadow-[0_1px_3px_rgba(22,18,40,0.12)] lg:rounded-[8px] lg:text-[13.5px]">
                      {label}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          </div>
          <label className={pageCheckLabelClass}>
            <input
              type="checkbox"
              name="applyVat"
              checked={vat.apply}
              onChange={(event) => vat.setApply(event.target.checked)}
              className="peer sr-only"
            />
            <span aria-hidden className={pageCheckBoxClass}>
              <Check size={13} strokeWidth={3} />
            </span>
            Appliquer la TVA
          </label>
          {vat.apply ? (
            <div className="grid gap-3.5 lg:grid-cols-2 lg:items-end">
              <div className="flex min-w-0 flex-col gap-[7px]">
                <label htmlFor={vatId} className={editLabelClass}>
                  Taux de TVA
                </label>
                <div className="relative">
                  <input
                    id={vatId}
                    name="vatRate"
                    inputMode="decimal"
                    autoComplete="off"
                    placeholder="21"
                    value={vat.rateText}
                    onChange={(event) => vat.setRateText(event.target.value)}
                    aria-describedby={priceLineId}
                    className={`${editFieldClass} pr-10`}
                  />
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-[16px] text-faint lg:text-[14px]"
                  >
                    %
                  </span>
                </div>
              </div>
              <label className={`${pageCheckLabelClass} lg:min-h-11`}>
                <input
                  type="checkbox"
                  name="vatIncluded"
                  checked={vat.included}
                  onChange={(event) => vat.setIncluded(event.target.checked)}
                  className="peer sr-only"
                />
                <span aria-hidden className={pageCheckBoxClass}>
                  <Check size={13} strokeWidth={3} />
                </span>
                TVA comprise dans le prix
              </label>
            </div>
          ) : null}
          <p
            id={priceLineId}
            aria-live="polite"
            className="flex items-start gap-2.5 rounded-[12px] bg-surface-2 px-3.5 py-3 text-[13.5px] leading-[1.45] text-dlg-ink-2 lg:items-center lg:text-[13px]"
          >
            <Info
              aria-hidden
              size={15}
              strokeWidth={1.8}
              className="mt-px shrink-0 text-violet-text max-lg:hidden lg:mt-0"
            />
            {priceLine}
          </p>
        </EditSection>

        <EditSection title="Note du coach" optional>
          <textarea
            name="notes"
            aria-label="Note du coach"
            rows={3}
            maxLength={500}
            placeholder="Ex. : prévoir chronos et plots"
            defaultValue={v.notes}
            className={`${editFieldClass} block h-auto min-h-[88px] resize-y py-3 leading-[1.45] lg:min-h-[84px]`}
          />
        </EditSection>

        {/* Téléphone : l'erreur juste au-dessus de la barre fixe (sur ordinateur, dans le récap). */}
        {errorAlert ? <div className="px-2 lg:hidden">{errorAlert}</div> : null}
      </form>

      {/* Bas de page (kit C-FOOT) : l'avertissement, et « Supprimer la séance » sur ordinateur. */}
      <div className="flex items-start justify-between gap-4 px-2 pt-1 lg:rounded-[20px] lg:bg-surface lg:px-[22px] lg:py-4 lg:inset-ring lg:inset-ring-line-soft">
        <p className="text-[12.5px] leading-[1.5] text-faint lg:text-muted">
          Pour changer de type ou de sportif, supprime la séance et crée-en une nouvelle.
        </p>
        {footer ? <div className="shrink-0 max-lg:hidden">{footer}</div> : null}
      </div>

      <MobileActionBar>
        <Link href={cancelHref} className={mobileActionSecondaryClass}>
          Annuler
        </Link>
        <button type="submit" form={formId} disabled={pending} className={mobileActionPrimaryClass}>
          {pending ? "Enregistrement…" : submitLabel}
        </button>
      </MobileActionBar>
    </div>
  );
}
