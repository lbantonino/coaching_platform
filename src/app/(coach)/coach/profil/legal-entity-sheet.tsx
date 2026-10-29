"use client";

import { Pencil, Plus } from "lucide-react";
import { useActionState, useEffect, useState } from "react";

import { buttonClass } from "@/components/ui/button";
import { FieldCheck } from "@/components/ui/field-check";
import {
  errorTextClass,
  hintClass,
  inputClass,
  labelClass,
  textareaClass,
} from "@/components/ui/form-styles";
import { Sheet } from "@/components/ui/overlay";
import { useToast } from "@/components/ui/toast";
import {
  LEGAL_FORMS,
  VAT_STATUSES,
  formatEnterpriseNumber,
  legalFormLabels,
  normalizeVatNumber,
  vatStatusLabels,
} from "@/domain/billing/legal";
import { countryOptions } from "@/domain/geo/countries";
import { saveLegalEntity, type SettingsState } from "@/features/coach/settings-actions";
import type { LegalEntityInput } from "@/features/coach/settings";

// Fenêtre « Structure légale » (D-57) : ajout ou modification. International (D-69) : le pays vient
// en premier, il décide des formats (BCE et « BE… » seulement en Belgique) ; un assujetti donne son
// taux de TVA habituel, proposé ensuite sur chaque facture. En Belgique, le numéro de TVA se déduit
// du numéro d'entreprise s'il n'est pas saisi.
const empty: LegalEntityInput = {
  name: "",
  legalForm: "independent",
  enterpriseNumber: "",
  vatStatus: "subject",
  vatNumber: "",
  defaultVatRate: "",
  addressLine: "",
  postalCode: "",
  city: "",
  country: "BE",
  iban: "",
  bic: "",
  paymentDetails: "",
  billingEmail: "",
  invoicePrefix: "FAC",
  legalMentions: "",
  isDefault: false,
};

export function LegalEntityButton({
  organizationId,
  entityId = null,
  values = empty,
  label,
  onSaved,
}: {
  organizationId: string;
  entityId?: string | null;
  values?: LegalEntityInput;
  // Nom de la structure : bouton « Modifier » ; sinon bouton « Ajouter une structure ».
  label?: string;
  // Fenêtre des Paramètres : relire les structures après un enregistrement.
  onSaved?: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={label ? `Modifier ${label}` : undefined}
        className={buttonClass({
          variant: label ? "outline" : "inverse",
          size: label ? "sm" : "md",
        })}
      >
        {label ? (
          <Pencil aria-hidden size={15} strokeWidth={1.8} />
        ) : (
          <Plus aria-hidden size={16} strokeWidth={2} />
        )}
        {label ? "Modifier" : "Ajouter une structure"}
      </button>
      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title={label ? `Modifier ${label}` : "Nouvelle structure"}
        subtitle="Les infos qui figureront sur tes factures."
      >
        {open ? (
          <LegalEntityForm
            organizationId={organizationId}
            entityId={entityId}
            values={values}
            onSaved={() => {
              setOpen(false);
              onSaved?.();
            }}
          />
        ) : null}
      </Sheet>
    </>
  );
}

function LegalEntityForm({
  organizationId,
  entityId,
  values,
  onSaved,
}: {
  organizationId: string;
  entityId: string | null;
  values: LegalEntityInput;
  onSaved: () => void;
}) {
  const [state, formAction, pending] = useActionState(
    saveLegalEntity.bind(null, organizationId, entityId),
    { error: null, saved: false, attempt: 0, values: null } as SettingsState<LegalEntityInput>,
  );
  const toast = useToast();
  useEffect(() => {
    if (!state.saved) return;
    toast("Structure enregistrée.");
    onSaved();
  }, [state, toast, onSaved]);
  const v = state.values ?? values;
  return (
    <Fields
      key={state.attempt}
      formAction={formAction}
      pending={pending}
      error={state.error}
      v={v}
    />
  );
}

