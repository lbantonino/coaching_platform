"use client";

import { Download, LogOut } from "lucide-react";
import {
  useActionState,
  useEffect,
  useId,
  useRef,
  useState,
  useTransition,
  type ReactNode,
} from "react";

import { useMoney } from "@/components/blocks/money-context";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import { FieldCheck } from "@/components/ui/field-check";
import { mobileActionPrimaryClass } from "@/components/ui/mobile-action-bar";
import { ThemeChoice } from "@/components/ui/theme-choice";
import { useToast } from "@/components/ui/toast";
import { VatRateInput } from "@/components/ui/vat-rate-input";
import { currencyLabel, currencySymbol } from "@/domain/billing/money";
import { COUNTRY_NAMES } from "@/domain/geo/country-names";
import { logout } from "@/features/auth/actions";
import {
  changeEmail,
  changePassword,
  setNotificationPreference,
  setOrganizationCountry,
  setOrganizationVatRate,
  signOutEverywhere,
  updatePreferences,
  type SettingsState,
} from "@/features/coach/settings-actions";
import {
  NOTIFICATION_KINDS,
  notificationKindLabels,
  type NotificationKind,
  type PreferencesInput,
  type VatSettingInput,
} from "@/features/coach/settings";
import type { SettingsData } from "@/features/coach/settings-data";
import { formatDate } from "@/lib/format";

import { CurrencyChangeButton } from "./currency-change-sheet";

// Rubriques Préférences, Pays / devise / TVA, Sécurité et Données de la fenêtre des Paramètres, au
// kit « Coory Pages », page 13 (D-127). La rubrique Profil n'est pas ici (déjà faite, ne pas toucher :
// ProfileDialogSection). Téléphone d'abord : cartes blanches sur le fond de la page, champs de 48 px
// en 16 px, segments égaux, interrupteurs 46 × 28, boutons pleine largeur de 48 px. Ordinateur (à
// partir de 768 px, la fenêtre de 1 000 × 690) : cartes à filet, champs de 44 px, interrupteurs
// 40 × 24, boutons de 40 px. Un seul « Enregistrer » par rubrique (décision 7 d'Antonino) : pied
// fixe sur ordinateur, barre fixe sur téléphone ; le thème, lui, s'applique tout de suite.

function initial<T>(): SettingsState<T> {
  return { error: null, saved: false, attempt: 0, values: null };
}

// --- Briques du kit ------------------------------------------------------------------------------

const cardClass =
  "flex min-w-0 flex-col gap-3.5 rounded-[22px] bg-surface px-4 py-[18px] md:gap-4 md:rounded-[16px] md:bg-transparent md:p-5 md:inset-ring md:inset-ring-line";

