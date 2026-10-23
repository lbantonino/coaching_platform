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

// Taux belges possibles ; 21 % par défaut pour le coaching personnel (à confirmer, OPEN-17).
export const VAT_RATES = [21, 12, 6, 0] as const;
export type VatRate = (typeof VAT_RATES)[number];

// Argent qui arrive sur le compte bancaire (virement, Bancontact) ou non (espèces, autre).
export const isBankMethod = (method: PaymentMethod) =>
  method === "transfer" || method === "bancontact";

export type PaymentLike = { receivedOn: string; amountCents: number; vatRate: number };

// 3 000,00 € TVAC à 21 % -> 2 479,34 € HTVA + 520,66 € de TVA (arrondi au centime, total exact).
export function splitVat(
  amountCents: number,
  vatRate: number,
): { exclCents: number; vatCents: number } {
  const exclCents = Math.round((amountCents * 100) / (100 + vatRate));
  return { exclCents, vatCents: amountCents - exclCents };
}

export type PaymentTotals = {
  count: number;
  inclCents: number;
  exclCents: number;
  vatCents: number;
};

// Totaux des paiements reçus entre `from` et `to` inclus (dates AAAA-MM-JJ).
export function paymentTotals(payments: PaymentLike[], from: string, to: string): PaymentTotals {
  const totals: PaymentTotals = { count: 0, inclCents: 0, exclCents: 0, vatCents: 0 };
  for (const payment of payments) {
    if (payment.receivedOn < from || payment.receivedOn > to) continue;
    const { exclCents, vatCents } = splitVat(payment.amountCents, payment.vatRate);
    totals.count += 1;
    totals.inclCents += payment.amountCents;
    totals.exclCents += exclCents;
    totals.vatCents += vatCents;
  }
  return totals;
}

// Montant saisi (« 3000 », « 3 000,50 », « 3000.5 ») -> centimes, ou null s'il n'est pas valide.
export function parseEuros(text: string): number | null {
  const cleaned = text.replace(/[\s €]/g, "").replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null;
  const cents = Math.round(Number(cleaned) * 100);
  return cents >= 1 && cents <= 100_000_000 ? cents : null;
}
