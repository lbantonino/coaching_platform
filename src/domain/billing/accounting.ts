import { expenseDates, type ExpenseLike } from "./expenses";
import { addTo, splitVat, type ByCurrency, type Converter } from "./money";
import { PAYMENT_METHODS, type PaymentLike, type PaymentMethod } from "./payments";

// Tableau de comptabilité (D-72, demande d'Antonino du 29/10/2026) : l'argent reçu, période par
// période (semaine, mois ou année) et mode de paiement par mode (espèces, virement, carte, autre),
// avec le total TVA comprise, le HTVA et la TVA. Puis les dépenses et le RÉSULTAT (D-73) : gagné
// moins dépensé, HTVA pour un coach soumis à la TVA, TVA comprise sinon. Règles PURES, testées par
// Vitest ; dates AAAA-MM-JJ.
export const ACCOUNTING_UNITS = ["semaine", "mois", "annee"] as const;
export type AccountingUnit = (typeof ACCOUNTING_UNITS)[number];

export type AccountingPayment = PaymentLike & { method: PaymentMethod };

export type AccountingRow = {
  key: string;
  from: string;
  to: string;
  count: number;
  byMethod: Record<PaymentMethod, number>;
  inclCents: number;
  exclCents: number;
  vatCents: number;
  // Montants par devise avant conversion (D-70) : « ≈ » si la période en mélange deux.
  byCurrency: ByCurrency;
  // Dépenses (D-73) : payé TVA comprise, HTVA, TVA récupérable ; et le résultat.
  spentInclCents: number;
  spentExclCents: number;
  spentVatCents: number;
  resultCents: number;
};

// Base du résultat : HTVA pour un coach soumis à la TVA (la TVA n'est pas à lui), TVA comprise sinon.
export type ResultBasis = "excl" | "incl";

const DAY = 86_400_000;
const toDate = (iso: string) => new Date(`${iso}T00:00:00Z`);
const toIso = (date: Date) => date.toISOString().slice(0, 10);
const addDays = (iso: string, days: number) => toIso(new Date(toDate(iso).getTime() + days * DAY));

// Début et fin de la période qui contient `date` (semaine du lundi au dimanche).
export function periodOf(
  date: string,
  unit: AccountingUnit,
): { key: string; from: string; to: string } {
  if (unit === "annee") {
    const year = date.slice(0, 4);
    return { key: year, from: `${year}-01-01`, to: `${year}-12-31` };
  }
  if (unit === "mois") {
    const [year, month] = date.slice(0, 7).split("-").map(Number);
    const last = new Date(Date.UTC(year, month, 0)).getUTCDate();
    const key = date.slice(0, 7);
    return { key, from: `${key}-01`, to: `${key}-${String(last).padStart(2, "0")}` };
  }
  const monday = addDays(date, -((toDate(date).getUTCDay() + 6) % 7));
  return { key: monday, from: monday, to: addDays(monday, 6) };
}

// Période précédente (la veille de son début).
const previous = (period: { from: string }, unit: AccountingUnit) =>
  periodOf(addDays(period.from, -1), unit);

// Les périodes du tableau, de la plus récente à la plus ancienne : 12 semaines, 12 mois, ou les
// années depuis le premier paiement (6 au plus).
export function accountingPeriods(
  unit: AccountingUnit,
  today: string,
  firstPayment: string | null,
): { key: string; from: string; to: string }[] {
  const periods = [periodOf(today, unit)];
  const max =
    unit === "annee"
      ? Math.min(6, Number(today.slice(0, 4)) - Number((firstPayment ?? today).slice(0, 4)) + 1)
      : 12;
  while (periods.length < max) periods.push(previous(periods[periods.length - 1], unit));
  return periods;
}

const emptyMethods = (): Record<PaymentMethod, number> =>
  Object.fromEntries(PAYMENT_METHODS.map((method) => [method, 0])) as Record<PaymentMethod, number>;

