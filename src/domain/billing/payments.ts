import { addTo, splitVat, type ByCurrency, type Converter, type Currency } from "./money";

// Paiements reçus (D-36) : le chiffre d'affaires suivi est l'argent RÉELLEMENT reçu, à la date du
// paiement. Montants en centimes, TVA comprise ; HTVA et TVA se déduisent du taux. Règles PURES.
export const PAYMENT_METHODS = ["cash", "transfer", "bancontact", "other"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const paymentMethodLabels: Record<PaymentMethod, string> = {
  cash: "Espèces",
  transfer: "Virement",
  bancontact: "Bancontact",
  other: "Autre",
};

// Bancontact n'existe qu'en Belgique (D-69) : ailleurs, le même moyen s'appelle « Carte bancaire ».
export function paymentMethodLabel(method: PaymentMethod, country: string): string {
  if (method === "bancontact" && country !== "BE") return "Carte bancaire";
  return paymentMethodLabels[method];
}

// Argent qui arrive sur le compte bancaire (virement, Bancontact / carte) ou non (espèces, autre).
export const isBankMethod = (method: PaymentMethod) =>
  method === "transfer" || method === "bancontact";

export type PaymentLike = {
  receivedOn: string;
  amountCents: number;
  vatRate: number;
  // Devise du paiement (D-69) ; sans devise, celle de l'organisation.
  currency?: Currency;
};

// Calculs de TVA et saisie des montants : règles communes dans money.ts (taux libre, D-69).
export { addVat, parseAmount, splitVat } from "./money";

export type PaymentTotals = {
  count: number;
  inclCents: number;
  exclCents: number;
  vatCents: number;
  // Montants TVAC reçus par devise, avant conversion (D-70).
  byCurrency: ByCurrency;
};

// Totaux des paiements reçus entre `from` et `to` inclus (dates AAAA-MM-JJ). Après un changement de
// devise (D-70), `convert` ramène chaque montant dans la devise de l'organisation (à titre indicatif).
export function paymentTotals(
  payments: PaymentLike[],
  from: string,
  to: string,
  convert?: Converter,
): PaymentTotals {
  const totals: PaymentTotals = {
    count: 0,
    inclCents: 0,
    exclCents: 0,
    vatCents: 0,
    byCurrency: {},
  };
  for (const payment of payments) {
    if (payment.receivedOn < from || payment.receivedOn > to) continue;
    const { exclCents } = splitVat(payment.amountCents, payment.vatRate);
    const currency = payment.currency;
    const incl = convert && currency ? convert(payment.amountCents, currency) : payment.amountCents;
    const excl = convert && currency ? convert(exclCents, currency) : exclCents;
    totals.count += 1;
    totals.inclCents += incl;
    totals.exclCents += excl;
    totals.vatCents += incl - excl;
    if (currency) addTo(totals.byCurrency, currency, payment.amountCents);
  }
  return totals;
}

// Forfait (D-52) : un paiement qui couvre une période pour un sportif (ex. 3 mois payés d'avance).
// Une date de séance de ce sportif dans la période est « comprise dans le forfait » : elle ne se paie
// pas une deuxième fois, et ne compte pas dans ce que les séances « pourraient rapporter ».
export type PackageCoverLike = { athleteId: string; coversFrom: string; coversTo: string };

export function coveredByPackage(
  covers: PackageCoverLike[],
  athleteId: string | null | undefined,
  date: string,
): boolean {
  if (!athleteId) return false;
  return covers.some(
    (cover) => cover.athleteId === athleteId && date >= cover.coversFrom && date <= cover.coversTo,
  );
}

// À encaisser (D-90) : les douze dernières semaines, comme la carte Prix d'une séance. Au-delà, une
// date oubliée ne compte plus : la liste reste courte et utile. (Règle pure, partagée avec l'assistant.)
export const COLLECT_WEEKS = 12;
