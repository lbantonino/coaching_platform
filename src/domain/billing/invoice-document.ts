// Factures émises (D-65) : règles PURES du document (totaux, adresses), testées par Vitest. Le numéro
// est attribué par la base à l'émission (issue_athlete_invoice), jamais ici. Coory ne décide d'aucune
// règle légale (D-66) : les mentions imprimées sont celles que le coach écrit dans sa structure.
import { addVat, splitVat } from "./payments";
import type { VatStatus } from "./legal";

export type InvoiceTotals = { exclCents: number; vatCents: number; inclCents: number };

// Le montant d'une facture est celui du paiement reçu, TVA comprise : on en déduit HTVA et TVA.
export function invoiceTotals(inclCents: number, vatRate: number): InvoiceTotals {
  const { exclCents, vatCents } = splitVat(inclCents, vatRate);
  return { exclCents, vatCents, inclCents };
}

// Montant saisi par le coach (demande d'Antonino du 29/10/2026) : hors TVA (« 65 € HTVA », la TVA
// s'ajoute) ou TVA comprise. La facture garde le total TVAC ; le HTVA s'en déduit sans écart (vérifié
// pour 6, 12 et 21 % sur un million de montants).
export type AmountMode = "excl" | "incl";

export function totalsFromEntry(cents: number, mode: AmountMode, vatRate: number): InvoiceTotals {
  return invoiceTotals(mode === "excl" ? addVat(cents, vatRate) : cents, vatRate);
}

// Taux imposé par la structure : une structure qui n'est pas assujettie (franchise, ASBL non
// assujettie) ne facture pas de TVA ; sinon, le taux du paiement.
export function vatRateFor(vatStatus: VatStatus, paymentRate: number): number {
  return vatStatus === "subject" ? paymentRate : 0;
}

export type PostalAddress = {
  addressLine: string | null;
  postalCode: string | null;
  city: string | null;
  country: string | null;
};

// Adresse sur deux lignes au plus : « Rue de l'Exemple 1 », « 1000 Bruxelles » (pays seulement s'il
// n'est pas la Belgique).
export function addressLines(address: PostalAddress): string[] {
  const town = [address.postalCode, address.city].filter(Boolean).join(" ");
  const country = address.country && address.country !== "BE" ? address.country : null;
  return [address.addressLine, town, country].filter((line): line is string => Boolean(line));
}

// Nom du fichier téléchargé : « facture-FAC-2026-0001.pdf », ou « brouillon-facture.pdf ».
export function invoiceFileName(number: string | null): string {
  return number ? `facture-${number}.pdf` : "brouillon-facture.pdf";
}

// Libellé proposé pour une facture faite depuis un paiement : celui du paiement, sinon générique.
export function defaultInvoiceLabel(paymentLabel: string | null): string {
  return paymentLabel?.trim() || "Coaching sportif";
}