function SettingsCard({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section aria-labelledby={`${id}-title`} className={cardClass}>
      <div className="flex flex-col gap-1">
        <h4
          id={`${id}-title`}
          className="text-[16px] leading-[normal] font-semibold md:text-[15px]"
        >
          {title}
        </h4>
        {description ? (
          <p className="text-[13px] leading-[1.5] text-muted md:text-[12.5px]">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

const labelClass = "text-[14px] leading-[normal] font-semibold text-text md:text-[13px]";
const optionalClass = "font-normal text-faint";
const helpClass = "text-[13px] leading-[1.45] text-faint md:text-[12px]";
const fieldBase =
  "w-full rounded-[12px] bg-surface-2 text-[16px] text-text inset-ring inset-ring-line-2 outline-none placeholder:text-faint transition-shadow duration-150 focus:inset-ring-[1.5px] focus:inset-ring-violet aria-[invalid=true]:inset-ring-alert disabled:cursor-not-allowed disabled:text-muted md:rounded-[11px] md:text-[14px]";
const inputClass = `${fieldBase} h-12 px-3.5 md:h-11`;
// Deux colonnes sur ordinateur (14 px entre les lignes, 16 entre les colonnes), une sur téléphone.
const gridClass = "grid gap-3.5 md:grid-cols-2 md:gap-x-4";

function Field({
  label,
  htmlFor,
  optional = false,
  help,
  helpId,
  className = "",
  children,
}: {
  label: string;
  htmlFor: string;
  optional?: boolean;
  help?: ReactNode;
  helpId?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={`flex min-w-0 flex-col gap-[7px] ${className}`}>
      <label htmlFor={htmlFor} className={labelClass}>
        {label}
        {optional ? <span className={optionalClass}> facultatif</span> : null}
      </label>
      {children}
      {help ? (
        <p id={helpId} className={helpClass}>
          {help}
        </p>
      ) : null}
    </div>
  );
}

// Unité au bout du champ (« min », « € », « % »), grise.
function Suffix({ children }: { children: ReactNode }) {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-[16px] text-faint md:text-[14px]"
    >
      {children}
    </span>
  );
}

// Ligne à interrupteur (notifications, « Je facture la TVA ») : la vraie case, invisible, couvre le
// dessin de l'interrupteur ; toute la ligne la commande (étiquette).
function SwitchRow({
  label,
  hint,
  name,
  checked,
  disabled = false,
  onChange,
}: {
  label: string;
  hint: string;
  name?: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (on: boolean) => void;
}) {
  return (
    <label
      className={`flex min-h-14 items-center gap-3 border-t border-line py-3 first:border-t-0 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent md:min-h-0 md:gap-3.5 ${
        disabled ? "cursor-not-allowed" : "cursor-pointer"
      }`}
    >
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-[14.5px] leading-[normal] font-semibold text-text md:text-[13.5px]">
          {label}
        </span>
        <span className="text-[13px] leading-[1.4] text-muted md:text-[12.5px]">{hint}</span>
      </span>
      <span
        className={`relative flex h-7 w-[46px] shrink-0 rounded-full p-[3px] transition-colors duration-200 md:h-6 md:w-10 ${
          checked ? "bg-violet" : "bg-dlg-check-line"
        } ${disabled ? "opacity-50" : ""}`}
      >
        <input
          type="checkbox"
          role="switch"
          name={name}
          checked={checked}
          disabled={disabled}
          onChange={(event) => onChange(event.target.checked)}
          className="absolute inset-0 m-0 size-full cursor-[inherit] appearance-none rounded-full opacity-0"
        />
        <span
          aria-hidden
          className={`pointer-events-none size-[22px] rounded-full bg-white shadow-[0_1px_2px_rgba(0,0,0,0.2)] transition-transform duration-200 ease-out motion-reduce:transition-none md:size-[18px] ${
            checked ? "translate-x-[18px] md:translate-x-4" : ""
          }`}
        />
      </span>
    </label>
  );
}

// Boutons d'une carte : pleine largeur 48 px sur téléphone, 40 px à leur largeur sur ordinateur.
const cardButtonBase =
  "inline-flex h-12 w-full items-center justify-center gap-2 rounded-[13px] px-4 text-[15px] leading-[normal] font-semibold transition-[scale,background-color,opacity] duration-150 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 md:h-10 md:w-auto md:rounded-[11px] md:text-[13.5px]";
const primaryButtonClass = `${cardButtonBase} bg-cta text-on-cta`;
const secondaryButtonClass = `${cardButtonBase} bg-surface text-text inset-ring inset-ring-line-2 hover:bg-surface-2`;
const dangerButtonClass = `${cardButtonBase} bg-surface text-status-danger inset-ring inset-ring-line-2 hover:bg-surface-2`;

// Message sous une carte : erreur (rouge) ou confirmation (vert).
function Feedback({ state, saved }: { state: SettingsState<unknown>; saved: string }) {
  if (state.error) {
    return (
      <p role="alert" className="text-[13px] leading-[1.45] font-medium text-alert">
        {state.error}
      </p>
    );
  }
  return state.saved ? (
    <p role="status" className="text-[13px] leading-[1.45] font-medium text-ok">
      {state.message ?? saved}
    </p>
  ) : null;
}

// Pied d'une rubrique à enregistrer : fixe en bas de la fenêtre sur ordinateur (« Annuler » referme
// la fenêtre) ; barre fixe « Enregistrer » sur téléphone (on referme par la croix).
export function SaveFooter({
  onSave,
  onCancel,
  pending,
  error,
}: {
  onSave: () => void;
  onCancel: () => void;
  pending: boolean;
  error?: string | null;
}) {
  const label = pending ? "Enregistrement…" : "Enregistrer";
  return (
    <>
      <div className="hidden shrink-0 items-center gap-2.5 border-t border-dlg-divider px-7 py-3.5 md:flex">
        <p
          role={error ? "alert" : undefined}
          className={`min-w-0 flex-1 text-[12.5px] leading-[1.45] ${error ? "font-medium text-alert" : "text-faint"}`}
        >
          {error ?? "Les changements s'appliquent dès l'enregistrement."}
        </p>
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex h-10 items-center rounded-[11px] px-4 text-[13.5px] leading-[normal] font-medium text-text inset-ring inset-ring-line-2 transition-colors duration-150 hover:bg-surface-2"
        >
          Annuler
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={pending}
          className="inline-flex h-10 items-center rounded-[11px] bg-cta px-[18px] text-[13.5px] leading-[normal] font-semibold text-on-cta transition-[scale,opacity] duration-150 active:scale-[0.98] disabled:opacity-50"
        >
          {label}
        </button>
      </div>
      <div className="absolute inset-x-0 bottom-0 z-10 flex flex-col gap-2 px-4 pt-3 pb-[max(30px,env(safe-area-inset-bottom))] [background:linear-gradient(to_bottom,transparent,var(--bg)_30%)] md:hidden">
        {error ? (
          <p
            role="alert"
            className="rounded-[12px] bg-surface px-3.5 py-2.5 text-[13px] leading-[1.45] font-medium text-alert"
          >
            {error}
          </p>
        ) : null}
        {/* Rangée : le bouton partagé grandit en largeur (flex-1), pas en hauteur. */}
        <div className="flex">
          <button
            type="button"
            onClick={onSave}
            disabled={pending}
            className={mobileActionPrimaryClass}
          >
            {label}
          </button>
        </div>
      </div>
    </>
  );
}

// Corps qui défile d'une rubrique. `saveBar` : sur téléphone, de la place sous la dernière carte pour
// passer au-dessus de la barre « Enregistrer ».
export function SectionBody({
  intro,
  saveBar = false,
  children,
}: {
  intro: string;
  saveBar?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      data-dialog-body
      className={`flex min-h-0 flex-1 flex-col gap-3 overflow-x-hidden overflow-y-auto overscroll-contain px-3 md:gap-3.5 md:px-7 md:pt-5 md:pb-6 ${
        saveBar ? "pb-[110px]" : "pb-7"
      }`}
    >
      <p className="px-1.5 text-[13.5px] leading-[1.45] text-muted md:hidden">{intro}</p>
      {children}
    </div>
  );
}

// --- Préférences ---------------------------------------------------------------------------------
const hours = (from: number, to: number) =>
  Array.from({ length: to - from + 1 }, (_, i) => from + i);

const vatText = (rate: number) => String(rate).replace(".", ",");

export function PreferencesSection({
  values,
  notify,
  intro,
  onChanged,
  onClose,
}: {
  values: PreferencesInput;
  notify: Record<NotificationKind, boolean>;
  intro: string;
  onChanged: () => void;
  onClose: () => void;
}) {
  const [state, formAction, formPending] = useActionState(
    updatePreferences,
    initial<PreferencesInput>(),
  );
  const v = state.values ?? values;
  const [method, setMethod] = useState(v.defaultPaymentMethod || "transfer");
  const [bell, setBell] = useState(notify);
  const [bellError, setBellError] = useState<string | null>(null);
  const [bellPending, startBell] = useTransition();
  const form = useRef<HTMLFormElement>(null);
  const formId = useId();
  const toast = useToast();
  const { currency, vatRate } = useMoney();
  const symbol = currencySymbol(currency);

  // Enregistré : un mot, et la fenêtre relit ses données (cloche, valeurs par défaut).
  useEffect(() => {
    if (state.saved) {
      toast("Préférences enregistrées.");
      onChanged();
    }
  }, [state, toast, onChanged]);

  // Un seul « Enregistrer » : d'abord les interrupteurs changés de la cloche, puis le formulaire.
  const save = () =>
    startBell(async () => {
      const changed = NOTIFICATION_KINDS.filter((kind) => bell[kind] !== notify[kind]);
      const results = await Promise.all(
        changed.map((kind) => setNotificationPreference(kind, bell[kind])),
      );
      setBellError(
        results.every((result) => result.ok)
          ? null
          : "Les notifications n'ont pas pu être enregistrées. Réessaie.",
      );
      form.current?.requestSubmit();
    });

  const priceHelp =
    method === "cash"
      ? vatRate > 0
        ? "En espèces : prix direct, TVA comprise."
        : "En espèces : prix direct."
      : vatRate > 0
        ? `Par virement : prix hors TVA, la TVA de ${vatText(vatRate)} % s'ajoute.`
        : "Par virement : prix sans TVA (tu ne factures pas la TVA).";

  return (
    <>
      <SectionBody intro={intro} saveBar>
        {/* Formulaire sans contenu : les champs y sont reliés par l'attribut `form`. */}
        <form ref={form} id={formId} key={state.attempt} action={formAction} noValidate hidden />
        <SettingsCard
          id="settings-theme"
          title="Thème"
          description="« Système » suit le réglage de ton téléphone ou de ton ordinateur. Retenu sur cet appareil."
        >
          <ThemeChoice look="kit" name="settings-theme" />
        </SettingsCard>

        <SettingsCard
          id="settings-defaults"
          title="Valeurs par défaut"
          description="La fenêtre « Nouvelle séance » se remplit avec ces valeurs. Tu peux toujours les changer."
        >
          <div key={state.attempt} className={gridClass}>
            <Field label="Durée" htmlFor="pref-duration">
              <div className="relative">
                <input
                  id="pref-duration"
                  form={formId}
                  name="defaultSessionMinutes"
                  type="number"
                  inputMode="numeric"
                  min={15}
                  max={480}
                  step={5}
                  defaultValue={v.defaultSessionMinutes}
                  aria-describedby="pref-duration-unit"
                  className={`${inputClass} pr-14`}
                />
                <Suffix>min</Suffix>
                <span id="pref-duration-unit" className="sr-only">
                  en minutes
                </span>
              </div>
            </Field>
            <Field label="Lieu" htmlFor="pref-location" optional>
              <input
                id="pref-location"
                form={formId}
                name="defaultLocation"
                maxLength={120}
                placeholder="Ex. : Salle de sport"
                defaultValue={v.defaultLocation}
                className={inputClass}
              />
            </Field>
            <Field
              label="Prix"
              htmlFor="pref-price"
              optional
              help={priceHelp}
              helpId="pref-price-hint"
            >
              <div className="relative">
                <input
                  id="pref-price"
                  form={formId}
                  name="defaultPrice"
                  inputMode="decimal"
                  placeholder="Ex. : 65"
                  defaultValue={v.defaultPrice}
                  aria-describedby="pref-price-hint"
                  className={`${inputClass} pr-14`}
                />
                <Suffix>{symbol}</Suffix>
              </div>
              <FieldCheck htmlFor="pref-price" rule="amount" />
            </Field>
          </div>
          <fieldset className="flex min-w-0 flex-col">
            <legend className={`${labelClass} mb-[7px]`}>Paiement</legend>
            <div className="flex h-[46px] gap-0.5 rounded-[12px] bg-dlg-segment p-[3px] md:inline-flex md:h-[42px] md:self-start md:rounded-[11px]">
              {(
                [
                  ["transfer", "Virement"],
                  ["cash", "Espèces"],
                ] as const
              ).map(([value, label]) => (
                <label
                  key={value}
                  className="tap-44 flex flex-1 cursor-pointer items-center justify-center rounded-[9px] text-[14px] leading-[normal] font-medium whitespace-nowrap text-muted transition-[color,background-color,box-shadow] duration-150 hover:text-text has-checked:bg-dlg-segment-active has-checked:text-text has-checked:shadow-[0_1px_3px_rgba(22,18,40,0.12)] has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent md:flex-none md:rounded-[8px] md:px-[18px] md:text-[13px]"
                >
                  <input
                    type="radio"
                    form={formId}
                    name="defaultPaymentMethod"
                    value={value}
                    checked={method === value}
                    onChange={() => setMethod(value)}
                    className="sr-only"
                  />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>
        </SettingsCard>

        <SettingsCard
          id="settings-agenda"
          title="Heures de l'agenda"
          description="Heures visibles à l'ouverture de la grille ; elle défile de 00:00 à 24:00."
        >
          <div key={state.attempt} className="grid grid-cols-2 gap-x-3 gap-y-3.5 md:gap-x-4">
            <Field label="À partir de" htmlFor="pref-first-hour">
              <select
                id="pref-first-hour"
                form={formId}
                name="agendaFirstHour"
                defaultValue={v.agendaFirstHour}
                className={inputClass}
              >
                {hours(0, 12).map((hour) => (
                  <option key={hour} value={hour}>
                    {String(hour).padStart(2, "0")}:00
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Jusqu'à" htmlFor="pref-last-hour">
              <select
                id="pref-last-hour"
                form={formId}
                name="agendaLastHour"
                defaultValue={v.agendaLastHour}
                className={inputClass}
              >
                {hours(13, 24).map((hour) => (
                  <option key={hour} value={hour}>
                    {String(hour).padStart(2, "0")}:00
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </SettingsCard>

        <SettingsCard
          id="settings-notifications"
          title="Notifications"
          description="Ce qui compte dans la cloche et s'affiche dans Notifications. Rien n'est envoyé par e-mail ou WhatsApp pour l'instant."
        >
          <div role="group" aria-label="Ce qui compte dans la cloche" className="flex flex-col">
            {NOTIFICATION_KINDS.map((kind) => (
              <SwitchRow
                key={kind}
                label={notificationKindLabels[kind].label}
                hint={notificationKindLabels[kind].hint}
                checked={bell[kind]}
                onChange={(on) => setBell((current) => ({ ...current, [kind]: on }))}
              />
            ))}
          </div>
        </SettingsCard>
      </SectionBody>
      <SaveFooter
        onSave={save}
        onCancel={onClose}
        pending={formPending || bellPending}
        error={state.error ?? bellError}
      />
    </>
  );
}

// --- Pays, devise et TVA -------------------------------------------------------------------------
export function MoneySection({
  data,
  intro,
  onChanged,
  onClose,
}: {
  data: SettingsData;
  intro: string;
  onChanged: () => void;
  onClose: () => void;
}) {
  const org = data.organization;
  const [country, setCountry] = useState(org.country);
  const [countryError, setCountryError] = useState<string | null>(null);
  const [countryPending, startCountry] = useTransition();
  const [state, formAction, vatPending] = useActionState(
    setOrganizationVatRate.bind(null, org.id),
    initial<VatSettingInput>(),
  );
  const saved = state.values ?? {
    vatEnabled: org.vatRate > 0,
    vatRate: org.vatRate > 0 ? vatText(org.vatRate) : "",
  };
  const [enabled, setEnabled] = useState(saved.vatEnabled);
  const [rate, setRate] = useState(saved.vatRate);
  const form = useRef<HTMLFormElement>(null);
  const formId = useId();
  const toast = useToast();

  useEffect(() => {
    if (state.saved) {
      toast("Pays et TVA enregistrés.");
      onChanged();
    }
  }, [state, toast, onChanged]);

  // Un seul « Enregistrer » : le pays s'il a changé, puis la TVA.
  const save = () =>
    startCountry(async () => {
      if (country !== org.country) {
        const result = await setOrganizationCountry(org.id, country);
        setCountryError(result.error);
        if (!result.ok) return;
      } else setCountryError(null);
      form.current?.requestSubmit();
    });

  const ownerOnly = org.isOwner ? null : "Seul le propriétaire peut changer ces réglages.";

  return (
    <>
      <SectionBody intro={intro} saveBar={org.isOwner}>
        <form ref={form} id={formId} key={state.attempt} action={formAction} noValidate hidden />
        <SettingsCard id="settings-country" title="Pays et devise" description={ownerOnly}>
          <div className={gridClass}>
            <Field
              label="Pays"
              htmlFor="organization-country"
              help="Proposé pour les adresses ; nomme les moyens de paiement de ton pays."
              helpId="organization-country-hint"
            >
              <select
                id="organization-country"
                value={country}
                disabled={!org.isOwner}
                onChange={(event) => setCountry(event.target.value)}
                aria-describedby="organization-country-hint"
                className={inputClass}
              >
                {COUNTRY_NAMES.map(([code, name]) => (
                  <option key={code} value={code}>
                    {name}
                  </option>
                ))}
              </select>
            </Field>
            <div className="flex min-w-0 flex-col gap-[7px]">
              <span className={labelClass}>Devise</span>
              <p className="flex items-center text-[15px] leading-[normal] font-semibold md:h-11 md:text-[14px]">
                {currencyLabel(org.currency)}
              </p>
              <p className={helpClass}>Tes nouveaux montants sont dans cette devise.</p>
            </div>
          </div>
          {data.currencyChanges.length > 0 ? (
            <ul
              aria-label="Changements de devise"
              className="flex flex-col gap-1 text-[13px] leading-[1.45] text-muted md:text-[12.5px]"
            >
              {data.currencyChanges.map((change) => (
                <li key={`${change.changedOn}-${change.from}-${change.to}`}>
                  {formatDate(change.changedOn)} : {change.from} → {change.to} (1 {change.from} ={" "}
                  {change.rate.toLocaleString("fr-BE", { maximumFractionDigits: 6 })} {change.to})
                </li>
              ))}
            </ul>
          ) : null}
          {org.isOwner ? (
            <div className="flex flex-col md:flex-row">
              <CurrencyChangeButton
                organizationId={org.id}
                currency={org.currency}
                onChanged={onChanged}
                className={secondaryButtonClass}
              />
            </div>
          ) : null}
        </SettingsCard>

        {/* TVA (D-90) : un seul taux, sans règle d'aucun pays. Coory ne fait pas de factures. */}
        <SettingsCard
          id="settings-vat"
          title="TVA"
          description="Pour le prix de tes séances et ton résultat hors TVA dans la Comptabilité. Tes factures se font dans ton logiciel de facturation ou chez ton comptable."
        >
          <div className="flex flex-col">
            <SwitchRow
              label="Je facture la TVA"
              hint="Sinon, tes prix et tes gains s'affichent sans TVA."
              checked={enabled}
              disabled={!org.isOwner}
              onChange={setEnabled}
            />
          </div>
          {/* Champs reliés au formulaire de la TVA : l'interrupteur ci-dessus est hors formulaire,
              sa valeur part par ce champ caché. */}
          {enabled ? (
            <>
              <input type="hidden" form={formId} name="vatEnabled" value="on" />
              <input type="hidden" form={formId} name="vatRate" value={rate} />
            </>
          ) : null}
          {enabled ? (
            <Field
              label="Taux de TVA"
              htmlFor="settings-vat-rate"
              help="Pour tes prochains paiements ; ceux déjà notés gardent leur taux."
              helpId="settings-vat-rate-hint"
              className="md:max-w-[220px]"
            >
              <VatRateInput
                id="settings-vat-rate"
                name="vatRateShown"
                value={rate}
                onChange={setRate}
                describedBy="settings-vat-rate-hint"
                disabled={!org.isOwner}
                className={`${inputClass} pr-10`}
              />
            </Field>
          ) : null}
        </SettingsCard>
      </SectionBody>
      {org.isOwner ? (
        <SaveFooter
          onSave={save}
          onCancel={onClose}
          pending={countryPending || vatPending}
          error={countryError ?? state.error}
        />
      ) : null}
    </>
  );
}

// --- Sécurité -----------------------------------------------------------------------------------
function EmailCard({ current }: { current: string }) {
  const [state, formAction, pending] = useActionState(changeEmail, initial<{ email: string }>());
  return (
    <SettingsCard
      id="settings-email"
      title="Adresse e-mail"
      description={
        <>
          Adresse actuelle : <span className="break-all">{current}</span>
        </>
      }
    >
      <form key={state.attempt} action={formAction} noValidate className="flex flex-col gap-3.5">
        <Field
          label="Nouvelle adresse e-mail"
          htmlFor="new-email"
          help="Un lien de confirmation part à la nouvelle adresse ; rien ne change avant ton clic."
          helpId="new-email-hint"
        >
          <input
            id="new-email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            defaultValue={state.values?.email ?? ""}
            aria-describedby="new-email-hint"
            className={inputClass}
          />
          <FieldCheck htmlFor="new-email" rule="email" />
        </Field>
        <div className="flex flex-col md:flex-row">
          <button type="submit" disabled={pending} className={primaryButtonClass}>
            {pending ? "Envoi…" : "Changer d'adresse"}
          </button>
        </div>
        <Feedback state={state} saved="Lien envoyé." />
      </form>
    </SettingsCard>
  );
}

function PasswordCard() {
  const [state, formAction, pending] = useActionState(changePassword, initial<null>());
  const [shown, setShown] = useState(false);
  return (
    <SettingsCard id="settings-password" title="Mot de passe">
      <form key={state.attempt} action={formAction} noValidate className="flex flex-col gap-3.5">
        <div className={gridClass}>
          <Field label="Mot de passe actuel" htmlFor="current-password">
            <div className="relative">
              <input
                id="current-password"
                name="current"
                type={shown ? "text" : "password"}
                autoComplete="current-password"
                className={`${inputClass} pr-[88px]`}
              />
              <button
                type="button"
                onClick={() => setShown((value) => !value)}
                aria-pressed={shown}
                aria-label={
                  shown ? "Masquer le mot de passe actuel" : "Afficher le mot de passe actuel"
                }
                className="absolute inset-y-0 right-1 my-auto flex h-11 items-center rounded-[9px] px-2.5 text-[14px] leading-[normal] font-medium text-faint transition-colors duration-150 hover:text-text md:h-9 md:text-[13px]"
              >
                {shown ? "Masquer" : "Afficher"}
              </button>
            </div>
          </Field>
          <span aria-hidden className="max-md:hidden" />
          <Field
            label="Nouveau mot de passe"
            htmlFor="new-password"
            help="Au moins 10 caractères."
            helpId="new-password-hint"
          >
            <input
              id="new-password"
              name="password"
              type="password"
              autoComplete="new-password"
              aria-describedby="new-password-hint"
              className={inputClass}
            />
          </Field>
          <Field label="Confirmer le nouveau" htmlFor="new-password-confirmation">
            <input
              id="new-password-confirmation"
              name="confirmation"
              type="password"
              autoComplete="new-password"
              className={inputClass}
            />
          </Field>
        </div>
        <div className="flex flex-col md:flex-row">
          <button type="submit" disabled={pending} className={primaryButtonClass}>
            {pending ? "Enregistrement…" : "Changer le mot de passe"}
          </button>
        </div>
        <Feedback state={state} saved="Mot de passe changé." />
      </form>
    </SettingsCard>
  );
}

export function SecuritySection({ email, intro }: { email: string; intro: string }) {
  return (
    <SectionBody intro={intro}>
      <EmailCard current={email} />
      <PasswordCard />
      <SettingsCard
        id="settings-devices"
        title="Appareils connectés"
        description="Un téléphone perdu, un ordinateur partagé : déconnecte tous tes appareils d'un coup, celui-ci compris."
      >
        <div className="flex flex-col gap-2.5 md:flex-row md:flex-wrap">
          <form action={signOutEverywhere} className="flex flex-col">
            <ConfirmSubmitButton
              title="Déconnecter tous les appareils ?"
              message="Tu devras te reconnecter partout, y compris ici."
              confirmLabel="Déconnecter partout"
              icon="logout"
              className={dangerButtonClass}
            >
              Déconnecter partout
            </ConfirmSubmitButton>
          </form>
          <form action={logout} className="flex flex-col">
            <button type="submit" className={secondaryButtonClass}>
              <LogOut aria-hidden size={16} strokeWidth={1.8} />
              Se déconnecter
            </button>
          </form>
        </div>
      </SettingsCard>
    </SectionBody>
  );
}

// --- Données --------------------------------------------------------------------------------------
export function DataSection({ intro }: { intro: string }) {
  return (
    <SectionBody intro={intro}>
      <SettingsCard
        id="settings-export"
        title="Exporter mes données"
        description="Un fichier JSON avec tout ce que contient ton organisation : sportifs, objectifs, séances, programmes, paiements, factures, tâches, messages, notes et structures. Utile pour une sauvegarde ou pour changer d'outil."
      >
        <div className="flex flex-col md:flex-row">
          <a href="/coach/profil/export" download className={primaryButtonClass}>
            <Download aria-hidden size={16} strokeWidth={1.9} />
            Télécharger mes données
          </a>
        </div>
        <p className="rounded-[10px] bg-status-warn-soft px-3 py-2.5 text-[13px] leading-[1.45] text-status-warn md:text-[12.5px]">
          Il contient des données de santé (blessures notées avec l&apos;accord des sportifs) :
          garde-le en lieu sûr.
        </p>
      </SettingsCard>
    </SectionBody>
  );
}

// Ligne courte d'une rubrique dans le menu (kit) : « Belgique · EUR · 21 % ».
export function moneySummary(data: SettingsData) {
  const org = data.organization;
  const country = COUNTRY_NAMES.find(([code]) => code === org.country)?.[1] ?? org.country;
  const vat = org.vatRate > 0 ? `${vatText(org.vatRate)} %` : "sans TVA";
  return `${country} · ${org.currency} · ${vat}`;
}
