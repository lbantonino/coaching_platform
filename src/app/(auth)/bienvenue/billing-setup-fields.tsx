"use client";

import { useState } from "react";

import { Field } from "@/components/ui/field";
import { entryInputClass } from "@/components/ui/form-styles";
import { CURRENCIES, currencyLabel, isCurrency, type Currency } from "@/domain/billing/money";
import { COUNTRY_NAMES } from "@/domain/geo/country-names";
import { defaultCurrencyFor } from "@/domain/geo/countries";
import type { BillingSetupInput, VatChoice } from "@/features/auth/signup-schemas";

// Étape « Pays, devise et TVA » de l'inscription d'un coach (D-69, simplifiée par D-90) : pays et devise
// (pré-remplis d'après la langue du navigateur), puis une seule question sur la TVA. Coory ne fait
// pas de factures : le taux sert au prix des séances et au résultat HTVA. Tout se modifie ensuite
// dans Paramètres › Pays, devise et TVA.
const choices: { value: VatChoice; title: string; text: string }[] = [
  {
    value: "none",
    title: "Pas de TVA",
    text: "Franchise, association, ou tu verras plus tard.",
  },
  { value: "vat", title: "Je facture la TVA", text: "Tes gains s'affichent hors TVA." },
];

export function BillingSetupFields({ initial }: { initial: BillingSetupInput }) {
  const [country, setCountry] = useState(initial.country);
  const [currency, setCurrency] = useState<Currency>(
    isCurrency(initial.currency) ? initial.currency : defaultCurrencyFor(initial.country),
  );
  const [choice, setChoice] = useState(initial.vatChoice === "vat" ? "vat" : "none");

  return (
    <section aria-labelledby="billing-setup-title" className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 id="billing-setup-title" className="font-display text-[18px] font-semibold">
          Pays, devise et TVA
        </h2>
        <p className="text-[14px] leading-[1.5] text-muted">
          Tes montants s&apos;affichent dans ta devise. Tout se modifie ensuite dans Paramètres.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="country" label="Pays">
          <select
            id="country"
            name="country"
            value={country}
            onChange={(event) => {
              setCountry(event.target.value);
              setCurrency(defaultCurrencyFor(event.target.value));
            }}
            className={entryInputClass}
          >
            {COUNTRY_NAMES.map(([code, name]) => (
              <option key={code} value={code}>
                {name}
              </option>
            ))}
          </select>
        </Field>
        <Field id="currency" label="Devise">
          <select
            id="currency"
            name="currency"
            value={currency}
            onChange={(event) => {
              if (isCurrency(event.target.value)) setCurrency(event.target.value);
            }}
            className={entryInputClass}
          >
            {CURRENCIES.map((code) => (
              <option key={code} value={code}>
                {currencyLabel(code)}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-[14px] font-medium">TVA</legend>
        {choices.map((item) => (
          <label
            key={item.value}
            className="group/vat flex min-h-[56px] cursor-pointer items-center gap-3 rounded-[14px] border-[1.5px] border-line-2 bg-surface px-3.5 py-2.5 transition-colors duration-150 has-checked:border-accent has-checked:bg-accent-soft has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent"
          >
            <input
              type="radio"
              name="vatChoice"
              value={item.value}
              checked={choice === item.value}
              onChange={() => setChoice(item.value)}
              aria-describedby={`vat-${item.value}-text`}
              className="sr-only"
            />
            <span
              aria-hidden
              className="inline-flex size-[22px] shrink-0 items-center justify-center rounded-full border-2 border-line-2 group-has-checked/vat:border-accent"
            >
              <span className="size-2.5 rounded-full group-has-checked/vat:bg-accent" />
            </span>
            <span className="flex min-w-0 flex-col">
              <span className="text-[15px] font-medium">{item.title}</span>
              <span id={`vat-${item.value}-text`} className="text-[13px] text-muted">
                {item.text}
              </span>
            </span>
          </label>
        ))}
      </fieldset>

      {choice === "vat" ? (
        <div className="sm:max-w-[220px]">
          <Field id="vatRate" label="Taux de TVA" hint="Celui de tes séances.">
            <div className="relative">
              <input
                id="vatRate"
                name="vatRate"
                inputMode="decimal"
                autoComplete="off"
                placeholder={country === "BE" ? "21" : "Ex. : 20"}
                defaultValue={initial.vatRate}
                className={`${entryInputClass} pr-10 font-mono`}
              />
              <span
                aria-hidden
                className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-muted"
              >
                %
              </span>
            </div>
          </Field>
        </div>
      ) : null}
    </section>
  );
}
