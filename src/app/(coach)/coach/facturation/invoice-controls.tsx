"use client";

import { FileCheck2, FilePlus2, Trash2 } from "lucide-react";
import { startTransition, useActionState, useState } from "react";

import { buttonClass } from "@/components/ui/button";
import { errorTextClass, hintClass, inputClass, labelClass } from "@/components/ui/form-styles";
import { ConfirmDialog } from "@/components/ui/overlay";
import { formatEuros } from "@/domain/billing/invoices";
import {
  PAYMENT_METHODS,
  VAT_RATES,
  parseEuros,
  paymentMethodLabels,
  splitVat,
} from "@/domain/billing/payments";
import { COUNTRIES } from "@/features/athletes/schemas";
import {
  createInvoiceFromPayment,
  deleteInvoiceDraft,
  issueInvoice,
  markInvoicePaid,
  updateInvoiceDraft,
  type InvoiceActionState,
} from "@/features/billing/invoice-actions";

// Commandes de la facturation (D-65) : créer le brouillon d'un virement, modifier le brouillon,
// l'émettre (avec confirmation : c'est définitif), le supprimer. Les actions revérifient tout.
const initial: InvoiceActionState = { error: null, saved: false, attempt: 0 };

function ErrorText({ error }: { error: string | null }) {
  return error ? (
    <p role="alert" className={errorTextClass}>
      {error}
    </p>
  ) : null;
}

export function CreateInvoiceButton({
  organizationId,
  paymentId,
  label,
}: {
  organizationId: string;
  paymentId: string;
  // Nom accessible : « Créer la facture : Thomas Peeters, 20 octobre ».
  label: string;
}) {
  const [state, action, pending] = useActionState(
    createInvoiceFromPayment.bind(null, organizationId, paymentId),
    initial,
  );
  return (
    <form action={action} className="flex flex-col items-end gap-1">
      <button
        type="submit"
        disabled={pending}
        aria-label={label}
        className={buttonClass({ variant: "outline", size: "sm" })}
      >
        <FilePlus2 aria-hidden size={15} strokeWidth={1.8} />
        {pending ? "Création…" : "Créer la facture"}
      </button>
      <ErrorText error={state.error} />
    </form>
  );
}

