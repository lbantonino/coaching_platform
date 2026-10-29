"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useOptimistic, useState, useTransition } from "react";

import { useMoney } from "@/components/blocks/money-context";
import { Toggle } from "@/components/ui/checkbox";
import { buttonClass } from "@/components/ui/button";
import { FieldCheck } from "@/components/ui/field-check";
import { errorTextClass, hintClass, inputClass, labelClass } from "@/components/ui/form-styles";
import { segmentedGroupClass, segmentedItemClass } from "@/components/ui/segmented";
import { useToast } from "@/components/ui/toast";
import { currencyLabel, currencySymbol, type Currency } from "@/domain/billing/money";
import { COUNTRY_NAMES } from "@/domain/geo/country-names";
import { formatDate } from "@/lib/format";
import {
  changeEmail,
  changePassword,
  renameOrganization,
  setInvoiceCashPreference,
  setNotificationPreference,
  setOrganizationCountry,
  updatePreferences,
  updateProfile,
  type SettingsState,
} from "@/features/coach/settings-actions";
import {
  notificationKindLabels,
  type NotificationKind,
  type PreferencesInput,
  type ProfileInput,
} from "@/features/coach/settings";

import { CurrencyChangeButton } from "./currency-change-sheet";

// Formulaires de la page Paramètres (D-57). Chacun garde la saisie après une erreur (`attempt`
// reconstruit le formulaire) et confirme sous son bouton. Bouton noir : plusieurs formulaires
// cohabitent sur un onglet, le rouge reste réservé à une seule action par écran.
function initial<T>(): SettingsState<T> {
  return { error: null, saved: false, attempt: 0, values: null };
}

function Feedback({ state, saved }: { state: SettingsState<unknown>; saved: string }) {
  if (state.error) {
    return (
      <p role="alert" className={errorTextClass}>
        {state.error}
      </p>
    );
  }
  return state.saved ? (
    <p role="status" className="text-small text-ok">
      {state.message ?? saved}
    </p>
  ) : null;
}

function Submit({ pending, label }: { pending: boolean; label: string }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className={buttonClass({ variant: "inverse", size: "md" })}
    >
      {pending ? "Enregistrement…" : label}
    </button>
  );
}

// --- Profil -------------------------------------------------------------------------------------
export function ProfileForm({ values, onSaved }: { values: ProfileInput; onSaved?: () => void }) {
  const [state, formAction, pending] = useActionState(updateProfile, initial<ProfileInput>());
  // Fenêtre : relire les données (nom affiché) après un enregistrement.
  useEffect(() => {
    if (state.saved) onSaved?.();
  }, [state, onSaved]);
  const v = state.values ?? values;
  return (
    <form key={state.attempt} action={formAction} className="flex flex-col gap-4" noValidate>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="coach-first-name" className={labelClass}>
            Prénom
          </label>
          <input
            id="coach-first-name"
            name="firstName"
            autoComplete="given-name"
            maxLength={80}
            defaultValue={v.firstName}
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="coach-last-name" className={labelClass}>
            Nom <span className="font-normal text-muted">(facultatif)</span>
          </label>
          <input
            id="coach-last-name"
            name="lastName"
            autoComplete="family-name"
            maxLength={80}
            defaultValue={v.lastName}
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="coach-company" className={labelClass}>
            Entreprise <span className="font-normal text-muted">(facultatif)</span>
          </label>
          <input
            id="coach-company"
            name="companyName"
            autoComplete="organization"
            maxLength={120}
            placeholder="Ex. : nom de ton activité"
            defaultValue={v.companyName}
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="coach-phone" className={labelClass}>
            Téléphone <span className="font-normal text-muted">(facultatif)</span>
          </label>
          <input
            id="coach-phone"
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="+32 …"
            defaultValue={v.phone}
            className={inputClass}
          />
          <FieldCheck htmlFor="coach-phone" rule="phone" />
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <Submit pending={pending} label="Enregistrer" />
        <Feedback state={state} saved="Profil enregistré." />
      </div>
    </form>
  );
}