// Une ligne par période ; `convert` ramène les montants d'une autre devise dans celle de
// l'organisation (après un changement de devise, D-70).
export function accountingRows(
  payments: AccountingPayment[],
  unit: AccountingUnit,
  today: string,
  convert?: Converter,
  expenses: ExpenseLike[] = [],
  basis: ResultBasis = "incl",
): AccountingRow[] {
  const first = [
    ...payments.map((payment) => payment.receivedOn),
    ...expenses.map((expense) => expense.spentOn),
  ].reduce<string | null>((oldest, day) => (oldest === null || day < oldest ? day : oldest), null);
  const rows = accountingPeriods(unit, today, first).map((period): AccountingRow => ({
    ...period,
    count: 0,
    byMethod: emptyMethods(),
    inclCents: 0,
    exclCents: 0,
    vatCents: 0,
    byCurrency: {},
    spentInclCents: 0,
    spentExclCents: 0,
    spentVatCents: 0,
    resultCents: 0,
  }));
  const byKey = new Map(rows.map((row) => [row.key, row]));
  for (const payment of payments) {
    const row = byKey.get(periodOf(payment.receivedOn, unit).key);
    if (!row) continue;
    const { currency } = payment;
    const change = (cents: number) => (convert && currency ? convert(cents, currency) : cents);
    const incl = change(payment.amountCents);
    const excl = change(splitVat(payment.amountCents, payment.vatRate).exclCents);
    row.count += 1;
    row.byMethod[payment.method] += incl;
    row.inclCents += incl;
    row.exclCents += excl;
    row.vatCents += incl - excl;
    if (currency) addTo(row.byCurrency, currency, payment.amountCents);
  }
  // Dépenses : chaque date où elle compte (une dépense mensuelle compte chaque mois).
  const oldest = rows[rows.length - 1]?.from ?? today;
  const newest = rows[0]?.to ?? today;
  for (const expense of expenses) {
    const { currency } = expense;
    const change = (cents: number) => (convert && currency ? convert(cents, currency) : cents);
    const incl = change(expense.amountCents);
    const excl = change(splitVat(expense.amountCents, expense.vatRate).exclCents);
    for (const date of expenseDates(expense, oldest, newest)) {
      const row = byKey.get(periodOf(date, unit).key);
      if (!row) continue;
      row.spentInclCents += incl;
      row.spentExclCents += excl;
      row.spentVatCents += incl - excl;
    }
  }
  for (const row of rows) {
    row.resultCents =
      basis === "excl" ? row.exclCents - row.spentExclCents : row.inclCents - row.spentInclCents;
  }
  return rows;
}

// Ligne « Total » du tableau.
export function totalRow(rows: AccountingRow[]): Omit<AccountingRow, "key" | "from" | "to"> {
  const total = {
    count: 0,
    byMethod: emptyMethods(),
    inclCents: 0,
    exclCents: 0,
    vatCents: 0,
    byCurrency: {} as ByCurrency,
    spentInclCents: 0,
    spentExclCents: 0,
    spentVatCents: 0,
    resultCents: 0,
  };
  for (const row of rows) {
    total.count += row.count;
    total.spentInclCents += row.spentInclCents;
    total.spentExclCents += row.spentExclCents;
    total.spentVatCents += row.spentVatCents;
    total.resultCents += row.resultCents;
    total.inclCents += row.inclCents;
    total.exclCents += row.exclCents;
    total.vatCents += row.vatCents;
    for (const method of PAYMENT_METHODS) total.byMethod[method] += row.byMethod[method];
    for (const [currency, cents] of Object.entries(row.byCurrency)) {
      addTo(total.byCurrency, currency as keyof ByCurrency, cents ?? 0);
    }
  }
  return total;
}

// Nom d'une période : « Semaine du 26 oct. », « Octobre 2026 », « 2026 » ; version courte pour la
// colonne d'un téléphone (« 26 oct. », « oct. 2026 »).
const monthLong = new Intl.DateTimeFormat("fr-BE", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});
const monthShort = new Intl.DateTimeFormat("fr-BE", {
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});
const dayMonth = new Intl.DateTimeFormat("fr-BE", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});

export function periodLabel(key: string, unit: AccountingUnit, short = false): string {
  if (unit === "annee") return key;
  if (unit === "mois") {
    const text = (short ? monthShort : monthLong).format(toDate(`${key}-01`));
    return `${text.charAt(0).toUpperCase()}${text.slice(1)}`;
  }
  const day = dayMonth.format(toDate(key));
  return short ? day : `Semaine du ${day}`;
}

// Part de chaque mode dans un total (pour le graphique), en pourcentage arrondi.
export function shareOf(cents: number, total: number): number {
  return total === 0 ? 0 : Math.round((cents / total) * 100);
}
