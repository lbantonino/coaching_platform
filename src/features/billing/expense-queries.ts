import "server-only";

import { expenseFromFilter } from "@/domain/billing/expenses";
import { currencyOf, type Currency } from "@/domain/billing/money";
import {
  isCategoryColor,
  type CategoryColor,
  type DocumentCategory,
} from "@/domain/documents/documents";
import { createClient } from "@/lib/supabase/server";

// Dépenses d'une organisation DÉJÀ vérifiée (D-73), la plus récente d'abord ; la RLS limite de toute
// façon la lecture à SON organisation.
export type CoachExpense = {
  id: string;
  label: string;
  categoryId: string | null;
  categoryName: string | null;
  categoryColor: CategoryColor | null;
  spentOn: string;
  amountCents: number;
  vatRate: number;
  currency: Currency;
  repeatsMonthly: boolean;
  endsOn: string | null;
};

type Row = {
  id: string;
  label: string;
  spent_on: string;
  amount_cents: number;
  vat_rate: number;
  currency: string;
  repeats_monthly: boolean;
  ends_on: string | null;
  category: { id: string; name: string; color: string } | null;
};

const colorOf = (value: string): CategoryColor => (isCategoryColor(value) ? value : "grey");

export async function listExpenses(organizationId: string): Promise<CoachExpense[]> {
  return (await readExpenses(organizationId, {}, false)).expenses;
}

// Lecture de l'assistant : période filtrée par la base AVANT la limite de 500 (mineur n°7 du lot 4 ;
// le début aussi, revue du 20/11, n°8), et le nombre total de dépenses de la période.
export async function listExpensesWithTotal(
  organizationId: string,
  filters: { from?: string; to?: string },
): Promise<{ expenses: CoachExpense[]; total: number }> {
  return readExpenses(organizationId, filters, true);
}

async function readExpenses(
  organizationId: string,
  filters: { from?: string; to?: string },
  withCount: boolean,
): Promise<{ expenses: CoachExpense[]; total: number }> {
  const supabase = await createClient();
  let query = supabase
    .from("coach_expenses")
    .select(
      "id, label, spent_on, amount_cents, vat_rate, currency, repeats_monthly, ends_on, category:expense_categories ( id, name, color )",
      withCount ? { count: "exact" } : undefined,
    )
    .eq("organization_id", organizationId)
    .order("spent_on", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(500);
  if (filters.to) query = query.lte("spent_on", filters.to);
  if (filters.from) query = query.or(expenseFromFilter(filters.from));
  const { data, error, count } = await query;
  if (error) throw new Error("Lecture des dépenses impossible.");
  const expenses = ((data ?? []) as unknown as Row[]).map((row) => ({
    id: row.id,
    label: row.label,
    categoryId: row.category?.id ?? null,
    categoryName: row.category?.name ?? null,
    categoryColor: row.category ? colorOf(row.category.color) : null,
    spentOn: row.spent_on,
    amountCents: row.amount_cents,
    vatRate: row.vat_rate,
    currency: currencyOf(row.currency),
    repeatsMonthly: row.repeats_monthly,
    endsOn: row.ends_on,
  }));
  return { expenses, total: count ?? expenses.length };
}

// Catégories de dépenses (même forme que celles des Documents : nom et couleur).
export async function listExpenseCategories(organizationId: string): Promise<DocumentCategory[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("expense_categories")
    .select("id, name, color")
    .eq("organization_id", organizationId)
    .order("name");
  if (error) throw new Error("Lecture des catégories de dépenses impossible.");
  return (data ?? [])
    .map((row) => ({ id: row.id, name: row.name, color: colorOf(row.color) }))
    .sort((a, b) => a.name.localeCompare(b.name, "fr"));
}