export function OrganizationForm({
  organizationId,
  name,
  isOwner,
}: {
  organizationId: string;
  name: string;
  isOwner: boolean;
}) {
  const [state, formAction, pending] = useActionState(
    renameOrganization.bind(null, organizationId),
    initial<{ name: string }>(),
  );
  if (!isOwner) {
    return (
      <p className="text-[15px]">
        {name}
        <span className={`${hintClass} block`}>
          Seul le propriétaire peut renommer l&apos;organisation.
        </span>
      </p>
    );
  }
  return (
    <form key={state.attempt} action={formAction} className="flex flex-col gap-4" noValidate>
      <div className="flex flex-col gap-1.5 md:w-2/3">
        <label htmlFor="organization-name" className={labelClass}>
          Nom de l&apos;organisation
        </label>
        <input
          id="organization-name"
          name="organizationName"
          maxLength={120}
          defaultValue={state.values?.name ?? name}
          aria-describedby="organization-hint"
          className={inputClass}
        />
        <p id="organization-hint" className={hintClass}>
          Affiché dans le menu et sur les invitations envoyées à tes sportifs.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <Submit pending={pending} label="Renommer" />
        <Feedback state={state} saved="Organisation renommée." />
      </div>
    </form>
  );
}

// Pays et devise de l'organisation (D-69). Le pays se change ici (propriétaire) : il décide du nom
// des moyens de paiement (« Bancontact » en Belgique, « Carte bancaire » ailleurs). La devise se
// change par « Changer de devise » (D-70, déménagement), avec l'historique des changements.
export function CountryCurrencyForm({
  organizationId,
  country,
  currency,
  isOwner,
  changes,
  onChanged,
}: {
  organizationId: string;
  country: string;
  currency: Currency;
  isOwner: boolean;
  changes: { from: Currency; to: Currency; rate: number; changedOn: string }[];
  onChanged?: () => void;
}) {
  const [value, setValue] = useState(country);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const toast = useToast();
  const router = useRouter();
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="organization-country" className={labelClass}>
            Pays
          </label>
          <select
            id="organization-country"
            value={value}
            disabled={!isOwner || pending}
            onChange={(event) => {
              const next = event.target.value;
              setValue(next);
              startTransition(async () => {
                const result = await setOrganizationCountry(organizationId, next);
                setError(result.error);
                if (result.ok) {
                  toast("Pays enregistré.");
                  router.refresh();
                } else setValue(country);
              });
            }}
            aria-describedby="organization-country-hint"
            className={inputClass}
          >
            {COUNTRY_NAMES.map(([code, name]) => (
              <option key={code} value={code}>
                {name}
              </option>
            ))}
          </select>
          <p id="organization-country-hint" className={hintClass}>
            {isOwner
              ? "Proposé pour les adresses ; nomme les moyens de paiement de ton pays."
              : "Seul le propriétaire peut changer le pays."}
          </p>
        </div>
        <div className="flex flex-col gap-1.5">
          <span className={labelClass}>Devise</span>
          <p className="flex min-h-[50px] items-center text-[15px] font-medium">
            {currencyLabel(currency)}
          </p>
          <p className={hintClass}>Tes nouveaux montants sont dans cette devise.</p>
        </div>
      </div>
      {changes.length > 0 ? (
        <ul
          aria-label="Changements de devise"
          className="flex flex-col gap-1 text-[13px] text-muted"
        >
          {changes.map((change) => (
            <li key={`${change.changedOn}-${change.from}-${change.to}`}>
              {formatDate(change.changedOn)} : {change.from} → {change.to} (1 {change.from} ={" "}
              {change.rate.toLocaleString("fr-BE", { maximumFractionDigits: 6 })} {change.to})
            </li>
          ))}
        </ul>
      ) : null}
      {isOwner ? (
        <div>
          <CurrencyChangeButton
            organizationId={organizationId}
            currency={currency}
            onChanged={onChanged}
          />
        </div>
      ) : null}
      {error ? (
        <p role="alert" className={errorTextClass}>
          {error}
        </p>
      ) : null}
    </div>
  );
}

// --- Préférences --------------------------------------------------------------------------------
const hours = (from: number, to: number) =>
  Array.from({ length: to - from + 1 }, (_, i) => from + i);

