"use client";

import { ArrowRightLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useId, useState, useTransition } from "react";

import { buttonClass } from "@/components/ui/button";
import { DlgField, DlgHint, DlgSelect } from "@/components/ui/dialog-fields";
import {
  dlgErrorClass,
  dlgFormGridClass,
  dlgInputClass,
  dlgPrimaryButtonClass,
} from "@/components/ui/dialog-styles";
import { DialogBody, DialogFooter, Sheet } from "@/components/ui/overlay";
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
        bare
      >
        {open ? (
          <CurrencyChangeForm
            onCancel={() => setOpen(false)}
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
  onCancel,
}: {
  organizationId: string;
  currency: Currency;
  onDone: () => void;
  onCancel: () => void;
}) {
  const formId = useId();
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

  // Kit (boîte 34) : devise et taux côte à côte, deux cartes (ce qui sera converti, en violet pâle ;
  // ce qui reste, en gris), aides, bouton « Passer en … » grisé tant que le taux est vide.
  return (
    <>
      <DialogBody>
        <form
          id={formId}
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
          className={dlgFormGridClass}
          noValidate
        >
          <DlgField label="Nouvelle devise" htmlFor="currency-target" half>
            <DlgSelect
              id="currency-target"
              value={target}
              onChange={(event) => setTarget(event.target.value as Currency)}
            >
              {choices.map((code) => (
                <option key={code} value={code}>
                  {currencyLabel(code)}
                </option>
              ))}
            </DlgSelect>
          </DlgField>
          <DlgField label={`Taux : 1 ${currency} = … ${target}`} htmlFor="currency-rate" half>
            <input
              id="currency-rate"
              inputMode="decimal"
              autoComplete="off"
              placeholder="Ex. : 0,94"
              value={rate}
              onChange={(event) => setRate(event.target.value)}
              aria-describedby="currency-rate-hint"
              className={dlgInputClass}
            />
          </DlgField>
          <DlgHint id="currency-rate-hint" live>
            {example === null
              ? "Le taux du jour, celui de ta banque par exemple."
              : `${formatMoney(10_000, currency)} deviendront ${formatMoney(example, target)}.`}
          </DlgHint>

          <div className="col-span-2 grid gap-2.5 md:col-span-12 md:grid-cols-2">
            <section
              aria-label="Sera converti"
              className="flex flex-col gap-2 rounded-[16px] bg-dlg-accent-soft p-4"
            >
              <h3 className="text-[14px] leading-[normal] font-bold text-dlg-accent-ink">
                Sera converti en {target}
              </h3>
              <p className="text-[14px] leading-[1.5] text-dlg-ink-2">
                {preview ? (
                  <>
                    {plural(
                      preview.sessions,
                      "séance à venir avec prix",
                      "séances à venir avec prix",
                    )}
                    <br />
                    Ton prix par défaut des séances
                  </>
                ) : (
                  "Calcul…"
                )}
              </p>
            </section>
            <section
              aria-label="Reste en"
              className="flex flex-col gap-2 rounded-[16px] bg-dlg-field p-4"
            >
              <h3 className="text-[14px] leading-[normal] font-bold text-text">
                Reste en {currency}
              </h3>
              <p className="text-[14px] leading-[1.5] text-dlg-ink-2">
                {preview ? plural(preview.payments, "paiement reçu", "paiements reçus") : "Calcul…"}
              </p>
            </section>
          </div>

          <DlgHint>
            Les totaux qui mélangent les deux devises s&apos;affichent « ≈ », convertis avec ce
            taux.
          </DlgHint>

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
          <button
            type="submit"
            form={formId}
            disabled={pending || parsed === null}
            className={dlgPrimaryButtonClass}
          >
            {pending ? "Changement…" : `Passer en ${target}`}
          </button>
        }
      />
    </>
  );
}
