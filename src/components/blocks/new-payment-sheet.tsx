"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  createContext,
  useActionState,
  useCallback,
  useContext,
  useEffect,
  useId,
  useState,
  type ReactNode,
} from "react";

import { useMoney } from "@/components/blocks/money-context";
import { buttonClass } from "@/components/ui/button";
import {
  DlgCheckCard,
  DlgDate,
  DlgField,
  DlgFieldset,
  DlgHint,
  DlgSegmented,
  DlgSelect,
  DlgSuffixInput,
} from "@/components/ui/dialog-fields";
import {
  dlgErrorClass,
  dlgFormGridClass,
  dlgInputClass,
  dlgPrimaryButtonClass,
} from "@/components/ui/dialog-styles";
import { FieldCheck } from "@/components/ui/field-check";
import { DialogBody, DialogFooter, Sheet } from "@/components/ui/overlay";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";
import { currencySymbol, formatVatRate, parseVatRate } from "@/domain/billing/money";
import { PAYMENT_METHODS, parseAmount, splitVat } from "@/domain/billing/payments";
import type { PaymentFormState, PaymentFormValues } from "@/features/billing/payment-actions";

// Fenêtre « Nouveau paiement » de l'espace coach (D-36), la même partout : « Créer → Paiement » et le
// bouton de la page Comptabilité. Le coach note l'argent reçu et le mode ; on reste sur la page, un
// toast confirme. TVA (D-163, demande d'Antonino du 11/11) : choisie à chaque paiement. « Appliquer la
// TVA » est décochée par défaut (le montant compte tel quel) ; cochée, le taux apparaît, pré-rempli
// avec le taux normal du pays et modifiable, et le HTVA s'affiche en direct.
type Athlete = { id: string; name: string };
type Action = (previous: PaymentFormState, formData: FormData) => Promise<PaymentFormState>;

// `prefill` : « Modifier » une carte de l'Assistant IA, le paiement proposé pré-rempli.
const OpenContext = createContext<((prefill?: Partial<PaymentFormValues>) => void) | null>(null);

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
  const [prefill, setPrefill] = useState<Partial<PaymentFormValues>>({});
  const openSheet = useCallback(
    (wanted?: Partial<PaymentFormValues>) => {
      setPrefill(wanted ?? {});
      setAthletes(null);
      setOpen(true);
      loadAthletes().then(setAthletes, () => setAthletes([]));
    },
    [loadAthletes],
  );

  return (
    <OpenContext.Provider value={openSheet}>
      {children}
      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title="Nouveau paiement"
        subtitle="L'argent reçu d'un sportif."
        bare
      >
        {open && athletes === null ? (
          <DialogBody>
            <p className="flex items-center gap-2 text-[14px] text-muted">
              <Spinner /> Chargement de tes sportifs…
            </p>
          </DialogBody>
        ) : open && athletes ? (
          <PaymentForm
            action={action}
            athletes={athletes}
            prefill={prefill}
            onSaved={() => setOpen(false)}
            onCancel={() => setOpen(false)}
          />
        ) : null}
      </Sheet>
    </OpenContext.Provider>
  );
}

const initial: PaymentFormState = { error: null, attempt: 0, values: null, saved: false };

function PaymentForm({
  action,
  athletes,
  prefill,
  onSaved,
  onCancel,
}: {
  action: Action;
  athletes: Athlete[];
  prefill: Partial<PaymentFormValues>;
  onSaved: () => void;
  onCancel: () => void;
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
          vatRate: "0",
          method: "transfer",
          label: "",
          package: false,
          coversFrom: "",
          coversTo: "",
          ...prefill,
        }
      }
      athletes={athletes}
      onCancel={onCancel}
    />
  );
}

