"use client";

import { ArrowRightLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

import { buttonClass } from "@/components/ui/button";
import { errorTextClass, hintClass, inputClass, labelClass } from "@/components/ui/form-styles";
import { Sheet } from "@/components/ui/overlay";
import { useToast } from "@/components/ui/toast";
import {
  CURRENCIES,
  currencyLabel,
  formatMoney,
  parseExchangeRate,
  type Currency,
} from "@/domain/billing/money";
import {
  changeOrganizationCurrency,
  previewCurrencyChange,
  type CurrencyChangePreview,
} from "@/features/coach/settings-actions";

// « Changer de devise » (D-70, choix d'Antonino : « passé gardé, futur converti ») : le coach qui
// déménage choisit sa nouvelle devise et saisit le taux (1 EUR = 0,94 CHF). Avant de confirmer, il
// voit ce qui sera converti (prix à venir, prix par défaut) et ce qui reste dans l'ancienne devise
// (paiements reçus : de l'argent réel).
const plural = (count: number, one: string, many: string) => `${count} ${count > 1 ? many : one}`;

export function CurrencyChangeButton({
  organizationId,
  currency,
  onChanged,
}: {
  organizationId: string;
  currency: Currency;
  onChanged?: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={buttonClass({ variant: "outline", size: "md" })}
      >
        <ArrowRightLeft aria-hidden size={15} strokeWidth={1.8} />
        Changer de devise
      </button>
      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title="Changer de devise"
        subtitle="Pour un déménagement : le passé reste dans sa devise, le futur est converti."
      >
        {open ? (
          <CurrencyChangeForm
            organizationId={organizationId}
            currency={currency}
            onDone={() => {
              setOpen(false);
              onChanged?.();
            }}
          />
        ) : null}
      </Sheet>
    </>
  );
}

function CurrencyChangeForm({
  organizationId,
  currency,
  onDone,
}: {
  organizationId: string;
  currency: Currency;
  onDone: () => void;
}) {
  const choices = CURRENCIES.filter((code) => code !== currency);
  const [target, setTarget] = useState<Currency>(choices[0]);
  const [rate, setRate] = useState("");
  const [preview, setPreview] = useState<CurrencyChangePreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const toast = useToast();
  const router = useRouter();

  useEffect(() => {
    let active = true;
    previewCurrencyChange(organizationId).then((result) => {
      if (active) setPreview(result);
    });
    return () => {
      active = false;
    };
  }, [organizationId]);

  const parsed = parseExchangeRate(rate);
  const example = parsed === null ? null : Math.round(10_000 * parsed);

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        startTransition(async () => {
          const result = await changeOrganizationCurrency(organizationId, target, rate);
          setError(result.error);
          if (!result.ok) return;
          toast(`Devise changée : ${currencyLabel(target)}.`);
          router.refresh();
          onDone();
        });
      }}
      className="flex flex-col gap-5"
      noValidate
    >
      <div className="flex flex-col gap-1.5">
        <label htmlFor="currency-target" className={labelClass}>
          Nouvelle devise
        </label>
        <select
          id="currency-target"
          value={target}
          onChange={(event) => setTarget(event.target.value as Currency)}
          className={inputClass}
        >
          {choices.map((code) => (
            <option key={code} value={code}>
              {currencyLabel(code)}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="currency-rate" className={labelClass}>
          Taux : 1 {currency} = … {target}
        </label>
        <input
          id="currency-rate"
          inputMode="decimal"
          autoComplete="off"
          placeholder="Ex. : 0,94"
          value={rate}
          onChange={(event) => setRate(event.target.value)}
          aria-describedby="currency-rate-hint"
          className={`${inputClass} font-mono`}
        />
        <p id="currency-rate-hint" className={hintClass}>
          {example === null
            ? "Le taux du jour, celui de ta banque par exemple."
            : `${formatMoney(10_000, currency)} deviendront ${formatMoney(example, target)}.`}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <section
          aria-label="Sera converti"
          className="flex flex-col gap-1.5 rounded-card border border-line p-4 text-[14px]"
        >
          <h3 className="font-semibold">Sera converti en {target}</h3>
          {preview ? (
            <ul className="flex flex-col gap-1 text-muted">
              <li>
                {plural(preview.sessions, "séance à venir avec prix", "séances à venir avec prix")}
              </li>
              <li>Ton prix par défaut des séances</li>
            </ul>
          ) : (
            <p className="text-muted">Calcul…</p>
          )}
        </section>
        <section
          aria-label="Reste en"
          className="flex flex-col gap-1.5 rounded-card border border-line p-4 text-[14px]"
        >
          <h3 className="font-semibold">Reste en {currency}</h3>
          {preview ? (
            <ul className="flex flex-col gap-1 text-muted">
              <li>{plural(preview.payments, "paiement reçu", "paiements reçus")}</li>
            </ul>
          ) : (
            <p className="text-muted">Calcul…</p>
          )}
        </section>
      </div>

      <p className="text-[13px] text-muted">
        Les totaux qui mélangent les deux devises s&apos;affichent « ≈ », convertis avec ce taux.
      </p>

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={pending || parsed === null}
          className={buttonClass({ variant: "primary", size: "md" })}
        >
          {pending ? "Changement…" : `Passer en ${target}`}
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
