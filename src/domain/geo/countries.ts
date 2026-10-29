import { DEFAULT_CURRENCY, isCurrency, type Currency } from "@/domain/billing/money";

import { COUNTRY_NAMES } from "./country-names";

// Pays (D-69) : codes ISO 3166-1 alpha-2, noms français figés dans country-names.ts (les mêmes au
// serveur et au navigateur). Ils seront traduits avec l'app.
export const COUNTRY_CODES: readonly string[] = COUNTRY_NAMES.map(([code]) => code);
export const DEFAULT_COUNTRY = "BE";

const NAMES = new Map(COUNTRY_NAMES);

export const isCountryCode = (value: unknown): value is string =>
  typeof value === "string" && NAMES.has(value);

export function countryName(code: string): string {
  return NAMES.get(code) ?? code;
}

// Liste triée pour un menu déroulant.
export type CountryOption = { code: string; name: string };
export function countryOptions(): CountryOption[] {
  return COUNTRY_NAMES.map(([code, name]) => ({ code, name }));
}

// Devise proposée d'office pour un pays (le coach peut en choisir une autre). Zone euro et pays dont
// la devise est dans la liste de Coory ; sinon l'euro.
const EURO_ZONE =
  "AD AT BE CY DE EE ES FI FR GR HR IE IT LT LU LV MC ME MT NL PT SI SK SM VA XK GF GP MQ RE YT BL MF PM";
const CURRENCY_OF: Record<string, string> = {
  CH: "CHF",
  LI: "CHF",
  GB: "GBP",
  JE: "GBP",
  GG: "GBP",
  IM: "GBP",
  US: "USD",
  PR: "USD",
  CA: "CAD",
  AU: "AUD",
  NZ: "NZD",
  SE: "SEK",
  NO: "NOK",
  DK: "DKK",
  PL: "PLN",
  CZ: "CZK",
  RO: "RON",
  MA: "MAD",
  AE: "AED",
  SG: "SGD",
  HK: "HKD",
  ZA: "ZAR",
  BR: "BRL",
  MX: "MXN",
};
export function defaultCurrencyFor(country: string): Currency {
  if (EURO_ZONE.split(" ").includes(country)) return "EUR";
  const currency = CURRENCY_OF[country];
  return isCurrency(currency) ? currency : DEFAULT_CURRENCY;
}

// Pays deviné d'après la langue du navigateur (« fr-BE,fr;q=0.9 » -> BE), sinon la Belgique.
export function countryFromAcceptLanguage(header: string | null): string {
  for (const part of (header ?? "").split(",")) {
    const region = part.split(";")[0].trim().split("-")[1]?.toUpperCase();
    if (region && isCountryCode(region)) return region;
  }
  return DEFAULT_COUNTRY;
}
