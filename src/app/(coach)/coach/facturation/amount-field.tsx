"use client";

import { hintClass, inputClass, labelClass } from "@/components/ui/form-styles";
import { segmentedGroupClass, segmentedItemClass } from "@/components/ui/segmented";
import { useMoney } from "@/components/blocks/money-context";
import { totalsFromEntry, type AmountMode } from "@/domain/billing/invoice-document";
import { formatVatRate, parseAmount } from "@/domain/billing/money";

// Montant d'une facture (demande d'Antonino du 29/10/2026) : le coach choisit s'il saisit le
// montant HORS TVA (par défaut : « 65 € HTVA », la TVA s'ajoute) ou TVA COMPRISE, et voit le calcul
// en direct (« 65,00 € HTVA + 13,65 € de TVA (21 %) = 78,65 € TVAC »). Le serveur refait le calcul.
// Devise de l'organisation et taux libre (D-69).
export function AmountField({
  id,
  amount,
  onAmount,
  mode,
  onMode,
  vatRate,
  note,
}: {
  id: string;
  amount: string;
  onAmount: (value: string) => void;
  mode: AmountMode;
  onMode: (mode: AmountMode) => void;
  // Taux effectif (0 pour une structure sans TVA).
  vatRate: number;
  note?: string;
}) {
  const { currency, format } = useMoney();
  const cents = parseAmount(amount);
  const totals = cents === null ? null : totalsFromEntry(cents, mode, vatRate);
  return (
    <div className="flex flex-col gap-3 sm:col-span-2">
      <fieldset className="flex flex-col gap-1.5">
        <legend className={`${labelClass} mb-1.5`}>Le montant saisi est</legend>
        <div className={segmentedGroupClass}>
          {(
            [
              { value: "excl", label: "Hors TVA" },
              { value: "incl", label: "TVA comprise" },
            ] as const
          ).map((option) => (
            <label
              key={option.value}
              className="flex-1 cursor-pointer rounded-sm has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent sm:flex-none"
            >
              <input
                type="radio"
                name="amountMode"
                value={option.value}
                defaultChecked={mode === option.value}
                onChange={() => onMode(option.value)}
                className="peer sr-only"
              />
              <span className={segmentedItemClass}>{option.label}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <div className="flex flex-col gap-1.5">
        <label htmlFor={id} className={labelClass}>
          {mode === "excl" ? `Montant (HTVA, ${currency})` : `Montant (TVAC, ${currency})`}
        </label>
        <input
          id={id}
          name="amount"
          inputMode="decimal"
          autoComplete="off"
          placeholder={mode === "excl" ? "Ex. : 65" : "Ex. : 78,65"}
          value={amount}
          onChange={(event) => onAmount(event.target.value)}
          aria-describedby={`${id}-calcul`}
          className={inputClass}
        />
        <p id={`${id}-calcul`} aria-live="polite" className={hintClass}>
          {totals ? (
            <>
              {format(totals.exclCents)} HTVA + {format(totals.vatCents)} de TVA (
              {formatVatRate(vatRate)}) ={" "}
              <strong className="font-semibold text-text">{format(totals.inclCents)} TVAC</strong>
            </>
          ) : (
            "Écris le montant, la TVA se calcule toute seule."
          )}
          {note ? ` ${note}` : ""}
        </p>
      </div>
    </div>
  );
}