function Fields({
  formAction,
  pending,
  error,
  v,
}: {
  formAction: (formData: FormData) => void;
  pending: boolean;
  error: string | null;
  v: LegalEntityInput;
}) {
  const [vatStatus, setVatStatus] = useState(v.vatStatus);
  const [country, setCountry] = useState(v.country);
  const [enterprise, setEnterprise] = useState(v.enterpriseNumber);
  const countries = countryOptions();
  const be = country === "BE";
  const subject = vatStatus === "subject";
  const derivedVat = be ? normalizeVatNumber(enterprise, "BE") : null;
  return (
    <form action={formAction} className="flex flex-col gap-5" noValidate>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="legal-name" className={labelClass}>
          Raison sociale
        </label>
        <input
          id="legal-name"
          name="name"
          maxLength={120}
          placeholder="Ex. : ton nom et prénom, ou le nom de ton association"
          defaultValue={v.name}
          className={inputClass}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="legal-country" className={labelClass}>
            Pays
          </label>
          <select
            id="legal-country"
            name="country"
            value={country}
            onChange={(event) => setCountry(event.target.value)}
            className={inputClass}
          >
            {countries.map((option) => (
              <option key={option.code} value={option.code}>
                {option.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="legal-form" className={labelClass}>
            Forme juridique
          </label>
          <select
            id="legal-form"
            name="legalForm"
            defaultValue={v.legalForm}
            className={inputClass}
          >
            {LEGAL_FORMS.map((form) => (
              <option key={form} value={form}>
                {legalFormLabels[form]}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="legal-vat-status" className={labelClass}>
          TVA
        </label>
        <select
          id="legal-vat-status"
          name="vatStatus"
          value={vatStatus}
          onChange={(event) => setVatStatus(event.target.value)}
          className={inputClass}
        >
          {VAT_STATUSES.map((status) => (
            <option key={status} value={status}>
              {vatStatusLabels[status]}
            </option>
          ))}
        </select>
      </div>
      {subject ? (
        <div className="grid gap-4 sm:grid-cols-[1fr_2fr]">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="legal-vat-rate" className={labelClass}>
              Taux habituel (%)
            </label>
            <input
              id="legal-vat-rate"
              name="defaultVatRate"
              inputMode="decimal"
              autoComplete="off"
              placeholder={be ? "21" : "Ex. : 20"}
              defaultValue={v.defaultVatRate}
              aria-describedby="legal-vat-rate-hint"
              className={`${inputClass} font-mono`}
            />
            <p id="legal-vat-rate-hint" className={hintClass}>
              Proposé sur chaque facture, modifiable.
            </p>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="legal-vat-number" className={labelClass}>
              Numéro de TVA{" "}
              {be ? (
                <span className="font-normal text-muted">(sinon : BE + n° d&apos;entreprise)</span>
              ) : null}
            </label>
            <input
              id="legal-vat-number"
              name="vatNumber"
              autoComplete="off"
              placeholder={be ? (derivedVat ?? "BE0123456749") : "Ex. : FR40303265045"}
              defaultValue={v.vatNumber}
              className={`${inputClass} font-mono uppercase`}
            />
          </div>
        </div>
      ) : null}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="legal-enterprise" className={labelClass}>
          {be ? "Numéro d'entreprise (BCE)" : "Numéro d'entreprise"}{" "}
          <span className="font-normal text-muted">(facultatif)</span>
        </label>
        <input
          id="legal-enterprise"
          name="enterpriseNumber"
          inputMode={be ? "numeric" : "text"}
          placeholder={be ? "0123.456.749" : "Ex. : SIRET, numéro d'immatriculation"}
          value={enterprise}
          onChange={(event) => setEnterprise(event.target.value)}
          aria-describedby="legal-enterprise-hint"
          className={`${inputClass} font-mono`}
        />
        {be ? <FieldCheck htmlFor="legal-enterprise" rule="enterprise-number" /> : null}
        <p id="legal-enterprise-hint" className={hintClass}>
          {subject && be && derivedVat
            ? `Numéro de TVA déduit : BE${formatEnterpriseNumber(derivedVat.slice(2))}`
            : "Imprimé sur tes factures s'il est rempli."}
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="legal-address" className={labelClass}>
            Adresse <span className="font-normal text-muted">(facultatif)</span>
          </label>
          <input
            id="legal-address"
            name="addressLine"
            maxLength={160}
            autoComplete="street-address"
            placeholder="Rue et numéro"
            defaultValue={v.addressLine}
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="legal-postal" className={labelClass}>
            Code postal
          </label>
          <input
            id="legal-postal"
            name="postalCode"
            maxLength={10}
            autoComplete="postal-code"
            inputMode={be ? "numeric" : "text"}
            defaultValue={v.postalCode}
            className={`${inputClass} font-mono`}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="legal-city" className={labelClass}>
            Ville
          </label>
          <input
            id="legal-city"
            name="city"
            maxLength={80}
            autoComplete="address-level2"
            defaultValue={v.city}
            className={inputClass}
          />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="legal-iban" className={labelClass}>
            IBAN <span className="font-normal text-muted">(facultatif)</span>
          </label>
          <input
            id="legal-iban"
            name="iban"
            autoComplete="off"
            placeholder="BE68 5390 0754 7034"
            defaultValue={v.iban}
            className={`${inputClass} font-mono`}
          />
          <FieldCheck htmlFor="legal-iban" rule="iban" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="legal-bic" className={labelClass}>
            BIC
          </label>
          <input
            id="legal-bic"
            name="bic"
            autoComplete="off"
            placeholder="GEBABEBB"
            defaultValue={v.bic}
            className={`${inputClass} font-mono`}
          />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="legal-payment-details" className={labelClass}>
          Autres coordonnées de paiement{" "}
          <span className="font-normal text-muted">(facultatif)</span>
        </label>
        <textarea
          id="legal-payment-details"
          name="paymentDetails"
          rows={2}
          maxLength={300}
          placeholder="Ex. : numéro de compte hors IBAN, routing number, lien de paiement"
          defaultValue={v.paymentDetails}
          aria-describedby="legal-payment-details-hint"
          className={textareaClass}
        />
        <p id="legal-payment-details-hint" className={hintClass}>
          Imprimées sur la facture, utiles dans les pays sans IBAN.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="legal-email" className={labelClass}>
            E-mail de facturation <span className="font-normal text-muted">(facultatif)</span>
          </label>
          <input
            id="legal-email"
            name="billingEmail"
            type="email"
            inputMode="email"
            defaultValue={v.billingEmail}
            className={inputClass}
          />
          <FieldCheck htmlFor="legal-email" rule="email" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="legal-prefix" className={labelClass}>
            Préfixe des factures
          </label>
          <input
            id="legal-prefix"
            name="invoicePrefix"
            maxLength={12}
            defaultValue={v.invoicePrefix}
            aria-describedby="legal-prefix-hint"
            className={`${inputClass} font-mono uppercase`}
          />
          <p id="legal-prefix-hint" className={hintClass}>
            Ex. : FAC donne FAC-2026-001.
          </p>
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="legal-mentions" className={labelClass}>
          Mentions légales <span className="font-normal text-muted">(facultatif)</span>
        </label>
        <textarea
          id="legal-mentions"
          name="legalMentions"
          rows={3}
          maxLength={1000}
          placeholder="Ex. : Régime particulier de franchise des petites entreprises, ou « TVA non applicable »."
          defaultValue={v.legalMentions}
          className={textareaClass}
        />
      </div>
      <label className="inline-flex w-fit cursor-pointer items-center gap-2.5 text-small">
        <input
          type="checkbox"
          name="isDefault"
          defaultChecked={v.isDefault}
          className="size-4 accent-[var(--text)]"
        />
        Structure par défaut pour les nouvelles factures
      </label>
      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={pending}
          className={buttonClass({ variant: "primary", size: "md" })}
        >
          {pending ? "Enregistrement…" : "Enregistrer la structure"}
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
