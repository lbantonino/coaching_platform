"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";

import { CURRENCIES, currencyLabel, isCurrency, type Currency } from "@/domain/billing/money";
import { COUNTRY_NAMES } from "@/domain/geo/country-names";
import { defaultCurrencyFor } from "@/domain/geo/countries";
import type { BillingSetupInput, VatChoice } from "@/features/auth/signup-schemas";
import { useWideScreen } from "@/lib/use-wide-screen";

// Étape « Pays, devise et TVA » de l'inscription d'un coach (D-69, simplifiée par D-90), au style de
// la maquette d'Antonino du 06/11/2026 (écran 03, D-139) : pays et devise (pré-remplis d'après la
// langue du navigateur), puis une seule question sur la TVA, avec le taux dans l'option choisie.
// Coory ne fait pas de factures : le taux sert au prix des séances et au résultat HTVA. Tout se
// modifie ensuite dans Paramètres › Pays, devise et TVA.
// L'état vit dans useBillingSetup : la page de bienvenue le partage avec son panneau, qui suit le
// pays et la TVA choisis.

export type BillingSetupState = {
  country: string;
  currency: Currency;
  choice: VatChoice;
  rate: string;
  setCountry: (country: string) => void;
  setCurrency: (currency: Currency) => void;
  setChoice: (choice: VatChoice) => void;
  setRate: (rate: string) => void;
};

// Taux proposé quand on coche « Je facture la TVA » (taux normal du pays, comme la maquette).
const standardRates: Record<string, string> = {
  BE: "21",
  FR: "20",
  LU: "17",
  CH: "8,1",
  CA: "5",
  NL: "21",
  DE: "19",
  ES: "21",
  IT: "22",
  PT: "23",
};

export function useBillingSetup(initial: BillingSetupInput): BillingSetupState {
  const [country, setCountryState] = useState(initial.country);
  const [currency, setCurrency] = useState<Currency>(
    isCurrency(initial.currency) ? initial.currency : defaultCurrencyFor(initial.country),
  );
  const [choice, setChoice] = useState<VatChoice>(initial.vatChoice === "vat" ? "vat" : "none");
  const [rate, setRate] = useState(initial.vatRate || standardRates[initial.country] || "");
  return {
    country,
    currency,
    choice,
    rate,
    setCountry: (next) => {
      setCountryState(next);
      setCurrency(defaultCurrencyFor(next));
      setRate(standardRates[next] ?? "");
    },
    setCurrency,
    setChoice,
    setRate,
  };
}

const choices: { value: VatChoice; title: string; text: string; short: string }[] = [
  {
    value: "none",
    title: "Pas de TVA",
    text: "Franchise, association, ou tu verras plus tard.",
    short: "Franchise ou plus tard.",
  },
  {
    value: "vat",
    title: "Je facture la TVA",
    text: "Tes gains s'affichent hors TVA.",
    short: "Gains affichés hors TVA.",
  },
];

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
        <select id={id} {...props} className={selectClass}>
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
  const { country, currency, choice, rate, setCountry, setCurrency, setChoice, setRate } =
    setup ?? own;

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

      <fieldset className="flex flex-col gap-2">
        <legend className="pt-4 pb-2 text-[13px] leading-[normal] font-semibold text-text lg:pt-0">
          TVA
        </legend>
        {choices.map((item) => {
          const on = choice === item.value;
          return (
            <div key={item.value} className="relative flex">
              <label
                className={`flex flex-1 cursor-pointer items-center gap-3 rounded-[13px] px-3.5 py-[13px] transition-colors duration-150 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-violet ${
                  on
                    ? "bg-violet-soft inset-ring-[1.5px] inset-ring-violet"
                    : "bg-dlg inset-ring inset-ring-line-2"
                }`}
              >
                <input
                  type="radio"
                  name="vatChoice"
                  value={item.value}
                  checked={on}
                  onChange={() => setChoice(item.value)}
                  aria-describedby={`vat-${item.value}-text`}
                  className="sr-only"
                />
                <span
                  aria-hidden
                  className={`size-5 shrink-0 rounded-full lg:size-[18px] ${
                    on
                      ? "inset-ring-[5.5px] inset-ring-violet"
                      : "inset-ring-[1.5px] inset-ring-dlg-check-line"
                  }`}
                />
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="text-[14.5px] leading-[normal] font-bold text-text lg:text-[14px]">
                    {item.title}
                  </span>
                  <span
                    id={`vat-${item.value}-text`}
                    className="text-[12.5px] leading-[normal] text-muted"
                  >
                    <span className="lg:hidden">{item.short}</span>
                    <span className="max-lg:hidden">{item.text}</span>
                  </span>
                </span>
              </label>
              {on && item.value === "vat" ? (
                <span className="absolute top-1/2 right-3 flex w-[84px] -translate-y-1/2 lg:right-3.5 lg:w-[88px]">
                  <input
                    id="vatRate"
                    name="vatRate"
                    inputMode="decimal"
                    autoComplete="off"
                    aria-label="Taux de TVA"
                    value={rate}
                    onChange={(event) => setRate(event.target.value)}
                    className="h-10 w-full rounded-[10px] bg-dlg pr-7 pl-3 text-[16px] font-semibold text-text inset-ring inset-ring-line-2 outline-none focus:inset-ring-[1.5px] focus:inset-ring-violet lg:h-9 lg:rounded-[9px] lg:text-[14px]"
                  />
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-[15px] font-semibold text-muted lg:text-[14px]"
                  >
                    %
                  </span>
                </span>
              ) : null}
            </div>
          );
        })}
      </fieldset>
    </div>
  );
}
