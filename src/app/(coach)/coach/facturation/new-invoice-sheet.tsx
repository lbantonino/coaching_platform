"use client";

import { Plus } from "lucide-react";
import { useActionState, useState, type ReactNode } from "react";

import { buttonClass } from "@/components/ui/button";
import { FieldCheck } from "@/components/ui/field-check";
import { errorTextClass, inputClass, labelClass } from "@/components/ui/form-styles";
import { Sheet } from "@/components/ui/overlay";
import { segmentedGroupClass, segmentedItemClass } from "@/components/ui/segmented";
import { formatEuros } from "@/domain/billing/invoices";
import { VAT_RATES, parseEuros, splitVat } from "@/domain/billing/payments";
import { COUNTRIES } from "@/features/athletes/schemas";
import {
  createInvoice,
  type NewInvoiceState,
  type NewInvoiceValues,
} from "@/features/billing/invoice-actions";

// Bouton « Créer une facture » de la page Facturation (demande d'Antonino du 29/10/2026) : une
// fenêtre avec tout ce qu'il faut pour une facture, pour un sportif existant ou un NOUVEAU sportif
// (sa fiche est créée : nom, adresse, contact). « Déjà payée » note aussi le paiement reçu ; « À
// payer » met une échéance. On arrive ensuite sur le brouillon, à relire puis émettre.
type Choice = { id: string; name: string };
type Entity = { id: string; name: string; vatSubject: boolean };

const initial: NewInvoiceState = { error: null, attempt: 0, values: null };

export function NewInvoiceButton({
  organizationId,
  athletes,
  entities,
  today,
  dueDefault,
}: {
  organizationId: string;
  athletes: Choice[];
  entities: Entity[];
  today: string;
  dueDefault: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(
    createInvoice.bind(null, organizationId),
    initial,
  );
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={buttonClass({ variant: "primary", size: "md", className: "max-lg:w-full" })}
      >
        <Plus aria-hidden size={17} strokeWidth={2} />
        Créer une facture
      </button>
      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title="Nouvelle facture"
        subtitle="Un brouillon, à relire puis émettre."
      >
        {entities.length === 0 ? (
          <p className="text-[14px] text-muted">
            Ajoute d&apos;abord ta structure légale (Paramètres, Structures légales) : elle figure
            sur chaque facture.
          </p>
        ) : (
          <InvoiceFields
            key={state.attempt}
            action={action}
            pending={pending}
            error={state.error}
            athletes={athletes}
            entities={entities}
            values={
              state.values ?? {
                legalEntityId: entities[0].id,
                athleteId: "",
                newAthlete: false,
                firstName: "",
                lastName: "",
                email: "",
                phone: "",
                addressLine: "",
                postalCode: "",
                city: "",
                country: "BE",
                label: "",
                amount: "",
                vatRate: "21",
                serviceOn: "",
                paid: true,
                receivedOn: today,
                method: "transfer",
                dueOn: dueDefault,
              }
            }
          />
        )}
      </Sheet>
    </>
  );
}

