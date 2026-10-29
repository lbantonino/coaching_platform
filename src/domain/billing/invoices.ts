// Suivi des factures des sportifs (D-17 étape A) : statut et chiffres du mois, calculés à partir des
// vraies factures, jamais stockés. Montants en centimes (entiers), dates AAAA-MM-JJ.
import { addTo, type ByCurrency, type Converter, type Currency } from "./money";

export type InvoiceStatus = "paid" | "overdue" | "pending";

export type InvoiceLike = {
  amountCents: number;
  // Devise de la facture (D-69) ; sans devise, celle de l'organisation.
  currency?: Currency;
  issuedOn: string;
  dueOn: string;
  paidOn: string | null;
};

export const invoiceStatusLabels: Record<InvoiceStatus, string> = {
  paid: "Payée",
  overdue: "En retard",
  pending: "En attente",
};

// Payée dès qu'un paiement est noté ; sinon en retard le lendemain de l'échéance.
export function invoiceStatus(invoice: InvoiceLike, today: string): InvoiceStatus {
  if (invoice.paidOn !== null) return "paid";
  return invoice.dueOn < today ? "overdue" : "pending";
}

// `byCurrency` : montants par devise avant conversion (D-70), pour le détail d'un total « ≈ ».
export type Tally = { count: number; cents: number; byCurrency: ByCurrency };

export type MonthActivity = {
  // Factures envoyées ce mois-ci (date d'envoi dans le mois en cours).
  sent: Tally;
  // Paiements reçus ce mois-ci (date de paiement dans le mois en cours).
  received: Tally;
  // Toutes les factures pas encore payées, quel que soit leur mois ; `overdue` : celles en retard.
  pending: Tally & { overdue: number };
};

export function monthActivity(
  invoices: InvoiceLike[],
  today: string,
  convert?: Converter,
): MonthActivity {
  const month = today.slice(0, 7);
  const add = (tally: Tally, invoice: InvoiceLike) => {
    const { amountCents: cents, currency } = invoice;
    tally.count += 1;
    tally.cents += convert && currency ? convert(cents, currency) : cents;
    if (currency) addTo(tally.byCurrency, currency, cents);
  };
  const activity: MonthActivity = {
    sent: { count: 0, cents: 0, byCurrency: {} },
    received: { count: 0, cents: 0, byCurrency: {} },
    pending: { count: 0, cents: 0, byCurrency: {}, overdue: 0 },
  };
  for (const invoice of invoices) {
    if (invoice.issuedOn.startsWith(month)) add(activity.sent, invoice);
    if (invoice.paidOn?.startsWith(month)) add(activity.received, invoice);
    const status = invoiceStatus(invoice, today);
    if (status !== "paid") {
      add(activity.pending, invoice);
      if (status === "overdue") activity.pending.overdue += 1;
    }
  }
  return activity;
}
