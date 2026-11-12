import { z } from "zod";

import { parseAmount, parseVatRate, type Currency } from "./money";

// Dépenses du coach (D-73) : règles PURES, testées par Vitest ; dates AAAA-MM-JJ. Une dépense peut se
// répéter chaque mois (loyer, abonnement) : elle compte alors le même jour de chaque mois (ramené au
// dernier jour d'un mois plus court : un 31 compte le 28 ou le 29 février), jusqu'à sa date de fin.
export type ExpenseLike = {
  spentOn: string;
  amountCents: number;
  vatRate: number;
  currency?: Currency;
  repeatsMonthly: boolean;
  endsOn: string | null;
};

const lastDay = (year: number, month: number) => new Date(Date.UTC(year, month, 0)).getUTCDate();
const pad = (value: number) => String(value).padStart(2, "0");

// Les dates où la dépense compte entre `from` et `to` inclus.
export function expenseDates(expense: ExpenseLike, from: string, to: string): string[] {
  if (!expense.repeatsMonthly) {
    return expense.spentOn >= from && expense.spentOn <= to ? [expense.spentOn] : [];
  }
  const end = expense.endsOn && expense.endsOn < to ? expense.endsOn : to;
  const day = Number(expense.spentOn.slice(8, 10));
  let year = Number(expense.spentOn.slice(0, 4));
  let month = Number(expense.spentOn.slice(5, 7));
  const dates: string[] = [];
  for (;;) {
    const date = `${year}-${pad(month)}-${pad(Math.min(day, lastDay(year, month)))}`;
    if (date > end) break;
    if (date >= from) dates.push(date);
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }
  return dates;
}

// Formulaire « Nouvelle dépense ».
export type ExpenseFormValues = {
  label: string;
  categoryId: string;
  amount: string;
  vatRate: string;
  spentOn: string;
  repeatsMonthly: boolean;
  endsOn: string;
};

export type ExpenseInput = {
  label: string;
  categoryId: string | null;
  amountCents: number;
  vatRate: number;
  spentOn: string;
  repeatsMonthly: boolean;
  endsOn: string | null;
};

const schema = z.object({
  label: z
    .string()
    .trim()
    .min(1, { error: "Décris la dépense (ex. : loyer de la salle)." })
    .max(120, { error: "Description trop longue (120 caractères maximum)." }),
  categoryId: z.union([z.literal(""), z.uuid({ error: "Catégorie invalide." })]),
  spentOn: z.iso
    .date({ error: "Indique la date de la dépense." })
    .refine((day) => day >= "2000-01-01", { error: "Indique la date de la dépense." }),
  endsOn: z.union([z.literal(""), z.iso.date({ error: "Date de fin invalide." })]),
});

// Le taux vient de la fenêtre (D-163) : 0 quand « Appliquer la TVA » est décochée.
export function parseExpenseForm(
  values: ExpenseFormValues,
): { ok: true; expense: ExpenseInput } | { ok: false; error: string } {
  const result = schema.safeParse(values);
  if (!result.success) return { ok: false, error: result.error.issues[0].message };
  const amountCents = parseAmount(values.amount);
  if (amountCents === null) {
    return { ok: false, error: "Montant invalide : écris par exemple 650 ou 49,90." };
  }
  const vatRate = parseVatRate(values.vatRate || "0");
  if (vatRate === null) {
    return { ok: false, error: "Taux de TVA invalide : un nombre entre 0 et 100 (ex. 21)." };
  }
  const endsOn = values.repeatsMonthly && result.data.endsOn !== "" ? result.data.endsOn : null;
  if (endsOn !== null && endsOn < result.data.spentOn) {
    return { ok: false, error: "La date de fin ne peut pas précéder la première dépense." };
  }
  return {
    ok: true,
    expense: {
      label: result.data.label,
      categoryId: result.data.categoryId === "" ? null : result.data.categoryId,
      amountCents,
      vatRate,
      spentOn: result.data.spentOn,
      repeatsMonthly: values.repeatsMonthly,
      endsOn,
    },
  };
}
