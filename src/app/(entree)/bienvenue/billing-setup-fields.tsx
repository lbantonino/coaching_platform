"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";

import { CURRENCIES, currencyLabel, isCurrency, type Currency } from "@/domain/billing/money";
import { COUNTRY_NAMES } from "@/domain/geo/country-names";
import { defaultCurrencyFor } from "@/domain/geo/countries";
import type { BillingSetupInput } from "@/features/auth/signup-schemas";
import { useWideScreen } from "@/lib/use-wide-screen";

// Étape « Pays et devise » de l'inscription d'un coach (D-69), au style de la maquette d'Antonino du
// 06/11/2026 (écran 03, D-139) : pays et devise, pré-remplis d'après la langue du navigateur. La
// question sur la TVA est retirée (D-163, demande d'Antonino du 11/11) : la TVA se choisit à chaque
// paiement, dépense ou séance. Tout se modifie ensuite dans Paramètres › Pays et devise.
// L'état vit dans useBillingSetup : la page de bienvenue le partage avec son panneau.

export type BillingSetupState = {
  country: string;
  currency: Currency;
  setCountry: (country: string) => void;
  setCurrency: (currency: Currency) => void;
};

export function useBillingSetup(initial: BillingSetupInput): BillingSetupState {
  const [country, setCountryState] = useState(initial.country);
  const [currency, setCurrency] = useState<Currency>(
    isCurrency(initial.currency) ? initial.currency : defaultCurrencyFor(initial.country),
  );
  return {
    country,
    currency,
    setCountry: (next) => {
      setCountryState(next);
      setCurrency(defaultCurrencyFor(next));
    },
    setCurrency,
  };
}

const selectClass =
  "h-[50px] w-full min-w-0 cursor-pointer appearance-none rounded-[13px] bg-dlg-field pr-[34px] pl-3.5 text-[16px] font-semibold text-text inset-ring inset-ring-line outline-none transition-shadow duration-150 focus:inset-ring-[1.5px] focus:inset-ring-violet lg:h-12 lg:rounded-[12px] lg:pr-[38px] lg:text-[14.5px]";

function Select({
  id,
  label,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { id: string; label: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5 lg:gap-[7px]">
      <label htmlFor={id} className="text-[13px] leading-[normal] font-semibold text-text">
        {label}
      </label>
      <div className="relative">
        <select id={id} {...props} data-chevron="own" className={selectClass}>
          {children}
        </select>
        <ChevronDown
          aria-hidden
          size={15}
          strokeWidth={2}
          className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-muted lg:right-3.5"
        />
      </div>
    </div>
  );
}

export function BillingSetupFields({
  initial,
  setup,
}: {
  initial: BillingSetupInput;
  // Fourni par la page quand son panneau doit suivre les choix ; sinon l'état reste ici.
  setup?: BillingSetupState;
}) {
  const own = useBillingSetup(initial);
  // Téléphone : la devise en code seul (« EUR »), comme la maquette ; ordinateur : « Euro (EUR) ».
  const wide = useWideScreen();
  const { country, currency, setCountry, setCurrency } = setup ?? own;

  return (
    <div className="flex flex-col pt-5 lg:gap-[22px] lg:pt-0">
      <div className="grid grid-cols-2 gap-2.5 lg:gap-3">
        <Select
          id="country"
          name="country"
          label="Pays"
          value={country}
          onChange={(event) => setCountry(event.target.value)}
        >
          {COUNTRY_NAMES.map(([code, name]) => (
            <option key={code} value={code}>
              {name}
            </option>
          ))}
        </Select>
        <Select
          id="currency"
          name="currency"
          label="Devise"
          value={currency}
          onChange={(event) => {
            if (isCurrency(event.target.value)) setCurrency(event.target.value);
          }}
        >
          {CURRENCIES.map((code) => (
            <option key={code} value={code}>
              {wide ? currencyLabel(code) : code}
            </option>
          ))}
        </Select>
      </div>
    </div>
  );
}