export function PreferencesForm({ values }: { values: PreferencesInput }) {
  const [state, formAction, pending] = useActionState(
    updatePreferences,
    initial<PreferencesInput>(),
  );
  const v = state.values ?? values;
  const [method, setMethod] = useState(v.defaultPaymentMethod || "transfer");
  const { currency } = useMoney();
  const symbol = currencySymbol(currency);
  return (
    <form key={state.attempt} action={formAction} className="flex flex-col gap-6" noValidate>
      <div role="group" aria-labelledby="pref-session-title" className="flex flex-col gap-4">
        <h3 id="pref-session-title" className="text-block font-medium">
          Quand tu crées une séance
        </h3>
        <p className="-mt-2.5 text-small text-muted">
          Ex. : 60 min, à la salle, 65 {symbol} par virement, déjà remplis dans « Nouvelle séance ».
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="pref-duration" className={labelClass}>
              Durée (min)
            </label>
            <input
              id="pref-duration"
              name="defaultSessionMinutes"
              type="number"
              inputMode="numeric"
              min={15}
              max={480}
              step={5}
              defaultValue={v.defaultSessionMinutes}
              className={`${inputClass} font-mono`}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="pref-location" className={labelClass}>
              Lieu <span className="font-normal text-muted">(facultatif)</span>
            </label>
            <input
              id="pref-location"
              name="defaultLocation"
              maxLength={120}
              placeholder="Ex. : Salle de sport"
              defaultValue={v.defaultLocation}
              className={inputClass}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="pref-price" className={labelClass}>
              Prix ({symbol}) <span className="font-normal text-muted">(facultatif)</span>
            </label>
            <input
              id="pref-price"
              name="defaultPrice"
              inputMode="decimal"
              placeholder="Ex. : 65"
              defaultValue={v.defaultPrice}
              aria-describedby="pref-price-hint"
              className={`${inputClass} font-mono`}
            />
            <FieldCheck htmlFor="pref-price" rule="amount" />
            <p id="pref-price-hint" className={hintClass}>
              {method === "cash"
                ? "En espèces : prix direct, TVA comprise."
                : "Par virement : prix hors TVA, la TVA de 21 % s'ajoute."}
            </p>
          </div>
          <fieldset className="flex flex-col gap-1.5">
            <legend className={`${labelClass} mb-1.5`}>Paiement</legend>
            <div className={segmentedGroupClass}>
              {(
                [
                  ["transfer", "Virement"],
                  ["cash", "Espèces"],
                ] as const
              ).map(([value, label]) => (
                <label
                  key={value}
                  className="flex-1 cursor-pointer rounded-sm has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent"
                >
                  <input
                    type="radio"
                    name="defaultPaymentMethod"
                    value={value}
                    checked={method === value}
                    onChange={() => setMethod(value)}
                    className="peer sr-only"
                  />
                  <span className={segmentedItemClass}>{label}</span>
                </label>
              ))}
            </div>
          </fieldset>
        </div>
      </div>

      <div
        role="group"
        aria-labelledby="pref-agenda-title"
        className="flex flex-col gap-4 border-t border-line pt-6"
      >
        <h3 id="pref-agenda-title" className="text-block font-medium">
          Heures de l&apos;agenda
        </h3>
        <p className="-mt-2.5 text-small text-muted">
          Heures visibles à l&apos;ouverture de la grille ; elle défile de 00:00 à 24:00 pour noter
          quelque chose plus tôt ou plus tard.
        </p>
        <div className="grid grid-cols-2 gap-4 md:w-2/3">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="pref-first-hour" className={labelClass}>
              À partir de
            </label>
            <select
              id="pref-first-hour"
              name="agendaFirstHour"
              defaultValue={v.agendaFirstHour}
              className={`${inputClass} font-mono`}
            >
              {hours(0, 12).map((hour) => (
                <option key={hour} value={hour}>
                  {String(hour).padStart(2, "0")}:00
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="pref-last-hour" className={labelClass}>
              Jusqu&apos;à
            </label>
            <select
              id="pref-last-hour"
              name="agendaLastHour"
              defaultValue={v.agendaLastHour}
              className={`${inputClass} font-mono`}
            >
              {hours(13, 24).map((hour) => (
                <option key={hour} value={hour}>
                  {String(hour).padStart(2, "0")}:00
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <Submit pending={pending} label="Enregistrer les préférences" />
        <Feedback state={state} saved="Préférences enregistrées." />
      </div>
    </form>
  );
}

// Interrupteurs de la cloche : effet immédiat (useOptimistic), retour arrière si l'enregistrement échoue.
export function NotificationToggles({ values }: { values: Record<NotificationKind, boolean> }) {
  const toast = useToast();
  const [, startTransition] = useTransition();
  const [shown, setShown] = useOptimistic(
    values,
    (state, change: { kind: NotificationKind; on: boolean }) => ({
      ...state,
      [change.kind]: change.on,
    }),
  );
  return (
    <ul aria-label="Ce qui compte dans la cloche" className="flex flex-col">
      {(
        ["messages", "tasks", "invoices", "competitions", "profiles"] satisfies NotificationKind[]
      ).map((kind) => (
        <li
          key={kind}
          className="flex items-center justify-between gap-4 border-t border-line py-2 first:border-t-0"
        >
          <span className="flex min-w-0 flex-col">
            <span className="text-[15px] font-medium">{notificationKindLabels[kind].label}</span>
            <span className="text-[13px] text-muted">{notificationKindLabels[kind].hint}</span>
          </span>
          <Toggle
            label={<span className="sr-only">{notificationKindLabels[kind].label}</span>}
            checked={shown[kind]}
            onChange={(event) => {
              const on = event.target.checked;
              startTransition(async () => {
                setShown({ kind, on });
                const { ok } = await setNotificationPreference(kind, on);
                toast(
                  ok
                    ? on
                      ? "Affiché dans la cloche."
                      : "Masqué de la cloche."
                    : "Le réglage n'a pas pu être enregistré. Réessaie.",
                );
              });
            }}
          />
        </li>
      ))}
    </ul>
  );
}

// Facturation (D-66) : proposer aussi les paiements en espèces dans « À facturer ». Effet immédiat.
export function InvoiceCashToggle({ value }: { value: boolean }) {
  const { methodLabel } = useMoney();
  const toast = useToast();
  const [, startTransition] = useTransition();
  const [shown, setShown] = useOptimistic(value, (_state, on: boolean) => on);
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="flex min-w-0 flex-col">
        <span className="text-[15px] font-medium">Proposer aussi les espèces à facturer</span>
        <span className="text-[13px] text-muted">
          Les paiements en espèces apparaissent dans « À facturer », comme les virements et{" "}
          {methodLabel("bancontact")}.
        </span>
      </span>
      <Toggle
        label={<span className="sr-only">Proposer aussi les espèces à facturer</span>}
        checked={shown}
        onChange={(event) => {
          const on = event.target.checked;
          startTransition(async () => {
            setShown(on);
            const { ok } = await setInvoiceCashPreference(on);
            toast(
              ok
                ? on
                  ? "Les espèces seront proposées à facturer."
                  : "Les espèces ne seront plus proposées à facturer."
                : "Le réglage n'a pas pu être enregistré. Réessaie.",
            );
          });
        }}
      />
    </div>
  );
}

// --- Sécurité -----------------------------------------------------------------------------------
export function EmailForm({ current }: { current: string }) {
  const [state, formAction, pending] = useActionState(changeEmail, initial<{ email: string }>());
  return (
    <form key={state.attempt} action={formAction} className="flex flex-col gap-4" noValidate>
      <p className="text-[15px]">
        <span className="text-muted">Adresse actuelle : </span>
        <span className="break-all">{current}</span>
      </p>
      <div className="flex flex-col gap-1.5 md:w-2/3">
        <label htmlFor="new-email" className={labelClass}>
          Nouvelle adresse e-mail
        </label>
        <input
          id="new-email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          defaultValue={state.values?.email ?? ""}
          className={inputClass}
        />
        <FieldCheck htmlFor="new-email" rule="email" />
        <p className={hintClass}>
          Un lien de confirmation part à la nouvelle adresse ; rien ne change avant ton clic.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <Submit pending={pending} label="Changer d'adresse" />
        <Feedback state={state} saved="Lien envoyé." />
      </div>
    </form>
  );
}

export function PasswordForm() {
  const [state, formAction, pending] = useActionState(changePassword, initial<null>());
  return (
    <form key={state.attempt} action={formAction} className="flex flex-col gap-4" noValidate>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-1.5 md:col-span-2 md:w-1/2">
          <label htmlFor="current-password" className={labelClass}>
            Mot de passe actuel
          </label>
          <input
            id="current-password"
            name="current"
            type="password"
            autoComplete="current-password"
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="new-password" className={labelClass}>
            Nouveau mot de passe
          </label>
          <input
            id="new-password"
            name="password"
            type="password"
            autoComplete="new-password"
            aria-describedby="new-password-hint"
            className={inputClass}
          />
          <p id="new-password-hint" className={hintClass}>
            Au moins 10 caractères.
          </p>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="new-password-confirmation" className={labelClass}>
            Confirmer le nouveau
          </label>
          <input
            id="new-password-confirmation"
            name="confirmation"
            type="password"
            autoComplete="new-password"
            className={inputClass}
          />
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <Submit pending={pending} label="Changer le mot de passe" />
        <Feedback state={state} saved="Mot de passe changé." />
      </div>
    </form>
  );
}