export function IssueInvoiceButton({
  organizationId,
  invoiceId,
}: {
  organizationId: string;
  invoiceId: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(
    issueInvoice.bind(null, organizationId, invoiceId),
    initial,
  );
  return (
    <div className="flex flex-col gap-1 max-lg:w-full">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={buttonClass({ variant: "primary", size: "md", className: "max-lg:w-full" })}
      >
        <FileCheck2 aria-hidden size={17} strokeWidth={1.8} />
        Émettre la facture
      </button>
      <ErrorText error={state.error} />
      <EmitDialog
        open={open && !state.saved}
        onClose={() => setOpen(false)}
        action={() => startTransition(() => action())}
        pending={pending}
      />
    </div>
  );
}

// Émettre est définitif : on le dit avant, dans la même fenêtre de confirmation que les suppressions.
function EmitDialog({
  open,
  onClose,
  action,
  pending,
}: {
  open: boolean;
  onClose: () => void;
  action: () => void;
  pending: boolean;
}) {
  return (
    <ConfirmDialog
      open={open}
      onClose={onClose}
      onConfirm={action}
      pending={pending}
      title="Émettre cette facture ?"
      confirmLabel={pending ? "Émission…" : "Émettre"}
    >
      Elle reçoit son numéro et la date du jour, puis ne pourra plus être modifiée ni supprimée. Une
      erreur se corrigera par une note de crédit.
    </ConfirmDialog>
  );
}

export function DeleteDraftButton({
  organizationId,
  invoiceId,
}: {
  organizationId: string;
  invoiceId: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(
    deleteInvoiceDraft.bind(null, organizationId, invoiceId),
    initial,
  );
  return (
    <div className="flex flex-col gap-1 max-lg:w-full">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={buttonClass({ variant: "outline", size: "md", className: "max-lg:w-full" })}
      >
        <Trash2 aria-hidden size={16} strokeWidth={1.8} />
        Supprimer le brouillon
      </button>
      <ErrorText error={state.error} />
      <ConfirmDialog
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={() => startTransition(() => action())}
        pending={pending}
        title="Supprimer ce brouillon ?"
        confirmLabel={pending ? "Suppression…" : "Supprimer"}
      >
        Le paiement redeviendra « à facturer ».
      </ConfirmDialog>
    </div>
  );
}

export type DraftValues = {
  legalEntityId: string;
  label: string;
  amount: string;
  serviceOn: string;
  vatRate: string;
  clientName: string;
  addressLine: string;
  postalCode: string;
  city: string;
  country: string;
};

export function InvoiceDraftForm({
  organizationId,
  invoiceId,
  values,
  entities,
  hasPayment,
}: {
  organizationId: string;
  invoiceId: string;
  values: DraftValues;
  entities: { id: string; name: string; vatSubject: boolean }[];
  // Brouillon relié à un paiement reçu : son montant suit celui de la facture.
  hasPayment: boolean;
}) {
  const [state, action, pending] = useActionState(
    updateInvoiceDraft.bind(null, organizationId, invoiceId),
    initial,
  );
  const [entityId, setEntityId] = useState(values.legalEntityId);
  const [amount, setAmount] = useState(values.amount);
  const [vatRate, setVatRate] = useState(values.vatRate);
  const vatSubject = entities.find((entity) => entity.id === entityId)?.vatSubject ?? true;
  const cents = parseEuros(amount);
  const split = cents === null ? null : splitVat(cents, vatSubject ? Number(vatRate) : 0);
  return (
    <form action={action} className="flex flex-col gap-5" noValidate>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="invoice-entity" className={labelClass}>
            Structure qui facture
          </label>
          <select
            id="invoice-entity"
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
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="invoice-vat" className={labelClass}>
            Taux de TVA
          </label>
          {vatSubject ? (
            <select
              id="invoice-vat"
              name="vatRate"
              value={vatRate}
              onChange={(event) => setVatRate(event.target.value)}
              className={inputClass}
            >
              {VAT_RATES.map((rate) => (
                <option key={rate} value={rate}>
                  {rate} %
                </option>
              ))}
            </select>
          ) : (
            <>
              <input type="hidden" name="vatRate" value="0" />
              <input
                id="invoice-vat"
                value="0 % (structure sans TVA)"
                readOnly
                className={inputClass}
              />
            </>
          )}
        </div>
        <div className="flex flex-col gap-1.5 md:col-span-2">
          <label htmlFor="invoice-label" className={labelClass}>
            Description de la prestation
          </label>
          <input
            id="invoice-label"
            name="label"
            defaultValue={values.label}
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="invoice-amount" className={labelClass}>
            Montant (TVAC)
          </label>
          <input
            id="invoice-amount"
            name="amount"
            inputMode="decimal"
            autoComplete="off"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            aria-describedby="invoice-amount-hint"
            className={inputClass}
          />
          <p id="invoice-amount-hint" aria-live="polite" className={hintClass}>
            {split
              ? `${formatEuros(split.exclCents)} HTVA · ${formatEuros(split.vatCents)} de TVA`
              : "Montant TVA comprise, ex. : 78,65."}
            {hasPayment ? " Le paiement relié est corrigé aussi." : ""}
          </p>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="invoice-service" className={labelClass}>
            Date de la prestation <span className="font-normal text-muted">(facultatif)</span>
          </label>
          <input
            id="invoice-service"
            name="serviceOn"
            type="date"
            defaultValue={values.serviceOn}
            className={inputClass}
          />
        </div>
      </div>

      <fieldset className="flex flex-col gap-4">
        <legend className="mb-4 font-mono text-data tracking-wide text-muted uppercase">
          Client
        </legend>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-1.5 md:col-span-2">
            <label htmlFor="invoice-client" className={labelClass}>
              Nom
            </label>
            <input
              id="invoice-client"
              name="clientName"
              defaultValue={values.clientName}
              className={inputClass}
            />
          </div>
          <div className="flex flex-col gap-1.5 md:col-span-2">
            <label htmlFor="invoice-address" className={labelClass}>
              Rue et numéro
            </label>
            <input
              id="invoice-address"
              name="addressLine"
              defaultValue={values.addressLine}
              aria-describedby="invoice-address-hint"
              className={inputClass}
            />
            <p
              id="invoice-address-hint"
              className={values.addressLine ? hintClass : errorTextClass}
            >
              {values.addressLine
                ? "Reprise de la fiche du sportif ; une correction ici ne change que cette facture."
                : "Adresse manquante : une facture porte le nom ET l'adresse du client. Ajoute-la ici, ou sur la fiche du sportif (onglet Profil)."}
            </p>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="invoice-postal" className={labelClass}>
              Code postal
            </label>
            <input
              id="invoice-postal"
              name="postalCode"
              defaultValue={values.postalCode}
              className={inputClass}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="invoice-city" className={labelClass}>
              Ville
            </label>
            <input
              id="invoice-city"
              name="city"
              defaultValue={values.city}
              className={inputClass}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="invoice-country" className={labelClass}>
              Pays
            </label>
            <select
              id="invoice-country"
              name="country"
              defaultValue={values.country}
              className={inputClass}
            >
              {COUNTRIES.map(([code, label]) => (
                <option key={code} value={code}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </fieldset>

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={pending}
          className={buttonClass({ variant: "outline", size: "md" })}
        >
          {pending ? "Enregistrement…" : "Enregistrer le brouillon"}
        </button>
        <ErrorText error={state.error} />
        {state.saved && !state.error ? (
          <p role="status" className="text-small text-ok">
            Brouillon enregistré.
          </p>
        ) : null}
      </div>
    </form>
  );
}

// Facture « à payer » : le coach note le paiement reçu (date, mode). Le paiement est créé dans la
// Comptabilité et relié à la facture, même déjà émise (D-65).
export function MarkPaidForm({
  organizationId,
  invoiceId,
  today,
}: {
  organizationId: string;
  invoiceId: string;
  today: string;
}) {
  const [state, action, pending] = useActionState(
    markInvoicePaid.bind(null, organizationId, invoiceId),
    initial,
  );
  return (
    <form key={state.attempt} action={action} className="flex flex-col gap-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="paid-on" className={labelClass}>
            Reçu le
          </label>
          <input
            id="paid-on"
            name="receivedOn"
            type="date"
            defaultValue={today}
            max={today}
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="paid-method" className={labelClass}>
            Mode
          </label>
          <select id="paid-method" name="method" defaultValue="transfer" className={inputClass}>
            {PAYMENT_METHODS.map((method) => (
              <option key={method} value={method}>
                {paymentMethodLabels[method]}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={pending}
          className={buttonClass({ variant: "outline", size: "md" })}
        >
          {pending ? "Enregistrement…" : "Marquer comme payée"}
        </button>
        <ErrorText error={state.error} />
      </div>
    </form>
  );
}
