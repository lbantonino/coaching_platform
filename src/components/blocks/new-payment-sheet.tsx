"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  createContext,
  useActionState,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import { useMoney } from "@/components/blocks/money-context";
import { buttonClass } from "@/components/ui/button";
import { errorTextClass, inputClass, labelClass } from "@/components/ui/form-styles";
import { FieldCheck } from "@/components/ui/field-check";
import { Sheet } from "@/components/ui/overlay";
import { segmentedGroupClass, segmentedItemClass } from "@/components/ui/segmented";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";
import { VatRateInput } from "@/components/ui/vat-rate-input";
import { formatVatRate, parseVatRate } from "@/domain/billing/money";
import { PAYMENT_METHODS, parseAmount, splitVat } from "@/domain/billing/payments";
import type { PaymentFormState, PaymentFormValues } from "@/features/billing/payment-actions";

// Fenêtre « Nouveau paiement » de l'espace coach (D-36), la même partout : « Créer → Paiement » et le
// bouton de la page Comptabilité. Le coach note l'argent reçu (TVA comprise), le taux de TVA (libre,
// pré-rempli avec son taux habituel, D-69) et le mode ; le HTVA s'affiche en direct. On reste sur la
// page ; un toast confirme.
type Athlete = { id: string; name: string };
type Action = (previous: PaymentFormState, formData: FormData) => Promise<PaymentFormState>;

const OpenContext = createContext<(() => void) | null>(null);

export function useOpenNewPayment() {
  return useContext(OpenContext);
}

const todayInBrussels = () =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Brussels" }).format(new Date());

