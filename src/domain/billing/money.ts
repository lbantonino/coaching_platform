import { z } from "zod";

// Argent dans Coory à l'international (D-69) : chaque montant est en CENTIMES et porte sa devise.
// Règles PURES, testées par Vitest. L'interface reste en français (traduction : dernière étape avant
// la mise en ligne), d'où le format « fr-BE » : 1 234,50 €, 1 234,50 CHF.

// Devises proposées, toutes à 2 décimales (Coory compte en centimes) ; la même liste que la base
// (private.is_supported_currency). Le yen ou le dinar tunisien (0 ou 3 décimales) n'y sont pas.
export const CURRENCIES = [
  "EUR",
  "CHF",
  "GBP",
  "USD",
  "CAD",
  "AUD",
  "NZD",
  "SEK",
  "NOK",
  "DKK",
  "PLN",
  "CZK",
  "RON",
  "MAD",
  "AED",
  "SGD",
  "HKD",
  "ZAR",
  "BRL",
  "MXN",
] as const;
export type Currency = (typeof CURRENCIES)[number];
export const DEFAULT_CURRENCY: Currency = "EUR";

export const isCurrency = (value: unknown): value is Currency =>
  (CURRENCIES as readonly unknown[]).includes(value);

// Une valeur lue en base (texte) : la devise, ou l'euro si elle était inconnue.
export const currencyOf = (value: unknown): Currency => (isCurrency(value) ? value : "EUR");

const formatters = new Map<string, Intl.NumberFormat>();

// « 450,00 € », « 450,00 CHF » (espace insécable, comme en Belgique).
export function formatMoney(cents: number, currency: Currency): string {
  let formatter = formatters.get(currency);
  if (!formatter) {
    formatter = new Intl.NumberFormat("fr-BE", { style: "currency", currency });
    formatters.set(currency, formatter);
  }
  return formatter.format(cents / 100);
}

// Symbole court d'une devise (« € », « CHF », « $ US »), pour les champs de saisie.
export function currencySymbol(currency: Currency): string {
  return (
    new Intl.NumberFormat("fr-BE", { style: "currency", currency })
      .formatToParts(0)
      .find((part) => part.type === "currency")?.value ?? currency
  );
}

// Noms en français, figés (les mêmes au serveur et au navigateur), pour les listes de choix.
const CURRENCY_NAMES: Record<Currency, string> = {
  EUR: "Euro",
  CHF: "Franc suisse",
  GBP: "Livre sterling",
  USD: "Dollar des États-Unis",
  CAD: "Dollar canadien",
  AUD: "Dollar australien",
  NZD: "Dollar néo-zélandais",
  SEK: "Couronne suédoise",
  NOK: "Couronne norvégienne",
  DKK: "Couronne danoise",
  PLN: "Zloty polonais",
  CZK: "Couronne tchèque",
  RON: "Leu roumain",
  MAD: "Dirham marocain",
  AED: "Dirham des Émirats arabes unis",
  SGD: "Dollar de Singapour",
  HKD: "Dollar de Hong Kong",
  ZAR: "Rand sud-africain",
  BRL: "Réal brésilien",
  MXN: "Peso mexicain",
};

// « Euro (EUR) », « Franc suisse (CHF) ».
export function currencyLabel(currency: Currency): string {
  return `${CURRENCY_NAMES[currency]} (${currency})`;
}

// Montant saisi (« 3000 », « 3 000,50 », « 3000.5 », « 65 € », « CHF 65 ») -> centimes, ou null.
export function parseAmount(text: string): number | null {
  const cleaned = text
    .replace(/[\s  ]/g, "")
    .replace(/[^\d.,]/g, "")
    .replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null;
  const cents = Math.round(Number(cleaned) * 100);
  return cents >= 1 && cents <= 100_000_000 ? cents : null;
}

// --- TVA ------------------------------------------------------------------------------------------
// Taux LIBRE (D-69) : Coory ne tient aucune liste de taux par pays (D-66). Le coach saisit le sien :
// 21, 20, 8,1, 5,5… entre 0 et 100 %, 2 décimales au plus.
export const VAT_RATE_MAX = 100;

export function parseVatRate(text: string): number | null {
  const cleaned = text.replace(/[\s%]/g, "").replace(",", ".");
  if (!/^\d{1,3}(\.\d{1,2})?$/.test(cleaned)) return null;
  const rate = Number(cleaned);
  return rate >= 0 && rate <= VAT_RATE_MAX ? rate : null;
}

// Champ « taux de TVA » d'un formulaire, validé côté serveur (paiements, dépenses, Paramètres).
export const vatRateField = z.coerce.string().transform((text, context) => {
  const rate = parseVatRate(text);
  if (rate === null) {
    context.addIssue({
      code: "custom",
      message: "Taux de TVA invalide : un nombre entre 0 et 100 (ex. 21 ou 8,1).",
    });
    return z.NEVER;
  }
  return rate;
});