function Field({
  id,
  label,
  optional = false,
  children,
  wide = false,
}: {
  id: string;
  label: string;
  optional?: boolean;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${wide ? "sm:col-span-2" : ""}`}>
      <label htmlFor={id} className={labelClass}>
        {label}
        {optional ? <span className="font-normal text-muted"> (facultatif)</span> : null}
      </label>
      {children}
    </div>
  );
}

function InvoiceFields({
  action,
  pending,
  error,
  athletes,
  entities,
  values: v,
}: {
  action: (formData: FormData) => void;
  pending: boolean;
  error: string | null;
  athletes: Choice[];
  entities: Entity[];
  values: NewInvoiceValues;
}) {
  const [entityId, setEntityId] = useState(v.legalEntityId);
  const [newAthlete, setNewAthlete] = useState(v.newAthlete);
  const [amount, setAmount] = useState(v.amount);
  const [vatRate, setVatRate] = useState(v.vatRate);
  const [paid, setPaid] = useState(v.paid);
  const vatSubject = entities.find((entity) => entity.id === entityId)?.vatSubject ?? true;
  const rate = vatSubject ? Number(vatRate) : 0;
  const cents = parseEuros(amount);
  const split = cents === null ? null : splitVat(cents, rate);

  return (
    <form action={action} className="flex flex-col gap-5" noValidate>
      {entities.length > 1 ? (
        <Field id="new-invoice-entity" label="Structure qui facture">
          <select
            id="new-invoice-entity"
            name="legalEntityId"
            value={entityId}
            onChange={(event) => setEntityId(event.target.value)}
            className={inputClass}
          >
            {entities.map((entity) => (
              <option key={entity.id} value={entity.id}>
                {entity.name}
              </option>
            ))}
          </select>
        </Field>
      ) : (
        <input type="hidden" name="legalEntityId" value={entityId} />
      )}

      {/* Le client : un sportif existant, ou un nouveau dont la fiche est créée. */}
      <div className="flex flex-col gap-3">
        {newAthlete ? null : (
          <Field id="new-invoice-athlete" label="Sportif">
            <select
              id="new-invoice-athlete"
              name="athleteId"
              defaultValue={v.athleteId}
              className={inputClass}
            >
              <option value="">Choisir…</option>
              {athletes.map((athlete) => (
                <option key={athlete.id} value={athlete.id}>
                  {athlete.name}
                </option>
              ))}
            </select>
          </Field>
        )}
        <label className="inline-flex w-fit cursor-pointer items-start gap-2.5 text-small">
          <input
            type="checkbox"
            name="newAthlete"
            checked={newAthlete}
            onChange={(event) => setNewAthlete(event.target.checked)}
            className="mt-0.5 size-4 shrink-0 accent-[var(--text)]"
          />
          <span>
            Nouveau sportif
            <span className="block text-muted">
              Sa fiche est créée, puis se complète depuis Sportifs.
            </span>
          </span>
        </label>
        {newAthlete ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="new-invoice-first" label="Prénom">
              <input
                id="new-invoice-first"
                name="firstName"
                defaultValue={v.firstName}
                autoComplete="off"
                className={inputClass}
              />
            </Field>
            <Field id="new-invoice-last" label="Nom de famille">
              <input
                id="new-invoice-last"
                name="lastName"
                defaultValue={v.lastName}
                autoComplete="off"
                className={inputClass}
              />
            </Field>
            <Field id="new-invoice-street" label="Rue et numéro" wide>
              <input
                id="new-invoice-street"
                name="addressLine"
                defaultValue={v.addressLine}
                autoComplete="off"
                className={inputClass}
              />
            </Field>
            <Field id="new-invoice-postal" label="Code postal">
              <input
                id="new-invoice-postal"
                name="postalCode"
                defaultValue={v.postalCode}
                autoComplete="off"
                className={inputClass}
              />
            </Field>
            <Field id="new-invoice-city" label="Ville">
              <input
                id="new-invoice-city"
                name="city"
                defaultValue={v.city}
                autoComplete="off"
                className={inputClass}
              />
            </Field>
            <Field id="new-invoice-country" label="Pays">
              <select
                id="new-invoice-country"
                name="country"
                defaultValue={v.country}
                className={inputClass}
              >
                {COUNTRIES.map(([code, label]) => (
                  <option key={code} value={code}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>
            <Field id="new-invoice-email" label="Adresse e-mail" optional>
              <input
                id="new-invoice-email"
                name="email"
                type="email"
                inputMode="email"
                defaultValue={v.email}
                autoComplete="off"
                className={inputClass}
              />
            </Field>
            <Field id="new-invoice-phone" label="Téléphone" optional>
              <input
                id="new-invoice-phone"
                name="phone"
                type="tel"
                inputMode="tel"
                placeholder="+32 …"
                defaultValue={v.phone}
                autoComplete="off"
                className={inputClass}
              />
            </Field>
          </div>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="new-invoice-label" label="Description de la prestation" wide>
          <input
            id="new-invoice-label"
            name="label"
            maxLength={120}
            defaultValue={v.label}
            placeholder="Ex. : Coaching individuel · octobre"
            className={inputClass}
          />
        </Field>
        <Field id="new-invoice-amount" label="Montant (TVAC)">
          <input
            id="new-invoice-amount"
            name="amount"
            inputMode="decimal"
            autoComplete="off"
            placeholder="Ex. : 78,65"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            className={inputClass}
          />
          <FieldCheck htmlFor="new-invoice-amount" rule="euros" />
        </Field>
        <Field id="new-invoice-vat" label="TVA">
          {vatSubject ? (
            <select
              id="new-invoice-vat"
              name="vatRate"
              value={vatRate}
              onChange={(event) => setVatRate(event.target.value)}
              className={inputClass}
            >
              {VAT_RATES.map((item) => (
                <option key={item} value={item}>
                  {item} %
                </option>
              ))}
            </select>
          ) : (
            <>
              <input type="hidden" name="vatRate" value="0" />
              <input
                id="new-invoice-vat"
                value="0 % (structure sans TVA)"
                readOnly
                className={inputClass}
              />
            </>
          )}
        </Field>
      </div>
      <p aria-live="polite" className="-mt-2 text-[13px] text-muted">
        {split
          ? `${formatEuros(split.exclCents)} HTVA · ${formatEuros(split.vatCents)} de TVA`
          : "Le HTVA se calcule à partir du montant TVA comprise."}
      </p>
      <Field id="new-invoice-service" label="Date de la prestation" optional>
        <input
          id="new-invoice-service"
          name="serviceOn"
          type="date"
          defaultValue={v.serviceOn}
          className={inputClass}
        />
      </Field>

      {/* Payée ou à payer (décision d'Antonino du 29/10) : « Déjà payée » note le paiement reçu. */}
      <fieldset className="flex flex-col gap-3">
        <legend className={`${labelClass} mb-2`}>Paiement</legend>
        <div className={segmentedGroupClass}>
          {[
            { value: "yes", label: "Déjà payée" },
            { value: "no", label: "À payer" },
          ].map((option) => (
            <label
              key={option.value}
              className="flex-1 cursor-pointer rounded-sm has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent sm:flex-none"
            >
              <input
                type="radio"
                name="paid"
                value={option.value}
                defaultChecked={v.paid === (option.value === "yes")}
                onChange={() => setPaid(option.value === "yes")}
                className="peer sr-only"
              />
              <span className={segmentedItemClass}>{option.label}</span>
            </label>
          ))}
        </div>
        {paid ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="new-invoice-received" label="Reçu le">
              <input
                id="new-invoice-received"
                name="receivedOn"
                type="date"
                defaultValue={v.receivedOn}
                className={inputClass}
              />
            </Field>
            <Field id="new-invoice-method" label="Mode">
              <select
                id="new-invoice-method"
                name="method"
                defaultValue={v.method}
                className={inputClass}
              >
                <option value="transfer">Virement</option>
                <option value="bancontact">Bancontact</option>
              </select>
            </Field>
          </div>
        ) : (
          <Field id="new-invoice-due" label="Échéance">
            <input
              id="new-invoice-due"
              name="dueOn"
              type="date"
              defaultValue={v.dueOn}
              className={inputClass}
            />
          </Field>
        )}
      </fieldset>

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
        {pending ? "Création…" : "Créer le brouillon"}
      </button>
    </form>
  );
}