export function NewPaymentSheet({
  action,
  loadAthletes,
  children,
}: {
  action: Action;
  loadAthletes: () => Promise<Athlete[]>;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [athletes, setAthletes] = useState<Athlete[] | null>(null);
  const openSheet = useCallback(() => {
    setAthletes(null);
    setOpen(true);
    loadAthletes().then(setAthletes, () => setAthletes([]));
  }, [loadAthletes]);

  return (
    <OpenContext.Provider value={openSheet}>
      {children}
      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title="Nouveau paiement"
        subtitle="L'argent reçu d'un sportif, TVA comprise."
      >
        {open && athletes === null ? (
          <p className="flex items-center gap-2 text-[14px] text-muted">
            <Spinner /> Chargement de tes sportifs…
          </p>
        ) : open && athletes ? (
          <PaymentForm action={action} athletes={athletes} onSaved={() => setOpen(false)} />
        ) : null}
      </Sheet>
    </OpenContext.Provider>
  );
}

const initial: PaymentFormState = { error: null, attempt: 0, values: null, saved: false };

function PaymentForm({
  action,
  athletes,
  onSaved,
}: {
  action: Action;
  athletes: Athlete[];
  onSaved: () => void;
}) {
  const [state, formAction, pending] = useActionState(action, initial);
  const router = useRouter();
  const toast = useToast();
  useEffect(() => {
    if (!state.saved) return;
    toast("Paiement enregistré.");
    onSaved();
    router.refresh();
  }, [state, toast, onSaved, router]);

  const { vatRate } = useMoney();
  return (
    <PaymentFields
      key={state.attempt}
      formAction={formAction}
      pending={pending}
      error={state.error}
      values={
        state.values ?? {
          athleteId: "",
          receivedOn: todayInBrussels(),
          amount: "",
          vatRate: String(vatRate).replace(".", ","),
          method: "transfer",
          label: "",
          package: false,
          coversFrom: "",
          coversTo: "",
        }
      }
      athletes={athletes}
    />
  );
}

function PaymentFields({
  formAction,
  pending,
  error,
  values: v,
  athletes,
}: {
  formAction: (formData: FormData) => void;
  pending: boolean;
  error: string | null;
  values: PaymentFormValues;
  athletes: Athlete[];
}) {
  const [amount, setAmount] = useState(v.amount);
  const [vatRate, setVatRate] = useState(v.vatRate);
  const [isPackage, setIsPackage] = useState(v.package);
  const { currency, format, methodLabel } = useMoney();
  const cents = parseAmount(amount);
  const rate = parseVatRate(vatRate);
  const split = cents === null || rate === null ? null : splitVat(cents, rate);

  return (
    <form action={formAction} className="flex flex-col gap-5" noValidate>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="payment-athlete" className={labelClass}>
          Sportif
        </label>
        <select
          id="payment-athlete"
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
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="payment-amount" className={labelClass}>
            Montant reçu (TVAC, {currency})
          </label>
          <input
            id="payment-amount"
            name="amount"
            inputMode="decimal"
            autoComplete="off"
            placeholder="Ex. : 3000"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            className={inputClass}
          />
          <FieldCheck htmlFor="payment-amount" rule="amount" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="payment-vat" className={labelClass}>
            Taux de TVA
          </label>
          <VatRateInput id="payment-vat" value={vatRate} onChange={setVatRate} />
        </div>
      </div>
      <p aria-live="polite" className="-mt-2 text-[13px] text-muted">
        {split
          ? `${format(split.exclCents)} HTVA · ${format(split.vatCents)} de TVA (${formatVatRate(rate ?? 0)})`
          : "Le HTVA se calcule à partir du montant reçu."}
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="payment-date" className={labelClass}>
            Reçu le
          </label>
          <input
            id="payment-date"
            name="receivedOn"
            type="date"
            defaultValue={v.receivedOn}
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="payment-label" className={labelClass}>
            Libellé <span className="font-normal text-muted">(facultatif)</span>
          </label>
          <input
            id="payment-label"
            name="label"
            maxLength={120}
            defaultValue={v.label}
            placeholder="Ex. : Forfait 3 mois"
            className={inputClass}
          />
        </div>
      </div>

      {/* Forfait (D-52, retour de Gianluca) : certains paient 3 mois d'avance, d'autres séance par
          séance. Le paiement compte en entier la semaine où il est reçu ; les séances du sportif dans
          la période sont « comprises dans le forfait ». */}
      <div className="flex flex-col gap-3">
        <label className="inline-flex w-fit cursor-pointer items-start gap-2.5 text-small">
          <input
            type="checkbox"
            name="package"
            checked={isPackage}
            onChange={(event) => setIsPackage(event.target.checked)}
            className="mt-0.5 size-4 shrink-0 accent-[var(--text)]"
          />
          <span>
            Forfait sur une période
            <span className="block text-muted">
              Ex. : 3 mois payés d&apos;avance. Les séances du sportif sur cette période seront
              notées « comprises dans le forfait ».
            </span>
          </span>
        </label>
        {isPackage ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="payment-covers-from" className={labelClass}>
                Du
              </label>
              <input
                id="payment-covers-from"
                name="coversFrom"
                type="date"
                defaultValue={v.coversFrom}
                className={inputClass}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="payment-covers-to" className={labelClass}>
                Au
              </label>
              <input
                id="payment-covers-to"
                name="coversTo"
                type="date"
                defaultValue={v.coversTo}
                className={inputClass}
              />
            </div>
          </div>
        ) : null}
      </div>

      <fieldset className="flex flex-col gap-1.5">
        <legend className={`${labelClass} mb-1.5`}>Mode de paiement</legend>
        <div className={`${segmentedGroupClass} flex-wrap`}>
          {PAYMENT_METHODS.map((method) => (
            <label
              key={method}
              className="flex-1 cursor-pointer rounded-sm has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent sm:flex-none"
            >
              <input
                type="radio"
                name="method"
                value={method}
                defaultChecked={v.method === method}
                className="peer sr-only"
              />
              <span className={segmentedItemClass}>{methodLabel(method)}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="flex flex-wrap items-center gap-4">
        <button type="submit" disabled={pending} className={buttonClass()}>
          {pending ? "Enregistrement…" : "Enregistrer le paiement"}
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

// Bouton rouge « Nouveau paiement » (page Comptabilité).
export function NewPaymentButton() {
  const open = useOpenNewPayment();
  return (
    <button type="button" disabled={!open} onClick={() => open?.()} className={buttonClass()}>
      <Plus aria-hidden size={16} strokeWidth={2} />
      Nouveau paiement
    </button>
  );
}