function PaymentFields({
  formAction,
  pending,
  error,
  values: v,
  athletes,
  onCancel,
}: {
  formAction: (formData: FormData) => void;
  pending: boolean;
  error: string | null;
  values: PaymentFormValues;
  athletes: Athlete[];
  onCancel: () => void;
}) {
  const formId = useId();
  const { currency, format, methodLabel, suggestedVatRate } = useMoney();
  // TVA (D-163) : décochée = taux 0, le montant reçu compte tel quel. Après une erreur, la saisie
  // revient (taux 0 = décochée) ; cocher propose le taux normal du pays.
  const initialRate = parseVatRate(v.vatRate);
  const [applyVat, setApplyVat] = useState(initialRate !== 0);
  const withVat = applyVat;
  const [amount, setAmount] = useState(v.amount);
  const [vatRate, setVatRate] = useState(initialRate === 0 ? suggestedVatRate : v.vatRate);
  const [isPackage, setIsPackage] = useState(v.package);
  const cents = parseAmount(amount);
  const rate = parseVatRate(vatRate);
  const split = !withVat || cents === null || rate === null ? null : splitVat(cents, rate);

  // Kit (boîte 04) : grille de 12 colonnes, montant et TVA à suffixe, forfait en carte à cocher,
  // boutons dans le pied fixe (reliés au formulaire par son id).
  return (
    <>
      <DialogBody>
        <form id={formId} action={formAction} className={dlgFormGridClass} noValidate>
          <DlgField label="Sportif" htmlFor="payment-athlete">
            <DlgSelect id="payment-athlete" name="athleteId" defaultValue={v.athleteId}>
              <option value="">Choisir…</option>
              {athletes.map((athlete) => (
                <option key={athlete.id} value={athlete.id}>
                  {athlete.name}
                </option>
              ))}
            </DlgSelect>
          </DlgField>

          <DlgField
            // Le suffixe « € TVAC » est dessiné dans le champ ; le libellé lu le dit aussi.
            label={
              <>
                Montant reçu
                <span className="sr-only">
                  {" "}
                  ({withVat ? "TVAC, " : ""}
                  {currency})
                </span>
              </>
            }
            htmlFor="payment-amount"
            half={withVat}
          >
            <DlgSuffixInput
              id="payment-amount"
              name="amount"
              inputMode="decimal"
              autoComplete="off"
              placeholder="Ex. : 3 000"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              suffix={withVat ? `${currencySymbol(currency)} TVAC` : currencySymbol(currency)}
            />
            <FieldCheck htmlFor="payment-amount" rule="amount" />
          </DlgField>
          {withVat ? (
            <DlgField label="Taux de TVA" htmlFor="payment-vat" half>
              <DlgSuffixInput
                id="payment-vat"
                name="vatRate"
                inputMode="decimal"
                autoComplete="off"
                placeholder="21"
                value={vatRate}
                onChange={(event) => setVatRate(event.target.value)}
                suffix="%"
              />
            </DlgField>
          ) : (
            <input type="hidden" name="vatRate" value="0" />
          )}
          <DlgHint live>
            {split
              ? `${format(split.exclCents)} HTVA · ${format(split.vatCents)} de TVA (${formatVatRate(rate ?? 0)})`
              : withVat
                ? "Le montant HTVA se calcule à partir du montant reçu."
                : "Le montant que tu as reçu, sans TVA."}
          </DlgHint>
          <DlgCheckCard
            checked={applyVat}
            onChange={(event) => setApplyVat(event.target.checked)}
            label="Appliquer la TVA"
            description="Coche si ce montant comprend de la TVA."
          />

          <DlgField label="Reçu le" htmlFor="payment-date" half>
            <DlgDate id="payment-date" name="receivedOn" defaultValue={v.receivedOn} />
          </DlgField>
          <DlgField label="Libellé" htmlFor="payment-label" optional half>
            <input
              id="payment-label"
              name="label"
              maxLength={120}
              defaultValue={v.label}
              placeholder="Ex. : Forfait 3 mois"
              className={dlgInputClass}
            />
          </DlgField>

          {/* Forfait (D-52, retour de Gianluca) : certains paient 3 mois d'avance, d'autres séance
              par séance. Le paiement compte en entier la semaine où il est reçu ; les séances du
              sportif dans la période sont « comprises dans le forfait ». */}
          <DlgCheckCard
            name="package"
            checked={isPackage}
            onChange={(event) => setIsPackage(event.target.checked)}
            label="Forfait sur une période"
            description="Ex. : 3 mois payés d'avance. Les séances de cette période seront notées « comprises dans le forfait »."
          />
          {isPackage ? (
            <>
              <DlgField label="Du" htmlFor="payment-covers-from" half>
                <DlgDate id="payment-covers-from" name="coversFrom" defaultValue={v.coversFrom} />
              </DlgField>
              <DlgField label="Au" htmlFor="payment-covers-to" half>
                <DlgDate id="payment-covers-to" name="coversTo" defaultValue={v.coversTo} />
              </DlgField>
            </>
          ) : null}

          <DlgFieldset legend="Mode de paiement">
            <DlgSegmented
              name="method"
              defaultValue={v.method}
              options={PAYMENT_METHODS.map((method) => ({
                value: method,
                label: methodLabel(method),
              }))}
            />
          </DlgFieldset>

          {error ? (
            <p role="alert" className={dlgErrorClass}>
              {error}
            </p>
          ) : null}
        </form>
      </DialogBody>
      <DialogFooter
        onCancel={onCancel}
        primary={
          <button type="submit" form={formId} disabled={pending} className={dlgPrimaryButtonClass}>
            {pending ? "Enregistrement…" : "Enregistrer le paiement"}
          </button>
        }
      />
    </>
  );
}

// Bouton rouge « Nouveau paiement » (page Comptabilité).
export function NewPaymentButton({ className }: { className?: string } = {}) {
  const open = useOpenNewPayment();
  return (
    <button
      type="button"
      disabled={!open}
      onClick={() => open?.()}
      className={buttonClass({ className })}
    >
      <Plus aria-hidden size={16} strokeWidth={2} />
      Nouveau paiement
    </button>
  );
}