// « 21 % », « 8,1 % », « 5,5 % ».
export function formatVatRate(rate: number): string {
  return `${rate.toLocaleString("fr-BE", { maximumFractionDigits: 2 })} %`;
}

// Taux en centièmes de point (8,1 % -> 810) : les calculs restent en nombres entiers, sans les
// erreurs d'arrondi des décimales (1,1 + 0,2 ≠ 1,3 en JavaScript).
const basisPoints = (rate: number) => Math.round(rate * 100);

// 3 000,00 TVAC à 21 % -> 2 479,34 HTVA + 520,66 de TVA (arrondi au centime, total exact).
export function splitVat(
  amountCents: number,
  vatRate: number,
): { exclCents: number; vatCents: number } {
  const exclCents = Math.round((amountCents * 10_000) / (10_000 + basisPoints(vatRate)));
  return { exclCents, vatCents: amountCents - exclCents };
}

// 65,00 HTVA à 21 % -> 78,65 TVAC (arrondi au centime).
export function addVat(exclCents: number, vatRate: number): number {
  return Math.round((exclCents * (10_000 + basisPoints(vatRate))) / 10_000);
}

// --- Changement de devise (D-70) ------------------------------------------------------------------
// Le coach qui déménage saisit le taux : « 1 EUR = 0,94 CHF ». Le passé reste dans sa devise ; les
// totaux qui mélangent deux devises sont convertis « à titre indicatif » avec ces taux.
export type CurrencyChange = { from: Currency; to: Currency; rate: number };

// « 0,94 », « 1.0825 » -> 0.94, 1.0825 ; null si vide, nul ou plus de 6 décimales.
export function parseExchangeRate(text: string): number | null {
  const cleaned = text.replace(/[\s  ]/g, "").replace(",", ".");
  if (!/^\d{1,7}(\.\d{1,6})?$/.test(cleaned)) return null;
  const rate = Number(cleaned);
  return rate > 0 && rate <= 1_000_000 ? rate : null;
}

// Convertisseur vers `target` : taux direct, inverse, ou en chaîne (EUR -> CHF -> GBP). Un montant
// déjà dans `target` reste tel quel ; une devise sans lien connu aussi (cas impossible en pratique :
// chaque montant est dans une devise que l'organisation a eue).
export function makeConverter(target: Currency, changes: CurrencyChange[]) {
  const edges = new Map<Currency, { to: Currency; rate: number }[]>();
  const link = (from: Currency, to: Currency, rate: number) =>
    edges.set(from, [...(edges.get(from) ?? []), { to, rate }]);
  for (const change of changes) {
    link(change.from, change.to, change.rate);
    link(change.to, change.from, 1 / change.rate);
  }
  const factorOf = (from: Currency): number | null => {
    const seen = new Set<Currency>([from]);
    const queue: { currency: Currency; factor: number }[] = [{ currency: from, factor: 1 }];
    while (queue.length > 0) {
      const { currency, factor } = queue.shift()!;
      if (currency === target) return factor;
      for (const edge of edges.get(currency) ?? []) {
        if (seen.has(edge.to)) continue;
        seen.add(edge.to);
        queue.push({ currency: edge.to, factor: factor * edge.rate });
      }
    }
    return null;
  };
  return (cents: number, currency: Currency): number => {
    if (currency === target) return cents;
    const factor = factorOf(currency);
    return factor === null ? cents : Math.round(cents * factor);
  };
}
export type Converter = ReturnType<typeof makeConverter>;

// Somme par devise, pour le détail sous un total converti.
export type ByCurrency = Partial<Record<Currency, number>>;
export const addTo = (byCurrency: ByCurrency, currency: Currency, cents: number) => {
  byCurrency[currency] = (byCurrency[currency] ?? 0) + cents;
};

// Un total : exact s'il n'a qu'une devise (celle de l'organisation), sinon « ≈ » avec son détail
// (« 1 200,00 € + 340,00 CHF »).
export function describeTotal(
  cents: number,
  byCurrency: ByCurrency,
  target: Currency,
): { value: string; approximate: boolean; detail: string | null } {
  const parts = Object.entries(byCurrency).filter(([, amount]) => amount !== 0) as [
    Currency,
    number,
  ][];
  const approximate = parts.some(([currency]) => currency !== target);
  return {
    value: `${approximate ? "≈ " : ""}${formatMoney(cents, target)}`,
    approximate,
    detail: approximate
      ? parts.map(([currency, amount]) => formatMoney(amount, currency)).join(" + ")
      : null,
  };
}
