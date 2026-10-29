// Suivi des factures des sportifs (D-17 étape A) : statut et chiffres du mois, calculés à partir des
// vraies factures, jamais stockés. Montants en centimes (entiers), dates AAAA-MM-JJ.
export type InvoiceStatus = "paid" | "overdue" | "pending";

export type InvoiceLike = {
  amountCents: number;
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

export type Tally = { count: number; cents: number };

export type MonthActivity = {
  // Factures envoyées ce mois-ci (date d'envoi dans le mois en cours).
  sent: Tally;
  // Paiements reçus ce mois-ci (date de paiement dans le mois en cours).
  received: Tally;
  // Toutes les factures pas encore payées, quel que soit leur mois ; `overdue` : celles en retard.
  pending: Tally & { overdue: number };
};

export function monthActivity(invoices: InvoiceLike[], today: string): MonthActivity {
  const month = today.slice(0, 7);
  const add = (tally: Tally, cents: number) => {
    tally.count += 1;
    tally.cents += cents;
  };
  const activity: MonthActivity = {
    sent: { count: 0, cents: 0 },
    received: { count: 0, cents: 0 },
    pending: { count: 0, cents: 0, overdue: 0 },
  };
  for (const invoice of invoices) {
    if (invoice.issuedOn.startsWith(month)) add(activity.sent, invoice.amountCents);
    if (invoice.paidOn?.startsWith(month)) add(activity.received, invoice.amountCents);
    const status = invoiceStatus(invoice, today);
    if (status !== "paid") {
      add(activity.pending, invoice.amountCents);
      if (status === "overdue") activity.pending.overdue += 1;
    }
  }
  return activity;
}
